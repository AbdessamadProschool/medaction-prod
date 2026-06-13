import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { withErrorHandler, successResponse } from '@/lib/api-handler';
import { withPermission } from '@/lib/auth/api-guard';

export const GET = withPermission('stats.view.global', withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : new Date(new Date().setFullYear(new Date().getFullYear() - 1));
  const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : new Date();

  // 1. Stats globales
  const total = await prisma.reclamation.count({
    where: { createdAt: { gte: startDate, lte: endDate } }
  });

  // 2. Par statut
  const byStatus = await prisma.reclamation.groupBy({
    by: ['statut'],
    where: { createdAt: { gte: startDate, lte: endDate } },
    _count: { _all: true },
  });

  // 3. Par commune
  const byCommune = await prisma.reclamation.groupBy({
    by: ['communeId'],
    where: { createdAt: { gte: startDate, lte: endDate } },
    _count: { _all: true },
  });
  
  // Enrichir avec les noms de communes
  const communes = await prisma.commune.findMany({
    take: 100,
    where: { id: { in: byCommune.map(c => c.communeId) } },
    select: { id: true, nom: true }
  });
  
  const byCommuneWithNames = byCommune.map(item => ({
    commune: communes.find(c => c.id === item.communeId)?.nom || 'Inconnu',
    count: item._count._all
  }));

  // 4. Évolution mensuelle
  const allReclamations = await prisma.reclamation.findMany({
    take: 100,
    where: { createdAt: { gte: startDate, lte: endDate } },
    select: { createdAt: true }
  });

  const byMonth: Record<string, number> = {};
  allReclamations.forEach(r => {
    const month = r.createdAt.toISOString().slice(0, 7); // YYYY-MM
    byMonth[month] = (byMonth[month] || 0) + 1;
  });

  const evolution = Object.entries(byMonth)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, count]) => ({ date, count }));

  return successResponse({
    total,
    byStatus: byStatus.map(s => ({ statut: s.statut || 'EN_ATTENTE', count: s._count._all })),
    byCommune: byCommuneWithNames,
    evolution
  });
}));
