import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * POST /api/auth/verify-email
 * Vérifie l'email d'un utilisateur avec un token
 */
export async function POST(request: Request) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Token requis' },
        { status: 400 }
      );
    }

    // Chercher l'utilisateur avec ce token
    const user = await prisma.user.findFirst({
      where: {
        emailVerificationToken: token,
        emailVerificationExpiry: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Token invalide ou expiré' },
        { status: 400 }
      );
    }

    // Mettre à jour l'utilisateur
    await prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerifie: true,
        emailVerificationToken: null,
        emailVerificationExpiry: null,
      },
    });

    console.log(`[EMAIL VERIFICATION] Email vérifié pour: ${user.email}`);

    return NextResponse.json({
      success: true,
      message: 'Votre adresse email a été vérifiée avec succès',
    });
  } catch (error) {
    console.error('[VERIFY EMAIL] Erreur:', error);
    return NextResponse.json(
      { success: false, message: 'Une erreur est survenue' },
      { status: 500 }
    );
  }
}
