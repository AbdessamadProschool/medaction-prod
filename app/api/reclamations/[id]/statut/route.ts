import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { Prisma, Secteur } from '@prisma/client';
import { validateId } from '@/lib/security/validation';
import { ActivityLogger } from '@/lib/activity-logger';
import {
  notifyReclamationAccepted,
  notifyReclamationRejected,
  notifyReclamationAssigned,
} from '@/lib/notifications';

// ─── Types ────────────────────────────────────────────────────────────────────

type ReclamationAction = 'ACCEPTATION' | 'REJET' | 'AFFECTATION';

/**
 * Maps a ReclamationAction to its human-readable labels — single source of truth
 * used both for the activity log and the HTTP response message.
 */
const ACTION_LABELS: Record<ReclamationAction, { log: string; response: string }> = {
  ACCEPTATION: { log: 'Validation réclamation', response: 'Réclamation acceptée' },
  REJET:       { log: 'Rejet réclamation',       response: 'Réclamation rejetée' },
  AFFECTATION: { log: 'Affectation réclamation', response: 'Réclamation affectée' },
};

// ─── Domain helpers ────────────────────────────────────────────────────────────

function buildStatusUpdate(statut: 'ACCEPTEE' | 'REJETEE', motifRejet?: string): Prisma.ReclamationUpdateInput {
  if (statut === 'REJETEE') {
    return {
      statut,
      motifRejet: motifRejet!.trim(),
      // Clear affectation on rejection — authority should no longer see the record
      affecteeAAutorite: { disconnect: true },
      affectationReclamation: 'NON_AFFECTEE',
      secteurAffecte: null,
      serviceInterneProvince: null,
      dateAffectation: null,
    };
  }
  return { statut };
}

function buildAssignmentUpdate(
  autoriteId: number,
  adminId: number,
  secteurAffecte?: Secteur,
  serviceInterneProvince?: string
): Prisma.ReclamationUpdateInput {
  return {
    affecteeAAutorite: { connect: { id: autoriteId } },
    affecteeParAdmin: { connect: { id: adminId } },
    affectationReclamation: 'AFFECTEE',
    dateAffectation: new Date(),
    ...(secteurAffecte && { secteurAffecte }),
    ...(serviceInterneProvince && { serviceInterneProvince }),
  };
}

async function findAutoriteLocale(autoriteId: number) {
  return prisma.user.findFirst({
    where: { id: autoriteId, role: 'AUTORITE_LOCALE', isActive: true },
    select: { id: true, nom: true, prenom: true },
  });
}

// ─── Route handler ─────────────────────────────────────────────────────────────

// PATCH - Changer le statut d'une réclamation (Admin)
export async function PATCH(
  request: NextRequest,
  { params: _p }: { params: Promise<{ id: string }> }
) {
  const params = await _p;
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role || '')) {
      return NextResponse.json({ error: 'Accès réservé aux administrateurs' }, { status: 403 });
    }

    const reclamationId = validateId(params.id);
    if (reclamationId === null) {
      return NextResponse.json({ error: 'ID invalide' }, { status: 400 });
    }

    const adminId = parseInt(session.user.id);
    const body = await request.json();
    const { statut, motifRejet, affecteeAAutoriteId, secteurAffecte, serviceInterneProvince, commentaire } = body;

    const reclamation = await prisma.reclamation.findUnique({
      where: { id: reclamationId },
      select: { id: true, userId: true, titre: true, statut: true },
    });

    if (!reclamation) {
      return NextResponse.json({ error: 'Réclamation non trouvée' }, { status: 404 });
    }

    // ── Input validation before any DB write ───────────────────────────────────

    if (statut && !['ACCEPTEE', 'REJETEE'].includes(statut)) {
      return NextResponse.json({ error: 'Statut invalide' }, { status: 400 });
    }

    if (statut === 'REJETEE' && (!motifRejet || motifRejet.trim().length < 10)) {
      return NextResponse.json(
        { error: 'Le motif de rejet doit contenir au moins 10 caractères' },
        { status: 400 }
      );
    }

    if (affecteeAAutoriteId) {
      const autorite = await findAutoriteLocale(affecteeAAutoriteId);
      if (!autorite) {
        return NextResponse.json({ error: 'Autorité locale non trouvée' }, { status: 404 });
      }
    }

    // ── Build typed update payload ─────────────────────────────────────────────

    let reclamationAction: ReclamationAction | null = null;
    let updateInput: Prisma.ReclamationUpdateInput = {};

    if (statut) {
      updateInput = buildStatusUpdate(statut, motifRejet);
      reclamationAction = statut === 'ACCEPTEE' ? 'ACCEPTATION' : 'REJET';
    }

    if (affecteeAAutoriteId) {
      updateInput = {
        ...updateInput,
        ...buildAssignmentUpdate(affecteeAAutoriteId, adminId, secteurAffecte, serviceInterneProvince),
      };
      reclamationAction = 'AFFECTATION';
    }

    // ── Persist ────────────────────────────────────────────────────────────────

    const updatedReclamation = await prisma.reclamation.update({
      where: { id: reclamationId },
      data: updateInput,
      include: {
        user: { select: { id: true, nom: true, prenom: true, email: true } },
        commune: { select: { nom: true } },
      },
    });

    if (reclamationAction) {
      const labels = ACTION_LABELS[reclamationAction];

      await prisma.historiqueReclamation.create({
        data: {
          reclamationId,
          action: reclamationAction,
          details: {
            // Clean JSON-serializable object — no Prisma types
            commentaire: commentaire ?? null,
            effectueParId: adminId,
            effectueParNom: `${session.user.prenom} ${session.user.nom}`,
            action: reclamationAction,
            statut: statut ?? null,
            affecteeAAutoriteId: affecteeAAutoriteId ?? null,
          },
          effectuePar: adminId,
        },
      });

      await ActivityLogger.custom({
        userId: adminId,
        action: labels.log,
        entity: 'Reclamation',
        entityId: reclamationId,
        details: { action: reclamationAction, titre: reclamation.titre },
      });
    }

    // ── Notifications ──────────────────────────────────────────────────────────

    if (reclamationAction === 'ACCEPTATION') {
      await notifyReclamationAccepted(reclamationId, reclamation.userId);
    } else if (reclamationAction === 'REJET') {
      await notifyReclamationRejected(reclamationId, reclamation.userId, motifRejet);
    } else if (reclamationAction === 'AFFECTATION') {
      await notifyReclamationAssigned(reclamationId, affecteeAAutoriteId);
    }

    const responseMessage = reclamationAction
      ? ACTION_LABELS[reclamationAction].response
      : 'Réclamation mise à jour';

    return NextResponse.json({
      reclamation: updatedReclamation,
      message: responseMessage,
    });

  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      // Record disappeared between findUnique and update (race condition)
      return NextResponse.json({ error: 'Réclamation introuvable' }, { status: 404 });
    }
    console.error('[reclamations/statut] Unexpected error:', error);
    return NextResponse.json({ error: 'Erreur serveur interne' }, { status: 500 });
  }
}