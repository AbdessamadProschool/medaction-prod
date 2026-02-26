import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { withErrorHandler } from '@/lib/api-handler';
import { UnauthorizedError, ForbiddenError, ValidationError } from '@/lib/exceptions';

// GET - Liste publique des articles
export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  
  const page = parseInt(searchParams.get('page') || '1');
  const limit = Math.min(parseInt(searchParams.get('limit') || '12'), 100);
  const search = searchParams.get('search') || '';
  const categorie = searchParams.get('categorie') || '';

  const where: Record<string, unknown> = {
    isPublie: true,
  };

  if (search) {
    where.OR = [
      { titre: { contains: search, mode: 'insensitive' } },
      { contenu: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (categorie) {
    where.categorie = categorie;
  }

  const [articles, total, categories] = await Promise.all([
    prisma.article.findMany({
      where,
      select: {
        id: true,
        titre: true,
        description: true,
        categorie: true,
        imagePrincipale: true,
        nombreVues: true,
        datePublication: true,
        createdAt: true,
        isPublie: true,
        createdByUser: {
          select: {
            id: true,
            prenom: true,
            nom: true,
          },
        },
      },
      orderBy: { datePublication: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.article.count({ where }),
    prisma.article.groupBy({
      by: ['categorie'],
      where: { isPublie: true },
      _count: { categorie: true },
    }),
  ]);

  // Format articles with aliased field names for frontend
  const formattedArticles = articles.map(a => ({
    id: a.id,
    titre: a.titre,
    resume: a.description,
    categorie: a.categorie,
    imageCouverture: a.imagePrincipale,
    vues: a.nombreVues,
    datePublication: a.datePublication,
    createdAt: a.createdAt,
    auteur: a.createdByUser,
    statut: a.isPublie ? 'PUBLIE' : 'EN_ATTENTE',
  }));

  return NextResponse.json({
    success: true,
    data: formattedArticles,
    categories: categories
      .filter(c => c.categorie)
      .map(c => ({
        nom: c.categorie,
        count: c._count.categorie,
      })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

// POST - Créer un article (réservé aux rôles autorisés)
export const POST = withErrorHandler(async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    throw new UnauthorizedError('Vous devez être connecté pour créer un article');
  }

  const allowedRoles = ['ADMIN', 'SUPER_ADMIN', 'DELEGATION', 'MODERATEUR'];
  if (!allowedRoles.includes(session.user.role || '')) {
    throw new ForbiddenError("Vous n'avez pas la permission de créer des articles");
  }

  const userId = parseInt(session.user.id);
  const body = await request.json();

  // Validation détaillée
  const errors: Array<{ field: string; message: string }> = [];

  if (!body.titre || body.titre.trim().length < 5) {
    errors.push({ field: 'titre', message: 'Le titre est obligatoire (minimum 5 caractères)' });
  }
  if (body.titre && body.titre.length > 200) {
    errors.push({ field: 'titre', message: 'Le titre ne doit pas dépasser 200 caractères' });
  }

  if (!body.contenu || body.contenu.trim().length < 50) {
    errors.push({ field: 'contenu', message: 'Le contenu est obligatoire (minimum 50 caractères)' });
  }

  if (errors.length > 0) {
    throw new ValidationError(
      errors.length === 1 ? errors[0].message : `${errors.length} erreurs de validation`,
      { 
        fieldErrors: errors.reduce((acc, e) => {
          if (!acc[e.field]) acc[e.field] = [];
          acc[e.field].push(e.message);
          return acc;
        }, {} as Record<string, string[]>)
      }
    );
  }

  const article = await prisma.article.create({
    data: {
      titre: body.titre.trim(),
      contenu: body.contenu.trim(),
      description: body.resume?.trim() || body.description?.trim() || body.contenu.substring(0, 200),
      categorie: body.categorie,
      imagePrincipale: body.imageCouverture || body.imagePrincipale,
      tags: body.tags || [],
      isPublie: body.isPublie || false,
      datePublication: body.isPublie ? new Date() : null,
      createdBy: userId,
    },
  });

  return NextResponse.json({
    success: true,
    message: 'Article créé avec succès',
    data: article,
  }, { status: 201 });
});
