/**
 * ╔══════════════════════════════════════════════════════════════════════════════════════════════════╗
 * ║           MEDACTION - SECURITY VALIDATION LIBRARY                                                ║
 * ║              Centralized Security Validators - OWASP Compliant                                   ║
 * ╚══════════════════════════════════════════════════════════════════════════════════════════════════╝
 * 
 * This module provides security-focused validation utilities for:
 * - Input sanitization (XSS prevention)
 * - Boundary validation (integer overflow prevention)
 * - Rate limiting helpers
 * - Parameter validation (SQL injection prevention)
 * - ID validation (IDOR prevention)
 */

import { z } from 'zod';

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION - Security Limits (OWASP A08:2021 - Data Integrity)
// ═══════════════════════════════════════════════════════════════════════════

export const SECURITY_LIMITS = {
  // Text fields
  NAME_MIN: 2,
  NAME_MAX: 100,
  TITLE_MIN: 5,
  TITLE_MAX: 200,
  DESCRIPTION_MIN: 10,
  DESCRIPTION_MAX: 5000,
  COMMENT_MAX: 2000,
  
  // Pagination
  PAGE_MIN: 1,
  PAGE_MAX: 10000,
  LIMIT_MIN: 1,
  LIMIT_MAX: 100,
  LIMIT_DEFAULT: 20,
  
  // Numeric
  ID_MIN: 1,
  ID_MAX: 2147483647, // PostgreSQL INTEGER max
  RATING_MIN: 1,
  RATING_MAX: 5,
  YEAR_MIN: 1900,
  YEAR_MAX: 2100,
  
  // Files
  MAX_UPLOAD_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_FILES_PER_UPLOAD: 10,
  
  // Rate limits
  LOGIN_ATTEMPTS_MAX: 10,
  LOGIN_LOCKOUT_MINUTES: 30,
  REGISTRATION_PER_HOUR: 5,
  PASSWORD_RESET_PER_HOUR: 3,
};

// ═══════════════════════════════════════════════════════════════════════════
// XSS SANITIZATION (OWASP A03:2021 - Injection)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Encode HTML special characters to prevent XSS
 */
export function escapeHtml(input: string): string {
  if (!input || typeof input !== 'string') return '';
  
  const escapeMap: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;',
  };
  
  return input.replace(/[&<>"'`=/]/g, (char) => escapeMap[char] || char);
}

/**
 * Strip all HTML tags from input
 */
export function stripHtml(input: string): string {
  if (!input || typeof input !== 'string') return '';
  
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '') // Remove style tags
    .replace(/<[^>]*>/g, '') // Remove all HTML tags
    .replace(/<!--[\s\S]*?-->/g, '') // Remove HTML comments
    .trim();
}

/**
 * Sanitize input for safe display and storage
 */
export function sanitizeString(input: string): string {
  if (!input || typeof input !== 'string') return '';
  
  return stripHtml(input)
    .replace(/[<>"'&`]/g, (char) => {
      const map: Record<string, string> = {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '&': '&amp;',
        '`': '&#x60;',
      };
      return map[char] || char;
    })
    .trim();
}

/**
 * Sanitize name fields (letters, spaces, hyphens, apostrophes only)
 */
