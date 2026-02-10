import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';

// GET - Récupérer un article par ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const articleId = parseInt(params.id);
    if (isNaN(articleId)) {
      return NextResponse.json({ error: 'ID invalide' }, { status: 400 });
    }

    const article = await prisma.article.findUnique({
      where: { id: articleId },
      include: {
        createdByUser: { select: { id: true, nom: true, prenom: true } },
      }
    });

    if (!article) {
      return NextResponse.json({ error: 'Article non trouvé' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: article });
  } catch (error) {
    console.error('Erreur GET article:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// PATCH - Modifier un article
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    if (!['DELEGATION', 'ADMIN', 'SUPER_ADMIN'].includes(session.user.role || '')) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
    }

    const articleId = parseInt(params.id);
    if (isNaN(articleId)) {
      return NextResponse.json({ error: 'ID invalide' }, { status: 400 });
    }

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
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    if (!['DELEGATION', 'ADMIN', 'SUPER_ADMIN'].includes(session.user.role || '')) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
    }

    const articleId = parseInt(params.id);
    if (isNaN(articleId)) {
      return NextResponse.json({ error: 'ID invalide' }, { status: 400 });
    }

    await prisma.article.delete({
      where: { id: articleId }
    });

    return NextResponse.json({ success: true, message: 'Article supprimé' });
  } catch (error) {
    console.error('Erreur DELETE article:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
