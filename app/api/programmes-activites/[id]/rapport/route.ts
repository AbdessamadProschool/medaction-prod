import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { withErrorHandler, successResponse } from '@/lib/api-handler';
import { UnauthorizedError, ForbiddenError, ValidationError, NotFoundError } from '@/lib/exceptions';
import { getSafeId } from '@/lib/utils/parse';
import { ActivityLogger } from '@/lib/activity-logger';

// POST /api/programmes-activites/[id]/rapport - Enregistrer le rapport d'activité
export const POST = withErrorHandler(async (
  request: NextRequest,
  { params: _p }: { params: Promise<{ id: string }> }
) => {
  const params = await _p;
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    throw new UnauthorizedError('Non autorisé');
  }

  const activityId = getSafeId(params.id);

  // Vérifier que l'activité existe
  const activite = await prisma.programmeActivite.findUnique({
    where: { id: activityId },
    include: { etablissement: true },
  });

  if (!activite) {
    throw new NotFoundError('Activité non trouvée');
  }

    // Vérifier les permissions (coordinateur de l'établissement)
    const userRole = session.user.role;
    const etablissementsGeres = session.user.etablissementsGeres || [];
    
  const canEdit = 
    ['ADMIN', 'SUPER_ADMIN'].includes(userRole) ||
    (userRole === 'COORDINATEUR_ACTIVITES' && activite.etablissementId ? etablissementsGeres.includes(activite.etablissementId) : false);

  if (!canEdit) {
    throw new ForbiddenError('Non autorisé à modifier cette activité');
  }

    // Vérifier que l'activité est terminée ou planifiée (passée)
    const activityDate = new Date(activite.date);
    activityDate.setHours(parseInt(activite.heureFin.split(':')[0]) || 22);
    
    const now = new Date();
    
  if (activityDate > now && activite.statut !== 'TERMINEE' && activite.statut !== 'RAPPORT_COMPLETE') {
    throw new ValidationError('Le rapport ne peut être rempli qu\'après la fin de l\'activité');
  }

    // Récupérer les données du rapport
    const body = await request.json();
    const {
      presenceEffective,
      commentaireDeroulement,
      difficultes,
      pointsPositifs,
      noteQualite,
      recommandations,
    } = body;

  // Valider les données
  if (presenceEffective === undefined || presenceEffective < 0) {
    throw new ValidationError('Le nombre de participants est requis');
  }

    // Calculer le taux de présence
    const tauxPresence = activite.participantsAttendus 
      ? Math.round((presenceEffective / activite.participantsAttendus) * 100)
      : null;

    // Mettre à jour l'activité avec le rapport
    const updatedActivite = await prisma.programmeActivite.update({
      where: { id: activityId },
      data: {
        presenceEffective: parseInt(presenceEffective),
        tauxPresence,
        commentaireDeroulement: commentaireDeroulement || null,
        difficultes: difficultes || null,
        pointsPositifs: pointsPositifs || null,
        noteQualite: noteQualite ? parseInt(noteQualite) : null,
        recommandations: recommandations || null,
        rapportComplete: true,
        dateRapport: new Date(),
        statut: 'RAPPORT_COMPLETE' as any,
      },
    });

  // Créer un log d'activité
  try {
    await ActivityLogger.custom({
      action: 'RAPPORT_ACTIVITE',
      entity: 'ProgrammeActivite',
      entityId: activityId,
      details: {
        message: `Rapport complété pour l'activité "${activite.titre}"`,
        presenceEffective,
        tauxPresence,
        noteQualite,
      },
      userId: parseInt(session.user.id)
    });
  } catch (e) {
    // Log non critique
  }

  return successResponse(updatedActivite, 'Rapport enregistré avec succès');
});

// GET /api/programmes-activites/[id]/rapport - Récupérer le rapport
export const GET = withErrorHandler(async (
  request: NextRequest,
  { params: _p }: { params: Promise<{ id: string }> }
) => {
  const params = await _p;
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    throw new UnauthorizedError('Non autorisé');
  }

  const activityId = getSafeId(params.id);

    const activite = await prisma.programmeActivite.findUnique({
      where: { id: activityId },
      select: {
        id: true,
        titre: true,
        date: true,
        heureDebut: true,
        heureFin: true,
        lieu: true,
        participantsAttendus: true,
        presenceEffective: true,
        tauxPresence: true,
        commentaireDeroulement: true,
        difficultes: true,
        pointsPositifs: true,
        noteQualite: true,
        recommandations: true,
        rapportComplete: true,
        dateRapport: true,
        etablissementId: true,
        etablissement: {
          select: { id: true, nom: true, secteur: true },
        },
      },
    });

  if (!activite) {
    throw new NotFoundError('Activité non trouvée');
  }

    // SECURITY FIX: Vérification des permissions (alignement avec POST)
    const userRole = session.user.role;
    const etablissementsGeres = session.user.etablissementsGeres || [];
    
  const canAccess = 
    ['ADMIN', 'SUPER_ADMIN', 'GOUVERNEUR'].includes(userRole) ||
    userRole === 'DELEGATION' ||
    (userRole === 'COORDINATEUR_ACTIVITES' && activite.etablissementId 
      ? etablissementsGeres.includes(activite.etablissementId) 
      : false);

  if (!canAccess) {
    throw new ForbiddenError('Accès refusé');
  }

  return successResponse(activite);
});