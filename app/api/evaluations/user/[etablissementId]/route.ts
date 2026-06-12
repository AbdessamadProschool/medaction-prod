import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { withErrorHandler, successResponse } from "@/lib/api-handler";
import { UnauthorizedError, ValidationError } from "@/lib/exceptions";

// GET /api/evaluations/user/[etablissementId] - Évaluation de l'utilisateur pour un établissement
export const GET = withErrorHandler(async (
  request: NextRequest,
  { params: _p }: { params: Promise<{ etablissementId: string }> }
) => {
  const params = await _p;
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    throw new UnauthorizedError("Non authentifié");
  }

  const userId = parseInt(session.user.id as string);
  const etablissementId = parseInt(params.etablissementId);

  if (isNaN(etablissementId)) {
    throw new ValidationError("ID invalide");
  }

    // Chercher l'évaluation existante
    const evaluation = await prisma.evaluation.findUnique({
      where: {
        userId_etablissementId: { userId, etablissementId },
      },
      include: {
        etablissement: { select: { id: true, nom: true } },
      },
    });

  if (!evaluation) {
    return successResponse({ 
      hasEvaluated: false,
      evaluation: null,
    });
  }

    // Vérifier si modifiable (< 7 jours)
    const isModifiable = new Date() <= evaluation.dateExpiration;
    const joursRestants = Math.max(0, Math.ceil(
      (evaluation.dateExpiration.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    ));

  return successResponse({
    hasEvaluated: true,
    evaluation,
    isModifiable,
    joursRestants,
  });
});