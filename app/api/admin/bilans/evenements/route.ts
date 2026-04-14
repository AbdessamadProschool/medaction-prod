import { safeParseInt } from '@/lib/utils/parse';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { withErrorHandler, successResponse } from '@/lib/api-handler';
import { withPermission } from '@/lib/auth/api-guard';

// GET - Liste des événements clôturés avec bilans
export const GET = withPermission('bilans.read', withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const secteur = searchParams.get('secteur');
  const communeId = searchParams.get('communeId');
  const limit = Math.min(safeParseInt(searchParams.get('limit') || '50', 0), 100);

  // Construire le filtre
  const where: any = {
    statut: 'CLOTUREE',
    bilanDescription: { not: null },
  };

  if (secteur) {
    where.secteur = secteur;
  }

  if (communeId) {
    where.communeId = safeParseInt(communeId, 0);
  }

  const evenements = await prisma.evenement.findMany({
    where,
    select: {
      id: true,
      titre: true,
      typeCategorique: true,
      secteur: true,
      dateDebut: true,
      dateFin: true,
      statut: true,
      nombreInscrits: true,
      bilanDescription: true,
      bilanNbParticipants: true,
      bilanDatePublication: true,
      etablissement: {
        select: { id: true, nom: true, nomArabe: true }
      },
      commune: {
        select: { id: true, nom: true, nomArabe: true }
      },
      createdByUser: {
        select: { nom: true, prenom: true }
      },
      medias: {
        select: { id: true, urlPublique: true, type: true, nomFichier: true }
      },
    },
    orderBy: { bilanDatePublication: 'desc' },
    take: limit,
  });

  // Stats
  const stats = {
    total: evenements.length,
    totalParticipants: evenements.reduce((sum, e) => sum + (e.bilanNbParticipants || e.nombreInscrits || 0), 0),
    parSecteur: {} as Record<string, number>,
  };

  evenements.forEach(e => {
    const secteurName = e.secteur || 'Général/Province';
    stats.parSecteur[secteurName] = (stats.parSecteur[secteurName] || 0) + 1;
  });

  return successResponse({
    data: evenements,
    stats,
  }, 'Bilans des événements récupérés avec succès', 200);
}));
