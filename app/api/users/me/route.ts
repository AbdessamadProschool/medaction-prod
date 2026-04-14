import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { SecurityValidation } from '@/lib/security/validation';
import { withErrorHandler, successResponse } from '@/lib/api-handler';
import { UnauthorizedError, NotFoundError, ConflictError } from '@/lib/exceptions';

/**
 * Schéma de validation pour la mise à jour du profil
 */
const updateProfileSchema = z.object({
  nom: SecurityValidation.schemas.title.optional(),
  prenom: SecurityValidation.schemas.title.optional(),
  telephone: z
    .string()
    .regex(/^(\+212|0)[5-7]\d{8}$/, 'Numéro de téléphone marocain invalide')
    .nullable()
    .optional(),
});

/**
 * GET /api/users/me
 * Récupère les informations du profil de l'utilisateur connecté
 */
export const GET = withErrorHandler(async () => {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    throw new UnauthorizedError('Vous devez être connecté');
  }

  const user = await prisma.user.findUnique({
    where: { id: parseInt(session.user.id) },
    select: {
      id: true,
      email: true,
      nom: true,
      prenom: true,
      telephone: true,
      photo: true,
      role: true,
      isActive: true,
      isEmailVerifie: true,
      isTelephoneVerifie: true,
      secteurResponsable: true,
      communeResponsableId: true,
      etablissementsGeres: true,
      dateInscription: true,
      derniereConnexion: true,
      createdAt: true,
      updatedAt: true,
      communeResponsable: {
        select: {
          id: true,
          nom: true,
        },
      },
    },
  });

  if (!user) {
    throw new NotFoundError('Utilisateur non trouvé');
  }

  return successResponse(user);
});

/**
 * PATCH /api/users/me
 * Met à jour les informations du profil de l'utilisateur connecté
 */
export const PATCH = withErrorHandler(async (request: Request) => {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    throw new UnauthorizedError('Vous devez être connecté');
  }

  const body = await request.json();
  const validation = updateProfileSchema.safeParse(body);

  if (!validation.success) {
    throw validation.error;
  }

  const { nom, prenom, telephone } = validation.data;
  const userId = parseInt(session.user.id);

  // Vérifier si le téléphone est déjà utilisé par un autre utilisateur
  if (telephone) {
    const existingPhone = await prisma.user.findFirst({
      where: {
        telephone,
        id: { not: userId },
      },
    });

    if (existingPhone) {
      throw new ConflictError('Ce numéro de téléphone est déjà utilisé');
    }
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(nom && { nom }),
      ...(prenom && { prenom }),
      ...(telephone !== undefined && { telephone }),
    },
    select: {
      id: true,
      email: true,
      nom: true,
      prenom: true,
      telephone: true,
      photo: true,
      role: true,
      updatedAt: true,
    },
  });

  return successResponse(updatedUser, 'Profil mis à jour avec succès');
});
