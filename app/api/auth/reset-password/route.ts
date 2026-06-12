import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { hashPassword } from '@/lib/auth/password';
import { withErrorHandler, successResponse } from '@/lib/api-handler';
import { ValidationError, NotFoundError } from '@/lib/exceptions';

/**
 * POST /api/auth/reset-password
 * Réinitialise le mot de passe avec un token valide
 */
export const POST = withErrorHandler(async (request: Request) => {
  const { token, password } = await request.json();

  if (!token || !password) {
    throw new ValidationError('Token et mot de passe requis');
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
    throw new ValidationError('Token invalide ou expiré');
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

  return successResponse(null, 'Votre mot de passe a été réinitialisé avec succès');
});
