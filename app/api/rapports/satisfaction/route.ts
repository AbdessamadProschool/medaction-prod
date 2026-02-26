import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    // Stats globales des évaluations
    const stats = await prisma.evaluation.aggregate({
        _avg: { noteGlobale: true },
        _count: { _all: true }
    });

    // Top 5 établissements les mieux notés
    const topEtablissements = await prisma.etablissement.findMany({
        orderBy: { noteMoyenne: 'desc' },
        take: 5,
        select: { nom: true, noteMoyenne: true, nombreEvaluations: true }
    });

    // Top 5 établissements les moins bien notés (avec au moins 1 évaluation)
    const flopEtablissements = await prisma.etablissement.findMany({
        where: { nombreEvaluations: { gt: 0 } },
        orderBy: { noteMoyenne: 'asc' },
        take: 5,
        select: { nom: true, noteMoyenne: true, nombreEvaluations: true }
    });

    return NextResponse.json({
      global: {
          average: stats._avg.noteGlobale || 0,
          total: stats._count._all
      },
      topEtablissements,
      flopEtablissements
    });

  } catch (error) {
    console.error('Erreur rapport satisfaction:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
