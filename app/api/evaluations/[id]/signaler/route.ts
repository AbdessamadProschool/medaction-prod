import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { z } from "zod";

const signalementSchema = z.object({
  motif: z.string().min(10).max(500),
});

// POST /api/evaluations/[id]/signaler - Signaler une évaluation
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const evaluationId = parseInt(params.id);

    if (isNaN(evaluationId)) {
      return NextResponse.json({ error: "ID invalide" }, { status: 400 });
    }

    const body = await request.json();
    const validation = signalementSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({
        error: "Motif invalide (10-500 caractères requis)",
        details: validation.error.flatten(),
      }, { status: 400 });
    }

    const { motif } = validation.data;

    // Récupérer l'évaluation
    const evaluation = await prisma.evaluation.findUnique({
      where: { id: evaluationId },
    });

    if (!evaluation) {
      return NextResponse.json({ error: "Évaluation non trouvée" }, { status: 404 });
    }

    if (evaluation.isSignalee) {
      return NextResponse.json({ 
        error: "Cette évaluation a déjà été signalée" 
      }, { status: 400 });
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
    const admins = await prisma.user.findMany({
      where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] }, isActive: true },
      select: { id: true },
    });

    if (admins.length > 0) {
      await prisma.notification.createMany({
        data: admins.map(admin => ({
          userId: admin.id,
          type: 'EVALUATION_SIGNALEE',
          titre: 'Évaluation signalée',
          message: `Une évaluation a été signalée pour modération`,
          lien: `/admin/evaluations/${evaluationId}`,
        })),
      });
    }

    return NextResponse.json({
      message: "Évaluation signalée. Un administrateur examinera le signalement.",
    });

  } catch (error) {
    console.error("Erreur POST /api/evaluations/[id]/signaler:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
