import {withAuth} from 'next-auth/middleware';
import createMiddleware from 'next-intl/middleware';
import {NextRequest, NextResponse} from 'next/server';
import {routing} from './i18n/routing';

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
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  
  if (forwarded) return forwarded.split(',')[0].trim();
  if (realIP) return realIP;
  return 'unknown';
}

function checkRateLimit(ip: string, isPublic: boolean = false): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const key = isPublic ? `public:${ip}` : `api:${ip}`;
  const maxRequests = isPublic ? RATE_LIMIT_CONFIG.publicMaxRequests : RATE_LIMIT_CONFIG.apiMaxRequests;
  
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

function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.delete('X-Powered-By');
  response.headers.delete('Server');
  return response;
}

function createApiErrorResponse(
  status: number, 
  message: string, 
  code: string = 'ERROR'
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
  return addSecurityHeaders(response);
}

function stripLocaleFromPath(pathname: string): string {
  const localePattern = /^\/(fr|ar)(\/|$)/;
  const match = pathname.match(localePattern);
  if (match) {
    return pathname.replace(localePattern, '/').replace(/^\/$/, '/') || '/';
  }
  return pathname;
}

function getLocaleFromPath(pathname: string): string {
  const match = pathname.match(/^\/(fr|ar)(\/|$)/);
  return match ? match[1] : routing.defaultLocale;
}

// ═══════════════════════════════════════════════════════════════════
// MIDDLEWARE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════

const authMiddleware = withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const method = req.method;
    const token = req.nextauth.token;
    const clientIP = getClientIP(req);
    const isApi = isApiRoute(pathname);
    
    // Extraire le chemin sans locale pour les vérifications
    const effectivePathname = isApi ? pathname : stripLocaleFromPath(pathname);
    const locale = getLocaleFromPath(pathname);
    
    // ─────────────────────────────────────────────────────────────────
    // 1. ROUTES API TOUJOURS PUBLIQUES (Auth, etc.)
    // ─────────────────────────────────────────────────────────────────
    if (isApi && isAlwaysPublicApiRoute(pathname)) {
      const response = NextResponse.next();
      return addSecurityHeaders(response);
    }
    
    // ─────────────────────────────────────────────────────────────────
    // 2. PAGES PUBLIQUES - Déléguer à next-intl
    // ─────────────────────────────────────────────────────────────────
    if (!isApi && isPublicPage(effectivePathname)) {
      const response = handleI18nRouting(req);
      return addSecurityHeaders(response);
    }
    
    // ─────────────────────────────────────────────────────────────────
    // 3. APIs MOBILES
    // ─────────────────────────────────────────────────────────────────
    if (isApi && isMobileApiRoute(pathname)) {
      const rateLimit = checkRateLimit(clientIP, false);
      
      if (!rateLimit.allowed) {
        return createApiErrorResponse(429, 'Too many requests. Please try again later.', 'RATE_LIMIT_EXCEEDED');
      }
      
      const response = NextResponse.next();
      response.headers.set('X-RateLimit-Remaining', String(rateLimit.remaining));
      response.headers.set('X-Mobile-API', 'true');
      return addSecurityHeaders(response);
    }
    
    // ─────────────────────────────────────────────────────────────────
    // 4. RATE LIMITING
    // ─────────────────────────────────────────────────────────────────
    const isPublicRequest = isApi && isPublicReadApiRoute(pathname) && isReadOnlyMethod(method);
    const rateLimit = checkRateLimit(clientIP, isPublicRequest);
    
    if (!rateLimit.allowed) {
      if (isApi) {
        return createApiErrorResponse(429, 'Too many requests. Please try again later.', 'RATE_LIMIT_EXCEEDED');
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
      return addSecurityHeaders(response);
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
        return createApiErrorResponse(403, 'Your account has been deactivated.', 'ACCOUNT_DEACTIVATED');
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
        return createApiErrorResponse(403, 'Your account has been deactivated.', 'ACCOUNT_DEACTIVATED');
      }
      
      const allowedRoles = getMutationRoles(pathname);
      if (allowedRoles) {
        const userRole = token.role as Role;
        if (!allowedRoles.includes(userRole)) {
          return createApiErrorResponse(
            403,
            `Access denied. Required roles: ${allowedRoles.join(', ')}. Your role: ${userRole}`,
            'ACCESS_DENIED'
          );
        }
      }
    }
    
    // ─────────────────────────────────────────────────────────────────
    // 8. AUTRES ROUTES API
    // ─────────────────────────────────────────────────────────────────
    if (isApi && !isPublicReadApiRoute(pathname) && !isAlwaysProtectedApiRoute(pathname)) {
      if (!token) {
        return createApiErrorResponse(401, 'Authentication required.', 'AUTHENTICATION_REQUIRED');
      }
      
      if (!token.isActive) {
        return createApiErrorResponse(403, 'Your account has been deactivated.', 'ACCOUNT_DEACTIVATED');
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
      return addSecurityHeaders(response);
    } else {
      const response = handleI18nRouting(req);
      response.headers.set('X-Request-ID', crypto.randomUUID());
      return addSecurityHeaders(response);
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
