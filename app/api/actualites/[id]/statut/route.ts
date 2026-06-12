import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { ActivityLogger } from '@/lib/activity-logger';
import { withErrorHandler, successResponse } from '@/lib/api-handler';
import { UnauthorizedError, ForbiddenError, ValidationError, NotFoundError } from '@/lib/exceptions';

const VALID_STATUTS = [
  'BROUILLON',
  'EN_ATTENTE_VALIDATION',
  'VALIDEE',
  'PUBLIEE',
  'DEPUBLIEE',
  'ARCHIVEE',
  'REJETEE'
];

// PATCH - Changer le statut d'une actualité (Admin uniquement)
export const PATCH = withErrorHandler(async (
  request: NextRequest,
  { params: _p }: { params: Promise<{ id: string }> }
) => {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    throw new UnauthorizedError('Non authentifié');
  }

  // Seuls les admins peuvent changer le statut
  if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
    throw new ForbiddenError('Seuls les administrateurs peuvent modifier le statut');
  }

  const { id } = await _p;
    const actualiteId = parseInt(id);
    
  if (isNaN(actualiteId)) {
    throw new ValidationError('ID invalide');
  }

    const body = await request.json();
    const { statut } = body;

  if (!statut || !VALID_STATUTS.includes(statut)) {
    throw new ValidationError('Statut invalide');
  }

    // Vérifier que l'actualité existe
    const actualite = await prisma.actualite.findUnique({
      where: { id: actualiteId },
      select: { id: true, titre: true, createdBy: true, statut: true }
    });

  if (!actualite) {
    throw new NotFoundError('Actualité non trouvée');
  }

    // Préparer les données de mise à jour
    const updateData: any = { statut };

    // Logique spécifique selon le statut
    switch (statut) {
      case 'VALIDEE':
        updateData.isValide = true;
        break;
      case 'PUBLIEE':
        updateData.isValide = true;
        updateData.isPublie = true;
        updateData.datePublication = new Date();
        break;
      case 'REJETEE':
        updateData.isValide = false;
        updateData.isPublie = false;
        break;
      case 'DEPUBLIEE':
        updateData.isPublie = false;
        break;
      case 'ARCHIVEE':
        updateData.isPublie = false;
        break;
      case 'BROUILLON':
        updateData.isValide = false;
        updateData.isPublie = false;
        break;
    }

    // Mettre à jour le statut
    const updatedActualite = await prisma.actualite.update({
      where: { id: actualiteId },
      data: updateData,
    });

    // Notifier le créateur (sauf si c'est l'admin lui-même)
    if (actualite.createdBy && actualite.createdBy !== parseInt(session.user.id)) {
      const notificationMessages: Record<string, string> = {
        'VALIDEE': `Votre actualité "${actualite.titre}" a été validée.`,
        'PUBLIEE': `Votre actualité "${actualite.titre}" a été publiée.`,
        'REJETEE': `Votre actualité "${actualite.titre}" a été rejetée.`,
        'DEPUBLIEE': `Votre actualité "${actualite.titre}" a été dépubliée.`,
        'ARCHIVEE': `Votre actualité "${actualite.titre}" a été archivée.`,
        'BROUILLON': `Votre actualité "${actualite.titre}" a été remise en brouillon.`,
        'EN_ATTENTE_VALIDATION': `Votre actualité "${actualite.titre}" est en attente de validation.`,
      };

      await prisma.notification.create({
        data: {
          userId: actualite.createdBy,
          type: 'ACTUALITE_STATUT_CHANGE',
          titre: 'Statut de votre actualité modifié',
          message: notificationMessages[statut] || `Le statut de votre actualité a été modifié.`,
          lien: `/actualites/${actualite.id}`,
        }
      });
    }

    await ActivityLogger.custom({
      action: `Mise à jour statut actualité (${statut})`,
      entity: 'Actualite',
      entityId: actualite.id,
      details: {
        message: `L'utilisateur a changé le statut de l'actualité "${actualite.titre}" à "${statut}"`
      },
      userId: parseInt(session.user.id)
    });

  return successResponse(updatedActualite, `Statut modifié: ${statut}`);
});