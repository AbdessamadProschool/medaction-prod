import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { withErrorHandler, successResponse } from '@/lib/api-handler';
import { UnauthorizedError, ForbiddenError } from '@/lib/exceptions';

// GET - Récupérer l'établissement lié à l'utilisateur autorité locale
export const GET = withErrorHandler(async () => {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    throw new UnauthorizedError('Non authentifié');
  }

  if (session.user.role !== 'AUTORITE_LOCALE') {
    throw new ForbiddenError('Accès refusé');
  }

    const userId = parseInt(session.user.id);

    // Chercher l'établissement lié à cette autorité locale
    // On suppose que l'autorité locale peut être liée via une affectation de réclamation
    // ou via un champ spécifique dans User (à adapter selon le schéma)
    
    // Récupérer la commune responsable
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        communeResponsable: {
          include: {
            _count: {
              select: { etablissements: true, reclamations: true }
            }
          }
        }
      }
    });

  if (!user?.communeResponsable) {
    return successResponse(null);
  }

    const commune = user.communeResponsable;

    // Mapper les données pour le frontend
    const data = {
      id: commune.id,
      nom: commune.nom,
      nomArabe: commune.nomArabe,
      secteur: 'ADMINISTRATION', // Pour l'icône
      type: 'Commune',
      province: commune.province,
      population: commune.population,
      superficie: commune.superficieKm2,
      description: `Commune de ${commune.nom}`,
      // Pas d'adresse/email/tel spécifiques à la commune dans le schéma actuel, on laisse vide ou on met des placeholders
      adresseComplete: `${commune.nom}, Province de ${commune.province}`,
      telephone: null,
      email: null,
      stats: {
        etablissements: commune._count.etablissements,
        reclamations: commune._count.reclamations,
      },
      services: ['Gestion Administrative', 'Urbanisme', 'Etat Civil', 'Voirie'] // Services génériques
    };

  return successResponse(data);
});
