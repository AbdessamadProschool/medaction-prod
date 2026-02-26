import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const { type, startDate, endDate } = await request.json();
    const start = startDate ? new Date(startDate) : new Date(0);
    const end = endDate ? new Date(endDate) : new Date();

    let data: any = {};

    if (type === 'global') {
        const [reclamations, evenements, users] = await Promise.all([
            prisma.reclamation.count({ where: { createdAt: { gte: start, lte: end } } }),
            prisma.evenement.count({ where: { createdAt: { gte: start, lte: end } } }),
            prisma.user.count({ where: { createdAt: { gte: start, lte: end } } })
        ]);
        
        const reclamationsByStatus = await prisma.reclamation.groupBy({
            by: ['statut'],
            where: { createdAt: { gte: start, lte: end } },
            _count: { _all: true }
        });

        data = {
            title: 'Rapport Global d\'Activité',
            period: { start, end },
            stats: {
                reclamations,
                evenements,
                users
            },
            details: {
                reclamationsByStatus
            }
        };
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error('Erreur export pdf data:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
