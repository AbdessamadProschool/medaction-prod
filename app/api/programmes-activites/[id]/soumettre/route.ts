import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { withErrorHandler, successResponse } from '@/lib/api-handler';
import { UnauthorizedError, ForbiddenError, ValidationError, NotFoundError } from '@/lib/exceptions';
import { safeParseInt } from '@/lib/utils/parse';

// POST - Soumettre une activité pour validation
export const POST = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    throw new UnauthorizedError('Non autorisé');
  }

  const { id } = await params;
  const activiteId = safeParseInt(id, 0);
  if (!activiteId) {
    throw new ValidationError('ID invalide');
  }
  
  const userId = Number(session.user.id);

  // Récupérer l'activité
  const activite = await prisma.programmeActivite.findUnique({
    where: { id: activiteId },
    include: {
      etablissement: { select: { id: true, nom: true } }
    }
  });

  if (!activite) {
    throw new NotFoundError('Activité non trouvée');
  }

  // Vérifier que c'est bien le créateur ou un admin
  if (activite.createdBy !== userId && !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
    // Vérifier si coordinateur de cet établissement
    if (session.user.role === 'COORDINATEUR_ACTIVITES') {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { etablissementsGeres: true }
      });
      if (!activite.etablissementId || !user?.etablissementsGeres.includes(activite.etablissementId)) {
        throw new ForbiddenError('Accès non autorisé');
      }
    } else {
      throw new ForbiddenError('Accès non autorisé');
    }
  }

  // Vérifier que l'activité est en brouillon
  if (activite.statut !== 'BROUILLON') {
    throw new ValidationError(
      `Statut actuel: ${activite.statut}. Seules les activités en brouillon peuvent être soumises.`
    );
  }

  // Mettre à jour le statut
  const updated = await prisma.programmeActivite.update({
    where: { id: activiteId },
    data: {
      statut: 'EN_ATTENTE_VALIDATION',
    },
    include: {
      etablissement: { select: { id: true, nom: true, secteur: true } },
      createdByUser: { select: { id: true, nom: true, prenom: true } }
    }
  });

  // Créer une notification pour les admins
  const admins = await prisma.user.findMany({
    take: 100,
    where: { 
      role: { in: ['ADMIN', 'SUPER_ADMIN'] },
      isActive: true
    },
    select: { id: true }
  });

  if (admins.length > 0) {
    await prisma.notification.createMany({
      data: admins.map(admin => ({
        userId: admin.id,
        type: 'ACTIVITE_A_VALIDER',
        titre: 'Nouvelle activité à valider',
        message: `L'activité "${activite.titre}" à ${activite.etablissement ? activite.etablissement.nom : 'la Province'} a été soumise pour validation.`,
        lien: `/admin/programmes-activites`,
        isRead: false,
      }))
    });
  }

  // Logger l'action
  await prisma.activityLog.create({
    data: {
      userId,
      action: 'SUBMIT_FOR_VALIDATION',
      entity: 'ProgrammeActivite',
      entityId: activiteId,
      details: {
        titre: activite.titre,
        etablissement: activite.etablissement ? activite.etablissement.nom : 'Province',
      },
    }
  });

  return successResponse(updated, 'Activité soumise pour validation avec succès');
});
