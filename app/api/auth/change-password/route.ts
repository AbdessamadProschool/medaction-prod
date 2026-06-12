import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { compare, hash } from 'bcryptjs';
import { ActivityLogger } from '@/lib/activity-logger';
import { withErrorHandler, successResponse } from '@/lib/api-handler';
import { UnauthorizedError, ValidationError, NotFoundError, ForbiddenError } from '@/lib/exceptions';

// POST - Changer le mot de passe
export const POST = withErrorHandler(async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    throw new UnauthorizedError('Non authentifié');
  }

  const userId = parseInt(session.user.id);
  
  if (!request.headers.get('content-type')?.includes('application/json')) {
    throw new ValidationError('Content-Type must be application/json');
  }

  const body = await request.json();
  const { currentPassword, newPassword } = body;

  if (!currentPassword || !newPassword) {
    throw new ValidationError('Le mot de passe actuel et le nouveau mot de passe sont requis');
  }

  if (newPassword.length < 8) {
    throw new ValidationError('Le nouveau mot de passe doit contenir au moins 8 caractères');
  }

  // Récupérer l'utilisateur avec son mot de passe
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, motDePasse: true, email: true }
  });

  if (!user) {
    throw new NotFoundError('Utilisateur non trouvé');
  }

  // Vérifier le mot de passe actuel
  const isValidPassword = await compare(currentPassword, user.motDePasse);
  if (!isValidPassword) {
    // Log tentative échouée
    await ActivityLogger.custom({
      action: 'CHANGE_PASSWORD_FAILED',
      entity: 'User',
      entityId: userId,
      details: { reason: 'Invalid current password' },
      userId
    });

    throw new ValidationError('Mot de passe actuel incorrect');
  }

  // Hasher le nouveau mot de passe
  const hashedPassword = await hash(newPassword, 12);

  // Mettre à jour le mot de passe
  await prisma.user.update({
    where: { id: userId },
    data: { motDePasse: hashedPassword }
  });

  // Log l'activité
  await ActivityLogger.custom({
    action: 'CHANGE_PASSWORD',
    entity: 'User',
    entityId: userId,
    userId
  });

  // Créer une notification
  await prisma.notification.create({
    data: {
      userId,
      type: 'SECURITE',
      titre: 'Mot de passe modifié',
      message: 'Votre mot de passe a été modifié avec succès. Si vous n\'êtes pas à l\'origine de cette action, contactez immédiatement l\'administrateur.',
      lien: '/admin/profil',
    }
  });

  return successResponse(null, 'Mot de passe modifié avec succès');
});
