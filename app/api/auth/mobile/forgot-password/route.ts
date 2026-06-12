import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { checkRateLimit, getClientIP } from '@/lib/auth/security';
import { validateMobileApiKey, logSecurityEvent } from '@/lib/mobile/security';
import { withErrorHandler, successResponse } from '@/lib/api-handler';
import { UnauthorizedError, AppError, ValidationError } from '@/lib/exceptions';

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
export const POST = withErrorHandler(async (request: NextRequest) => {
  const clientIP = getClientIP(request);
  const userAgent = request.headers.get('user-agent') || undefined;
    // 1. Validate Mobile API Key
    if (!validateMobileApiKey(request)) {
      await logSecurityEvent({
        event: 'INVALID_API_KEY',
        ip: clientIP,
        userAgent,
      });
      throw new UnauthorizedError('Clé API mobile invalide');
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
      throw new AppError('Trop de demandes. Veuillez réessayer plus tard.', 'RATE_LIMIT_EXCEEDED', 429);
    }

    // 3. Parse body
    const rawBody = await request.text();
    let body;
    try {
      body = JSON.parse(rawBody);
    } catch (e) {
      throw new ValidationError('Format JSON invalide');
    }

    const { email } = body;

    if (!email) {
      throw new ValidationError('Email requis');
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
      return successResponse(
        null,
        'Si un compte existe avec cet email, un lien de réinitialisation sera envoyé.'
      );
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

    return successResponse(
      null,
      'Si un compte existe avec cet email, un lien de réinitialisation sera envoyé.'
    );
});
