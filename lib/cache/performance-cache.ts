/**
 * PERFORMANCE CACHE - In-Memory Caching for API Optimization
 *
 * This module provides a simple yet effective in-memory cache
 * for frequently accessed, rarely changing data like:
 * - Communes list
 * - Etablissements list (with short TTL)
 * - Stats aggregations
 *
 * Strategy: stale-while-revalidate
 * → Retourne immédiatement les données (même expirées)
 * → Recharge en arrière-plan pour la prochaine requête
 * → Évite les blocages et les pics de latence
 *
 * For production with multiple instances, replace with Redis.
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  /** true si un refresh est déjà en cours (évite les stampedes) */
  refreshing?: boolean;
}

class PerformanceCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private cleanupInterval: NodeJS.Timer | null = null;

  // Stats internes
  private hits = 0;
  private misses = 0;
  private staleHits = 0;

  constructor() {
    // Cleanup expired entries every minute
    if (typeof setInterval !== 'undefined') {
      this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
    }
  }

  /**
   * Get cached data or execute fetcher if cache miss/expired.
   *
   * Stratégie stale-while-revalidate :
   * - Cache fresh → retourne immédiatement
   * - Cache stale → retourne les données périmées + recharge en arrière-plan
   * - Cache absent → attend le fetcher (cold start)
   */
  async getOrFetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlSeconds: number = 60
  ): Promise<T> {
    const now = Date.now();
    const cached = this.cache.get(key);
    const isFresh = cached && now - cached.timestamp < cached.ttl * 1000;
    const isStale = cached && !isFresh;

    // Cache fresh → retour immédiat
    if (isFresh) {
      this.hits++;
      return cached.data as T;
    }

    // Cache stale mais refresh déjà en cours → retourner les stale sans relancer
    if (isStale && cached.refreshing) {
      this.staleHits++;
      return cached.data as T;
    }

    // Cache stale → retour immédiat des vieilles données + recharge en arrière-plan
    if (isStale && !cached.refreshing) {
      this.staleHits++;
      // Marquer comme en cours de refresh pour éviter les appels simultanés (stampede)
      cached.refreshing = true;
      // Recharge silencieuse en arrière-plan
      fetcher()
        .then((data) => {
          this.cache.set(key, {
            data,
            timestamp: Date.now(),
            ttl: ttlSeconds,
            refreshing: false,
          });
        })
        .catch((err) => {
          console.warn(`[Cache] Background refresh failed for "${key}":`, err);
          if (cached) cached.refreshing = false;
        });
      return cached.data as T;
    }

    // Cache absent (cold start) → attendre le fetcher
    this.misses++;
    const data = await fetcher();
    this.cache.set(key, {
      data,
      timestamp: now,
      ttl: ttlSeconds,
    });

    return data;
  }

  /**
   * Invalidate a specific cache key
   */
  invalidate(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Invalidate all cache entries matching a pattern
   */
  invalidatePattern(pattern: string): void {
    // Whitelist de patterns autorisés (préfixes simples uniquement)
    if (!pattern || pattern.length > 100) return;

    // Rejeter les patterns avec constructions ReDoS connues
    const DANGEROUS_PATTERNS = /(\.\*|\+|\?){2,}|(\(.*\)){2,}|(\[.*\]){2,}/;
    if (DANGEROUS_PATTERNS.test(pattern)) {
      console.warn('[Cache] Pattern potentiellement dangereux rejeté:', pattern);
      return;
    }

    // Option plus sûre : utiliser startsWith/includes à la place de RegExp
    for (const key of this.cache.keys()) {
      if (key.startsWith(pattern) || key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
    this.staleHits = 0;
  }

  /**
   * Get cache stats (pour monitoring et debug)
   */
  getStats(): {
    size: number;
    keys: string[];
    hits: number;
    misses: number;
    staleHits: number;
    hitRate: string;
  } {
    const total = this.hits + this.misses + this.staleHits;
    const hitRate =
      total > 0
        ? (((this.hits + this.staleHits) / total) * 100).toFixed(1) + '%'
        : '0%';
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      hits: this.hits,
      misses: this.misses,
      staleHits: this.staleHits,
      hitRate,
    };
  }

  /**
   * Cleanup expired entries (conservatif : garde les stale entries plus longtemps)
   */
  private cleanup(): void {
    const now = Date.now();
    const entries = Array.from(this.cache.entries());
    for (const [key, entry] of entries) {
      // Supprime uniquement les entrées 10x plus vieilles que leur TTL
      if (now - entry.timestamp > entry.ttl * 10 * 1000) {
        this.cache.delete(key);
      }
    }
  }
}

// Singleton instance
export const performanceCache = new PerformanceCache();

// Cache TTL configurations (in seconds)
export const CACHE_TTL = {
  COMMUNES: 3600, // 1 hour - rarely changes
  DELEGATIONS: 3600, // 1 hour
  SECTEURS: 3600, // 1 hour
  ETABLISSEMENTS: 300, // 5 minutes
  EVENEMENTS: 60, // 1 minute
  ACTUALITES: 60, // 1 minute
  STATS: 120, // 2 minutes
  HEALTH: 10, // 10 seconds
  MAINTENANCE: 60, // 1 minute
  ANNOUNCEMENT: 300, // 5 minutes
};

// Cache key generators
export const cacheKey = {
  communes: () => 'communes:all',
  delegations: () => 'delegations:all',
  secteurs: () => 'secteurs:all',
  etablissements: (params: string) => `etablissements:${params}`,
  evenements: (params: string) => `evenements:${params}`,
  actualites: (params: string) => `actualites:${params}`,
  stats: (type: string) => `stats:${type}`,
  health: () => 'health:status',
  maintenance: () => 'maintenance:status',
  announcement: () => 'announcement:config',
};
