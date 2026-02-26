import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';

// GET - Exporter les logs d'activité
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Seuls les admins peuvent exporter les logs
    if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'csv';
    const userId = searchParams.get('userId');
    const action = searchParams.get('action');
    const entity = searchParams.get('entity');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const limit = parseInt(searchParams.get('limit') || '1000');

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

    const logs = await prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    // Récupérer les informations des utilisateurs
    const userIds = Array.from(new Set(logs.filter(l => l.userId).map(l => l.userId!)));
    const users = userIds.length > 0 
      ? await prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, nom: true, prenom: true, email: true }
        })
      : [];

    const usersMap = new Map(users.map(u => [u.id, u]));

    // Log l'export
    await prisma.activityLog.create({
      data: {
        userId: parseInt(session.user.id),
        action: 'EXPORT_LOGS',
        entity: 'ActivityLog',
        details: { count: logs.length, format, filters: { userId, action, entity, dateFrom, dateTo } },
      }
    });

    if (format === 'json') {
      // Export JSON
      const jsonData = logs.map(log => ({
        id: log.id,
        date: log.createdAt.toISOString(),
        utilisateur: log.userId ? usersMap.get(log.userId) : null,
        action: log.action,
        entite: log.entity,
        entiteId: log.entityId,
        details: log.details,
        ip: log.ipAddress,
      }));

      return new NextResponse(JSON.stringify(jsonData, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename=logs_export_${new Date().toISOString().split('T')[0]}.json`,
        },
      });
    } else {
      // Export CSV
      const csvHeader = 'ID;Date;Utilisateur;Email;Action;Entité;Entité ID;IP;Details\n';
      const csvRows = logs.map(log => {
        const user = log.userId ? usersMap.get(log.userId) : null;
        return [
          log.id,
          log.createdAt.toISOString(),
          user ? `${user.prenom} ${user.nom}` : 'Système',
          user?.email || '',
          log.action,
          log.entity,
          log.entityId || '',
          log.ipAddress || '',
          log.details ? JSON.stringify(log.details).replace(/;/g, ',') : '',
        ].join(';');
      });

      const csv = csvHeader + csvRows.join('\n');

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename=logs_export_${new Date().toISOString().split('T')[0]}.csv`,
        },
      });
    }

  } catch (error) {
    console.error('Erreur export logs:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
