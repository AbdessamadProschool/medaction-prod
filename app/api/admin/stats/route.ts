import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { withErrorHandler } from '@/lib/api-handler';
import { UnauthorizedError, ForbiddenError } from '@/lib/exceptions';

export const GET = withErrorHandler(async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    throw new UnauthorizedError('Vous devez être connecté pour accéder aux statistiques');
  }
  
  if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role || '')) {
    throw new ForbiddenError('Accès réservé aux administrateurs');
  }

  const { searchParams } = new URL(request.url);
  const periode = searchParams.get('periode') || '30j';

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

  // Réclamations
  const reclamationsTotal = await prisma.reclamation.count();
  const reclamationsCeMois = await prisma.reclamation.count({
    where: { createdAt: { gte: debutMois } }
  });
  const reclamationsMoisDernier = await prisma.reclamation.count({
    where: { 
      createdAt: { 
        gte: debutMoisDernier,
        lte: finMoisDernier
      } 
    }
  });

  const parStatut = await prisma.reclamation.groupBy({
    by: ['statut'],
    _count: { id: true }
  });

  const parAffectation = await prisma.reclamation.groupBy({
    by: ['affectationReclamation'],
    _count: { id: true }
  });

  const parCategorie = await prisma.reclamation.groupBy({
    by: ['categorie'],
    _count: { id: true }
  });

  const parCommuneRaw = await prisma.reclamation.groupBy({
    by: ['communeId'],
    _count: { id: true }
  });

  // Établissements
  const etablissementsTotal = await prisma.etablissement.count();
  const etablissementsValides = await prisma.etablissement.count({
    where: { isValide: true }
  });
  const etablissementsPublies = await prisma.etablissement.count({
    where: { isPublie: true }
  });

  const parSecteur = await prisma.etablissement.groupBy({
    by: ['secteur'],
    _count: { id: true }
  });

  const etablissementsAvecNote = await prisma.etablissement.aggregate({
    _avg: { noteMoyenne: true }
  });

  // Événements
  const evenementsTotal = await prisma.evenement.count();
  const evenementsCeMois = await prisma.evenement.count({
    where: { createdAt: { gte: debutMois } }
  });

  const evenementsEnCours = await prisma.evenement.count({
    where: {
      dateDebut: { lte: now },
      dateFin: { gte: now }
    }
  });

  const evenementsACloturer = await prisma.evenement.count({
    where: {
      dateFin: { lt: now },
      statut: { not: 'CLOTUREE' }
    }
  });

  const evenementsParSecteur = await prisma.evenement.groupBy({
    by: ['secteur'],
    _count: { id: true }
  });

  // Utilisateurs - Détail par rôle
  const utilisateursTotal = await prisma.user.count();
  const nouveauxCeMois = await prisma.user.count({
    where: { createdAt: { gte: debutMois } }
  });

  const actifAujourdhui = await prisma.user.count({
    where: { derniereConnexion: { gte: aujourdhui } }
  });

  const parRole = await prisma.user.groupBy({
    by: ['role'],
    _count: { id: true }
  });

  // Mapper les rôles
  const roleMap: Record<string, number> = {};
  parRole.forEach(r => {
    roleMap[r.role] = r._count.id;
  });

  // Contenu additionnel
  const actualitesTotal = await prisma.actualite.count();
  const articlesTotal = await prisma.article.count();
  const campagnesTotal = await prisma.campagne.count();
  const suggestionsTotal = await prisma.suggestion.count();

  const suggestionsSoumises = await prisma.suggestion.count({
    where: { statut: 'SOUMISE' }
  });

  // Calculer les statuts
  const nouvelles = parStatut.find(s => s.statut === null)?._count.id || 0;
  
  const aAffecter = await prisma.reclamation.count({
    where: {
      statut: 'ACCEPTEE',
      affectationReclamation: 'NON_AFFECTEE'
    }
  });

  const enCoursTraitement = await prisma.reclamation.count({
    where: {
      statut: 'ACCEPTEE',
      affectationReclamation: 'AFFECTEE',
      dateResolution: null
    }
  });

  const reclamationsRejetees = parStatut.find(s => s.statut === 'REJETEE')?._count.id || 0;
  const reclamationsAcceptees = parStatut.find(s => s.statut === 'ACCEPTEE')?._count.id || 0;

  // Calculer les variations
  const variationUtilisateurs = utilisateursTotal > 0 
    ? Math.round((nouveauxCeMois / utilisateursTotal) * 100) 
    : 0;
  
  const variationReclamations = reclamationsMoisDernier > 0 
    ? Math.round(((reclamationsCeMois - reclamationsMoisDernier) / reclamationsMoisDernier) * 100)
    : reclamationsCeMois > 0 ? 100 : 0;

  return NextResponse.json({
    success: true,
    stats: {
      reclamations: {
        total: reclamationsTotal,
        enAttente: nouvelles,
        aAffecter: aAffecter,
        enCours: enCoursTraitement,
        resolues: reclamationsAcceptees - aAffecter - enCoursTraitement,
        rejetees: reclamationsRejetees,
        urgentes: await prisma.reclamation.count({ where: { OR: [{ statut: null }, { isArchivee: false, statut: 'ACCEPTEE', dateResolution: null }] } }),
        ceMois: reclamationsCeMois,
        moisDernier: reclamationsMoisDernier,
        variation: variationReclamations,
      },
      etablissements: {
        total: etablissementsTotal,
        valides: etablissementsValides,
        publies: etablissementsPublies,
        noteMoyenne: etablissementsAvecNote._avg.noteMoyenne || 0,
        variation: 0,
      },
      evenements: {
        total: evenementsTotal,
        enCours: evenementsEnCours,
        aCloturer: evenementsACloturer,
        ceMois: evenementsCeMois,
        variation: 0,
      },
      utilisateurs: {
        total: utilisateursTotal,
        nouveaux: nouveauxCeMois,
        activeToday: actifAujourdhui,
        superAdmins: roleMap['SUPER_ADMIN'] || 0,
        admins: roleMap['ADMIN'] || 0,
        delegations: roleMap['DELEGATION'] || 0,
        autoritesLocales: roleMap['AUTORITE_LOCALE'] || 0,
        citoyens: roleMap['CITOYEN'] || 0,
        gouverneurs: roleMap['GOUVERNEUR'] || 0,
        variation: variationUtilisateurs,
      },
      actualites: actualitesTotal,
      articles: articlesTotal,
      campagnes: campagnesTotal,
      campagnesEnAttente: await prisma.campagne.count({ where: { statut: 'EN_ATTENTE' } }),
      campagnesBrouillon: await prisma.campagne.count({ where: { statut: 'BROUILLON' } }),
      suggestions: suggestionsTotal,
      suggestionsEnAttente: suggestionsSoumises,
    },
    charts: {
      evenementsParSecteur: evenementsParSecteur.map(s => ({ 
        secteur: s.secteur, 
        count: s._count.id 
      })),
      reclamationsParStatut: [
        { statut: 'En attente', count: nouvelles, color: '#f59e0b' },
        { statut: 'À affecter', count: aAffecter, color: '#8b5cf6' },
        { statut: 'En cours', count: enCoursTraitement, color: '#3b82f6' },
        { statut: 'Résolues', count: reclamationsAcceptees - aAffecter - enCoursTraitement, color: '#10b981' },
        { statut: 'Rejetées', count: reclamationsRejetees, color: '#ef4444' },
      ].filter(s => s.count > 0),
    },
    details: {
      reclamations: {
        parStatut: parStatut.map(s => ({ 
          statut: s.statut || 'EN_ATTENTE', 
          count: s._count.id 
        })),
        parCategorie: parCategorie.map(c => ({ 
          categorie: c.categorie, 
          count: c._count.id 
        })),
        parCommune: parCommuneRaw.map(c => ({ 
          commune: `Commune ${c.communeId}`, 
          count: c._count.id 
        })),
      },
      etablissements: {
        parSecteur: parSecteur.map(s => ({ 
          secteur: s.secteur, 
          count: s._count.id 
        })),
      },
      evenements: {
        parSecteur: evenementsParSecteur.map(s => ({ 
          secteur: s.secteur, 
          count: s._count.id 
        })),
      },
      utilisateurs: {
        parRole: parRole.map(r => ({ 
          role: r.role, 
          count: r._count.id 
        })),
      },
    },
  });
});
