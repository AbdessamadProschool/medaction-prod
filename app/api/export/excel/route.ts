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

    let data: any[] = [];
    let headers: string[] = [];

    if (type === 'reclamations') {
        data = await prisma.reclamation.findMany({
            where: { createdAt: { gte: start, lte: end } },
            include: { commune: true, user: true }
        });
        headers = ['ID', 'Titre', 'Statut', 'Commune', 'Date Création', 'Utilisateur'];
        data = data.map(r => [
            r.id,
            `"${r.titre.replace(/"/g, '""')}"`, // Escape quotes for CSV
            r.statut || 'EN_ATTENTE',
            r.commune.nom,
            r.createdAt.toISOString(),
            r.user.email
        ]);
    } else if (type === 'evenements') {
        data = await prisma.evenement.findMany({
            where: { createdAt: { gte: start, lte: end } },
            include: { commune: true }
        });
        headers = ['ID', 'Titre', 'Statut', 'Commune', 'Date Début', 'Inscrits'];
        data = data.map(e => [
            e.id,
            `"${e.titre.replace(/"/g, '""')}"`,
            e.statut,
            e.commune.nom,
            e.dateDebut.toISOString(),
            e.nombreInscrits
        ]);
    }

    // Generate CSV
    const csvContent = [
        headers.join(','),
        ...data.map(row => row.join(','))
    ].join('\n');

    return new NextResponse(csvContent, {
        headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="export-${type}-${new Date().toISOString().split('T')[0]}.csv"`
        }
    });

  } catch (error) {
    console.error('Erreur export excel:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
