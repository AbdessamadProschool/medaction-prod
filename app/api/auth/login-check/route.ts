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
    
    // SECURITY FIX: Auto-record each check as a potential attempt
    // This prevents attackers from just calling login-check without consequence
    recordLoginAttemptByIP(clientIP, false); // Record as failed by default
    
    // Check if this IP is rate limited
    const rateLimitResult = checkLoginRateLimit(clientIP);
    
    if (!rateLimitResult.allowed) {
      console.warn(`[SECURITY] Login blocked for IP: ${clientIP.substring(0, 8)}***`);
      
      return NextResponse.json(
        {
          success: false,
          blocked: true,
          message: `Trop de tentatives de connexion. Veuillez réessayer dans ${rateLimitResult.blockedMinutes} minutes.`,
          retryAfterMinutes: rateLimitResult.blockedMinutes,
        },
        { 
          status: 429,
          headers: {
            'Retry-After': String((rateLimitResult.blockedMinutes || 30) * 60),
          }
        }
      );
    }
    
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
