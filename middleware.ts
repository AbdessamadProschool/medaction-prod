import {withAuth} from 'next-auth/middleware';
import createMiddleware from 'next-intl/middleware';
import {NextRequest, NextResponse} from 'next/server';
import {crypto} from 'next/dist/compiled/@edge-runtime/primitives'; // Nonce generation support in Edge
import {routing} from './i18n/routing';

// ═══════════════════════════════════════════════════════════
// CVE-2025-29927 MITIGATION — Defence-in-depth layer 1
// Strip x-middleware-subrequest before ANY processing to prevent
// authentication bypass. Next.js 15.2.3 (layer 2) also patches this.
// ═══════════════════════════════════════════════════════════
const BLOCKED_INTERNAL_HEADERS = [
  'x-middleware-subrequest',
  'x-middleware-invoke',
  'x-invoke-path',
  'x-invoke-query',
  'x-invoke-status',
  'x-invoke-output',
  'x-middleware-prefetch',
];

function stripInternalHeaders(request: NextRequest): NextRequest {
  const headers = new Headers(request.headers);
  let stripped = false;
  for (const h of BLOCKED_INTERNAL_HEADERS) {
    if (headers.has(h)) {
      headers.delete(h);
      stripped = true;
      console.warn(`[SECURITY] Stripped forbidden internal header: ${h} from ${request.nextUrl.pathname}`);
    }
  }
  if (!stripped) return request;
  return new NextRequest(request.url, {
    headers,
    method: request.method,
    body: request.body,
    redirect: request.redirect,
    signal: request.signal,
  });
}

/**
 * ════════════════════════════════════════════════════════════════════════════
 * MIDDLEWARE DE SÉCURITÉ ULTRA-PROFESSIONNEL - MEDACTION
 * ════════════════════════════════════════════════════════════════════════════
 * 
 * STRATÉGIE DE SÉCURITÉ:
 * ─────────────────────
 * 1. APIs PUBLIQUES EN LECTURE (GET): Accessibles sans authentification
 * 2. APIs PROTÉGÉES EN ÉCRITURE: Authentification requise + RBAC
 * 3. APIs TOUJOURS PROTÉGÉES: Données sensibles
 * 
 * INTÉGRATION I18N:
 * ─────────────────
 * - Utilise next-intl/middleware pour le routage localisé
 * - Support fr/ar avec préfixe de locale obligatoire
 * - Intégration avec next-auth pour l'authentification
 * 
 * Standards: OWASP Top 10 2021, OWASP API Security Top 10 2023
 * ════════════════════════════════════════════════════════════════════════════
 */

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

type Role = 
  | 'CITOYEN'
  | 'DELEGATION'
  | 'AUTORITE_LOCALE'
  | 'COORDINATEUR_ACTIVITES'
  | 'ADMIN'
  | 'SUPER_ADMIN'
  | 'GOUVERNEUR';

interface RateLimitEntry {
  count: number;
  firstRequest: number;
}

// ═══════════════════════════════════════════════════════════════════
// CONFIGURATION DE SÉCURITÉ
// ═══════════════════════════════════════════════════════════════════

const RATE_LIMIT_CONFIG = {
  windowMs: 60 * 1000, // 1 minute
  publicMaxRequests: 60, // 60 req/min pour APIs publiques
  loginMaxRequests: 5, // 5 tentatives/min pour login
  apiMaxRequests: 200, // 200 req/min pour APIs authentifiées
};

const rateLimitStore = new Map<string, RateLimitEntry>();

// ═══════════════════════════════════════════════════════════════════
// ROUTES PUBLIQUES (Pages accessibles sans authentification)
// ═══════════════════════════════════════════════════════════════════

const PUBLIC_PAGES = [
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/etablissements',
  '/evenements',
  '/actualites',
  '/articles',
  '/carte',
  '/a-propos',
  '/contact',
  '/acces-refuse',
  '/compte-desactive',
  '/maintenance',
  '/recherche',
  '/politique-confidentialite',
  '/conditions-utilisation',
  '/accessibilite',
  '/campagnes',
  '/erreur',
  '/faq',
  '/statistiques-publiques',
  '/explorer',
  '/talents',
  '/suggestions',
];

// ═══════════════════════════════════════════════════════════════════
// APIs PUBLIQUES EN LECTURE (GET sans authentification)
// ═══════════════════════════════════════════════════════════════════

