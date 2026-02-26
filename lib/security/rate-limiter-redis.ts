/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║          RATE LIMITER AVEC REDIS - PORTAIL MEDIOUNA                         ║
 * ║                    Rate Limiting Distribué pour Multi-Instance              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 * 
 * Ce module implémente un rate limiter utilisant Redis pour permettre
 * un rate limiting cohérent sur plusieurs instances de l'application.
 * 
 * Configuration requise dans .env:
 *   REDIS_URL=redis://localhost:6379
 */

import Redis from 'ioredis';

// ============================================
// CONFIGURATION
// ============================================

interface RateLimitConfig {
  windowMs: number;      // Fenêtre de temps en millisecondes
  maxRequests: number;   // Nombre max de requêtes dans la fenêtre
  keyPrefix?: string;    // Préfixe pour les clés Redis
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: Date;
  retryAfterSeconds?: number;
}

// Valeurs par défaut
const DEFAULT_CONFIG: RateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100,
  keyPrefix: 'ratelimit:',
};

// ============================================
// CLIENT REDIS
// ============================================

let redisClient: Redis | null = null;
let redisAvailable = false;

/**
 * Initialise la connexion Redis
 */
export function initRedis(): Redis | null {
  const redisUrl = process.env.REDIS_URL;
  
  if (!redisUrl) {
    console.warn('[RATE_LIMITER] REDIS_URL non configuré - utilisation du rate limiting en mémoire');
    return null;
  }
  
  try {
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: true,
    });
    
    redisClient.on('connect', () => {
      console.log('[RATE_LIMITER] ✅ Connecté à Redis');
      redisAvailable = true;
    });
    
    redisClient.on('error', (err) => {
      console.error('[RATE_LIMITER] ❌ Erreur Redis:', err.message);
      redisAvailable = false;
    });
    
    redisClient.on('close', () => {
      console.log('[RATE_LIMITER] Connexion Redis fermée');
      redisAvailable = false;
    });
    
    // Tenter la connexion
    redisClient.connect().catch(() => {
      console.warn('[RATE_LIMITER] Impossible de se connecter à Redis');
    });
    
    return redisClient;
  } catch (error) {
    console.error('[RATE_LIMITER] Erreur initialisation Redis:', error);
    return null;
  }
}

/**
 * Vérifie si Redis est disponible
 */
export function isRedisAvailable(): boolean {
  return redisAvailable && redisClient !== null;
}

/**
 * Obtient le client Redis
 */
export function getRedisClient(): Redis | null {
  if (!redisClient) {
    initRedis();
  }
  return redisClient;
}

// ============================================
// RATE LIMITER REDIS
// ============================================

/**
 * Vérifie le rate limit pour une clé donnée
 * Utilise l'algorithme "Sliding Window"
 */
export async function checkRateLimitRedis(
  key: string,
  config: Partial<RateLimitConfig> = {}
): Promise<RateLimitResult> {
  const { windowMs, maxRequests, keyPrefix } = { ...DEFAULT_CONFIG, ...config };
  const fullKey = `${keyPrefix}${key}`;
  const now = Date.now();
  const windowStart = now - windowMs;
  
  const client = getRedisClient();
  
  // Fallback vers le rate limiting en mémoire si Redis n'est pas disponible
  if (!client || !redisAvailable) {
    return checkRateLimitMemory(key, { windowMs, maxRequests });
  }
  
  try {
    // Transaction Redis atomique
    const pipeline = client.pipeline();
    
    // Supprimer les entrées expirées
    pipeline.zremrangebyscore(fullKey, 0, windowStart);
    
    // Compter les requêtes dans la fenêtre
    pipeline.zcard(fullKey);
    
    // Ajouter la nouvelle requête
    pipeline.zadd(fullKey, now.toString(), `${now}`);
    
    // Définir l'expiration de la clé
    pipeline.pexpire(fullKey, windowMs);
    
    const results = await pipeline.exec();
    
    // Le zcard retourne le nombre de requêtes
    const requestCount = (results?.[1]?.[1] as number) || 0;
    
    const allowed = requestCount < maxRequests;
    const remaining = Math.max(0, maxRequests - requestCount - 1);
    const resetTime = new Date(now + windowMs);
    
    return {
      allowed,
      remaining,
      resetTime,
      retryAfterSeconds: allowed ? undefined : Math.ceil(windowMs / 1000),
    };
  } catch (error) {
    console.error('[RATE_LIMITER] Erreur Redis:', error);
    // Fallback vers mémoire en cas d'erreur
    return checkRateLimitMemory(key, { windowMs, maxRequests });
  }
}

// ============================================
// RATE LIMITER EN MÉMOIRE (FALLBACK)
// ============================================

// Store en mémoire pour le fallback
const memoryStore = new Map<string, number[]>();

