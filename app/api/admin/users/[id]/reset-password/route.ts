import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { hashPassword } from '@/lib/auth/password';
import { checkPermission } from '@/lib/permissions';
import { withErrorHandler, successResponse } from '@/lib/api-handler';
import { UnauthorizedError, ForbiddenError, ValidationError, NotFoundError } from '@/lib/exceptions';
import { getSafeId } from '@/lib/utils/parse';
import { ActivityLogger } from '@/lib/activity-logger';

/**
 * POST /api/admin/users/[id]/reset-password
 * Permet à un utilisateur ayant la permission 'users.reset-password' de réinitialiser
 * le mot de passe d'un autre utilisateur.
 * 
 * 🔐 Permissions requises : users.reset-password (ou SUPER_ADMIN bypass)
 * 🛡️ Sécurité : Un non-SUPER_ADMIN ne peut pas reset le mdp d'un SUPER_ADMIN
 */
export const POST = withErrorHandler(async (
  request: NextRequest,
  { params: _p }: { params: Promise<{ id: string }> }
) => {
  const params = await _p;
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    throw new UnauthorizedError('Non authentifié');
  }

  const requesterId = parseInt(session.user.id);

  // 🔐 Vérification de permission RBAC (remplace le check hardcodé)
  // SUPER_ADMIN bypass automatique via checkPermission()
  const hasPermission = await checkPermission(requesterId, 'users.reset-password');
  if (!hasPermission) {
    throw new ForbiddenError("La permission 'users.reset-password' est requise pour cette action. Demandez au Super Admin de vous l'accorder.");
  }

  // 🛡️ SECURITY FIX: Restreindre l'utilisation de cette route critique aux seuls ADMIN / SUPER_ADMIN
  if (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN') {
    throw new ForbiddenError('Accès refusé. Seuls les administrateurs peuvent utiliser cette fonction.');
  }

  const userId = getSafeId(params.id);

  // Empêcher de réinitialiser son propre mot de passe via cette route admin
  if (userId === requesterId) {
    throw new ValidationError('Utilisez la route /api/users/me/password pour modifier votre propre mot de passe');
  }

  // Vérifier que l'utilisateur cible existe
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, nom: true, prenom: true, role: true }
  });

  if (!user) {
    throw new NotFoundError('Utilisateur non trouvé');
  }

  // 🛡️ Protection escalade (Account Takeover) : 
  // Un non-SUPER_ADMIN ne peut pas reset le mdp d'un SUPER_ADMIN ni d'un GOUVERNEUR
  if ((user.role === 'SUPER_ADMIN' || user.role === 'GOUVERNEUR') && session.user.role !== 'SUPER_ADMIN') {
    throw new ForbiddenError(`Seul un Super Admin peut réinitialiser le mot de passe d'un ${user.role}`);
  }

  // Un ADMIN ne peut pas reset le mdp d'un autre ADMIN
  if (user.role === 'ADMIN' && session.user.role === 'ADMIN' && userId !== requesterId) {
    throw new ForbiddenError('Un Administrateur ne peut pas réinitialiser le mot de passe d\'un autre Administrateur');
  }

    // Récupérer le nouveau mot de passe du body, ou en générer un
    const body = await request.json().catch(() => ({}));
    let newPassword = body.newPassword;

    // Si pas de mot de passe fourni, en générer un aléatoire
    if (!newPassword) {
      newPassword = generateRandomPassword();
    }

  // Valider le mot de passe (min 8 caractères)
  if (newPassword.length < 8) {
    throw new ValidationError('Le mot de passe doit contenir au moins 8 caractères');
  }

    // Hasher le nouveau mot de passe
    const hashedPassword = await hashPassword(newPassword);

    // Mettre à jour le mot de passe
    await prisma.user.update({
      where: { id: userId },
      data: {
        motDePasse: hashedPassword,
        // Réinitialiser les tentatives de connexion
        loginAttempts: 0,
        lockedUntil: null,
        lastFailedLogin: null,
        // Supprimer les tokens de reset
        resetToken: null,
        resetTokenExpiry: null,
      }
    });

  // Logger l'action
  await ActivityLogger.custom({
    action: 'PASSWORD_RESET_BY_ADMIN',
    entity: 'User',
    entityId: userId,
    details: {
      targetEmail: user.email,
      performedBy: session.user.email,
      performerRole: session.user.role,
    },
    userId: requesterId
  });

  // Créer une notification pour l'utilisateur
  await prisma.notification.create({
    data: {
      userId: userId,
      type: 'MOT_DE_PASSE_REINITIALISE',
      titre: 'Mot de passe réinitialisé',
      message: 'Votre mot de passe a été réinitialisé par un administrateur. Veuillez vous connecter avec le nouveau mot de passe fourni.',
      lien: '/login',
    }
  });

  console.log(`[ADMIN] Password reset for user ${user.email} by ${session.user.email} (role: ${session.user.role})`);

  return successResponse({
    user: {
      id: user.id,
      email: user.email,
      nom: user.nom,
      prenom: user.prenom,
    },
    // Retourner le mot de passe généré pour que l'admin puisse le communiquer
    generatedPassword: newPassword,
    note: 'Communiquez ce mot de passe à l\'utilisateur de manière sécurisée.'
  }, 'Mot de passe réinitialisé avec succès');
});

/**
 * Génère un mot de passe aléatoire sécurisé
 */
function generateRandomPassword(): string {
  const length = 12;
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const special = '!@#$%^&*';
  
  const all = lowercase + uppercase + numbers + special;
  
  // S'assurer qu'on a au moins un caractère de chaque type
  let password = '';
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];
  
  // Compléter avec des caractères aléatoires
  for (let i = 4; i < length; i++) {
    password += all[Math.floor(Math.random() * all.length)];
  }
  
  // Mélanger le mot de passe
  return password.split('').sort(() => Math.random() - 0.5).join('');
}