const PUBLIC_READ_API_ROUTES = [
  '/api/etablissements',
  '/api/evenements',
  '/api/actualites',
  '/api/presse',
  '/api/annexes',
  '/api/communes',
  '/api/campagnes',
  '/api/talents',
  '/api/reclamations/statut',
  '/api/maintenance', // Pour la page de maintenance
  '/api/license/check', // Pour la vérification de licence
];

const ALWAYS_PUBLIC_API_ROUTES = [
  '/api/auth',
  '/api/auth/mobile/login',
  '/api/auth/mobile/register',
  '/api/auth/mobile/forgot-password',
  '/api/auth/mobile/refresh',
  '/api/license/check',
];

const SENSITIVE_API_ROUTES = [
  '/api/auth/callback/credentials',
  '/api/auth/mobile/login',
  '/api/auth/register',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/auth/mobile/register',
  '/api/auth/mobile/forgot-password',
];

// ═══════════════════════════════════════════════════════════════════
// APIs MOBILES
// ═══════════════════════════════════════════════════════════════════

const MOBILE_API_ROUTES = [
  '/api/auth/mobile',
  '/api/mobile',
];

// ═══════════════════════════════════════════════════════════════════
// APIs TOUJOURS PROTÉGÉES
// ═══════════════════════════════════════════════════════════════════

const ALWAYS_PROTECTED_API_ROUTES = [
  '/api/users',
  '/api/reclamations',
  '/api/stats',
  '/api/admin',
  '/api/logs',
  '/api/audit',
  '/api/evaluations',
  '/api/dashboard',
];

// ═══════════════════════════════════════════════════════════════════
// ROUTES PROTÉGÉES AVEC RBAC (Pages)
// ═══════════════════════════════════════════════════════════════════

const PROTECTED_ROUTES: Record<string, Role[]> = {
  '/mes-reclamations': ['CITOYEN', 'ADMIN', 'SUPER_ADMIN'],
  '/reclamations/nouvelle': ['CITOYEN', 'ADMIN', 'SUPER_ADMIN'],
  '/mes-evaluations': ['CITOYEN', 'ADMIN', 'SUPER_ADMIN'],
  '/mes-suggestions': ['CITOYEN', 'ADMIN', 'SUPER_ADMIN'],
  '/mon-profil': ['CITOYEN', 'DELEGATION', 'AUTORITE_LOCALE', 'COORDINATEUR_ACTIVITES', 'ADMIN', 'SUPER_ADMIN', 'GOUVERNEUR'],
  '/profil': ['CITOYEN', 'DELEGATION', 'AUTORITE_LOCALE', 'COORDINATEUR_ACTIVITES', 'ADMIN', 'SUPER_ADMIN', 'GOUVERNEUR'],
  '/dashboard': ['ADMIN', 'SUPER_ADMIN', 'GOUVERNEUR', 'DELEGATION'],
  '/dashboard/admin': ['ADMIN', 'SUPER_ADMIN'],
  '/dashboard/gouverneur': ['GOUVERNEUR', 'SUPER_ADMIN'],
  '/dashboard/delegation': ['DELEGATION', 'ADMIN', 'SUPER_ADMIN'],
  '/dashboard/autorite': ['AUTORITE_LOCALE', 'ADMIN', 'SUPER_ADMIN'],
  '/dashboard/coordinateur': ['COORDINATEUR_ACTIVITES', 'ADMIN', 'SUPER_ADMIN'],
  '/dashboard/super-admin': ['SUPER_ADMIN'],
  '/delegation': ['DELEGATION', 'ADMIN', 'SUPER_ADMIN'],
  '/autorite': ['AUTORITE_LOCALE', 'ADMIN', 'SUPER_ADMIN'],
  '/coordinateur': ['COORDINATEUR_ACTIVITES', 'ADMIN', 'SUPER_ADMIN'],
  '/admin': ['ADMIN', 'SUPER_ADMIN'],
  '/super-admin': ['SUPER_ADMIN'],
  '/admin/gestion-admins': ['SUPER_ADMIN'],
  '/admin/parametres': ['SUPER_ADMIN'],
  '/gouverneur': ['GOUVERNEUR', 'SUPER_ADMIN'],
};

// ═══════════════════════════════════════════════════════════════════
// PROTECTION DES MUTATIONS API PAR RÔLE
// ═══════════════════════════════════════════════════════════════════

