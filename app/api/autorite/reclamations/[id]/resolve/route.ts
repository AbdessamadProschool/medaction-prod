import { safeParseInt } from '@/lib/utils/parse';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { notifyReclamationResolved } from '@/lib/notifications';
import { withErrorHandler, successResponse } from '@/lib/api-handler';
import { UnauthorizedError, ForbiddenError, ValidationError, NotFoundError } from '@/lib/exceptions';

// POST - Résoudre une réclamation
export const POST = withErrorHandler(async (
  request: NextRequest,
  { params: _p }: { params: Promise<{ id: string }> }
) => {
  const params = await _p;
  const session = await getServerSession(authOptions);
    
  if (!session?.user?.id) {
    throw new UnauthorizedError('Non autorisé');
  }

  if (session.user.role !== 'AUTORITE_LOCALE') {
    throw new ForbiddenError('Accès réservé aux autorités locales');
  }

    const reclamationId = safeParseInt(params.id, 0);
    const autoriteId = parseInt(session.user.id);
    const body = await request.json();
    const { solution } = body;

  if (!solution || solution.trim().length < 10) {
    throw new ValidationError('La solution doit contenir au moins 10 caractères');
  }

    // Vérifier que la réclamation est bien affectée à cette autorité
    const reclamation = await prisma.reclamation.findFirst({
      where: {
        id: reclamationId,
        affecteeAAutoriteId: autoriteId,
        dateResolution: null, // Pas encore résolue
      },
      select: { id: true, userId: true, titre: true }
    });

  if (!reclamation) {
    throw new NotFoundError('Réclamation non trouvée ou déjà résolue');
  }

    // Mettre à jour la réclamation
    const updatedReclamation = await prisma.reclamation.update({
      where: { id: reclamationId },
      data: {
        dateResolution: new Date(),
        solutionApportee: solution.trim(),
      },
    });

    // Ajouter à l'historique
    await prisma.historiqueReclamation.create({
      data: {
        reclamationId,
        action: 'RESOLUTION',
        details: {
          solution: solution.trim(),
          resolueParId: autoriteId,
          resolueParNom: `${session.user.prenom} ${session.user.nom}`,
        },
        effectuePar: autoriteId,
      }
    });

    // Notifier le citoyen
    await notifyReclamationResolved(reclamationId, reclamation.userId);

  return successResponse(
    updatedReclamation,
    'Réclamation marquée comme résolue'
  );
});