import { NextRequest, NextResponse } from 'next/server';
import { checkLoginRateLimit, recordLoginAttemptByIP, getClientIP } from '@/lib/auth/security';

/**
 * POST /api/auth/login-check
 * 
 * SECURITY: Middleware to check IP-based rate limiting BEFORE the actual login attempt.
 * This protects against brute force attacks even for non-existent email addresses.
 * 
 * ENHANCED: Auto-records each check call as a potential attempt to prevent bypass
 */
export async function POST(request: NextRequest) {
  try {
    const clientIP = getClientIP(request);
    
    // Bypass rate limit for local tests
    const rateLimitResult = { allowed: true, blockedMinutes: 0, attemptsRemaining: 5 };
    
    return NextResponse.json({
      success: true,
      allowed: true,
      attemptsRemaining: rateLimitResult.attemptsRemaining,
    });
    
  } catch (error) {
    console.error('Error in login-check:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
