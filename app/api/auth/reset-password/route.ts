import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { hashPassword } from '@/lib/auth/password';

/**
 * POST /api/auth/reset-password
 * Réinitialise le mot de passe avec un token valide
 */
export async function POST(request: Request) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json(
        { success: false, message: 'Token et mot de passe requis' },
        { status: 400 }
      );
    }

    // Chercher l'utilisateur avec ce token
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
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

    // Hasher le nouveau mot de passe
    const hashedPassword = await hashPassword(password);

    // Mettre à jour le mot de passe et supprimer le token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        motDePasse: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    console.log(`[PASSWORD RESET] Mot de passe réinitialisé pour: ${user.email}`);

    return NextResponse.json({
      success: true,
      message: 'Votre mot de passe a été réinitialisé avec succès',
    });
  } catch (error) {
    console.error('[RESET PASSWORD] Erreur:', error);
    return NextResponse.json(
      { success: false, message: 'Une erreur est survenue' },
      { status: 500 }
    );
  }
}
