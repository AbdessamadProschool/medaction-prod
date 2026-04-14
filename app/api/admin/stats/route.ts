import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { withErrorHandler, successResponse } from '@/lib/api-handler';
import { UnauthorizedError, ForbiddenError } from '@/lib/exceptions';
import { SecurityValidation } from '@/lib/security/validation';

export const GET = withErrorHandler(async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    throw new UnauthorizedError('Vous devez être connecté pour accéder aux statistiques');
  }
  
  // Restriction d'accès au Dashboard Admin
  if (!['ADMIN', 'SUPER_ADMIN', 'GOUVERNEUR'].includes(session.user.role || '')) {
    throw new ForbiddenError('Accès réservé aux administrateurs et autorités supérieures');
  }

  const { searchParams } = new URL(request.url);
  const periodeRaw = searchParams.get('periode') || '30j';
  
  // Validation simple de la période pour éviter les injections de type inattendues
  const ALLOWED_PERIODS = ['7j', '30j', '90j', '1an'];
  const periode = ALLOWED_PERIODS.includes(periodeRaw) ? periodeRaw : '30j';

  // Calculer les dates selon la période
  const now = new Date();
  let dateDebut: Date;
  switch (periode) {
    case '7j':
      dateDebut = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '90j':
      dateDebut = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    case '1an':
      dateDebut = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      break;
    default:
      dateDebut = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  const debutMois = new Date(now.getFullYear(), now.getMonth(), 1);
  const debutMoisDernier = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const finMoisDernier = new Date(now.getFullYear(), now.getMonth(), 0);
  const aujourdhui = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Récupération parallélisée pour performance
  const [
    reclamationsTotal,
    reclamationsCeMois,
    reclamationsMoisDernier,
    parStatut,
    parAffectation,
    parCategorie,
    parCommuneRaw,
    etablissementsTotal,
    etablissementsValides,
    etablissementsPublies,
    parSecteur,
    etablissementsAvecNote,
    evenementsTotal,
    evenementsCeMois,
    evenementsEnCours,
    evenementsACloturer,
    evenementsParSecteur,
    utilisateursTotal,
    nouveauxCeMois,
    actifAujourdhui,
    parRole,
  ] = await Promise.all([
    prisma.reclamation.count(),
    prisma.reclamation.count({ where: { createdAt: { gte: debutMois } } }),
    prisma.reclamation.count({ where: { createdAt: { gte: debutMoisDernier, lte: finMoisDernier } } }),
    prisma.reclamation.groupBy({ by: ['statut'], _count: { id: true } }),
    prisma.reclamation.groupBy({ by: ['affectationReclamation'], _count: { id: true } }),
    prisma.reclamation.groupBy({ by: ['categorie'], _count: { id: true } }),
    prisma.reclamation.groupBy({ by: ['communeId'], _count: { id: true } }),
    prisma.etablissement.count(),
    prisma.etablissement.count({ where: { isValide: true } }),
    prisma.etablissement.count({ where: { isPublie: true } }),
    prisma.etablissement.groupBy({ by: ['secteur'], _count: { id: true } }),
    prisma.etablissement.aggregate({ _avg: { noteMoyenne: true } }),
    prisma.evenement.count(),
    prisma.evenement.count({ where: { createdAt: { gte: debutMois } } }),
    prisma.evenement.count({ where: { dateDebut: { lte: now }, dateFin: { gte: now } } }),
    prisma.evenement.count({ where: { dateFin: { lt: now }, statut: { not: 'CLOTUREE' } } }),
    prisma.evenement.groupBy({ by: ['secteur'], _count: { id: true } }),
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: debutMois } } }),
    prisma.user.count({ where: { derniereConnexion: { gte: aujourdhui } } }),
    prisma.user.groupBy({ by: ['role'], _count: { id: true } }),
  ]);

  // Mapper les rôles
  const roleMap: Record<string, number> = {};
  parRole.forEach(r => { roleMap[r.role] = r._count.id; });

  const actualitesTotal = await prisma.actualite.count();
  const articlesTotal = await prisma.article.count();
  const suggestionsTotal = await prisma.suggestion.count();
  const suggestionsSoumises = await prisma.suggestion.count({ where: { statut: 'SOUMISE' } });

  const nouvelles = parStatut.find(s => s.statut === null)?._count.id || 0;
  
  const aAffecter = await prisma.reclamation.count({
    where: { statut: 'ACCEPTEE', affectationReclamation: 'NON_AFFECTEE' }
  });

  const enCoursTraitement = await prisma.reclamation.count({
    where: { statut: 'ACCEPTEE', affectationReclamation: 'AFFECTEE', dateResolution: null }
  });

  const reclamationsRejetees = parStatut.find(s => s.statut === 'REJETEE')?._count.id || 0;
  const reclamationsAcceptees = parStatut.find(s => s.statut === 'ACCEPTEE')?._count.id || 0;

  const variationUtilisateurs = utilisateursTotal > 0 
    ? Math.round((nouveauxCeMois / utilisateursTotal) * 100) 
    : 0;
  
  const variationReclamations = reclamationsMoisDernier > 0 
    ? Math.round(((reclamationsCeMois - reclamationsMoisDernier) / reclamationsMoisDernier) * 100)
    : reclamationsCeMois > 0 ? 100 : 0;

  return successResponse({
    stats: {
      reclamations: {
        total: reclamationsTotal,
        enAttente: nouvelles,
        aAffecter: aAffecter,
        enCours: enCoursTraitement,
        resolues: reclamationsAcceptees - aAffecter - enCoursTraitement,
        rejetees: reclamationsRejetees,
        ceMois: reclamationsCeMois,
        variation: variationReclamations,
      },
      etablissements: {
        total: etablissementsTotal,
        valides: etablissementsValides,
        noteMoyenne: etablissementsAvecNote._avg.noteMoyenne || 0,
      },
      utilisateurs: {
        total: utilisateursTotal,
        nouveaux: nouveauxCeMois,
        activeToday: actifAujourdhui,
        byRole: roleMap,
        variation: variationUtilisateurs,
      },
      actualites: actualitesTotal,
      articles: articlesTotal,
      suggestions: suggestionsTotal,
      suggestionsEnAttente: suggestionsSoumises,
    },
    charts: {
      evenementsParSecteur: evenementsParSecteur.map(s => ({ secteur: s.secteur, count: s._count.id })),
      reclamationsParStatut: [
        { statut: 'En attente', count: nouvelles, color: '#f59e0b' },
        { statut: 'À affecter', count: aAffecter, color: '#8b5cf6' },
        { statut: 'En cours', count: enCoursTraitement, color: '#3b82f6' },
        { statut: 'Résolues', count: reclamationsAcceptees - aAffecter - enCoursTraitement, color: '#10b981' },
        { statut: 'Rejetées', count: reclamationsRejetees, color: '#ef4444' },
      ].filter(s => s.count > 0),
    }
  });
});
