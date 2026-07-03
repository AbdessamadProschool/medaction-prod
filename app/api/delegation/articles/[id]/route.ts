import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { withErrorHandler, successResponse } from '@/lib/api-handler';
import { UnauthorizedError, ForbiddenError, ValidationError, NotFoundError, AppError } from '@/lib/exceptions';
import { articleSchema } from '@/lib/validations/delegation';

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

  // === VALIDATION DÉTAILLÉE VIA ZOD ===
  const validation = articleSchema.partial().safeParse(body);
  if (!validation.success) {
    const formattedErrors = validation.error.format();
    throw new ValidationError(
      'Erreur de validation',
      { 
        fieldErrors: Object.keys(formattedErrors).reduce((acc, key) => {
          if (key !== '_errors') {
            acc[key] = (formattedErrors as any)[key]?._errors || [];
          }
          return acc;
        }, {} as Record<string, string[]>)
      }
    );
  }

  const validatedData = validation.data;

  const article = await prisma.article.update({
    where: { id: articleId },
    data: {
      titre: validatedData.titre,
      description: validatedData.resume || validatedData.description,
      contenu: validatedData.contenu,
      categorie: validatedData.categorie,
      tags: validatedData.tags,
      imagePrincipale: validatedData.imagePrincipale,
      isPublie: validatedData.isPublie,
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