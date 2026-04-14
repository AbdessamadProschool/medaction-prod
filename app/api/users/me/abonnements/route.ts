import { safeParseInt } from '@/lib/utils/parse';
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { withErrorHandler, successResponse } from '@/lib/api-handler';
import { UnauthorizedError } from '@/lib/exceptions';

// GET - Obtenir les abonnements de l'utilisateur connecté
export const GET = withErrorHandler(async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    throw new UnauthorizedError('Non autorisé');
  }

  const userId = Number(session.user.id);
  const { searchParams } = new URL(request.url);
  const page = Math.max(safeParseInt(searchParams.get('page') || '1', 1), 1);
  const limit = Math.min(Math.max(safeParseInt(searchParams.get('limit') || '20', 1), 1), 100);
  const skip = (page - 1) * limit;

  const [abonnements, total] = await Promise.all([
    prisma.abonnementEtablissement.findMany({
      where: { userId },
      include: {
        etablissement: {
          select: {
            id: true,
            nom: true,
            adresseComplete: true,
            secteur: true,
            photoPrincipale: true,
            commune: { select: { nom: true } },
            _count: {
              select: {
                evenementsOrganises: true,
                actualites: true,
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.abonnementEtablissement.count({
      where: { userId }
    })
  ]);

  const etablissementIds = abonnements.map(a => a.etablissementId);

  return successResponse({
    data: abonnements,
    etablissementIds,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    }
  });
});
