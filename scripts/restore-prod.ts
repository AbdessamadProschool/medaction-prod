
import { Client } from 'pg';
import fs from 'fs';
import path from 'path';

// SECURITY: never hardcode credentials. Run with DATABASE_URL set in environment.
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL is not set. Aborting to prevent credential exposure.');
  process.exit(1);
}

async function restore() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error("❌ Usage: npx tsx scripts/restore-prod.ts <backup_file.sql>");
    process.exit(1);
  }

  const fullPath = path.resolve(filePath);
  if (!fs.existsSync(fullPath)) {
    console.error(`❌ Fichier introuvable: ${fullPath}`);
    process.exit(1);
  }

  console.log(`🔌 Connexion à ${DATABASE_URL}...`);
  const client = new Client({
    connectionString: DATABASE_URL,
  });

  try {
    await client.connect();
    console.log("✅ Connecté.");

    console.log("📄 Lecture du fichier backup...");
    const sqlContent = fs.readFileSync(fullPath, 'utf8');

    console.log("🚀 Exécution du script SQL...");
    // Note: Cela peut prendre du temps pour les gros fichiers
    await client.query(sqlContent);
    console.log("✅ Données restaurées avec succès.");

    console.log("🔧 Réinitialisation des séquences d'ID...");
    const tables = [
      'User', 'Etablissement', 'ProgrammeActivite', 'Evenement', 
      'Reclamation', 'Media', 'Evaluation', 'Notification',
      'Article', 'Campagne', 'Actualite', 'Commune', 'Permission', 
      'RolePermission', 'Suggestion'
    ];

    for (const table of tables) {
      try {
        // Vérifier si la table existe et a une colonne ID
        const checkTable = await client.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = $1
          );
        `, [table]);

        if (checkTable.rows[0].exists) {
           // On utilise des guillemets pour gérer la casse (Prisma utilise PascalCase souvent mappé, mais ici SQL standard)
           // Prisma par défaut utilise les noms tels quels si @map n'est pas utilisé ou les met en double quotes.
           // Dans notre schema, les modèles sont PascalCase, donc en Postgres ils sont "ModelName" (avec quotes).
           const query = `SELECT setval(pg_get_serial_sequence('"${table}"', 'id'), coalesce(max(id)+1, 1), false) FROM "${table}";`;
           await client.query(query);
           console.log(`  - Séquence réinitialisée pour: ${table}`);
        }
      } catch (e: any) {
        // Ignorer si la séquence n'existe pas (table sans auto-incrément ou vide)
        // console.log(`  - Info: Pas de séquence pour ${table} ou erreur mineure.`);
      }
    }

    console.log("✨ Terminé !");

  } catch (err) {
    console.error("❌ Erreur critique:", err);
  } finally {
    await client.end();
  }
}

restore();
