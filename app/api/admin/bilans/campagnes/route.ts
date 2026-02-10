import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { withErrorHandler } from '@/lib/api-handler';
import { UnauthorizedError, ForbiddenError } from '@/lib/exceptions';

// GET - Liste des campagnes terminées/clôturées avec bilans
export const GET = withErrorHandler(async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    throw new UnauthorizedError('Vous devez être connecté pour accéder aux bilans');
  }

  // Roles autorisés: ADMIN, SUPER_ADMIN, GOUVERNEUR
  const allowedRoles = ['ADMIN', 'SUPER_ADMIN', 'GOUVERNEUR'];
  if (!allowedRoles.includes(session.user.role || '')) {
    throw new ForbiddenError('Accès réservé aux administrateurs et gouverneurs');
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);

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

  return NextResponse.json({
    success: true,
    data,
    stats,
  });
});
