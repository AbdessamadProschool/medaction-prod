import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { withErrorHandler, successResponse } from '@/lib/api-handler';
import { UnauthorizedError, ForbiddenError, NotFoundError } from '@/lib/exceptions';
import { getSafeId } from '@/lib/utils/parse';

async function coordinateurGeresEtablissement(userId: number, etablissementId: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { etablissementsGeres: true },
  });
  return user?.etablissementsGeres.includes(etablissementId) || false;
}

// Schéma de mise à jour partielle
const updateActivitySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  heureDebut: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  heureFin: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  titre: z.string().min(3).max(150).optional(),
  description: z.string().optional(),
  typeActivite: z.string().min(2).optional(),
  responsableNom: z.string().optional(),
  participantsAttendus: z.number().int().positive().optional(),
  lieu: z.string().optional(),
  isVisiblePublic: z.boolean().optional(),
  statut: z.enum(['PLANIFIEE', 'EN_COURS', 'TERMINEE', 'RAPPORT_COMPLETE', 'ANNULEE', 'REPORTEE']).optional(),
  
  // Recurrence updates (simulated or metadata only for edits)
  isRecurrent: z.boolean().optional(),
  recurrencePattern: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'DAILY_NO_WEEKEND']).optional(),
  recurrenceEndDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  recurrenceDays: z.array(z.number().min(0).max(6)).optional(), // 0=Sun, 1=Mon, etc.

  // Report fields
  presenceEffective: z.number().int().min(0).optional(),
  commentaireDeroulement: z.string().optional(),
  difficultes: z.string().optional(),
  pointsPositifs: z.string().optional(),
  recommandations: z.string().optional(),
  rapportComplete: z.boolean().optional(),
});

// GET - Détails d'une activité
export const GET = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const session = await getServerSession(authOptions);
  const { id } = await params;
  const activityId = getSafeId(id);

  const activite = await prisma.programmeActivite.findUnique({
    where: { id: activityId },
    include: {
      etablissement: {
        select: { 
          id: true, 
          nom: true, 
          secteur: true,
          commune: { select: { nom: true } }
        }
      },
      createdByUser: {
        select: { id: true, nom: true, prenom: true }
      },
    }
  });

  if (!activite) {
    throw new NotFoundError('Activité introuvable');
  }

  // Vérifier la visibilité pour les citoyens non authentifiés
  const isAdmin = session?.user?.role && ['ADMIN', 'SUPER_ADMIN', 'GOUVERNEUR'].includes(session.user.role);
  const isCoordinator = session?.user?.role === 'COORDINATEUR_ACTIVITES';
  
  if (!isAdmin && !isCoordinator) {
    if (!activite.isVisiblePublic || !activite.isValideParAdmin) {
      throw new ForbiddenError('Activité non accessible');
    }
    
    // Cacher les infos de rapport pour les visiteurs
    const { 
      presenceEffective, tauxPresence, commentaireDeroulement,
      difficultes, pointsPositifs, photosRapport, noteQualite,
      recommandations, rapportComplete, dateRapport,
      rappelJ1Envoye, alerteRapportEnvoyee, requireValidation,
      ...publicData 
    } = activite;
    
    return successResponse(publicData);
  }

  if (isCoordinator && activite.etablissementId) {
    const canAccess = await coordinateurGeresEtablissement(Number(session?.user?.id), activite.etablissementId);
    if (!canAccess) {
      throw new ForbiddenError('Vous ne gérez pas cet établissement');
    }
  }

  return successResponse(activite);
});

// PATCH - Modifier une activité
export const PATCH = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    throw new UnauthorizedError('Non autorisé');
  }

  const { id } = await params;
  const activityId = getSafeId(id);
  const userId = Number(session.user.id);

  const activite = await prisma.programmeActivite.findUnique({
    where: { id: activityId },
    include: {
      etablissement: { select: { id: true } }
    }
  });

  if (!activite) {
    throw new NotFoundError('Activité introuvable');
  }

  // Vérifier les permissions
  const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(session.user.role);
  const isCoordinator = session.user.role === 'COORDINATEUR_ACTIVITES';

  if (isCoordinator) {
    if (!activite.etablissementId || !(await coordinateurGeresEtablissement(userId, activite.etablissementId))) {
      throw new ForbiddenError('Vous ne gérez pas cet établissement');
    }
  } else if (!isAdmin) {
    throw new ForbiddenError('Non autorisé');
  }

  const body = await request.json();
  const parsed = updateActivitySchema.parse(body);

  const updateData: Prisma.ProgrammeActiviteUpdateInput = { ...parsed };
  
  if (updateData.date) {
    updateData.date = new Date(updateData.date as string);
  }
  
  // Fix: Convert string date to Date object for Prisma
  if (updateData.recurrenceEndDate) {
    updateData.recurrenceEndDate = new Date(updateData.recurrenceEndDate as string);
  } else if (updateData.isRecurrent === false) {
    // If turning off recurrence, clear these fields
    updateData.recurrenceEndDate = null;
    updateData.recurrencePattern = null;
    updateData.recurrenceDays = [];
  }

  const updated = await prisma.programmeActivite.update({
    where: { id: activityId },
    data: updateData,
    include: {
      etablissement: {
        select: { id: true, nom: true, secteur: true }
      }
    }
  });

  return successResponse(updated, 'Activité mise à jour');
});

// DELETE - Supprimer une activité (et ses occurrences récurrentes)
export const DELETE = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    throw new UnauthorizedError('Non autorisé');
  }

  const { id } = await params;
  const activityId = getSafeId(id);
  const userId = Number(session.user.id);
  const deleteRecurrences = new URL(request.url).searchParams.get('deleteRecurrences') === 'true';

  const activite = await prisma.programmeActivite.findUnique({
    where: { id: activityId }
  });

  if (!activite) {
    throw new NotFoundError('Activité introuvable');
  }

  // Vérifier les permissions
  const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(session.user.role);
  const isCoordinator = session.user.role === 'COORDINATEUR_ACTIVITES';

  if (isCoordinator) {
    if (!activite.etablissementId || !(await coordinateurGeresEtablissement(userId, activite.etablissementId))) {
      throw new ForbiddenError('Vous ne gérez pas cet établissement');
    }
  } else if (!isAdmin) {
    throw new ForbiddenError('Non autorisé');
  }

  // Supprimer les occurrences récurrentes si demandé
  if (deleteRecurrences && activite.isRecurrent) {
    await prisma.programmeActivite.deleteMany({
      where: { recurrenceParentId: activityId }
    });
  }

  await prisma.programmeActivite.delete({
    where: { id: activityId }
  });

  return successResponse(
    null,
    deleteRecurrences ? 'Activité et occurrences supprimées' : 'Activité supprimée'
  );
});