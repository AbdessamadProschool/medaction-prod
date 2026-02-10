import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/stats/satisfaction - Statistiques de satisfaction et évaluations
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const periode = searchParams.get('periode') || '30'; // jours
    const communeId = searchParams.get('communeId');
    const secteur = searchParams.get('secteur');

    const dateDebut = new Date();
    dateDebut.setDate(dateDebut.getDate() - parseInt(periode));

    // Filtres pour établissements
    const etabWhere: any = { isPublie: true };
    if (communeId) etabWhere.communeId = parseInt(communeId);
    if (secteur) etabWhere.secteur = secteur;

    // Requêtes parallèles optimisées
    const [
      // Stats globales évaluations
      globalStats,

      // Distribution des notes (1-5)
      noteDistribution,

      // Par secteur
      parSecteur,

      // Top établissements les mieux notés
      topEtablissements,

      // Établissements les moins bien notés
      bottomEtablissements,

      // Évaluations récentes
      evaluationsRecentes,

      // Évolution des évaluations sur la période
      evolutionEvaluations,

      // Signalements
      signalements,
    ] = await Promise.all([
      // Agrégation globale
      prisma.evaluation.aggregate({
        where: { isValidee: true },
        _avg: { noteGlobale: true },
        _count: { id: true },
        _min: { noteGlobale: true },
        _max: { noteGlobale: true },
      }),

      // Distribution des notes
      prisma.evaluation.groupBy({
        by: ['noteGlobale'],
        where: { isValidee: true },
        _count: { id: true },
      }),

      // Par secteur des établissements
      prisma.etablissement.groupBy({
        by: ['secteur'],
        where: { ...etabWhere, nombreEvaluations: { gt: 0 } },
        _avg: { noteMoyenne: true },
        _count: { id: true },
        _sum: { nombreEvaluations: true },
      }),

      // Top 10 meilleurs établissements
      prisma.etablissement.findMany({
        where: { ...etabWhere, nombreEvaluations: { gte: 3 } },
        select: {
          id: true,
          nom: true,
          secteur: true,
          noteMoyenne: true,
          nombreEvaluations: true,
          commune: { select: { nom: true } },
        },
        orderBy: { noteMoyenne: 'desc' },
        take: 10,
      }),

      // Bottom 5 établissements
      prisma.etablissement.findMany({
        where: { ...etabWhere, nombreEvaluations: { gte: 3 } },
        select: {
          id: true,
          nom: true,
          secteur: true,
          noteMoyenne: true,
          nombreEvaluations: true,
          commune: { select: { nom: true } },
        },
        orderBy: { noteMoyenne: 'asc' },
        take: 5,
      }),

      // Dernières évaluations
      prisma.evaluation.findMany({
        where: { isValidee: true },
        select: {
          id: true,
          noteGlobale: true,
          commentaire: true,
          createdAt: true,
          user: { select: { prenom: true } },
          etablissement: { select: { id: true, nom: true, secteur: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),

      // Évaluations sur la période
      prisma.evaluation.findMany({
        where: { 
          isValidee: true,
          createdAt: { gte: dateDebut },
        },
        select: { 
          createdAt: true, 
          noteGlobale: true,
        },
        orderBy: { createdAt: 'asc' },
      }),

      // Évaluations signalées
      prisma.evaluation.count({
        where: { isSignalee: true },
      }),
    ]);

    // Formater la distribution des notes (1-5)
    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    noteDistribution.forEach(n => {
      const note = Math.round(n.noteGlobale);
      if (note >= 1 && note <= 5) {
        distribution[note] = n._count.id;
      }
    });

    const totalEvaluations = globalStats._count.id || 1;
    const distributionFormatted = Object.entries(distribution).map(([note, count]) => ({
      note: parseInt(note),
      count,
      pourcentage: ((count / totalEvaluations) * 100).toFixed(1) + '%',
    }));

    // Grouper évolution par jour
    const evolutionParJour: Record<string, { count: number; somme: number }> = {};
    evolutionEvaluations.forEach(e => {
      const jour = e.createdAt.toISOString().split('T')[0];
      if (!evolutionParJour[jour]) {
        evolutionParJour[jour] = { count: 0, somme: 0 };
      }
      evolutionParJour[jour].count++;
      evolutionParJour[jour].somme += e.noteGlobale;
    });

    // Calculer NPS Score approximatif
    const promoteurs = (distribution[5] || 0) + (distribution[4] || 0);
    const detracteurs = (distribution[1] || 0) + (distribution[2] || 0);
    const npsScore = totalEvaluations > 0 
      ? (((promoteurs - detracteurs) / totalEvaluations) * 100).toFixed(0)
      : '0';

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      periode: `${periode} jours`,

      resume: {
        totalEvaluations: globalStats._count.id,
        noteMoyenne: globalStats._avg.noteGlobale?.toFixed(2) || '0.00',
        noteMin: globalStats._min.noteGlobale || 0,
        noteMax: globalStats._max.noteGlobale || 0,
        npsScore,
        signalements,
      },

      distribution: distributionFormatted,

      parSecteur: parSecteur.map(s => ({
        secteur: s.secteur,
        etablissements: s._count.id,
        evaluations: s._sum.nombreEvaluations || 0,
        noteMoyenne: s._avg.noteMoyenne?.toFixed(2) || '0.00',
      })).sort((a, b) => parseFloat(b.noteMoyenne) - parseFloat(a.noteMoyenne)),

      topEtablissements: topEtablissements.map(e => ({
        id: e.id,
        nom: e.nom,
        secteur: e.secteur,
        communeNom: e.commune.nom,
        noteMoyenne: e.noteMoyenne.toFixed(2),
        nombreEvaluations: e.nombreEvaluations,
      })),

      bottomEtablissements: bottomEtablissements.map(e => ({
        id: e.id,
        nom: e.nom,
        secteur: e.secteur,
        communeNom: e.commune.nom,
        noteMoyenne: e.noteMoyenne.toFixed(2),
        nombreEvaluations: e.nombreEvaluations,
      })),

      evaluationsRecentes: evaluationsRecentes.map(e => ({
        id: e.id,
        note: e.noteGlobale,
        commentaire: e.commentaire?.substring(0, 100),
        date: e.createdAt,
        userName: e.user.prenom,
        etablissementId: e.etablissement.id,
        etablissementNom: e.etablissement.nom,
        secteur: e.etablissement.secteur,
      })),

      evolution: Object.entries(evolutionParJour).map(([jour, data]) => ({
        date: jour,
        count: data.count,
        noteMoyenne: (data.somme / data.count).toFixed(2),
      })),

      insights: {
        meilleurSecteur: parSecteur.length > 0 
          ? parSecteur.reduce((a, b) => 
              (a._avg.noteMoyenne || 0) > (b._avg.noteMoyenne || 0) ? a : b
            ).secteur
          : null,
        tendance: evolutionEvaluations.length > 0 
          ? (evolutionEvaluations.slice(-Math.ceil(evolutionEvaluations.length / 2))
              .reduce((a, e) => a + e.noteGlobale, 0) / 
              Math.ceil(evolutionEvaluations.length / 2) >
            evolutionEvaluations.slice(0, Math.ceil(evolutionEvaluations.length / 2))
              .reduce((a, e) => a + e.noteGlobale, 0) / 
              Math.ceil(evolutionEvaluations.length / 2)
            ? 'hausse' : 'baisse')
          : 'stable',
      },
    });

  } catch (error) {
    console.error("Erreur GET /api/stats/satisfaction:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
