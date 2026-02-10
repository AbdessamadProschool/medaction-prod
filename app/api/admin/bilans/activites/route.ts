import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { withErrorHandler } from '@/lib/api-handler';
import { UnauthorizedError, ForbiddenError } from '@/lib/exceptions';

// GET - Liste des activités avec rapport complété (bilans)
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
  const etablissementId = searchParams.get('etablissementId');
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);

  // Construire le filtre
  const where: any = {
    rapportComplete: true,
  };

  if (etablissementId) {
    where.etablissementId = parseInt(etablissementId);
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
      // Rapport
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
      // Relations
      etablissement: {
        select: { 
          id: true, 
          nom: true, 
          secteur: true,
          commune: { select: { nom: true } }
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
    const secteurName = a.etablissement.secteur;
    stats.parSecteur[secteurName] = (stats.parSecteur[secteurName] || 0) + 1;
    stats.parTypeActivite[a.typeActivite] = (stats.parTypeActivite[a.typeActivite] || 0) + 1;
  });

  return NextResponse.json({
    success: true,
    data: activites,
    stats,
  });
});
