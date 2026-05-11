import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { withErrorHandler, successResponse } from '@/lib/api-handler';
import { UnauthorizedError, ForbiddenError, NotFoundError, ValidationError } from '@/lib/exceptions';
import { SecurityValidation } from '@/lib/security/validation';
import { z } from 'zod';
import { auditLog } from '@/lib/logger';

// Schéma de validation pour la mise à jour
const updateActualiteSchema = z.object({
  titre: SecurityValidation.schemas.title.optional(),
  description: z.string().max(500).optional().transform(v => v ? SecurityValidation.sanitizeString(v) : undefined),
  contenu: z.string().min(50, "Le contenu doit contenir au moins 50 caractères").optional(),
  categorie: z.string().optional().transform(v => v ? SecurityValidation.sanitizeString(v) : undefined),
  tags: z.array(z.string().max(30)).optional(),
  isValide: z.boolean().optional(),
  isPublie: z.boolean().optional(),
  statut: z.string().optional(),
});

// GET - Récupérer une actualité par ID
export const GET = withErrorHandler(async (
  request: NextRequest,
  { params: _p }: { params: Promise<{ id: string }> }
) => {
  const params = await _p;
  const id = SecurityValidation.validateId(params.id);
  
  if (!id) {
    throw new ValidationError("L'identifiant de l'actualité n'est pas valide");
  }

  const session = await getServerSession(authOptions);
  const isAdmin = session?.user?.role && ['ADMIN', 'SUPER_ADMIN'].includes(session.user.role);
  const userId = session?.user?.id ? parseInt(session.user.id) : null;

  const actualite = await prisma.actualite.findUnique({
    where: { id },
    include: {
      etablissement: { 
        select: { 
          id: true, 
          nom: true, 
          secteur: true,
          commune: { select: { nom: true } }
        } 
      },
      medias: true,
      createdByUser: { select: { nom: true, prenom: true } },
    }
  });

  if (!actualite) {
    throw new NotFoundError("L'actualité demandée n'existe pas");
  }

  // Vérifier les permissions d'accès - IDOR Protection
  const isOwner = userId === actualite.createdBy;
  const isPublished = actualite.isPublie && actualite.isValide && actualite.statut === 'PUBLIEE';

  if (!isAdmin && !isOwner && !isPublished) {
    throw new ForbiddenError("Vous n'avez pas accès à cette actualité");
  }

  return successResponse(actualite);
});

// PUT/PATCH - Modifier une actualité
export const PUT = withErrorHandler(async (
  request: NextRequest,
  { params: _p }: { params: Promise<{ id: string }> }
) => {
  const params = await _p;
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    throw new UnauthorizedError('Vous devez être connecté pour modifier une actualité');
  }

  const id = SecurityValidation.validateId(params.id);
  if (!id) {
    throw new ValidationError("L'identifiant de l'actualité n'est pas valide");
  }

  const actualite = await prisma.actualite.findUnique({
    where: { id },
    select: { id: true, createdBy: true, statut: true }
  });

  if (!actualite) {
    throw new NotFoundError("L'actualité n'existe pas");
  }

  const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(session.user.role || '');
  const isOwner = parseInt(session.user.id) === actualite.createdBy;

  if (!isAdmin && !isOwner) {
    throw new ForbiddenError("Vous n'êtes pas autorisé à modifier cette actualité");
  }

  const body = await request.json();
  const validation = updateActualiteSchema.safeParse(body);
  
  if (!validation.success) {
    throw validation.error;
  }

  const data = validation.data;
  const updateData: any = {};
  
  if (data.titre) updateData.titre = data.titre;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.contenu) updateData.contenu = data.contenu.trim();
  if (data.categorie !== undefined) updateData.categorie = data.categorie;
  if (data.tags) updateData.tags = data.tags;
  
  // Les admins peuvent modifier le statut de validation/publication
  if (isAdmin) {
    if (data.isValide !== undefined) updateData.isValide = data.isValide;
    if (data.isPublie !== undefined) {
      updateData.isPublie = data.isPublie;
      if (data.isPublie) {
        updateData.datePublication = new Date();
        updateData.statut = 'PUBLIEE';
      }
    }
    if (data.statut) updateData.statut = data.statut;
  } else if (isOwner && actualite.statut === 'PUBLIEE') {
    // Si modification par le propriétaire sur une actualité déjà publiée, repasser en attente
    updateData.statut = 'EN_ATTENTE_VALIDATION';
    updateData.isValide = false;
    updateData.isPublie = false;
  }

  const updated = await prisma.actualite.update({
    where: { id },
    data: updateData,
    include: {
      etablissement: { select: { nom: true } },
    }
  });

  auditLog(
    'UPDATE_ACTUALITE',
    'Actualite',
    id,
    parseInt(session.user.id),
    { 
      updatedFields: Object.keys(updateData),
      statut: updateData.statut || updated.statut,
      title: updated.titre
    }
  );

  return successResponse(updated, 'Actualité modifiée avec succès');
});

export const PATCH = PUT;

// DELETE - Supprimer une actualité
export const DELETE = withErrorHandler(async (
  request: NextRequest,
  { params: _p }: { params: Promise<{ id: string }> }
) => {
  const params = await _p;
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    throw new UnauthorizedError('Vous devez être connecté pour supprimer une actualité');
  }

  const id = SecurityValidation.validateId(params.id);
  if (!id) {
    throw new ValidationError("L'identifiant de l'actualité n'est pas valide");
  }

  const actualite = await prisma.actualite.findUnique({
    where: { id },
    select: { id: true, createdBy: true, titre: true }
  });

  if (!actualite) {
    throw new NotFoundError("L'actualité n'existe pas");
  }

  const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(session.user.role || '');
  const isOwner = parseInt(session.user.id) === actualite.createdBy;

  if (!isAdmin && !isOwner) {
    throw new ForbiddenError("Vous n'êtes pas autorisé à supprimer cette actualité");
  }

  // Supprimer les médias associés d'abord (Cascade manuelle si nécessaire selon les contraintes Prisma)
  await prisma.media.deleteMany({ where: { actualiteId: id } });
  
  // Supprimer l'actualité
  await prisma.actualite.delete({ where: { id } });

  auditLog(
    'DELETE_ACTUALITE',
    'Actualite',
    id,
    parseInt(session.user.id),
    { title: actualite.titre }
  );

  return successResponse(null, `L'actualité "${actualite.titre}" a été supprimée`);
});