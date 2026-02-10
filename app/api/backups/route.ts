
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { writeFile, readdir, stat, unlink } from 'fs/promises';
import { join } from 'path';

// Dossier de stockage des backups (relatif à la racine du projet ou /tmp)
// Note: En production (Vercel), on ne peut pas écrire sur le disque de façon persistante.
// Mais ici c'est un environnement local/VPS selon le contexte utilisateur.
// On va utiliser un dossier 'backups' à la racine pour l'instant.
const BACKUP_DIR = join(process.cwd(), 'backups');

// S'assurer que le dossier existe (nécessite Node.js fs)
import fs from 'fs';
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// GET /api/backups - Lister les backups
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
    }

    const files = await readdir(BACKUP_DIR);
    const backups = [];

    for (const file of files) {
      if (file.endsWith('.json')) {
        const stats = await stat(join(BACKUP_DIR, file));
        backups.push({
          name: file,
          size: stats.size,
          createdAt: stats.birthtime,
        });
      }
    }

    // Trier par date décroissante
    backups.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return NextResponse.json(backups);
  } catch (error) {
    console.error('Erreur GET backups:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST /api/backups - Créer un nouveau backup
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
    }

    // Récupérer les données
    // On extrait les tables principales
    // On extrait TOUTES les tables principales pour un backup complet
    const [
      settings, permissions,
      communes, annexes,
      users,
      etablissements,
      evenements, actualites, articles, campagnes,
      reclamations, suggestions,
      programmes, evaluations,
      userPermissions,
      medias
    ] = await Promise.all([
      prisma.systemSetting.findMany(),
      prisma.permission.findMany(),
      prisma.commune.findMany(),
      prisma.annexe.findMany(),
      prisma.user.findMany(),
      prisma.etablissement.findMany(),
      prisma.evenement.findMany(),
      prisma.actualite.findMany(),
      prisma.article.findMany(),
      prisma.campagne.findMany(),
      prisma.reclamation.findMany({ include: { historique: true } }),
      prisma.suggestion.findMany(),
      prisma.programmeActivite.findMany(),
      prisma.evaluation.findMany(),
      prisma.userPermission.findMany(),
      prisma.media.findMany(),
    ]);

    const backupData = {
      timestamp: new Date().toISOString(),
      version: '1.0',
      stats: {
        users: users.length,
        reclamations: reclamations.length,
        etablissements: etablissements.length,
        evenements: evenements.length,
        actualites: actualites.length,
        articles: articles.length,
        communes: communes.length,
        medias: medias.length,
      },
      data: {
        settings, permissions,
        communes, annexes,
        users,
        etablissements,
        evenements, actualites, articles, campagnes,
        reclamations, suggestions,
        programmes, evaluations,
        userPermissions,
        medias
      }
    };

    const fileName = `backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    const filePath = join(BACKUP_DIR, fileName);

    await writeFile(filePath, JSON.stringify(backupData, null, 2));

    // Log de l'activité (Désactivé temporairement - Schema locked)
    
    await prisma.activityLog.create({
      data: {
        userId: parseInt(session.user.id),
        action: 'CREATE_BACKUP',
        entity: 'System',
        entityId: 0,
        details: { fileName, stats: backupData.stats }
      }
    });
    

    return NextResponse.json({ 
      message: 'Backup créé avec succès',
      file: fileName,
      stats: backupData.stats
    });

  } catch (error) {
    console.error('Erreur POST backup:', error);
    return NextResponse.json({ error: 'Erreur lors de la création du backup' }, { status: 500 });
  }
}
