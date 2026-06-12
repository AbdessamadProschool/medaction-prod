import { safeParseInt } from '@/lib/utils/parse';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRoles } from '@/lib/auth/role-guard';
import { withErrorHandler, successResponse } from '@/lib/api-handler';
import { ForbiddenError } from '@/lib/exceptions';
import { ActivityLogger } from '@/lib/activity-logger';

// GET - Liste des logs d'activité
export const GET = withErrorHandler(async (request: NextRequest) => {
  const auth = await requireRoles(['ADMIN', 'SUPER_ADMIN']);
  if ('error' in auth) {
    throw new ForbiddenError('Accès non autorisé');
  }

    const { searchParams } = new URL(request.url);
    const page = safeParseInt(searchParams.get('page') || '1', 0);
    const limit = safeParseInt(searchParams.get('limit') || '50', 0);
    const userId = searchParams.get('userId');
    const action = searchParams.get('action');
    const entity = searchParams.get('entity');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const search = searchParams.get('search');

    // Construire les filtres
    const where: any = {};

    if (userId) {
      where.userId = safeParseInt(userId, 0);
    }

    if (action) {
      where.action = { contains: action, mode: 'insensitive' };
    }

    if (entity) {
      where.entity = { contains: entity, mode: 'insensitive' };
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        where.createdAt.lte = endDate;
      }
    }

    if (search) {
      where.OR = [
        { action: { contains: search, mode: 'insensitive' } },
        { entity: { contains: search, mode: 'insensitive' } },
        { ipAddress: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [logs, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.activityLog.count({ where })
    ]);

    // Récupérer les informations des utilisateurs
    const userIds = Array.from(new Set(logs.filter(l => l.userId).map(l => l.userId!)));
    const users = userIds.length > 0 
      ? await prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, nom: true, prenom: true, email: true, role: true }
        })
      : [];

    const usersMap = new Map(users.map(u => [u.id, u]));

    // Enrichir les logs avec les infos utilisateur
    const enrichedLogs = logs.map(log => ({
      ...log,
      user: log.userId ? usersMap.get(log.userId) : null,
    }));

    // Statistiques
    const stats = await prisma.activityLog.groupBy({
      by: ['action'],
      _count: { action: true },
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Dernières 24h
        }
      },
      orderBy: { _count: { action: 'desc' } },
      take: 5
    });

  return successResponse({
    data: enrichedLogs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    stats,
  });
});

// POST - Créer un log d'activité (usage interne)
export const POST = withErrorHandler(async (request: NextRequest) => {
  const auth = await requireRoles(['ADMIN', 'SUPER_ADMIN']);
  if ('error' in auth) {
    throw new ForbiddenError('Accès non autorisé');
  }

  const body = await request.json();
  
  await ActivityLogger.custom({
    userId: body.userId || null,
    action: body.action,
    entity: body.entity,
    entityId: body.entityId || 0,
    details: body.details || null,
    ipAddress: body.ipAddress || null,
    userAgent: body.userAgent || null,
  });

  return successResponse({ success: true }, 'Log créé avec succès');
});
