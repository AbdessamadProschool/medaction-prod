/**
 * SECURITY: XSS Sanitization Utilities
 * 
 * This module provides functions to sanitize user input and prevent XSS attacks.
 * Use these functions on ALL user-provided text that will be stored or displayed.
 */

/**
 * HTML Entity encode dangerous characters
 * Converts < > " ' & to their HTML entity equivalents
 */
export function escapeHtml(input: string): string {
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
 * Remove all HTML tags from a string
 * WARNING: This is aggressive - use only when HTML is never expected
 */
export function stripHtml(input: string): string {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags first
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '') // Remove style tags
    .replace(/<[^>]*>/g, '') // Remove all remaining HTML tags
    .replace(/<!--[\s\S]*?-->/g, ''); // Remove HTML comments
}

/**
 * Sanitize a string for safe display and storage
 * - Removes HTML tags
 * - Escapes dangerous characters
 * - Trims whitespace
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
 * Sanitize a name field (nom, prenom)
 * - Only allows letters (including accented), spaces, hyphens, and apostrophes
 * - Maximum 100 characters
 */
export function sanitizeName(input: string): string {
  if (!input || typeof input !== 'string') return '';
  
  // Remove HTML and dangerous characters
  const cleaned = stripHtml(input).trim();
  
  // Keep only allowed characters for names
  // Includes letters, accented characters common in French/Arabic names, spaces, hyphens, apostrophes
  return cleaned
    .replace(/[^a-zA-ZÀ-ÿ\u00C0-\u024F\u0600-\u06FF\s\-']/g, '')
    .substring(0, 100)
    .trim();
}

/**
 * Sanitize email (lowercase, trim, validate format)
 */
export function sanitizeEmail(input: string): string {
  if (!input || typeof input !== 'string') return '';
  
  return input.toLowerCase().trim();
}

/**
 * Sanitize a phone number (keep only digits and +)
 */
export function sanitizePhone(input: string): string {
  if (!input || typeof input !== 'string') return '';
  
  return input.replace(/[^\d+\-\s()]/g, '').trim();
}

/**
 * Sanitize a URL (basic validation and cleaning)
 */
export function sanitizeUrl(input: string): string {
  if (!input || typeof input !== 'string') return '';
  
  const trimmed = input.trim();
  
  // Block javascript: and data: URLs
  if (/^(javascript|data|vbscript):/i.test(trimmed)) {
    return '';
  }
  
  // Ensure URL starts with http:// or https://
  if (!trimmed.match(/^https?:\/\//i)) {
    return `https://${trimmed}`;
  }
  
  return trimmed;
}

/**
 * Sanitize a filename (remove path traversal attempts)
 */
export function sanitizeFilename(input: string): string {
  if (!input || typeof input !== 'string') return '';
  
  return input
    .replace(/\.\./g, '') // Remove path traversal
    .replace(/[/\\]/g, '') // Remove path separators
    .replace(/[<>:"|?*\x00-\x1f]/g, '') // Remove invalid filename chars
    .trim();
}

/**
 * Sanitize JSON input to prevent prototype pollution
 */
export function sanitizeJson<T>(input: T): T {
  if (input === null || input === undefined) return input;
  
  if (Array.isArray(input)) {
    return input.map(sanitizeJson) as T;
  }
  
  if (typeof input === 'object') {
    const sanitized: Record<string, unknown> = {};
    
    for (const key of Object.keys(input as object)) {
      // Block prototype pollution
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        continue;
      }
      sanitized[key] = sanitizeJson((input as Record<string, unknown>)[key]);
    }
    
    return sanitized as T;
  }
  
  return input;
}

/**
 * Validate and sanitize integer input
 */
export function sanitizeInt(input: unknown, defaultValue = 0): number {
  if (typeof input === 'number' && Number.isInteger(input)) {
    return input;
  }
  
  if (typeof input === 'string') {
    const parsed = parseInt(input, 10);
    if (!isNaN(parsed)) {
      return parsed;
    }
  }
  
  return defaultValue;
}

/**
 * Check if string contains potential XSS patterns
 */
export function containsXss(input: string): boolean {
  const xssPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i, // onclick=, onerror=, etc.
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /<svg.*onload/i,
    /<img.*onerror/i,
    /data:text\/html/i,
    /vbscript:/i,
  ];
  
  return xssPatterns.some(pattern => pattern.test(input));
}

/**
 * Log potentially malicious input for security monitoring
 */
export function logSecurityEvent(type: string, input: string, ip?: string): void {
  const sanitizedInput = input.substring(0, 200).replace(/[\r\n]/g, ' ');
  console.warn(
    `[SECURITY] ${type} attempt detected | IP: ${ip?.substring(0, 15) || 'unknown'} | Input: ${sanitizedInput}`
  );
}
