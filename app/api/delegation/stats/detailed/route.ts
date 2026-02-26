import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';

// GET - Statistiques détaillées pour la délégation
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

    // Statistiques événements
    const [
      evenementsTotal,
      evenementsPublies,
      evenementsBrouillons,
      evenementsTermines,
    ] = await Promise.all([
      prisma.evenement.count({ where: { createdBy: userId } }),
      prisma.evenement.count({ where: { createdBy: userId, statut: 'PUBLIEE' } }),
      prisma.evenement.count({ where: { createdBy: userId, statut: 'EN_ATTENTE_VALIDATION' } }),
      prisma.evenement.count({ where: { createdBy: userId, statut: 'CLOTUREE' } }),
    ]);

    const evenementsVues = await prisma.evenement.aggregate({
      where: { createdBy: userId },
      _sum: { nombreVues: true },
    });

    const evenementsInscrits = await prisma.evenement.aggregate({
      where: { createdBy: userId },
      _sum: { nombreInscrits: true },
    });

    // Statistiques actualités
    const [actualitesTotal, actualitesPubliees, actualitesBrouillons] = await Promise.all([
      prisma.actualite.count({ where: { createdBy: userId } }),
      prisma.actualite.count({ where: { createdBy: userId, isPublie: true } }),
      prisma.actualite.count({ where: { createdBy: userId, isPublie: false } }),
    ]);

    const actualitesVues = await prisma.actualite.aggregate({
      where: { createdBy: userId },
      _sum: { nombreVues: true },
    });

    // Statistiques articles
    const [articlesTotal, articlesPublies, articlesBrouillons] = await Promise.all([
      prisma.article.count({ where: { createdBy: userId } }),
      prisma.article.count({ where: { createdBy: userId, isPublie: true } }),
      prisma.article.count({ where: { createdBy: userId, isPublie: false } }),
    ]);

    const articlesVues = await prisma.article.aggregate({
      where: { createdBy: userId },
      _sum: { nombreVues: true },
    });

    // Statistiques campagnes
    const [campagnesTotal, campagnesActives, campagnesInactives] = await Promise.all([
      prisma.campagne.count({ where: { createdBy: userId } }),
      prisma.campagne.count({ where: { createdBy: userId, isActive: true } }),
      prisma.campagne.count({ where: { createdBy: userId, isActive: false } }),
    ]);

    // Count participations
    let campagnesParticipations = 0;
    try {
      campagnesParticipations = await prisma.participationCampagne.count({
        where: { campagne: { createdBy: userId } },
      });
    } catch (e) {
      console.log('ParticipationCampagne count error');
    }

    const campagnesObjectifs = await prisma.campagne.aggregate({
      where: { createdBy: userId },
      _sum: { objectifParticipations: true },
    });

    return NextResponse.json({
      success: true,
      data: {
        evenements: {
          total: evenementsTotal,
          publies: evenementsPublies,
          brouillons: evenementsBrouillons,
          termines: evenementsTermines,
          vues: evenementsVues._sum?.nombreVues || 0,
          inscrits: evenementsInscrits._sum?.nombreInscrits || 0,
        },
        actualites: {
          total: actualitesTotal,
          publiees: actualitesPubliees,
          brouillons: actualitesBrouillons,
          vues: actualitesVues._sum?.nombreVues || 0,
        },
        articles: {
          total: articlesTotal,
          publies: articlesPublies,
          brouillons: articlesBrouillons,
          vues: articlesVues._sum?.nombreVues || 0,
        },
        campagnes: {
          total: campagnesTotal,
          actives: campagnesActives,
          inactives: campagnesInactives,
          participations: campagnesParticipations,
          objectifTotal: campagnesObjectifs._sum?.objectifParticipations || 0,
        },
      },
    });

  } catch (error) {
    console.error('Erreur stats détaillées:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
