/**
 * Mobile API Security Configuration
 * 
 * This file contains security utilities for the mobile API endpoints.
 * It includes API key validation, rate limiting, and security logging.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getClientIP, checkRateLimit } from '@/lib/auth/security';
import { prisma } from '@/lib/db';

// ============================================
// MOBILE API KEY CONFIGURATION
// ============================================

/**
 * Mobile API Key - Should be set in environment variables in production
 * Generate with: openssl rand -hex 32
 */
const MOBILE_API_KEY = process.env.MOBILE_API_KEY || 'dev-mobile-api-key-change-in-production';

/**
 * Header name for the mobile API key
 */
export const MOBILE_API_KEY_HEADER = 'X-Mobile-API-Key';

/**
 * Validates the mobile API key from request headers
 */
export function validateMobileApiKey(request: NextRequest): boolean {
  const apiKey = request.headers.get(MOBILE_API_KEY_HEADER);
  
  if (!apiKey) {
    return false;
  }
  
  // Constant-time comparison to prevent timing attacks
  if (apiKey.length !== MOBILE_API_KEY.length) {
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < apiKey.length; i++) {
    result |= apiKey.charCodeAt(i) ^ MOBILE_API_KEY.charCodeAt(i);
  }
  
  return result === 0;
}

/**
 * Returns an unauthorized response for invalid API key
 */
export function unauthorizedResponse(): NextResponse {
  return NextResponse.json(
    { 
      success: false, 
      message: 'Clé API invalide ou manquante',
      error: 'INVALID_API_KEY'
    },
    { status: 401 }
  );
}

// ============================================
// SECURITY LOGGING
// ============================================

export type SecurityEventType = 
  | 'LOGIN_SUCCESS' 
  | 'LOGIN_FAILED' 
  | 'LOGIN_BLOCKED'
  | 'REGISTER_SUCCESS'
  | 'REGISTER_FAILED'
  | 'PASSWORD_RESET_REQUEST'
  | 'PASSWORD_RESET_SUCCESS'
  | 'INVALID_API_KEY'
  | 'RATE_LIMIT_EXCEEDED'
  | 'CAPTCHA_REQUIRED'
  | 'CAPTCHA_FAILED';

interface SecurityLogEntry {
  event: SecurityEventType;
  ip: string;
  email?: string;
  userId?: number;
  details?: Record<string, any>;
  userAgent?: string;
}

/**
 * Logs security events to the database for monitoring and alerting
 */
export async function logSecurityEvent(entry: SecurityLogEntry): Promise<void> {
  try {
    // Log to console for immediate visibility
    const logLevel = ['LOGIN_FAILED', 'LOGIN_BLOCKED', 'INVALID_API_KEY', 'RATE_LIMIT_EXCEEDED', 'CAPTCHA_FAILED']
      .includes(entry.event) ? 'warn' : 'info';
    
    const maskedEmail = entry.email?.replace(/(.{2}).*(@.*)/, '$1***$2') || 'N/A';
    const maskedIP = entry.ip.substring(0, 8) + '***';
    
    console[logLevel](`[SECURITY] ${entry.event} | IP: ${maskedIP} | Email: ${maskedEmail}`);
    
    // Store in database for audit trail
    await prisma.activityLog.create({
      data: {
        userId: entry.userId || null,
        action: entry.event,
        entity: 'MobileAuth',
        entityId: entry.userId || 0,
        details: {
          ip: entry.ip,
          email: entry.email,
          userAgent: entry.userAgent,
          ...entry.details,
        },
      },
    });
  } catch (error) {
    // Don't fail the request if logging fails
    console.error('[SECURITY_LOG_ERROR]', error);
  }
}

// ============================================
// CAPTCHA CONFIGURATION (hCaptcha)
// ============================================

/**
 * After this many failed attempts, captcha is required
 */
export const CAPTCHA_THRESHOLD = 3;

/**
 * In-memory store for tracking failed attempts per IP/email
 * In production, use Redis for distributed tracking
 */
const failedAttemptStore: Map<string, { count: number; lastAttempt: number }> = new Map();

/**
 * Checks if captcha is required for this IP/email
 */
export function isCaptchaRequired(ip: string, email?: string): boolean {
  const key = email ? `captcha:${email}` : `captcha:ip:${ip}`;
  const entry = failedAttemptStore.get(key);
  
  if (!entry) return false;
  
  // Reset after 15 minutes of no activity
  if (Date.now() - entry.lastAttempt > 15 * 60 * 1000) {
    failedAttemptStore.delete(key);
    return false;
  }
  
  return entry.count >= CAPTCHA_THRESHOLD;
}

/**
 * Records a failed attempt for captcha tracking
 */
export function recordFailedAttemptForCaptcha(ip: string, email?: string): void {
  const key = email ? `captcha:${email}` : `captcha:ip:${ip}`;
  const entry = failedAttemptStore.get(key);
  
  if (!entry) {
    failedAttemptStore.set(key, { count: 1, lastAttempt: Date.now() });
  } else {
    entry.count++;
    entry.lastAttempt = Date.now();
    failedAttemptStore.set(key, entry);
  }
}

/**
 * Resets failed attempts after successful login
 */
export function resetFailedAttempts(ip: string, email?: string): void {
  if (email) failedAttemptStore.delete(`captcha:${email}`);
  failedAttemptStore.delete(`captcha:ip:${ip}`);
}

/**
 * Verifies hCaptcha token
 */
export async function verifyCaptcha(token: string): Promise<boolean> {
  const secret = process.env.HCAPTCHA_SECRET;
  
  if (!secret) {
    console.warn('[CAPTCHA] HCAPTCHA_SECRET not configured, skipping verification');
    return true; // Skip in development if not configured
  }
  
  try {
    const response = await fetch('https://hcaptcha.com/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${secret}&response=${token}`,
    });
    
    const data = await response.json();
    return data.success === true;
  } catch (error) {
    console.error('[CAPTCHA] Verification error:', error);
    return false;
  }
}

// ============================================
// HELPER MIDDLEWARE
// ============================================

/**
 * Wrapper for mobile API endpoints with security checks
 */
export function withMobileAuth(
  handler: (request: NextRequest) => Promise<NextResponse>
): (request: NextRequest) => Promise<NextResponse> {
  return async (request: NextRequest) => {
    // 1. Validate API Key
    if (!validateMobileApiKey(request)) {
      const ip = getClientIP(request);
      await logSecurityEvent({
        event: 'INVALID_API_KEY',
        ip,
        userAgent: request.headers.get('user-agent') || undefined,
      });
      return unauthorizedResponse();
    }
    
    // 2. Execute handler
    return handler(request);
  };
}

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now();
  Array.from(failedAttemptStore.entries()).forEach(([key, entry]) => {
    if (now - entry.lastAttempt > 30 * 60 * 1000) { // 30 minutes
      failedAttemptStore.delete(key);
    }
  });
}, 5 * 60 * 1000); // Every 5 minutes
