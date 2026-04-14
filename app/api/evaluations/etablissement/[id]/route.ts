import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { SecurityValidation } from "@/lib/security/validation";
import { withErrorHandler, successResponse } from "@/lib/api-handler";
import { NotFoundError, ValidationError } from "@/lib/exceptions";

// GET /api/evaluations/etablissement/[id] - Évaluations d'un établissement
export const GET = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  const etablissementId = SecurityValidation.validateId(params.id);

  if (!etablissementId) {
    throw new ValidationError("Identifiant d'établissement invalide");
  }

  const { searchParams } = new URL(request.url);
  const { page, limit } = SecurityValidation.validatePagination(
    searchParams.get('page'),
    searchParams.get('limit')
  );
  
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
    throw new NotFoundError("Établissement non trouvé");
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

  return successResponse({
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
});
