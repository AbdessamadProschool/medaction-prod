import { NextRequest } from 'next/server';
import { safeParseInt } from '@/lib/utils/parse';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { withErrorHandler, successResponse } from '@/lib/api-handler';
import { UnauthorizedError, ForbiddenError } from '@/lib/exceptions';

export const GET = withErrorHandler(async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new UnauthorizedError();
  if (session.user.role !== 'SUPER_ADMIN') throw new ForbiddenError();

    const { searchParams } = new URL(request.url);
    const limit = safeParseInt(searchParams.get('limit') || '50', 0);
    const page = safeParseInt(searchParams.get('page') || '1', 1);
    const search = searchParams.get('search') || '';
    const action = searchParams.get('action') || '';
    const resourceType = searchParams.get('resourceType') || '';
    const success = searchParams.get('success');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const userId = searchParams.get('userId');

    const skip = (page - 1) * limit;

    // Construction du filtre
    const where: any = {};

    if (userId) {
      where.userId = safeParseInt(userId, 0);
    }

    if (search) {
      where.OR = [
        { action: { contains: search, mode: 'insensitive' } },
        { entity: { contains: search, mode: 'insensitive' } },
        { user: { nom: { contains: search, mode: 'insensitive' } } },
        { user: { prenom: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (action) where.action = action;
    if (resourceType) where.entity = resourceType;

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    const [logs, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        take: limit,
        skip,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              nom: true,
              prenom: true,
              email: true,
              role: true,
            },
          },
        },
      }),
      prisma.activityLog.count({ where }),
    ]);

    const formattedLogs = logs.map((log) => ({
      id: log.id,
      action: log.action,
      resourceType: log.entity,
      resourceId: log.entityId?.toString(),
      details: log.details,
      previousValue: (log.details as any)?.previousValue ? JSON.stringify((log.details as any).previousValue) : null,
      newValue: (log.details as any)?.newValue ? JSON.stringify((log.details as any).newValue) : null,
      ipAddress: log.ipAddress,
      success: true,
      user: log.user ? {
        name: `${log.user.prenom} ${log.user.nom}`,
        email: log.user.email,
        role: log.user.role,
      } : { name: 'Système' },
      createdAt: log.createdAt.toISOString(),
    }));

  return successResponse({ 
    data: formattedLogs,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  });
});
