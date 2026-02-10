import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const type = searchParams.get('type') || 'all';
    const secteur = searchParams.get('secteur');
    const date = searchParams.get('date');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const skip = (page - 1) * limit;

    // Calculer la date de filtre si fournie
    let dateFilter: any = undefined;
    if (date === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      dateFilter = { gte: today };
    } else if (date === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      dateFilter = { gte: weekAgo };
    } else if (date === 'month') {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      dateFilter = { gte: monthAgo };
    }

    const results: any[] = [];
    let totalCount = 0;

    // 1. Recherche Événements
    if (type === 'all' || type === 'event') {
      const where: Prisma.EvenementWhereInput = {
        // Afficher tous les événements publiés ou en attente
        statut: { in: ['PUBLIEE', 'EN_ACTION', 'CLOTUREE'] },
        ...(query && {
          OR: [
            { titre: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ],
        }),
        ...(secteur && { secteur: secteur as any }),
        ...(dateFilter && { dateDebut: dateFilter }),
      };

      const events = await prisma.evenement.findMany({
        where,
        take: type === 'all' ? 10 : limit,
        skip: type === 'all' ? 0 : skip,
        orderBy: { dateDebut: 'desc' },
        include: { 
          etablissement: { select: { nom: true } },
          medias: { take: 1, select: { urlPublique: true } }
        }
      });

      const count = await prisma.evenement.count({ where });
      if (type === 'event') totalCount = count;

      results.push(...events.map(e => ({
        id: e.id,
        type: 'event',
        title: e.titre,
        description: e.description?.substring(0, 200) || '',
        date: e.dateDebut,
        location: e.lieu || e.etablissement?.nom || 'Province',
        image: e.medias?.[0]?.urlPublique || null,
        category: e.categorie,
        secteur: e.secteur,
        slug: `/evenements/${e.id}`
      })));
    }

    // 2. Recherche Actualités (Établissements)
    if (type === 'all' || type === 'news') {
      const where: Prisma.ActualiteWhereInput = {
        // Afficher les actualités publiées
        OR: [
          { statut: 'PUBLIEE' },
          { isPublie: true }
        ],
        ...(query && {
          AND: {
            OR: [
              { titre: { contains: query, mode: 'insensitive' } },
              { contenu: { contains: query, mode: 'insensitive' } },
            ],
          }
        }),
        ...(dateFilter && { datePublication: dateFilter }),
      };

      const news = await prisma.actualite.findMany({
        where,
        take: type === 'all' ? 10 : limit,
        skip: type === 'all' ? 0 : skip,
        orderBy: { createdAt: 'desc' },
        include: { 
          etablissement: { select: { nom: true, secteur: true } },
          medias: { take: 1, select: { urlPublique: true } }
        }
      });

      const count = await prisma.actualite.count({ where });
      if (type === 'news') totalCount = count;

      results.push(...news.map(n => ({
        id: n.id,
        type: 'news',
        title: n.titre,
        description: n.description || n.contenu?.substring(0, 200) || '',
        date: n.datePublication || n.createdAt,
        location: n.etablissement?.nom || 'Établissement',
        image: n.medias?.[0]?.urlPublique || null,
        category: n.categorie,
        secteur: n.etablissement?.secteur,
        slug: `/actualites/${n.id}`
      })));
    }

    // 3. Recherche Articles (Généraux)
    if (type === 'all' || type === 'article') {
      const where: Prisma.ArticleWhereInput = {
        isPublie: true,
        ...(query && {
          OR: [
            { titre: { contains: query, mode: 'insensitive' } },
            { contenu: { contains: query, mode: 'insensitive' } },
          ],
        }),
        ...(dateFilter && { datePublication: dateFilter }),
      };

      const articles = await prisma.article.findMany({
        where,
        take: type === 'all' ? 10 : limit,
        skip: type === 'all' ? 0 : skip,
        orderBy: { createdAt: 'desc' },
      });

      const count = await prisma.article.count({ where });
      if (type === 'article') totalCount = count;

      results.push(...articles.map(a => ({
        id: a.id,
        type: 'article',
        title: a.titre,
        description: a.description || a.contenu?.substring(0, 200) || '',
        date: a.datePublication || a.createdAt,
        location: 'Médiouna Action',
        image: a.imagePrincipale,
        category: a.categorie,
        secteur: null,
        slug: `/articles/${a.id}`
      })));
    }

    // 4. Recherche Campagnes
    if (type === 'all' || type === 'campaign') {
      const where: Prisma.CampagneWhereInput = {
        isActive: true,
        ...(query && {
          OR: [
            { titre: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ],
        }),
      };

      const campaigns = await prisma.campagne.findMany({
        where,
        take: type === 'all' ? 10 : limit,
        skip: type === 'all' ? 0 : skip,
        orderBy: { createdAt: 'desc' },
      });

      const count = await prisma.campagne.count({ where });
      if (type === 'campaign') totalCount = count;

      results.push(...campaigns.map(c => ({
        id: c.id,
        type: 'campaign',
        title: c.titre,
        description: c.description?.substring(0, 200) || '',
        date: c.createdAt,
        location: 'Province de Médiouna',
        image: c.imagePrincipale,
        category: c.type,
        secteur: null,
        slug: `/campagnes/${c.slug}`
      })));
    }

    // Si type 'all', on trie le mélange par date décroissante
    if (type === 'all') {
      results.sort((a, b) => {
        const dateA = new Date(a.date || 0).getTime();
        const dateB = new Date(b.date || 0).getTime();
        return dateB - dateA;
      });
      totalCount = results.length;
    }

    return NextResponse.json({
      data: results,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit) || 1
      }
    });

  } catch (error) {
    console.error('Explorer API Error:', error);
    return NextResponse.json({ 
      error: 'Internal Server Error',
      data: [],
      pagination: { page: 1, limit: 12, total: 0, totalPages: 1 }
    }, { status: 500 });
  }
}
