import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { z } from "zod";

// Schéma de mise à jour
const updateSchema = z.object({
  noteGlobale: z.number().min(1).max(5).optional(),
  commentaire: z.string().max(1000).optional(),
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
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const evaluationId = parseInt(params.id);

    if (isNaN(evaluationId)) {
      return NextResponse.json({ error: "ID invalide" }, { status: 400 });
    }

    const evaluation = await prisma.evaluation.findUnique({
      where: { id: evaluationId },
      include: {
        user: { select: { id: true, nom: true, prenom: true, photo: true } },
        etablissement: { select: { id: true, nom: true, secteur: true } },
      },
    });

    if (!evaluation) {
      return NextResponse.json({ error: "Évaluation non trouvée" }, { status: 404 });
    }

    return NextResponse.json({ evaluation });

  } catch (error) {
    console.error("Erreur GET /api/evaluations/[id]:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// PATCH /api/evaluations/[id] - Modifier une évaluation (< 7 jours)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const userId = parseInt(session.user.id as string);
    const evaluationId = parseInt(params.id);

    if (isNaN(evaluationId)) {
      return NextResponse.json({ error: "ID invalide" }, { status: 400 });
    }

    // Récupérer l'évaluation
    const evaluation = await prisma.evaluation.findUnique({
      where: { id: evaluationId },
    });

    if (!evaluation) {
      return NextResponse.json({ error: "Évaluation non trouvée" }, { status: 404 });
    }

    // Vérifier que c'est bien l'auteur (ou admin)
    const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(session.user.role);
    if (evaluation.userId !== userId && !isAdmin) {
      return NextResponse.json({ 
        error: "Vous ne pouvez modifier que vos propres évaluations" 
      }, { status: 403 });
    }

    // Vérifier la date d'expiration (sauf pour admin)
    if (!isAdmin && new Date() > evaluation.dateExpiration) {
      const joursDepuis = Math.floor(
        (Date.now() - evaluation.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      );
      return NextResponse.json({
        error: `La période de modification est expirée (${joursDepuis} jours depuis la création). Maximum 7 jours.`,
      }, { status: 403 });
    }

    // Validation des données
    const body = await request.json();
    const validation = updateSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json({
        error: "Données invalides",
        details: validation.error.flatten(),
      }, { status: 400 });
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

    return NextResponse.json({
      message: "Évaluation modifiée avec succès",
      evaluation: updated,
      ...(stats && { etablissementStats: stats }),
    });

  } catch (error) {
    console.error("Erreur PATCH /api/evaluations/[id]:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// DELETE /api/evaluations/[id] - Supprimer une évaluation
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const userId = parseInt(session.user.id as string);
    const evaluationId = parseInt(params.id);

    if (isNaN(evaluationId)) {
      return NextResponse.json({ error: "ID invalide" }, { status: 400 });
    }

    // Récupérer l'évaluation
    const evaluation = await prisma.evaluation.findUnique({
      where: { id: evaluationId },
    });

    if (!evaluation) {
      return NextResponse.json({ error: "Évaluation non trouvée" }, { status: 404 });
    }

    // Vérifier les permissions
    const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(session.user.role);
    if (evaluation.userId !== userId && !isAdmin) {
      return NextResponse.json({ 
        error: "Vous ne pouvez supprimer que vos propres évaluations" 
      }, { status: 403 });
    }

    // Vérifier la date d'expiration pour les non-admins
    if (!isAdmin && new Date() > evaluation.dateExpiration) {
      return NextResponse.json({
        error: "La période de suppression est expirée. Contactez un administrateur.",
      }, { status: 403 });
    }

    const etablissementId = evaluation.etablissementId;

    // Supprimer l'évaluation
    await prisma.evaluation.delete({
      where: { id: evaluationId },
    });

    // Recalculer la note moyenne
    const stats = await updateNoteMoyenne(etablissementId);

    return NextResponse.json({
      message: "Évaluation supprimée avec succès",
      etablissementStats: stats,
    });

  } catch (error) {
    console.error("Erreur DELETE /api/evaluations/[id]:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
