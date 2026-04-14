import { safeParseInt } from '@/lib/utils/parse';
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { getEtabScore } from '@/lib/scoring';
import { withErrorHandler, successResponse } from '@/lib/api-handler';
import { ForbiddenError, UnauthorizedError } from '@/lib/exceptions';

export const GET = withErrorHandler(async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    throw new UnauthorizedError('Accès refusé');
  }

  if (!['GOUVERNEUR', 'ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
    throw new ForbiddenError('Accès refusé');
  }

  // Parse pagination params
  const { searchParams } = new URL(request.url);
  const page = Math.max(safeParseInt(searchParams.get('page') || '1', 0), 1);
  const limit = Math.min(Math.max(safeParseInt(searchParams.get('limit') || '20', 0), 1), 100);
  const skip = (page - 1) * limit;

  // Récupérer tous les établissements et le count en Promise.all
  const [etablissements, totalCount] = await Promise.all([
    prisma.etablissement.findMany({
      skip,
      take: limit,
      include: {
        commune: true,
        annexe: true,
        _count: {
          select: {
            evenementsOrganises: true,
            reclamations: true,
            actualites: true,
            evaluations: true,
            abonnements: true,
            activitesOrganisees: true,
          }
        },
        evenementsOrganises: {
          orderBy: { dateDebut: 'desc' },
          take: 5,
          select: { 
            id: true, titre: true, statut: true, dateDebut: true, dateFin: true, 
            typeCategorique: true, description: true, bilanDescription: true,
            bilanNbParticipants: true
          }
        },
        actualites: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        reclamations: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: { 
            user: { select: { nom: true, prenom: true } },
            commune: { select: { nom: true } }
          }
        },
        activitesOrganisees: {
          orderBy: { date: 'desc' },
          take: 5,
          select: { id: true, titre: true, statut: true, rapportComplete: true, date: true, description: true }
        }
      }
    }),
    prisma.etablissement.count()
  ]);

  // Calcul de la performance par établissement
  const performanceData = etablissements.map(etab => {
    
    const score = getEtabScore({
        evenementsCount: etab._count.evenementsOrganises,
        activitesCount: etab._count.activitesOrganisees,
        reclamationsCount: etab._count.reclamations,
        evaluationsCount: etab._count.evaluations,
        abonnementsCount: etab._count.abonnements,
        actualitesCount: etab._count.actualites,
        noteMoyenne: etab.noteMoyenne || 0
    });

    // Déterminer le niveau
    let level = "Bronze";
    if (score > 400) level = "Diamant";
    else if (score > 250) level = "Or";
    else if (score > 100) level = "Argent";

    const style = {
      color: level === "Diamant" ? "text-blue-600" : level === "Or" ? "text-yellow-600" : level === "Argent" ? "text-slate-400" : "text-orange-600",
      bgColor: level === "Diamant" ? "bg-blue-100" : level === "Or" ? "bg-yellow-100" : level === "Argent" ? "bg-slate-100" : "bg-orange-100"
    };

    return {
      id: etab.id,
      nom: etab.nom,
      secteur: etab.secteur,
      commune: etab.commune?.nom,
      annexe: etab.annexe?.nom,
      communeId: etab.communeId,
      annexeId: etab.annexeId,
      score: Math.max(0, Math.round(score)),
      level,
      style,
      rank: 0,
      presentation: {
        evenements: etab.evenementsOrganises,
        actualites: etab.actualites,
        reclamations: etab.reclamations,
        activites: etab.activitesOrganisees,
      },
      stats: {
        evenements: etab._count.evenementsOrganises,
        activites: etab._count.activitesOrganisees,
        reclamations: etab._count.reclamations,
        actualites: etab._count.actualites,
        evaluations: etab._count.evaluations,
        abonnements: etab._count.abonnements,
        resolvedReclamations: etab.reclamations.filter((r: { statut: string | null }) => r.statut === 'ACCEPTEE').length, 
        subscribers: etab._count.abonnements,
        note: etab.noteMoyenne || 0,
      }
    };
  });

  // Trier par score décroissant et attribuer les rangs
  performanceData.sort((a, b) => b.score - a.score);
  performanceData.forEach((d, i) => {
    d.rank = i + 1;
  });

  return successResponse({
    data: performanceData,
    pagination: {
      page,
      limit,
      total: totalCount,
      totalPages: Math.ceil(totalCount / limit),
    },
    timestamp: new Date().toISOString()
  });
});
