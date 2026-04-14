import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { withErrorHandler, successResponse } from '@/lib/api-handler';
import { ForbiddenError, UnauthorizedError } from '@/lib/exceptions';

interface Alert {
  id: string;
  type: string;
  titre: string;
  description: string;
  date?: string;
  priorite: 'HAUTE' | 'MOYENNE' | 'BASSE';
}

export const GET = withErrorHandler(async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    throw new UnauthorizedError('Non authentifié');
  }

  if (!['GOUVERNEUR', 'ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
    throw new ForbiddenError('Accès refusé');
  }

  const [pendingEvents, unassignedRecs, pendingReports, upcomingEvents] = await Promise.all([
    // 1. Événements passés mais non clôturés
    prisma.evenement.findMany({
      where: {
        dateFin: { lt: new Date() },
        statut: { notIn: ['CLOTUREE', 'REJETEE'] }
      },
      take: 5,
      include: { etablissement: { select: { nom: true } } }
    }),
    // 2. Réclamations acceptées mais non affectées
    prisma.reclamation.findMany({
      where: {
        statut: 'ACCEPTEE',
        affectationReclamation: 'NON_AFFECTEE'
      },
      take: 5
    }),
    // 3. Activités terminées sans rapport
    prisma.programmeActivite.findMany({
      where: {
        statut: 'TERMINEE',
        rapportComplete: false
      },
      take: 5,
      include: { etablissement: { select: { nom: true } } }
    }),
    // 4. Événements à venir (Flash Info)
    prisma.evenement.findMany({
      where: {
        dateDebut: { gte: new Date() },
        statut: 'PUBLIEE'
      },
      take: 3,
      include: { etablissement: { select: { nom: true } } }
    })
  ]);

  const alerts: Alert[] = [];

  pendingEvents.forEach(e => {
    alerts.push({
      id: `evt-${e.id}`,
      type: 'EVENT_CLOSURE',
      titre: `Clôture requise : ${e.titre}`,
      description: `L'événement ${e.etablissement ? 'à ' + e.etablissement.nom : 'provincial'} est terminé. Un bilan doit être publié.`,
      date: e.dateFin?.toISOString(),
      priorite: 'MOYENNE'
    });
  });

  unassignedRecs.forEach(r => {
    alerts.push({
      id: `rec-${r.id}`,
      type: 'RECLAMATION_ASSIGN',
      titre: `Affectation urgente : ${r.titre}`,
      description: `Réclamation acceptée en attente d'affectation à une autorité locale.`,
      date: r.updatedAt.toISOString(),
      priorite: 'HAUTE'
    });
  });

  pendingReports.forEach(a => {
    alerts.push({
      id: `act-${a.id}`,
      type: 'ACTIVITY_REPORT',
      titre: `Rapport manquant : ${a.titre}`,
      description: `Activité ${a.etablissement ? 'à ' + a.etablissement.nom : 'provinciale'} terminée. Le rapport de réalisation est manquant.`,
      priorite: 'MOYENNE'
    });
  });

  upcomingEvents.forEach(e => {
    alerts.push({
      id: `upc-${e.id}`,
      type: 'EVENT_UPCOMING',
      titre: `Événement à venir : ${e.titre}`,
      description: `${e.etablissement?.nom || 'Province'} - Début le ${e.dateDebut.toLocaleDateString()}`,
      date: e.dateDebut.toISOString(),
      priorite: 'BASSE'
    });
  });

  // Trier les alertes par priorité
  const priorityMap: Record<string, number> = { HAUTE: 0, MOYENNE: 1, BASSE: 2 };
  alerts.sort((a, b) => priorityMap[a.priorite] - priorityMap[b.priorite]);

  return successResponse(alerts);
});
