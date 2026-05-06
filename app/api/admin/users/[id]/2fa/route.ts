import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { checkPermission } from '@/lib/permissions';

/**
 * DELETE /api/admin/users/[id]/2fa
 * Réinitialiser le 2FA d'un utilisateur
 * 
 * 🔐 Permission requise : users.manage-2fa (ou SUPER_ADMIN bypass)
 * 🛡️ Sécurité : Un non-SUPER_ADMIN ne peut pas reset le 2FA d'un SUPER_ADMIN
 */
export async function DELETE(
  request: NextRequest,
  { params: _p }: { params: Promise<{ id: string }> }
) {
  const params = await _p;
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const requesterId = parseInt(session.user.id);

    // 🔐 Vérification RBAC (remplace le check hardcodé SUPER_ADMIN)
    const hasPermission = await checkPermission(requesterId, 'users.manage-2fa');
    if (!hasPermission) {
      return NextResponse.json({ 
        error: 'Permission insuffisante',
        details: "La permission 'users.manage-2fa' est requise pour cette action."
      }, { status: 403 });
    }

    const userId = parseInt(params.id);
    if (isNaN(userId)) {
      return NextResponse.json({ error: 'ID invalide' }, { status: 400 });
    }

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
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    // Empêcher de réinitialiser son propre 2FA via cette route
    if (targetUser.id === requesterId) {
      return NextResponse.json({ 
        error: 'Utilisez la page /profil/securite pour votre propre compte' 
      }, { status: 400 });
    }

    // 🛡️ Protection escalade : Un non-SUPER_ADMIN ne peut pas toucher un SUPER_ADMIN
    if (targetUser.role === 'SUPER_ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ 
        error: 'Seul un Super Admin peut gérer le 2FA d\'un autre Super Admin' 
      }, { status: 403 });
    }

    if (!targetUser.twoFactorEnabled) {
      return NextResponse.json({ 
        error: 'Cet utilisateur n\'a pas le 2FA activé' 
      }, { status: 400 });
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
    await prisma.activityLog.create({
      data: {
        userId: requesterId,
        action: 'RESET_USER_2FA',
        entity: 'User',
        entityId: userId,
        details: {
          targetUser: `${targetUser.prenom} ${targetUser.nom}`,
          targetEmail: targetUser.email,
          resetBy: session.user.email,
          performerRole: session.user.role,
        }
      }
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

    return NextResponse.json({
      message: `2FA réinitialisé pour ${targetUser.prenom} ${targetUser.nom}`,
      data: {
        userId: targetUser.id,
        email: targetUser.email,
      }
    });

  } catch (error) {
    console.error('Erreur reset 2FA:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

/**
 * GET /api/admin/users/[id]/2fa
 * Statut 2FA d'un utilisateur (pour affichage admin)
 * 
 * 🔐 Permission requise : users.security (ou SUPER_ADMIN bypass)
 */
export async function GET(
  request: NextRequest,
  { params: _p }: { params: Promise<{ id: string }> }
) {
  const params = await _p;
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const requesterId = parseInt(session.user.id);

    // 🔐 Vérification RBAC
    const hasPermission = await checkPermission(requesterId, 'users.security');
    if (!hasPermission) {
      return NextResponse.json({ 
        error: 'Permission insuffisante',
        details: "La permission 'users.security' est requise pour cette action."
      }, { status: 403 });
    }

    const userId = parseInt(params.id);
    if (isNaN(userId)) {
      return NextResponse.json({ error: 'ID invalide' }, { status: 400 });
    }

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
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    return NextResponse.json({
      data: {
        id: user.id,
        email: user.email,
        nom: user.nom,
        prenom: user.prenom,
        twoFactorEnabled: user.twoFactorEnabled,
      }
    });

  } catch (error) {
    console.error('Erreur GET 2FA status:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}