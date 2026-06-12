import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { ActivityLogger } from '@/lib/activity-logger';
import { withErrorHandler, successResponse } from '@/lib/api-handler';
import { UnauthorizedError, ForbiddenError, ValidationError, NotFoundError } from '@/lib/exceptions';
import { z } from 'zod';

const validerSchema = z.object({
  decision: z.enum(['VALIDEE', 'PUBLIEE', 'REJETEE', 'DEPUBLIEE', 'ARCHIVEE']),
  motifRejet: z.string().min(10).optional(),
});

// PATCH - Valider ou rejeter une actualité (ADMIN uniquement)
export const PATCH = withErrorHandler(async (
  request: NextRequest,
  { params: _p }: { params: Promise<{ id: string }> }
) => {
  const params = await _p;
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    throw new UnauthorizedError('Non authentifié');
  }

  // Seuls les admins peuvent valider
  if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
    throw new ForbiddenError('Seuls les administrateurs peuvent valider les actualités');
  }

  const id = parseInt(params.id);
  if (isNaN(id)) {
    throw new ValidationError('ID invalide');
  }

    const body = await request.json();
    const validation = validerSchema.safeParse(body);

  if (!validation.success) {
    throw new ValidationError('Données invalides');
  }

    const { decision, motifRejet } = validation.data;

    // Vérifier que l'actualité existe
    const actualite = await prisma.actualite.findUnique({
      where: { id },
      select: { id: true, statut: true, titre: true, createdBy: true }
    });

  if (!actualite) {
    throw new NotFoundError('Actualité non trouvée');
  }

  // Validation des règles de transition
  if (decision === 'REJETEE' && !motifRejet) {
    throw new ValidationError('Un motif de rejet est requis');
  }

    // Préparer les données de mise à jour
    const updateData: any = {
      statut: decision,
    };

    switch (decision) {
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
        // Stocker le motif dans un champ approprié si disponible
        break;
      case 'DEPUBLIEE':
        updateData.isPublie = false;
        break;
      case 'ARCHIVEE':
        updateData.isPublie = false;
        break;
    }

    // Mettre à jour le statut
    const updatedActualite = await prisma.actualite.update({
      where: { id },
      data: updateData,
      include: {
        etablissement: { select: { nom: true } },
      }
    });

    // Notifier le créateur
    const notificationMessages: Record<string, string> = {
      'VALIDEE': `Votre actualité "${actualite.titre}" a été validée. Elle peut maintenant être publiée.`,
      'PUBLIEE': `Votre actualité "${actualite.titre}" a été publiée.`,
      'REJETEE': `Votre actualité "${actualite.titre}" a été rejetée. Motif: ${motifRejet}`,
      'DEPUBLIEE': `Votre actualité "${actualite.titre}" a été dépubliée.`,
      'ARCHIVEE': `Votre actualité "${actualite.titre}" a été archivée.`,
    };

    const notificationTypes: Record<string, string> = {
      'VALIDEE': 'ACTUALITE_VALIDEE',
      'PUBLIEE': 'ACTUALITE_PUBLIEE',
      'REJETEE': 'ACTUALITE_REJETEE',
      'DEPUBLIEE': 'ACTUALITE_DEPUBLIEE',
      'ARCHIVEE': 'ACTUALITE_ARCHIVEE',
    };

    await prisma.notification.create({
      data: {
        userId: actualite.createdBy,
        type: notificationTypes[decision],
        titre: decision === 'PUBLIEE' ? 'Actualité publiée' : 
               decision === 'VALIDEE' ? 'Actualité validée' :
               decision === 'REJETEE' ? 'Actualité rejetée' : 'Actualité mise à jour',
        message: notificationMessages[decision],
        lien: `/actualites/${actualite.id}`,
      }
    });

    await ActivityLogger.custom({
      action: `Validation actualité (${decision})`,
      entity: 'Actualite',
      entityId: actualite.id,
      details: {
        message: `L'utilisateur a défini le statut de l'actualité "${actualite.titre}" à "${decision}"`
      },
      userId: parseInt(session.user.id)
    });

  return successResponse(updatedActualite, `Actualité ${decision.toLowerCase()}`);
});