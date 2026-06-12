import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db";
import { withErrorHandler, successResponse } from "@/lib/api-handler";
import { UnauthorizedError, ForbiddenError, ValidationError, NotFoundError } from "@/lib/exceptions";
import { z } from "zod";

const validerSchema = z.object({
  isValide: z.boolean().optional(),
  isPublie: z.boolean().optional(),
  isMisEnAvant: z.boolean().optional(),
});

// PATCH - Valider/Publier un établissement (ADMIN uniquement)
export const PATCH = withErrorHandler(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    throw new UnauthorizedError("Non authentifié");
  }

  // Seuls les admins peuvent valider
  if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
    throw new ForbiddenError("Seuls les administrateurs peuvent valider les établissements");
  }

  const { id } = await params;
  const etablissementId = parseInt(id);

  if (isNaN(etablissementId)) {
    throw new ValidationError("ID invalide");
  }

    const body = await req.json();
    const result = validerSchema.safeParse(body);

  if (!result.success) {
    throw new ValidationError("Données invalides", { details: result.error.flatten() });
  }

    // Vérifier existence
    const existing = await prisma.etablissement.findUnique({
      where: { id: etablissementId },
      select: { id: true, nom: true, code: true, isValide: true, isPublie: true }
    });

  if (!existing) {
    throw new NotFoundError("Établissement non trouvé");
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

  return successResponse(
    updatedEtablissement,
    `Établissement "${existing.nom}" ${messages.join(" et ")}`
  );
});