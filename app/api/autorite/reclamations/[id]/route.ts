import { safeParseInt } from '@/lib/utils/parse';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { withErrorHandler, successResponse } from '@/lib/api-handler';
import { UnauthorizedError, ForbiddenError, NotFoundError } from '@/lib/exceptions';

// GET - Détail d'une réclamation affectée
export const GET = withErrorHandler(async (
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

    const reclamation = await prisma.reclamation.findFirst({
      where: {
        id: reclamationId,
        affecteeAAutoriteId: autoriteId,
      },
      include: {
        user: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            telephone: true,
            email: true,
          }
        },
        commune: {
          select: { id: true, nom: true }
        },
        etablissement: {
          select: { id: true, nom: true, secteur: true }
        },
        medias: {
          select: { id: true, urlPublique: true, type: true }
        },
        historique: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      }
    });

  if (!reclamation) {
    throw new NotFoundError('Réclamation non trouvée');
  }

  return successResponse(reclamation);
});