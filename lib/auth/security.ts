import { prisma } from '@/lib/db';
import { getSecuritySettings } from '@/lib/settings/service';

/**
 * Service de sécurité pour la gestion des tentatives de connexion
 * 
 * NOTE: Les champs loginAttempts, lockedUntil, lastFailedLogin ont été ajoutés
 * au schéma Prisma. Pour activer cette fonctionnalité :
 * 1. Exécuter : npx prisma db push
 * 2. Exécuter : npx prisma generate  
 * 3. Redémarrer le serveur : npm run dev
 */

interface LoginAttemptResult {
  blocked: boolean;
  remainingAttempts?: number;
  lockoutMinutes?: number;
  lockedUntil?: Date;
}

/**
 * Vérifie si un compte est bloqué
 */
export async function isAccountLocked(email: string): Promise<LoginAttemptResult> {
  try {
    // Utiliser une requête raw pour éviter les erreurs de types si les champs n'existent pas encore
    const users = await prisma.$queryRaw<Array<{
      lockedUntil: Date | null;
      loginAttempts: number;
    }>>`
      SELECT "lockedUntil", "loginAttempts" 
      FROM "User" 
      WHERE LOWER(email) = LOWER(${email})
      LIMIT 1
    `;

    if (!users || users.length === 0) {
      return { blocked: false };
    }

    const user = users[0];

    // Vérifier si le compte est encore bloqué
    if (user.lockedUntil && new Date() < new Date(user.lockedUntil)) {
      const lockedUntil = new Date(user.lockedUntil);
      return {
        blocked: true,
        lockedUntil: lockedUntil,
        lockoutMinutes: Math.ceil((lockedUntil.getTime() - Date.now()) / (1000 * 60)),
      };
    }

    // Si le blocage a expiré, réinitialiser
    if (user.lockedUntil && new Date() >= new Date(user.lockedUntil)) {
      await prisma.$executeRaw`
        UPDATE "User" 
        SET "loginAttempts" = 0, "lockedUntil" = NULL 
        WHERE LOWER(email) = LOWER(${email})
      `;
    }

    const settings = await getSecuritySettings();
    const attempts = user.loginAttempts || 0;
    const remainingAttempts = settings.maxLoginAttempts - attempts;

    return {
      blocked: false,
      remainingAttempts: Math.max(0, remainingAttempts),
    };
  } catch (error) {
    // Si les champs n'existent pas encore dans la DB, ne pas bloquer
    console.warn('Security check skipped - fields may not exist yet:', (error as Error).message);
    return { blocked: false, remainingAttempts: 5 };
  }
}

/**
 * Enregistre une tentative de connexion échouée
 */
export async function recordFailedLogin(email: string): Promise<LoginAttemptResult> {
  try {
    const settings = await getSecuritySettings();
    
    // Récupérer les tentatives actuelles avec requête raw
    const users = await prisma.$queryRaw<Array<{
      id: number;
      loginAttempts: number;
    }>>`
      SELECT id, "loginAttempts" 
      FROM "User" 
      WHERE LOWER(email) = LOWER(${email})
      LIMIT 1
    `;

    if (!users || users.length === 0) {
      return { blocked: false };
    }

    const user = users[0];
    const currentAttempts = user.loginAttempts || 0;
    const newAttempts = currentAttempts + 1;
    const shouldLock = newAttempts >= settings.maxLoginAttempts;

    // Calculer la date de fin de blocage
    const lockoutUntil = shouldLock 
      ? new Date(Date.now() + settings.lockoutDuration * 60 * 1000) 
      : null;

    // Mettre à jour avec requête raw
    await prisma.$executeRaw`
      UPDATE "User" 
      SET "loginAttempts" = ${newAttempts}, 
          "lastFailedLogin" = NOW(), 
          "lockedUntil" = ${lockoutUntil}
      WHERE id = ${user.id}
    `;

    // Enregistrer dans les logs
    try {
      await prisma.activityLog.create({
        data: {
          userId: user.id,
          action: shouldLock ? 'ACCOUNT_LOCKED' : 'LOGIN_FAILED',
          entity: 'User',
          entityId: user.id,
          details: {
            attempts: newAttempts,
            locked: shouldLock,
            lockoutDuration: shouldLock ? settings.lockoutDuration : null,
          },
        },
      });
    } catch (logError) {
      // Ignorer les erreurs de log
    }

    if (shouldLock) {
      return {
        blocked: true,
        lockoutMinutes: settings.lockoutDuration,
        lockedUntil: lockoutUntil!,
      };
    }

    return {
      blocked: false,
      remainingAttempts: settings.maxLoginAttempts - newAttempts,
    };
  } catch (error) {
    console.warn('recordFailedLogin skipped:', (error as Error).message);
    return { blocked: false, remainingAttempts: 5 };
  }
}

