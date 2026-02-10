import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyPassword } from '@/lib/auth/password';
import { encode } from 'next-auth/jwt';
import { 
  isAccountLocked, 
  recordFailedLogin, 
  resetLoginAttempts, 
  checkLoginRateLimit, 
  recordLoginAttemptByIP, 
  getClientIP 
} from '@/lib/auth/security';
import {
  validateMobileApiKey,
  unauthorizedResponse,
  logSecurityEvent,
  isCaptchaRequired,
  recordFailedAttemptForCaptcha,
  resetFailedAttempts,
  verifyCaptcha,
} from '@/lib/mobile/security';

/**
 * API Endpoint for Mobile Login (Flutter)
 * Returns a JSON response with a JWT token.
 * 
 * URL: POST /api/auth/mobile/login
 * 
 * Headers:
 *   - X-Mobile-API-Key: Required API key for mobile apps
 *   - Content-Type: application/json
 * 
 * Body:
 *   - email: string (required)
 *   - password: string (required)
 *   - captchaToken: string (required after 3 failed attempts)
 */
export async function POST(request: NextRequest) {
  const clientIP = getClientIP(request);
  const userAgent = request.headers.get('user-agent') || undefined;
  
  try {
    // 1. Validate Mobile API Key
    if (!validateMobileApiKey(request)) {
      await logSecurityEvent({
        event: 'INVALID_API_KEY',
        ip: clientIP,
        userAgent,
      });
      return unauthorizedResponse();
    }

    // 2. Parse request body
    const rawBody = await request.text();
    let body;
    try {
      body = JSON.parse(rawBody);
    } catch (e) {
      return NextResponse.json(
        { success: false, message: 'Format JSON invalide' },
        { status: 400 }
      );
    }
    
    const { email, password, captchaToken } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email et mot de passe requis' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 3. Check if captcha is required
    if (isCaptchaRequired(clientIP, normalizedEmail)) {
      if (!captchaToken) {
        return NextResponse.json(
          { 
            success: false, 
            message: 'Vérification captcha requise',
            error: 'CAPTCHA_REQUIRED',
            captchaRequired: true,
          },
          { status: 403 }
        );
      }
      
      // Verify captcha
      const captchaValid = await verifyCaptcha(captchaToken);
      if (!captchaValid) {
        await logSecurityEvent({
          event: 'CAPTCHA_FAILED',
          ip: clientIP,
          email: normalizedEmail,
          userAgent,
        });
        return NextResponse.json(
          { success: false, message: 'Vérification captcha échouée', error: 'CAPTCHA_INVALID' },
          { status: 403 }
        );
      }
    }
    
    // 4. Check IP-based rate limiting
    const rateLimit = checkLoginRateLimit(clientIP);
    if (!rateLimit.allowed) {
      await logSecurityEvent({
        event: 'RATE_LIMIT_EXCEEDED',
        ip: clientIP,
        email: normalizedEmail,
        userAgent,
        details: { blockedMinutes: rateLimit.blockedMinutes },
      });
      return NextResponse.json(
        { 
          success: false, 
          message: `Trop de tentatives. Réessayez dans ${rateLimit.blockedMinutes} minutes.`,
          error: 'RATE_LIMITED',
        },
        { status: 429 }
      );
    }

    // 5. Check if account is locked
    const lockStatus = await isAccountLocked(normalizedEmail);
    if (lockStatus.blocked) {
      await logSecurityEvent({
        event: 'LOGIN_BLOCKED',
        ip: clientIP,
        email: normalizedEmail,
        userAgent,
        details: { lockoutMinutes: lockStatus.lockoutMinutes },
      });
      return NextResponse.json(
        { 
          success: false, 
          message: `Compte bloqué. Réessayez dans ${lockStatus.lockoutMinutes} minutes.`,
          error: 'ACCOUNT_LOCKED',
        },
        { status: 403 }
      );
    }

    // 6. Find user
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      recordLoginAttemptByIP(clientIP, false);
      recordFailedAttemptForCaptcha(clientIP, normalizedEmail);
      await logSecurityEvent({
        event: 'LOGIN_FAILED',
        ip: clientIP,
        email: normalizedEmail,
        userAgent,
        details: { reason: 'USER_NOT_FOUND' },
      });
      return NextResponse.json(
        { success: false, message: 'Identifiants incorrects' },
        { status: 401 }
      );
    }

    if (!user.isActive) {
      await logSecurityEvent({
        event: 'LOGIN_FAILED',
        ip: clientIP,
        email: normalizedEmail,
        userId: user.id,
        userAgent,
        details: { reason: 'ACCOUNT_DISABLED' },
      });
      return NextResponse.json(
        { success: false, message: 'Compte désactivé', error: 'ACCOUNT_DISABLED' },
        { status: 403 }
      );
    }

    // 7. Verify password
    const isValid = await verifyPassword(password, user.motDePasse);
    if (!isValid) {
      recordLoginAttemptByIP(clientIP, false);
      recordFailedAttemptForCaptcha(clientIP, normalizedEmail);
      const result = await recordFailedLogin(normalizedEmail);
      
      await logSecurityEvent({
        event: 'LOGIN_FAILED',
        ip: clientIP,
        email: normalizedEmail,
        userId: user.id,
        userAgent,
        details: { 
          reason: 'INVALID_PASSWORD',
          attemptsRemaining: result.remainingAttempts,
        },
      });
      
      const message = result.blocked 
        ? `Trop d'échecs. Compte bloqué pour ${result.lockoutMinutes} minutes.`
        : `Identifiants incorrects. ${result.remainingAttempts} tentative(s) restante(s).`;

      return NextResponse.json(
        { 
          success: false, 
          message,
          captchaRequired: isCaptchaRequired(clientIP, normalizedEmail),
        },
        { status: 401 }
      );
    }

    // 8. Success! Reset all counters
    recordLoginAttemptByIP(clientIP, true);
    resetFailedAttempts(clientIP, normalizedEmail);
    await resetLoginAttempts(user.id);

    // 9. Generate JWT Token
    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret) {
      throw new Error('NEXTAUTH_SECRET is not defined');
    }

    const token = await encode({
      token: {
        id: String(user.id),
        email: user.email,
        nom: user.nom,
        prenom: user.prenom,
        role: user.role,
        isActive: user.isActive,
        isEmailVerifie: user.isEmailVerifie,
      },
      secret: secret,
      maxAge: 30 * 24 * 60 * 60, // 30 days for mobile
    });

    // 10. Log successful login
    await logSecurityEvent({
      event: 'LOGIN_SUCCESS',
      ip: clientIP,
      email: normalizedEmail,
      userId: user.id,
      userAgent,
    });

    // 11. Update last connection
    await prisma.user.update({
      where: { id: user.id },
      data: { derniereConnexion: new Date() },
    });

    // 12. Return success response
    return NextResponse.json({
      success: true,
      token: token,
      user: {
        id: user.id,
        email: user.email,
        nom: user.nom,
        prenom: user.prenom,
        role: user.role,
        photo: user.photo,
        isEmailVerifie: user.isEmailVerifie,
      }
    });

  } catch (error: any) {
    console.error('[MOBILE_LOGIN_ERROR]', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Une erreur est survenue lors de la connexion'
      },
      { status: 500 }
    );
  }
}
