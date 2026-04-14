import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { z } from "zod";
import { SecurityValidation } from "@/lib/security/validation";
import { withErrorHandler, successResponse } from "@/lib/api-handler";
import { UnauthorizedError, ForbiddenError, NotFoundError, ConflictError } from "@/lib/exceptions";

// Schéma de validation sécurisé (OWASP compliant)
const evaluationSchema = z.object({
  etablissementId: SecurityValidation.schemas.id,
  noteGlobale: SecurityValidation.schemas.rating,
  commentaire: SecurityValidation.schemas.description.optional(),
});

// Calcul et mise à jour de la note moyenne d'un établissement
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

// POST /api/evaluations - Créer une évaluation
export const POST = withErrorHandler(async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    throw new UnauthorizedError("Vous devez être connecté pour évaluer un établissement");
  }

  const userId = parseInt(session.user.id as string);

  // Vérifier la permission
  const { checkPermission } = await import("@/lib/permissions");
  const hasPermission = await checkPermission(userId, 'evaluations.create');
  
  if (!hasPermission) {
    throw new ForbiddenError("Vous n'avez pas la permission d'évaluer un établissement.");
  }

  const body = await request.json();
  
  // Validation avec SecurityValidation
  const validation = evaluationSchema.safeParse(body);
  if (!validation.success) {
    throw validation.error;
  }

  const { etablissementId, noteGlobale, commentaire } = validation.data;

  // Vérifier que l'établissement existe
  const etablissement = await prisma.etablissement.findUnique({
    where: { id: etablissementId },
    select: { id: true, nom: true, isPublie: true },
  });

  if (!etablissement) {
    throw new NotFoundError("Établissement non trouvé");
  }

  if (!etablissement.isPublie) {
    throw new ForbiddenError("Impossible d'évaluer un établissement non publié");
  }

  // Vérifier si l'utilisateur a déjà évalué cet établissement (contrainte unique)
  const existingEval = await prisma.evaluation.findUnique({
    where: {
      userId_etablissementId: { userId, etablissementId },
    },
  });

  if (existingEval) {
    throw new ConflictError("Vous avez déjà évalué cet établissement. Vous pouvez modifier votre évaluation existante.", {
      existingEvaluationId: existingEval.id
    });
  }

  // Date d'expiration (7 jours pour modification)
  const dateExpiration = new Date();
  dateExpiration.setDate(dateExpiration.getDate() + 7);

  // Créer l'évaluation
  const evaluation = await prisma.evaluation.create({
    data: {
      userId,
      etablissementId,
      noteGlobale,
      commentaire: commentaire || null,
      dateExpiration,
      isValidee: true, // Auto-validée par défaut
    },
    include: {
      user: { select: { id: true, nom: true, prenom: true } },
      etablissement: { select: { id: true, nom: true } },
    },
  });

  // Mettre à jour la note moyenne
  const stats = await updateNoteMoyenne(etablissementId);

  return successResponse({
    evaluation,
    etablissementStats: stats,
  }, "Évaluation créée avec succès", 201);
});

// GET /api/evaluations - Liste des évaluations (avec filtres)
export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  
  // SECURITY FIX: Use secure pagination validation
  const { page, limit } = SecurityValidation.validatePagination(
    searchParams.get('page'),
    searchParams.get('limit')
  );
  
  const etablissementIdRaw = searchParams.get('etablissementId');
  const userIdRaw = searchParams.get('userId');
  const noteMinRaw = searchParams.get('noteMin');

  // Construire le filtre avec validation sécurisée
  const where: any = { isValidee: true };
  
  // SECURITY FIX: Validate IDs to prevent integer overflow
  if (etablissementIdRaw) {
    const etablissementIdValid = SecurityValidation.validateId(etablissementIdRaw);
    if (etablissementIdValid) where.etablissementId = etablissementIdValid;
  }
  if (userIdRaw) {
    const userIdValid = SecurityValidation.validateId(userIdRaw);
    if (userIdValid) where.userId = userIdValid;
  }
  if (noteMinRaw) {
    const noteNum = SecurityValidation.validateRating(noteMinRaw);
    if (noteNum !== null) {
      where.noteGlobale = { gte: noteNum };
    }
  }

  const [evaluations, total] = await Promise.all([
    prisma.evaluation.findMany({
      where,
      include: {
        user: { select: { id: true, nom: true, prenom: true, photo: true } },
        etablissement: { select: { id: true, nom: true, secteur: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.evaluation.count({ where }),
  ]);

  return NextResponse.json({
    success: true,
    data: evaluations,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});