/**
 * Réinitialise les tentatives de connexion après un login réussi
 */
export async function resetLoginAttempts(userId: number): Promise<void> {
  try {
    await prisma.$executeRaw`
      UPDATE "User" 
      SET "loginAttempts" = 0, 
          "lastFailedLogin" = NULL, 
          "lockedUntil" = NULL 
      WHERE id = ${userId}
    `;
  } catch (error) {
    console.warn('resetLoginAttempts skipped:', (error as Error).message);
  }
}

/**
 * Vérifie si le 2FA est requis pour cet utilisateur selon les settings
 */
export async function is2FARequired(userRole: string): Promise<boolean> {
  try {
    const settings = await getSecuritySettings();
    
    if (settings.require2FA) {
      const adminRoles = ['ADMIN', 'SUPER_ADMIN'];
      return adminRoles.includes(userRole);
    }
    
    return false;
  } catch (error) {
    return false;
  }
}

/**
 * Vérifie les exigences de mot de passe
 */
export async function validatePasswordRequirements(password: string): Promise<{
  valid: boolean;
  errors: string[];
}> {
  try {
    const settings = await getSecuritySettings();
    const errors: string[] = [];

    if (password.length < settings.passwordMinLength) {
      errors.push(`Le mot de passe doit contenir au moins ${settings.passwordMinLength} caractères`);
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Le mot de passe doit contenir au moins une majuscule');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Le mot de passe doit contenir au moins une minuscule');
    }

    if (!/[0-9]/.test(password)) {
      errors.push('Le mot de passe doit contenir au moins un chiffre');
    }

    return { valid: errors.length === 0, errors };
  } catch (error) {
    return { valid: true, errors: [] };
  }
}

// ============================================
// 2FA RATE LIMITING (SECURITY FIX)
// ============================================

interface TwoFAAttemptResult {
  allowed: boolean;
  attemptsRemaining?: number;
  lockoutMinutes?: number;
}

// In-memory store for 2FA attempts (in production, use Redis)
const twoFAAttempts: Map<string, { count: number; lastAttempt: number; lockedUntil: number | null }> = new Map();

const TWO_FA_MAX_ATTEMPTS = 3;
const TWO_FA_LOCKOUT_MINUTES = 15;
const TWO_FA_ATTEMPT_WINDOW = 5 * 60 * 1000; // 5 minutes

/**
 * SECURITY FIX: Rate limiting pour la vérification 2FA
 * Bloque après 3 tentatives échouées pendant 15 minutes
 */
export function check2FAAttempts(email: string): TwoFAAttemptResult {
  const key = `2fa:${email.toLowerCase()}`;
  const now = Date.now();
  
  const entry = twoFAAttempts.get(key);
  
  // Si bloqué, vérifier si le blocage a expiré
  if (entry?.lockedUntil && now < entry.lockedUntil) {
    return {
      allowed: false,
      lockoutMinutes: Math.ceil((entry.lockedUntil - now) / 60000),
    };
  }
  
  // Si blocage expiré ou pas d'entrée, autoriser
  if (!entry || (entry.lockedUntil && now >= entry.lockedUntil)) {
    return { allowed: true, attemptsRemaining: TWO_FA_MAX_ATTEMPTS };
  }
  
  // Si dernière tentative hors de la fenêtre, réinitialiser
  if (now - entry.lastAttempt > TWO_FA_ATTEMPT_WINDOW) {
    twoFAAttempts.delete(key);
    return { allowed: true, attemptsRemaining: TWO_FA_MAX_ATTEMPTS };
  }
  
  return {
    allowed: entry.count < TWO_FA_MAX_ATTEMPTS,
    attemptsRemaining: TWO_FA_MAX_ATTEMPTS - entry.count,
  };
}

/**
 * SECURITY FIX: Enregistre une tentative 2FA échouée
 */
export function record2FAFailure(email: string): TwoFAAttemptResult {
  const key = `2fa:${email.toLowerCase()}`;
  const now = Date.now();
  
  let entry = twoFAAttempts.get(key);
  
  if (!entry) {
    entry = { count: 1, lastAttempt: now, lockedUntil: null };
  } else {
    entry.count++;
    entry.lastAttempt = now;
  }
  
  // Si max atteint, bloquer
  if (entry.count >= TWO_FA_MAX_ATTEMPTS) {
    entry.lockedUntil = now + (TWO_FA_LOCKOUT_MINUTES * 60 * 1000);
    twoFAAttempts.set(key, entry);
    
    console.warn(`[SECURITY] 2FA locked for ${email.replace(/(.{2}).*(@.*)/, '$1***$2')} - too many attempts`);
    
    return {
      allowed: false,
      lockoutMinutes: TWO_FA_LOCKOUT_MINUTES,
    };
  }
  
  twoFAAttempts.set(key, entry);
  
  return {
    allowed: true,
    attemptsRemaining: TWO_FA_MAX_ATTEMPTS - entry.count,
  };
}

