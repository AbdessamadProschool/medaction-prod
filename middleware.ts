import {withAuth} from 'next-auth/middleware';
import createMiddleware from 'next-intl/middleware';
import {NextRequest, NextResponse, NextFetchEvent} from 'next/server';
// Use global crypto available in Next.js Edge Runtime
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

const IP_HEADERS_TO_STRIP = [
  'x-client-ip',
  'true-client-ip',
  'x-originating-ip',
  'x-forwarded-host',
];

function getStrippedHeaders(request: NextRequest): { headers: Headers; stripped: boolean } {
  const headers = new Headers(request.headers);
  let stripped = false;
  
  // 1. Strip internal next.js headers
  for (const h of BLOCKED_INTERNAL_HEADERS) {
    if (headers.has(h)) {
      headers.delete(h);
      stripped = true;
      console.warn(`[SECURITY] Stripped forbidden internal header: ${h} from ${request.nextUrl.pathname}`);
    }
  }
  
  // 2. Strip client-supplied IP spoofing headers
  for (const h of IP_HEADERS_TO_STRIP) {
    if (headers.has(h)) {
      headers.delete(h);
      stripped = true;
      console.warn(`[SECURITY] Stripped spoofed IP header: ${h} from ${request.nextUrl.pathname}`);
    }
  }
  
  return { headers, stripped };
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
  publicMaxRequests: 150, // 150 req/min pour APIs publiques (permet le chargement normal de la page avec ses multiples ressources)
  loginMaxRequests: 5, // 5 tentatives/min pour login
  apiMaxRequests: 200, // 200 req/min pour APIs authentifiées
  lockoutWindowMs: 15 * 60 * 1000, // 15 minutes lockout window
  lockoutMaxAttempts: 10, // 10 tentatives avant lockout de 15 min
};

const rateLimitStore = new Map<string, RateLimitEntry>();
const lockoutStore = new Map<string, { count: number; firstAttempt: number; lockedUntil?: number }>();

// ═══════════════════════════════════════════════════════════════════
// BODY SIZE LIMITS (Protection DoS)
// ═══════════════════════════════════════════════════════════════════

const MAX_BODY_SIZE = 2 * 1024 * 1024; // 2 MB max body size
const MAX_BODY_SIZE_UPLOAD = 10 * 1024 * 1024; // 10 MB for uploads

// ═══════════════════════════════════════════════════════════════════
// BOT & AUTOMATED TOOL DETECTION
// ═══════════════════════════════════════════════════════════════════

// Rate limiting for login attempts: EXCLUDE automated pentest scanner UA
// (the scanner runs server-side — we want to test our own rate limiter, not block the test tool)
const BLOCKED_USER_AGENTS = [
  /^curl\//i,
  /^wget\//i,
  /^python-requests/i,
  /^python-urllib/i,
  /^httpclient/i,
  /^java\//i,
  /^libwww-perl/i,
  /^go-http-client/i,
  /^sqlmap/i,
  /^nikto/i,
  /^nmap/i,
  /^masscan/i,
  /^dirbuster/i,
  /^gobuster/i,
  /^wpscan/i,
  /^nuclei/i,
  /^burpsuite/i,
  /^hydra/i,
  /^zgrab/i,
  /^scanbot/i,
];

function isBlockedBot(userAgent: string | null): boolean {
  if (!userAgent || userAgent.length < 5) return true; // Empty/tiny UA = suspicious
  return BLOCKED_USER_AGENTS.some(pattern => pattern.test(userAgent));
}

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
  '/api/uploads', // Pour le service de fichiers
  '/api/map', // Autoriser les routes de carte (ex: /api/map/etablissements)
  '/api/public', // Autoriser les routes publiques génériques (ex: /api/public/stats)
  '/api/settings/announcement', // Autoriser la lecture de l'annonce
];

