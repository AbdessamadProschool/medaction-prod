import { exec } from 'child_process';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { promisify } from 'util';

const execAsync = promisify(exec);

// CONFIG
const BACKUP_ROOT = process.env.BACKUP_DIR || join(process.cwd(), 'backups');
const DB_USER = process.env.POSTGRES_USER || 'medaction';
const DB_NAME = process.env.POSTGRES_DB || 'medaction';
const CONTAINER_NAME = 'medaction-postgres'; 

async function restore(backupPath: string) {
  console.log('🚀 Starting System Restore...');
  console.log(`📂 Target Backup: ${backupPath}`);

  if (!existsSync(backupPath)) {
    console.error('❌ Backup path does not exist!');
    process.exit(1);
  }

  // 1. DATABASE RESTORE
  console.log('📊 Restoring Database...');
  const dumpFile = join(backupPath, 'database.dump');
  
  if (existsSync(dumpFile)) {
    try {
      // Détecter la commande de lecture (type sur Windows, cat sur Linux)
      const catCmd = process.platform === 'win32' ? 'type' : 'cat';
      
      // On force le mode clean (-c) pour écraser les données existantes
      const command = `${catCmd} "${dumpFile}" | docker exec -i ${CONTAINER_NAME} pg_restore -U ${DB_USER} -d ${DB_NAME} -c`;
      
      console.log('⏳ Executing database restore (this may take a while)...');
      await execAsync(command);
      console.log('✅ Database restored successfully.');
    } catch (error) {
      console.error('❌ Database restore failed:', error);
      console.log('💡 Tip: Ensure the database container is running and healthy.');
    }
  } else {
    console.log('⚠️ No database dump found in backup.');
  }

  // 2. FILES RESTORE
  console.log('📂 Restoring Uploads...');
  const uploadsZip = join(backupPath, 'uploads.zip');
  const uploadDir = process.env.UPLOAD_DIR || join(process.cwd(), 'public', 'uploads');

  if (existsSync(uploadsZip)) {
    try {
      if (!existsSync(uploadDir)) mkdirSync(uploadDir, { recursive: true });

      let unzipCmd;
      if (process.platform === 'win32') {
        unzipCmd = `powershell -command "Expand-Archive -Path '${uploadsZip}' -DestinationPath '${uploadDir}' -Force"`;
      } else {
        unzipCmd = `unzip -o "${uploadsZip}" -d "${uploadDir}"`;
      }
      
      console.log('⏳ Unzipping files...');
      await execAsync(unzipCmd);
      console.log('✅ Uploads restored successfully.');
    } catch (error) {
      console.error('❌ Upload restore failed:', error);
      console.log('💡 Tip: Ensure "unzip" is installed on Linux or "powershell" on Windows.');
    }
  } else {
    console.log('⚠️ No uploads archive found in backup.');
  }

  console.log('🎉 System Restore Complete!');
}

// Prendre le chemin du backup en argument
const targetBackup = process.argv[2];
if (!targetBackup) {
  console.error('❌ Usage: npm run system:restore <path_to_backup_folder>');
  process.exit(1);
}

restore(targetBackup).catch(console.error);
