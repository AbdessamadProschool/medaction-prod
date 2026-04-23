import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { SecurityValidation } from '@/lib/security/validation';
import { withErrorHandler, successResponse } from '@/lib/api-handler';
import { UnauthorizedError, ForbiddenError, NotFoundError, ValidationError } from '@/lib/exceptions';

// Schéma de mise à jour sécurisé - INTERDIT les changements de statut directs
const updateReclamationSchema = z.object({
  titre: SecurityValidation.schemas.title.optional(),
  description: SecurityValidation.schemas.description.optional(),
}).strict(); // Refuse les champs non définis

// GET - Détails d'une réclamation
export const GET = withErrorHandler(async (
  request: Request,
  { params: _p }: { params: Promise<{ id: string }> }
) => {
  const params = await _p;
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    throw new UnauthorizedError('Non authentifié');
  }

  const id = SecurityValidation.validateId(params.id);
  if (!id) {
    throw new ValidationError('Identifiant de réclamation invalide');
  }

  const userId = parseInt(session.user.id);
  const role = session.user.role;

  const reclamation = await prisma.reclamation.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, nom: true, prenom: true, email: true, telephone: true } },
      commune: { select: { nom: true } },
      etablissement: { select: { nom: true, secteur: true } },
      historique: {
        orderBy: { createdAt: 'desc' },
      },
      medias: true,
    }
  });

  if (!reclamation) {
    throw new NotFoundError('Réclamation non trouvée');
  }

  let canAccess =
    ['ADMIN', 'SUPER_ADMIN', 'GOUVERNEUR'].includes(role) ||
    reclamation.userId === userId;

  if (!canAccess && role === 'AUTORITE_LOCALE') {
    const autorite = await prisma.user.findUnique({
      where: { id: userId },
      select: { communeResponsableId: true },
    });
    canAccess = autorite?.communeResponsableId === reclamation.communeId;
  }

  if (!canAccess) {
    throw new ForbiddenError('Accès refusé à cette réclamation');
  }

  return successResponse(reclamation);
});

// PATCH - Mise à jour d'une réclamation (propriétaire seulement, champs limités)
export const PATCH = withErrorHandler(async (
  request: Request,
  { params: _p }: { params: Promise<{ id: string }> }
) => {
  const params = await _p;
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    throw new UnauthorizedError('Non authentifié');
  }

  const id = SecurityValidation.validateId(params.id);
  if (!id) {
    throw new ValidationError('Identifiant de réclamation invalide');
  }

  const userId = parseInt(session.user.id);
  const role = session.user.role;

  // Récupérer la réclamation
  const reclamation = await prisma.reclamation.findUnique({
    where: { id },
    select: { id: true, userId: true, statut: true }
  });

  if (!reclamation) {
    throw new NotFoundError('Réclamation non trouvée');
  }

  // Vérifier permission d'édition ET propriété
  const { checkPermission } = await import("@/lib/permissions");
  const canEdit = await checkPermission(userId, 'reclamations.edit');
  const isOwner = reclamation.userId === userId;
  const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(role);
  
  if (!canEdit) {
    throw new ForbiddenError("Vous n'avez pas la permission de modifier des réclamations");
  }

  if (!isOwner && !isAdmin) {
    throw new ForbiddenError("Vous ne pouvez modifier que vos propres réclamations");
  }

  // Bloquer modification si déjà acceptée/traitée (sauf Admin peut-être ?)
  if (!isAdmin && reclamation.statut && ['ACCEPTEE', 'AFFECTEE', 'EN_COURS', 'RESOLUE', 'REJETEE'].includes(reclamation.statut)) {
    throw new ForbiddenError('Impossible de modifier une réclamation déjà traitée');
  }

  const body = await request.json();
  
  // Détecter tentative de manipulation de statut (SUSPICIOUS)
  if (body.statut) {
    SecurityValidation.logSecurityEvent('SUSPICIOUS_ACTIVITY', `Attempt to change status directly on PATCH /reclamations/${id}`);
    throw new ForbiddenError('Modification du statut non autorisée via cet endpoint');
  }

  const validation = updateReclamationSchema.safeParse(body);
  if (!validation.success) {
    throw validation.error;
  }

  const updated = await prisma.reclamation.update({
    where: { id },
    data: validation.data,
  });

  return successResponse(updated, 'Réclamation mise à jour avec succès');
});

// DELETE - Supprimer une réclamation (propriétaire si non traitée, ou Admin)
export const DELETE = withErrorHandler(async (
  request: Request,
  { params: _p }: { params: Promise<{ id: string }> }
) => {
  const params = await _p;
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    throw new UnauthorizedError('Non authentifié');
  }

  const id = SecurityValidation.validateId(params.id);
  if (!id) {
    throw new ValidationError('Identifiant de réclamation invalide');
  }

  const userId = parseInt(session.user.id);
  const role = session.user.role;
  const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(role);

  const reclamation = await prisma.reclamation.findUnique({
    where: { id },
    select: { id: true, userId: true, statut: true }
  });

  if (!reclamation) {
    throw new NotFoundError('Réclamation non trouvée');
  }

  const isOwner = reclamation.userId === userId;

  if (!isOwner && !isAdmin) {
    throw new ForbiddenError('Accès refusé pour la suppression');
  }

  // Si propriétaire, ne peut supprimer que si non traitée
  const isTraitee = reclamation.statut && ['ACCEPTEE', 'AFFECTEE', 'EN_COURS', 'RESOLUE'].includes(reclamation.statut);
  
  if (!isAdmin && isTraitee) {
     throw new ForbiddenError('Impossible de supprimer une réclamation déjà en cours de traitement');
  }

  await prisma.reclamation.delete({ where: { id } });

  return successResponse(null, 'Réclamation supprimée avec succès');
});