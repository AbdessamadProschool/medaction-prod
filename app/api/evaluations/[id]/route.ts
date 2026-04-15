import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { z } from "zod";
import { SecurityValidation } from "@/lib/security/validation";
import { withErrorHandler, successResponse } from "@/lib/api-handler";
import { UnauthorizedError, ForbiddenError, NotFoundError, ValidationError } from "@/lib/exceptions";

// Schéma de mise à jour sécurisé
const updateSchema = z.object({
  noteGlobale: SecurityValidation.schemas.rating.optional(),
  commentaire: SecurityValidation.schemas.description.optional(),
});

// Helper pour recalculer la note moyenne
async function updateNoteMoyenne(etablissementId: number) {
  const result = await prisma.evaluation.aggregate({
    where: { 
      etablissementId,
      isValidee: true,
    },
    _avg: { noteGlobale: true },
    _count: { id: true },
  });

  await prisma.etablissement.update({
    where: { id: etablissementId },
    data: {
      noteMoyenne: result._avg.noteGlobale || 0,
      nombreEvaluations: result._count.id,
    },
  });

  return {
    noteMoyenne: result._avg.noteGlobale || 0,
    nombreEvaluations: result._count.id,
  };
}

// GET /api/evaluations/[id] - Détails d'une évaluation
export const GET = withErrorHandler(async (
  request: NextRequest,
  { params: _p }: { params: Promise<{ id: string }> }
) => {
  const params = await _p;
  const evaluationId = SecurityValidation.validateId(params.id);

  if (!evaluationId) {
    throw new ValidationError("Identifiant d'évaluation invalide");
  }

  const evaluation = await prisma.evaluation.findUnique({
    where: { id: evaluationId },
    include: {
      user: { select: { id: true, nom: true, prenom: true, photo: true } },
      etablissement: { select: { id: true, nom: true, secteur: true } },
    },
  });

  if (!evaluation) {
    throw new NotFoundError("Évaluation non trouvée");
  }

  return successResponse(evaluation);
});

// PATCH /api/evaluations/[id] - Modifier une évaluation (< 7 jours)
export const PATCH = withErrorHandler(async (
  request: NextRequest,
  { params: _p }: { params: Promise<{ id: string }> }
) => {
  const params = await _p;
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    throw new UnauthorizedError("Vous devez être connecté pour modifier une évaluation");
  }

  const userId = parseInt(session.user.id as string);
  const evaluationId = SecurityValidation.validateId(params.id);

  if (!evaluationId) {
    throw new ValidationError("Identifiant d'évaluation invalide");
  }

  // Récupérer l'évaluation
  const evaluation = await prisma.evaluation.findUnique({
    where: { id: evaluationId },
  });

  if (!evaluation) {
    throw new NotFoundError("Évaluation non trouvée");
  }

  // Vérifier que c'est bien l'auteur (ou admin) - IDOR Protection
  const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(session.user.role);
  if (evaluation.userId !== userId && !isAdmin) {
    throw new ForbiddenError("Vous ne pouvez modifier que vos propres évaluations");
  }

  // Vérifier la date d'expiration (sauf pour admin)
  if (!isAdmin && new Date() > evaluation.dateExpiration) {
    const joursDepuis = Math.floor(
      (Date.now() - evaluation.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );
    throw new ForbiddenError(`La période de modification est expirée (${joursDepuis} jours depuis la création). Maximum 7 jours.`);
  }

  // Validation des données
  const body = await request.json();
  const validation = updateSchema.safeParse(body);
  
  if (!validation.success) {
    throw validation.error;
  }

  const { noteGlobale, commentaire } = validation.data;

  // Mettre à jour l'évaluation
  const updated = await prisma.evaluation.update({
    where: { id: evaluationId },
    data: {
      ...(noteGlobale !== undefined && { noteGlobale }),
      ...(commentaire !== undefined && { commentaire }),
    },
    include: {
      user: { select: { id: true, nom: true, prenom: true } },
      etablissement: { select: { id: true, nom: true } },
    },
  });

  // Recalculer la note moyenne si la note a changé
  let stats = null;
  if (noteGlobale !== undefined && noteGlobale !== evaluation.noteGlobale) {
    stats = await updateNoteMoyenne(evaluation.etablissementId);
  }

  return successResponse({
    evaluation: updated,
    ...(stats && { etablissementStats: stats }),
  }, "Évaluation modifiée avec succès");
});

// DELETE /api/evaluations/[id] - Supprimer une évaluation
export const DELETE = withErrorHandler(async (
  request: NextRequest,
  { params: _p }: { params: Promise<{ id: string }> }
) => {
  const params = await _p;
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    throw new UnauthorizedError("Vous devez être connecté pour supprimer une évaluation");
  }

  const userId = parseInt(session.user.id as string);
  const evaluationId = SecurityValidation.validateId(params.id);

  if (!evaluationId) {
    throw new ValidationError("Identifiant d'évaluation invalide");
  }

  // Récupérer l'évaluation
  const evaluation = await prisma.evaluation.findUnique({
    where: { id: evaluationId },
  });

  if (!evaluation) {
    throw new NotFoundError("Évaluation non trouvée");
  }

  // Vérifier les permissions (Auteur ou Admin) - IDOR Protection
  const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(session.user.role);
  if (evaluation.userId !== userId && !isAdmin) {
    throw new ForbiddenError("Vous ne pouvez supprimer que vos propres évaluations");
  }

  // Vérifier la date d'expiration pour les non-admins
  if (!isAdmin && new Date() > evaluation.dateExpiration) {
    throw new ForbiddenError("La période de suppression est expirée. Contactez un administrateur.");
  }

  const etablissementId = evaluation.etablissementId;

  // Supprimer l'évaluation
  await prisma.evaluation.delete({
    where: { id: evaluationId },
  });

  // Recalculer la note moyenne
  const stats = await updateNoteMoyenne(etablissementId);

  return successResponse({
    etablissementStats: stats,
  }, "Évaluation supprimée avec succès");
});