import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { withErrorHandler } from '@/lib/api-handler';
import { UnauthorizedError, ForbiddenError } from '@/lib/exceptions';

// GET - Liste des événements clôturés avec bilans
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
  const secteur = searchParams.get('secteur');
  const communeId = searchParams.get('communeId');
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);

  // Construire le filtre
  const where: any = {
    statut: 'CLOTUREE',
    bilanDescription: { not: null },
  };

  if (secteur) {
    where.secteur = secteur;
  }

  if (communeId) {
    where.communeId = parseInt(communeId);
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
        select: { id: true, nom: true }
      },
      commune: {
        select: { id: true, nom: true }
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
    stats.parSecteur[e.secteur] = (stats.parSecteur[e.secteur] || 0) + 1;
  });

  return NextResponse.json({
    success: true,
    data: evenements,
    stats,
  });
});
