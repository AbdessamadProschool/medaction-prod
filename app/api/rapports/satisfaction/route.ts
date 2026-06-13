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

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate')
      ? new Date(searchParams.get('startDate')!)
      : new Date(new Date().setFullYear(new Date().getFullYear() - 1));
    const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : new Date();

    // Stats globales des évaluations filtrées sur la période
    const stats = await prisma.evaluation.aggregate({
      where: { createdAt: { gte: startDate, lte: endDate } },
      _avg: { noteGlobale: true },
      _count: { _all: true },
    });

    // Taux de résolution des réclamations sur la période
    const totalReclamations = await prisma.reclamation.count({
      where: { createdAt: { gte: startDate, lte: endDate } },
    });
    const resolvedReclamations = await prisma.reclamation.count({
      where: { createdAt: { gte: startDate, lte: endDate }, dateResolution: { not: null } },
    });
    const resolutionRate = totalReclamations > 0
      ? Math.round((resolvedReclamations / totalReclamations) * 100)
      : 0;

    // Top 5 établissements les mieux notés
    const topEtablissements = await prisma.etablissement.findMany({
      where: { nombreEvaluations: { gt: 0 } },
      orderBy: { noteMoyenne: 'desc' },
      take: 5,
      select: { nom: true, noteMoyenne: true, nombreEvaluations: true, secteur: true },
    });

    // Top 5 établissements les moins bien notés
    const flopEtablissements = await prisma.etablissement.findMany({
      where: { nombreEvaluations: { gt: 0 } },
      orderBy: { noteMoyenne: 'asc' },
      take: 5,
      select: { nom: true, noteMoyenne: true, nombreEvaluations: true, secteur: true },
    });

    return NextResponse.json({
      global: {
        average: stats._avg.noteGlobale || 0,
        total: stats._count._all,
        resolutionRate,
      },
      topEtablissements,
      flopEtablissements,
    });

  } catch (error) {
    console.error('Erreur rapport satisfaction:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
