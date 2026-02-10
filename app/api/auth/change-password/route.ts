import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { compare, hash } from 'bcryptjs';

// POST - Changer le mot de passe
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const userId = parseInt(session.user.id);
    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ 
        error: 'Le mot de passe actuel et le nouveau mot de passe sont requis' 
      }, { status: 400 });
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ 
        error: 'Le nouveau mot de passe doit contenir au moins 8 caractères' 
      }, { status: 400 });
    }

    // Récupérer l'utilisateur avec son mot de passe
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, motDePasse: true, email: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    // Vérifier le mot de passe actuel
    const isValidPassword = await compare(currentPassword, user.motDePasse);
    if (!isValidPassword) {
      // Log tentative échouée
      await prisma.activityLog.create({
        data: {
          userId,
          action: 'CHANGE_PASSWORD_FAILED',
          entity: 'User',
          entityId: userId,
          details: { reason: 'Invalid current password' }
        }
      });

      return NextResponse.json({ error: 'Mot de passe actuel incorrect' }, { status: 400 });
    }

    // Hasher le nouveau mot de passe
    const hashedPassword = await hash(newPassword, 12);

    // Mettre à jour le mot de passe
    await prisma.user.update({
      where: { id: userId },
      data: { motDePasse: hashedPassword }
    });

    // Log l'activité
    await prisma.activityLog.create({
      data: {
        userId,
        action: 'CHANGE_PASSWORD',
        entity: 'User',
        entityId: userId,
      }
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

    return NextResponse.json({ 
      message: 'Mot de passe modifié avec succès' 
    });

  } catch (error) {
    console.error('Erreur change password:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
