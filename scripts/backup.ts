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
const UPLOAD_DIR = process.env.UPLOAD_DIR || join(process.cwd(), 'public', 'uploads');
const DB_URL = process.env.DATABASE_URL;

async function backup() {
  console.log('🚀 Starting System Backup...');
  
  if (!existsSync(BACKUP_ROOT)) {
    mkdirSync(BACKUP_ROOT, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = join(BACKUP_ROOT, `backup-${timestamp}`);
  mkdirSync(backupDir);

  // 1. DATABASE BACKUP
  console.log('📊 Backing up Database...');
  try {
    // Extract credentials from DATABASE_URL
    // postgresql://USER:PASSWORD@HOST:PORT/DATABASE
    const dbUrl = new URL(DB_URL!);
    
    const dumpCommand = `pg_dump "${DB_URL}" -F c -b -v -f "${join(backupDir, 'database.dump')}"`;
    
    // Note: This requires pg_dump to be in the system PATH
    await execAsync(dumpCommand);
    console.log('✅ Database backup complete.');
  } catch (error) {
    console.error('❌ Database backup failed:', error);
    // Fallback: Dump critical tables to JSON using Prisma if pg_dump fails? 
    // For now, we log the error. In production, pg_dump is mandatory.
    console.log('⚠️ Ensure pg_dump is installed and in PATH.');
  }

  // 2. FILES BACKUP
  console.log('ww️ Backing up Uploads...');
  if (existsSync(UPLOAD_DIR)) {
    const output = fs.createWriteStream(join(backupDir, 'uploads.zip'));
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => {
      console.log(`✅ Uploads backup complete: ${archive.pointer()} total bytes`);
    });

    archive.on('error', (err) => {
      throw err;
    });

    archive.pipe(output);
    archive.directory(UPLOAD_DIR, false);
    await archive.finalize();
  } else {
    console.log('⚠️ No uploads directory found.');
  }

  // 3. LOG EVENT
  try {
    await prisma.activityLog.create({
      data: {
        action: 'SYSTEM_BACKUP',
        entity: 'System',
        details: { path: backupDir, timestamp },
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
