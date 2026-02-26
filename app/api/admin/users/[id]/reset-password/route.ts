import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { hashPassword } from '@/lib/auth/password';

/**
 * POST /api/admin/users/[id]/reset-password
 * Permet au Super Admin de réinitialiser le mot de passe d'un utilisateur
 * Le nouveau mot de passe est généré automatiquement ou fourni
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Seuls SUPER_ADMIN peut réinitialiser les mots de passe
    if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ 
        error: 'Seul le Super Admin peut réinitialiser les mots de passe' 
      }, { status: 403 });
    }

    const userId = parseInt(params.id);
    if (isNaN(userId)) {
      return NextResponse.json({ error: 'ID utilisateur invalide' }, { status: 400 });
    }

    // Vérifier que l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, nom: true, prenom: true, role: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
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
      return NextResponse.json({ 
        error: 'Le mot de passe doit contenir au moins 8 caractères' 
      }, { status: 400 });
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
    await prisma.activityLog.create({
      data: {
        userId: parseInt(session.user.id),
        action: 'PASSWORD_RESET_BY_ADMIN',
        entity: 'User',
        entityId: userId,
        details: {
          targetEmail: user.email,
          performedBy: session.user.email,
        }
      }
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

    console.log(`[ADMIN] Password reset for user ${user.email} by ${session.user.email}`);

    return NextResponse.json({
      message: 'Mot de passe réinitialisé avec succès',
      user: {
        id: user.id,
        email: user.email,
        nom: user.nom,
        prenom: user.prenom,
      },
      // Retourner le mot de passe généré pour que l'admin puisse le communiquer
      generatedPassword: newPassword,
      note: 'Communiquez ce mot de passe à l\'utilisateur de manière sécurisée.'
    });

  } catch (error) {
    console.error('Erreur reset password:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

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
