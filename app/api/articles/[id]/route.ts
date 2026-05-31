import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withErrorHandler } from '@/lib/api-handler';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { UnauthorizedError, ForbiddenError, ValidationError } from '@/lib/exceptions';
import { z } from 'zod';
import { sanitizeString } from '@/lib/security/validation';

const updateArticleSchema = z.object({
  titre: z.string().min(5).max(200).optional().transform(v => v ? sanitizeString(v) : v),
  description: z.string().max(500).optional().nullable().transform(v => v ? sanitizeString(v) : v),
  contenu: z.string().min(50).optional().transform(v => v ? v.trim() : v),
  categorie: z.string().optional().nullable().transform(v => v ? sanitizeString(v) : v),
  tags: z.array(z.string()).optional(),
  isPublie: z.boolean().optional(),
  isMisEnAvant: z.boolean().optional(),
  statut: z.string().optional(),
  datePublication: z.string().optional().nullable(),
});

// GET - Détail d'un article
export const GET = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const articleId = parseInt(id);

  if (isNaN(articleId)) {
    return NextResponse.json({ error: 'ID invalide' }, { status: 400 });
  }

  const article = await prisma.article.findUnique({
    where: { id: articleId },
    include: {
      createdByUser: {
        select: {
          id: true,
          prenom: true,
          nom: true,
        },
      },
    },
  });

  if (!article) {
    return NextResponse.json({ error: 'Article non trouvé' }, { status: 404 });
  }

  // SECURITY FIX: Vérification de visibilité
  // Les articles non publiés ne sont accessibles qu'aux admins et à l'auteur
  if (!article.isPublie) {
    const session = await getServerSession(authOptions);
    const isAdmin = session && ['ADMIN', 'SUPER_ADMIN'].includes(session.user?.role || '');
    const isAuthor = session && String(article.createdBy) === String(session.user?.id);

    if (!isAdmin && !isAuthor) {
      // Ne pas révéler l'existence de l'article → 404
      return NextResponse.json({ error: 'Article non trouvé' }, { status: 404 });
    }
  }

  // Incrémenter les vues (uniquement pour les articles publiés)
  if (article.isPublie) {
    await prisma.article.update({
      where: { id: articleId },
      data: { nombreVues: { increment: 1 } },
    });
  }

  // Récupérer les articles connexes (toujours filtrés par isPublie)
  const articlesConnexes = await prisma.article.findMany({
    where: {
      isPublie: true,
      id: { not: articleId },
      categorie: article.categorie || undefined,
    },
    select: {
      id: true,
      titre: true,
      description: true,
      imagePrincipale: true,
      categorie: true,
      datePublication: true,
    },
    take: 3,
    orderBy: { datePublication: 'desc' },
  });

  return NextResponse.json({
    success: true,
    data: {
      ...article,
      auteur: article.createdByUser,
      vues: (article.nombreVues || 0) + (article.isPublie ? 1 : 0),
      resume: article.description,
      imageCouverture: article.imagePrincipale,
    },
    articlesConnexes: articlesConnexes.map(a => ({
      ...a,
      resume: a.description,
      imageCouverture: a.imagePrincipale,
    })),
  });
});

// PUT - Mettre à jour un article
export const PUT = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new UnauthorizedError();

  const allowedRoles = ['ADMIN', 'SUPER_ADMIN', 'DELEGATION', 'MODERATEUR'];
  if (!allowedRoles.includes(session.user.role || '')) throw new ForbiddenError();

  const { id } = await params;
  const articleId = parseInt(id);
  const body = await request.json();
  
  const validation = updateArticleSchema.safeParse(body);
  if (!validation.success) {
    throw new ValidationError('Données invalides', { 
      fieldErrors: validation.error.flatten().fieldErrors 
    });
  }
  
  const data = validation.data;

  const article = await prisma.article.update({
    where: { id: articleId },
    data: {
      ...(data.titre !== undefined && { titre: data.titre }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.contenu !== undefined && { contenu: data.contenu }),
      ...(data.categorie !== undefined && { categorie: data.categorie }),
      ...(data.tags !== undefined && { tags: data.tags }),
      ...(data.isPublie !== undefined && { statut: (data.isPublie ? 'PUBLIE' : 'BROUILLON') as any }),
      ...(data.isPublie !== undefined && { isPublie: data.isPublie }),
      ...(data.isMisEnAvant !== undefined && { isMisEnAvant: data.isMisEnAvant }),
      ...(data.isPublie !== undefined ? { datePublication: data.isPublie ? new Date() : (data.datePublication ? new Date(data.datePublication) : undefined) } : {}),
    },
  });

  return NextResponse.json({ success: true, data: article });
});

// DELETE - Supprimer un article
export const DELETE = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new UnauthorizedError();
  
  if (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN') {
    throw new ForbiddenError();
  }

  const { id } = await params;
  const articleId = parseInt(id);

  await prisma.article.delete({
    where: { id: articleId },
  });

  return NextResponse.json({ success: true, message: "Article supprimé" });
});

// PATCH - Mise à jour partielle (statut, mise en avant)
export const PATCH = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) throw new UnauthorizedError();

  const { id } = await params;
  const articleId = parseInt(id);
  const body = await request.json();

  const patchSchema = z.object({
    statut: z.string().optional().transform(v => v ? sanitizeString(v) : v),
    isMisEnAvant: z.boolean().optional(),
  });

  const validation = patchSchema.safeParse(body);
  if (!validation.success) {
    throw new ValidationError('Données invalides', { 
      fieldErrors: validation.error.flatten().fieldErrors 
    });
  }
  
  const data = validation.data;

  const article = await prisma.article.update({
    where: { id: articleId },
    data: {
      ...(data.statut !== undefined && { statut: data.statut as any }),
      ...(data.statut !== undefined && { isPublie: data.statut === 'PUBLIE' }),
      ...(data.isMisEnAvant !== undefined && { isMisEnAvant: data.isMisEnAvant }),
    },
  });

  return NextResponse.json({ success: true, data: article });
});