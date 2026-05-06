import { safeParseInt } from '@/lib/utils/parse';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { withErrorHandler, successResponse } from '@/lib/api-handler';
import { withPermission } from '@/lib/auth/api-guard';

/**
 * GET /api/admin/logs - Consulter les logs d'activité
 * 
 * 🔐 Permission requise : system.logs.view (ou SUPER_ADMIN bypass)
 */
export const GET = withPermission('system.logs.view', withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const page = safeParseInt(searchParams.get('page') || '1', 0);
  const limit = Math.min(safeParseInt(searchParams.get('limit') || '20', 0), 100);
  const search = searchParams.get('search') || '';
  const action = searchParams.get('action') || '';
  const entity = searchParams.get('entity') || '';
  const userId = searchParams.get('userId');

  const skip = (page - 1) * limit;

  // Construction du filtre
  const where: any = {};

  if (search) {
    where.OR = [
      { user: { nom: { contains: search, mode: 'insensitive' } } },
      { user: { prenom: { contains: search, mode: 'insensitive' } } },
      { user: { email: { contains: search, mode: 'insensitive' } } },
      { action: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (action) {
    where.action = action;
  }

  if (entity) {
    where.entity = entity;
  }

  if (userId) {
    where.userId = safeParseInt(userId, 0);
  }

  // Requête principale
  const [logs, total] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      take: limit,
      skip,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true,
            role: true,
            photo: true,
          }
        }
      }
    }),
    prisma.activityLog.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return successResponse({
    data: logs,
    pagination: {
      total,
      page,
      limit,
      totalPages,
    }
  });
}));
