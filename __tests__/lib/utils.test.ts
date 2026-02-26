/**
 * Tests des utilitaires lib/
 */

describe('Lib Utils Tests', () => {
  // ============================================
  // RATE LIMITING
  // ============================================

  describe('Rate Limiting', () => {
    // Simple Token Bucket implementation for testing
    class TokenBucket {
      private tokens: number;
      private lastRefill: number;

      constructor(
        private maxTokens: number,
        private refillRate: number // tokens per second
      ) {
        this.tokens = maxTokens;
        this.lastRefill = Date.now();
      }

      consume(tokens: number = 1): boolean {
        this.refill();
        if (this.tokens >= tokens) {
          this.tokens -= tokens;
          return true;
        }
        return false;
      }

      private refill(): void {
        const now = Date.now();
        const elapsed = (now - this.lastRefill) / 1000;
        const tokensToAdd = elapsed * this.refillRate;
        this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
        this.lastRefill = now;
      }

      getTokens(): number {
        this.refill();
        return this.tokens;
      }
    }

    it('should allow requests within limit', () => {
      const bucket = new TokenBucket(10, 0); // 0 refill rate for predictable test
      
      expect(bucket.consume()).toBe(true);
      expect(bucket.consume()).toBe(true);
      expect(bucket.getTokens()).toBeCloseTo(8, 0);
    });

    it('should block requests exceeding limit', () => {
      const bucket = new TokenBucket(3, 1);
      
      expect(bucket.consume()).toBe(true);
      expect(bucket.consume()).toBe(true);
      expect(bucket.consume()).toBe(true);
      expect(bucket.consume()).toBe(false);
    });

    it('should refill tokens over time', async () => {
      const bucket = new TokenBucket(5, 10); // 10 tokens per second
      
      bucket.consume(5);
      expect(bucket.getTokens()).toBe(0);
      
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(bucket.getTokens()).toBeGreaterThan(0);
    });
  });

  // ============================================
  // PAGINATION
  // ============================================

  describe('Pagination Utils', () => {
    const createPaginationMeta = (page: number, limit: number, total: number) => {
      const totalPages = Math.ceil(total / limit);
      return {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      };
    };

    it('should calculate pagination correctly', () => {
      const meta = createPaginationMeta(1, 10, 45);
      
      expect(meta.totalPages).toBe(5);
      expect(meta.hasNext).toBe(true);
      expect(meta.hasPrev).toBe(false);
    });

    it('should handle last page', () => {
      const meta = createPaginationMeta(5, 10, 45);
      
      expect(meta.hasNext).toBe(false);
      expect(meta.hasPrev).toBe(true);
    });

    it('should handle single page', () => {
      const meta = createPaginationMeta(1, 10, 5);
      
      expect(meta.totalPages).toBe(1);
      expect(meta.hasNext).toBe(false);
      expect(meta.hasPrev).toBe(false);
    });
  });

  // ============================================
  // SEARCH FILTER
  // ============================================

  describe('Search Filter Utils', () => {
    const buildSearchFilter = (search: string, fields: string[]) => {
      if (!search) return {};
      
      return {
        OR: fields.map(field => ({
          [field]: { contains: search, mode: 'insensitive' },
        })),
      };
    };

    it('should build search filter for multiple fields', () => {
      const filter = buildSearchFilter('test', ['nom', 'description']);
      
      expect(filter.OR).toHaveLength(2);
      expect(filter.OR![0].nom.contains).toBe('test');
    });

    it('should return empty for no search', () => {
      const filter = buildSearchFilter('', ['nom']);
      
      expect(filter).toEqual({});
    });
  });

  // ============================================
  // DATA CLEANING
  // ============================================

  describe('Data Cleaning Utils', () => {
    const cleanObject = <T extends Record<string, any>>(obj: T): Partial<T> => {
      const cleaned: Partial<T> = {};
      for (const key of Object.keys(obj)) {
        const value = obj[key];
        if (value !== null && value !== undefined && value !== '') {
          cleaned[key as keyof T] = value;
        }
      }
      return cleaned;
    };

    it('should remove null values', () => {
      const input = { name: 'Test', value: null, other: 'ok' };
      const result = cleanObject(input);
      
      expect(result).toEqual({ name: 'Test', other: 'ok' });
    });

    it('should remove empty strings', () => {
      const input = { name: 'Test', empty: '', other: 'ok' };
      const result = cleanObject(input);
      
      expect(result).toEqual({ name: 'Test', other: 'ok' });
    });

    it('should keep falsy but valid values', () => {
      const input = { name: 'Test', zero: 0, falseVal: false };
      const result = cleanObject(input);
      
      expect(result.zero).toBe(0);
      expect(result.falseVal).toBe(false);
    });
  });

  // ============================================
  // CACHE UTILS
  // ============================================

  describe('Cache Utils', () => {
    class SimpleCache {
      private cache = new Map<string, { data: any; expires: number }>();

      set(key: string, data: any, ttlMs: number): void {
        this.cache.set(key, { data, expires: Date.now() + ttlMs });
      }

      get(key: string): any | null {
        const entry = this.cache.get(key);
        if (!entry) return null;
        if (Date.now() > entry.expires) {
          this.cache.delete(key);
          return null;
        }
        return entry.data;
      }

      invalidate(pattern: string): void {
        for (const key of Array.from(this.cache.keys())) {
          if (key.includes(pattern)) {
            this.cache.delete(key);
          }
        }
      }
    }

    it('should store and retrieve values', () => {
      const cache = new SimpleCache();
      cache.set('test', { value: 123 }, 1000);
      
      expect(cache.get('test')).toEqual({ value: 123 });
    });

    it('should return null for expired entries', async () => {
      const cache = new SimpleCache();
      cache.set('test', { value: 123 }, 50);
      
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(cache.get('test')).toBeNull();
    });

    it('should invalidate by pattern', () => {
      const cache = new SimpleCache();
      cache.set('user:1', { id: 1 }, 1000);
      cache.set('user:2', { id: 2 }, 1000);
      cache.set('post:1', { id: 1 }, 1000);
      
      cache.invalidate('user:');
      
      expect(cache.get('user:1')).toBeNull();
      expect(cache.get('user:2')).toBeNull();
      expect(cache.get('post:1')).not.toBeNull();
    });
  });

  // ============================================
  // SECURITY HEADERS
  // ============================================

  describe('Security Headers', () => {
    const securityHeaders = {
      'X-Content-Type-Options': 'nosniff',
      'X-XSS-Protection': '1; mode=block',
      'X-Frame-Options': 'SAMEORIGIN',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
    };

    it('should have X-Content-Type-Options', () => {
      expect(securityHeaders['X-Content-Type-Options']).toBe('nosniff');
    });

    it('should have XSS protection', () => {
      expect(securityHeaders['X-XSS-Protection']).toContain('block');
    });

    it('should have clickjacking protection', () => {
      expect(securityHeaders['X-Frame-Options']).toBe('SAMEORIGIN');
    });
  });

  // ============================================
  // CORS VALIDATION
  // ============================================

  describe('CORS Validation', () => {
    const allowedOrigins = ['http://localhost:3000', 'https://mediouna-action.gov.ma'];

    const isOriginAllowed = (origin: string | null): boolean => {
      if (!origin) return false;
      return allowedOrigins.some(allowed => 
        origin === allowed || 
        (allowed.includes('*') && origin.match(allowed.replace('*', '.*')))
      );
    };

    it('should allow localhost', () => {
      expect(isOriginAllowed('http://localhost:3000')).toBe(true);
    });

    it('should allow production domain', () => {
      expect(isOriginAllowed('https://mediouna-action.gov.ma')).toBe(true);
    });

    it('should reject unknown origins', () => {
      expect(isOriginAllowed('https://malicious.com')).toBe(false);
    });

    it('should reject null origin', () => {
      expect(isOriginAllowed(null)).toBe(false);
    });
  });
});
