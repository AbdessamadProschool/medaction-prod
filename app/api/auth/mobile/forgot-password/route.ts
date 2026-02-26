import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { checkRateLimit, getClientIP } from '@/lib/auth/security';
import {
  validateMobileApiKey,
  unauthorizedResponse,
  logSecurityEvent,
} from '@/lib/mobile/security';

// SECURITY: Rate limit config for password reset (3 requests per hour per IP)
const RESET_RATE_LIMIT = { maxRequests: 3, windowMs: 60 * 60 * 1000 };

/**
 * Génère un token aléatoire sécurisé
 */
function generateToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * POST /api/auth/mobile/forgot-password
 * Request password reset - sends email with reset link
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

    // 2. Rate limiting
    const rateLimitResult = checkRateLimit(`forgot-password:${clientIP}`, RESET_RATE_LIMIT);
    if (!rateLimitResult.allowed) {
      await logSecurityEvent({
        event: 'RATE_LIMIT_EXCEEDED',
        ip: clientIP,
        userAgent,
        details: { action: 'forgot-password' },
      });
      return NextResponse.json(
        { success: false, message: 'Trop de demandes. Veuillez réessayer plus tard.' },
        { 
          status: 429,
          headers: { 'Retry-After': String(rateLimitResult.retryAfter || 3600) }
        }
      );
    }

    // 3. Parse body
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

    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, message: 'Email requis' },
        { status: 400 }
      );
    }

    // 4. Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      await logSecurityEvent({
        event: 'PASSWORD_RESET_REQUEST',
        ip: clientIP,
        email: email.toLowerCase(),
        userAgent,
        details: { found: false },
      });
      return NextResponse.json({
        success: true,
        message: 'Si un compte existe avec cet email, un lien de réinitialisation sera envoyé.',
      });
    }

    // 5. Generate reset token
    const resetToken = generateToken();
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

    // 6. Save token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry,
      },
    });

    await logSecurityEvent({
      event: 'PASSWORD_RESET_REQUEST',
      ip: clientIP,
      email: email.toLowerCase(),
      userId: user.id,
      userAgent,
      details: { found: true },
    });

    // TODO: Send email with reset link
    // const resetLink = `${process.env.NEXTAUTH_URL}/reset-password/${resetToken}`;
    // await sendEmail({ to: email, subject: 'Reset password', html: `...` });

    return NextResponse.json({
      success: true,
      message: 'Si un compte existe avec cet email, un lien de réinitialisation sera envoyé.',
    });
  } catch (error) {
    console.error('[MOBILE_FORGOT_PASSWORD_ERROR]', error);
    return NextResponse.json(
      { success: false, message: 'Une erreur est survenue' },
      { status: 500 }
    );
  }
}
