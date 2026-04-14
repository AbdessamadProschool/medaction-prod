'use server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { SystemLogger } from "@/lib/system-logger";

// Fonction utilitaire pour vérifier l'accès Gouverneur/Admin
async function checkGovernorAccess() {
    const session = await getServerSession(authOptions);
    if (!session?.user) return { allowed: false, error: 'Non authentifié' };
    const role = session.user.role;
    const isAllowed = ['GOUVERNEUR', 'ADMIN', 'SUPER_ADMIN'].includes(role);
    return { allowed: isAllowed, user: session.user, error: isAllowed ? null : 'Accès refusé' };
}

export async function getCommunes() {
    try {
        const access = await checkGovernorAccess();
        if (!access.allowed) return { success: false, error: access.error };
        const communes = await prisma.commune.findMany({
            select: { id: true, nom: true, nomArabe: true },
            orderBy: { nom: 'asc' }
        });
        return { success: true, data: communes };
    } catch (error) {
        return { success: false, error: 'Erreur de chargement des communes' };
    }
}

export async function generateGovernorReport(
    period: string,
    filters?: { communeId?: number; secteur?: string }
) {
    try {
        const access = await checkGovernorAccess();
        if (!access.allowed) return { success: false, error: access.error };

        const now = new Date();
        let startDate: Date;
        let endDate: Date = new Date();
        let periodLabel = '';

        // ─── Period Logic ──────────────────────────────────────────────────────
        if (period === 'Semaine en cours') {
            startDate = new Date();
            startDate.setDate(now.getDate() - 7);
            startDate.setHours(0, 0, 0, 0);
            periodLabel = `Semaine du ${startDate.toLocaleDateString('fr-FR')} au ${now.toLocaleDateString('fr-FR')}`;
        } else if (period === 'Mois Dernier') {
            startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
            periodLabel = startDate.toLocaleString('fr-FR', { month: 'long', year: 'numeric' });
        } else if (period === 'Mois en cours') {
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            periodLabel = `${now.toLocaleString('fr-FR', { month: 'long', year: 'numeric' })}`;
        } else if (period === 'Année 2025') {
            startDate = new Date('2025-01-01');
            endDate = new Date('2025-12-31T23:59:59');
            periodLabel = 'Année 2025';
        } else if (period === 'Trimestre en cours') {
            const quarter = Math.floor(now.getMonth() / 3);
            startDate = new Date(now.getFullYear(), quarter * 3, 1);
            periodLabel = `T${quarter + 1} ${now.getFullYear()}`;
        } else {
            // Default: 30 derniers jours
            startDate = new Date();
            startDate.setDate(now.getDate() - 30);
            startDate.setHours(0, 0, 0, 0);
            periodLabel = `30 derniers jours`;
        }

        const dateFilter = { gte: startDate, lte: endDate };

        // ─── Etablissement where clause ────────────────────────────────────────
        const etablissementWhere: any = {};
        if (filters?.communeId) etablissementWhere.communeId = filters.communeId;
        if (filters?.secteur) etablissementWhere.secteur = filters.secteur;

        // ─── Reclamation where clause ──────────────────────────────────────────
        // statut null = En attente, ACCEPTEE = Acceptée, REJETEE = Rejetée
        const reclamationBaseWhere: any = { createdAt: dateFilter };
        if (filters?.communeId) reclamationBaseWhere.communeId = filters.communeId;
        if (filters?.secteur) reclamationBaseWhere.etablissement = { secteur: filters.secteur };

        const threshold72h = new Date(now.getTime() - 72 * 60 * 60 * 1000);

        // ─── Parallel queries ──────────────────────────────────────────────────
        const [
            // Réclamations
            reclamationsTotal,
            reclamationsAcceptees,
            reclamationsRejetees,
            reclamationsEnAttente,
            reclamationsUrgentes,
            reclamationsResolues,
            reclamationsAffectees,
            // Établissements
            etablissementsStats,
            etablissementsTotal,
            etablissementsValides,
            // Événements
            evenementsTotal,
            evenementsPublies,
            evenementsCloturesAvecBilan,
            // Actualités et campagnes
            actualitesTotal,
            campagnesTotal,
            // Satisfaction
            satisfactionGlobale,
            totalEvaluations,
            // Géographie
            communes,
            reclamationsParCommune,
            evenementsParSecteur,
            reclamationsParCategorie,
            annexes,
        ] = (await Promise.all([
            // === RÉCLAMATIONS ===
            prisma.reclamation.count({ where: reclamationBaseWhere }),
            prisma.reclamation.count({ where: { ...reclamationBaseWhere, statut: 'ACCEPTEE' } }),
            prisma.reclamation.count({ where: { ...reclamationBaseWhere, statut: 'REJETEE' } }),
            prisma.reclamation.count({ where: { ...reclamationBaseWhere, statut: null } }),
            // Urgentes = en attente depuis + 72h
            prisma.reclamation.count({
                where: {
                    ...reclamationBaseWhere,
                    statut: null,
                    createdAt: { gte: startDate, lte: threshold72h }
                }
            }),
            // Résolues = acceptées AND dateResolution renseignée
            prisma.reclamation.count({
                where: {
                    ...reclamationBaseWhere,
                    statut: 'ACCEPTEE',
                    dateResolution: { not: null }
                }
            }),
            // Affectées à une autorité locale
            prisma.reclamation.count({
                where: {
                    ...reclamationBaseWhere,
                    affectationReclamation: 'AFFECTEE'
                }
            }),

            // === ÉTABLISSEMENTS ===
            prisma.etablissement.findMany({
                where: etablissementWhere,
                select: {
                    id: true,
                    nom: true,
                    secteur: true,
                    noteMoyenne: true,
                    nombreEvaluations: true,
                    isValide: true,
                    statutFonctionnel: true,
                    etatInfrastructure: true,
                    effectifTotal: true,
                    commune: { select: { nom: true } },
                    _count: {
                        select: {
                            reclamations: { where: { createdAt: dateFilter } },
                            evenementsOrganises: { where: { createdAt: dateFilter } },
                            actualites: { where: { createdAt: dateFilter } },
                            evaluations: true,
                            activitesOrganisees: { where: { date: dateFilter } }, // Programmes are daily
                        }
                    },
                    annexe: { select: { nom: true } }
                },
                orderBy: { noteMoyenne: 'desc' },
            }),
            prisma.etablissement.count({ where: etablissementWhere }),
            prisma.etablissement.count({ where: { ...etablissementWhere, isValide: true } }),

            // === ÉVÉNEMENTS ===
            prisma.evenement.count({
                where: {
                    createdAt: dateFilter,
                    ...(filters?.communeId ? { communeId: filters.communeId } : {}),
                    ...(filters?.secteur ? { secteur: filters.secteur as any } : {})
                }
            }),
            prisma.evenement.count({
                where: {
                    createdAt: dateFilter,
                    statut: 'PUBLIEE',
                    ...(filters?.communeId ? { communeId: filters.communeId } : {}),
                    ...(filters?.secteur ? { secteur: filters.secteur as any } : {})
                }
            }),
            prisma.evenement.count({
                where: {
                    createdAt: dateFilter,
                    statut: 'CLOTUREE',
                    bilanDescription: { not: null },
                    ...(filters?.communeId ? { communeId: filters.communeId } : {}),
                }
            }),

            // === ACTUALITÉS & CAMPAGNES ===
            prisma.actualite.count({
                where: {
                    createdAt: dateFilter,
                    statut: 'PUBLIEE',
                    ...(filters?.communeId ? { etablissement: { communeId: filters.communeId } } : {}),
                }
            }),
            prisma.campagne.count({ where: { createdAt: dateFilter } }),

            // === SATISFACTION ===
            prisma.evaluation.aggregate({
                where: filters?.communeId || filters?.secteur ? {
                    etablissement: {
                        ...(filters.communeId ? { communeId: filters.communeId } : {}),
                        ...(filters.secteur ? { secteur: filters.secteur as any } : {}),
                    }
                } : {},
                _avg: { noteGlobale: true },
            }),
            prisma.evaluation.count({
                where: filters?.communeId || filters?.secteur ? {
                    etablissement: {
                        ...(filters?.communeId ? { communeId: filters.communeId } : {}),
                        ...(filters?.secteur ? { secteur: filters.secteur as any } : {}),
                    }
                } : {},
            }),

            // === GÉO ===
            prisma.commune.findMany({
                select: { id: true, nom: true, population: true },
                orderBy: { nom: 'asc' }
            }),
            prisma.reclamation.groupBy({
                by: ['communeId'],
                _count: { id: true },
                where: { createdAt: dateFilter }
            }),
            prisma.evenement.groupBy({
                by: ['secteur'],
                _count: { id: true },
                where: { createdAt: dateFilter }
            }),
            prisma.reclamation.groupBy({
                by: ['categorie'],
                _count: { id: true },
                where: { createdAt: dateFilter },
                orderBy: { _count: { id: 'desc' } },
                take: 5
            }),
            // === ANNEXES STATS ===
            prisma.annexe.findMany({
                include: {
                    _count: {
                        select: {
                           etablissements: true,
                        }
                    },
                    commune: { select: { nom: true } }
                }
            })
        ]));

        // ─── Compute derived stats ─────────────────────────────────────────────
        const tauxResolution = reclamationsTotal > 0
            ? Math.round((reclamationsResolues / reclamationsTotal) * 100)
            : 0;
        const tauxAcceptation = reclamationsTotal > 0
            ? Math.round((reclamationsAcceptees / reclamationsTotal) * 100)
            : 0;

        const noteSatisfaction = satisfactionGlobale._avg.noteGlobale;
        const satisfactionStr = noteSatisfaction ? noteSatisfaction.toFixed(1) : 'N/A';
        const satisfactionStatus =
            !noteSatisfaction ? 'NON ÉVALUÉ'
            : noteSatisfaction >= 4.5 ? 'EXCELLENT'
            : noteSatisfaction >= 3.5 ? 'BON'
            : noteSatisfaction >= 2.5 ? 'MOYEN'
            : 'À AMÉLIORER';

        // ─── Établissements ranking ────────────────────────────────────────────
        const ranking = etablissementsStats.map(e => {
            // Score = (événements × 10) + (actualités × 5) + (programmes × 3) - (réclamations × 3) + (note × 4)
            const activityScore =
                (e._count.evenementsOrganises * 10) +
                (e._count.actualites * 5) +
                (e._count.activitesOrganisees * 3) -
                (e._count.reclamations * 3) +
                (e.noteMoyenne * 4);
                
            return {
                id: e.id,
                nom: e.nom,
                secteur: e.secteur,
                commune: e.commune.nom,
                annexe: e.annexe?.nom || 'Centre',
                note: e.noteMoyenne.toFixed(1),
                nombreEvaluations: e.nombreEvaluations,
                activityScore: Math.round(activityScore),
                statutFonctionnel: e.statutFonctionnel || 'Non défini',
                etatInfrastructure: e.etatInfrastructure || 'Non évalué',
                details: {
                    reclamations: e._count.reclamations,
                    evenements: e._count.evenementsOrganises,
                    actualites: e._count.actualites,
                    programmes: e._count.activitesOrganisees,
                    evaluations: e._count.evaluations,
                }
            };
        }).sort((a, b) => b.activityScore - a.activityScore);

        // ─── Commune stats ─────────────────────────────────────────────────────
        const communeStats = communes.map(c => {
            const recl = reclamationsParCommune.find(r => r.communeId === c.id)?._count.id || 0;
            return {
                id: c.id,
                nom: c.nom,
                population: c.population,
                reclamations: recl,
                status: recl > 15 ? 'CRITIQUE' : recl > 7 ? 'ATTENTION' : 'STABLE'
            };
        }).sort((a, b) => b.reclamations - a.reclamations);

        // ─── Secteur distribution ──────────────────────────────────────────────
        const secteurDistribution = (evenementsParSecteur || []).map((s: any) => ({
            secteur: s.secteur || 'AUTRE',
            evenements: s._count?.id || 0,
            reclamations: etablissementsStats
                .filter(e => e.secteur === s.secteur)
                .reduce((acc, curr) => acc + curr._count.reclamations, 0)
        }));

        // ─── Annexes summary ───────────────────────────────────────────────────
        const annexesList = (annexes as any).map((ann: any) => ({
            id: ann.id,
            nom: ann.nom,
            commune: ann.commune?.nom,
            etablissements: ann._count?.etablissements || 0,
        }));

        // ─── Alertes intelligentes ─────────────────────────────────────────────
        const alerts: { type: string; severity: string; message: string }[] = [];

        if (reclamationsUrgentes > 0) {
            alerts.push({
                type: 'urgence',
                severity: 'CRITIQUE',
                message: `${reclamationsUrgentes} réclamations critiques dépassent le délai réglementaire de 72h sans traitement.`
            });
        }
        if (tauxResolution < 50 && reclamationsTotal > 5) {
            alerts.push({
                type: 'performance',
                severity: 'ATTENTION',
                message: `Taux de résolution faible (${tauxResolution}%). Une intervention est recommandée pour accélérer le traitement des dossiers.`
            });
        }
        const hotspotCommune = communeStats.find(c => c.status === 'CRITIQUE');
        if (hotspotCommune) {
            alerts.push({
                type: 'territorial',
                severity: 'ATTENTION',
                message: `La commune de ${hotspotCommune.nom} est un point chaud avec ${hotspotCommune.reclamations} réclamations actives.`
            });
        }
        if (noteSatisfaction && noteSatisfaction < 3) {
            alerts.push({
                type: 'satisfaction',
                severity: 'CRITIQUE',
                message: `Satisfaction citoyenne très basse (${satisfactionStr}/5). Audit de qualité de service recommandé.`
            });
        }

        // ─── Recommendations ───────────────────────────────────────────────────
        const recommendations: string[] = [];
        if (reclamationsUrgentes > 0) recommendations.push(`Traiter en priorité les ${reclamationsUrgentes} dossiers en dépassement de délai.`);
        if (evenementsTotal === 0) recommendations.push(`Aucun événement enregistré sur la période. Encourager les délégations à soumettre des activités.`);
        if (etablissementsValides < etablissementsTotal * 0.8) {
            recommendations.push(`Accélérer la validation des établissements (${etablissementsTotal - etablissementsValides} en attente).`);
        }
        if (recommendations.length === 0) recommendations.push(`Indicateurs dans les normes. Maintenir le suivi régulier.`);

        return {
            success: true,
            data: {
                period: periodLabel,
                rawPeriod: period,
                filters: filters || {},
                generatedAt: new Date().toISOString(),
                generatedBy: access.user ? `${access.user.prenom} ${access.user.nom}` : 'Gouverneur',

                // Stats Réclamations
                reclamations: {
                    total: reclamationsTotal,
                    acceptees: reclamationsAcceptees,
                    rejetees: reclamationsRejetees,
                    enAttente: reclamationsEnAttente,
                    urgentes: reclamationsUrgentes,
                    resolues: reclamationsResolues,
                    affectees: reclamationsAffectees,
                    tauxResolution,
                    tauxAcceptation,
                    parCategorie: reclamationsParCategorie.map(r => ({
                        categorie: r.categorie,
                        count: r._count.id
                    }))
                },

                // Stats Établissements
                etablissements: {
                    total: etablissementsTotal,
                    valides: etablissementsValides,
                    ranking: ranking.slice(0, 10),
                    topPerformers: ranking.filter(r => r.activityScore > 20).length,
                },

                // Stats Événements
                evenements: {
                    total: evenementsTotal,
                    publies: evenementsPublies,
                    cloturesAvecBilan: evenementsCloturesAvecBilan,
                    parSecteur: secteurDistribution,
                },

                // Stats Actualités & Campagnes
                actualites: { total: actualitesTotal },
                campagnes: { total: campagnesTotal },

                // Satisfaction
                satisfaction: {
                    moyenne: satisfactionStr,
                    status: satisfactionStatus,
                    totalEvaluations,
                },

                // Géographie
                communes: communeStats,
                annexes: annexesList,

                // Intelligence
                alerts,
                recommendations,
            }
        };
    } catch (error) {
        SystemLogger.error('report', 'Error generating governor report', { error: String(error) });
        return { success: false, error: `Erreur de génération: ${String(error)}` };
    }
}

