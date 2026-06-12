import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withErrorHandler, successResponse } from '@/lib/api-handler';
import { ValidationError, NotFoundError } from '@/lib/exceptions';

/**
 * POST /api/auth/verify-email
 * Vérifie l'email d'un utilisateur avec un token
 */
export const POST = withErrorHandler(async (request: Request) => {
  const { token } = await request.json();

  if (!token) {
    throw new ValidationError('Token requis');
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
    throw new ValidationError('Token invalide ou expiré');
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

  return successResponse(null, 'Votre adresse email a été vérifiée avec succès');
});
