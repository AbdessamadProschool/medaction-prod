import { safeParseInt } from '@/lib/utils/parse';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { withErrorHandler, successResponse } from '@/lib/api-handler';
import { withPermission } from '@/lib/auth/api-guard';

export const GET = withPermission('bilans.read', withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(safeParseInt(searchParams.get('limit') || '50', 0), 100);

  const actualites = await prisma.actualite.findMany({
    where: { isPublie: true },
    include: {
      etablissement: {
        select: { 
          nom: true, 
          secteur: true,
          commune: { select: { nom: true } }
        }
      },
      createdByUser: {
        select: { nom: true, prenom: true }
      },
      medias: {
        select: { id: true, urlPublique: true, type: true, nomFichier: true }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: limit
  });

  return successResponse(actualites, 'Actualités récupérées avec succès');
}));