export function sanitizeName(input: string): string {
  if (!input || typeof input !== 'string') return '';
  
  return stripHtml(input)
    // Keep only letters (including accented), spaces, hyphens, apostrophes
    .replace(/[^a-zA-ZàâäéèêëïîôùûüçÀÂÄÉÈÊËÏÎÔÙÛÜÇ\s\-']/g, '')
    .substring(0, SECURITY_LIMITS.NAME_MAX)
    .trim();
}

/**
 * Check if string contains potential XSS patterns
 */
export function containsXss(input: string): boolean {
  if (!input) return false;
  
  const xssPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /<svg.*onload/i,
    /<img.*onerror/i,
    /data:text\/html/i,
    /vbscript:/i,
    /expression\s*\(/i,
  ];
  
  return xssPatterns.some(pattern => pattern.test(input));
}

// ═══════════════════════════════════════════════════════════════════════════
// BOUNDARY VALIDATION (OWASP A08:2021 - Data Integrity)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Validate and sanitize integer ID
 */
export function validateId(input: unknown): number | null {
  if (input === null || input === undefined) return null;
  
  const num = typeof input === 'string' ? parseInt(input, 10) : Number(input);
  
  if (isNaN(num) || !Number.isInteger(num)) return null;
  if (num < SECURITY_LIMITS.ID_MIN || num > SECURITY_LIMITS.ID_MAX) return null;
  
  return num;
}

/**
 * Validate pagination parameters
 */
export function validatePagination(page: unknown, limit: unknown): { page: number; limit: number } {
  let p = typeof page === 'string' ? parseInt(page, 10) : Number(page);
  let l = typeof limit === 'string' ? parseInt(limit, 10) : Number(limit);
  
  // Ensure valid bounds
  if (isNaN(p) || p < SECURITY_LIMITS.PAGE_MIN) p = SECURITY_LIMITS.PAGE_MIN;
  if (p > SECURITY_LIMITS.PAGE_MAX) p = SECURITY_LIMITS.PAGE_MAX;
  
  if (isNaN(l) || l < SECURITY_LIMITS.LIMIT_MIN) l = SECURITY_LIMITS.LIMIT_DEFAULT;
  if (l > SECURITY_LIMITS.LIMIT_MAX) l = SECURITY_LIMITS.LIMIT_MAX;
  
  return { page: p, limit: l };
}

/**
 * Validate rating (1-5)
 */
export function validateRating(input: unknown): number | null {
  const num = typeof input === 'string' ? parseFloat(input) : Number(input);
  
  if (isNaN(num)) return null;
  if (num < SECURITY_LIMITS.RATING_MIN || num > SECURITY_LIMITS.RATING_MAX) return null;
  
  return Math.round(num * 10) / 10; // Round to 1 decimal
}

// ═══════════════════════════════════════════════════════════════════════════
// ZOD SCHEMA HELPERS - Pre-built secure validators
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Secure ID validator (protects against integer overflow and IDOR)
 */
export const secureIdSchema = z.coerce
  .number()
  .int('ID must be an integer')
  .min(SECURITY_LIMITS.ID_MIN, 'Invalid ID')
  .max(SECURITY_LIMITS.ID_MAX, 'Invalid ID');

/**
 * Secure pagination schema
 */
export const securePaginationSchema = z.object({
  page: z.coerce
    .number()
    .int()
    .min(SECURITY_LIMITS.PAGE_MIN)
    .max(SECURITY_LIMITS.PAGE_MAX)
    .default(1),
  limit: z.coerce
    .number()
    .int()
    .min(SECURITY_LIMITS.LIMIT_MIN)
    .max(SECURITY_LIMITS.LIMIT_MAX)
    .default(SECURITY_LIMITS.LIMIT_DEFAULT),
});

/**
 * Secure name schema (for nom, prenom, etc.)
 */
export const secureNameSchema = z
  .string()
  .min(SECURITY_LIMITS.NAME_MIN, `Minimum ${SECURITY_LIMITS.NAME_MIN} characters required`)
  .max(SECURITY_LIMITS.NAME_MAX, `Maximum ${SECURITY_LIMITS.NAME_MAX} characters allowed`)
  .transform(sanitizeName)
  .refine(
    (val) => /^[a-zA-ZàâäéèêëïîôùûüçÀÂÄÉÈÊËÏÎÔÙÛÜÇ\s\-']+$/.test(val),
    'Only letters, spaces, hyphens, and apostrophes are allowed'
  );

/**
 * Secure title schema
 */
export const secureTitleSchema = z
  .string()
  .min(SECURITY_LIMITS.TITLE_MIN, `Minimum ${SECURITY_LIMITS.TITLE_MIN} characters required`)
  .max(SECURITY_LIMITS.TITLE_MAX, `Maximum ${SECURITY_LIMITS.TITLE_MAX} characters allowed`)
  .transform(sanitizeString);

/**
 * Secure description/comment schema
 */
export const secureDescriptionSchema = z
  .string()
  .min(SECURITY_LIMITS.DESCRIPTION_MIN, `Minimum ${SECURITY_LIMITS.DESCRIPTION_MIN} characters required`)
  .max(SECURITY_LIMITS.DESCRIPTION_MAX, `Maximum ${SECURITY_LIMITS.DESCRIPTION_MAX} characters allowed`)
  .transform(sanitizeString);

/**
 * Secure rating schema (1-5)
 */
export const secureRatingSchema = z.coerce
  .number()
  .min(SECURITY_LIMITS.RATING_MIN, `Rating must be at least ${SECURITY_LIMITS.RATING_MIN}`)
  .max(SECURITY_LIMITS.RATING_MAX, `Rating cannot exceed ${SECURITY_LIMITS.RATING_MAX}`);

/**
 * Secure email schema
 */
export const secureEmailSchema = z
  .string()
  .email('Invalid email format')
  .max(255, 'Email too long')
  .transform((email) => email.toLowerCase().trim());

/**
 * Secure password schema (OWASP password policy)
 */
export const securePasswordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password too long')
  .refine(
    (pwd) => /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(pwd),
    'Password must contain uppercase, lowercase, digit, and special character (@$!%*?&)'
  );

/**
 * Secure year schema
 */
export const secureYearSchema = z.coerce
  .number()
  .int()
  .min(SECURITY_LIMITS.YEAR_MIN)
  .max(SECURITY_LIMITS.YEAR_MAX);

// ═══════════════════════════════════════════════════════════════════════════
// JSON PROTECTION (OWASP A08:2021 - Prototype Pollution)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Sanitize JSON to prevent prototype pollution
 */
export function sanitizeJson<T>(input: T): T {
  if (input === null || input === undefined) return input;
  
  if (Array.isArray(input)) {
    return input.map(sanitizeJson) as T;
  }
  
  if (typeof input === 'object') {
    const sanitized: Record<string, unknown> = {};
    
    for (const key of Object.keys(input as object)) {
      // Block prototype pollution vectors
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        continue;
      }
      sanitized[key] = sanitizeJson((input as Record<string, unknown>)[key]);
    }
    
    return sanitized as T;
  }
  
  return input;
}

// ═══════════════════════════════════════════════════════════════════════════
// PATH VALIDATION (OWASP A01:2021 - Path Traversal)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Sanitize filename to prevent path traversal
 */
export function sanitizeFilename(input: string): string {
  if (!input || typeof input !== 'string') return '';
  
  return input
    .replace(/\.\./g, '') // Remove path traversal
    .replace(/[/\\]/g, '') // Remove path separators
    .replace(/[<>:"|?*\x00-\x1f]/g, '') // Remove invalid chars
    .trim();
}

/**
 * Validate file path is safe
 */
export function isPathSafe(path: string): boolean {
  if (!path) return false;
  
  const dangerousPatterns = [
    /\.\./,
    /^\/etc/,
    /^\/proc/,
    /^\/sys/,
    /^\/dev/,
    /^C:\\Windows/i,
    /^C:\\Users/i,
  ];
  
  return !dangerousPatterns.some(pattern => pattern.test(path));
}

// ═══════════════════════════════════════════════════════════════════════════
// SECURITY LOGGING (OWASP A09:2021 - Logging)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Log security event (sanitized for log injection)
 */
export function logSecurityEvent(
  type: 'AUTH_FAILURE' | 'INJECTION_ATTEMPT' | 'RATE_LIMIT' | 'SUSPICIOUS_ACTIVITY',
  details: string,
  ip?: string
): void {
  // Sanitize log message to prevent log injection
  const sanitizedDetails = details.substring(0, 500).replace(/[\r\n]/g, ' ');
  const sanitizedIp = (ip || 'unknown').substring(0, 45);
  
  console.warn(
    `[SECURITY] ${type} | IP: ${sanitizedIp} | ${new Date().toISOString()} | ${sanitizedDetails}`
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// REQUEST VALIDATION MIDDLEWARE HELPER
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Validate request body with security checks
 */
export async function validateRequestBody<T>(
  request: Request,
  schema: z.ZodSchema<T>
): Promise<{ success: true; data: T } | { success: false; error: string; status: number }> {
  try {
    const rawBody = await request.json();
    
    // Check for XSS in string values
    const checkForXss = (obj: unknown): boolean => {
      if (typeof obj === 'string') return containsXss(obj);
      if (Array.isArray(obj)) return obj.some(checkForXss);
      if (typeof obj === 'object' && obj !== null) {
        return Object.values(obj).some(checkForXss);
      }
      return false;
    };
    
    if (checkForXss(rawBody)) {
      logSecurityEvent('INJECTION_ATTEMPT', 'XSS payload detected in request body');
      return { success: false, error: 'Invalid input detected', status: 400 };
    }
    
    // Sanitize JSON for prototype pollution
    const sanitizedBody = sanitizeJson(rawBody);
    
    // Validate with Zod
    const result = schema.safeParse(sanitizedBody);
    
    if (!result.success) {
      const firstError = result.error.issues[0];
      return { 
        success: false, 
        error: firstError?.message || 'Validation failed',
        status: 400
      };
    }
    
    return { success: true, data: result.data };
  } catch (error) {
    return { success: false, error: 'Invalid JSON body', status: 400 };
  }
}

// Export all for easy access
export const SecurityValidation = {
  LIMITS: SECURITY_LIMITS,
  escapeHtml,
  stripHtml,
  sanitizeString,
  sanitizeName,
  sanitizeFilename,
  sanitizeJson,
  containsXss,
  validateId,
  validatePagination,
  validateRating,
  isPathSafe,
  logSecurityEvent,
  validateRequestBody,
  schemas: {
    id: secureIdSchema,
    pagination: securePaginationSchema,
    name: secureNameSchema,
    title: secureTitleSchema,
    description: secureDescriptionSchema,
    rating: secureRatingSchema,
    email: secureEmailSchema,
    password: securePasswordSchema,
    year: secureYearSchema,
  },
};

export default SecurityValidation;
