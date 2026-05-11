import { safeParseInt } from '@/lib/utils/parse';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRoles } from '@/lib/auth/role-guard';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireRoles(['SUPER_ADMIN']);
    if ('error' in auth) return auth.error;

    const { searchParams } = new URL(request.url);
    const limit = safeParseInt(searchParams.get('limit') || '50', 0);
    const page = safeParseInt(searchParams.get('page') || '1', 1);
    const search = searchParams.get('search') || '';
    const action = searchParams.get('action') || '';
    const resourceType = searchParams.get('resourceType') || '';
    const success = searchParams.get('success');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    const skip = (page - 1) * limit;

    // Construction du filtre
    const where: any = {};

    if (search) {
      where.OR = [
        { action: { contains: search, mode: 'insensitive' } },
        { resourceType: { contains: search, mode: 'insensitive' } },
        { resourceId: { contains: search, mode: 'insensitive' } },
        { user: { nom: { contains: search, mode: 'insensitive' } } },
        { user: { prenom: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (action) where.action = action;
    if (resourceType) where.resourceType = resourceType;
    if (success !== null) where.success = success === 'true';

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
      prisma.auditLog.findMany({
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
      prisma.auditLog.count({ where }),
    ]);

    const formattedLogs = logs.map((log) => ({
      id: log.id,
      action: log.action,
      resourceType: log.resourceType,
      resourceId: log.resourceId,
      details: log.details,
      previousValue: log.previousValue,
      newValue: log.newValue,
      ipAddress: log.ipAddress,
      success: log.success,
      user: log.user ? {
        name: `${log.user.prenom} ${log.user.nom}`,
        email: log.user.email,
        role: log.user.role,
      } : { name: 'Système' },
      createdAt: log.createdAt.toISOString(),
    }));

    return NextResponse.json({ 
      data: formattedLogs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'audit:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
