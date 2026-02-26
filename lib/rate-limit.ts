/**
 * Rate Limiting et Protection
 * - Rate limiting par IP et utilisateur
 * - Throttling pour les uploads
 * - Protection contre les abus
 */

export interface RateLimitConfig {
  maxRequests: number; // Nombre max de requêtes
  windowMs: number;    // Fenêtre de temps en ms
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetIn: number;    // ms avant reset
  retryAfter?: number; // secondes à attendre si bloqué
}

// Configuration par défaut selon le type d'endpoint
export const RATE_LIMIT_CONFIGS = {
  // API standard : 60 requêtes par minute (1 req/sec moyen)
  default: { maxRequests: 60, windowMs: 60000 },
  
  // API sensible (auth) : 10 requêtes par minute
  auth: { maxRequests: 10, windowMs: 60000 },
  
  // Uploads : 20 fichiers par minute
  upload: { maxRequests: 20, windowMs: 60000 },
  
  // API publique haute fréquence : 120 req/minute
  public: { maxRequests: 120, windowMs: 60000 },
  
  // Recherche : 30 requêtes par minute
  search: { maxRequests: 30, windowMs: 60000 },
  
  // API Admin : 200 requêtes par minute
  admin: { maxRequests: 200, windowMs: 60000 },
  
  // Strict : 10 req/sec comme demandé
  strict: { maxRequests: 10, windowMs: 1000 },
} as const;

// ============================================
// STOCKAGE EN MÉMOIRE (sliding window counter)
// ============================================

interface RateLimitEntry {
  tokens: number;
  lastRefill: number;
}

// Map globale pour stocker les compteurs
const rateLimitStore: Map<string, RateLimitEntry> = new Map();

// Nettoyage périodique toutes les 5 minutes
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanupExpiredEntries() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  
  lastCleanup = now;
  const entries = Array.from(rateLimitStore.entries());
  
  for (const [key, entry] of entries) {
    // Supprimer les entrées inactives depuis plus de 10 minutes
    if (now - entry.lastRefill > 10 * 60 * 1000) {
      rateLimitStore.delete(key);
    }
  }
}

// ============================================
// TOKEN BUCKET ALGORITHM
// ============================================

/**
 * Vérifie le rate limit avec l'algorithme Token Bucket
 * Plus smooth que le fixed window counter
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = RATE_LIMIT_CONFIGS.default
): RateLimitResult {
  cleanupExpiredEntries();
  
  const now = Date.now();
  const { maxRequests, windowMs } = config;
  
  // Calculer le taux de recharge (tokens par ms)
  const refillRate = maxRequests / windowMs;
  
  let entry = rateLimitStore.get(identifier);
  
  if (!entry) {
    // Nouvelle entrée avec tous les tokens
    entry = {
      tokens: maxRequests - 1, // -1 pour cette requête
      lastRefill: now,
    };
    rateLimitStore.set(identifier, entry);
    
    return {
      allowed: true,
      remaining: entry.tokens,
      resetIn: windowMs,
    };
  }
  
  // Calculer les tokens rechargés depuis la dernière requête
  const elapsed = now - entry.lastRefill;
  const tokensToAdd = elapsed * refillRate;
  
  // Mettre à jour les tokens (max = maxRequests)
  entry.tokens = Math.min(maxRequests, entry.tokens + tokensToAdd);
  entry.lastRefill = now;
  
  // Vérifier si on peut consommer un token
  if (entry.tokens >= 1) {
    entry.tokens -= 1;
    
    return {
      allowed: true,
      remaining: Math.floor(entry.tokens),
      resetIn: Math.ceil((maxRequests - entry.tokens) / refillRate),
    };
  }
  
  // Pas assez de tokens - calculer le temps d'attente
  const waitTime = Math.ceil((1 - entry.tokens) / refillRate);
  
  return {
    allowed: false,
    remaining: 0,
    resetIn: waitTime,
    retryAfter: Math.ceil(waitTime / 1000),
  };
}

// ============================================
// IDENTIFIANTS RATE LIMIT
// ============================================

/**
 * Générer un identifiant unique pour le rate limiting
 */
export function getRateLimitIdentifier(
  request: Request,
  userId?: string | number
): string {
  // Si l'utilisateur est authentifié, utiliser son ID
  if (userId) {
    return `user:${userId}`;
  }
  
  // Sinon, utiliser l'IP
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0].trim() || 
             request.headers.get('x-real-ip') || 
             'unknown';
  
  return `ip:${ip}`;
}

/**
 * Générer un identifiant composite (endpoint + identifiant)
 */
export function getEndpointRateLimitId(
  endpoint: string,
  baseId: string
): string {
  return `${endpoint}:${baseId}`;
}

// ============================================
// THROTTLING UPLOADS
// ============================================

interface UploadThrottleEntry {
  totalBytes: number;
  fileCount: number;
  lastUpload: number;
}

const uploadThrottleStore: Map<string, UploadThrottleEntry> = new Map();

// Limites uploads
const UPLOAD_LIMITS = {
  maxBytesPerMinute: 50 * 1024 * 1024, // 50 MB par minute
  maxFilesPerMinute: 20,
  maxFileSize: 10 * 1024 * 1024, // 10 MB par fichier
};

/**
 * Vérifier le throttling des uploads
 */
export function checkUploadThrottle(
  identifier: string,
  fileSize: number
): { allowed: boolean; reason?: string } {
  const now = Date.now();
  const windowMs = 60000; // 1 minute
  
  let entry = uploadThrottleStore.get(identifier);
  
  // Vérifier la taille du fichier
  if (fileSize > UPLOAD_LIMITS.maxFileSize) {
    return {
      allowed: false,
      reason: `Taille de fichier trop grande (max ${UPLOAD_LIMITS.maxFileSize / 1024 / 1024}MB)`,
    };
  }
  
  if (!entry || now - entry.lastUpload > windowMs) {
    // Nouvelle fenêtre
    entry = {
      totalBytes: fileSize,
      fileCount: 1,
      lastUpload: now,
    };
    uploadThrottleStore.set(identifier, entry);
    return { allowed: true };
  }
  
  // Vérifier les limites
  if (entry.fileCount >= UPLOAD_LIMITS.maxFilesPerMinute) {
    return {
      allowed: false,
      reason: `Trop de fichiers uploadés (max ${UPLOAD_LIMITS.maxFilesPerMinute} par minute)`,
    };
  }
  
  if (entry.totalBytes + fileSize > UPLOAD_LIMITS.maxBytesPerMinute) {
    return {
      allowed: false,
      reason: `Volume d'upload dépassé (max ${UPLOAD_LIMITS.maxBytesPerMinute / 1024 / 1024}MB par minute)`,
    };
  }
  
  // OK, mettre à jour
  entry.totalBytes += fileSize;
  entry.fileCount += 1;
  entry.lastUpload = now;
  
  return { allowed: true };
}

// ============================================
// EXPORT RATE LIMIT HEADERS
// ============================================

/**
 * Générer les headers de rate limit pour la réponse
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': Math.ceil(result.resetIn / 1000).toString(),
    ...(result.retryAfter ? { 'Retry-After': result.retryAfter.toString() } : {}),
  };
}

// Nettoyage périodique des stores
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    const uploadEntries = Array.from(uploadThrottleStore.entries());
    
    for (const [key, entry] of uploadEntries) {
      if (now - entry.lastUpload > 10 * 60 * 1000) {
        uploadThrottleStore.delete(key);
      }
    }
  }, CLEANUP_INTERVAL);
}