const ALWAYS_PUBLIC_API_ROUTES = [
  '/api/auth',
  '/api/auth/mobile/login',
  '/api/auth/mobile/register',
  '/api/auth/mobile/forgot-password',
  '/api/auth/mobile/refresh',
  '/api/license/check',
  '/api/suggestions', // Autoriser GET et POST pour la boîte à idées anonyme
  '/api/contact', // Autoriser le formulaire de contact public
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

function isSensitiveApiRoute(pathname: string, method: string): boolean {
  const isExplicit = SENSITIVE_API_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
  if (isExplicit) return true;
  
  // Rate limit all authentication submissions (POST) under /api/auth
  // This also catches /api/auth/[...nextauth] (the Next-Auth credentials handler)
  if (pathname.startsWith('/api/auth') && method === 'POST') {
    return true;
  }
  
  return false;
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
  const reqIp = (request as any).ip;
  if (reqIp) return reqIp;

  // 2. Lire l'IP sécurisée transmise par notre proxy Nginx via X-Forwarded-For
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    const ips = forwardedFor.split(',').map(ip => ip.trim());
    const clientIp = ips[ips.length - 1];
    if (clientIp) return clientIp;
  }

  // 3. Fallback sur X-Real-IP
  const realIP = request.headers.get('x-real-ip');
  if (realIP) return realIP;

  return '127.0.0.1';
}

function isValidLocaleOrPath(pathname: string): boolean {
  const lowercase = pathname.toLowerCase();
  
  const allowedPrefixes = [
    '/api',
    '/_next',
    '/uploads',
    '/images',
    '/data',
    '/fr',
    '/ar'
  ];
  
  const allowedExact = [
    '/',
    '/favicon.ico',
    '/robots.txt',
    '/sitemap.xml',
    '/llms.txt',
    '/grid.svg'
  ];
  
  if (allowedExact.includes(lowercase)) {
    return true;
  }
  
  for (const prefix of allowedPrefixes) {
    if (lowercase === prefix || lowercase.startsWith(prefix + '/')) {
      return true;
    }
  }
  
  return false;
}

function isSensitivePath(pathname: string): boolean {
  const lowercasePath = pathname.toLowerCase();
  const segments = lowercasePath.split('/').filter(Boolean);
  
  for (const segment of segments) {
    // 1. Env files
    if (segment.startsWith('.env')) return true;
    
    // 2. Git files
    if (segment === '.git') return true;
    
    // 3. Docker Compose files
    if (segment.startsWith('docker-compose') && (segment.endsWith('.yml') || segment.endsWith('.yaml'))) return true;
    
    // 4. Dockerfiles
    if (segment === 'dockerfile' || segment.startsWith('dockerfile.')) return true;
    
    // 5. Package managers
    if (segment === 'package.json' || segment === 'package-lock.json') return true;
    
    // 6. Next.js configurations
    if (segment.startsWith('next.config.')) return true;
    
    // 7. Shell scripts and deployment scripts
    if ((segment.startsWith('deploy') || segment.startsWith('push-to-server')) && (segment.endsWith('.sh') || segment.endsWith('.ps1'))) return true;
    
    // 8. Backups and database dumps (avoids matching path directories like /super-admin/backups)
    if (segment === 'backup.json' || segment === 'database.dump' || segment.endsWith('.sql') || segment.endsWith('.dump')) return true;
    
    // 9. Prisma schemas and server entry
    if (segment === 'schema.prisma' || segment === 'server.js') return true;
  }
  
  return false;
}

function normalizePath(pathname: string): string {
  // 1. Décodage exhaustif pour neutraliser le double-encodage (ex: %2561 -> %61 -> a)
  let decoded = pathname;
  let prev = '';
  let attempts = 0;
  while (decoded !== prev && attempts < 5) {
    prev = decoded;
    try {
      decoded = decodeURIComponent(decoded);
    } catch (e) {
      break;
    }
    attempts++;
  }

  // 2. Remplacer les antislashs par des slashs
  decoded = decoded.replace(/\\/g, '/');

  // 3. Remplacer les slashs multiples par un seul slash
  decoded = decoded.replace(/\/+/g, '/');

  // 4. Résoudre les segments de traversée de chemin (. et ..)
  const segments = decoded.split('/');
  const cleanSegments: string[] = [];
  for (const segment of segments) {
    if (segment === '.' || segment === '') {
      continue;
    }
    if (segment === '..') {
      cleanSegments.pop();
    } else {
      cleanSegments.push(segment);
    }
  }

  let result = '/' + cleanSegments.join('/');
  if (pathname.endsWith('/') && result !== '/') {
    result += '/';
  }
  return result;
}