const API_MUTATION_ROLES: Record<string, Role[]> = {
  '/api/etablissements': ['ADMIN', 'SUPER_ADMIN'],
  '/api/evenements': ['DELEGATION', 'ADMIN', 'SUPER_ADMIN'],
  '/api/actualites': ['DELEGATION', 'ADMIN', 'SUPER_ADMIN'],
  '/api/articles': ['DELEGATION', 'ADMIN', 'SUPER_ADMIN'],
  '/api/campagnes': ['ADMIN', 'SUPER_ADMIN'],
  '/api/communes': ['SUPER_ADMIN'],
};

// ═══════════════════════════════════════════════════════════════════
// MIDDLEWARE NEXT-INTL
// ═══════════════════════════════════════════════════════════════════

const handleI18nRouting = createMiddleware(routing);

// ═══════════════════════════════════════════════════════════════════
// FONCTIONS UTILITAIRES
// ═══════════════════════════════════════════════════════════════════

function isPublicPage(pathname: string): boolean {
  const normalizedPath = pathname.length > 1 && pathname.endsWith('/') 
    ? pathname.slice(0, -1) 
    : pathname;

  return PUBLIC_PAGES.some((route) => {
    if (route === '/') {
      return normalizedPath === '/';
    }
    return normalizedPath === route || normalizedPath.startsWith(`${route}/`);
  });
}

