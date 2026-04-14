import { safeParseInt } from '@/lib/utils/parse';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { hashPassword } from '@/lib/auth/password';
import { z } from 'zod';
import { withErrorHandler, successResponse } from '@/lib/api-handler';
import { ForbiddenError, NotFoundError, BadRequestError } from '@/lib/exceptions';
import { withPermission } from '@/lib/auth/api-guard';

const updateUserSchema = z.object({
  nom: z.string().min(2).optional(),
  prenom: z.string().min(2).optional(),
  email: z.string().email().optional(),
  role: z.enum(['CITOYEN', 'DELEGATION', 'AUTORITE_LOCALE', 'ADMIN', 'SUPER_ADMIN', 'GOUVERNEUR']).optional(),
  password: z.string().min(8).optional(),
  isActive: z.boolean().optional(),
  telephone: z.string().optional().nullable(),
  secteurResponsable: z.any().optional(),
});

export const GET = withPermission('users.read', withErrorHandler(async (request: NextRequest, { params }) => {
  const id = safeParseInt(params.id, 0);
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      nom: true,
      prenom: true,
      role: true,
      telephone: true,
      photo: true,
      isActive: true,
      secteurResponsable: true,
      dateInscription: true,
      derniereConnexion: true,
      loginAttempts: true,
      lockedUntil: true,
    },
  });

  if (!user) {
    throw new NotFoundError('Utilisateur non trouvé');
  }

  return successResponse(user);
}));

export const PUT = withPermission('users.edit', withErrorHandler(async (request: NextRequest, { params, session }) => {
  // Restriction SUPER_ADMIN pour la modification d'utilisateurs critiques
  if (session.user.role !== 'SUPER_ADMIN') {
    throw new ForbiddenError('Action réservée aux Super Administrateurs');
  }

  const id = safeParseInt(params.id, 0);
  const body = await request.json();
  const data = updateUserSchema.parse(body);
  
  const updateData: any = { ...data };

  if (data.password) {
    updateData.motDePasse = await hashPassword(data.password);
    delete updateData.password;
  }

  // Protection contre l'auto-dégradation
  if (id === parseInt(session.user.id) && data.role && data.role !== 'SUPER_ADMIN') {
    throw new BadRequestError('Vous ne pouvez pas modifier votre propre rôle');
  }

  const updatedUser = await prisma.user.update({
    where: { id },
    data: updateData,
    select: {
      id: true,
      email: true,
      nom: true,
      prenom: true,
      role: true,
      isActive: true,
    },
  });

  return successResponse(updatedUser, 'Utilisateur mis à jour avec succès');
}));

export const DELETE = withPermission('users.delete', withErrorHandler(async (request: NextRequest, { params, session }) => {
  if (session.user.role !== 'SUPER_ADMIN') {
    throw new ForbiddenError('Action réservée aux Super Administrateurs');
  }

  const id = safeParseInt(params.id, 0);

  // Protection contre l'auto-suppression
  if (id === parseInt(session.user.id)) {
    throw new BadRequestError('Vous ne pouvez pas supprimer votre propre compte');
  }

  try {
    await prisma.user.delete({
      where: { id },
    });
    return successResponse(null, 'Utilisateur supprimé');
  } catch (error) {
    throw new BadRequestError('Impossible de supprimer cet utilisateur (données liées). Essayez de le désactiver.');
  }
}));
