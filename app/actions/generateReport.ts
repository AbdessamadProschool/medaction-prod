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
            startDate = new Date();
            startDate.setDate(now.getDate() - 30);
            startDate.setHours(0, 0, 0, 0);
            periodLabel = `30 derniers jours`;
        }

        const dateFilter = { gte: startDate, lte: endDate };
        const threshold72h = new Date(now.getTime() - 72 * 60 * 60 * 1000);

        // ─── Filters ──────────────────────────────────────────────────────────
        const etablissementWhere: any = {};
        if (filters?.communeId) etablissementWhere.communeId = filters.communeId;
        if (filters?.secteur) etablissementWhere.secteur = filters.secteur;

        const reclamationBaseWhere: any = { createdAt: dateFilter };
        if (filters?.communeId) reclamationBaseWhere.communeId = filters.communeId;
        if (filters?.secteur) reclamationBaseWhere.etablissement = { secteur: filters.secteur };

        // ─── Data Fetching ─────────────────────────────────────────────────────
        const [
            reclamationsStats,
            etablissementsList,
            eventsStats,
            geoData,
            detailedData
        ] = await Promise.all([
            // 1. Réclamations Stats
            Promise.all([
                prisma.reclamation.count({ where: reclamationBaseWhere }),
                prisma.reclamation.count({ where: { ...reclamationBaseWhere, statut: 'ACCEPTEE' } }),
                prisma.reclamation.count({ where: { ...reclamationBaseWhere, statut: 'REJETEE' } }),
                prisma.reclamation.count({ where: { ...reclamationBaseWhere, statut: null } }),
                prisma.reclamation.count({ where: { ...reclamationBaseWhere, statut: null, createdAt: { lte: threshold72h } } }),
                prisma.reclamation.count({ where: { ...reclamationBaseWhere, statut: 'ACCEPTEE', dateResolution: { not: null } } }),
                prisma.reclamation.count({ where: { ...reclamationBaseWhere, affectationReclamation: 'AFFECTEE' } }),
            ]),
            // 2. Établissements Detail
            prisma.etablissement.findMany({
                where: etablissementWhere,
                include: {
                    commune: { select: { id: true, nom: true, nomArabe: true } },
                    annexe: { select: { id: true, nom: true, nomArabe: true } },
                    _count: {
                        select: {
                            reclamations: { where: { createdAt: dateFilter } },
                            evenementsOrganises: { where: { createdAt: dateFilter } },
                            actualites: { where: { createdAt: dateFilter } },
                            activitesOrganisees: { where: { date: dateFilter } }
                        }
                    }
                },
                orderBy: { noteMoyenne: 'desc' }
            }),
            // 3. Événements & Activités Counts
            Promise.all([
                prisma.evenement.count({ where: { createdAt: dateFilter, ...(filters?.communeId && { communeId: filters.communeId }), ...(filters?.secteur && { secteur: filters.secteur as any }) } }),
                prisma.evenement.count({ where: { createdAt: dateFilter, statut: 'CLOTUREE', ...(filters?.communeId && { communeId: filters.communeId }) } }),
                prisma.actualite.count({ where: { createdAt: dateFilter, statut: 'PUBLIEE', ...(filters?.communeId && { etablissement: { communeId: filters.communeId } }) } }),
                prisma.campagne.count({ where: { createdAt: dateFilter } }),
                prisma.evaluation.aggregate({ where: etablissementWhere, _avg: { noteGlobale: true }, _count: true }),
            ]),
            // 4. Géo & Annexes
            Promise.all([
                prisma.commune.findMany({ select: { id: true, nom: true, nomArabe: true, population: true }, orderBy: { nom: 'asc' } }),
                prisma.annexe.findMany({ include: { _count: { select: { etablissements: true } }, commune: { select: { nom: true, nomArabe: true } } } }),
                prisma.reclamation.groupBy({ by: ['communeId'], _count: { id: true }, where: { createdAt: dateFilter } }),
            ]),
            // 5. Detailed Lists for Report
            Promise.all([
                prisma.evenement.findMany({ 
                    where: { createdAt: dateFilter, statut: 'PUBLIEE' }, 
                    take: 15, 
                    orderBy: { dateDebut: 'desc' }, 
                    include: { commune: { select: { nom: true, nomArabe: true } } } 
                }),
                prisma.programmeActivite.findMany({ 
                    where: { date: dateFilter, statut: 'RAPPORT_COMPLETE' }, 
                    take: 10, 
                    orderBy: { date: 'desc' }, 
                    include: { etablissement: { select: { nom: true, nomArabe: true } } } 
                }),
                prisma.reclamation.findMany({ 
                    where: { ...reclamationBaseWhere, statut: 'ACCEPTEE' }, 
                    take: 10, 
                    orderBy: { createdAt: 'desc' }, 
                    include: { etablissement: { select: { nom: true, nomArabe: true } }, affecteeAAutorite: { select: { nom: true, prenom: true } } } 
                }),
                prisma.evaluation.findMany({ 
                    where: { etablissement: etablissementWhere }, 
                    take: 10, 
                    orderBy: { createdAt: 'desc' }, 
                    include: { etablissement: { select: { nom: true, nomArabe: true } } } 
                })
            ])
        ]);

        // ─── Processing Stats ──────────────────────────────────────────────────
        const [totalRec, accepteesRec, rejeteesRec, enAttenteRec, urgentesRec, resoluesRec, affecteesRec] = reclamationsStats;
        const [totalEv, cloturesEv, totalActu, totalCamp, satisfaction] = eventsStats;
        const [communesList, annexesList, recParCommune] = geoData;
        const [detailedEvents, detailedActivites, detailedReclamations, detailedReviews] = detailedData;

        const tauxResolution = totalRec > 0 ? Math.round((resoluesRec / totalRec) * 100) : 0;
        const tauxAcceptation = totalRec > 0 ? Math.round((accepteesRec / totalRec) * 100) : 0;

        const ranking = etablissementsList.map(e => ({
            id: e.id,
            nom: e.nom,
            nomArabe: e.nomArabe,
            secteur: e.secteur,
            commune: e.commune.nom,
            communeArabe: e.commune.nomArabe,
            annexe: e.annexe?.nom || 'Centre',
            annexeArabe: e.annexe?.nomArabe || 'المركز',
            note: e.noteMoyenne.toFixed(1),
            activityScore: (e._count.evenementsOrganises * 10) + (e._count.actualites * 5) + (e._count.activitesOrganisees * 3),
            reclamations: e._count.reclamations,
            statut: e.statutFonctionnel || 'Opérationnel'
        })).sort((a, b) => b.activityScore - a.activityScore);

        return {
            success: true,
            data: {
                period: periodLabel,
                generatedAt: new Date().toISOString(),
                reclamations: {
                    total: totalRec,
                    acceptees: accepteesRec,
                    enAttente: enAttenteRec,
                    urgentes: urgentesRec,
                    resolues: resoluesRec,
                    tauxResolution,
                    tauxAcceptation,
                    details: detailedReclamations
                },
                etablissements: {
                    total: etablissementsList.length,
                    ranking: ranking.slice(0, 10),
                    reviews: detailedReviews
                },
                activites: {
                    evenements: detailedEvents,
                    programmes: detailedActivites,
                    totalGlobal: totalEv + totalActu + totalCamp
                },
                evenements: { total: totalEv, clotures: cloturesEv },
                actualites: { total: totalActu },
                campagnes: { total: totalCamp },
                satisfaction: { moyenne: satisfaction._avg.noteMoyenne || 0 },
                communes: communesList.map(c => ({
                    nom: c.nom,
                    nomArabe: c.nomArabe,
                    reclamations: recParCommune.find(r => r.communeId === c.id)?._count.id || 0
                })),
                annexes: annexesList.map(a => ({
                    nom: a.nom,
                    nomArabe: a.nomArabe,
                    commune: a.commune.nom,
                    communeArabe: a.commune.nomArabe,
                    etablissements: a._count.etablissements
                }))
            }
        };

    } catch (error) {
        SystemLogger.error('report', 'Error generating report', { error: String(error) });
        return { success: false, error: 'Erreur serveur lors de la génération' };
    }
}

