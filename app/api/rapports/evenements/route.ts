import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { withErrorHandler, successResponse } from '@/lib/api-handler';
import { withPermission } from '@/lib/auth/api-guard';

export const GET = withPermission('stats.view.global', withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : new Date(new Date().setFullYear(new Date().getFullYear() - 1));
  const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : new Date();

  // 1. Stats globales
  const total = await prisma.evenement.count({
    where: { createdAt: { gte: startDate, lte: endDate } }
  });

  // 2. Par statut
  const byStatus = await prisma.evenement.groupBy({
    by: ['statut'],
    where: { createdAt: { gte: startDate, lte: endDate } },
    _count: { _all: true },
  });

  // 3. Par catégorie (typeCategorique)
  const byCategory = await prisma.evenement.groupBy({
    by: ['typeCategorique'],
    where: { createdAt: { gte: startDate, lte: endDate } },
    _count: { _all: true },
  });

  // 4. Participation (somme des inscrits)
  const participationStats = await prisma.evenement.aggregate({
    where: { createdAt: { gte: startDate, lte: endDate } },
    _sum: { nombreInscrits: true, nombreVues: true },
    _avg: { nombreInscrits: true }
  });

  return successResponse({
    total,
    byStatus: byStatus.map(s => ({ statut: s.statut, count: s._count._all })),
    byCategory: byCategory.map(c => ({ category: c.typeCategorique, count: c._count._all })),
    participation: {
      totalInscrits: participationStats._sum.nombreInscrits || 0,
      totalVues: participationStats._sum.nombreVues || 0,
      avgInscrits: Math.round(participationStats._avg.nombreInscrits || 0)
    }
  });
}));
