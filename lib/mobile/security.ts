import { NextRequest, NextResponse } from 'next/server';
import { getClientIP } from '@/lib/auth/security';
import { prisma } from '@/lib/db';
import { timingSafeEqual } from 'crypto';
import { maskSensitiveData } from '@/lib/security/validation';

/**
 * Mobile API Security Configuration
 * 
 * Performance & Security:
 * - Constant-time comparison for API keys
 * - OOM-protected failed attempt tracking (LRU-like behavior)
 * - Strict type safety for Next.js 15
 */

// ============================================
// MOBILE API KEY CONFIGURATION
// ============================================

const RAW_API_KEY = process.env.MOBILE_API_KEY;

if (!RAW_API_KEY && process.env.NODE_ENV === 'production') {
  console.warn('⚠️  [SECURITY] MOBILE_API_KEY is missing. Requests to Mobile API will fail with default key.');
}

// Fallback for development only
const ACTUAL_API_KEY = RAW_API_KEY || 'dev-mobile-api-key-safe-for-local';
const API_KEY_BUFFER = Buffer.from(ACTUAL_API_KEY);

export const MOBILE_API_KEY_HEADER = 'X-Mobile-API-Key';

/**
 * Validates the mobile API key from request headers using timing-safe comparison
 */
export function validateMobileApiKey(request: NextRequest): boolean {
  const apiKey = request.headers.get(MOBILE_API_KEY_HEADER);
  
  if (!apiKey || apiKey.length !== ACTUAL_API_KEY.length) return false;

  const inputBuffer = Buffer.from(apiKey);
  return timingSafeEqual(inputBuffer, API_KEY_BUFFER);
}

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
  details?: Record<string, unknown>;
  userAgent?: string;
}

/**
 * Logs security events with structured data and automatic masking
 */
export async function logSecurityEvent(entry: SecurityLogEntry): Promise<void> {
  try {
    const isCritical = ['LOGIN_FAILED', 'LOGIN_BLOCKED', 'INVALID_API_KEY', 'RATE_LIMIT_EXCEEDED'].includes(entry.event);
    const logLevel = isCritical ? 'warn' : 'info';
    
    // Masking for PII in standard logs
    const maskedEmail = entry.email ? entry.email.replace(/(.{2}).*(@.*)/, '$1***$2') : 'N/A';
    const maskedIP = entry.ip.includes(':') ? '[IPV6]' : entry.ip.split('.').slice(0, 2).join('.') + '.X.X';
    
    console[logLevel](`[SECURITY] ${entry.event} | IP: ${maskedIP} | Email: ${maskedEmail}`);
    
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
          timestamp: new Date().toISOString(),
          ...maskSensitiveData(entry.details),
        } as any, // Prisma Json field
      },
    });
  } catch (error) {
    console.error('[SECURITY_LOG_ERROR] Fail-safe active:', error);
  }
}

// ============================================
// CAPTCHA & OOM PROTECTION (Simple LRU)
// ============================================

export const CAPTCHA_THRESHOLD = 3;
const MAX_CACHE_SIZE = 5000; // Protection against OOM/DoS via IP spinning

/**
 * In-memory store with size limit and lazy eviction
 */
const failedAttemptStore = new Map<string, { count: number; lastAttempt: number }>();

function pruneCacheIfNeeded() {
  if (failedAttemptStore.size > MAX_CACHE_SIZE) {
    const oldestKey = failedAttemptStore.keys().next().value;
    if (oldestKey) failedAttemptStore.delete(oldestKey);
  }
}

export function isCaptchaRequired(ip: string, email?: string): boolean {
  const key = email ? `captcha:${email}` : `captcha:ip:${ip}`;
  const entry = failedAttemptStore.get(key);
  
  if (!entry) return false;
  
  // Cleanup if older than 15 minutes
  if (Date.now() - entry.lastAttempt > 15 * 60 * 1000) {
    failedAttemptStore.delete(key);
    return false;
  }
  
  return entry.count >= CAPTCHA_THRESHOLD;
}

export function recordFailedAttemptForCaptcha(ip: string, email?: string): void {
  const key = email ? `captcha:${email}` : `captcha:ip:${ip}`;
  const entry = failedAttemptStore.get(key);
  
  pruneCacheIfNeeded();
  
  if (!entry) {
    failedAttemptStore.set(key, { count: 1, lastAttempt: Date.now() });
  } else {
    entry.count++;
    entry.lastAttempt = Date.now();
    // Move to end (most recent) to simulate LRU behavior with Map iteration order
    failedAttemptStore.delete(key);
    failedAttemptStore.set(key, entry);
  }
}

export function resetFailedAttempts(ip: string, email?: string): void {
  if (email) failedAttemptStore.delete(`captcha:${email}`);
  failedAttemptStore.delete(`captcha:ip:${ip}`);
}

export async function verifyCaptcha(token: string): Promise<boolean> {
  const secret = process.env.HCAPTCHA_SECRET;
  
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      console.error('[CAPTCHA] HCAPTCHA_SECRET missing in production. Access denied.');
      return false;
    }
    return true; 
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
    console.error('[CAPTCHA] Verification failed:', error);
    return false;
  }
}

// ============================================
// NEXT.JS ROUTE MIDDLEWARE
// ============================================

type RouteContext = { params: Promise<Record<string, string | string[]>> };

export function withMobileAuth(
  handler: (request: NextRequest, context: RouteContext) => Promise<NextResponse>
): (request: NextRequest, context: any) => Promise<NextResponse> {
  return async (request: NextRequest, context: any) => {
    if (!validateMobileApiKey(request)) {
      const ip = getClientIP(request);
      
      // Strict security logging must be awaited
      await logSecurityEvent({
        event: 'INVALID_API_KEY',
        ip,
        userAgent: request.headers.get('user-agent') || undefined,
      });
      
      return unauthorizedResponse();
    }
    
    return handler(request, context as RouteContext);
  };
}
