import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { hashPassword, verifyPassword } from '@/lib/auth/password';
import { z } from 'zod';
import { withErrorHandler, successResponse } from '@/lib/api-handler';
import { UnauthorizedError, ValidationError, NotFoundError } from '@/lib/exceptions';

/**
 * Schéma de validation pour le changement de mot de passe
 */
const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Mot de passe actuel requis'),
  newPassword: z
    .string()
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
    .regex(/[A-Z]/, 'Le mot de passe doit contenir au moins une majuscule')
    .regex(/[a-z]/, 'Le mot de passe doit contenir au moins une minuscule')
    .regex(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
});

/**
 * POST /api/users/me/password
 * Change le mot de passe de l'utilisateur connecté
 */
export const POST = withErrorHandler(async (request: Request) => {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    throw new UnauthorizedError('Vous devez être connecté');
  }

  const body = await request.json();
  const validation = changePasswordSchema.safeParse(body);

  if (!validation.success) {
    throw validation.error;
  }

  const { currentPassword, newPassword } = validation.data;
  const userId = parseInt(session.user.id);

  // Récupérer l'utilisateur avec son mot de passe actuel
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, motDePasse: true },
  });

  if (!user) {
    throw new NotFoundError('Utilisateur non trouvé');
  }

  // Vérifier le mot de passe actuel
  const isValidPassword = await verifyPassword(currentPassword, user.motDePasse);

  if (!isValidPassword) {
    throw new ValidationError('Mot de passe actuel incorrect');
  }

  // Hasher et sauvegarder le nouveau mot de passe
  const hashedPassword = await hashPassword(newPassword);

  await prisma.user.update({
    where: { id: userId },
    data: { motDePasse: hashedPassword },
  });

  return successResponse(null, 'Mot de passe modifié avec succès');
});
