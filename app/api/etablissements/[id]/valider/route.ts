import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db";
import { z } from "zod";

const validerSchema = z.object({
  isValide: z.boolean().optional(),
  isPublie: z.boolean().optional(),
  isMisEnAvant: z.boolean().optional(),
});

// PATCH - Valider/Publier un établissement (ADMIN uniquement)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Seuls les admins peuvent valider
    if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json(
        { error: "Seuls les administrateurs peuvent valider les établissements" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const etablissementId = parseInt(id);

    if (isNaN(etablissementId)) {
      return NextResponse.json({ error: "ID invalide" }, { status: 400 });
    }

    const body = await req.json();
    const result = validerSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Données invalides", details: result.error.flatten() },
        { status: 400 }
      );
    }

    // Vérifier existence
    const existing = await prisma.etablissement.findUnique({
      where: { id: etablissementId },
      select: { id: true, nom: true, code: true, isValide: true, isPublie: true }
    });

    if (!existing) {
      return NextResponse.json({ error: "Établissement non trouvé" }, { status: 404 });
    }

    const updatedEtablissement = await prisma.etablissement.update({
      where: { id: etablissementId },
      data: result.data,
      select: {
        id: true,
        code: true,
        nom: true,
        isValide: true,
        isPublie: true,
        isMisEnAvant: true,
      },
    });

    // Construire le message de succès
    const messages: string[] = [];
    if (result.data.isValide !== undefined) {
      messages.push(result.data.isValide ? "validé" : "dévalidé");
    }
    if (result.data.isPublie !== undefined) {
      messages.push(result.data.isPublie ? "publié" : "dépublié");
    }
    if (result.data.isMisEnAvant !== undefined) {
      messages.push(result.data.isMisEnAvant ? "mis en avant" : "retiré de la mise en avant");
    }

    return NextResponse.json({
      message: `Établissement "${existing.nom}" ${messages.join(" et ")}`,
      data: updatedEtablissement
    });
  } catch (error) {
    console.error("Erreur validation établissement:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
