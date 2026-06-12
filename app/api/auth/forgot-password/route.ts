import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { SecurityValidation } from '@/lib/security/validation';
import { checkRateLimit, getClientIP } from '@/lib/auth/security';
import { withErrorHandler, successResponse } from '@/lib/api-handler';
import { TooManyRequestsError, ValidationError } from '@/lib/exceptions';

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
 * POST /api/auth/forgot-password
 * Envoie un email de réinitialisation de mot de passe
 */
export const POST = withErrorHandler(async (request: NextRequest) => {
  // SECURITY FIX: Rate limiting - 3 demandes par heure par IP
  const clientIP = getClientIP(request);
  const rateLimitResult = checkRateLimit(`forgot-password:${clientIP}`, RESET_RATE_LIMIT);
  
  if (!rateLimitResult.allowed) {
    throw new TooManyRequestsError('Trop de demandes. Veuillez réessayer plus tard.', {
      headers: { 'Retry-After': String(rateLimitResult.retryAfter || 3600) }
    });
  }

  const body = await request.json();
  
  // Validation avec SecurityValidation
  const validation = SecurityValidation.schemas.email.safeParse(body.email);
  
  if (!validation.success) {
    throw new ValidationError('Email invalide');
  }

    const email = validation.data;

  // Chercher l'utilisateur
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  // Toujours retourner succès pour ne pas révéler si l'email existe
  if (!user) {
    return successResponse(null, 'Si un compte existe avec cet email, un lien de réinitialisation sera envoyé.');
  }

  // Générer un token de réinitialisation
  const resetToken = generateToken();
  const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 heure

  // Sauvegarder le token
  await prisma.user.update({
    where: { id: user.id },
    data: {
      resetToken,
      resetTokenExpiry,
    },
  });

  // TODO: Envoyer l'email avec le lien de réinitialisation
  // SECURITY FIX: Ne jamais logger le token complet - uniquement pour debugging en dev
  const resetLink = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;
  
  // SECURITY: Log seulement l'email masqué, pas le token
  console.log(`[PASSWORD RESET] Demande pour ${email.replace(/(.{2}).*(@.*)/, '$1***$2')}`);

  // En production, utiliser un service comme Resend, SendGrid, etc.
  // await sendEmail({
  //   to: email,
  //   subject: 'Réinitialisation de votre mot de passe - MedAction',
  //   html: `<p>Cliquez sur ce lien pour réinitialiser votre mot de passe: <a href="${resetLink}">${resetLink}</a></p>`
  // });

  return successResponse(null, 'Si un compte existe avec cet email, un lien de réinitialisation sera envoyé.');
});

