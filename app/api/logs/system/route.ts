import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { SystemLogger } from '@/lib/system-logger';

// GET - Liste des logs système (dynamiques, en mémoire)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Seul SUPER_ADMIN peut voir les logs système
    if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const level = searchParams.get('level') as 'info' | 'warning' | 'error' | 'debug' | undefined;
    const source = searchParams.get('source') || undefined;

    // Get logs from dynamic buffer
    const { logs, total } = SystemLogger.getFiltered({
      level: level || undefined,
      source,
      limit,
      page
    });

    // Format for API response
    const formattedLogs = logs.map(log => ({
      id: log.id,
      timestamp: log.timestamp.toISOString(),
      level: log.level,
      message: log.message,
      source: log.source,
      details: log.details,
    }));

    // Get stats
    const stats = SystemLogger.getStats();

    return NextResponse.json({
      data: formattedLogs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      stats,
      // Info about buffer status
      bufferInfo: {
        currentSize: stats.total,
        maxSize: 500,
        note: 'Logs en mémoire uniquement (ring buffer) - les plus anciens sont automatiquement supprimés'
      }
    });

  } catch (error) {
    console.error('Erreur GET system logs:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST - Ajouter un log système manuellement (pour tests ou actions admin)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
    }

    const body = await request.json();
    const { level, source, message, details } = body;

    if (!level || !source || !message) {
      return NextResponse.json(
        { error: 'level, source et message sont requis' },
        { status: 400 }
      );
    }

    // Add log entry
    const logEntry = SystemLogger[level as 'info' | 'warning' | 'error' | 'debug'](
      source,
      message,
      details
    );

    return NextResponse.json({
      success: true,
      data: logEntry,
      message: 'Log ajouté avec succès'
    });

  } catch (error) {
    console.error('Erreur POST system logs:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE - Vider le buffer de logs
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
    }

    SystemLogger.clear();
    SystemLogger.info('system', 'Buffer de logs vidé par l\'administrateur', {
      clearedBy: session.user.email
    });

    return NextResponse.json({
      success: true,
      message: 'Logs système vidés avec succès'
    });

  } catch (error) {
    console.error('Erreur DELETE system logs:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
