import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/evaluations/etablissement/[id] - Évaluations d'un établissement
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const etablissementId = parseInt(params.id);

    if (isNaN(etablissementId)) {
      return NextResponse.json({ error: "ID invalide" }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const sortBy = searchParams.get('sortBy') || 'recent'; // recent, highest, lowest

    // Vérifier que l'établissement existe
    const etablissement = await prisma.etablissement.findUnique({
      where: { id: etablissementId },
      select: { 
        id: true, 
        nom: true, 
        noteMoyenne: true, 
        nombreEvaluations: true,
        secteur: true,
      },
    });

    if (!etablissement) {
      return NextResponse.json({ error: "Établissement non trouvé" }, { status: 404 });
    }

    // Ordre de tri
    let orderBy: any = { createdAt: 'desc' };
    if (sortBy === 'highest') {
      orderBy = { noteGlobale: 'desc' };
    } else if (sortBy === 'lowest') {
      orderBy = { noteGlobale: 'asc' };
    }

    // Récupérer les évaluations
    const [evaluations, total] = await Promise.all([
      prisma.evaluation.findMany({
        where: { 
          etablissementId,
          isValidee: true,
        },
        include: {
          user: { 
            select: { 
              id: true, 
              nom: true, 
              prenom: true, 
              photo: true 
            } 
          },
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.evaluation.count({ 
        where: { 
          etablissementId,
          isValidee: true,
        } 
      }),
    ]);

    // Statistiques de répartition des notes
    const noteDistribution = await prisma.evaluation.groupBy({
      by: ['noteGlobale'],
      where: { 
        etablissementId,
        isValidee: true,
      },
      _count: { id: true },
    });

    // Formater la distribution (1-5 étoiles)
    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    noteDistribution.forEach(item => {
      const note = Math.round(item.noteGlobale);
      if (note >= 1 && note <= 5) {
        distribution[note] = item._count.id;
      }
    });

    return NextResponse.json({
      etablissement,
      evaluations,
      distribution,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });

  } catch (error) {
    console.error("Erreur GET /api/evaluations/etablissement/[id]:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