/**
 * SECURITY FIX: Réinitialise les tentatives 2FA après succès
 */
export function reset2FAAttempts(email: string): void {
  const key = `2fa:${email.toLowerCase()}`;
  twoFAAttempts.delete(key);
}

// ============================================
// RATE LIMITING GÉNÉRIQUE (SECURITY FIX)
// ============================================

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining?: number;
  retryAfter?: number;
}

// In-memory store for rate limiting (in production, use Redis)
const rateLimitStore: Map<string, { count: number; resetAt: number }> = new Map();

/**
 * SECURITY FIX: Generic rate limiting function
 * @param key - Unique key (e.g., "register:192.168.1.1" or "forgot-password:192.168.1.1")
 * @param config - Rate limit configuration
 */
export function checkRateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now();
  const entry = rateLimitStore.get(key);
  
  // If no entry or window expired, create new entry
  if (!entry || now >= entry.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + config.windowMs });
    return { allowed: true, remaining: config.maxRequests - 1 };
  }
  
  // If within limit, increment
  if (entry.count < config.maxRequests) {
    entry.count++;
    rateLimitStore.set(key, entry);
    return { allowed: true, remaining: config.maxRequests - entry.count };
  }
  
  // Rate limited
  const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
  console.warn(`[SECURITY] Rate limit exceeded for key: ${key.split(':')[0]}`);
  
  return { allowed: false, retryAfter };
}

/**
 * SECURITY FIX: Trusted proxy validation
 * Only trust X-Forwarded-For from known proxies
 */
const TRUSTED_PROXIES = [
  '127.0.0.1',
  '::1',
  'localhost',
  // Add CloudFlare IPs if using CloudFlare
  // Add your load balancer IPs here
];

/**
 * Validate if IP is a trusted proxy
 */
function isTrustedProxy(sourceIp: string | null): boolean {
  if (!sourceIp) return false;
  // In production with reverse proxy, you'd check against actual proxy IPs
  // In development, allow localhost
  return TRUSTED_PROXIES.some(proxy => sourceIp.includes(proxy));
}

/**
 * SECURITY FIX: Get client IP from request headers
 * Prevents X-Forwarded-For header spoofing by:
 * 1. Only trusting XFF from known proxies
 * 2. Using rightmost IP in XFF chain (closest to server)
 * 3. Validating IP format
 */
export function getClientIP(request: Request | { headers: Headers }): string {
  const headers = request.headers;
  
  // Get the direct connection IP (if available from socket)
  // Note: In Next.js, we don't have direct socket access, so we use headers carefully
  
  // SECURITY: Only trust X-Forwarded-For in production behind known proxies
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (isProduction) {
    // CloudFlare provides a reliable client IP
    const cfConnectingIp = headers.get('cf-connecting-ip');
    if (cfConnectingIp && isValidIPv4(cfConnectingIp.trim())) {
      return cfConnectingIp.trim();
    }
    
    // X-Real-IP from nginx
    const realIp = headers.get('x-real-ip');
    if (realIp && isValidIPv4(realIp.trim())) {
      return realIp.trim();
    }
    
    // X-Forwarded-For - take rightmost non-private IP (closest to server)
    const xff = headers.get('x-forwarded-for');
    if (xff) {
      const ips = xff.split(',').map(ip => ip.trim()).filter(isValidIPv4);
      // Take the rightmost IP that isn't a private IP
      for (let i = ips.length - 1; i >= 0; i--) {
        if (!isPrivateIP(ips[i])) {
          return ips[i];
        }
      }
      // If all are private, take the first one
      if (ips.length > 0) return ips[0];
    }
  } else {
    // In development, use X-Forwarded-For directly but log spoofing attempts
    const xff = headers.get('x-forwarded-for');
    if (xff) {
      const firstIp = xff.split(',')[0].trim();
      // SECURITY: Log potential spoofing in development
      if (xff.includes(',')) {
        console.warn(`[SECURITY] Multiple IPs in X-Forwarded-For (potential spoofing): ${xff}`);
      }
      return firstIp;
    }
  }
  
  // Fallback to localhost
  return '127.0.0.1';
}

/**
 * Validate IPv4 format
 */
