import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';

// GET - Statistiques pour la délégation
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

    // Récupérer les statistiques
    const [
      evenementsTotal,
      evenementsPublies,
      evenementsEnAttente,
      evenementsACloturer,
      actualitesTotal,
      actualitesPubliees,
      articlesTotal,
      articlesPublies,
      campagnesTotal,
      campagnesActives,
    ] = await Promise.all([
      // Événements
      prisma.evenement.count({
        where: { createdBy: userId }
      }),
      prisma.evenement.count({
        where: { createdBy: userId, statut: 'PUBLIEE' }
      }),
      prisma.evenement.count({
        where: { createdBy: userId, statut: 'EN_ATTENTE_VALIDATION' }
      }),
      prisma.evenement.count({
        where: { 
          createdBy: userId, 
          statut: { not: 'CLOTUREE' }, 
          dateFin: { lt: new Date() } 
        }
      }),
      
      // Actualités
      prisma.actualite.count({
        where: { createdBy: userId }
      }),
      prisma.actualite.count({
        where: { createdBy: userId, isPublie: true }
      }),
      
      // Articles
      prisma.article.count({
        where: { createdBy: userId }
      }),
      prisma.article.count({
        where: { createdBy: userId, isPublie: true }
      }),
      
      // Campagnes
      prisma.campagne.count({
        where: { createdBy: userId }
      }),
      prisma.campagne.count({
        where: { createdBy: userId, isActive: true }
      }),
    ]);

    // Calculer les vues totales (utiliser nombreVues au lieu de vues)
    const actualitesVues = await prisma.actualite.aggregate({
      where: { createdBy: userId },
      _sum: { nombreVues: true }
    });

    const articlesVues = await prisma.article.aggregate({
      where: { createdBy: userId },
      _sum: { nombreVues: true }
    });

    // Participations aux campagnes
    let campagnesParticipations = 0;
    try {
      const campagneIds = await prisma.campagne.findMany({
        where: { createdBy: userId },
        select: { id: true }
      });
      
      if (campagneIds.length > 0) {
        campagnesParticipations = await prisma.participationCampagne.count({
          where: {
            campagneId: { in: campagneIds.map(c => c.id) }
          }
        });
      }
    } catch (e) {
      // Table might not exist
      console.log('ParticipationCampagne not available');
    }

    return NextResponse.json({
      success: true,
      data: {
        evenements: {
          total: evenementsTotal,
          publies: evenementsPublies,
          enAttente: evenementsEnAttente,
          aCloturer: evenementsACloturer,
        },
        actualites: {
          total: actualitesTotal,
          publiees: actualitesPubliees,
          vues: actualitesVues._sum?.nombreVues || 0,
        },
        articles: {
          total: articlesTotal,
          publies: articlesPublies,
          vues: articlesVues._sum?.nombreVues || 0,
        },
        campagnes: {
          total: campagnesTotal,
          actives: campagnesActives,
          participations: campagnesParticipations,
        },
      }
    });

  } catch (error) {
    console.error('Erreur stats délégation:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

