import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db";
import { etablissementUpdateSchema } from "@/lib/validations/etablissement";
import { withErrorHandler, successResponse } from "@/lib/api-handler";
import { UnauthorizedError, ForbiddenError, NotFoundError, ValidationError } from "@/lib/exceptions";
import { getSafeId } from "@/lib/utils/parse";
import { auditLog } from "@/lib/logger";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET - Détails d'un établissement
export const GET = withErrorHandler(async (req: NextRequest, { params }: RouteParams) => {
  const { id } = await params;
  const etablissementId = getSafeId(id);

  const session = await getServerSession(authOptions);
  const isAdmin = session?.user?.role && ['ADMIN', 'SUPER_ADMIN', 'GOUVERNEUR'].includes(session.user.role);

  const etablissement = await prisma.etablissement.findUnique({
    where: { id: etablissementId },
    include: {
      commune: { select: { id: true, nom: true } },
      annexe: { select: { id: true, nom: true } },
      medias: { select: { id: true, urlPublique: true, type: true, nomFichier: true } },
      evaluations: {
        take: 20,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          noteGlobale: true,
          commentaire: true,
          createdAt: true,
          user: { select: { nom: true, prenom: true } }
        }
      },
      reclamations: {
        take: 20,
        orderBy: [{ createdAt: 'desc' }],
        select: {
          id: true,
          titre: true,
          description: true,
          statut: true,
          createdAt: true
        }
      },
      evenementsOrganises: {
        take: 20,
        orderBy: { dateDebut: 'desc' },
        select: {
          id: true,
          titre: true,
          dateDebut: true,
          typeCategorique: true,
          statut: true,
          bilanDescription: true,
          bilanNbParticipants: true
        }
      },
      actualites: {
        take: 20,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          titre: true,
          description: true,
          createdAt: true,
          statut: true
        }
      },
      activitesOrganisees: {
        take: 20,
        orderBy: { date: 'desc' },
        select: {
          id: true,
          titre: true,
          description: true,
          date: true,
          statut: true
        }
      },
      _count: {
        select: {
          evaluations: true,
          reclamations: true,
          evenementsOrganises: true,
          actualites: true,
          abonnements: true,
          activitesOrganisees: true,
        }
      }
    },
  });

  if (!etablissement) {
    throw new NotFoundError("Établissement non trouvé");
  }

  // Vérifier si l'établissement est accessible
  const isDelegation = session?.user?.role === 'DELEGATION';
  if (!isAdmin) {
    // Si c'est une délégation, elle ne peut voir que son secteur
    if (isDelegation && session?.user?.secteurResponsable && etablissement.secteur !== session.user.secteurResponsable) {
      throw new ForbiddenError("Vous n'avez pas accès aux établissements de ce secteur");
    }

    // Filtre de publication standard
    if (!etablissement.isPublie || !etablissement.isValide) {
      throw new ForbiddenError("Établissement non disponible");
    }
  }

  return successResponse(etablissement);
});

