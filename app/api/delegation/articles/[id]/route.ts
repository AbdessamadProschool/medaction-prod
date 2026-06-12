import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { withErrorHandler, successResponse } from '@/lib/api-handler';
import { UnauthorizedError, ForbiddenError, ValidationError, NotFoundError } from '@/lib/exceptions';

async function getArticleWithOwnershipCheck(articleId: number, session: any) {
  const article = await prisma.article.findUnique({
    where: { id: articleId },
    include: {
      createdByUser: { select: { id: true, nom: true, prenom: true } },
    }
  });

  if (!article) {
    throw new NotFoundError('Article non trouvé');
  }

  const isOwner = Number(article.createdBy) === Number(session.user.id);
  const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(session.user.role || '');

  if (!isOwner && !isAdmin) {
    throw new ForbiddenError('Accès refusé');
  }

  return article;
}

// GET - Récupérer un article par ID
export const GET = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    throw new UnauthorizedError('Non autorisé');
  }

  const articleId = parseInt(id);
  if (isNaN(articleId)) {
    throw new ValidationError('ID invalide');
  }

  const article = await getArticleWithOwnershipCheck(articleId, session);

  return successResponse(article);
});

// PATCH - Modifier un article
export const PATCH = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    throw new UnauthorizedError('Non autorisé');
  }

  if (!['DELEGATION', 'ADMIN', 'SUPER_ADMIN'].includes(session.user.role || '')) {
    throw new ForbiddenError('Accès non autorisé');
  }

  const articleId = parseInt(id);
  if (isNaN(articleId)) {
    throw new ValidationError('ID invalide');
  }

  await getArticleWithOwnershipCheck(articleId, session);

  const body = await request.json();
  const { titre, description, contenu, categorie, tags, imagePrincipale, isPublie } = body;

  const article = await prisma.article.update({
    where: { id: articleId },
    data: {
      titre,
      description,
      contenu,
      categorie,
      tags,
      imagePrincipale,
      isPublie,
      updatedAt: new Date(),
    }
  });

  return successResponse(article);
});

// DELETE - Supprimer un article
export const DELETE = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    throw new UnauthorizedError('Non autorisé');
  }

  if (!['DELEGATION', 'ADMIN', 'SUPER_ADMIN'].includes(session.user.role || '')) {
    throw new ForbiddenError('Accès non autorisé');
  }

  const articleId = parseInt(id);
  if (isNaN(articleId)) {
    throw new ValidationError('ID invalide');
  }

  await getArticleWithOwnershipCheck(articleId, session);

  await prisma.article.delete({
    where: { id: articleId }
  });

  return successResponse(null, 'Article supprimé');
});