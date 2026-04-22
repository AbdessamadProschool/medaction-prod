import { safeParseInt } from '@/lib/utils/parse';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { withErrorHandler } from '@/lib/api-handler';
import { UnauthorizedError, ForbiddenError, ValidationError } from '@/lib/exceptions';
import { z } from 'zod';
import { sanitizeString } from '@/lib/security/validation';

// Schéma de validation pour création d'article
const createArticleSchema = z.object({
  titre: z.string()
    .min(5, "Le titre est obligatoire (minimum 5 caractères)")
    .max(200, "Le titre ne doit pas dépasser 200 caractères")
    .transform(sanitizeString),
  description: z.string()
    .max(500, "La description ne doit pas dépasser 500 caractères")
    .optional()
    .transform(v => v ? sanitizeString(v) : undefined),
  contenu: z.string()
    .min(50, "Le contenu est obligatoire (minimum 50 caractères)")
    .transform(v => v.trim()),
  categorie: z.string().optional().transform(v => v ? sanitizeString(v) : undefined),
  imagePrincipale: z.string().optional(),
  imageCouverture: z.string().optional(),
  resume: z.string().optional().transform(v => v ? sanitizeString(v) : undefined),
  tags: z.array(z.string()).optional(),
  isPublie: z.boolean().optional(),
});

// GET - Liste publique des articles
export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  
  const page = safeParseInt(searchParams.get('page') || '1', 0);
  const limit = Math.min(safeParseInt(searchParams.get('limit') || '12', 0), 100);
  const search = searchParams.get('search') || '';
  const categorie = searchParams.get('categorie') || '';

  const where: Record<string, any> = {
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

  const dateDebutRaw = searchParams.get('dateDebut');
  const dateFinRaw = searchParams.get('dateFin');
  if (dateDebutRaw || dateFinRaw) {
    where.createdAt = {};
    if (dateDebutRaw) where.createdAt.gte = new Date(dateDebutRaw);
    if (dateFinRaw) {
        const dFin = new Date(dateFinRaw);
        dFin.setHours(23, 59, 59, 999);
        where.createdAt.lte = dFin;
    }
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

  // Validation avec Zod
  const validation = createArticleSchema.safeParse(body);

  if (!validation.success) {
    throw new ValidationError('Données invalides', { 
      fieldErrors: validation.error.flatten().fieldErrors 
    });
  }

  const data = validation.data;

  const article = await prisma.article.create({
    data: {
      titre: data.titre,
      contenu: data.contenu,
      description: data.resume || data.description || data.contenu.substring(0, 200),
      categorie: data.categorie,
      imagePrincipale: data.imageCouverture || data.imagePrincipale,
      tags: data.tags || [],
      isPublie: data.isPublie || false,
      datePublication: data.isPublie ? new Date() : null,
      createdBy: userId,
    },
  });

  return NextResponse.json({
    success: true,
    message: 'Article créé avec succès',
    data: article,
  }, { status: 201 });
});
