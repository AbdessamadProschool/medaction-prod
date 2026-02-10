import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db";
import { etablissementUpdateSchema } from "@/lib/validations/etablissement";
import { validateId, logSecurityEvent } from "@/lib/security/validation";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET - Détails d'un établissement
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    
    // SECURITY FIX: Validate ID to prevent integer overflow
    const etablissementId = validateId(id);
    if (etablissementId === null) {
      return NextResponse.json({ error: "ID invalide" }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    const isAdmin = session?.user?.role && ['ADMIN', 'SUPER_ADMIN'].includes(session.user.role);

    const etablissement = await prisma.etablissement.findUnique({
      where: { id: etablissementId },
      include: {
        // All scalar fields (inc. photoPrincipale) are returned by default with 'include'
        commune: { select: { id: true, nom: true } },
        annexe: { select: { id: true, nom: true } },
        medias: { select: { id: true, urlPublique: true, type: true, nomFichier: true } },
        evaluations: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            noteGlobale: true,
            commentaire: true,
            createdAt: true,
            user: { select: { nom: true, prenom: true } }
          }
        },
        reclamations: {
          take: 5,
          orderBy: [{ createdAt: 'desc' }],
          select: {
            id: true,
            titre: true,
            description: true,
            statut: true,
            createdAt: true
          }
        },
        evenements: {
          take: 5,
          where: { statut: 'PUBLIEE' },
          orderBy: { dateDebut: 'desc' },
          select: {
            id: true,
            titre: true,
            dateDebut: true,
            typeCategorique: true
          }
        },
        _count: {
          select: {
            evaluations: true,
            reclamations: true,
            evenements: true,
            actualites: true,
            abonnements: true,
            programmesActivites: true,
          }
        }
      },
    });

    if (!etablissement) {
      return NextResponse.json({ error: "Établissement non trouvé" }, { status: 404 });
    }

    // Vérifier si l'établissement est accessible
    if (!isAdmin && (!etablissement.isPublie || !etablissement.isValide)) {
      return NextResponse.json({ error: "Établissement non disponible" }, { status: 403 });
    }

    return NextResponse.json({ data: etablissement });
  } catch (error) {
    console.error("Erreur détail établissement:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// PATCH - Modifier un établissement (ADMIN ou DELEGATION assignée)
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { id } = await params;
    const etablissementId = parseInt(id);

    if (isNaN(etablissementId)) {
      return NextResponse.json({ error: "ID invalide" }, { status: 400 });
    }

    // Vérifier existence
    const existing = await prisma.etablissement.findUnique({
      where: { id: etablissementId },
      select: { id: true, nom: true }
    });

    if (!existing) {
      return NextResponse.json({ error: "Établissement non trouvé" }, { status: 404 });
    }

    // Vérifier les permissions
    const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(session.user.role);
    const isDelegation = session.user.role === 'DELEGATION';

    if (!isAdmin && !isDelegation) {
      return NextResponse.json(
        { error: "Vous n'avez pas les droits pour modifier cet établissement" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const result = etablissementUpdateSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Données invalides", details: result.error.flatten() },
        { status: 400 }
      );
    }

    // Si pas admin, ne pas permettre de modifier isPublie, isValide, isMisEnAvant
    if (!isAdmin) {
      delete result.data.isPublie;
      delete result.data.isValide;
      delete result.data.isMisEnAvant;
    }

    const updatedEtablissement = await prisma.etablissement.update({
      where: { id: etablissementId },
      data: result.data,
      include: {
        commune: { select: { id: true, nom: true } },
        annexe: { select: { id: true, nom: true } },
      },
    });

    return NextResponse.json({
      message: "Établissement modifié avec succès",
      data: updatedEtablissement
    });
  } catch (error) {
    console.error("Erreur modification établissement:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// DELETE - Supprimer un établissement (ADMIN uniquement)
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Seuls les admins peuvent supprimer
    if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json(
        { error: "Seuls les administrateurs peuvent supprimer des établissements" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const etablissementId = parseInt(id);

    if (isNaN(etablissementId)) {
      return NextResponse.json({ error: "ID invalide" }, { status: 400 });
    }

    // Vérifier existence
    const existing = await prisma.etablissement.findUnique({
      where: { id: etablissementId },
      select: { id: true, nom: true, code: true }
    });

    if (!existing) {
      return NextResponse.json({ error: "Établissement non trouvé" }, { status: 404 });
    }

    // Vérifier s'il y a des dépendances
    const dependencies = await prisma.etablissement.findUnique({
      where: { id: etablissementId },
      select: {
        _count: {
          select: {
            reclamations: true,
            evenements: true,
            evaluations: true,
          }
        }
      }
    });

    const hasReclamations = (dependencies?._count.reclamations || 0) > 0;
    const hasEvenements = (dependencies?._count.evenements || 0) > 0;

    if (hasReclamations || hasEvenements) {
      return NextResponse.json({
        error: "Impossible de supprimer cet établissement car il a des réclamations ou événements associés",
        details: {
          reclamations: dependencies?._count.reclamations,
          evenements: dependencies?._count.evenements
        }
      }, { status: 400 });
    }

    await prisma.etablissement.delete({
      where: { id: etablissementId },
    });

    return NextResponse.json({
      message: `Établissement "${existing.nom}" (${existing.code}) supprimé avec succès`
    });
  } catch (error) {
    console.error("Erreur suppression établissement:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
