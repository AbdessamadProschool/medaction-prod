import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { ActivityLogger } from '@/lib/activity-logger';
import { withErrorHandler, successResponse } from '@/lib/api-handler';

export async function POST(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get('authorization');
  const cronHeader = req.headers.get('x-cron-secret');
  
  const isCron = (cronSecret && (authHeader === `Bearer ${cronSecret}` || cronHeader === cronSecret));

  if (!isCron) {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new Response(JSON.stringify({ error: 'Non autorisé' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }
    
    const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(session.user.role);
    const isDelegation = session.user.role === 'DELEGATION';
    if (!isAdmin && !isDelegation) {
      return new Response(JSON.stringify({ error: 'Accès refusé' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
    }
  }

  return withErrorHandler(async () => {
    const now = new Date();
    
    // Trouver les campagnes non clôturées dont la date de fin est dépassée
    const expiredCampagnes = await prisma.campagne.findMany({
      where: {
        dateFin: { lt: now },
        statut: { notIn: ['CLOTUREE', 'ARCHIVEE'] }
      },
      select: { id: true, titre: true, createdBy: true }
    });

    let closedCount = 0;
    for (const campagne of expiredCampagnes) {
      await prisma.campagne.update({
        where: { id: campagne.id },
        data: {
          statut: 'CLOTUREE',
          isActive: false
        }
      });

      // Enregistrer dans l'audit log
      await ActivityLogger.custom({
        action: 'CLOTURE_CAMPAGNE',
        entity: 'Campagne',
        entityId: campagne.id,
        userId: campagne.createdBy,
        details: {
          titre: campagne.titre,
          autoClosed: true,
          reason: 'Date de fin dépassée'
        }
      });
      closedCount++;
    }

    return successResponse({ closedCount }, `${closedCount} campagnes expirées clôturées automatiquement`);
  })(req, {});
}
