import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { z } from "zod";
import { Secteur } from "@prisma/client";
import { ActivityLogger } from "@/lib/activity-logger";
import { withErrorHandler, successResponse } from "@/lib/api-handler";
import { UnauthorizedError, ForbiddenError, NotFoundError, ValidationError } from "@/lib/exceptions";

// Schéma de validation pour l'affectation
const affectationSchema = z.object({
  affecteAId: z.number().int().positive().nullable(),
  secteurAffecte: z.nativeEnum(Secteur).optional(),
  commentaireAffectation: z.string().max(500).optional(),
});

// PATCH /api/reclamations/[id]/affecter - Affecter une réclamation
export const PATCH = withErrorHandler(async (
  request: NextRequest,
  { params: _p }: { params: Promise<{ id: string }> }
) => {
  const params = await _p;
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    throw new UnauthorizedError("Non authentifié");
  }

  // Vérifier les permissions (admin, gouverneur ou autorité locale)
  const allowedRoles = ['ADMIN', 'SUPER_ADMIN', 'GOUVERNEUR', 'AUTORITE_LOCALE'];
  if (!allowedRoles.includes(session.user.role || '')) {
    throw new ForbiddenError("Non autorisé");
  }

  const reclamationId = parseInt(params.id);
  if (isNaN(reclamationId)) {
    throw new ValidationError("ID invalide");
  }

    // Vérifier que la réclamation existe
    const reclamation = await prisma.reclamation.findUnique({
      where: { id: reclamationId },
      select: { id: true, titre: true, statut: true, communeId: true, affecteeAAutoriteId: true, affectationReclamation: true },
    });

  if (!reclamation) {
    throw new NotFoundError("Réclamation non trouvée");
  }

  // Le gouverneur ne peut affecter que les réclamations déjà acceptées/validées par l'admin
  if (session.user.role === 'GOUVERNEUR' && reclamation.statut !== 'ACCEPTEE') {
    throw new ForbiddenError("Le gouverneur ne peut affecter que les réclamations acceptées par l'administration");
  }

  // ✅ SECURITY FIX: AUTORITE_LOCALE — vérification de juridiction territoriale
  if (session.user.role === 'AUTORITE_LOCALE') {
    const autorite = await prisma.user.findUnique({
      where: { id: parseInt(session.user.id as string) },
      select: { communeResponsableId: true },
    });

    if (reclamation.communeId !== autorite?.communeResponsableId) {
      throw new ForbiddenError("Vous ne pouvez gérer que les réclamations de votre commune");
    }
  }

  // Valider les données
  const body = await request.json();
  const validation = affectationSchema.safeParse(body);

  if (!validation.success) {
    throw new ValidationError("Données invalides", { fieldErrors: validation.error.flatten().fieldErrors });
  }

    const { affecteAId, secteurAffecte, commentaireAffectation } = validation.data;

    // Si on affecte à quelqu'un, vérifier que l'utilisateur existe
    let agent = null;
    if (affecteAId) {
      agent = await prisma.user.findUnique({
        where: { id: affecteAId, isActive: true },
        select: { id: true, nom: true, prenom: true, role: true, communeResponsableId: true },
      });

    if (!agent) {
      throw new NotFoundError("Agent non trouvé ou inactif");
    }

      // ✅ SECURITY FIX: AUTORITE_LOCALE ne peut affecter qu'à un agent de sa commune
      if (session.user.role === 'AUTORITE_LOCALE') {
        const autorite = await prisma.user.findUnique({
          where: { id: parseInt(session.user.id as string) },
          select: { communeResponsableId: true },
        });
      if (agent.communeResponsableId !== autorite?.communeResponsableId) {
        throw new ForbiddenError("Vous ne pouvez affecter qu'à un agent de votre commune");
      }
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

  // Audit log
  await ActivityLogger.custom({
    action: affecteAId ? 'AFFECT_RECLAMATION' : 'DESAFFECT_RECLAMATION',
    entity: 'RECLAMATION',
    entityId: reclamationId,
    userId: parseInt(session.user.id),
    details: {
      previousValue: { 
        affecteeAAutoriteId: reclamation.affecteeAAutoriteId,
        affectationReclamation: reclamation.affectationReclamation
      },
      newValue: {
        affecteeAAutoriteId: updated.affecteeAAutoriteId,
        affectationReclamation: updated.affectationReclamation
      },
      agentName: agent ? `${agent.prenom} ${agent.nom}` : 'Désaffecté',
      secteur: secteurAffecte
    }
  });

  return successResponse({
    reclamation: updated,
  }, affecteAId ? "Réclamation affectée avec succès" : "Réclamation désaffectée");
});