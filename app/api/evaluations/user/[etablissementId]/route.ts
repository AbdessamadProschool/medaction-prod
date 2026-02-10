import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";

// GET /api/evaluations/user/[etablissementId] - Évaluation de l'utilisateur pour un établissement
export async function GET(
  request: NextRequest,
  { params }: { params: { etablissementId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const userId = parseInt(session.user.id as string);
    const etablissementId = parseInt(params.etablissementId);

    if (isNaN(etablissementId)) {
      return NextResponse.json({ error: "ID invalide" }, { status: 400 });
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
      return NextResponse.json({ 
        hasEvaluated: false,
        evaluation: null,
      });
    }

    // Vérifier si modifiable (< 7 jours)
    const isModifiable = new Date() <= evaluation.dateExpiration;
    const joursRestants = Math.max(0, Math.ceil(
      (evaluation.dateExpiration.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    ));

    return NextResponse.json({
      hasEvaluated: true,
      evaluation,
      isModifiable,
      joursRestants,
    });

  } catch (error) {
    console.error("Erreur GET /api/evaluations/user/[etablissementId]:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