function isAlwaysPublicApiRoute(pathname: string): boolean {
  return ALWAYS_PUBLIC_API_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

function isPublicReadApiRoute(pathname: string): boolean {
  return PUBLIC_READ_API_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

function isMobileApiRoute(pathname: string): boolean {
  return MOBILE_API_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

function isAlwaysProtectedApiRoute(pathname: string): boolean {
  return ALWAYS_PROTECTED_API_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

function isSensitiveApiRoute(pathname: string): boolean {
  return SENSITIVE_API_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

function getProtectedRouteRoles(pathname: string): Role[] | undefined {
  for (const [route, roles] of Object.entries(PROTECTED_ROUTES)) {
    if (pathname === route || pathname.startsWith(`${route}/`)) {
      return roles;
    }
  }
  return undefined;
}

function getMutationRoles(pathname: string): Role[] | undefined {
  for (const [route, roles] of Object.entries(API_MUTATION_ROLES)) {
    if (pathname === route || pathname.startsWith(`${route}/`)) {
      return roles;
    }
  }
  return undefined;
}

function isApiRoute(pathname: string): boolean {
  return pathname.startsWith('/api');
}

function isReadOnlyMethod(method: string): boolean {
  return method === 'GET' || method === 'HEAD' || method === 'OPTIONS';
}

function isMutationMethod(method: string): boolean {
  return ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
}

function getClientIP(request: NextRequest): string {
  // 1. Priorité absolue : l'IP détectée par la plateforme/runtime
  if ((request as any).ip) return (request as any).ip;

  // 2. En production, on ne fait pas confiance aux en-têtes HTTP arbitraires
  // car ils peuvent être falsifiés par le client si le proxy n'est pas configuré pour les écraser.
  if (process.env.NODE_ENV === 'production') {
    return 'proxied-unknown';
  }

  // 3. En développement ou environnements spécifiques, on vérifie les headers standards
  const realIP = request.headers.get('x-real-ip');
  if (realIP) return realIP;

  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const ips = forwarded.split(',').map(ip => ip.trim());
    return ips[ips.length - 1];
  }

  return 'unknown';
}


async function checkRateLimit(
  ip: string, 
  type: 'public' | 'api' | 'login' = 'api'
): Promise<{ allowed: boolean; remaining: number }> {
  let maxRequests = RATE_LIMIT_CONFIG.apiMaxRequests;
  if (type === 'public') maxRequests = RATE_LIMIT_CONFIG.publicMaxRequests;
  if (type === 'login') maxRequests = RATE_LIMIT_CONFIG.loginMaxRequests;

  const key = `rate-limit:${type}:${ip}`;
  
  // Si Upstash Redis est configuré
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    try {
      const { Redis } = await import('@upstash/redis');
      const redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL!,
        token: process.env.UPSTASH_REDIS_REST_TOKEN!,
        enableTelemetry: false, // Prevents "process.version" usage in Edge Runtime
      });
      
      const requests = await redis.incr(key);
      if (requests === 1) {
        await redis.expire(key, Math.floor(RATE_LIMIT_CONFIG.windowMs / 1000));
      }
      
      if (requests > maxRequests) {
        return { allowed: false, remaining: 0 };
      }
      return { allowed: true, remaining: maxRequests - requests };
    } catch (e) {
      console.warn('Erreur Upstash Redis, fallback vers mémoire locale.', e);
    }
  }

  // Fallback En mémoire
  const now = Date.now();
  const entry = rateLimitStore.get(key);
  
  if (!entry || (now - entry.firstRequest) > RATE_LIMIT_CONFIG.windowMs) {
    rateLimitStore.set(key, { count: 1, firstRequest: now });
    return { allowed: true, remaining: maxRequests - 1 };
  }
  
  if (entry.count >= maxRequests) {
    return { allowed: false, remaining: 0 };
  }
  
  entry.count++;
  return { allowed: true, remaining: maxRequests - entry.count };
}

function addSecurityHeaders(response: NextResponse, nonce?: string): NextResponse {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  if (nonce) {
    // BLOC 6.4 - Strict CSP with Nonce (CWE-79 mitigation)
    const isDev = process.env.NODE_ENV === 'development';
    const cspValue = `
      default-src 'self';
      script-src 'self' 'nonce-${nonce}' 'strict-dynamic' ${isDev ? "'unsafe-eval'" : ""} https://www.googletagmanager.com https://www.google-analytics.com https://api.mapbox.com https://cdn.jsdelivr.net;
      style-src 'self' 'nonce-${nonce}' https://fonts.googleapis.com https://api.mapbox.com;
      img-src 'self' blob: data: https: http:;
      font-src 'self' https://fonts.gstatic.com data:;
      connect-src 'self' https://www.google-analytics.com https://api.mapbox.com https://*.sentry.io wss://*.mapbox.com;
      object-src 'none';
      base-uri 'self';
      form-action 'self';
      frame-ancestors 'none';
      upgrade-insecure-requests;
    `.replace(/\s{2,}/g, ' ').trim();
    
    response.headers.set('Content-Security-Policy', cspValue);
    response.headers.set('x-nonce', nonce);
  }

  response.headers.delete('X-Powered-By');
  response.headers.delete('Server');
  return response;
}

function createApiErrorResponse(
  status: number, 
  message: string, 
  code: string = 'ERROR',
  nonce?: string
): NextResponse {
  const response = NextResponse.json(
    { 
      success: false,
      error: {
        code,
        message,
        timestamp: new Date().toISOString(),
      }
    },
    { status }
  );
  return addSecurityHeaders(response, nonce);
}

function stripLocaleFromPath(pathname: string): string {
  const localePattern = /^\/(fr|ar)(\/|$)/;
  const match = pathname.match(localePattern);
  if (match) {
    return pathname.replace(localePattern, '/').replace(/^\/$/, '/') || '/';
  }
  return pathname;
}

function getLocale(req: NextRequest): string {
  const pathname = req.nextUrl.pathname;
  const match = pathname.match(/^\/(fr|ar)(\/|$)/);
  if (match) return match[1];
  
  const cookieLocale = req.cookies.get('NEXT_LOCALE')?.value;
  if (cookieLocale && (routing.locales as readonly string[]).includes(cookieLocale)) {
    return cookieLocale;
  }
  
  return routing.defaultLocale;
}

// ═══════════════════════════════════════════════════════════════════
// MIDDLEWARE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════

const authMiddleware = withAuth(
  async function middleware(req) {
    // ═══════════════════════════════════════════════════════════
    // CVE-2025-29927 — Strip internal headers FIRST
    // ═══════════════════════════════════════════════════════════
    req = stripInternalHeaders(req);

    // BLOC 6.4 - Generate per-request nonce
    const nonce = Buffer.from(crypto.randomUUID()).toString('base64');

    const { pathname } = req.nextUrl;
    const method = req.method;

    // ─────────────────────────────────────────────────────────────────
    // 0. BLOCAGE DES VERBES HTTP DANGEREUX (Verb Tampering)
    // ─────────────────────────────────────────────────────────────────
    const forbiddenMethods = ['TRACE', 'TRACK', 'CONNECT'];
    if (forbiddenMethods.includes(method)) {
      return createApiErrorResponse(405, 'HTTP method not allowed', 'METHOD_NOT_ALLOWED', nonce);
    }

    const token = req.nextauth.token;
    const clientIP = getClientIP(req);
    const isApi = isApiRoute(pathname);
    
    // Extraire le chemin sans locale pour les vérifications
    const effectivePathname = isApi ? pathname : stripLocaleFromPath(pathname);
    const locale = getLocale(req);
    
    // ─────────────────────────────────────────────────────────────────
    // 1. ROUTES API TOUJOURS PUBLIQUES (Auth, etc.)
    // ─────────────────────────────────────────────────────────────────
    if (isApi && isAlwaysPublicApiRoute(pathname)) {
      const response = NextResponse.next();
      return addSecurityHeaders(response, nonce);
    }
    
    // ─────────────────────────────────────────────────────────────────
    // 2. PAGES PUBLIQUES - Déléguer à next-intl
    // ─────────────────────────────────────────────────────────────────
    if (!isApi && isPublicPage(effectivePathname)) {
      const response = handleI18nRouting(req);
      return addSecurityHeaders(response, nonce);
    }
    
    // ─────────────────────────────────────────────────────────────────
    // 3. APIs MOBILES
    // ─────────────────────────────────────────────────────────────────
    if (isApi && isMobileApiRoute(pathname)) {
      const rateLimit = await checkRateLimit(clientIP, 'api');
      
      if (!rateLimit.allowed) {
        return createApiErrorResponse(429, 'Too many requests. Please try again later.', 'RATE_LIMIT_EXCEEDED', nonce);
      }
      
      const response = NextResponse.next();
      response.headers.set('X-RateLimit-Remaining', String(rateLimit.remaining));
      response.headers.set('X-Mobile-API', 'true');
      return addSecurityHeaders(response, nonce);
    }
    
    // ─────────────────────────────────────────────────────────────────
    // 0. PROTECTION DES ROUTES DE DÉVELOPPEMENT ET TEST
    // ─────────────────────────────────────────────────────────────────
    if (pathname.startsWith('/api/dev') || pathname.startsWith('/api/test-db')) {
      if (process.env.NODE_ENV === 'production') {
        return createApiErrorResponse(404, 'Not Found', 'NOT_FOUND', nonce);
      }
    }

    // 1. RATE LIMITING (Sécurité anti-DoS)
    // ─────────────────────────────────────────────────────────────────
    let rateLimitType: 'public' | 'api' | 'login' = 'api';
    if (isApi && isPublicReadApiRoute(pathname) && isReadOnlyMethod(method)) {
      rateLimitType = 'public';
    } else if (isApi && isSensitiveApiRoute(pathname)) {
      rateLimitType = 'login';
    }

    const rateLimit = await checkRateLimit(clientIP, rateLimitType);
    
    if (!rateLimit.allowed) {
      if (isApi) {
        return createApiErrorResponse(429, 'Too many requests. Please try again later.', 'RATE_LIMIT_EXCEEDED', nonce);
      }
      return NextResponse.redirect(new URL(`/${locale}/erreur?code=429`, req.url));
    }
    
    // ─────────────────────────────────────────────────────────────────
    // 5. APIs PUBLIQUES EN LECTURE (GET sans auth)
    // ─────────────────────────────────────────────────────────────────
    if (isApi && isPublicReadApiRoute(pathname) && isReadOnlyMethod(method)) {
      const response = NextResponse.next();
      response.headers.set('X-RateLimit-Remaining', String(rateLimit.remaining));
      response.headers.set('X-Public-API', 'true');
      response.headers.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
      return addSecurityHeaders(response, nonce);
    }
    
    // ─────────────────────────────────────────────────────────────────
    // 6. APIs TOUJOURS PROTÉGÉES
    // ─────────────────────────────────────────────────────────────────
    if (isApi && isAlwaysProtectedApiRoute(pathname)) {
      if (!token) {
        return createApiErrorResponse(
          401,
          'Authentication required. This endpoint contains sensitive data.',
          'AUTHENTICATION_REQUIRED'
        );
      }
      
      if (!token.isActive) {
        return createApiErrorResponse(403, 'Your account has been deactivated.', 'ACCOUNT_DEACTIVATED', nonce);
      }
    }
    
    // ─────────────────────────────────────────────────────────────────
    // 7. MUTATIONS SUR APIs PUBLIQUES
    // ─────────────────────────────────────────────────────────────────
    if (isApi && isPublicReadApiRoute(pathname) && isMutationMethod(method)) {
      if (!token) {
        return createApiErrorResponse(
          401,
          'Authentication required for write operations.',
          'AUTHENTICATION_REQUIRED'
        );
      }
      
      if (!token.isActive) {
        return createApiErrorResponse(403, 'Your account has been deactivated.', 'ACCOUNT_DEACTIVATED', nonce);
      }
      
      const allowedRoles = getMutationRoles(pathname);
      if (allowedRoles) {
        const userRole = token.role as Role;
        const isPublicAction = pathname.match(/\/(vues|likes)$/);
        
        if (!allowedRoles.includes(userRole) && !isPublicAction && userRole !== 'GOUVERNEUR') {
          return createApiErrorResponse(
            403,
            'Access denied. You do not have the required permissions for this action.',
            'ACCESS_DENIED'
          );
        }
      }
    }
    
    // ─────────────────────────────────────────────────────────────────
    // 8. AUTRES ROUTES API (Protection par défaut)
    // ─────────────────────────────────────────────────────────────────
    if (isApi && !isPublicReadApiRoute(pathname) && !isAlwaysPublicApiRoute(pathname)) {
      if (!token) {
        return createApiErrorResponse(401, 'Authentication required.', 'AUTHENTICATION_REQUIRED', nonce);
      }
      
      if (!token.isActive) {
        return createApiErrorResponse(403, 'Your account has been deactivated.', 'ACCOUNT_DEACTIVATED', nonce);
      }

      // Hardening: Si c'est un segment sensible non listé explicitement
      const sensitiveSegments = ['/api/admin', '/api/super-admin', '/api/gouverneur', '/api/logs', '/api/audit', '/api/settings'];
      const userRole = token.role as Role;
      
      if (sensitiveSegments.some(seg => pathname.startsWith(seg))) {
        const adminRoles: Role[] = ['ADMIN', 'SUPER_ADMIN'];
        const gouverneurRoles: Role[] = ['GOUVERNEUR', 'SUPER_ADMIN'];
        
        if (pathname.startsWith('/api/gouverneur') && !gouverneurRoles.includes(userRole)) {
          return createApiErrorResponse(403, 'Access denied.', 'ACCESS_DENIED', nonce);
        }
        
        if ((pathname.startsWith('/api/admin') || pathname.startsWith('/api/super-admin')) && !adminRoles.includes(userRole)) {
          if (pathname.startsWith('/api/admin/bilans') && userRole === 'GOUVERNEUR') {
             // Let GOUVERNEUR access bilans explicitly
          } else {
             return createApiErrorResponse(403, 'Access denied.', 'ACCESS_DENIED', nonce);
          }
        }
      }
    }
    
    // ─────────────────────────────────────────────────────────────────
    // 9. PAGES PROTÉGÉES (vérification RBAC)
    // ─────────────────────────────────────────────────────────────────
    if (!isApi) {
      if (!token) {
        const loginUrl = new URL(`/${locale}/login`, req.url);
        loginUrl.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(loginUrl);
      }
      
      if (!token.isActive) {
        return NextResponse.redirect(new URL(`/${locale}/compte-desactive`, req.url));
      }
      
      const allowedRoles = getProtectedRouteRoles(effectivePathname);
      if (allowedRoles) {
        const userRole = token.role as Role;
        if (!allowedRoles.includes(userRole)) {
          return NextResponse.redirect(new URL(`/${locale}/acces-refuse`, req.url));
        }
      }
    }
    
    // ─────────────────────────────────────────────────────────────────
    // 10. REQUÊTE AUTORISÉE
    // ─────────────────────────────────────────────────────────────────
    if (isApi) {
      const response = NextResponse.next();
      response.headers.set('X-RateLimit-Remaining', String(rateLimit.remaining));
      response.headers.set('X-Request-ID', crypto.randomUUID());
      return addSecurityHeaders(response, nonce);
    } else {
      const response = handleI18nRouting(req);
      response.headers.set('X-Request-ID', crypto.randomUUID());
      return addSecurityHeaders(response, nonce);
    }
  },
  {
    callbacks: {
      authorized: () => true, // Gestion manuelle dans le middleware
    },
  }
);

// ═══════════════════════════════════════════════════════════════════
// EXPORT DU MIDDLEWARE
// ═══════════════════════════════════════════════════════════════════

export default authMiddleware;

// ═══════════════════════════════════════════════════════════════════
// CONFIGURATION DU MATCHER
// ═══════════════════════════════════════════════════════════════════

export const config = {
  // Match all pathnames except:
  // - API routes starting with /api (handled separately)
  // - Next.js internals (_next)
  // - Static files with extensions
  matcher: ['/((?!_next|_vercel|.*\\..*).*)'],
};
