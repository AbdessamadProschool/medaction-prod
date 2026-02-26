import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/stats/reclamations - Statistiques détaillées des réclamations
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
    if (secteur) where.secteurAffecte = secteur;

    // Requêtes parallèles optimisées
    const [
      // Totaux par statut
      parStatut,
      
      // Par catégorie
      parCategorie,
      
      // Par affectation
      parAffectation,
      
      // Par commune
      parCommune,
      
      // Évolution sur la période
      parJour,
      
      // Temps moyen de résolution
      resolues,
      
      // Top établissements concernés
      topEtablissements,
    ] = await Promise.all([
      // Par statut
      prisma.reclamation.groupBy({
        by: ['statut'],
        where,
        _count: { id: true },
      }),

      // Par catégorie
      prisma.reclamation.groupBy({
        by: ['categorie'],
        where,
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      }),

      // Par affectation
      prisma.reclamation.groupBy({
        by: ['affectationReclamation'],
        where,
        _count: { id: true },
      }),

      // Par commune
      prisma.reclamation.groupBy({
        by: ['communeId'],
        where,
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      }),

      // Réclamations créées sur la période (par jour)
      prisma.reclamation.findMany({
        where: { ...where, createdAt: { gte: dateDebut } },
        select: { createdAt: true, statut: true },
        orderBy: { createdAt: 'asc' },
      }),

      // Réclamations résolues (pour calcul temps moyen)
      prisma.reclamation.findMany({
        where: {
          ...where,
          dateResolution: { not: null },
        },
        select: { createdAt: true, dateResolution: true },
        take: 100,
        orderBy: { dateResolution: 'desc' },
      }),

      // Top établissements avec réclamations
      prisma.reclamation.groupBy({
        by: ['etablissementId'],
        where: { ...where, etablissementId: { not: null } },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 5,
      }),
    ]);

    // Enrichir communes
    const communeIds = parCommune.map(c => c.communeId);
    const communesData = await prisma.commune.findMany({
      where: { id: { in: communeIds } },
      select: { id: true, nom: true },
    });
    const communeMap = new Map(communesData.map(c => [c.id, c.nom]));

    // Enrichir établissements
    const etabIds = topEtablissements
      .filter(e => e.etablissementId)
      .map(e => e.etablissementId as number);
    const etabsData = await prisma.etablissement.findMany({
      where: { id: { in: etabIds } },
      select: { id: true, nom: true, secteur: true },
    });
    const etabMap = new Map(etabsData.map(e => [e.id, e]));

    // Calcul temps moyen résolution (en jours)
    let tempsMoyenResolution = null;
    if (resolues.length > 0) {
      const totalJours = resolues.reduce((acc, r) => {
        if (r.dateResolution) {
          const diff = r.dateResolution.getTime() - r.createdAt.getTime();
          return acc + diff / (1000 * 60 * 60 * 24);
        }
        return acc;
      }, 0);
      tempsMoyenResolution = (totalJours / resolues.length).toFixed(1);
    }

    // Grouper par jour pour le graphique
    const evolutionParJour: Record<string, { total: number; resolues: number }> = {};
    parJour.forEach(r => {
      const jour = r.createdAt.toISOString().split('T')[0];
      if (!evolutionParJour[jour]) {
        evolutionParJour[jour] = { total: 0, resolues: 0 };
      }
      evolutionParJour[jour].total++;
      if (r.statut === 'ACCEPTEE') {
        evolutionParJour[jour].resolues++;
      }
    });

    // Formater les résultats
    const total = parStatut.reduce((acc, s) => acc + s._count.id, 0);

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      periode: `${periode} jours`,
      
      resume: {
        total,
        enAttente: parStatut.find(s => s.statut === null)?._count.id || 0,
        acceptees: parStatut.find(s => s.statut === 'ACCEPTEE')?._count.id || 0,
        rejetees: parStatut.find(s => s.statut === 'REJETEE')?._count.id || 0,
        tauxResolution: total > 0 
          ? ((parStatut.find(s => s.statut === 'ACCEPTEE')?._count.id || 0) / total * 100).toFixed(1) + '%'
          : '0%',
        tempsMoyenResolution: tempsMoyenResolution ? `${tempsMoyenResolution} jours` : 'N/A',
      },

      parAffectation: {
        nonAffectees: parAffectation.find(a => a.affectationReclamation === 'NON_AFFECTEE')?._count.id || 0,
        affectees: parAffectation.find(a => a.affectationReclamation === 'AFFECTEE')?._count.id || 0,
      },

      parCategorie: parCategorie.map(c => ({
        categorie: c.categorie,
        count: c._count.id,
        pourcentage: ((c._count.id / total) * 100).toFixed(1) + '%',
      })),

      parCommune: parCommune.map(c => ({
        communeId: c.communeId,
        communeNom: communeMap.get(c.communeId) || 'Inconnu',
        count: c._count.id,
      })),

      topEtablissements: topEtablissements.map(e => {
        const etab = e.etablissementId ? etabMap.get(e.etablissementId) : null;
        return {
          etablissementId: e.etablissementId,
          etablissementNom: etab?.nom || 'Inconnu',
          secteur: etab?.secteur,
          count: e._count.id,
        };
      }),

      evolution: Object.entries(evolutionParJour).map(([jour, data]) => ({
        date: jour,
        total: data.total,
        resolues: data.resolues,
      })),
    });

  } catch (error) {
    console.error("Erreur GET /api/stats/reclamations:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
