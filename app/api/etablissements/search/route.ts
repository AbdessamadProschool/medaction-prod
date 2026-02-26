import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db";

// GET - Recherche rapide d'établissements (pour autocomplete)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q");
    const secteur = searchParams.get("secteur");
    const communeId = searchParams.get("communeId");
    const limit = parseInt(searchParams.get("limit") || "20");

    if (!query || query.length < 2) {
      return NextResponse.json(
        { error: "La recherche doit contenir au moins 2 caractères" },
        { status: 400 }
      );
    }

    const session = await getServerSession(authOptions);
    const isAdmin = session?.user?.role && ['ADMIN', 'SUPER_ADMIN'].includes(session.user.role);

    // Build where clause
    const where: any = {
      OR: [
        { nom: { contains: query, mode: "insensitive" } },
        { code: { contains: query, mode: "insensitive" } },
        { adresseComplete: { contains: query, mode: "insensitive" } },
        { responsableNom: { contains: query, mode: "insensitive" } },
      ],
    };

    // Pour le public, seules les établissements publiés et validés
    if (!isAdmin) {
      where.isPublie = true;
      where.isValide = true;
    }

    // Filtres additionnels
    if (secteur) {
      where.secteur = secteur;
    }

    if (communeId) {
      where.communeId = parseInt(communeId);
    }

    const etablissements = await prisma.etablissement.findMany({
      where,
      select: {
        id: true,
        code: true,
        nom: true,
        secteur: true,
        photoPrincipale: true,
        noteMoyenne: true,
        commune: { select: { id: true, nom: true } },
        latitude: true,
        longitude: true,
      },
      orderBy: [
        { noteMoyenne: 'desc' },
        { nom: 'asc' }
      ],
      take: Math.min(limit, 50), // Maximum 50 résultats
    });

    return NextResponse.json({
      data: etablissements,
      count: etablissements.length
    });
  } catch (error) {
    console.error("Erreur recherche établissements:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
