import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import fs from 'fs';
import path from 'path';

// SECURITY: never hardcode credentials. Run with DATABASE_URL set in environment.
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL is not set. Aborting to prevent credential exposure.');
  process.exit(1);
}

const pool = new Pool({ connectionString: DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter } as any);

// Fields that exist in backup but not in current schema or are nested relations
const INVALID_FIELDS = [
  'estMiseEnAvant', 'statut', 'isPublic', 'resume', 'image', 
  'adresse', 'lieu', 'capacite', 'createurId', 'priorite', 'taille',
  'horaires', 'services', 'photos', 'responsableNom', 'responsableTelephone',
  'historique', 'medias', 'evaluations', 'reclamations', 'evenements', 'actualites'
];

// Helper pour nettoyer les dates et les relations
function cleanItem(item: any): any {
  const cleaned: any = {};
  for (const [key, value] of Object.entries(item)) {
    // Skip nested relation objects (they are objects with id)
    if (value && typeof value === 'object' && !Array.isArray(value) && 'id' in value) {
      continue;
    }
    // Skip invalid fields
    if (INVALID_FIELDS.includes(key)) {
      continue;
    }
    // Convert date strings
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value)) {
      cleaned[key] = new Date(value);
    } else {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

async function restore() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error("❌ Usage: npx tsx scripts/restore-prod-json.ts <backup_file.json>");
    process.exit(1);
  }

  const fullPath = path.resolve(filePath);
  if (!fs.existsSync(fullPath)) {
    console.error(`❌ Fichier introuvable: ${fullPath}`);
    process.exit(1);
  }

  console.log("📄 Lecture du fichier JSON...");
  const content = fs.readFileSync(fullPath, 'utf8');
  const backup = JSON.parse(content);

  if (!backup.data) {
    console.error("❌ Format invalide: 'data' manquant.");
    process.exit(1);
  }

  const { data } = backup;
  console.log("⚡ Début de la restauration...");

  try {
    // 1. Communes
    if (data.communes?.length) {
      console.log(`📍 Insertion de ${data.communes.length} communes...`);
      for (const item of data.communes) {
        const cleaned = cleanItem(item);
        await prisma.commune.upsert({
          where: { id: item.id },
          update: {},
          create: cleaned
        });
      }
    }

    // 2. Annexes
    if (data.annexes?.length) {
      console.log(`📍 Insertion de ${data.annexes.length} annexes...`);
      for (const item of data.annexes) {
        const cleaned = cleanItem(item);
        await prisma.annexe.upsert({
          where: { id: item.id },
          update: {},
          create: cleaned
        });
      }
    }

    // 3. Utilisateurs
    if (data.users?.length) {
      console.log(`👤 Insertion de ${data.users.length} utilisateurs...`);
      for (const item of data.users) {
        const cleaned = cleanItem(item);
        // Ensure required fields
        cleaned.motDePasse = cleaned.motDePasse || '$2b$10$placeholder';
        cleaned.role = cleaned.role || 'CITOYEN';
        cleaned.isActive = cleaned.isActive ?? true;
        cleaned.isEmailVerifie = cleaned.isEmailVerifie ?? false;
        await prisma.user.upsert({
          where: { id: item.id },
          update: {},
          create: cleaned
        });
      }
    }

    // 4. Établissements
    if (data.etablissements?.length) {
      console.log(`🏥 Insertion de ${data.etablissements.length} établissements...`);
      for (const item of data.etablissements) {
        const cleaned = cleanItem(item);
        // Remove fields that don't exist in schema
        delete cleaned.statut;
        delete cleaned.isPublic;
        await prisma.etablissement.upsert({
          where: { id: item.id },
          update: {},
          create: cleaned
        });
      }
    }

    // 5. Permissions
    if (data.permissions?.length) {
      console.log(`🔒 Insertion de ${data.permissions.length} permissions...`);
      for (const item of data.permissions) {
        const cleaned = cleanItem(item);
        cleaned.isActive = cleaned.isActive ?? true;
        await prisma.permission.upsert({
          where: { id: item.id },
          update: {},
          create: cleaned
        });
      }
    }

    // 6. Settings
    if (data.settings?.length) {
      console.log(`⚙️ Insertion de ${data.settings.length} settings...`);
      for (const item of data.settings) {
        const cleaned = cleanItem(item);
        await prisma.systemSetting.upsert({
          where: { id: item.id },
          update: { value: cleaned.value },
          create: cleaned
        });
      }
    }

    // 7. Actualités
    if (data.actualites?.length) {
      console.log(`📰 Insertion de ${data.actualites.length} actualités...`);
      for (const item of data.actualites) {
        const cleaned = cleanItem(item);
        await prisma.actualite.upsert({
          where: { id: item.id },
          update: {},
          create: cleaned
        });
      }
    }

    // 8. Articles
    if (data.articles?.length) {
      console.log(`📝 Insertion de ${data.articles.length} articles...`);
      for (const item of data.articles) {
        const cleaned = cleanItem(item);
        await prisma.article.upsert({
          where: { id: item.id },
          update: {},
          create: cleaned
        });
      }
    }

    // 9. Campagnes
    if (data.campagnes?.length) {
      console.log(`🎯 Insertion de ${data.campagnes.length} campagnes...`);
      for (const item of data.campagnes) {
        const cleaned = cleanItem(item);
        await prisma.campagne.upsert({
          where: { id: item.id },
          update: {},
          create: cleaned
        });
      }
    }

    // 10. Événements
    if (data.evenements?.length) {
      console.log(`📅 Insertion de ${data.evenements.length} événements...`);
      for (const item of data.evenements) {
        const cleaned = cleanItem(item);
        await prisma.evenement.upsert({
          where: { id: item.id },
          update: {},
          create: cleaned
        });
      }
    }

    // 11. Réclamations
    if (data.reclamations?.length) {
      console.log(`📋 Insertion de ${data.reclamations.length} réclamations...`);
      for (const item of data.reclamations) {
        const cleaned = cleanItem(item);
        // statut is removed by cleanItem, leave it null (EN_ATTENTE doesn't exist in enum)
        await prisma.reclamation.upsert({
          where: { id: item.id },
          update: {},
          create: cleaned
        });
      }
    }

    // 12. Médias
    if (data.medias?.length) {
      console.log(`🖼️ Insertion de ${data.medias.length} médias...`);
      for (const item of data.medias) {
        const cleaned = cleanItem(item);
        await prisma.media.upsert({
          where: { id: item.id },
          update: {},
          create: cleaned
        });
      }
    }

    console.log("✅ Données restaurées avec succès.");

    // --- REINITIALISATION DES SÉQUENCES ---
    console.log("🔧 Réinitialisation des séquences d'ID...");
    const tables = [
      'User', 'Etablissement', 'ProgrammeActivite', 'Evenement', 
      'Reclamation', 'Media', 'Evaluation', 'Notification',
      'Article', 'Campagne', 'Actualite', 'Commune', 'Permission', 
      'RolePermission', 'Suggestion', 'AnnexeAdministrativ', 'Settings'
    ];

    for (const table of tables) {
      try {
        const query = `SELECT setval(pg_get_serial_sequence('"${table}"', 'id'), coalesce(max(id)+1, 1), false) FROM "${table}";`;
        await pool.query(query);
      } catch (e) {
        // Silent fail for tables without sequence
      }
    }

    console.log("✨ Restauration terminée avec succès !");

  } catch (err) {
    console.error("❌ Erreur lors de la restauration:", err);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

restore();
