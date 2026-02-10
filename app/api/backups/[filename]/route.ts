
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { unlink, readFile } from 'fs/promises';
import { join } from 'path';
import fs from 'fs';

const BACKUP_DIR = join(process.cwd(), 'backups');

// GET /api/backups/[filename] - Télécharger un backup
export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
    }

    const { filename } = params;
    
    // Sécurité : valider le nom de fichier pour éviter le directory traversal
    if (!filename.match(/^backup-[\w.-]+\.json$/)) {
      return NextResponse.json({ error: 'Nom de fichier invalide' }, { status: 400 });
    }

    const filePath = join(BACKUP_DIR, filename);

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'Fichier non trouvé' }, { status: 404 });
    }

    const fileBuffer = await readFile(filePath);

    // Retourner le fichier
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

  } catch (error) {
    console.error('Erreur téléchargement backup:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE /api/backups/[filename] - Supprimer un backup
export async function DELETE(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
    }

    const { filename } = params;

    // Sécurité
    if (!filename.match(/^backup-[\w.-]+\.json$/)) {
      return NextResponse.json({ error: 'Nom de fichier invalide' }, { status: 400 });
    }

    const filePath = join(BACKUP_DIR, filename);

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'Fichier non trouvé' }, { status: 404 });
    }

    await unlink(filePath);

    // Log (Désactivé temporairement)
    /*
    await prisma.activityLog.create({
      data: {
        userId: parseInt(session.user.id),
        action: 'DELETE_BACKUP',
        entity: 'System',
        entityId: 0,
        details: { fileName: filename }
      }
    });
    */

    return NextResponse.json({ message: 'Backup supprimé avec succès' });

  } catch (error) {
    console.error('Erreur suppression backup:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
