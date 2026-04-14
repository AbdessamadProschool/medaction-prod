import { PrismaClient } from '@prisma/client';
import { exec } from 'child_process';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { promisify } from 'util';
import archiver from 'archiver';
import * as fs from 'fs';

const execAsync = promisify(exec);
const prisma = new PrismaClient();

// CONFIG
const BACKUP_ROOT = process.env.BACKUP_DIR || join(process.cwd(), 'backups');
const SECONDARY_BACKUP_ROOT = process.env.SECONDARY_BACKUP_DIR; // Optionnel : deuxième disque
const UPLOAD_DIR = process.env.UPLOAD_DIR || join(process.cwd(), 'public', 'uploads');
const DB_URL = process.env.DATABASE_URL;

async function backup() {
  console.log('🚀 Starting System Backup...');
  
  if (!existsSync(BACKUP_ROOT)) {
    mkdirSync(BACKUP_ROOT, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupName = `backup-${timestamp}`;
  const backupDir = join(BACKUP_ROOT, backupName);
  mkdirSync(backupDir);

  // 1. DATABASE BACKUP
  console.log('📊 Backing up Database...');
  try {
    const dbUrl = new URL(DB_URL!);
    const dbUser = dbUrl.username;
    const dbName = dbUrl.pathname.substring(1);
    
    // Essayer pg_dump local d'abord
    const localDumpCommand = `pg_dump "${DB_URL}" -F c -b -f "${join(backupDir, 'database.dump')}"`;
    
    try {
      await execAsync(localDumpCommand);
      console.log('✅ Database backup complete (Local).');
    } catch (localError) {
      console.log('⚠️ Local pg_dump failed. Trying Docker fallback...');
      
      // Fallback Docker (Linux ou Windows avec Docker Desktop)
      // On utilise le nom du conteneur standard 'medaction-postgres'
      const dockerCommand = process.platform === 'win32'
          ? `docker exec medaction-postgres pg_dump -U ${dbUser} ${dbName} -F c -b > "${join(backupDir, 'database.dump')}"`
          : `docker exec medaction-postgres pg_dump -U ${dbUser} ${dbName} -F c -b > "${join(backupDir, 'database.dump')}"`;
          
      await execAsync(dockerCommand);
      console.log('✅ Database backup complete (via Docker).');
    }
  } catch (error) {
    console.error('❌ Database backup failed:', error);
  }

  // 2. FILES BACKUP
  console.log('📂 Backing up Uploads...');
  if (existsSync(UPLOAD_DIR)) {
    const zipPath = join(backupDir, 'uploads.zip');
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    const promise = new Promise((resolve, reject) => {
      output.on('close', resolve);
      archive.on('error', reject);
    });

    archive.pipe(output);
    archive.directory(UPLOAD_DIR, false);
    await archive.finalize();
    await promise;
    console.log(`✅ Uploads backup complete.`);
  } else {
    console.log('⚠️ No uploads directory found.');
  }

  // 3. SECONDARY DISK MIRRORING (Si configuré)
  if (SECONDARY_BACKUP_ROOT && existsSync(SECONDARY_BACKUP_ROOT)) {
    console.log(`💾 Mirroring backup to secondary disk: ${SECONDARY_BACKUP_ROOT}`);
    const secondaryPath = join(SECONDARY_BACKUP_ROOT, backupName);
    mkdirSync(secondaryPath, { recursive: true });
    
    try {
      // Commande de copie récursive multi-plateforme
      const copyCmd = process.platform === 'win32'
        ? `xcopy /E /I /Y "${backupDir}" "${secondaryPath}"`
        : `cp -rp "${backupDir}/"* "${secondaryPath}/"`;
      
      await execAsync(copyCmd);
      console.log('✅ Mirroring complete.');
    } catch (mirrorError) {
      console.error('❌ Mirroring failed:', mirrorError);
    }
  }

  // 4. LOG EVENT
  try {
    await prisma.activityLog.create({
      data: {
        action: 'SYSTEM_BACKUP',
        entity: 'System',
        details: { path: backupDir, secondaryPath: SECONDARY_BACKUP_ROOT || 'none', timestamp },
      }
    });
    console.log('✅ Backup logged in Audit Trail.');
  } catch (e) {
    console.error('Failed to log backup event:', e);
  }

  console.log(`🎉 Backup successfully created at: ${backupDir}`);
}

backup()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