export async function getGovernorInsights(locale: string = 'fr') {
    try {
        const access = await checkGovernorAccess();
        if (!access.allowed) return { success: false, error: access.error };

        const isAr = locale === 'ar';
        const now = new Date();
        const firstDayCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

        const [currentMonthCount, lastMonthCount] = await Promise.all([
            prisma.reclamation.count({ where: { createdAt: { gte: firstDayCurrentMonth } } }),
            prisma.reclamation.count({
                where: { createdAt: { gte: firstDayLastMonth, lte: lastDayLastMonth } }
            })
        ]);

        let pctChange = 0;
        if (lastMonthCount > 0) {
            pctChange = Math.round(((currentMonthCount - lastMonthCount) / lastMonthCount) * 100);
        } else if (currentMonthCount > 0) {
            pctChange = 100;
        }

        const criticalThresholdDate = new Date();
        criticalThresholdDate.setDate(now.getDate() - 7);

        const criticalReclamations = await prisma.reclamation.findMany({
            where: { statut: null, createdAt: { lte: criticalThresholdDate } },
            take: 3,
            include: { commune: true },
            orderBy: { createdAt: 'asc' }
        });

        const alerts = criticalReclamations.map(r => ({
            id: r.id,
            message: isAr
                ? `شكاية #${r.id} قيد الانتظار منذ +7 أيام (${r.commune.nom})`
                : `Réclamation #${r.id} en attente depuis +7 jours (${r.commune.nom})`,
            type: 'danger'
        }));

        if (alerts.length === 0) {
            alerts.push({
                id: 0,
                message: isAr ? "لا توجد شكايات حرجة قيد الانتظار." : "Aucune réclamation critique en attente.",
                type: "success"
            });
        }

        const recommendation = {
            message: pctChange > 20
                ? (isAr ? "ارتفاع ملحوظ في الشكايات (+20%). يوصى بإجراء تدقيق." : "Hausse significative des réclamations (+20%). Audit recommandé.")
                : (isAr ? "النشاط مستقر. استمر في جهود المعالجة." : "Activité stable. Maintenez les efforts de résolution.")
        };

        return {
            success: true,
            data: {
                growth: {
                    value: pctChange,
                    label: pctChange >= 0 ? `+${pctChange}%` : `${pctChange}%`,
                    period: isAr ? 'مقارنة بالشهر الماضي' : 'vs mois dernier'
                },
                alerts,
                recommendation
            }
        };
    } catch (error) {
        SystemLogger.error('insights', 'Error fetching insights', {
            error: error instanceof Error ? error.message : String(error)
        });
        return { success: false, error: 'Failed' };
    }
}

