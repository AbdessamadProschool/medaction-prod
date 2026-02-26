import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/stats/evenements - Statistiques détaillées des événements
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const periode = searchParams.get('periode') || '30'; // jours
    const communeId = searchParams.get('communeId');
    const secteur = searchParams.get('secteur');

    const dateDebut = new Date();
    dateDebut.setDate(dateDebut.getDate() - parseInt(periode));

    // Filtres
    const where: any = {};
    if (communeId) where.communeId = parseInt(communeId);
    if (secteur) where.secteur = secteur;

    // Requêtes parallèles optimisées
    const [
      // Par statut
      parStatut,

      // Par type/catégorie
      parCategorie,

      // Par secteur
      parSecteur,

      // Par commune
      parCommune,

      // Événements récents
      evenementsRecents,

      // Événements à venir
      evenementsAVenir,

      // Stats participation
      participationStats,

      // Évolution sur la période
      evolution,
    ] = await Promise.all([
      // Par statut
      prisma.evenement.groupBy({
        by: ['statut'],
        where,
        _count: { id: true },
      }),

      // Par catégorie
      prisma.evenement.groupBy({
        by: ['typeCategorique'],
        where,
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
      }),

      // Par secteur
      prisma.evenement.groupBy({
        by: ['secteur'],
        where,
        _count: { id: true },
        _sum: { nombreInscrits: true },
      }),

      // Par commune
      prisma.evenement.groupBy({
        by: ['communeId'],
        where,
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      }),

      // 5 événements récemment créés
      prisma.evenement.findMany({
        where,
        select: {
          id: true,
          titre: true,
          secteur: true,
          dateDebut: true,
          statut: true,
          nombreInscrits: true,
          nombreVues: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),

      // Événements à venir
      prisma.evenement.findMany({
        where: {
          ...where,
          dateDebut: { gte: new Date() },
          statut: 'PUBLIEE',
        },
        select: {
          id: true,
          titre: true,
          secteur: true,
          dateDebut: true,
          nombreInscrits: true,
          capaciteMax: true,
        },
        orderBy: { dateDebut: 'asc' },
        take: 5,
      }),

      // Stats globales participation
      prisma.evenement.aggregate({
        where,
        _sum: { nombreInscrits: true, nombreVues: true },
        _avg: { nombreInscrits: true },
        _max: { nombreInscrits: true },
      }),

      // Événements créés sur la période
      prisma.evenement.findMany({
        where: { ...where, createdAt: { gte: dateDebut } },
        select: { createdAt: true, statut: true, nombreInscrits: true },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    // Enrichir communes
    const communeIds = parCommune.map(c => c.communeId);
    const communesData = await prisma.commune.findMany({
      where: { id: { in: communeIds } },
      select: { id: true, nom: true },
    });
    const communeMap = new Map(communesData.map(c => [c.id, c.nom]));

    // Grouper par jour pour le graphique
    const evolutionParJour: Record<string, { total: number; inscrits: number }> = {};
    evolution.forEach(e => {
      const jour = e.createdAt.toISOString().split('T')[0];
      if (!evolutionParJour[jour]) {
        evolutionParJour[jour] = { total: 0, inscrits: 0 };
      }
      evolutionParJour[jour].total++;
      evolutionParJour[jour].inscrits += e.nombreInscrits || 0;
    });

    // Formater les résultats
    const total = parStatut.reduce((acc, s) => acc + s._count.id, 0);

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      periode: `${periode} jours`,

      resume: {
        total,
        enAttente: parStatut.find(s => s.statut === 'EN_ATTENTE_VALIDATION')?._count.id || 0,
        publies: parStatut.find(s => s.statut === 'PUBLIEE')?._count.id || 0,
        enAction: parStatut.find(s => s.statut === 'EN_ACTION')?._count.id || 0,
        clotures: parStatut.find(s => s.statut === 'CLOTUREE')?._count.id || 0,
        aVenir: evenementsAVenir.length,
      },

      participation: {
        totalInscrits: participationStats._sum.nombreInscrits || 0,
        totalVues: participationStats._sum.nombreVues || 0,
        moyenneInscrits: participationStats._avg.nombreInscrits?.toFixed(1) || '0',
        maxInscrits: participationStats._max.nombreInscrits || 0,
      },

      parCategorie: parCategorie.map(c => ({
        categorie: c.typeCategorique,
        count: c._count.id,
        pourcentage: total > 0 ? ((c._count.id / total) * 100).toFixed(1) + '%' : '0%',
      })),

      parSecteur: parSecteur.map(s => ({
        secteur: s.secteur,
        count: s._count.id,
        inscrits: s._sum.nombreInscrits || 0,
      })),

      parCommune: parCommune.map(c => ({
        communeId: c.communeId,
        communeNom: communeMap.get(c.communeId) || 'Inconnu',
        count: c._count.id,
      })),

      evenementsRecents: evenementsRecents.map(e => ({
        id: e.id,
        titre: e.titre,
        secteur: e.secteur,
        dateDebut: e.dateDebut,
        statut: e.statut,
        inscrits: e.nombreInscrits,
        vues: e.nombreVues,
      })),

      evenementsAVenir: evenementsAVenir.map(e => ({
        id: e.id,
        titre: e.titre,
        secteur: e.secteur,
        dateDebut: e.dateDebut,
        inscrits: e.nombreInscrits,
        capacite: e.capaciteMax,
        remplissage: e.capaciteMax 
          ? ((e.nombreInscrits / e.capaciteMax) * 100).toFixed(0) + '%'
          : 'Illimité',
      })),

      evolution: Object.entries(evolutionParJour).map(([jour, data]) => ({
        date: jour,
        total: data.total,
        inscrits: data.inscrits,
      })),
    });

  } catch (error) {
    console.error("Erreur GET /api/stats/evenements:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
