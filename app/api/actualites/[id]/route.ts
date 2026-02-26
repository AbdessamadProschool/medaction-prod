import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { withErrorHandler } from '@/lib/api-handler';
import { UnauthorizedError, ForbiddenError, NotFoundError, ValidationError } from '@/lib/exceptions';

// GET - Récupérer une actualité par ID
export const GET = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id: idStr } = await params;
  const id = parseInt(idStr);
  
  if (isNaN(id)) {
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

  // Vérifier les permissions d'accès
  const isOwner = userId === actualite.createdBy;
  const isPublished = actualite.isPublie && actualite.isValide && actualite.statut === 'PUBLIEE';

  if (!isAdmin && !isOwner && !isPublished) {
    throw new ForbiddenError("Vous n'avez pas accès à cette actualité");
  }

  // NOTE: L'incrément des vues doit être géré par une route dédiée
  // avec vérification côté client via sessionStorage pour éviter les doublons

  return NextResponse.json({ success: true, data: actualite });
});

// PUT - Modifier une actualité (Admin)
export const PUT = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    throw new UnauthorizedError('Vous devez être connecté pour modifier une actualité');
  }

  const { id: idStr } = await params;
  const id = parseInt(idStr);
  
  if (isNaN(id)) {
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
  
  // Validation
  const errors: Array<{ field: string; message: string }> = [];
  
  if (body.titre && body.titre.length < 5) {
    errors.push({ field: 'titre', message: 'Le titre doit contenir au moins 5 caractères' });
  }
  if (body.titre && body.titre.length > 200) {
    errors.push({ field: 'titre', message: 'Le titre ne doit pas dépasser 200 caractères' });
  }
  if (body.contenu && body.contenu.length < 50) {
    errors.push({ field: 'contenu', message: 'Le contenu doit contenir au moins 50 caractères' });
  }

  if (errors.length > 0) {
    throw new ValidationError(
      errors.length === 1 ? errors[0].message : `${errors.length} erreurs de validation`,
      { fieldErrors: errors.reduce((acc, e) => ({ ...acc, [e.field]: [e.message] }), {}) }
    );
  }
  
  // Construire les données de mise à jour
  const updateData: any = {};
  
  if (body.titre) updateData.titre = body.titre.trim();
  if (body.description !== undefined) updateData.description = body.description?.trim();
  if (body.contenu) updateData.contenu = body.contenu.trim();
  if (body.categorie !== undefined) updateData.categorie = body.categorie;
  if (body.tags) updateData.tags = Array.isArray(body.tags) ? body.tags : [];
  
  // Les admins peuvent modifier le statut de validation/publication
  if (isAdmin) {
    if (body.isValide !== undefined) updateData.isValide = body.isValide;
    if (body.isPublie !== undefined) {
      updateData.isPublie = body.isPublie;
      if (body.isPublie) {
        updateData.datePublication = new Date();
        updateData.statut = 'PUBLIEE';
      }
    }
    if (body.statut) updateData.statut = body.statut;
  } else if (isOwner && actualite.statut === 'VALIDEE') {
    // Si modification par le propriétaire, repasser en attente de validation
    updateData.statut = 'EN_ATTENTE_VALIDATION';
    updateData.isValide = false;
  }

  const updated = await prisma.actualite.update({
    where: { id },
    data: updateData,
    include: {
      etablissement: { select: { nom: true } },
    }
  });

  return NextResponse.json({ 
    success: true,
    message: 'Actualité modifiée avec succès',
    data: updated 
  });
});

// PATCH - Modifier une actualité (compatibilité)
export const PATCH = PUT;

// DELETE - Supprimer une actualité
export const DELETE = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    throw new UnauthorizedError('Vous devez être connecté pour supprimer une actualité');
  }

  const { id: idStr } = await params;
  const id = parseInt(idStr);
  
  if (isNaN(id)) {
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

  // Supprimer les médias associés d'abord
  await prisma.media.deleteMany({ where: { actualiteId: id } });
  
  // Supprimer l'actualité
  await prisma.actualite.delete({ where: { id } });

  return NextResponse.json({ 
    success: true,
    message: `L'actualité "${actualite.titre}" a été supprimée`
  });
});
