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

  if (!hasPermission) {
    const canValidate = await checkPermission(userId, 'evenements.validate') || 
                        await checkPermission(userId, 'actualites.validate');
    
    if (!canValidate) {
       throw new ForbiddenError('Accès non autorisé');
    }
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
    reclamations: reclamationsNonAffectees,
    suggestions: suggestionsEnAttente,
    activites: activitesEnAttente,
    validation: validationTotal,
    evenements: evenementsEnAttente,
    utilisateurs: 0,
    messages: messagesNonLus,
    etablissementRequests: etablissementsEnAttente,
  });
});
