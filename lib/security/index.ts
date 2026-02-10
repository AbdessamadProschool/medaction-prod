/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║          MODULE DE SÉCURITÉ - EXPORTS CENTRALISÉS                           ║
 * ║                    Portail Mediouna Action                                   ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 * 
 * Point d'entrée unique pour tous les utilitaires de sécurité.
 * 
 * Usage:
 *   import { securityLogger, validatePassword, passwordSchema } from '@/lib/security';
 */

// ============================================
// VALIDATION
// ============================================
export {
  // Schémas Zod
  passwordSchema,
  emailSchema,
  userNameSchema,
  phoneSchema,
  cinSchema,
  titleSchema,
  descriptionSchema,
  idSchema,
  idStringSchema,
  urlSchema,
  sanitizedTextSchema,
  futureDateSchema,
  pastDateSchema,
  
  // Schémas composés
  registerSchema,
  loginSchema,
  changePasswordSchema,
  reclamationSchema,
  
  // Helpers
  validateOrThrow,
  ValidationError,
  getPasswordStrength,
} from './validation-schemas';

// ============================================
// LOGGING
// ============================================
export {
  securityLogger,
  type SecurityEventLevel,
  type SecurityEventType,
  type SecurityLogEntry,
} from './security-logger';

// ============================================
// VALIDATION ENVIRONNEMENT
// ============================================
export {
  validateEnvironment,
  logValidationResult,
  checkEnvironmentOnStartup,
} from './env-validator';

// ============================================
// CONSTANTES DE SÉCURITÉ
// ============================================
export const SECURITY_CONSTANTS = {
  // Mot de passe
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,
  PASSWORD_SALT_ROUNDS: 12,
  
  // Rate limiting
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION_MINUTES: 15,
  RATE_LIMIT_WINDOW_MINUTES: 15,
  RATE_LIMIT_MAX_REQUESTS: 100,
  
  // CAPTCHA
  CAPTCHA_THRESHOLD: 3,
  CAPTCHA_EXPIRY_MINUTES: 15,
  
  // Session
  SESSION_MAX_AGE_SECONDS: 14400, // 4 heures
  SESSION_UPDATE_AGE_SECONDS: 3600, // 1 heure
  
  // Tokens
  JWT_EXPIRY_SECONDS: 14400,
  RESET_TOKEN_EXPIRY_HOURS: 4,
  VERIFICATION_TOKEN_EXPIRY_HOURS: 12,
  
  // API
  API_KEY_HEADER: 'X-Mobile-API-Key',
  API_KEY_MIN_LENGTH: 32,
  
  // Upload
  MAX_FILE_SIZE_MB: 10,
  ALLOWED_FILE_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
  ALLOWED_IMAGE_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
  
  // Headers
  SECURITY_HEADERS: {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'SAMEORIGIN',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(self)',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  },
} as const;

// ============================================
// HELPERS RAPIDES
// ============================================

/**
 * Vérifie si un mot de passe est valide selon les critères de sécurité
 */
export function validatePassword(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (password.length < SECURITY_CONSTANTS.PASSWORD_MIN_LENGTH) {
    errors.push(`Au moins ${SECURITY_CONSTANTS.PASSWORD_MIN_LENGTH} caractères requis`);
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Au moins une majuscule requise');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Au moins une minuscule requise');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Au moins un chiffre requis');
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push('Au moins un caractère spécial requis');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Vérifie si une IP est dans une liste d'IPs autorisées
 */
export function isIPAllowed(ip: string, allowedIPs: string[]): boolean {
  if (allowedIPs.length === 0) return true; // Pas de restriction
  return allowedIPs.some(allowed => {
    if (allowed.includes('/')) {
      // CIDR notation (ex: 192.168.1.0/24)
      return isIPInCIDR(ip, allowed);
    }
    return ip === allowed;
  });
}

/**
 * Vérifie si une IP est dans un range CIDR
 */
function isIPInCIDR(ip: string, cidr: string): boolean {
  const [range, bits] = cidr.split('/');
  const mask = ~(Math.pow(2, 32 - parseInt(bits)) - 1);
  const ipNum = ipToNumber(ip);
  const rangeNum = ipToNumber(range);
  return (ipNum & mask) === (rangeNum & mask);
}

function ipToNumber(ip: string): number {
  return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet), 0) >>> 0;
}

/**
 * Sanitize une chaîne pour éviter les injections XSS
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim();
}

/**
 * Génère un token aléatoire sécurisé
 */
export function generateSecureToken(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const crypto = require('crypto');
  const bytes = crypto.randomBytes(length);
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[bytes[i] % chars.length];
  }
  return result;
}

export default {
  SECURITY_CONSTANTS,
  validatePassword,
  isIPAllowed,
  sanitizeInput,
  generateSecureToken,
};
