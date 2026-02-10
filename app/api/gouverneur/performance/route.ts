import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { getEtabScore } from '@/lib/scoring'; // Import shared logic

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !['GOUVERNEUR', 'ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    // Récupérer tous les établissements avec leurs statistiques détaillées
    const etablissements = await prisma.etablissement.findMany({
      include: {
        commune: true,
        annexe: true,
        _count: {
          select: {
            evenements: { where: { statut: 'PUBLIEE' } },
            reclamations: true,
            actualites: { where: { statut: { in: ['PUBLIEE', 'VALIDEE'] } } },
            evaluations: true,
            abonnements: true,
            programmesActivites: { where: { statut: { not: 'BROUILLON' } } },
          }
        },
        evenements: {
          orderBy: { dateDebut: 'desc' },
          take: 5,
          select: { id: true, titre: true, statut: true, dateDebut: true }
        },
        actualites: {
          where: { isPublie: true },
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: { id: true, titre: true, createdAt: true }
        },
        reclamations: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: { user: { select: { nom: true, prenom: true } } }
        },
        programmesActivites: {
          orderBy: { date: 'desc' },
          take: 10,
          select: { id: true, titre: true, statut: true, rapportComplete: true, date: true }
        }
      }
    });

    // Calcul de la performance par établissement selon les NOUVEAUX critères du Gouverneur (via lib/scoring)
    const performanceData = etablissements.map(etab => {
      
      const score = getEtabScore({
          evenementsCount: etab._count.evenements,
          activitesCount: etab._count.programmesActivites,
          reclamationsCount: etab._count.reclamations,
          evaluationsCount: etab._count.evaluations,
          abonnementsCount: etab._count.abonnements,
          actualitesCount: etab._count.actualites,
          noteMoyenne: etab.noteMoyenne || 0
      });

      // Déterminer le niveau (Gamification)
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
          evenements: etab.evenements,
          actualites: etab.actualites,
          reclamations: etab.reclamations,
          activites: etab.programmesActivites,
        },
        stats: {
          evenements: etab._count.evenements,
          activites: etab._count.programmesActivites,
          reclamations: etab._count.reclamations,
          resolvedReclamations: 0, // Not strictly tracked in summary yet
          subscribers: etab._count.abonnements,
          note: etab.noteMoyenne,
          news: etab._count.actualites
        }
      };
    });

    // Trier par score décroissant et attribuer les rangs
    performanceData.sort((a, b) => b.score - a.score);
    performanceData.forEach((d, i) => {
      d.rank = i + 1;
    });

    return NextResponse.json({
      data: performanceData,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erreur performance:', error);
    return NextResponse.json({ error: 'Erreur serveur', details: error instanceof Error ? error.message : 'Unknown' }, { status: 500 });
  }
}
