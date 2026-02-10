/**
 * Configuration des Security Headers et CORS
 * Headers de sécurité recommandés pour les applications web modernes
 */

// ============================================
// CORS CONFIGURATION
// ============================================

/** Origines autorisées pour CORS */
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://mediouna-action.gov.ma', // Production
  'https://www.mediouna-action.gov.ma',
  'https://api.mediouna-action.gov.ma',
];

/** Méthodes HTTP autorisées */
const ALLOWED_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'];

/** Headers autorisés dans les requêtes */
const ALLOWED_HEADERS = [
  'Content-Type',
  'Authorization',
  'X-Requested-With',
  'Accept',
  'Origin',
  'Cache-Control',
  'X-CSRF-Token',
];

/** Headers exposés dans les réponses */
const EXPOSED_HEADERS = [
  'X-RateLimit-Remaining',
  'X-RateLimit-Reset',
  'X-Total-Count',
  'Content-Disposition',
];

/**
 * Générer les headers CORS
 */
export function getCorsHeaders(origin: string | null): Record<string, string> {
  const isAllowed = !origin || ALLOWED_ORIGINS.includes(origin) || 
    origin.endsWith('.mediouna-action.gov.ma');
  
  if (!isAllowed) {
    return {};
  }
  
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': ALLOWED_METHODS.join(', '),
    'Access-Control-Allow-Headers': ALLOWED_HEADERS.join(', '),
    'Access-Control-Expose-Headers': EXPOSED_HEADERS.join(', '),
    'Access-Control-Max-Age': '86400', // 24 heures
    'Access-Control-Allow-Credentials': 'true',
  };
}

/**
 * Vérifier si une origine est autorisée
 */
export function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return true; // Same-origin requests
  return ALLOWED_ORIGINS.includes(origin) || 
    origin.endsWith('.mediouna-action.gov.ma');
}

// ============================================
// SECURITY HEADERS
// ============================================

/**
 * Headers de sécurité HTTP standard
 */
export const securityHeaders: Record<string, string> = {
  // Empêche l'interprétation MIME type sniffing
  'X-Content-Type-Options': 'nosniff',
  
  // Protection XSS (legacy, CSP est meilleur)
  'X-XSS-Protection': '1; mode=block',
  
  // Empêche le clickjacking
  'X-Frame-Options': 'SAMEORIGIN',
  
  // Politique de référent
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  
  // Permissions Policy (remplace Feature-Policy)
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(self), interest-cohort=()',
  
  // HTTP Strict Transport Security (HSTS) - production seulement
  // 'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
};

/**
 * Content Security Policy
 * Configurable selon l'environnement
 */
export function getCSPHeader(isDev: boolean = false): string {
  const directives = [
    // Sources par défaut
    "default-src 'self'",
    
    // Scripts
    isDev 
      ? "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com"
      : "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com",
    
    // Styles
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    
    // Images
    "img-src 'self' data: blob: https: http://localhost:*",
    
    // Polices
    "font-src 'self' https://fonts.gstatic.com data:",
    
    // Connexions (APIs)
    `connect-src 'self' https://api.mediouna-action.gov.ma ${isDev ? 'http://localhost:* ws://localhost:*' : ''}`,
    
    // Frames
    "frame-src 'self' https://www.google.com",
    
    // Objets (PDFs, etc.)
    "object-src 'none'",
    
    // Base URI
    "base-uri 'self'",
    
    // Form actions
    "form-action 'self'",
    
    // Upgrade insecure requests en production
    ...(isDev ? [] : ["upgrade-insecure-requests"]),
  ];
  
  return directives.join('; ');
}

/**
 * Tous les headers de sécurité combinés
 */
export function getAllSecurityHeaders(isDev: boolean = false): Record<string, string> {
  return {
    ...securityHeaders,
    'Content-Security-Policy': getCSPHeader(isDev),
    ...(isDev ? {} : {
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    }),
  };
}

// ============================================
// RATE LIMIT HEADERS
// ============================================

export function getRateLimitHeaders(
  remaining: number,
  resetIn: number,
  retryAfter?: number
): Record<string, string> {
  return {
    'X-RateLimit-Limit': '60',
    'X-RateLimit-Remaining': remaining.toString(),
    'X-RateLimit-Reset': Math.ceil(Date.now() / 1000 + resetIn / 1000).toString(),
    ...(retryAfter ? { 'Retry-After': retryAfter.toString() } : {}),
  };
}

// ============================================
// CACHE HEADERS
// ============================================

export const cacheHeaders = {
  /** Données statiques (communes, secteurs) */
  static: {
    'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
  },
  
  /** Données dynamiques (listes, résultats) */
  dynamic: {
    'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
  },
  
  /** Données privées (profil, réclamations) */
  private: {
    'Cache-Control': 'private, no-cache, must-revalidate',
  },
  
  /** Pas de cache (auth, mutations) */
  noCache: {
    'Cache-Control': 'no-store, must-revalidate',
    'Pragma': 'no-cache',
  },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Combiner plusieurs objets de headers
 */
export function mergeHeaders(...headerSets: Record<string, string>[]): Record<string, string> {
  return Object.assign({}, ...headerSets);
}

/**
 * Créer les headers pour une réponse API
 */
export function createApiHeaders(options: {
  cors?: boolean;
  origin?: string | null;
  cache?: 'static' | 'dynamic' | 'private' | 'noCache';
  rateLimit?: { remaining: number; resetIn: number; retryAfter?: number };
  security?: boolean;
}): Record<string, string> {
  const { cors = true, origin, cache = 'dynamic', rateLimit, security = true } = options;
  
  return mergeHeaders(
    cors ? getCorsHeaders(origin || null) : {},
    cacheHeaders[cache],
    rateLimit ? getRateLimitHeaders(rateLimit.remaining, rateLimit.resetIn, rateLimit.retryAfter) : {},
    security ? securityHeaders : {}
  );
}
