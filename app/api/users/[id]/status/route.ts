import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";

// PATCH /api/users/[id]/status - Modifier le statut (actif/inactif) d'un utilisateur
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Vérification de l'authentification
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const currentUserRole = session.user.role;
    
    // Seuls ADMIN et SUPER_ADMIN peuvent modifier les statuts
    if (!['ADMIN', 'SUPER_ADMIN'].includes(currentUserRole)) {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
    }

    const userId = parseInt(params.id);
    if (isNaN(userId)) {
      return NextResponse.json({ error: "ID invalide" }, { status: 400 });
    }

    const body = await request.json();
    const { isActive, reason } = body;

    // Validation
    if (typeof isActive !== 'boolean') {
      return NextResponse.json(
        { error: "Le champ isActive doit être true ou false" },
        { status: 400 }
      );
    }

    // Vérifier que l'utilisateur existe
    const existingUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!existingUser) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    // === RÈGLES DE PERMISSION ===
    
    // 1. ADMIN ne peut pas désactiver un SUPER_ADMIN
    if (existingUser.role === 'SUPER_ADMIN' && currentUserRole !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: "Seul un Super Admin peut modifier le statut d'un Super Admin" },
        { status: 403 }
      );
    }

    // 2. ADMIN ne peut pas désactiver un autre ADMIN (sauf SUPER_ADMIN)
    if (existingUser.role === 'ADMIN' && currentUserRole !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: "Seul un Super Admin peut modifier le statut d'un Admin" },
        { status: 403 }
      );
    }

    // 3. On ne peut pas se désactiver soi-même
    const currentUserId = parseInt(session.user.id as string);
    if (existingUser.id === currentUserId) {
      return NextResponse.json(
        { error: "Vous ne pouvez pas modifier votre propre statut" },
        { status: 403 }
      );
    }

    // 4. Vérifier que le statut change réellement
    if (existingUser.isActive === isActive) {
      return NextResponse.json({
        success: true,
        message: `L'utilisateur est déjà ${isActive ? 'actif' : 'inactif'}`,
        noChange: true,
      });
    }

    // === MISE À JOUR ===
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { isActive },
      select: {
        id: true,
        email: true,
        nom: true,
        prenom: true,
        role: true,
        isActive: true,
        updatedAt: true,
      }
    });

    // Log de l'action (pour audit)
    const action = isActive ? 'ACTIVATED' : 'DEACTIVATED';
    console.log(`[AUDIT] User ${session.user.id} (${currentUserRole}) ${action} user ${userId}. Reason: ${reason || 'N/A'}`);

    // Créer une notification pour l'utilisateur concerné
    try {
      await prisma.notification.create({
        data: {
          userId,
          type: isActive ? 'ACCOUNT_ACTIVATED' : 'ACCOUNT_DEACTIVATED',
          titre: isActive ? 'Compte réactivé' : 'Compte désactivé',
          message: isActive 
            ? 'Votre compte a été réactivé par un administrateur.'
            : `Votre compte a été désactivé. ${reason ? `Raison: ${reason}` : ''}`,
        }
      });
    } catch (notifError) {
      console.warn("Impossible de créer la notification:", notifError);
    }

    return NextResponse.json({
      success: true,
      message: isActive 
        ? `Compte de ${existingUser.prenom} ${existingUser.nom} activé avec succès`
        : `Compte de ${existingUser.prenom} ${existingUser.nom} désactivé avec succès`,
      user: updatedUser,
      previousStatus: existingUser.isActive,
      newStatus: isActive,
    });

  } catch (error) {
    console.error("Erreur PATCH /api/users/[id]/status:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// GET /api/users/[id]/status - Récupérer le statut d'un utilisateur
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
    }

    const userId = parseInt(params.id);
    if (isNaN(userId)) {
      return NextResponse.json({ error: "ID invalide" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        nom: true,
        prenom: true,
        role: true,
        isActive: true,
        derniereConnexion: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    return NextResponse.json({
      id: user.id,
      email: user.email,
      fullName: `${user.prenom} ${user.nom}`,
      role: user.role,
      isActive: user.isActive,
      lastLogin: user.derniereConnexion,
      accountAge: Math.floor((Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)), // jours
    });

  } catch (error) {
    console.error("Erreur GET /api/users/[id]/status:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
