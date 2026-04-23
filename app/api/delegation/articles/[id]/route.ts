import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';

async function getArticleWithOwnershipCheck(articleId: number, session: any) {
  const article = await prisma.article.findUnique({
    where: { id: articleId },
    include: {
      createdByUser: { select: { id: true, nom: true, prenom: true } },
    }
  });

  if (!article) {
    return { article: null, error: NextResponse.json({ error: 'Article non trouvé' }, { status: 404 }) };
  }

  const isOwner = Number(article.createdBy) === Number(session.user.id);
  const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(session.user.role || '');

  if (!isOwner && !isAdmin) {
    return { article: null, error: NextResponse.json({ error: 'Accès refusé' }, { status: 403 }) };
  }

  return { article, error: null };
}

// GET - Récupérer un article par ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const articleId = parseInt(id);
    if (isNaN(articleId)) {
      return NextResponse.json({ error: 'ID invalide' }, { status: 400 });
    }

    const { article, error } = await getArticleWithOwnershipCheck(articleId, session);
    if (error) return error;

    return NextResponse.json({ success: true, data: article });
  } catch (error) {
    console.error('Erreur GET article:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// PATCH - Modifier un article
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    if (!['DELEGATION', 'ADMIN', 'SUPER_ADMIN'].includes(session.user.role || '')) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
    }

    const articleId = parseInt(id);
    if (isNaN(articleId)) {
      return NextResponse.json({ error: 'ID invalide' }, { status: 400 });
    }

    const { error } = await getArticleWithOwnershipCheck(articleId, session);
    if (error) return error;

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

    return NextResponse.json({ success: true, data: article });
  } catch (error) {
    console.error('Erreur PATCH article:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE - Supprimer un article
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    if (!['DELEGATION', 'ADMIN', 'SUPER_ADMIN'].includes(session.user.role || '')) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
    }

    const articleId = parseInt(id);
    if (isNaN(articleId)) {
      return NextResponse.json({ error: 'ID invalide' }, { status: 400 });
    }

    const { error } = await getArticleWithOwnershipCheck(articleId, session);
    if (error) return error;

    await prisma.article.delete({
      where: { id: articleId }
    });

    return NextResponse.json({ success: true, message: 'Article supprimé' });
  } catch (error) {
    console.error('Erreur DELETE article:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}