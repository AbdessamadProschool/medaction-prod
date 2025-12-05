import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { hashPassword, verifyPassword } from '@/lib/auth/password';
import { z } from 'zod';

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
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Non authentifié' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = changePasswordSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Données invalides',
          errors: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { currentPassword, newPassword } = validation.data;

    // Récupérer l'utilisateur avec son mot de passe actuel
    const user = await prisma.user.findUnique({
      where: { id: parseInt(session.user.id) },
      select: { id: true, email: true, motDePasse: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    // Vérifier le mot de passe actuel
    const isValidPassword = await verifyPassword(currentPassword, user.motDePasse);

    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, message: 'Mot de passe actuel incorrect' },
        { status: 400 }
      );
    }

    // Hasher et sauvegarder le nouveau mot de passe
    const hashedPassword = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: user.id },
      data: { motDePasse: hashedPassword },
    });

    console.log(`[POST /api/users/me/password] Mot de passe changé pour: ${user.email}`);

    return NextResponse.json({
      success: true,
      message: 'Mot de passe modifié avec succès',
    });
  } catch (error) {
    console.error('[POST /api/users/me/password] Erreur:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
