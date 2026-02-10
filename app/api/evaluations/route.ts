import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { z } from "zod";
import { SECURITY_LIMITS, validateId, validatePagination, sanitizeString } from "@/lib/security/validation";

// Schéma de validation sécurisé (OWASP compliant)
const evaluationSchema = z.object({
  etablissementId: z.number().int().positive().max(SECURITY_LIMITS.ID_MAX),
  noteGlobale: z.number().min(SECURITY_LIMITS.RATING_MIN).max(SECURITY_LIMITS.RATING_MAX),
  commentaire: z.string().max(SECURITY_LIMITS.COMMENT_MAX).optional().transform(val => val ? sanitizeString(val) : undefined),
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
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const userId = parseInt(session.user.id as string);

    // Vérifier la permission
    const { checkPermission } = await import("@/lib/permissions");
    const hasPermission = await checkPermission(userId, 'evaluations.create');
    
    if (!hasPermission) {
      return NextResponse.json({ 
        error: "Vous n'avez pas la permission d'évaluer un établissement." 
      }, { status: 403 });
    }

    const body = await request.json();
    
    // Validation
    const validation = evaluationSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({
        error: "Données invalides",
        details: validation.error.flatten(),
      }, { status: 400 });
    }

    const { etablissementId, noteGlobale, commentaire } = validation.data;

    // Vérifier que l'établissement existe
    const etablissement = await prisma.etablissement.findUnique({
      where: { id: etablissementId },
      select: { id: true, nom: true, isPublie: true },
    });

    if (!etablissement) {
      return NextResponse.json({ error: "Établissement non trouvé" }, { status: 404 });
    }

    if (!etablissement.isPublie) {
      return NextResponse.json({ 
        error: "Impossible d'évaluer un établissement non publié" 
      }, { status: 400 });
    }

    // Vérifier si l'utilisateur a déjà évalué cet établissement (contrainte unique)
    const existingEval = await prisma.evaluation.findUnique({
      where: {
        userId_etablissementId: { userId, etablissementId },
      },
    });

    if (existingEval) {
      return NextResponse.json({
        error: "Vous avez déjà évalué cet établissement. Vous pouvez modifier votre évaluation existante.",
        existingEvaluationId: existingEval.id,
      }, { status: 409 });
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

    return NextResponse.json({
      message: "Évaluation créée avec succès",
      evaluation,
      etablissementStats: stats,
    }, { status: 201 });

  } catch (error) {
    console.error("Erreur POST /api/evaluations:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// GET /api/evaluations - Liste des évaluations (avec filtres)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // SECURITY FIX: Use secure pagination validation
    const { page, limit } = validatePagination(
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
      const etablissementIdValid = validateId(etablissementIdRaw);
      if (etablissementIdValid) where.etablissementId = etablissementIdValid;
    }
    if (userIdRaw) {
      const userIdValid = validateId(userIdRaw);
      if (userIdValid) where.userId = userIdValid;
    }
    if (noteMinRaw) {
      const noteNum = parseFloat(noteMinRaw);
      if (!isNaN(noteNum) && noteNum >= SECURITY_LIMITS.RATING_MIN && noteNum <= SECURITY_LIMITS.RATING_MAX) {
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
      evaluations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });

  } catch (error) {
    console.error("Erreur GET /api/evaluations:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
