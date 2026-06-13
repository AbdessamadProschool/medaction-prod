import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { Prisma } from '@prisma/client';

// ─── Types ────────────────────────────────────────────────────────────────────

type CsvRow = (string | number | null)[];

const VALID_EXPORT_TYPES = ['reclamations', 'evenements', 'dashboard'] as const;
type ExportType = (typeof VALID_EXPORT_TYPES)[number];

/** Maximum rows per CSV export — documented cap for memory safety */
const EXPORT_ROW_LIMIT = 1000;

// ─── CSV Utilities ─────────────────────────────────────────────────────────────

/** Wraps a string value in CSV-safe double quotes, escaping internal quotes */
function escapeCsvField(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

function buildCsvResponse(headers: string[], rows: CsvRow[], exportType: ExportType): NextResponse {
  const csvContent = '\uFEFF' + [
    headers.join(','),
    ...rows.map(row => row.join(',')),
  ].join('\n');

  return new NextResponse(csvContent, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="export-${exportType}-${new Date().toISOString().split('T')[0]}.csv"`,
    },
  });
}

// ─── Per-type data fetchers ────────────────────────────────────────────────────

async function fetchReclamationRows(start: Date, end: Date): Promise<{ headers: string[]; rows: CsvRow[] }> {
  const reclamations = await prisma.reclamation.findMany({
    take: EXPORT_ROW_LIMIT,
    where: { createdAt: { gte: start, lte: end } },
    include: { commune: true, user: true },
  });

  const headers = ['ID', 'Titre', 'Statut', 'Commune', 'Date Création', 'Utilisateur'];
  const rows: CsvRow[] = reclamations.map(r => [
    r.id,
    escapeCsvField(r.titre),
    r.statut ?? 'EN_ATTENTE',
    escapeCsvField(r.commune.nom),
    r.createdAt.toISOString(),
    escapeCsvField(r.user.email),
  ]);

  return { headers, rows };
}

async function fetchEvenementRows(start: Date, end: Date): Promise<{ headers: string[]; rows: CsvRow[] }> {
  const evenements = await prisma.evenement.findMany({
    take: EXPORT_ROW_LIMIT,
    where: { createdAt: { gte: start, lte: end } },
    include: { commune: true },
  });

  const headers = ['ID', 'Titre', 'Statut', 'Commune', 'Date Début', 'Inscrits'];
  const rows: CsvRow[] = evenements.map(e => [
    e.id,
    escapeCsvField(e.titre),
    e.statut ?? '',
    escapeCsvField(e.commune.nom),
    e.dateDebut.toISOString(),
    e.nombreInscrits,
  ]);

  return { headers, rows };
}

async function fetchDashboardRows(): Promise<{ headers: string[]; rows: CsvRow[] }> {
  const [usersCount, reclamationsCount, eventsCount, etablissementsCount] = await Promise.all([
    prisma.user.count(),
    prisma.reclamation.count(),
    prisma.evenement.count(),
    prisma.etablissement.count(),
  ]);

  const headers = ['Métrique', 'Valeur'];
  const rows: CsvRow[] = [
    ['Total Utilisateurs', usersCount],
    ['Total Réclamations', reclamationsCount],
    ['Total Événements', eventsCount],
    ['Total Établissements', etablissementsCount],
  ];

  return { headers, rows };
}

// ─── Route handler ─────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const { type, startDate, endDate } = await request.json();

    if (!VALID_EXPORT_TYPES.includes(type)) {
      return NextResponse.json(
        { error: `Type d'export invalide: ${type}. Valeurs acceptées: ${VALID_EXPORT_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    const exportType = type as ExportType;
    const start = startDate ? new Date(startDate) : new Date(0);
    const end = endDate ? new Date(endDate) : new Date();

    let headers: string[];
    let rows: CsvRow[];

    if (exportType === 'reclamations') {
      ({ headers, rows } = await fetchReclamationRows(start, end));
    } else if (exportType === 'evenements') {
      ({ headers, rows } = await fetchEvenementRows(start, end));
    } else {
      ({ headers, rows } = await fetchDashboardRows());
    }

    return buildCsvResponse(headers, rows, exportType);

  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      console.error('[export/csv] Prisma error', { code: error.code, meta: error.meta });
      return NextResponse.json({ error: 'Erreur base de données', code: error.code }, { status: 502 });
    }
    console.error('[export/csv] Unexpected error:', error);
    return NextResponse.json({ error: 'Erreur serveur interne' }, { status: 500 });
  }
}
