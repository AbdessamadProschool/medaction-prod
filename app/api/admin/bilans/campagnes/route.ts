import { safeParseInt } from '@/lib/utils/parse';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { withErrorHandler, successResponse } from '@/lib/api-handler';
import { withPermission } from '@/lib/auth/api-guard';

// GET - Liste des campagnes terminées/clôturées avec bilans
export const GET = withPermission('bilans.read', withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(safeParseInt(searchParams.get('limit') || '50', 0), 100);

  // Campagnes terminées ou closes
  const campagnes = await prisma.campagne.findMany({
    where: {
      statut: { in: ['TERMINEE', 'ARCHIVEE'] },
    },
    select: {
      id: true,
      titre: true,
      description: true,
      statut: true,
      dateDebut: true,
      dateFin: true,
      objectifParticipations: true,
      nombreVues: true,
      bilanDescription: true,
      createdByUser: {
        select: { nom: true, prenom: true }
      },
      medias: {
        select: { id: true, urlPublique: true, type: true, nomFichier: true }
      },
      _count: {
        select: { participations: true }
      },
    },
    orderBy: { dateFin: 'desc' },
    take: limit,
  });

  // Transformer pour ajouter nombreParticipations
  const data = campagnes.map(c => ({
    id: c.id,
    titre: c.titre,
    description: c.description,
    statut: c.statut,
    dateDebut: c.dateDebut,
    dateFin: c.dateFin,
    objectifParticipations: c.objectifParticipations,
    nombreVues: c.nombreVues,
    nombreParticipations: c._count.participations,
    createdByUser: c.createdByUser,
    bilanDescription: c.bilanDescription,
    medias: c.medias,
  }));

  // Stats
  const stats = {
    total: data.length,
    totalParticipations: data.reduce((sum, c) => sum + c.nombreParticipations, 0),
    totalVues: data.reduce((sum, c) => sum + (c.nombreVues || 0), 0),
  };

  return successResponse({ data, stats }, 'Bilans des campagnes récupérés avec succès');
}));
