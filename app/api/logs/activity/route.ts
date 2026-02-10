import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';

// GET - Liste des logs d'activité
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Seuls les admins peuvent voir les logs
    if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const userId = searchParams.get('userId');
    const action = searchParams.get('action');
    const entity = searchParams.get('entity');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const search = searchParams.get('search');

    // Construire les filtres
    const where: any = {};

    if (userId) {
      where.userId = parseInt(userId);
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

    return NextResponse.json({
      data: enrichedLogs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      stats: {
        last24h: stats,
        total
      }
    });

  } catch (error) {
    console.error('Erreur GET activity logs:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST - Créer un log d'activité (usage interne)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const log = await prisma.activityLog.create({
      data: {
        userId: body.userId || null,
        action: body.action,
        entity: body.entity,
        entityId: body.entityId || null,
        details: body.details || null,
        ipAddress: body.ipAddress || null,
        userAgent: body.userAgent || null,
      }
    });

    return NextResponse.json({ data: log }, { status: 201 });

  } catch (error) {
    console.error('Erreur POST activity log:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
