import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";

// Types pour les rôles autorisés
const ADMIN_ROLES = ['ADMIN', 'SUPER_ADMIN'];

// Vérifier les permissions admin
async function checkAdminPermission(requiredRoles: string[] = ADMIN_ROLES) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return { authorized: false, error: "Non authentifié", status: 401, user: null };
  }
  
  if (!requiredRoles.includes(session.user.role)) {
    return { authorized: false, error: "Accès non autorisé", status: 403, user: null };
  }
  
  return { authorized: true, user: session.user, error: null, status: 200 };
}

// GET /api/users/[id] - Détails d'un utilisateur
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Vérifier la permission
    const { checkPermission } = await import("@/lib/permissions");
    const hasPermission = await checkPermission(parseInt(session.user.id), 'users.read');

    // Un utilisateur peut voir son propre profil
    const targetId = parseInt(params.id);
    const isSelf = session.user.id === params.id;

    if (!hasPermission && !isSelf) {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
    }
    
    const authCheck = { user: session.user };

    const userId = parseInt(params.id);
    if (isNaN(userId)) {
      return NextResponse.json({ error: "ID invalide" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        telephone: true,
        nom: true,
        prenom: true,
        photo: true,
        role: true,
        isActive: true,
        isEmailVerifie: true,
        isTelephoneVerifie: true,
        secteurResponsable: true,
        communeResponsableId: true,
        etablissementsGeres: true,
        derniereConnexion: true,
        dateInscription: true,
        createdAt: true,
        updatedAt: true,
        communeResponsable: {
          select: {
            id: true,
            nom: true,
          }
        },
        _count: {
          select: {
            evaluations: true,
            reclamationsCreees: true,
            evenementsCrees: true,
            actualiteCreees: true,
            articlesCrees: true,
            campagnesCreees: true,
            notifications: true,
            abonnements: true,
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    // Empêcher un ADMIN de voir un SUPER_ADMIN
    if (user.role === 'SUPER_ADMIN' && authCheck.user?.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
    }

    return NextResponse.json(user);

  } catch (error) {
    console.error("Erreur GET /api/users/[id]:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// PATCH /api/users/[id] - Modifier un utilisateur
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Vérifier la permission
    const { checkPermission } = await import("@/lib/permissions");
    const hasPermission = await checkPermission(parseInt(session.user.id), 'users.edit');

    // Un utilisateur peut modifier son propre profil (avec users.me.edit implicite ou explicite)
    // Mais cette route /api/users/[id] est administrative. Pour "mon profil", c'est souvent /api/users/me ou /api/profile.
    // Si on autorise l'auto-édition ici, il faut s'assurer qu'on ne puisse pas changer son rôle ou isActive.
    
    if (!hasPermission) {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
    }

    const authCheck = { user: session.user };

    const userId = parseInt(params.id);
    if (isNaN(userId)) {
      return NextResponse.json({ error: "ID invalide" }, { status: 400 });
    }

    // Vérifier que l'utilisateur existe
    const existingUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!existingUser) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    // Empêcher un ADMIN de modifier un SUPER_ADMIN
    if (existingUser.role === 'SUPER_ADMIN' && authCheck.user?.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: "Seul un Super Admin peut modifier un Super Admin" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      nom,
      prenom,
      email,
      telephone,
      photo,
      secteurResponsable,
      communeResponsableId,
      etablissementsGeres,
    } = body;

    // Vérifier unicité email si modifié
    if (email && email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({ where: { email } });
      if (emailExists) {
        return NextResponse.json({ error: "Cet email est déjà utilisé" }, { status: 409 });
      }
    }

    // Vérifier unicité téléphone si modifié
    if (telephone && telephone !== existingUser.telephone) {
      const phoneExists = await prisma.user.findUnique({ where: { telephone } });
      if (phoneExists) {
        return NextResponse.json({ error: "Ce téléphone est déjà utilisé" }, { status: 409 });
      }
    }

    // Mise à jour
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(nom && { nom }),
        ...(prenom && { prenom }),
        ...(email && { email }),
        ...(telephone !== undefined && { telephone: telephone || null }),
        ...(photo !== undefined && { photo: photo || null }),
        ...(secteurResponsable !== undefined && { secteurResponsable: secteurResponsable || null }),
        ...(communeResponsableId !== undefined && { communeResponsableId: communeResponsableId || null }),
        ...(etablissementsGeres !== undefined && { etablissementsGeres }),
      },
      select: {
        id: true,
        email: true,
        telephone: true,
        nom: true,
        prenom: true,
        photo: true,
        role: true,
        isActive: true,
        secteurResponsable: true,
        communeResponsableId: true,
        etablissementsGeres: true,
        updatedAt: true,
      }
    });

    return NextResponse.json({
      success: true,
      message: "Utilisateur modifié avec succès",
      user: updatedUser,
    });

  } catch (error) {
    console.error("Erreur PATCH /api/users/[id]:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// DELETE /api/users/[id] - Supprimer un utilisateur (SUPER_ADMIN uniquement)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // SUPER_ADMIN a toujours le droit de supprimer
    const isSuperAdmin = session.user.role === 'SUPER_ADMIN';
    
    if (!isSuperAdmin) {
      // Pour les autres rôles, vérifier la permission explicite
      const { checkPermission } = await import("@/lib/permissions");
      const hasPermission = await checkPermission(parseInt(session.user.id), 'users.hard-delete');
      
      if (!hasPermission) {
        return NextResponse.json({ error: "Accès non autorisé - Seul un Super Admin peut supprimer des utilisateurs" }, { status: 403 });
      }
    }

    const authCheck = { user: session.user };

    const userId = parseInt(params.id);
    if (isNaN(userId)) {
      return NextResponse.json({ error: "ID invalide" }, { status: 400 });
    }

    // Vérifier que l'utilisateur existe
    const existingUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!existingUser) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    // Empêcher la suppression de soi-même
    const currentUserId = parseInt(authCheck.user?.id as string);
    if (existingUser.id === currentUserId) {
      return NextResponse.json(
        { error: "Vous ne pouvez pas vous supprimer vous-même" },
        { status: 400 }
      );
    }

    // Empêcher la suppression d'un autre SUPER_ADMIN
    if (existingUser.role === 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: "Impossible de supprimer un Super Admin" },
        { status: 403 }
      );
    }

    // Supprimer l'utilisateur (les relations cascade sont gérées par Prisma)
    await prisma.user.delete({ where: { id: userId } });

    return NextResponse.json({
      success: true,
      message: "Utilisateur supprimé avec succès",
    });

  } catch (error) {
    console.error("Erreur DELETE /api/users/[id]:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
