import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';

// DELETE - Réinitialiser le 2FA d'un utilisateur (SUPER_ADMIN uniquement)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Seul SUPER_ADMIN peut réinitialiser le 2FA d'un autre utilisateur
    if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ 
        error: 'Seul un Super Admin peut réinitialiser le 2FA' 
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
    if (targetUser.id === parseInt(session.user.id)) {
      return NextResponse.json({ 
        error: 'Utilisez la page /profil/securite pour votre propre compte' 
      }, { status: 400 });
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
        userId: parseInt(session.user.id),
        action: 'RESET_USER_2FA',
        entity: 'User',
        entityId: userId,
        details: {
          targetUser: `${targetUser.prenom} ${targetUser.nom}`,
          targetEmail: targetUser.email,
          resetBy: session.user.email,
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

// GET - Statut 2FA d'un utilisateur (pour affichage admin)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
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
