import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withErrorHandler } from '@/lib/api-handler';
import { performanceCache, CACHE_TTL, cacheKey } from '@/lib/cache/performance-cache';

/**
 * GET /api/public/stats
 * Statistiques publiques pour la page d'accueil (Secteurs, Communes, etc.)
 */
export const GET = withErrorHandler(async () => {
  const stats = await performanceCache.getOrFetch(
    'public:stats:secteurs',
    async () => {
      // Compter les établissements par secteur
      const secteursCounts = await prisma.etablissement.groupBy({
        by: ['secteur'],
        where: { isPublie: true },
        _count: { id: true },
      });

      // Formater pour le frontend
      const counts: Record<string, number> = {
        EDUCATION: 0,
        SANTE: 0,
        SPORT: 0,
        SOCIAL: 0,
        CULTUREL: 0,
        JEUNESSE: 0,
      };

      secteursCounts.forEach(s => {
        if (s.secteur in counts) {
          counts[s.secteur] = s._count.id;
        }
      });

      return counts;
    },
    CACHE_TTL.STATS || 3600
  );

  return NextResponse.json({
    success: true,
    data: stats,
  });
});
