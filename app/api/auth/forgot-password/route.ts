import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

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
export async function POST(request: Request) {
  try {
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
    // Pour l'instant, on log le lien (à remplacer par un vrai service d'email)
    const resetLink = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;
    console.log(`[PASSWORD RESET] Lien pour ${email}: ${resetLink}`);

    // En production, utiliser un service comme Resend, SendGrid, etc.
    // await sendEmail({
    //   to: email,
    //   subject: 'Réinitialisation de votre mot de passe - MedAction',
    //   html: `<p>Cliquez sur ce lien pour réinitialiser votre mot de passe: <a href="${resetLink}">${resetLink}</a></p>`
    // });

    return NextResponse.json({
      success: true,
      message: 'Si un compte existe avec cet email, un lien de réinitialisation sera envoyé.',
      // En dev, on retourne le token pour faciliter les tests
      ...(process.env.NODE_ENV === 'development' && { resetLink }),
    });
  } catch (error) {
    console.error('[FORGOT PASSWORD] Erreur:', error);
    return NextResponse.json(
      { success: false, message: 'Une erreur est survenue' },
      { status: 500 }
    );
  }
}

