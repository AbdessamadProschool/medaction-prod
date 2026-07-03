import { safeParseInt } from '@/lib/utils/parse';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { hashPassword } from '@/lib/auth/password';
import { revalidateTag } from 'next/cache';
import { z } from 'zod';
import { withErrorHandler, successResponse } from '@/lib/api-handler';
import { ForbiddenError, NotFoundError, BadRequestError } from '@/lib/exceptions';
import { withPermission } from '@/lib/auth/api-guard';
import { ActivityLogger } from '@/lib/activity-logger';
import { sanitizeName, sanitizePhone, sanitizeString } from '@/lib/security/sanitize';

const updateUserSchema = z.object({
  nom: z.string().min(2).optional().transform(val => val ? sanitizeName(val) : val),
  prenom: z.string().min(2).optional().transform(val => val ? sanitizeName(val) : val),
  email: z.string().email().optional().transform(val => val ? val.toLowerCase().trim() : val),
  role: z.enum(['CITOYEN', 'DELEGATION', 'AUTORITE_LOCALE', 'ADMIN', 'SUPER_ADMIN', 'GOUVERNEUR']).optional(),
  password: z.string().min(8).optional(),
  isActive: z.boolean().optional(),
  telephone: z.string().optional().nullable().transform(val => val ? sanitizePhone(val) : val),
  secteurResponsable: z.string().optional().nullable().transform(val => val ? sanitizeString(val) : val),
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
  const id = safeParseInt(params.id, 0);
  const body = await request.json();
  const data = updateUserSchema.parse(body);

  // Vérifier que l'utilisateur cible existe
  const targetUser = await prisma.user.findUnique({ where: { id }, select: { role: true } });
  if (!targetUser) throw new NotFoundError('Utilisateur non trouvé');

  // 🛡️ Protection escalade : seul SUPER_ADMIN peut modifier un SUPER_ADMIN ou un GOUVERNEUR
  if ((targetUser.role === 'SUPER_ADMIN' || targetUser.role === 'GOUVERNEUR') && session.user.role !== 'SUPER_ADMIN') {
    throw new ForbiddenError(`Seul un Super Admin peut modifier un profil ${targetUser.role}`);
  }

  // 🛡️ Protection escalade inter-admin
  if (targetUser.role === 'ADMIN' && session.user.role === 'ADMIN' && id !== parseInt(session.user.id)) {
    throw new ForbiddenError('Un Administrateur ne peut pas modifier le profil d\'un autre Administrateur');
  }

  // 🛡️ Anti-escalade : seul SUPER_ADMIN peut promouvoir vers SUPER_ADMIN, GOUVERNEUR ou ADMIN
  if (data.role && ['SUPER_ADMIN', 'GOUVERNEUR', 'ADMIN'].includes(data.role) && session.user.role !== 'SUPER_ADMIN') {
    throw new ForbiddenError(`Vous ne pouvez pas assigner le rôle ${data.role}`);
  }
  
  const updateData: any = { ...data };

  if (data.password) {
    updateData.motDePasse = await hashPassword(data.password);
    delete updateData.password;
  }

  // Protection contre l'auto-dégradation
  if (id === parseInt(session.user.id) && data.role && data.role !== session.user.role) {
    throw new BadRequestError('Vous ne pouvez pas modifier votre propre rôle');
  }

  // Protection contre l'auto-désactivation
  if (id === parseInt(session.user.id) && data.isActive === false) {
    throw new BadRequestError('Vous ne pouvez pas désactiver votre propre compte');
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

  revalidateTag(`user-session-${id}`);

  // Audit log avec comparaison d'état
  await ActivityLogger.custom({
    action: 'UPDATE_USER',
    entity: 'User',
    entityId: updatedUser.id,
    userId: parseInt(session.user.id),
    details: {
      previousValue: targetUser,
      newValue: updatedUser
    }
  });

  return successResponse(updatedUser, 'Utilisateur mis à jour avec succès');
}));

export const DELETE = withPermission('users.delete', withErrorHandler(async (request: NextRequest, { params, session }) => {
  const id = safeParseInt(params.id, 0);

  // Vérifier que l'utilisateur cible existe
  const targetUser = await prisma.user.findUnique({ where: { id }, select: { role: true } });
  if (!targetUser) throw new NotFoundError('Utilisateur non trouvé');

  // 🛡️ Protection : seul SUPER_ADMIN peut supprimer un SUPER_ADMIN ou un GOUVERNEUR
  if ((targetUser.role === 'SUPER_ADMIN' || targetUser.role === 'GOUVERNEUR') && session.user.role !== 'SUPER_ADMIN') {
    throw new ForbiddenError(`Impossible de supprimer un compte ${targetUser.role}`);
  }

  // 🛡️ Protection : un ADMIN ne peut pas supprimer un ADMIN
  if (targetUser.role === 'ADMIN' && session.user.role === 'ADMIN') {
    throw new ForbiddenError('Impossible de supprimer un autre Administrateur');
  }

  // Protection contre l'auto-suppression
  if (id === parseInt(session.user.id)) {
    throw new BadRequestError('Vous ne pouvez pas supprimer votre propre compte');
  }

  try {
    await prisma.user.delete({
      where: { id },
    });

    // Audit log
    await ActivityLogger.custom({
      action: 'DELETE_USER',
      entity: 'User',
      entityId: id,
      userId: parseInt(session.user.id)
    });

    return successResponse(null, 'Utilisateur supprimé');
  } catch (error) {
    throw new BadRequestError('Impossible de supprimer cet utilisateur (données liées). Essayez de le désactiver.');
  }
}));
