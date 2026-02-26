import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { performanceCache, CACHE_TTL, cacheKey } from '@/lib/cache/performance-cache';
import { withErrorHandler } from '@/lib/api-handler';

// GET - Liste des communes (CACHED)
export const GET = withErrorHandler(async () => {
  const communes = await performanceCache.getOrFetch(
    cacheKey.communes(),
    async () => {
      return await prisma.commune.findMany({
        select: {
          id: true,
          nom: true,
          code: true,
        },
        orderBy: { nom: 'asc' }
      });
    },
    CACHE_TTL.COMMUNES
  );

  return NextResponse.json(
    { data: communes },
    {
      headers: {
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      }
    }
  );
});
