import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { withErrorHandler, successResponse } from '@/lib/api-handler';
import { ForbiddenError, UnauthorizedError } from '@/lib/exceptions';

// GET - Obtenir les compteurs d'éléments en attente pour les badges admin
export const GET = withErrorHandler(async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    throw new UnauthorizedError('Non autorisé');
  }

  const userId = Number(session.user.id);
  const { checkPermission } = await import("@/lib/permissions");
  const hasPermission = await checkPermission(userId, 'stats.view.global');

  const canValidateEvents = await checkPermission(userId, 'evenements.validate');
  const canValidateNews = await checkPermission(userId, 'actualites.validate');
  const canValidateEtab = await checkPermission(userId, 'etablissements.validate');
  const canValidateProgs = await checkPermission(userId, 'programmes.validate');
  const canViewReclamations = await checkPermission(userId, 'reclamations.view');
  const canViewSuggestions = await checkPermission(userId, 'suggestions.view');
  
  const canValidate = canValidateEvents || canValidateNews || canValidateEtab || canValidateProgs;

  if (!hasPermission && !canValidate) {
    throw new ForbiddenError('Accès non autorisé');
  }

  // Récupérer les compteurs en parallèle
  const [
    reclamationsNonAffectees,
    suggestionsEnAttente,
    activitesEnAttente,
    evenementsEnAttente,
    actualitesEnAttente,
    articlesEnAttente,
    messagesNonLus,
    etablissementsEnAttente,
  ] = await Promise.all([
    // Réclamations non affectées
    prisma.reclamation.count({
      where: { affecteeAAutoriteId: null, isArchivee: false }
    }),
    // Suggestions en attente
    prisma.suggestion.count({
      where: { statut: { in: ['SOUMISE', 'EN_EXAMEN'] } }
    }),
    // Activités en attente de validation
    prisma.programmeActivite.count({
      where: { statut: 'EN_ATTENTE_VALIDATION' }
    }),
    // Événements en attente de validation
    prisma.evenement.count({
      where: { statut: 'EN_ATTENTE_VALIDATION' }
    }),
    // Actualités en attente de validation
    prisma.actualite.count({
      where: { statut: 'EN_ATTENTE_VALIDATION' }
    }),
    // Articles non publiés
    prisma.article.count({
      where: { isPublie: false, isMisEnAvant: false }
    }),
    // Messages non lus
    (prisma as any).contactMessage.count({
      where: { isRead: false }
    }).catch(() => 0),
    // Demandes de modification d'établissements
    prisma.demandeModificationEtablissement.count({
      where: { statut: 'EN_ATTENTE_VALIDATION' }
    }),
  ]);

  const validationTotal = evenementsEnAttente + actualitesEnAttente + articlesEnAttente;

  return successResponse({
    reclamations: (hasPermission || canViewReclamations) ? reclamationsNonAffectees : 0,
    suggestions: (hasPermission || canViewSuggestions) ? suggestionsEnAttente : 0,
    activites: (hasPermission || canValidateProgs) ? activitesEnAttente : 0,
    validation: (hasPermission || canValidateNews || canValidateEvents) ? validationTotal : 0,
    evenements: (hasPermission || canValidateEvents) ? evenementsEnAttente : 0,
    utilisateurs: 0,
    messages: hasPermission ? messagesNonLus : 0,
    etablissementRequests: (hasPermission || canValidateEtab) ? etablissementsEnAttente : 0,
  });
});
