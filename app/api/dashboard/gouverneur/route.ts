import { withErrorHandler, successResponse } from '@/lib/api-handler';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import prisma from "@/lib/db";

export const GET = withErrorHandler(async (req: NextRequest) => {
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

    // --- 1. STATS GLOBALES ---
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
    
    // Activités et Événements en cours
    const activeProjects = await prisma.campagne.count({ where: { isActive: true } });
    const activeProgrammes = await prisma.programmeActivite.count({ 
      where: { statut: { in: ['PLANIFIEE', 'EN_COURS'] } } 
    });
    const projectsCount = activeProjects + evenementsEnCours + activeProgrammes; 

    // Retourner les stats détaillées pour éviter la redondance
    const statsDetail = {
        campagnesActives: activeProjects,
        evenementsEnCours: evenementsEnCours,
        programmesActivites: activeProgrammes,
        total: projectsCount
    };

    // --- 1B. DONNÉES ADDITIONNELLES ---
    const avgRatingResult = await prisma.etablissement.aggregate({
      _avg: { noteMoyenne: true }
    });
    const averageSatisfaction = avgRatingResult._avg.noteMoyenne || 0;
    
    const citoyensTotal = await prisma.user.count({ where: { role: 'CITOYEN' } });
    const citoyensActifsCeMois = await prisma.user.count({ 
      where: { role: 'CITOYEN', derniereConnexion: { gte: debutMois } } 
    });
    const citoyensNouveaux = await prisma.user.count({ 
      where: { role: 'CITOYEN', createdAt: { gte: debutSemaine } } 
    });
    
    const abonnementsTotal = await prisma.abonnementEtablissement.count();
    const participationsCampagnes = await prisma.participationCampagne.count();
    const totalEngagement = abonnementsTotal + participationsCampagnes;
    
    // Performance par secteur
    const secteurPerformance = await Promise.all(
      ['EDUCATION', 'SANTE', 'SPORT', 'SOCIAL', 'CULTUREL'].map(async (secteur) => {
        const etabsInSecteur = await prisma.etablissement.count({ 
            where: { secteur: secteur as any } 
        });
        
        const eventsInSecteur = await prisma.evenement.count({ 
          where: { 
            secteur: secteur as any, 
            statut: { in: ['PUBLIEE', 'EN_ACTION', 'CLOTUREE'] } 
          } 
        });

        const actualitesInSecteur = await prisma.actualite.count({
          where: { 
            etablissement: { secteur: secteur as any },
            isPublie: true 
          }
        });

        const reclamationsInSecteur = await prisma.reclamation.count({
          where: { etablissement: { secteur: secteur as any } }
        });

        const avgNoteInSecteur = await prisma.etablissement.aggregate({
          where: { secteur: secteur as any },
          _avg: { noteMoyenne: true }
        });
        
        const score = Math.min(100, Math.max(0,
          (eventsInSecteur * 10) + 
          (actualitesInSecteur * 5) +
          ((avgNoteInSecteur._avg.noteMoyenne || 0) * 15) - 
          (reclamationsInSecteur * 2) +
          50 
        ));
        
        return {
          secteur,
          etablissements: etabsInSecteur,
          evenements: eventsInSecteur,
          actualites: actualitesInSecteur,
          reclamations: reclamationsInSecteur,
          noteMoyenne: avgNoteInSecteur._avg.noteMoyenne || 0,
          score: Math.round(score)
        };
      })
    );
    
    const sectorRankings = secteurPerformance
      .sort((a, b) => b.score - a.score)
      .map((s, idx) => ({ ...s, rank: idx + 1 }));

    // --- 2. DATA POUR GRAPHIQUES ---
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
            audits: created,      
            conformite: resolved, 
        });
    }

    const infraStats = await prisma.etablissement.groupBy({
        by: ['etatInfrastructure'],
        _count: { id: true }
    });
    
    let infraConforme = 0; 
    let infraAction = 0;   
    let infraCritique = 0; 

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

    // --- 3. ALERTES ---
    const recentAlertsRaw = await prisma.reclamation.findMany({
        where: { statut: 'ACCEPTEE' },
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

    // --- 4. RECENT ACTIVITY LOG ---
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
            icon: 'AlertTriangle',
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


    // --- 5. COMMUNE BREAKDOWN ---
    const reclamationsByCommune = await prisma.reclamation.groupBy({
        by: ['communeId'],
        _count: { id: true },
        where: { statut: { not: 'REJETEE' } }
    });

    const resolvedByCommune = await prisma.reclamation.groupBy({
        by: ['communeId'],
        _count: { id: true },
        where: { dateResolution: { not: null } }
    });

    const allCommunes = await prisma.commune.findMany({
        select: { id: true, nom: true, nomArabe: true }
    });

    const communeStats = allCommunes.map(c => {
        const total = reclamationsByCommune.find(r => r.communeId === c.id)?._count.id || 0;
        const resolved = resolvedByCommune.find(r => r.communeId === c.id)?._count.id || 0;
        const rate = total > 0 ? Math.round((resolved / total) * 100) : 100;

        return {
            id: c.id,
            nom: isAr ? (c.nomArabe || c.nom) : c.nom,
            total,
            resolved,
            rate,
            performance: rate > 80 ? 'HIGH' : (rate > 50 ? 'MEDIUM' : 'LOW'),
            status: rate < 50 ? 'CRITICAL' : (rate < 80 ? 'WARNING' : 'STABLE')
        };
    }).sort((a,b) => b.total - a.total);

    return successResponse({
        communes: { total: communesCount, actives: communesCount, details: communeStats },
        reclamations: {
            total: reclamationsTotal,
            enAttente: reclamationsEnAttente,
            enCours: reclamationsEnCours,
            resolues: reclamationsResolues,
            rejetees: reclamationsRejetees,
            tauxResolution,
            urgentes: reclamationsEnAttente + reclamationsEnCours,
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
            details: statsDetail,
        },
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
});
