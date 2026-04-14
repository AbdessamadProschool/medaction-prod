import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { withMobileAuth } from '@/lib/mobile/security';
import { withErrorHandler, successResponse } from '@/lib/api-handler';
import { NotFoundError } from '@/lib/exceptions';
import { getSafeId } from '@/lib/utils/parse';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/mobile/etablissements/[id]
 * Returns etablissement details with mobile authentication wrapper
 */
export const GET = withErrorHandler(withMobileAuth(async (request: NextRequest, context: any) => {
  // Extract params from context (passed by Next.js or the wrapper)
  const { id: idStr } = await (context.params as Promise<{ id: string }>);
  const etablissementId = getSafeId(idStr);

  // Get etablissement and evaluations in parallel
  const [etablissement, evaluations] = await Promise.all([
    prisma.etablissement.findUnique({
      where: { id: etablissementId },
      include: {
        commune: { select: { id: true, nom: true } },
        annexe: { select: { id: true, nom: true } },
        evenementsOrganises: {
          where: {
            statut: 'PUBLIEE',
            dateDebut: { gte: new Date() },
          },
          select: {
            id: true,
            titre: true,
            dateDebut: true,
            dateFin: true,
            lieu: true,
          },
          orderBy: { dateDebut: 'asc' },
          take: 5,
        },
        _count: {
          select: {
            evaluations: true,
            reclamations: true,
            evenementsOrganises: true,
          },
        },
      },
    }),
    prisma.evaluation.aggregate({
      where: { etablissementId },
      _avg: { noteGlobale: true },
      _count: true,
    })
  ]);

  if (!etablissement) {
    throw new NotFoundError('Établissement non trouvé');
  }

  return successResponse({
    ...etablissement,
    avgRating: evaluations._avg?.noteGlobale ?? 0,
    reviewCount: evaluations._count,
  });
}));
