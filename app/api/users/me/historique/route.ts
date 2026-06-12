import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { safeParseInt } from '@/lib/utils/parse';
import { withErrorHandler, successResponse } from '@/lib/api-handler';
import { UnauthorizedError } from '@/lib/exceptions';

export const GET = withErrorHandler(async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    throw new UnauthorizedError("Non autorisé");
  }

  const userId = parseInt(session.user.id);

    const { searchParams } = new URL(request.url);
    const page = safeParseInt(searchParams.get('page'), 1);
    const limit = safeParseInt(searchParams.get('limit'), 30);
    const skip = (page - 1) * limit;

    const action = searchParams.get('action');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    const whereClause: any = { userId };

    if (action) {
      whereClause.action = action;
    }
    
    if (dateFrom || dateTo) {
      whereClause.createdAt = {};
      if (dateFrom) whereClause.createdAt.gte = new Date(dateFrom);
      if (dateTo) {
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999);
        whereClause.createdAt.lte = toDate;
      }
    }

    const [logs, total] = await Promise.all([
      prisma.activityLog.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.activityLog.count({ where: whereClause })
    ]);

  return successResponse({
    data: logs,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  });
});
