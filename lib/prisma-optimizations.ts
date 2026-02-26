/**
 * Utilitaires d'optimisation des requêtes Prisma
 * - Pagination par curseur
 * - Sélection optimisée des champs
 * - Caching stratégique en mémoire
 */

import { prisma } from '@/lib/db';

// ============================================
// CACHE EN MÉMOIRE SIMPLE
// ============================================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class SimpleCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private maxSize = 1000; // Limite de cache entries

  set<T>(key: string, data: T, ttlSeconds: number = 300): void {
    // Nettoyage si cache trop grand
    if (this.cache.size >= this.maxSize) {
      this.cleanup();
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlSeconds * 1000,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    // Vérifie expiration
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data as T;
  }

  invalidate(pattern: string): void {
    for (const key of Array.from(this.cache.keys())) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }

  private cleanup(): void {
    const now = Date.now();
    const entries = Array.from(this.cache.entries());
    for (const [key, entry] of entries) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
    
    // Si encore trop grand, supprimer les plus anciens
    if (this.cache.size >= this.maxSize) {
      const entries = Array.from(this.cache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      const toDelete = entries.slice(0, Math.floor(this.maxSize / 4));
      for (const [key] of toDelete) {
        this.cache.delete(key);
      }
    }
  }
}

export const queryCache = new SimpleCache();

// ============================================
// PAGINATION PAR CURSEUR
// ============================================

export interface CursorPaginationParams {
  cursor?: number | string;
  limit?: number;
  direction?: 'forward' | 'backward';
}

export interface CursorPaginationResult<T> {
  data: T[];
  nextCursor: string | null;
  prevCursor: string | null;
  hasMore: boolean;
}

/**
 * Helper pour construire les options de pagination par curseur
 */
export function buildCursorPagination(params: CursorPaginationParams) {
  const { cursor, limit = 10, direction = 'forward' } = params;
  
  const take = direction === 'forward' ? limit + 1 : -(limit + 1);
  
  const options: any = {
    take,
  };

  if (cursor) {
    options.cursor = { id: typeof cursor === 'string' ? parseInt(cursor) : cursor };
    options.skip = 1; // Skip le curseur lui-même
  }

  return options;
}

/**
 * Formater le résultat de pagination par curseur
 */
export function formatCursorResult<T extends { id: number }>(
  data: T[],
  limit: number,
  direction: 'forward' | 'backward' = 'forward'
): CursorPaginationResult<T> {
  const hasMore = data.length > limit;
  
  // Retirer l'élément supplémentaire utilisé pour détecter hasMore
  if (hasMore) {
    if (direction === 'forward') {
      data.pop();
    } else {
      data.shift();
    }
  }

  const nextCursor = hasMore && data.length > 0 
    ? data[data.length - 1].id.toString() 
    : null;
  
  const prevCursor = data.length > 0 
    ? data[0].id.toString() 
    : null;

  return {
    data,
    nextCursor,
    prevCursor,
    hasMore,
  };
}

// ============================================
// SÉLECTIONS OPTIMISÉES
// ============================================

/**
 * Champs minimum pour les listes d'établissements
 */
export const etablissementListSelect = {
  id: true,
  code: true,
  nom: true,
  secteur: true,
  nature: true,
  photoPrincipale: true,
  noteMoyenne: true,
  nombreEvaluations: true,
  latitude: true,
  longitude: true,
  commune: {
    select: {
      id: true,
      nom: true,
    },
  },
  annexe: {
    select: {
      id: true,
      nom: true,
    },
  },
  _count: {
    select: {
      evaluations: true,
      evenements: true,
      reclamations: true,
    },
  },
} as const;

/**
 * Champs minimum pour les listes d'événements
 */
export const evenementListSelect = {
  id: true,
  titre: true,
  dateDebut: true,
  dateFin: true,
  lieu: true,
  statut: true,
  typeCategorique: true,
  imageAffiche: true,
  etablissement: {
    select: {
      id: true,
      nom: true,
    },
  },
  commune: {
    select: {
      id: true,
      nom: true,
    },
  },
  _count: {
    select: {
      inscriptions: true,
    },
  },
} as const;

/**
 * Champs minimum pour les listes de réclamations
 */
export const reclamationListSelect = {
  id: true,
  titre: true,
  categorie: true,
  statut: true,
  affectationReclamation: true,
  createdAt: true,
  dateAffectation: true,
  quartierDouar: true,
  user: {
    select: {
      id: true,
      nom: true,
      prenom: true,
    },
  },
  commune: {
    select: {
      id: true,
      nom: true,
    },
  },
  etablissement: {
    select: {
      id: true,
      nom: true,
      secteur: true,
    },
  },
  _count: {
    select: {
      medias: true,
    },
  },
} as const;

/**
 * Champs minimum pour les listes d'évaluations
 */
export const evaluationListSelect = {
  id: true,
  noteGlobale: true,
  commentaire: true,
  createdAt: true,
  user: {
    select: {
      id: true,
      nom: true,
      prenom: true,
      photo: true,
    },
  },
} as const;

/**
 * Champs minimum pour les utilisateurs en liste
 */
export const userListSelect = {
  id: true,
  nom: true,
  prenom: true,
  email: true,
  role: true,
  photo: true,
  isActive: true,
  createdAt: true,
} as const;

// ============================================
// HELPERS DE REQUÊTES OPTIMISÉES
// ============================================

/**
 * Récupérer les données avec cache
 */
export async function getCached<T>(
  cacheKey: string,
  queryFn: () => Promise<T>,
  ttlSeconds: number = 300
): Promise<T> {
  const cached = queryCache.get<T>(cacheKey);
  
  if (cached !== null) {
    return cached;
  }

  const data = await queryFn();
  queryCache.set(cacheKey, data, ttlSeconds);
  
  return data;
}

/**
 * Invalider le cache après mutation
 */
export function invalidateCache(patterns: string[]): void {
  for (const pattern of patterns) {
    queryCache.invalidate(pattern);
  }
}

// ============================================
// STATISTIQUES RAPIDES AVEC CACHE
// ============================================

/**
 * Obtenir les stats globales avec cache
 */
export async function getGlobalStats() {
  return getCached(
    'global:stats',
    async () => {
      const [
        totalEtablissements,
        totalEvenements,
        totalReclamations,
        totalUtilisateurs,
      ] = await Promise.all([
        prisma.etablissement.count({ where: { isPublie: true } }),
        prisma.evenement.count({ where: { statut: 'PUBLIEE' } }),
        prisma.reclamation.count(),
        prisma.user.count({ where: { isActive: true } }),
      ]);

      return {
        totalEtablissements,
        totalEvenements,
        totalReclamations,
        totalUtilisateurs,
        updatedAt: new Date().toISOString(),
      };
    },
    60 // Cache 1 minute
  );
}

/**
 * Obtenir les communes avec cache long
 */
export async function getCommunesCached() {
  return getCached(
    'communes:all',
    async () => {
      return prisma.commune.findMany({
        select: {
          id: true,
          nom: true,
          code: true,
        },
        orderBy: { nom: 'asc' },
      });
    },
    3600 // Cache 1 heure - données rarement modifiées
  );
}

/**
 * Obtenir les annexes avec cache long
 */
export async function getAnnexesCached() {
  return getCached(
    'annexes:all',
    async () => {
      return prisma.annexe.findMany({
        select: {
          id: true,
          nom: true,
          code: true,
          communeId: true,
        },
        orderBy: { nom: 'asc' },
      });
    },
    3600 // Cache 1 heure
  );
}

// ============================================
// BATCH QUERIES
// ============================================

/**
 * Charger plusieurs entités en une seule requête
 */
export async function batchLoadEtablissements(ids: number[]) {
  if (ids.length === 0) return [];
  
  return prisma.etablissement.findMany({
    where: { id: { in: ids } },
    select: etablissementListSelect,
  });
}

/**
 * Précharger les données liées pour éviter N+1
 */
export async function preloadRelatedData(etablissementIds: number[]) {
  const [evaluationCounts, evenementCounts, reclamationCounts] = await Promise.all([
    prisma.evaluation.groupBy({
      by: ['etablissementId'],
      where: { etablissementId: { in: etablissementIds } },
      _count: { id: true },
    }),
    prisma.evenement.groupBy({
      by: ['etablissementId'],
      where: { etablissementId: { in: etablissementIds } },
      _count: { id: true },
    }),
    prisma.reclamation.groupBy({
      by: ['etablissementId'],
      where: { etablissementId: { in: etablissementIds } },
      _count: { id: true },
    }),
  ]);

  return {
    evaluations: Object.fromEntries(
      evaluationCounts.map(e => [e.etablissementId, e._count.id])
    ),
    evenements: Object.fromEntries(
      evenementCounts.map(e => [e.etablissementId, e._count.id])
    ),
    reclamations: Object.fromEntries(
      reclamationCounts.map(e => [e.etablissementId, e._count.id])
    ),
  };
}
