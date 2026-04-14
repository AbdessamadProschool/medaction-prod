import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { withErrorHandler, successResponse } from '@/lib/api-handler';
import { UnauthorizedError, ForbiddenError, NotFoundError, ValidationError } from '@/lib/exceptions';
import { getSafeId } from '@/lib/utils/parse';

// POST - Valider une activité (Admin/Super Admin seulement)
export const POST = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    throw new UnauthorizedError('Non autorisé');
  }

  // Seuls admins peuvent valider
  if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
    throw new ForbiddenError('Seuls les administrateurs peuvent valider les activités');
  }

  const { id: idStr } = await params;
  const activityId = getSafeId(idStr);

  const body = await request.json();
  const { action } = body; // 'validate' | 'reject'

  const activite = await prisma.programmeActivite.findUnique({
    where: { id: activityId },
    include: {
      etablissement: { select: { nom: true } },
      createdByUser: { select: { id: true, nom: true, prenom: true } }
    }
  });

  if (!activite) {
    throw new NotFoundError('Activité introuvable');
  }

  const userId = Number(session.user.id);

  if (action === 'validate') {
    // Valider l'activité: changer statut et rendre visible
    await prisma.programmeActivite.update({
      where: { id: activityId },
      data: { 
        statut: 'PLANIFIEE',           // Passe de EN_ATTENTE_VALIDATION à PLANIFIEE
        isValideParAdmin: true,         // Marquée comme validée
        isVisiblePublic: true           // Visible publiquement maintenant
      }
    });

    // Notifier le coordinateur
    if (activite.createdByUser) {
      await prisma.notification.create({
        data: {
          userId: activite.createdByUser.id,
          type: 'ACTIVITE_VALIDEE',
          titre: 'Activité validée ✓',
          message: `Votre activité "${activite.titre}" a été validée par l'administration et est maintenant visible publiquement.`,
          lien: `/coordinateur/calendrier`,
        }
      });
    }

    // Logger l'action
    await prisma.activityLog.create({
      data: {
        userId,
        action: 'VALIDATE_ACTIVITY',
        entity: 'ProgrammeActivite',
        entityId: activityId,
        details: {
          titre: activite.titre,
          etablissement: activite.etablissement ? activite.etablissement.nom : 'Province',
        },
      }
    });

    return successResponse(null, 'Activité validée et publiée');
  } else if (action === 'reject') {
    const { motif } = body;
    
    // Rejeter: remettre en brouillon pour modification
    await prisma.programmeActivite.update({
      where: { id: activityId },
      data: { 
        statut: 'BROUILLON',            // Redevient brouillon pour correction
        isVisiblePublic: false,
        isValideParAdmin: false 
      }
    });

    // Notifier le coordinateur du refus
    if (activite.createdByUser) {
      await prisma.notification.create({
        data: {
          userId: activite.createdByUser.id,
          type: 'ACTIVITE_REJETEE',
          titre: 'Activité à corriger',
          message: `Votre activité "${activite.titre}" nécessite des modifications. ${motif ? `Motif: ${motif}` : 'Veuillez vérifier les informations.'}`,
          lien: `/coordinateur/calendrier`,
        }
      });
    }

    // Logger l'action
    await prisma.activityLog.create({
      data: {
        userId,
        action: 'REJECT_ACTIVITY',
        entity: 'ProgrammeActivite',
        entityId: activityId,
        details: {
          titre: activite.titre,
          motif: motif || 'Non spécifié',
        },
      }
    });

    return successResponse(null, 'Activité rejetée et renvoyée en brouillon');
  }

  throw new ValidationError('Action non reconnue');
});
