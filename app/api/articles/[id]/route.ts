import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withErrorHandler } from '@/lib/api-handler';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { UnauthorizedError, ForbiddenError } from '@/lib/exceptions';

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

  const article = await prisma.article.update({
    where: { id: articleId },
    data: {
      titre: body.titre,
      description: body.description,
      contenu: body.contenu,
      categorie: body.categorie,
      tags: body.tags,
      statut: body.isPublie ? 'PUBLIE' : 'BROUILLON',
      isPublie: body.isPublie,
      isMisEnAvant: body.isMisEnAvant,
      datePublication: body.isPublie ? new Date() : (body.datePublication ? new Date(body.datePublication) : undefined),
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

  const article = await prisma.article.update({
    where: { id: articleId },
    data: {
      statut: body.statut,
      isPublie: body.statut === 'PUBLIE',
      isMisEnAvant: body.isMisEnAvant,
    },
  });

  return NextResponse.json({ success: true, data: article });
});