import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');

    const logs = await prisma.activityLog.findMany({
      take: limit,
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
    });

    const formattedLogs = logs.map((log) => ({
      id: log.id,
      action: log.action,
      entityType: log.entity,
      entityId: log.entityId,
      details: log.details ? JSON.stringify(log.details) : undefined,
      user: log.user ? {
        name: `${log.user.prenom} ${log.user.nom}`,
        email: log.user.email,
        role: log.user.role,
      } : { name: 'Système' },
      createdAt: log.createdAt.toISOString(),
    }));

    return NextResponse.json({ data: formattedLogs });
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'audit:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
