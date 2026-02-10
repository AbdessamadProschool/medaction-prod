import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET - Détail d'un article
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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

    // Incrémenter les vues
    await prisma.article.update({
      where: { id: articleId },
      data: { nombreVues: { increment: 1 } },
    });

    // Récupérer les articles connexes
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
        vues: (article.nombreVues || 0) + 1,
        resume: article.description,
        imageCouverture: article.imagePrincipale,
      },
      articlesConnexes: articlesConnexes.map(a => ({
        ...a,
        resume: a.description,
        imageCouverture: a.imagePrincipale,
      })),
    });

  } catch (error) {
    console.error('Erreur article:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
