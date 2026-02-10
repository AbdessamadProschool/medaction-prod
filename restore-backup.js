const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Champs à exclure car relations complexes ou calculés
const INVALID_FIELDS = [
  'estMiseEnAvant', 'statut', 'isPublic', 'resume', 'image', 
  'adresse', 'lieu', 'capacite', 'createurId', 'priorite', 'taille',
  'horaires', 'services', 'photos', 'responsableNom', 'responsableTelephone',
  'historique', 'medias', 'evaluations', 'reclamations', 'evenements', 'actualites',
  'participations', 'abonnements', 'notifications'
];

function cleanItem(item) {
  const cleaned = {};
  for (const [key, value] of Object.entries(item)) {
    // Ignorer les objets imbriqués/relations (sauf si c'est du JSON stocké comme value/donneesSpecifiques)
    if (value && typeof value === 'object' && !Array.isArray(value) && 'id' in value) continue;
    if (Array.isArray(value) && key !== 'tags' && key !== 'services' && key !== 'programmes') continue; // Garder les arrays simples
    
    if (INVALID_FIELDS.includes(key)) continue;
    
    // Conversion Date
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value)) {
      cleaned[key] = new Date(value);
    } else {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

async function restore() {
  const filePath = path.join(__dirname, 'backup.json');
  
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Fichier introuvable: ${filePath}`);
    console.log("Veuillez placer le fichier 'backup.json' à la racine du projet.");
    process.exit(1);
  }

  console.log(`📄 Lecture du backup depuis ${filePath}...`);
  const content = fs.readFileSync(filePath, 'utf8');
  const backup = JSON.parse(content);
  const data = backup.data || backup;

  console.log("⚡ Démarrage de la restauration complète...");

  try {
    // 0. Configuration de base
    if (data.settings?.length) {
      console.log(`⚙️ Settings (${data.settings.length})`);
      for (const item of data.settings) {
         // SystemSetting utilise 'key' comme ID unique dans le schema original, mais 'id' ici.
         // On upsert sur 'key' si existe, sinon id.
         // Schema actuel: key @unique (ou @id selon version).
         // On assume upsert sur unique key est plus safe.
         if (item.key) {
             await prisma.systemSetting.upsert({ 
                 where: { key: item.key }, 
                 update: { value: item.value }, 
                 create: cleanItem(item) 
             });
         }
      }
    }

    if (data.permissions?.length) {
      console.log(`🔒 Permissions (${data.permissions.length})`);
      for (const item of data.permissions) {
          if (item.code) {
            await prisma.permission.upsert({ 
                where: { code: item.code }, 
                update: {}, 
                create: cleanItem(item) 
            });
          }
      }
    }

    // 1. Territoire
    if (data.communes?.length) {
      console.log(`📍 Communes (${data.communes.length})`);
      for (const item of data.communes) {
        await prisma.commune.upsert({ where: { id: item.id }, update: {}, create: cleanItem(item) });
      }
    }

    if (data.annexes?.length) {
      console.log(`📍 Annexes (${data.annexes.length})`);
      for (const item of data.annexes) {
        await prisma.annexe.upsert({ where: { id: item.id }, update: {}, create: cleanItem(item) });
      }
    }

    // 2. Utilisateurs
    if (data.users?.length) {
      console.log(`👤 Users (${data.users.length})`);
      for (const item of data.users) {
        const cleaned = cleanItem(item);
        cleaned.motDePasse = cleaned.motDePasse || '$2b$10$placeholder';
        // Ensure unique email constraint doesn't fail
        await prisma.user.upsert({ 
            where: { email: item.email }, 
            update: {}, 
            create: cleaned 
        });
      }
    }

    // 3. Etablissements
    if (data.etablissements?.length) {
      console.log(`🏥 Etablissements (${data.etablissements.length})`);
      for (const item of data.etablissements) {
        const cleaned = cleanItem(item);
        // Nettoyage champs legacy
        delete cleaned.statut; 
        delete cleaned.isPublic;
        // Upsert via Code unique si possible, sinon ID
        if (item.code) {
            await prisma.etablissement.upsert({ 
                where: { code: item.code }, 
                update: {}, 
                create: cleaned 
            });
        }
      }
    }

    // 4. Campagnes
    if (data.campagnes?.length) {
        console.log(`📢 Campagnes (${data.campagnes.length})`);
        for (const item of data.campagnes) {
            if (item.slug) {
                await prisma.campagne.upsert({
                    where: { slug: item.slug },
                    update: {},
                    create: cleanItem(item)
                });
            }
        }
    }

    // 5. Evénements
    if (data.evenements?.length) {
        console.log(`📅 Evénements (${data.evenements.length})`);
        for (const item of data.evenements) {
            try {
                await prisma.evenement.upsert({ 
                    where: { id: item.id }, 
                    update: {}, 
                    create: cleanItem(item) 
                });
            } catch (e) {
                console.warn(`⚠️ Warning Evenement ${item.id}:`, e.message);
            }
        }
    }

    // 6. Actualités
    if (data.actualites?.length) {
        console.log(`📰 Actualités (${data.actualites.length})`);
        for (const item of data.actualites) {
            await prisma.actualite.upsert({ where: { id: item.id }, update: {}, create: cleanItem(item) });
        }
    }

    // 7. Réclamations (En dernier car dépend de tout)
    if (data.reclamations?.length) {
        console.log(`⚠️ Réclamations (${data.reclamations.length})`);
        for (const item of data.reclamations) {
            try {
                await prisma.reclamation.upsert({ 
                    where: { id: item.id }, 
                    update: {}, 
                    create: cleanItem(item) 
                });
            } catch (e) {
                 console.warn(`⚠️ Warning Reclamation ${item.id}:`, e.message);
            }
        }
    }

    console.log("✅ Restauration terminée avec succès.");
    console.log("Les données ont été réinjectées en base de données.");

  } catch (err) {
    console.error("❌ Erreur pendant la restauration:", err);
  } finally {
    await prisma.$disconnect();
  }
}

restore();
