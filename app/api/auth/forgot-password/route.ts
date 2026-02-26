import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { checkRateLimit, RATE_LIMIT_CONFIGS } from '@/lib/rate-limit';

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
 * Extrait l'IP du client (pour rate limiting)
 */
function getClientIP(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
         request.headers.get('x-real-ip') || 
         'unknown';
}

/**
 * POST /api/auth/forgot-password
 * Envoie un email de réinitialisation de mot de passe
 */
export async function POST(request: NextRequest) {
  try {
    // SECURITY FIX: Rate limiting - 3 demandes par heure par IP
    const clientIP = getClientIP(request);
    const rateLimitResult = checkRateLimit(`forgot-password:${clientIP}`, RESET_RATE_LIMIT);
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { success: false, message: 'Trop de demandes. Veuillez réessayer plus tard.' },
        { 
          status: 429,
          headers: { 'Retry-After': String(rateLimitResult.retryAfter || 3600) }
        }
      );
    }

    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, message: 'Email requis' },
        { status: 400 }
      );
    }

    // Chercher l'utilisateur
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Toujours retourner succès pour ne pas révéler si l'email existe
    if (!user) {
      return NextResponse.json({
        success: true,
        message: 'Si un compte existe avec cet email, un lien de réinitialisation sera envoyé.',
      });
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

    return NextResponse.json({
      success: true,
      message: 'Si un compte existe avec cet email, un lien de réinitialisation sera envoyé.',
      // SECURITY FIX: Ne JAMAIS exposer le token, même en dev
      // Le token est envoyé par email uniquement
    });
  } catch (error) {
    console.error('[FORGOT PASSWORD] Erreur:', error);
    return NextResponse.json(
      { success: false, message: 'Une erreur est survenue' },
      { status: 500 }
    );
  }
}