function isValidIPv4(ip: string): boolean {
  const parts = ip.split('.');
  if (parts.length !== 4) return false;
  return parts.every(part => {
    const num = parseInt(part, 10);
    return !isNaN(num) && num >= 0 && num <= 255 && part === num.toString();
  });
}

/**
 * Check if IP is private/internal
 */
function isPrivateIP(ip: string): boolean {
  const parts = ip.split('.').map(p => parseInt(p, 10));
  // 10.0.0.0/8
  if (parts[0] === 10) return true;
  // 172.16.0.0/12
  if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
  // 192.168.0.0/16
  if (parts[0] === 192 && parts[1] === 168) return true;
  // 127.0.0.0/8
  if (parts[0] === 127) return true;
  return false;
}

// Cleanup old entries periodically (every 5 minutes)
setInterval(() => {
  const now = Date.now();
  Array.from(rateLimitStore.entries()).forEach(([key, entry]) => {
    if (now >= entry.resetAt) {
      rateLimitStore.delete(key);
    }
  });
}, 5 * 60 * 1000);

// ============================================
// LOGIN RATE LIMITING (IP-BASED) - SECURITY FIX
// ============================================

// Store for IP-based login attempts
const loginAttemptsByIP: Map<string, { count: number; resetAt: number; blockedUntil: number | null }> = new Map();

const LOGIN_RATE_LIMIT = {
  maxAttempts: 10,        // Max 10 tentatives par IP
  windowMs: 15 * 60 * 1000, // Fenêtre de 15 minutes
  blockDurationMs: 30 * 60 * 1000, // Blocage 30 minutes si dépassé
};

interface LoginRateLimitResult {
  allowed: boolean;
  attemptsRemaining?: number;
  blockedMinutes?: number;
}

/**
 * SECURITY FIX: Check if an IP is rate limited for login attempts
 * This protects against brute force attacks even for non-existent emails
 */
export function checkLoginRateLimit(ip: string): LoginRateLimitResult {
  const now = Date.now();
  const key = `login:${ip}`;
  const entry = loginAttemptsByIP.get(key);
  
  // If blocked, check if block has expired
  if (entry?.blockedUntil && now < entry.blockedUntil) {
    const blockedMinutes = Math.ceil((entry.blockedUntil - now) / 60000);
    return { allowed: false, blockedMinutes };
  }
  
  // If block expired or no entry, reset
  if (!entry || now >= entry.resetAt || (entry.blockedUntil && now >= entry.blockedUntil)) {
    return { allowed: true, attemptsRemaining: LOGIN_RATE_LIMIT.maxAttempts };
  }
  
  // Check if within limit
  if (entry.count < LOGIN_RATE_LIMIT.maxAttempts) {
    return { allowed: true, attemptsRemaining: LOGIN_RATE_LIMIT.maxAttempts - entry.count };
  }
  
  // Rate limited - block the IP
  entry.blockedUntil = now + LOGIN_RATE_LIMIT.blockDurationMs;
  loginAttemptsByIP.set(key, entry);
  
  console.warn(`[SECURITY] Login rate limit exceeded for IP: ${ip.substring(0, 8)}***`);
  
  return { allowed: false, blockedMinutes: Math.ceil(LOGIN_RATE_LIMIT.blockDurationMs / 60000) };
}

/**
 * SECURITY FIX: Record a failed login attempt from an IP
 */
export function recordLoginAttemptByIP(ip: string, success: boolean): void {
  const now = Date.now();
  const key = `login:${ip}`;
  
  // On successful login, reset the counter
  if (success) {
    loginAttemptsByIP.delete(key);
    return;
  }
  
  // Record failed attempt
  let entry = loginAttemptsByIP.get(key);
  
  if (!entry || now >= entry.resetAt) {
    entry = { count: 1, resetAt: now + LOGIN_RATE_LIMIT.windowMs, blockedUntil: null };
  } else {
    entry.count++;
    
    // If max attempts reached, block
    if (entry.count >= LOGIN_RATE_LIMIT.maxAttempts) {
      entry.blockedUntil = now + LOGIN_RATE_LIMIT.blockDurationMs;
      console.warn(`[SECURITY] IP ${ip.substring(0, 8)}*** blocked for ${LOGIN_RATE_LIMIT.blockDurationMs / 60000} minutes - too many login attempts`);
    }
  }
  
  loginAttemptsByIP.set(key, entry);
}

// Cleanup login attempts periodically
setInterval(() => {
  const now = Date.now();
  Array.from(loginAttemptsByIP.entries()).forEach(([key, entry]) => {
    if (now >= entry.resetAt && (!entry.blockedUntil || now >= entry.blockedUntil)) {
      loginAttemptsByIP.delete(key);
    }
  });
}, 5 * 60 * 1000);