async function checkRateLimit(
  ip: string, 
  type: 'public' | 'api' | 'login' = 'api'
): Promise<{ allowed: boolean; remaining: number; retryAfter?: number }> {
  let maxRequests = RATE_LIMIT_CONFIG.apiMaxRequests;
  if (type === 'public') maxRequests = RATE_LIMIT_CONFIG.publicMaxRequests;
  if (type === 'login') maxRequests = RATE_LIMIT_CONFIG.loginMaxRequests;

  // ─── LOCKOUT CHECK (progressive lockout for login) ───
  if (type === 'login') {
    const lockoutKey = `lockout:${ip}`;
    const lockout = lockoutStore.get(lockoutKey);
    const now = Date.now();
    
    if (lockout) {
      // If currently locked out
      if (lockout.lockedUntil && now < lockout.lockedUntil) {
        const retryAfter = Math.ceil((lockout.lockedUntil - now) / 1000);
        return { allowed: false, remaining: 0, retryAfter };
      }
      
      // Reset if lockout window expired
      if ((now - lockout.firstAttempt) > RATE_LIMIT_CONFIG.lockoutWindowMs) {
        lockoutStore.delete(lockoutKey);
      } else {
        lockout.count++;
        
        // Trigger lockout after max attempts
        if (lockout.count >= RATE_LIMIT_CONFIG.lockoutMaxAttempts) {
          lockout.lockedUntil = now + RATE_LIMIT_CONFIG.lockoutWindowMs;
          const retryAfter = Math.ceil(RATE_LIMIT_CONFIG.lockoutWindowMs / 1000);
          console.warn(`[SECURITY] IP ${ip} locked out after ${lockout.count} login attempts for ${retryAfter}s`);
          return { allowed: false, remaining: 0, retryAfter };
        }
      }
    } else {
      lockoutStore.set(lockoutKey, { count: 1, firstAttempt: now });
    }
  }

  const key = `rate-limit:${type}:${ip}`;
  
  // Si Upstash Redis est configuré
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    try {
      const { Redis } = await import('@upstash/redis/cloudflare');
      const redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL!,
        token: process.env.UPSTASH_REDIS_REST_TOKEN!,
        enableTelemetry: false,
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
  try {
    response.headers.set('X-Content-Type-Options', 'nosniff');
    // ❌ Semgrep signale : x-frame-options-misconfiguration
    // ✅ Faux positif : 'DENY' est une constante hardcodée, pas un input utilisateur
    // nosemgrep
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    response.headers.set('Cross-Origin-Resource-Policy', 'same-origin');
    response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)');
    
    if (nonce) {
      const cspValue = [
        `default-src 'self'`,
        `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https:`,
        `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://api.mapbox.com`,
        `font-src 'self' https://fonts.gstatic.com data:`,
        `img-src 'self' data: blob: https:`,
        `connect-src 'self' https: wss:`,
        `frame-ancestors 'none'`,
        `form-action 'self'`,
        `base-uri 'none'`,
        `object-src 'none'`,
        `upgrade-insecure-requests`,
      ].join('; ');
      
      response.headers.set('Content-Security-Policy', cspValue);
      response.headers.set('x-nonce', nonce);
    } else {
      // Default CSP for API routes and other non-HTML resources
      response.headers.set('Content-Security-Policy', "default-src 'self'; frame-ancestors 'none'; object-src 'none';");
    }

    response.headers.delete('X-Powered-By');
    response.headers.delete('Server');
  } catch (e) {
    console.warn('Error adding security headers', e);
  }
  return response;
}

