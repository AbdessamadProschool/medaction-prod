import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';

interface Alert {
  id: string;
  type: string;
  titre: string;
  description: string;
  date?: string;
  priorite: 'HAUTE' | 'MOYENNE' | 'BASSE';
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !['GOUVERNEUR', 'ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const alerts: Alert[] = [];

    // 1. Événements passés mais non clôturés
    const pendingEvents = await prisma.evenement.findMany({
      where: {
        dateFin: { lt: new Date() },
        statut: { notIn: ['CLOTUREE', 'REJETEE'] }
      },
      take: 5,
      include: { etablissement: true }
    });

    pendingEvents.forEach(e => {
        alerts.push({
            id: `evt-${e.id}`,
            type: 'EVENT_CLOSURE',
            titre: `Clôture requise : ${e.titre}`,
            description: `L'événement à ${e.etablissement.nom} est terminé. Un bilan doit être publié.`,
            date: e.dateFin?.toISOString(),
            priorite: 'MOYENNE'
        });
    });

    // 2. Réclamations acceptées mais non affectées
    const unassignedRecs = await prisma.reclamation.findMany({
      where: {
        statut: 'ACCEPTEE',
        affectationReclamation: 'NON_AFFECTEE'
      },
      take: 5
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

    // 3. Activités terminées sans rapport
    const pendingReports = await prisma.programmeActivite.findMany({
      where: {
        statut: 'TERMINEE',
        rapportComplete: false
      },
      take: 5,
      include: { etablissement: true }
    });

    pendingReports.forEach(a => {
        alerts.push({
            id: `act-${a.id}`,
            type: 'ACTIVITY_REPORT',
            titre: `Rapport manquant : ${a.titre}`,
            description: `Activité à ${a.etablissement.nom} terminée. Le rapport de réalisation est manquant.`,
            date: a.date.toISOString(),
            priorite: 'MOYENNE'
        });
    });

    // Trier les alertes par priorité
    const priorityMap: Record<string, number> = { HAUTE: 0, MOYENNE: 1, BASSE: 2 };
    alerts.sort((a, b) => priorityMap[a.priorite] - priorityMap[b.priorite]);

    return NextResponse.json({ data: alerts });

  } catch (error) {
    console.error('Erreur alerts:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
