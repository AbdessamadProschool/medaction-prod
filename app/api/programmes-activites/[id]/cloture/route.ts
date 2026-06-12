import { safeParseInt } from '@/lib/utils/parse';
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { ActivityLogger } from '@/lib/activity-logger';
import { withErrorHandler, successResponse } from '@/lib/api-handler';
import { UnauthorizedError, ForbiddenError, NotFoundError, ValidationError } from '@/lib/exceptions';

const clotureSchema = z.object({
  presenceEffective: z.number().int().min(0),
  noteQualite: z.number().min(1).max(5).optional(),
  commentaireDeroulement: z.string().min(10),
  difficultes: z.string().optional(),
  pointsPositifs: z.string().optional(),
  recommandations: z.string().optional(),
  photosRapport: z.array(z.string()).optional(),
  rapportComplete: z.literal(true),
  statut: z.literal('RAPPORT_COMPLETE')
});

export const POST = withErrorHandler(async (
  request: NextRequest,
  { params: _p }: { params: Promise<{ id: string }> }
) => {
  const params = await _p;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new UnauthorizedError('Non autorisé');
  }

    const { id } = params;
    const activityId = safeParseInt(id, 0);
    const userId = parseInt(session.user.id);

    // 1. Check if activity exists and user has rights
    const activite = await prisma.programmeActivite.findUnique({
      where: { id: activityId },
      include: { etablissement: true }
    });

  if (!activite) {
    throw new NotFoundError('Activité non trouvée');
  }

    // Check permissions (Coordinator of this establishment or Admin)
    const isCoordinator = session.user.role === 'COORDINATEUR_ACTIVITES';
    const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(session.user.role);

    if (isCoordinator) {
      // Allow if created by user OR if user manages the establishment
      // Note: In real app, check etablissementsGeres list from database user profile
      const user = await prisma.user.findUnique({ 
         where: { id: userId },
         select: { etablissementsGeres: true } 
      });
      
      const managesEtab = activite.etablissementId ? user?.etablissementsGeres.includes(activite.etablissementId) : false;
      
    if (!managesEtab && activite.createdBy !== userId) {
      throw new ForbiddenError('Vous ne gérez pas cette activité');
    }
  } else if (!isAdmin) {
    throw new ForbiddenError('Permission refusée');
  }

    // 2. Validate Body
    const body = await request.json();
    const validation = clotureSchema.safeParse(body);

  if (!validation.success) {
    throw new ValidationError('Données invalides', { fieldErrors: validation.error.flatten().fieldErrors });
  }

    const data = validation.data;

    // 3. Update Activity
    const updated = await prisma.programmeActivite.update({
      where: { id: activityId },
      data: {
        presenceEffective: data.presenceEffective,
        tauxPresence: activite.participantsAttendus 
           ? (data.presenceEffective / activite.participantsAttendus) * 100 
           : 0,
        noteQualite: data.noteQualite,
        commentaireDeroulement: data.commentaireDeroulement,
        difficultes: data.difficultes,
        pointsPositifs: data.pointsPositifs,
        recommandations: data.recommandations,
        photosRapport: data.photosRapport || [],
        rapportComplete: true,
        statut: 'RAPPORT_COMPLETE',
        dateRapport: new Date(),
        alerteRapportEnvoyee: false // Reset alert
      }
    });

  await ActivityLogger.custom({
    action: 'CLOTURE_ACTIVITE',
    entity: 'ProgrammeActivite',
    entityId: activityId,
    userId: userId,
    details: { 
      titre: updated.titre, 
      presenceEffective: data.presenceEffective,
      previousValue: activite,
      newValue: updated
    }
  });

  return successResponse(updated, 'Rapport de clôture enregistré avec succès');
});