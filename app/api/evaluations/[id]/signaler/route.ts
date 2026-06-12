import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { z } from "zod";
import { notifyAdmins } from '@/lib/notifications';
import { withErrorHandler, successResponse } from "@/lib/api-handler";
import { UnauthorizedError, ValidationError, NotFoundError } from "@/lib/exceptions";

const signalementSchema = z.object({
  motif: z.string().min(10).max(500),
});

// POST /api/evaluations/[id]/signaler - Signaler une évaluation
export const POST = withErrorHandler(async (
  request: NextRequest,
  { params: _p }: { params: Promise<{ id: string }> }
) => {
  const params = await _p;
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    throw new UnauthorizedError("Non authentifié");
  }

  const evaluationId = parseInt(params.id);

  if (isNaN(evaluationId)) {
    throw new ValidationError("ID invalide");
  }

  const body = await request.json();
  const validation = signalementSchema.safeParse(body);

  if (!validation.success) {
    throw new ValidationError("Motif invalide (10-500 caractères requis)", { details: validation.error.flatten() });
  }

    const { motif } = validation.data;

    // Récupérer l'évaluation
    const evaluation = await prisma.evaluation.findUnique({
      where: { id: evaluationId },
    });

  if (!evaluation) {
    throw new NotFoundError("Évaluation non trouvée");
  }

  if (evaluation.isSignalee) {
    throw new ValidationError("Cette évaluation a déjà été signalée");
  }

    // Mettre à jour l'évaluation
    await prisma.evaluation.update({
      where: { id: evaluationId },
      data: {
        isSignalee: true,
        motifSignalement: motif,
      },
    });

    // Notifier les admins
    await notifyAdmins({
      type: 'EVALUATION_SIGNALEE',
      titre: 'Évaluation signalée',
      message: `Une évaluation a été signalée pour modération`,
      lien: `/admin/evaluations/${evaluationId}`,
    });

  return successResponse(
    null,
    "Évaluation signalée. Un administrateur examinera le signalement."
  );
});