/**
 * Rate limiting en mémoire (fallback si Redis n'est pas disponible)
 */
function checkRateLimitMemory(
  key: string,
  config: RateLimitConfig
): RateLimitResult {
  const { windowMs, maxRequests } = config;
  const now = Date.now();
  const windowStart = now - windowMs;
  
  // Récupérer les timestamps existants
  let timestamps = memoryStore.get(key) || [];
  
  // Filtrer les timestamps expirés
  timestamps = timestamps.filter(ts => ts > windowStart);
  
  const allowed = timestamps.length < maxRequests;
  
  if (allowed) {
    timestamps.push(now);
    memoryStore.set(key, timestamps);
  }
  
  return {
    allowed,
    remaining: Math.max(0, maxRequests - timestamps.length),
    resetTime: new Date(now + windowMs),
    retryAfterSeconds: allowed ? undefined : Math.ceil(windowMs / 1000),
  };
}

// Nettoyage périodique du store en mémoire
setInterval(() => {
  const now = Date.now();
  const defaultWindow = DEFAULT_CONFIG.windowMs;
  
  memoryStore.forEach((timestamps: number[], key: string) => {
    const filtered = timestamps.filter((ts: number) => ts > now - defaultWindow);
    if (filtered.length === 0) {
      memoryStore.delete(key);
    } else {
      memoryStore.set(key, filtered);
    }
  });
}, 60 * 1000); // Toutes les minutes

// ============================================
// RATE LIMITERS PRÉ-CONFIGURÉS
// ============================================

/**
 * Rate limiter pour les tentatives de login
 * Plus strict : 5 tentatives par 15 minutes
 */
export async function checkLoginRateLimit(identifier: string): Promise<RateLimitResult> {
  return checkRateLimitRedis(`login:${identifier}`, {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
  });
}

/**
 * Rate limiter pour les APIs générales
 * Standard : 100 requêtes par minute
 */
export async function checkApiRateLimit(ip: string): Promise<RateLimitResult> {
  return checkRateLimitRedis(`api:${ip}`, {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
  });
}

/**
 * Rate limiter pour l'API mobile
 * Modéré : 30 requêtes par minute
 */
export async function checkMobileApiRateLimit(ip: string): Promise<RateLimitResult> {
  return checkRateLimitRedis(`mobile:${ip}`, {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30,
  });
}

/**
 * Rate limiter pour la création de réclamations
 * Restrictif : 5 par heure
 */
export async function checkReclamationRateLimit(userId: number): Promise<RateLimitResult> {
  return checkRateLimitRedis(`reclamation:user:${userId}`, {
    windowMs: 60 * 60 * 1000, // 1 heure
    maxRequests: 5,
  });
}

/**
 * Rate limiter pour les inscriptions
 * Très restrictif : 3 par heure par IP
 */
export async function checkRegistrationRateLimit(ip: string): Promise<RateLimitResult> {
  return checkRateLimitRedis(`register:${ip}`, {
    windowMs: 60 * 60 * 1000, // 1 heure
    maxRequests: 3,
  });
}

/**
 * Rate limiter pour les réinitialisations de mot de passe
 * Restrictif : 3 par heure
 */
export async function checkPasswordResetRateLimit(email: string): Promise<RateLimitResult> {
  return checkRateLimitRedis(`reset:${email.toLowerCase()}`, {
    windowMs: 60 * 60 * 1000, // 1 heure
    maxRequests: 3,
  });
}

// ============================================
// MIDDLEWARE HELPER
// ============================================

/**
 * Crée un middleware de rate limiting pour les API routes
 */
export function createRateLimitMiddleware(config: Partial<RateLimitConfig> = {}) {
  return async function rateLimitMiddleware(
    identifier: string
  ): Promise<{ success: boolean; headers: Record<string, string> }> {
    const result = await checkRateLimitRedis(identifier, config);
    
    const headers: Record<string, string> = {
      'X-RateLimit-Limit': String(config.maxRequests || DEFAULT_CONFIG.maxRequests),
      'X-RateLimit-Remaining': String(result.remaining),
      'X-RateLimit-Reset': result.resetTime.toISOString(),
    };
    
    if (!result.allowed && result.retryAfterSeconds) {
      headers['Retry-After'] = String(result.retryAfterSeconds);
    }
    
    return {
      success: result.allowed,
      headers,
    };
  };
}

// ============================================
// EXPORTS
// ============================================

export default {
  initRedis,
  isRedisAvailable,
  getRedisClient,
  checkRateLimitRedis,
  checkLoginRateLimit,
  checkApiRateLimit,
  checkMobileApiRateLimit,
  checkReclamationRateLimit,
  checkRegistrationRateLimit,
  checkPasswordResetRateLimit,
  createRateLimitMiddleware,
};
