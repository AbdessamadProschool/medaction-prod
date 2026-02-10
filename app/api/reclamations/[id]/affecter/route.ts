import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { z } from "zod";
import { Secteur } from "@prisma/client";

// Schéma de validation pour l'affectation
const affectationSchema = z.object({
  affecteAId: z.number().int().positive().nullable(),
  secteurAffecte: z.nativeEnum(Secteur).optional(),
  commentaireAffectation: z.string().max(500).optional(),
});

// PATCH /api/reclamations/[id]/affecter - Affecter une réclamation
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Vérifier les permissions (admin seulement)
    const allowedRoles = ['ADMIN', 'SUPER_ADMIN', 'GOUVERNEUR'];
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const reclamationId = parseInt(params.id);
    if (isNaN(reclamationId)) {
      return NextResponse.json({ error: "ID invalide" }, { status: 400 });
    }

    // Vérifier que la réclamation existe
    const reclamation = await prisma.reclamation.findUnique({
      where: { id: reclamationId },
      select: { id: true, titre: true, affecteeAAutoriteId: true, affectationReclamation: true },
    });

    if (!reclamation) {
      return NextResponse.json({ error: "Réclamation non trouvée" }, { status: 404 });
    }

    // Valider les données
    const body = await request.json();
    const validation = affectationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({
        error: "Données invalides",
        details: validation.error.flatten(),
      }, { status: 400 });
    }

    const { affecteAId, secteurAffecte, commentaireAffectation } = validation.data;

    // Si on affecte à quelqu'un, vérifier que l'utilisateur existe
    let agent = null;
    if (affecteAId) {
      agent = await prisma.user.findUnique({
        where: { id: affecteAId, isActive: true },
        select: { id: true, nom: true, prenom: true, role: true },
      });

      if (!agent) {
        return NextResponse.json({ error: "Agent non trouvé ou inactif" }, { status: 404 });
      }
    }

    // Mettre à jour la réclamation
    const updated = await prisma.reclamation.update({
      where: { id: reclamationId },
      data: {
        affecteeAAutoriteId: affecteAId,
        secteurAffecte: secteurAffecte,
        affectationReclamation: affecteAId ? 'AFFECTEE' : 'NON_AFFECTEE',
        dateAffectation: affecteAId ? new Date() : null,
        affecteeParAdminId: affecteAId ? parseInt(session.user.id as string) : null,
      },
    });

    // Créer une entrée dans l'historique
    await prisma.historiqueReclamation.create({
      data: {
        reclamationId,
        action: affecteAId ? 'AFFECTATION' : 'DESAFFECTATION',
        details: affecteAId 
          ? { 
              message: `Affectée à ${agent?.prenom} ${agent?.nom}`,
              commentaire: commentaireAffectation || null,
              agentId: affecteAId,
            }
          : { message: 'Réclamation désaffectée' },
        effectuePar: parseInt(session.user.id as string),
      },
    });

    // Notifier l'agent affecté
    if (affecteAId) {
      await prisma.notification.create({
        data: {
          userId: affecteAId,
          type: 'RECLAMATION_AFFECTEE',
          titre: 'Nouvelle réclamation affectée',
          message: `La réclamation "${reclamation.titre}" vous a été affectée.`,
          lien: `/reclamations/${reclamationId}`,
        },
      });
    }

    return NextResponse.json({
      message: affecteAId ? "Réclamation affectée avec succès" : "Réclamation désaffectée",
      reclamation: updated,
    });

  } catch (error) {
    console.error("Erreur PATCH /api/reclamations/[id]/affecter:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
