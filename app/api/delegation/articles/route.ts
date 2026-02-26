import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';

// GET - Liste des articles de la délégation
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    if (session.user.role !== 'DELEGATION') {
      return NextResponse.json({ error: 'Accès réservé aux délégations' }, { status: 403 });
    }

    const userId = parseInt(session.user.id);
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const search = searchParams.get('search') || '';
    const statut = searchParams.get('statut') || '';

    const where: Record<string, unknown> = {
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

    return NextResponse.json({
      success: true,
      data: articles,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });

  } catch (error) {
    console.error('Erreur articles:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST - Créer un article
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    if (session.user.role !== 'DELEGATION') {
      return NextResponse.json({ error: 'Accès réservé aux délégations' }, { status: 403 });
    }

    const userId = parseInt(session.user.id);
    const body = await request.json();

    const article = await prisma.article.create({
      data: {
        titre: body.titre,
        contenu: body.contenu || '',
        description: body.resume || body.description,
        categorie: body.categorie,
        tags: body.tags || [],
        imagePrincipale: body.imagePrincipale,
        isPublie: false, // Force false for validation
        datePublication: undefined,
        createdBy: userId,
      },
    });

    // Create media record if image provided
    if (body.imagePrincipale) {
      await prisma.media.create({
        data: {
          nomFichier: 'Image Article',
          cheminFichier: body.imagePrincipale,
          urlPublique: body.imagePrincipale,
          type: 'IMAGE',
          mimeType: 'image/jpeg',
          articleId: article.id,
          uploadePar: userId
        }
      });
    }

    // === NOTIFICATION AUX ADMINS ===
    try {
      const admins = await prisma.user.findMany({
        where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] } },
        select: { id: true }
      });
      
      if (admins.length > 0) {
        await prisma.notification.createMany({
          data: admins.map(admin => ({
            userId: admin.id,
            type: 'ARTICLE_CREATION',
            titre: 'Nouvel article créé',
            message: `L'article "${body.titre}" a été créé par la délégation et est en attente de validation.`,
            lien: `/admin/articles`,
            isLue: false,
            createdAt: new Date()
          }))
        });
      }
    } catch (notifError) {
      console.error('Erreur notification:', notifError);
    }

    return NextResponse.json({
      success: true,
      data: article,
    });

  } catch (error) {
    console.error('Erreur création article:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
