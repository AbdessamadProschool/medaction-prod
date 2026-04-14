import { safeParseInt } from '@/lib/utils/parse';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { withErrorHandler, successResponse } from '@/lib/api-handler';
import { withPermission } from '@/lib/auth/api-guard';

// GET - Liste des activités avec rapport complété (bilans)
export const GET = withPermission('bilans.read', withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const secteur = searchParams.get('secteur');
  const etablissementId = searchParams.get('etablissementId');
  const limit = Math.min(safeParseInt(searchParams.get('limit') || '50', 0), 100);

  // Construire le filtre
  const where: any = {
    rapportComplete: true,
  };

  if (etablissementId) {
    where.etablissementId = safeParseInt(etablissementId, 0);
  }

  // Filtre par secteur via l'établissement
  let etablissementFilter: any = {};
  if (secteur) {
    etablissementFilter.secteur = secteur;
  }

  const activites = await prisma.programmeActivite.findMany({
    where: {
      ...where,
      etablissement: etablissementFilter,
    },
    select: {
      id: true,
      titre: true,
      description: true,
      typeActivite: true,
      date: true,
      heureDebut: true,
      heureFin: true,
      lieu: true,
      statut: true,
      participantsAttendus: true,
      presenceEffective: true,
      tauxPresence: true,
      commentaireDeroulement: true,
      difficultes: true,
      pointsPositifs: true,
      photosRapport: true,
      noteQualite: true,
      recommandations: true,
      rapportComplete: true,
      dateRapport: true,
      etablissement: {
        select: { 
          id: true, 
          nom: true, 
          nomArabe: true,
          secteur: true,
          commune: { select: { nom: true, nomArabe: true } }
        }
      },
      createdByUser: {
        select: { nom: true, prenom: true }
      },
    },
    orderBy: { dateRapport: 'desc' },
    take: limit,
  });

  // Stats
  const stats = {
    total: activites.length,
    totalParticipants: activites.reduce((sum, a) => sum + (a.presenceEffective || 0), 0),
    moyennePresence: activites.length > 0 
      ? (activites.reduce((sum, a) => sum + (a.tauxPresence || 0), 0) / activites.length).toFixed(1)
      : 0,
    parSecteur: {} as Record<string, number>,
    parTypeActivite: {} as Record<string, number>,
  };

  activites.forEach(a => {
    const secteurName = a.etablissement?.secteur || 'Général/Province';
    stats.parSecteur[secteurName] = (stats.parSecteur[secteurName] || 0) + 1;
    stats.parTypeActivite[a.typeActivite] = (stats.parTypeActivite[a.typeActivite] || 0) + 1;
  });

  return successResponse({ data: activites, stats }, 'Bilans des activités récupérés avec succès');
}));
