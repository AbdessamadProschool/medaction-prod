import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth/config";

// GET /api/stats/global - Statistiques globales du dashboard
export async function GET(request: NextRequest) {
  try {
    const session = await import("next-auth").then(m => m.getServerSession(authOptions));
    
    // Basic auth check
    if (!session?.user) {
         return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Permission check
    const { checkPermission } = await import("@/lib/permissions");
    const hasPermission = await checkPermission(parseInt(session.user.id), 'stats.view.global');

    if (!hasPermission) {
      return NextResponse.json({ error: "Accès non autorisé aux statistiques globales" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const communeId = searchParams.get('communeId');
    const secteur = searchParams.get('secteur');

    // Filtres communs
    const etabWhere: any = { isPublie: true };
    if (communeId) etabWhere.communeId = parseInt(communeId);
    if (secteur) etabWhere.secteur = secteur;

    // Exécuter toutes les requêtes en parallèle pour optimiser
    const [
      // Comptages principaux
      etablissementsCount,
      reclamationsStats,
      evenementsStats,
      evaluationsStats,
      usersCount,
      
      // Par secteur
      etablissementsBySecteur,
      
      // Par commune
      etablissementsByCommune,
      
      // Récentes activités
      recentReclamations,
      recentEvenements,
    ] = await Promise.all([
      // Total établissements
      prisma.etablissement.count({ where: etabWhere }),

      // Réclamations avec agrégation
      prisma.reclamation.groupBy({
        by: ['statut'],
        _count: { id: true },
      }),

      // Événements avec agrégation
      prisma.evenement.groupBy({
        by: ['statut'],
        _count: { id: true },
      }),

      // Évaluations agrégées
      prisma.evaluation.aggregate({
        _avg: { noteGlobale: true },
        _count: { id: true },
      }),

      // Total utilisateurs actifs
      prisma.user.count({ where: { isActive: true } }),

      // Établissements par secteur
      prisma.etablissement.groupBy({
        by: ['secteur'],
        where: etabWhere,
        _count: { id: true },
        _avg: { noteMoyenne: true },
      }),

      // Top communes
      prisma.etablissement.groupBy({
        by: ['communeId'],
        where: etabWhere,
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      }),

      // Réclamations récentes
      prisma.reclamation.count({
        where: {
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        }
      }),

      // Événements à venir
      prisma.evenement.count({
        where: {
          dateDebut: { gte: new Date() },
          statut: 'PUBLIEE',
        }
      }),
    ]);

    // Enrichir communes avec noms
    const communeIds = etablissementsByCommune.map(e => e.communeId);
    const communesData = await prisma.commune.findMany({
      where: { id: { in: communeIds } },
      select: { id: true, nom: true },
    });
    const communeMap = new Map(communesData.map(c => [c.id, c.nom]));

    // Formater les stats réclamations
    const reclamationsFormatted = {
      total: reclamationsStats.reduce((acc, s) => acc + s._count.id, 0),
      enAttente: reclamationsStats.find(s => s.statut === null)?._count.id || 0,
      acceptees: reclamationsStats.find(s => s.statut === 'ACCEPTEE')?._count.id || 0,
      rejetees: reclamationsStats.find(s => s.statut === 'REJETEE')?._count.id || 0,
      recentes: recentReclamations,
    };

    // Formater les stats événements
    const evenementsFormatted = {
      total: evenementsStats.reduce((acc, s) => acc + s._count.id, 0),
      enAttente: evenementsStats.find(s => s.statut === 'EN_ATTENTE_VALIDATION')?._count.id || 0,
      publies: evenementsStats.find(s => s.statut === 'PUBLIEE')?._count.id || 0,
      enAction: evenementsStats.find(s => s.statut === 'EN_ACTION')?._count.id || 0,
      clotures: evenementsStats.find(s => s.statut === 'CLOTUREE')?._count.id || 0,
      aVenir: recentEvenements,
    };

    // Formater par secteur
    const parSecteur = etablissementsBySecteur.map(s => ({
      secteur: s.secteur,
      count: s._count.id,
      noteMoyenne: s._avg.noteMoyenne?.toFixed(2) || '0.00',
    }));

    // Formater par commune
    const parCommune = etablissementsByCommune.map(c => ({
      communeId: c.communeId,
      communeNom: communeMap.get(c.communeId) || 'Inconnu',
      count: c._count.id,
    }));

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      global: {
        etablissements: etablissementsCount,
        utilisateurs: usersCount,
        evaluations: evaluationsStats._count.id,
        noteMoyenneGlobale: evaluationsStats._avg.noteGlobale?.toFixed(2) || '0.00',
      },
      reclamations: reclamationsFormatted,
      evenements: evenementsFormatted,
      parSecteur,
      parCommune,
    });

  } catch (error) {
    console.error("Erreur GET /api/stats/global:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
