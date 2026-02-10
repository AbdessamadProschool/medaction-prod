import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(req.url);
    const locale = searchParams.get('locale') || 'fr';
    const isAr = locale === 'ar';
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    if (session.user.role !== 'GOUVERNEUR' && session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const now = new Date();
    const debutMois = new Date(now.getFullYear(), now.getMonth(), 1);
    const finMois = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const debutSemaine = new Date();
    debutSemaine.setDate(debutSemaine.getDate() - 7);

    // --- 1. STATS GLOBALES (EXISTANTS) ---
    const communesCount = await prisma.commune.count();
    const etablissementsTotal = await prisma.etablissement.count();

    const etablissementsParSecteur = await prisma.etablissement.groupBy({
      by: ['secteur'],
      _count: { id: true }
    });
    const parSecteur: Record<string, number> = {};
    etablissementsParSecteur.forEach(e => { parSecteur[e.secteur] = e._count.id; });

    // Reclamations Stats
    const reclamationsTotal = await prisma.reclamation.count();
    const reclamationsEnAttente = await prisma.reclamation.count({ where: { statut: null } });
    const reclamationsEnCours = await prisma.reclamation.count({ where: { statut: 'ACCEPTEE', dateResolution: null } });
    const reclamationsResolues = await prisma.reclamation.count({ where: { dateResolution: { not: null } } });
    const reclamationsRejetees = await prisma.reclamation.count({ where: { statut: 'REJETEE' } });
    const tauxResolution = reclamationsTotal > 0 ? Math.round((reclamationsResolues / reclamationsTotal) * 100) : 0;
    const reclamationsNouvelles = await prisma.reclamation.count({ where: { createdAt: { gte: debutSemaine } } });

    // Events Stats
    const evenementsTotal = await prisma.evenement.count();
    const evenementsAVenir = await prisma.evenement.count({ where: { dateDebut: { gt: now } } });
    const evenementsEnCours = await prisma.evenement.count({ 
      where: { dateDebut: { lte: now }, OR: [{ dateFin: null }, { dateFin: { gte: now } }] } 
    });
    const evenementsCeMois = await prisma.evenement.count({ where: { dateDebut: { gte: debutMois, lte: finMois } } });
    
    // Projets Actifs (Proxy: Campagnes Actives + Événements En Cours)
    const activeProjects = await prisma.campagne.count({ where: { isActive: true } });
    const projectsCount = activeProjects + evenementsEnCours;

    // --- 1B. DONNÉES ADDITIONNELLES POUR KPIs RÉELS ---
    
    // Note moyenne globale de tous les établissements
    const avgRatingResult = await prisma.etablissement.aggregate({
      _avg: { noteMoyenne: true }
    });
    const averageSatisfaction = avgRatingResult._avg.noteMoyenne || 0;
    
    // Statistiques citoyens
    const citoyensTotal = await prisma.user.count({ where: { role: 'CITOYEN' } });
    const citoyensActifsCeMois = await prisma.user.count({ 
      where: { role: 'CITOYEN', derniereConnexion: { gte: debutMois } } 
    });
    const citoyensNouveaux = await prisma.user.count({ 
      where: { role: 'CITOYEN', createdAt: { gte: debutSemaine } } 
    });
    
    // Participations totales (abonnements + participations campagnes)
    const abonnementsTotal = await prisma.abonnementEtablissement.count();
    const participationsCampagnes = await prisma.participationCampagne.count();
    const totalEngagement = abonnementsTotal + participationsCampagnes;
    
    // Performance par secteur (basée sur événements, évaluations, réclamations)
    const secteurPerformance = await Promise.all(
      ['EDUCATION', 'SANTE', 'SPORT', 'SOCIAL', 'CULTUREL'].map(async (secteur) => {
        const etabsInSecteur = await prisma.etablissement.count({ where: { secteur: secteur as any } });
        const eventsInSecteur = await prisma.evenement.count({ where: { secteur: secteur as any, statut: 'PUBLIEE' } });
        const reclamationsInSecteur = await prisma.reclamation.count({
          where: { etablissement: { secteur: secteur as any } }
        });
        const avgNoteInSecteur = await prisma.etablissement.aggregate({
          where: { secteur: secteur as any },
          _avg: { noteMoyenne: true }
        });
        
        // Score composite: (events * 10) + (note * 15) - (reclamations * 2) 
        const score = Math.min(100, Math.max(0,
          (eventsInSecteur * 10) + 
          ((avgNoteInSecteur._avg.noteMoyenne || 0) * 15) - 
          (reclamationsInSecteur * 2) +
          50 // Base score
        ));
        
        return {
          secteur,
          etablissements: etabsInSecteur,
          evenements: eventsInSecteur,
          reclamations: reclamationsInSecteur,
          noteMoyenne: avgNoteInSecteur._avg.noteMoyenne || 0,
          score: Math.round(score)
        };
      })
    );
    
    // Trier par score et ajouter le rang
    const sectorRankings = secteurPerformance
      .sort((a, b) => b.score - a.score)
      .map((s, idx) => ({ ...s, rank: idx + 1 }));

    // --- 2. DATA POUR GRAPHIQUES (NEW) ---
    
    // A. Tendance des Audits (6 derniers mois)
    // On compare les réclamations créées vs résolues par mois
    const monthNames = isAr 
       ? ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']
       : ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
    
    const auditTrends = [];
    
    for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const start = new Date(d.getFullYear(), d.getMonth(), 1);
        const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
        
        const created = await prisma.reclamation.count({
            where: { createdAt: { gte: start, lte: end } }
        });
        const resolved = await prisma.reclamation.count({
            where: { dateResolution: { gte: start, lte: end } }
        });

        auditTrends.push({
            name: monthNames[d.getMonth()],
            audits: created,      // "Audits" as active issues identified
            conformite: resolved, // "Conformité" as issues fixed
        });
    }

    // B. Conformité Globale (État Infrastructure)
    const infraStats = await prisma.etablissement.groupBy({
        by: ['etatInfrastructure'],
        _count: { id: true }
    });
    
    // Map Prisma enum to chart categories
    let infraConforme = 0; // EXCELLENT, BON
    let infraAction = 0;   // MOYEN, A_RENOVER
    let infraCritique = 0; // DEGRADE, DANGEREUX, null

    infraStats.forEach(stat => {
        const c = stat._count.id;
        switch (stat.etatInfrastructure) {
            case 'EXCELLENT':
            case 'BON':
                infraConforme += c;
                break;
            case 'MOYEN':
            case 'A_RENOVER':
                infraAction += c;
                break;
            case 'DEGRADE':
            case 'DANGEREUX':
            default:
                infraCritique += c;
                break;
        }
    });

    const complianceData = [
        { name: isAr ? 'مطابق' : 'Conforme', code: 'CONFORME', value: infraConforme, color: '#10b981' },
        { name: isAr ? 'قيد الإنجاز' : 'En cours', code: 'EN_COURS', value: infraAction, color: '#f59e0b' },
        { name: isAr ? 'غير مطابق' : 'Non Conforme', code: 'NON_CONFORME', value: infraCritique, color: '#ef4444' },
    ];

    // --- 3. ALERTES & FLASH INFO (NEW) ---
    // Top 5 urgencies: Reclamations NON_AFFECTEE or Upcoming Events without details
    const recentAlertsRaw = await prisma.reclamation.findMany({
        where: { statut: 'ACCEPTEE', affectationReclamation: 'NON_AFFECTEE' },
        orderBy: { createdAt: 'desc' },
        take: 3,
        select: { id: true, titre: true, createdAt: true, categorie: true }
    });

    const upcomingEventsRaw = await prisma.evenement.findMany({
        where: { dateDebut: { gte: now }, statut: 'PUBLIEE' },
        orderBy: { dateDebut: 'asc' },
        take: 2,
        select: { id: true, titre: true, dateDebut: true, typeCategorique: true }
    });

    const alerts = [
        ...recentAlertsRaw.map(r => ({
            id: `rec-${r.id}`,
            type: 'RECLAMATION',
            label: isAr ? 'شكاية عاجلة' : 'Réclamation Urgente',
            message: r.titre,
            date: r.createdAt,
            level: 'critical'
        })),
        ...upcomingEventsRaw.map(e => ({
            id: `evt-${e.id}`,
            type: 'EVENT',
            label: isAr ? 'حدث قريب' : 'Événement Proche',
            message: `${e.titre} (${e.typeCategorique})`,
            date: e.dateDebut,
            level: 'warning'
        }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // --- 4. RECENT ACTIVITY LOG (NEW: Mixed Timeline) ---
    const recentReclamations = await prisma.reclamation.findMany({
        orderBy: { createdAt: 'desc' },
        take: 3,
        select: { id: true, titre: true, createdAt: true, statut: true, categorie: true }
    });
    
    const recentEvaluations = await prisma.evaluation.findMany({
        orderBy: { createdAt: 'desc' },
        take: 3,
        include: { etablissement: { select: { nom: true } } }
    });

    const recentEvents = await prisma.evenement.findMany({
        where: { statut: 'PUBLIEE' },
        orderBy: { createdAt: 'desc' },
        take: 3,
        select: { id: true, titre: true, createdAt: true, typeCategorique: true }
    });
    
    const recentActivity = [
        ...recentReclamations.map(r => ({
            id: `rec-${r.id}`,
            entity: 'RECLAMATION',
            title: r.titre,
            subtitle: isAr ? `شكاية (${r.categorie || 'عامة'})` : `Réclamation (${r.categorie || 'Générale'})`,
            date: r.createdAt,
            status: r.statut || 'EN_ATTENTE',
            icon: 'AlertTriangle', // icon name to map on frontend
            color: 'red'
        })),
        ...recentEvaluations.map(e => ({
            id: `eval-${e.id}`,
            entity: 'EVALUATION',
            title: isAr ? `تقييم جديد: ${e.etablissement.nom}` : `Nouvelle évaluation: ${e.etablissement.nom}`,
            subtitle: isAr ? `تقييم ${e.noteGlobale}/5` : `Note ${e.noteGlobale}/5`,
            date: e.createdAt,
            status: 'COMPLETEE',
            icon: 'Star',
            color: 'amber'
        })),
        ...recentEvents.map(evt => ({
            id: `evt-${evt.id}`,
            entity: 'EVENEMENT',
            title: evt.titre,
            subtitle: isAr ? `تم النشر: ${evt.typeCategorique}` : `Publié: ${evt.typeCategorique}`,
            date: evt.createdAt,
            status: 'PUBLIEE',
            icon: 'Calendar',
            color: 'blue'
        }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 6);


    return NextResponse.json({
      communes: { total: communesCount, actives: communesCount },
      reclamations: {
        total: reclamationsTotal,
        enAttente: reclamationsEnAttente,
        enCours: reclamationsEnCours,
        resolues: reclamationsResolues,
        rejetees: reclamationsRejetees,
        tauxResolution,
        urgentes: reclamationsEnAttente + reclamationsEnCours, // Generalized urgency
        nouveauCetteSemaine: reclamationsNouvelles,
      },
      etablissements: {
        total: etablissementsTotal,
        parSecteur,
      },
      evenements: {
        total: evenementsTotal,
        aVenir: evenementsAVenir,
        enCours: evenementsEnCours,
        cetMois: evenementsCeMois,
      },
      projects: {
        active: projectsCount,
      },
      // NEW: Real KPIs for Governor Dashboard
      citoyens: {
        total: citoyensTotal,
        actifsCeMois: citoyensActifsCeMois,
        nouveauxCetteSemaine: citoyensNouveaux,
      },
      satisfaction: {
        moyenne: Number(averageSatisfaction.toFixed(1)),
        engagement: totalEngagement,
      },
      sectorRankings,
      charts: {
        auditTrends,
        compliance: complianceData
      },
      alerts: alerts,
      recentActivity: recentActivity
    });

  } catch (error) {
    console.error('Erreur dashboard gouverneur:', error);
    return NextResponse.json(
      { error: 'Erreur serveur', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}
