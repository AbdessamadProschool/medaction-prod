/**
 * API Route optimisée pour les établissements
 * Utilise le cache, pagination par curseur, et sélections optimisées
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import {
  getCached,
  etablissementListSelect,
  buildCursorPagination,
  formatCursorResult,
} from '@/lib/prisma-optimizations';
import {
  jsonResponse,
  errorResponse,
  parsePaginationParams,
  createPaginationMeta,
  buildSearchFilter,
} from '@/lib/api-utils';

// GET /api/v2/etablissements - Liste optimisée des établissements
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Mode pagination
    const cursor = searchParams.get('cursor');
    const useCursor = cursor !== null || searchParams.get('mode') === 'cursor';
    
    // Params communs
    const limit = Math.min(50, parseInt(searchParams.get('limit') || '12'));
    const secteur = searchParams.get('secteur');
    const communeId = searchParams.get('communeId');
    const search = searchParams.get('search');
    
    // Construire le filtre
    const where: any = {
      isPublie: true,
    };
    
    if (secteur) {
      where.secteur = secteur;
    }
    
    if (communeId) {
      where.communeId = parseInt(communeId);
    }
    
    // Recherche textuelle
    const searchFilter = buildSearchFilter(search, ['nom', 'code']);
    if (searchFilter) {
      where.AND = [searchFilter];
    }
    
    // ======================================
    // MODE CURSEUR (plus performant)
    // ======================================
    if (useCursor) {
      const cursorOptions = buildCursorPagination({
        cursor: cursor ? parseInt(cursor) : undefined,
        limit,
      });
      
      const etablissements = await prisma.etablissement.findMany({
        where,
        select: etablissementListSelect,
        orderBy: { id: 'asc' },
        ...cursorOptions,
      });
      
      const result = formatCursorResult(etablissements, limit);
      
      return jsonResponse({
        ...result,
        mode: 'cursor',
      }, 200, 'default');
    }
    
    // ======================================
    // MODE OFFSET (compatibilité)
    // ======================================
    const { page, skip } = parsePaginationParams(searchParams, { limit });
    
    // Cache key basée sur les filtres
    const cacheKey = `etablissements:list:${JSON.stringify({
      page, limit, secteur, communeId, search
    })}`;
    
    const result = await getCached(
      cacheKey,
      async () => {
        const [etablissements, total] = await Promise.all([
          prisma.etablissement.findMany({
            where,
            select: etablissementListSelect,
            orderBy: { noteMoyenne: 'desc' },
            skip,
            take: limit,
          }),
          prisma.etablissement.count({ where }),
        ]);
        
        return {
          data: etablissements,
          pagination: createPaginationMeta(page, limit, total),
        };
      },
      60 // Cache 1 minute
    );
    
    return jsonResponse({
      ...result,
      mode: 'offset',
    }, 200, 'default');
    
  } catch (error) {
    console.error('Erreur GET /api/v2/etablissements:', error);
    return errorResponse('Erreur serveur', 500);
  }
}
