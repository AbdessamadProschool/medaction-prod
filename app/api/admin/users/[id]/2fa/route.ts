import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { checkPermission } from '@/lib/permissions';
import { withErrorHandler, successResponse } from '@/lib/api-handler';
import { UnauthorizedError, ForbiddenError, ValidationError, NotFoundError } from '@/lib/exceptions';
import { getSafeId } from '@/lib/utils/parse';
import { ActivityLogger } from '@/lib/activity-logger';

/**
 * DELETE /api/admin/users/[id]/2fa
 * Réinitialiser le 2FA d'un utilisateur
 * 
 * 🔐 Permission requise : users.manage-2fa (ou SUPER_ADMIN bypass)
 * 🛡️ Sécurité : Un non-SUPER_ADMIN ne peut pas reset le 2FA d'un SUPER_ADMIN
 */
export const DELETE = withErrorHandler(async (
  request: NextRequest,
  { params: _p }: { params: Promise<{ id: string }> }
) => {
  const params = await _p;
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    throw new UnauthorizedError('Non authentifié');
  }

  const requesterId = parseInt(session.user.id);

  // 🔐 Vérification RBAC (remplace le check hardcodé SUPER_ADMIN)
  const hasPermission = await checkPermission(requesterId, 'users.manage-2fa');
  if (!hasPermission) {
    throw new ForbiddenError("La permission 'users.manage-2fa' est requise pour cette action.");
  }

  const userId = getSafeId(params.id);

    // Récupérer l'utilisateur cible
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        id: true, 
        nom: true, 
        prenom: true, 
        email: true,
        role: true,
        twoFactorEnabled: true 
      }
    });

  if (!targetUser) {
    throw new NotFoundError('Utilisateur non trouvé');
  }

  // Empêcher de réinitialiser son propre 2FA via cette route
  if (targetUser.id === requesterId) {
    throw new ValidationError('Utilisez la page /profil/securite pour votre propre compte');
  }

  // 🛡️ Protection escalade (Account Takeover) : 
  // Un non-SUPER_ADMIN ne peut pas toucher un SUPER_ADMIN ou un GOUVERNEUR
  if ((targetUser.role === 'SUPER_ADMIN' || targetUser.role === 'GOUVERNEUR') && session.user.role !== 'SUPER_ADMIN') {
    throw new ForbiddenError(`Seul un Super Admin peut gérer le 2FA d'un profil ${targetUser.role}`);
  }

  // Un ADMIN ne peut pas reset le 2FA d'un autre ADMIN
  if (targetUser.role === 'ADMIN' && session.user.role === 'ADMIN' && targetUser.id !== requesterId) {
    throw new ForbiddenError('Un Administrateur ne peut pas réinitialiser le 2FA d\'un autre Administrateur');
  }

  if (!targetUser.twoFactorEnabled) {
    throw new ValidationError('Cet utilisateur n\'a pas le 2FA activé');
  }

    // Réinitialiser le 2FA
    await prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorBackupCodes: null,
      }
    });

  // Log l'action
  await ActivityLogger.custom({
    action: 'RESET_USER_2FA',
    entity: 'User',
    entityId: userId,
    details: {
      targetUser: `${targetUser.prenom} ${targetUser.nom}`,
      targetEmail: targetUser.email,
      resetBy: session.user.email,
      performerRole: session.user.role,
    },
    userId: requesterId
  });

  // Notifier l'utilisateur
  await prisma.notification.create({
    data: {
      userId: userId,
      type: 'SECURITE',
      titre: 'Authentification à deux facteurs réinitialisée',
      message: `Votre 2FA a été réinitialisé par un administrateur. Vous pouvez le réactiver depuis votre profil.`,
      lien: '/profil/securite',
    }
  });

  return successResponse({
    userId: targetUser.id,
    email: targetUser.email,
  }, `2FA réinitialisé pour ${targetUser.prenom} ${targetUser.nom}`);
});

/**
 * GET /api/admin/users/[id]/2fa
 * Statut 2FA d'un utilisateur (pour affichage admin)
 * 
 * 🔐 Permission requise : users.security (ou SUPER_ADMIN bypass)
 */
export const GET = withErrorHandler(async (
  request: NextRequest,
  { params: _p }: { params: Promise<{ id: string }> }
) => {
  const params = await _p;
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    throw new UnauthorizedError('Non authentifié');
  }

  const requesterId = parseInt(session.user.id);

  // 🔐 Vérification RBAC
  const hasPermission = await checkPermission(requesterId, 'users.security');
  if (!hasPermission) {
    throw new ForbiddenError("La permission 'users.security' est requise pour cette action.");
  }

  const userId = getSafeId(params.id);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        id: true, 
        email: true,
        nom: true,
        prenom: true,
        twoFactorEnabled: true,
      }
    });

  if (!user) {
    throw new NotFoundError('Utilisateur non trouvé');
  }

  return successResponse({
    id: user.id,
    email: user.email,
    nom: user.nom,
    prenom: user.prenom,
    twoFactorEnabled: user.twoFactorEnabled,
  });
});