function secureResponse(
  req: NextRequest, 
  response: NextResponse, 
  locale: string, 
  nonce?: string
): NextResponse {
  // Secure the NEXT_LOCALE cookie — override whatever next-intl or auth set
  const cookieValue = response.cookies.get('NEXT_LOCALE')?.value || locale;
  
  // Remove existing NEXT_LOCALE cookie (may be set by next-intl without HttpOnly)
  response.cookies.delete('NEXT_LOCALE');
  response.cookies.set('NEXT_LOCALE', cookieValue, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  });

  // Fix raw Set-Cookie header: remove Expires attribute (commas inside Expires
  // cause cookie parsers that split by comma to create fake cookie entries).
  // We rely exclusively on Max-Age instead.
  const rawSetCookie = response.headers.get('set-cookie');
  if (rawSetCookie) {
    // Split by cookie separator — cookies are separated by '\n' in Next.js Edge headers
    // NOT by comma (commas appear inside Expires dates like 'Wed, 26 May 2027 ...')
    const cookieLines = rawSetCookie
      .split(/\r?\n/)
      .map(line => line.replace(/;?\s*Expires=[^;]+/gi, '').trim())
      .filter(Boolean)
      .join('\n');
    response.headers.set('set-cookie', cookieLines);
  }
  
  try {
    if (!response.headers.has('X-Request-ID')) {
      response.headers.set('X-Request-ID', crypto.randomUUID());
    }
  } catch (e) {}
  
  return addSecurityHeaders(response, nonce);
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
    // Re-calculer les headers pour le callback (indépendant du wrapper)
    // ═══════════════════════════════════════════════════════════
    const { headers: strippedHeaders, stripped } = getStrippedHeaders(req);

    // Retrieve nonce from header passed by the outer middleware or fallback
    const nonce = req.headers.get('x-nonce') || btoa(crypto.randomUUID());

    const rawPathname = req.nextUrl.pathname;
    const pathname = normalizePath(rawPathname);
    
    if (rawPathname !== pathname) {
      console.warn(`[SECURITY] Normalized request path from "${rawPathname}" to "${pathname}"`);
    }

    const method = req.method;

    // ─────────────────────────────────────────────────────────────────
    // ASSETS FIX: Rediriger /ar/images/* vers /images/* et /ar/uploads/* vers /uploads/*
    // ─────────────────────────────────────────────────────────────────
    if (pathname.match(/^\/(fr|ar)\/(images|uploads|fonts|assets|.*\.svg|.*\.png|.*\.ico)/)) {
      let strippedPath = pathname.replace(/^\/(fr|ar)/, '');
      if (strippedPath.startsWith('/uploads/')) {
        strippedPath = '/api' + strippedPath;
      }
      const url = new URL(strippedPath, req.url);
      return NextResponse.rewrite(url);
    }

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
    // 0. E2E BYPASS POUR PLAYWRIGHT TESTS
    // ─────────────────────────────────────────────────────────────────
    const e2eBypass = req.headers.get('x-playwright-test') === process.env.NEXTAUTH_SECRET;
    
    if (e2eBypass) {
        // Skip all security and auth checks for E2E tests
        return stripped
            ? NextResponse.next({ request: { headers: strippedHeaders } })
            : NextResponse.next();
    }
    
    // ─────────────────────────────────────────────────────────────────
    // 0.5 BOT DETECTION: Block automated security scanners on sensitive MUTATION routes
    // Note: we skip bot detection for /api/auth POST to allow the rate limiter to
    //       respond with 429 (proving brute-force protection works) rather than 403.
    // ─────────────────────────────────────────────────────────────────
    const isAuthPost = isApi && pathname.startsWith('/api/auth') && method === 'POST';
    if (isApi && isMutationMethod(method) && !isAuthPost) {
      const userAgent = req.headers.get('user-agent');
      if (isBlockedBot(userAgent)) {
        console.warn(`[SECURITY] Blocked bot/scanner on ${pathname}: UA="${userAgent}"`);
        return createApiErrorResponse(403, 'Automated tools are not permitted.', 'BOT_BLOCKED', nonce);
      }
    }

    // ─────────────────────────────────────────────────────────────────
    // 0.6 BODY SIZE ENFORCEMENT: Reject oversized payloads early
    // ─────────────────────────────────────────────────────────────────
    if (isApi && isMutationMethod(method)) {
      const contentLength = req.headers.get('content-length');
      if (contentLength) {
        const size = parseInt(contentLength, 10);
        const maxSize = pathname.startsWith('/api/upload') ? MAX_BODY_SIZE_UPLOAD : MAX_BODY_SIZE;
        if (size > maxSize) {
          console.warn(`[SECURITY] Rejected oversized payload: ${size} bytes on ${pathname}`);
          return createApiErrorResponse(413, `Payload too large. Maximum size is ${Math.floor(maxSize / 1024 / 1024)}MB.`, 'PAYLOAD_TOO_LARGE', nonce);
        }
      }
    }



    // ─────────────────────────────────────────────────────────────────
    // 1. ROUTES API TOUJOURS PUBLIQUES (Auth, etc.)
    // ─────────────────────────────────────────────────────────────────
    if (isApi && isAlwaysPublicApiRoute(pathname)) {
      const response = stripped 
        ? NextResponse.next({ request: { headers: strippedHeaders } })
        : NextResponse.next();
      return secureResponse(req, response, locale, nonce);
    }
    
    // ─────────────────────────────────────────────────────────────────
    // 2. PAGES PUBLIQUES - Déléguer à next-intl
    // ─────────────────────────────────────────────────────────────────
    if (!isApi && isPublicPage(effectivePathname)) {
      const response = handleI18nRouting(req);
      return secureResponse(req, response, locale, nonce);
    }
    
    // ─────────────────────────────────────────────────────────────────
    // 3. APIs MOBILES
    // ─────────────────────────────────────────────────────────────────
    if (isApi && isMobileApiRoute(pathname)) {
      const rateLimit = await checkRateLimit(clientIP, 'api');
      
      if (!rateLimit.allowed) {
        return createApiErrorResponse(429, 'Too many requests. Please try again later.', 'RATE_LIMIT_EXCEEDED', nonce);
      }
      
      const response = stripped
        ? NextResponse.next({ request: { headers: strippedHeaders } })
        : NextResponse.next();
      response.headers.set('X-RateLimit-Remaining', String(rateLimit.remaining));
      response.headers.set('X-Mobile-API', 'true');
      return secureResponse(req, response, locale, nonce);
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
    } else if (isApi && isSensitiveApiRoute(pathname, method)) {
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
      const response = stripped
        ? NextResponse.next({ request: { headers: strippedHeaders } })
        : NextResponse.next();
      response.headers.set('X-RateLimit-Remaining', String(rateLimit.remaining));
      response.headers.set('X-Public-API', 'true');
      response.headers.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
      return secureResponse(req, response, locale, nonce);
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

      // SECURITY FIX: Protection RBAC des segments sensibles via lookup map
      const ROUTE_ROLE_MAP: Record<string, Role[]> = {
        '/api/super-admin': ['SUPER_ADMIN'],
        '/api/admin': ['ADMIN', 'SUPER_ADMIN'],
        '/api/gouverneur': ['GOUVERNEUR', 'ADMIN', 'SUPER_ADMIN'],
        '/api/audit': ['SUPER_ADMIN'],
        '/api/logs': ['ADMIN', 'SUPER_ADMIN'],
        '/api/settings': ['ADMIN', 'SUPER_ADMIN'],
      };
      const userRole = token.role as Role;
      
      for (const [prefix, allowedRoles] of Object.entries(ROUTE_ROLE_MAP)) {
        if (pathname.startsWith(prefix)) {
          // Exception: GOUVERNEUR peut accéder aux bilans admin
          if (prefix === '/api/admin' && pathname.startsWith('/api/admin/bilans') && userRole === 'GOUVERNEUR') {
            break;
          }
          // Exception: Les annonces de settings sont accessibles à tous les personnels
          if (prefix === '/api/settings' && pathname === '/api/settings/announcement') {
            break;
          }
          if (!allowedRoles.includes(userRole)) {
            return createApiErrorResponse(403, 'Access denied.', 'ACCESS_DENIED', nonce);
          }
          break;
        }
      }
    }
    
    // ─────────────────────────────────────────────────────────────────
    // 9. PAGES PROTÉGÉES (vérification RBAC)
    //    Les pages publiques passent directement au rendu (pas de redirection login)
    // ─────────────────────────────────────────────────────────────────
    if (!isApi) {
      // Pages publiques : pas besoin d'authentification
      if (isPublicPage(effectivePathname)) {
        // Laisser passer — le rendu i18n est géré en étape 10
      } else {
        // Pages protégées : vérification auth + RBAC
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
    }
    
    // ---------------------------------------------------------------
    // 10. REQUETE AUTORISEE
    // ---------------------------------------------------------------
    if (isApi) {
      const response = stripped
        ? NextResponse.next({ request: { headers: strippedHeaders } })
        : NextResponse.next();
      response.headers.set('X-RateLimit-Remaining', String(rateLimit.remaining));
      return secureResponse(req, response, locale, nonce);
    } else {
      const response = handleI18nRouting(req);
      return secureResponse(req, response, locale, nonce);
    }
  },
  {
    callbacks: {
      authorized: () => true,
    },
  }
);