export async function getRecentReportsList(locale: string = 'fr') {
    try {
        const access = await checkGovernorAccess();
        if (!access.allowed) return { success: false, error: access.error };

        const isAr = locale === 'ar';
        const now = new Date();
        const reports = [];

        const fieldActivities = await prisma.programmeActivite.findMany({
            where: { statut: 'RAPPORT_COMPLETE', rapportComplete: true },
            orderBy: { dateRapport: 'desc' },
            take: 5,
            include: { etablissement: { select: { nom: true, nomArabe: true } } }
        });

        fieldActivities.forEach(act => {
            reports.push({
                id: `act-report-${act.id}`,
                title: isAr ? `تقرير ميداني: ${act.titre}` : `Rapport Terrain: ${act.titre}`,
                subtitle: act.etablissement ? (isAr ? (act.etablissement.nomArabe || act.etablissement.nom) : act.etablissement.nom) : 'Province',
                date: act.dateRapport ? act.dateRapport.toISOString() : act.updatedAt.toISOString(),
                type: 'audit',
                status: isAr ? 'تم التحقق' : 'Vérifié',
                periodValue: act.titre
            });
        });

        const getFrenchMonth = (date: Date) => date.toLocaleString('fr-FR', { month: 'long' });
        const getDisplayMonth = (date: Date) =>
            date.toLocaleString(isAr ? 'ar-MA' : 'fr-FR', { month: 'long', year: 'numeric' });

        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const startOfWeek = new Date();
        startOfWeek.setDate(now.getDate() - now.getDay());

        reports.push({
            id: 'system-hebdo-current',
            title: isAr ? `التقرير الأسبوعي للأنشطة` : `Rapport Hebdomadaire d'Activités`,
            subtitle: isAr
                ? `من ${startOfWeek.toLocaleDateString('ar-MA')} إلى اليوم`
                : `Du ${startOfWeek.toLocaleDateString('fr-FR')} à aujourd'hui`,
            periodValue: 'Semaine en cours',
            date: startOfWeek.toISOString(),
            type: 'HEBDOMADAIRE',
            status: isAr ? 'جاهز' : 'Disponible'
        });

        reports.push({
            id: 'system-mensuel-last',
            title: isAr ? `التقرير الشهري الإقليمي` : `Rapport Mensuel Provincial`,
            subtitle: isAr ? `شهر ${getDisplayMonth(lastMonth)}` : `Mois de ${getDisplayMonth(lastMonth)}`,
            periodValue: `Mois de ${getFrenchMonth(lastMonth)} ${lastMonth.getFullYear()}`,
            date: lastMonth.toISOString(),
            type: 'MENSUEL',
            status: isAr ? 'جاهز' : 'Disponible'
        });

        const q4 = new Date(now.getFullYear() - 1, 9, 1);
        reports.push({
            id: 'system-q4',
            title: isAr ? `حصيلة الربع الرابع` : `Bilan Trimestriel Q4`,
            subtitle: isAr ? `الربع الرابع ${now.getFullYear() - 1}` : `T4 ${now.getFullYear() - 1}`,
            periodValue: 'Trimestre T4',
            date: q4.toISOString(),
            type: 'TRIMESTRIEL',
            status: isAr ? 'مؤرشف' : 'Archivé'
        });

        return { success: true, data: reports };
    } catch (e) {
        SystemLogger.error('reports-list', 'Error fetching reports list', {
            error: e instanceof Error ? e.message : String(e)
        });
        return { success: false, data: [] };
    }
}