export async function getGovernorInsights(locale: string = 'fr') {
    try {
        const access = await checkGovernorAccess();
        if (!access.allowed) return { success: false, error: access.error };

        const isAr = locale === 'ar';
        const now = new Date();
        const firstDayCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const [currentMonthCount, criticalReclamations] = await Promise.all([
            prisma.reclamation.count({ where: { createdAt: { gte: firstDayCurrentMonth } } }),
            prisma.reclamation.findMany({
                where: { statut: null, createdAt: { lte: new Date(now.getTime() - 7*24*60*60*1000) } },
                take: 3,
                include: { commune: true },
                orderBy: { createdAt: 'asc' }
            })
        ]);

        const alerts = criticalReclamations.map(r => ({
            id: r.id,
            message: isAr ? `شكاية #${r.id} متأخرة (${r.commune.nom})` : `Réclamation #${r.id} en retard (${r.commune.nom})`,
            type: 'danger'
        }));

        if (alerts.length === 0) {
            alerts.push({ id: 0, message: isAr ? "نظام مستقر" : "Système stable", type: "success" });
        }

        return {
            success: true,
            data: {
                growth: { value: currentMonthCount, label: `${currentMonthCount}`, period: isAr ? 'هذا الشهر' : 'ce mois' },
                alerts,
                recommendation: { message: isAr ? "متابعة معالجة الشكايات العالقة" : "Suivre la résolution des réclamations en attente." }
            }
        };
    } catch (error) {
        return { success: false, error: 'Failed to fetch insights' };
    }
}

export async function getRecentReportsList(locale: string = 'fr') {
    try {
        const access = await checkGovernorAccess();
        if (!access.allowed) return { success: false, error: access.error };
        const isAr = locale === 'ar';
        const reports = [
            { id: 'rep-1', title: isAr ? 'التقرير الأسبوعي' : 'Rapport Hebdomadaire', subtitle: 'Semaine en cours', periodValue: 'Semaine en cours', date: new Date().toISOString(), type: 'HEBDOMADAIRE', status: 'Disponible' },
            { id: 'rep-2', title: isAr ? 'التقرير الشهري' : 'Rapport Mensuel Provincial', subtitle: 'Mois Dernier', periodValue: 'Mois Dernier', date: new Date().toISOString(), type: 'MENSUEL', status: 'Disponible' },
        ];
        return { success: true, data: reports };
    } catch (e) {
        return { success: false, data: [] };
    }
}