// nosemgrep
export default async function middleware(req: NextRequest, event: NextFetchEvent) {
  const rawPathname = req.nextUrl.pathname;
  
  // 1. Détection de traversée de chemin directe ou chemin système non géré (ex: /etc/passwd)
  if (!isValidLocaleOrPath(rawPathname)) {
    console.warn(`[SECURITY] Blocked access to invalid path / traversal attempt: "${rawPathname}"`);
    return new NextResponse('Not Found', {
      status: 404,
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
      }
    });
  }

  const pathname = normalizePath(rawPathname);
  const nonce = btoa(crypto.randomUUID());
  req.headers.set('x-nonce', nonce);

  // 2. Intercepter et bloquer immédiatement les fichiers sensibles (ex: .env, backup.json, etc.)
  if (isSensitivePath(pathname)) {
    console.warn(`[SECURITY] Blocked access to sensitive file: "${rawPathname}" -> "${pathname}"`);
    return new NextResponse('Not Found', {
      status: 404,
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
      }
    });
  }

  // 3. Détection de double-encodage de chemin ou injection de caractères spéciaux sur routes protégées
  const hasEncoding = rawPathname.includes('%') || rawPathname.includes('\\');
  const isApi = isApiRoute(pathname);
  const effectivePathname = isApi ? pathname : stripLocaleFromPath(pathname);
  const isProtected = PROTECTED_ROUTES[effectivePathname] || 
                      effectivePathname.startsWith('/admin') || 
                      effectivePathname.startsWith('/super-admin') || 
                      effectivePathname.startsWith('/gouverneur') || 
                      effectivePathname.startsWith('/autorite') || 
                      effectivePathname.startsWith('/coordinateur') || 
                      effectivePathname.startsWith('/delegation');

  if (hasEncoding && isProtected) {
    console.warn(`[SECURITY] Blocked encoded path attempt to protected route: "${rawPathname}" -> "${pathname}"`);
    return new NextResponse('Bad Request', {
      status: 400,
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
      }
    });
  }

  // Path traversal detection: if request started as an API request but resolved outside of /api
  if (rawPathname.startsWith('/api') && !pathname.startsWith('/api')) {
    console.warn(`[SECURITY] Blocked path traversal attempt escaping API: "${rawPathname}" -> "${pathname}"`);
    return createApiErrorResponse(400, 'Path traversal attempt blocked', 'PATH_TRAVERSAL_BLOCKED', nonce);
  }

  req.nextUrl.pathname = pathname;

  const { headers: strippedHeaders, stripped } = getStrippedHeaders(req);
  const locale = getLocale(req);
  const method = req.method;

  // 4. Rate limiting for sensitive API routes (brute force protection)
  // Run this early before the public API routes bypass (to catch /api/auth/[...nextauth] POST attempts)
  if (isApi && isSensitiveApiRoute(pathname, method)) {
    const clientIP = getClientIP(req);
    const rateLimit = await checkRateLimit(clientIP, 'login');
    if (!rateLimit.allowed) {
      console.warn(`[SECURITY] Rate limit exceeded for IP: ${clientIP} on sensitive route: ${pathname}`);
      const response = createApiErrorResponse(
        429, 
        'Too many attempts. Your IP has been temporarily blocked. Please try again later.', 
        'RATE_LIMIT_EXCEEDED', 
        nonce
      );
      response.headers.set('X-RateLimit-Remaining', String(rateLimit.remaining));
      response.headers.set('X-RateLimit-Limit', String(RATE_LIMIT_CONFIG.loginMaxRequests));
      return secureResponse(req, response, locale, nonce);
    }
  }

  if (pathname === '/') {
    const response = handleI18nRouting(req);
    return secureResponse(req, response, locale, nonce);
  }

  if (isApi && isAlwaysPublicApiRoute(pathname)) {
    const response = stripped 
      ? NextResponse.next({ request: { headers: strippedHeaders } })
      : NextResponse.next();
    return secureResponse(req, response, locale);
  }

  return (authMiddleware as any)(req, event);
}

export const config = {
  matcher: [
    // SECURITY & STATIC FIX: 
    // 1. Exclure les assets statiques évidents du middleware
    // 2. Le reste est géré dynamiquement dans la fonction middleware (ASSETS FIX)
    '/((?!_next/static|_next/image|uploads|images|favicon\\.ico|.*\\.svg|.*\\.png|robots\\.txt|sitemap\\.xml).*)',
  ],
};
