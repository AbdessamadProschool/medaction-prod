/**
 * PERFORMANCE CACHE - In-Memory Caching for API Optimization
 * 
 * This module provides a simple yet effective in-memory cache
 * for frequently accessed, rarely changing data like:
 * - Communes list
 * - Etablissements list (with short TTL)
 * - Stats aggregations
 * 
 * For production with multiple instances, replace with Redis.
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class PerformanceCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private cleanupInterval: NodeJS.Timer | null = null;

  constructor() {
    // Cleanup expired entries every minute
    if (typeof setInterval !== 'undefined') {
      this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
    }
  }

  /**
   * Get cached data or execute fetcher if cache miss/expired
   */
  async getOrFetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlSeconds: number = 60
  ): Promise<T> {
    const now = Date.now();
    const cached = this.cache.get(key);

    // Cache hit and not expired
    if (cached && now - cached.timestamp < cached.ttl * 1000) {
      return cached.data as T;
    }

    // Cache miss or expired - fetch new data
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
    const regex = new RegExp(pattern);
    const keys = Array.from(this.cache.keys());
    for (const key of keys) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache stats
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }

  /**
   * Cleanup expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    const entries = Array.from(this.cache.entries());
    for (const [key, entry] of entries) {
      if (now - entry.timestamp > entry.ttl * 1000) {
        this.cache.delete(key);
      }
    }
  }
}

// Singleton instance
export const performanceCache = new PerformanceCache();

// Cache TTL configurations (in seconds)
export const CACHE_TTL = {
  COMMUNES: 3600,        // 1 hour - rarely changes
  DELEGATIONS: 3600,     // 1 hour
  SECTEURS: 3600,        // 1 hour
  ETABLISSEMENTS: 300,   // 5 minutes
  EVENEMENTS: 60,        // 1 minute
  ACTUALITES: 60,        // 1 minute
  STATS: 120,            // 2 minutes
  HEALTH: 10,            // 10 seconds
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
};
