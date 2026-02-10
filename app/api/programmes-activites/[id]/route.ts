import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { z } from 'zod';

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
});

// GET - Détails d'une activité
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;
    const activityId = parseInt(id);

    if (isNaN(activityId)) {
      return NextResponse.json({ error: 'ID invalide' }, { status: 400 });
    }

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
      return NextResponse.json({ error: 'Activité introuvable' }, { status: 404 });
    }

    // Vérifier la visibilité pour les citoyens non authentifiés
    const isAdmin = session?.user?.role && ['ADMIN', 'SUPER_ADMIN', 'GOUVERNEUR'].includes(session.user.role);
    const isCoordinator = session?.user?.role === 'COORDINATEUR_ACTIVITES';
    
    if (!isAdmin && !isCoordinator) {
      if (!activite.isVisiblePublic || !activite.isValideParAdmin) {
        return NextResponse.json({ error: 'Activité non accessible' }, { status: 403 });
      }
      
      // Cacher les infos de rapport pour les visiteurs
      const { 
        presenceEffective, tauxPresence, commentaireDeroulement,
        difficultes, pointsPositifs, photosRapport, noteQualite,
        recommandations, rapportComplete, dateRapport,
        rappelJ1Envoye, alerteRapportEnvoyee, requireValidation,
        ...publicData 
      } = activite;
      
      return NextResponse.json({ success: true, data: publicData });
    }

    return NextResponse.json({ success: true, data: activite });

  } catch (error) {
    console.error('Erreur GET activite:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// PATCH - Modifier une activité
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { id } = await params;
    const activityId = parseInt(id);
    const userId = parseInt(session.user.id);

    if (isNaN(activityId)) {
      return NextResponse.json({ error: 'ID invalide' }, { status: 400 });
    }

    const activite = await prisma.programmeActivite.findUnique({
      where: { id: activityId },
      include: {
        etablissement: { select: { id: true } }
      }
    });

    if (!activite) {
      return NextResponse.json({ error: 'Activité introuvable' }, { status: 404 });
    }

    // Vérifier les permissions
    const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(session.user.role);
    const isCoordinator = session.user.role === 'COORDINATEUR_ACTIVITES';

    if (isCoordinator) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { etablissementsGeres: true }
      });

      if (!user?.etablissementsGeres.includes(activite.etablissementId)) {
        return NextResponse.json({
          error: 'Non autorisé',
          message: 'Vous ne gérez pas cet établissement'
        }, { status: 403 });
      }
    } else if (!isAdmin) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = updateActivitySchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json({
        error: 'Données invalides',
        details: parsed.error.issues,
      }, { status: 400 });
    }

    const updateData: any = { ...parsed.data };
    
    if (updateData.date) {
      updateData.date = new Date(updateData.date);
    }
    
    // Fix: Convert string date to Date object for Prisma
    if (updateData.recurrenceEndDate) {
      updateData.recurrenceEndDate = new Date(updateData.recurrenceEndDate);
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

    return NextResponse.json({ 
      success: true, 
      data: updated,
      message: 'Activité mise à jour'
    });

  } catch (error) {
    console.error('Erreur PATCH activite:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE - Supprimer une activité (et ses occurrences récurrentes)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { id } = await params;
    const activityId = parseInt(id);
    const userId = parseInt(session.user.id);
    const deleteRecurrences = new URL(request.url).searchParams.get('deleteRecurrences') === 'true';

    if (isNaN(activityId)) {
      return NextResponse.json({ error: 'ID invalide' }, { status: 400 });
    }

    const activite = await prisma.programmeActivite.findUnique({
      where: { id: activityId }
    });

    if (!activite) {
      return NextResponse.json({ error: 'Activité introuvable' }, { status: 404 });
    }

    // Vérifier les permissions
    const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(session.user.role);
    const isCoordinator = session.user.role === 'COORDINATEUR_ACTIVITES';

    if (isCoordinator) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { etablissementsGeres: true }
      });

      if (!user?.etablissementsGeres.includes(activite.etablissementId)) {
        return NextResponse.json({
          error: 'Non autorisé',
          message: 'Vous ne gérez pas cet établissement'
        }, { status: 403 });
      }
    } else if (!isAdmin) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
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

    return NextResponse.json({ 
      success: true,
      message: deleteRecurrences 
        ? 'Activité et occurrences supprimées' 
        : 'Activité supprimée'
    });

  } catch (error) {
    console.error('Erreur DELETE activite:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
