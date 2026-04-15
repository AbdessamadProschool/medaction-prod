import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { withErrorHandler, successResponse } from '@/lib/api-handler';
import { SecurityValidation } from '@/lib/security/validation';
import { UnauthorizedError, ForbiddenError, NotFoundError, ValidationError } from '@/lib/exceptions';

// GET /api/suggestions/[id] - Détail d'une suggestion
export const GET = withErrorHandler(async (
  request: NextRequest,
  { params: _p }: { params: Promise<{ id: string }> }
) => {
  const params = await _p;
  const id = SecurityValidation.validateId(params.id);
  if (!id) throw new ValidationError("Identifiant de suggestion invalide");

  const suggestion = await prisma.suggestion.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          nom: true,
          prenom: true,
          email: true,
        },
      },
    },
  });

  if (!suggestion) {
    throw new NotFoundError('Suggestion non trouvée');
  }

  // Vérification de la visibilité (Staff ou Propriétaire ou Publique)
  const session = await getServerSession(authOptions);
  const currentUser = session?.user;
  const isAdmin = currentUser && ['ADMIN', 'SUPER_ADMIN', 'GOUVERNEUR', 'DELEGATION', 'AUTORITE_LOCALE'].includes(currentUser.role);
  const isOwner = currentUser && suggestion.userId === parseInt(currentUser.id);
  const isPublic = ['APPROUVEE', 'IMPLEMENTEE'].includes(suggestion.statut);

  if (!isAdmin && !isOwner && !isPublic) {
    throw new ForbiddenError("Vous n'avez pas accès à cette suggestion");
  }

  return successResponse(suggestion);
});

// DELETE /api/suggestions/[id] - Supprimer sa propre suggestion
export const DELETE = withErrorHandler(async (
  request: NextRequest,
  { params: _p }: { params: Promise<{ id: string }> }
) => {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    throw new UnauthorizedError('Non authentifié');
  }

  const params = await _p;
  const id = SecurityValidation.validateId(params.id);
  if (!id) throw new ValidationError("Identifiant de suggestion invalide");
  
  const userId = parseInt(session.user.id);
  const role = session.user.role;

  const suggestion = await prisma.suggestion.findUnique({
    where: { id },
  });

  if (!suggestion) {
    throw new NotFoundError('Suggestion non trouvée');
  }

  // Vérifier les permissions (propriétaire ou admin) - IDOR Protection
  const canDelete = suggestion.userId === userId || role === 'ADMIN' || role === 'SUPER_ADMIN';

  if (!canDelete) {
    throw new ForbiddenError('Accès refusé');
  }

  // Ne pas permettre la suppression des suggestions approuvées ou implémentées (sauf pour les admins)
  if (
    role !== 'SUPER_ADMIN' && 
    role !== 'ADMIN' && 
    ['APPROUVEE', 'IMPLEMENTEE'].includes(suggestion.statut)
  ) {
  const params = await _p;
    throw new ForbiddenError('Cette suggestion ne peut plus être supprimée car elle a été traitée');
  }

  await prisma.suggestion.delete({ where: { id } });

  return successResponse(null, 'Suggestion supprimée avec succès');
});