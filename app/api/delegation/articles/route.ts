import { safeParseInt } from '@/lib/utils/parse';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { withErrorHandler, successResponse } from '@/lib/api-handler';
import { UnauthorizedError, ForbiddenError, ValidationError, NotFoundError } from '@/lib/exceptions';
import { notifyAdmins } from '@/lib/notifications';
import { articleSchema } from '@/lib/validations/delegation';

// GET - Liste des articles de la délégation
export const GET = withErrorHandler(async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    throw new UnauthorizedError('Vous devez être connecté');
  }

  if (session.user.role !== 'DELEGATION') {
    throw new ForbiddenError('Accès réservé aux délégations');
  }

  const userId = parseInt(session.user.id);
  if (isNaN(userId)) {
    throw new ValidationError('ID utilisateur invalide');
  }

  const { searchParams } = new URL(request.url);
  
  const page = Math.max(1, safeParseInt(searchParams.get('page') || '1', 1));
  const limit = Math.max(1, safeParseInt(searchParams.get('limit') || '12', 12));
  const search = searchParams.get('search') || '';
  const statut = searchParams.get('statut') || '';

  const where: any = {
    createdBy: userId,
  };

  if (search) {
    where.OR = [
      { titre: { contains: search, mode: 'insensitive' } },
      { contenu: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (statut === 'PUBLIE') {
    where.isPublie = true;
  } else if (statut === 'BROUILLON') {
    where.isPublie = false;
  }

  const [articles, total] = await Promise.all([
    prisma.article.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.article.count({ where }),
  ]);

  return successResponse({
    articles,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

// POST - Créer un article
export const POST = withErrorHandler(async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    throw new UnauthorizedError('Non autorisé');
  }

  if (session.user.role !== 'DELEGATION') {
    throw new ForbiddenError('Accès réservé aux délégations');
  }

  const userId = parseInt(session.user.id);
  const body = await request.json();

  // === VALIDATION DÉTAILLÉE VIA ZOD ===
  const validation = articleSchema.safeParse(body);
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

  const article = await prisma.article.create({
    data: {
      titre: validatedData.titre,
      contenu: validatedData.contenu,
      description: validatedData.resume || validatedData.description,
      categorie: validatedData.categorie,
      tags: validatedData.tags,
      imagePrincipale: validatedData.imagePrincipale,
      isPublie: false, // Force false for validation
      datePublication: undefined,
      createdBy: userId,
    },
  });

  // Create media record if image provided
  if (validatedData.imagePrincipale) {
    await prisma.media.create({
      data: {
        nomFichier: 'Image Article',
        cheminFichier: validatedData.imagePrincipale,
        urlPublique: validatedData.imagePrincipale,
        type: 'IMAGE',
        mimeType: 'image/jpeg',
        articleId: article.id,
        uploadePar: userId
      }
    });
  }

    // === NOTIFICATION AUX ADMINS ===
    await notifyAdmins({
      type: 'ARTICLE_CREATION',
      titre: 'Nouvel article créé',
      message: `L'article "${body.titre}" a été créé par la délégation et est en attente de validation.`,
      lien: `/admin/articles`,
    });

  return successResponse(article);
});
