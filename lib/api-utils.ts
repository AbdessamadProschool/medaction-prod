/**
 * Utilitaires pour compresser les réponses API
 * et optimiser les payloads JSON
 */

import { NextResponse } from 'next/server';

// ============================================
// COMPRESSION DE RÉPONSES
// ============================================

/**
 * Headers optimisés pour les réponses API
 */
export const optimizedHeaders = {
  'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
  'Content-Type': 'application/json; charset=utf-8',
};

/**
 * Headers pour données rarement modifiées (communes, annexes, etc.)
 */
export const staticDataHeaders = {
  'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
  'Content-Type': 'application/json; charset=utf-8',
};

/**
 * Headers pour données temps réel (pas de cache)
 */
export const realtimeHeaders = {
  'Cache-Control': 'no-store, must-revalidate',
  'Content-Type': 'application/json; charset=utf-8',
};

/**
 * Créer une réponse JSON optimisée
 */
export function jsonResponse<T>(
  data: T,
  status: number = 200,
  cacheType: 'default' | 'static' | 'realtime' = 'default'
): NextResponse {
  const headers = 
    cacheType === 'static' ? staticDataHeaders :
    cacheType === 'realtime' ? realtimeHeaders :
    optimizedHeaders;

  return NextResponse.json(data, {
    status,
    headers,
  });
}

/**
 * Créer une réponse d'erreur optimisée
 */
export function errorResponse(
  error: string,
  status: number = 500
): NextResponse {
  return NextResponse.json(
    { error },
    {
      status,
      headers: realtimeHeaders,
    }
  );
}

// ============================================
// NETTOYAGE DES DONNÉES
// ============================================

/**
 * Supprimer les champs null/undefined d'un objet
 */
export function cleanObject<T extends Record<string, any>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, v]) => v !== null && v !== undefined)
  ) as Partial<T>;
}

/**
 * Nettoyer un tableau d'objets
 */
export function cleanArray<T extends Record<string, any>>(arr: T[]): Partial<T>[] {
  return arr.map(cleanObject);
}

/**
 * Tronquer les champs texte longs pour les listes
 */
export function truncateText(text: string | null, maxLength: number = 200): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * Préparer les données pour une réponse liste (plus légère)
 */
export function prepareListData<T extends Record<string, any>>(
  items: T[],
  truncateFields: string[] = ['description', 'contenu', 'commentaire']
): T[] {
  return items.map(item => {
    const cleaned = { ...item } as Record<string, any>;
    
    for (const field of truncateFields) {
      if (typeof cleaned[field] === 'string') {
        cleaned[field] = truncateText(cleaned[field] as string, 200);
      }
    }
    
    return cleaned as T;
  });
}

// ============================================
// PAGINATION UTILS
// ============================================

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * Créer les métadonnées de pagination
 */
export function createPaginationMeta(
  page: number,
  limit: number,
  total: number
): PaginationMeta {
  const totalPages = Math.ceil(total / limit);
  
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

/**
 * Parser et valider les paramètres de pagination
 */
export function parsePaginationParams(
  searchParams: URLSearchParams,
  defaults: { page?: number; limit?: number } = {}
): { page: number; limit: number; skip: number } {
  const page = Math.max(1, parseInt(searchParams.get('page') || String(defaults.page || 1)));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || String(defaults.limit || 10))));
  const skip = (page - 1) * limit;
  
  return { page, limit, skip };
}

// ============================================
// FILTRES UTILS
// ============================================

/**
 * Construire un filtre Prisma where à partir des searchParams
 */
export function buildWhereFromParams(
  searchParams: URLSearchParams,
  allowedFilters: string[]
): Record<string, any> {
  const where: Record<string, any> = {};
  
  for (const filter of allowedFilters) {
    const value = searchParams.get(filter);
    if (value) {
      // Gérer les filtres numériques
      if (filter.endsWith('Id')) {
        where[filter] = parseInt(value);
      } 
      // Gérer les booléens
      else if (value === 'true' || value === 'false') {
        where[filter] = value === 'true';
      }
      // Gérer la recherche texte
      else if (filter === 'search') {
        // Le search doit être géré spécifiquement par le caller
      }
      // Valeur string standard
      else {
        where[filter] = value;
      }
    }
  }
  
  return where;
}

/**
 * Construire un filtre de recherche textuelle
 */
export function buildSearchFilter(
  search: string | null,
  fields: string[]
): Record<string, any> | null {
  if (!search || search.length < 2) return null;
  
  return {
    OR: fields.map(field => ({
      [field]: {
        contains: search,
        mode: 'insensitive',
      },
    })),
  };
}

// ============================================
// RATE LIMITING SIMPLE
// ============================================

const requestCounts: Map<string, { count: number; resetTime: number }> = new Map();

/**
 * Vérifier le rate limit pour une IP/user
 */
export function checkRateLimit(
  identifier: string,
  maxRequests: number = 100,
  windowMs: number = 60000
): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const record = requestCounts.get(identifier);
  
  if (!record || now > record.resetTime) {
    requestCounts.set(identifier, {
      count: 1,
      resetTime: now + windowMs,
    });
    return { allowed: true, remaining: maxRequests - 1, resetIn: windowMs };
  }
  
  if (record.count >= maxRequests) {
    return { 
      allowed: false, 
      remaining: 0, 
      resetIn: record.resetTime - now 
    };
  }
  
  record.count++;
  return { 
    allowed: true, 
    remaining: maxRequests - record.count, 
    resetIn: record.resetTime - now 
  };
}

// Nettoyage périodique
setInterval(() => {
  const now = Date.now();
  const entries = Array.from(requestCounts.entries());
  for (const [key, value] of entries) {
    if (now > value.resetTime) {
      requestCounts.delete(key);
    }
  }
}, 60000);