// PATCH - Modifier un établissement (ADMIN ou DELEGATION assignée)
export const PATCH = withErrorHandler(async (req: NextRequest, { params }: RouteParams) => {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    throw new UnauthorizedError("Non authentifié");
  }

  const { id } = await params;
  const etablissementId = getSafeId(id);

  // Vérifier existence
  const existing = await prisma.etablissement.findUnique({
    where: { id: etablissementId },
    select: { id: true, nom: true }
  });

  if (!existing) {
    throw new NotFoundError("Établissement non trouvé");
  }

  // Vérifier les permissions
  const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(session.user.role);
  const isDelegation = session.user.role === 'DELEGATION';

  if (!isAdmin && !isDelegation) {
    throw new ForbiddenError("Vous n'avez pas les droits pour modifier cet établissement");
  }

  // Sécurité supplémentaire pour DELEGATION : restriction au secteur
  if (isDelegation && !isAdmin) {
    // Re-fetch avec le secteur pour vérification
    const etablissementToCheck = await prisma.etablissement.findUnique({
      where: { id: etablissementId },
      select: { secteur: true }
    });

    if (etablissementToCheck?.secteur !== session.user.secteurResponsable) {
      throw new ForbiddenError("Vous ne pouvez modifier que les établissements de votre secteur");
    }
  }

  const body = await req.json();
  const result = etablissementUpdateSchema.safeParse(body);

  if (!result.success) {
    throw new ValidationError("Données invalides", { fieldErrors: result.error.flatten().fieldErrors });
  }

  // Mise de côté des champs admin et verrouillage secteur
  const updateData: Record<string, any> = { ...result.data };
  if (!isAdmin) {
    delete updateData.isPublie;
    delete updateData.isValide;
    delete updateData.isMisEnAvant;
    // Un délégué ne peut jamais changer le secteur d'un établissement
    delete updateData.secteur;
  }

  const updatedEtablissement = await prisma.etablissement.update({
    where: { id: etablissementId },
    data: updateData,
    include: {
      commune: { select: { id: true, nom: true } },
      annexe: { select: { id: true, nom: true } },
    },
  });

  // Audit logging avec comparaison d'état
  await auditLog({
    action: 'UPDATE_ETABLISSEMENT',
    resource: 'ETABLISSEMENT',
    resourceId: String(etablissementId),
    userId: session.user.id,
    previousValue: existing,
    newValue: updatedEtablissement,
    status: 'SUCCESS',
    ipAddress: req.headers.get('x-forwarded-for') || '0.0.0.0',
    userAgent: req.headers.get('user-agent') || 'unknown'
  });

  return successResponse(updatedEtablissement, "Établissement modifié avec succès");
});

// DELETE - Supprimer un établissement (ADMIN uniquement)
export const DELETE = withErrorHandler(async (req: NextRequest, { params }: RouteParams) => {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    throw new UnauthorizedError("Non authentifié");
  }

  // Seuls les admins peuvent supprimer
  if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
    throw new ForbiddenError("Seuls les administrateurs peuvent supprimer des établissements");
  }

  const { id } = await params;
  const etablissementId = getSafeId(id);

  // Vérifier existence
  const existing = await prisma.etablissement.findUnique({
    where: { id: etablissementId },
    select: { id: true, nom: true, code: true }
  });

  if (!existing) {
    throw new NotFoundError("Établissement non trouvé");
  }

  // Vérifier s'il y a des dépendances
  const dependencies = await prisma.etablissement.findUnique({
    where: { id: etablissementId },
    select: {
      _count: {
        select: {
          reclamations: true,
          evenementsOrganises: true,
          evaluations: true,
        }
      }
    }
  });

  const hasReclamations = (dependencies?._count.reclamations || 0) > 0;
  const hasEvenements = (dependencies?._count.evenementsOrganises || 0) > 0;

  if (hasReclamations || hasEvenements) {
    throw new ValidationError(
      "Impossible de supprimer cet établissement car il a des réclamations ou événements associés",
      {
        reclamations: dependencies?._count.reclamations,
        evenements: dependencies?._count.evenementsOrganises
      }
    );
  }

  await prisma.etablissement.delete({
    where: { id: etablissementId },
  });

  // Audit logging
  await auditLog({
    action: 'DELETE_ETABLISSEMENT',
    resource: 'ETABLISSEMENT',
    resourceId: String(etablissementId),
    userId: session.user.id,
    status: 'SUCCESS',
    ipAddress: req.headers.get('x-forwarded-for') || '0.0.0.0',
    userAgent: req.headers.get('user-agent') || 'unknown',
    details: {
      nom: existing.nom,
      code: existing.code
    }
  });

  return successResponse(null, `Établissement "${existing.nom}" (${existing.code}) supprimé avec succès`);
});
