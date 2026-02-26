import { exec } from 'child_process';
import { existsSync, mkdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { promisify } from 'util';

const execAsync = promisify(exec);

// CONFIG
const BACKUP_ROOT = process.env.BACKUP_DIR || join(process.cwd(), 'backups');
const DB_USER = process.env.POSTGRES_USER || 'medaction';
const DB_NAME = process.env.POSTGRES_DB || 'medaction';
const CONTAINER_NAME = 'medaction-postgres'; // Nom du conteneur DB

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
      // Commande pour restaurer dans le conteneur Docker
      // cat dump | docker exec -i CONTAINER pg_restore -U user -d db
      const command = `type "${dumpFile}" | docker exec -i ${CONTAINER_NAME} pg_restore -U ${DB_USER} -d ${DB_NAME} -c`;
      
      console.log('⏳ Executing restore (this may take a while)...');
      await execAsync(command);
      console.log('✅ Database restored successfully.');
    } catch (error) {
      console.error('❌ Database restore failed:', error);
      console.log('💡 Tip: Ensure the database container is running.');
    }
  } else {
    console.log('⚠️ No database dump found in backup.');
  }

  // 2. FILES RESTORE
  console.log('ww️ Restoring Uploads...');
  const uploadsZip = join(backupPath, 'uploads.zip');
  const uploadDir = process.env.UPLOAD_DIR || join(process.cwd(), 'public', 'uploads');

  if (existsSync(uploadsZip)) {
    try {
      // Dezip avec 7zip ou PowerShell (compatible Windows)
      // Ici on assume un environnement node standard avec unzip
      // Pour une portabilité max, on utiliserait une lib JS unzipper, 
      // mais pour ce script admin, on utilise unzip système ou powershell
      
      // PowerShell command pour dézipper
      const psCommand = `powershell -command "Expand-Archive -Path '${uploadsZip}' -DestinationPath '${uploadDir}' -Force"`;
      await execAsync(psCommand);
      
      console.log('✅ Uploads restored successfully.');
    } catch (error) {
      console.error('❌ Upload restore failed:', error);
      console.log('💡 Tip: Ensure powershell is available or install unzip.');
    }
  } else {
    console.log('⚠️ No uploads archive found in backup.');
  }

  console.log('🎉 System Restore Complete!');
  console.log('🔄 Please restart the application container to ensure all caches are cleared.');
}

// Prendre le chemin du backup en argument
const targetBackup = process.argv[2];
if (!targetBackup) {
  console.error('❌ Usage: npx ts-node scripts/restore.ts <path_to_backup_folder>');
  process.exit(1);
}

restore(targetBackup).catch(console.error);
