import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";

// Rôles valides
const VALID_ROLES = ['CITOYEN', 'DELEGATION', 'AUTORITE_LOCALE', 'COORDINATEUR_ACTIVITES', 'ADMIN', 'SUPER_ADMIN', 'GOUVERNEUR'];

// PATCH /api/users/[id]/role - Modifier le rôle d'un utilisateur
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
    
    // Seuls ADMIN et SUPER_ADMIN peuvent modifier les rôles
    if (!['ADMIN', 'SUPER_ADMIN'].includes(currentUserRole)) {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
    }

    const userId = parseInt(params.id);
    if (isNaN(userId)) {
      return NextResponse.json({ error: "ID invalide" }, { status: 400 });
    }

    const body = await request.json();
    const { role, secteurResponsable, communeResponsableId, etablissementsGeres } = body;

    // Validation du rôle
    if (!role || !VALID_ROLES.includes(role)) {
      return NextResponse.json(
        { error: `Rôle invalide. Rôles autorisés: ${VALID_ROLES.join(', ')}` },
        { status: 400 }
      );
    }

    // Vérifier que l'utilisateur existe
    const existingUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!existingUser) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    // === RÈGLES DE PERMISSION ===
    
    // 1. ADMIN ne peut pas modifier le rôle d'un SUPER_ADMIN
    if (existingUser.role === 'SUPER_ADMIN' && currentUserRole !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: "Seul un Super Admin peut modifier un Super Admin" },
        { status: 403 }
      );
    }

    // 2. ADMIN ne peut pas promouvoir quelqu'un en ADMIN ou SUPER_ADMIN
    if (['ADMIN', 'SUPER_ADMIN'].includes(role) && currentUserRole !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: "Seul un Super Admin peut attribuer le rôle Admin ou Super Admin" },
        { status: 403 }
      );
    }

    // 3. Un utilisateur ne peut pas modifier son propre rôle (sauf SUPER_ADMIN)
    const currentUserId = parseInt(session.user.id as string);
    if (existingUser.id === currentUserId && currentUserRole !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: "Vous ne pouvez pas modifier votre propre rôle" },
        { status: 403 }
      );
    }

    // === VALIDATIONS SPÉCIFIQUES AU RÔLE ===

    // DELEGATION requiert un secteur responsable
    if (role === 'DELEGATION' && !secteurResponsable) {
      return NextResponse.json(
        { error: "Le rôle Délégation nécessite un secteur responsable" },
        { status: 400 }
      );
    }

    // AUTORITE_LOCALE requiert une commune (pas un établissement)
    if (role === 'AUTORITE_LOCALE' && !communeResponsableId) {
      return NextResponse.json(
        { error: "Le rôle Autorité Locale nécessite une commune associée" },
        { status: 400 }
      );
    }

    // COORDINATEUR_ACTIVITES requiert au moins un établissement
    if (role === 'COORDINATEUR_ACTIVITES' && (!etablissementsGeres || etablissementsGeres.length === 0)) {
      return NextResponse.json(
        { error: "Le rôle Coordinateur d'Activités nécessite au moins un établissement" },
        { status: 400 }
      );
    }

    // Vérifier que la commune existe si fournie
    if (communeResponsableId) {
      const commune = await prisma.commune.findUnique({ where: { id: communeResponsableId } });
      if (!commune) {
        return NextResponse.json({ error: "Commune non trouvée" }, { status: 404 });
      }
      
      // Vérifier que la commune n'a pas déjà une autorité locale (sauf si c'est le même)
      const existingAutorite = await prisma.user.findFirst({
        where: {
          communeResponsableId,
          id: { not: userId }
        }
      });
      if (existingAutorite) {
        return NextResponse.json(
          { error: "Cette commune a déjà une autorité locale assignée" },
          { status: 409 }
        );
      }
    }

    // Vérifier que les établissements existent si fournis (pour COORDINATEUR_ACTIVITES)
    if (etablissementsGeres && etablissementsGeres.length > 0) {
      const etabs = await prisma.etablissement.findMany({ 
        where: { id: { in: etablissementsGeres } } 
      });
      if (etabs.length !== etablissementsGeres.length) {
        return NextResponse.json({ error: "Un ou plusieurs établissements non trouvés" }, { status: 404 });
      }
    }

    // === MISE À JOUR ===
    const updateData: any = {
      role,
      // Reset tous les champs spécifiques au rôle par défaut
      secteurResponsable: null,
      communeResponsableId: null,
      etablissementsGeres: [],
    };

    // Mettre à jour secteurResponsable pour DELEGATION
    if (role === 'DELEGATION') {
      updateData.secteurResponsable = secteurResponsable;
    }

    // Mettre à jour communeResponsableId pour AUTORITE_LOCALE
    if (role === 'AUTORITE_LOCALE') {
      updateData.communeResponsableId = communeResponsableId;
    }

    // Mettre à jour etablissementsGeres pour COORDINATEUR_ACTIVITES
    if (role === 'COORDINATEUR_ACTIVITES') {
      updateData.etablissementsGeres = etablissementsGeres;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        nom: true,
        prenom: true,
        role: true,
        secteurResponsable: true,
        communeResponsableId: true,
        communeResponsable: {
          select: { id: true, nom: true }
        },
        etablissementsGeres: true,
        updatedAt: true,
      }
    });

    // Log de l'action (pour audit)
    console.log(`[AUDIT] User ${session.user.id} (${currentUserRole}) changed role of user ${userId} from ${existingUser.role} to ${role}`);

    return NextResponse.json({
      success: true,
      message: `Rôle modifié avec succès: ${existingUser.role} → ${role}`,
      user: updatedUser,
      previousRole: existingUser.role,
      newRole: role,
    });

  } catch (error) {
    console.error("Erreur PATCH /api/users/[id]/role:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
