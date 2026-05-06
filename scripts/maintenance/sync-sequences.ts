import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function syncSequences() {
  console.log('🚀 Début de la synchronisation des séquences PostgreSQL...');

  const tables = [
    'User',
    'Commune',
    'Annexe',
    'Etablissement',
    'Media',
    'AbonnementEtablissement',
    'Evaluation',
    'Reclamation',
    'HistoriqueReclamation',
    'Suggestion',
    'Evenement',
    'Actualite',
    'Article',
    'Campagne',
    'Notification',
    'ActivityLog',
    'AuditLog',
    'SecurityToken',
    'UserPermission'
  ];

  for (const table of tables) {
    try {
      // Pour PostgreSQL, le nom de la séquence par défaut est TableName_id_seq
      // Note: Prisma utilise des guillemets doubles pour les noms de tables sensibles à la casse
      const sequenceName = `"${table}_id_seq"`;
      
      console.log(`--- Table: ${table} ---`);
      
      // Récupérer le MAX(id)
      const result = await prisma.$queryRawUnsafe<{ max: number }[]>(
        `SELECT MAX(id) as max FROM "${table}"`
      );
      
      const maxId = result[0]?.max || 0;
      console.log(`   ID Max actuel: ${maxId}`);

      // Mettre à jour la séquence
      await prisma.$executeRawUnsafe(
        `SELECT setval('${sequenceName}', ${maxId + 1}, false)`
      );
      
      console.log(`   ✅ Séquence ${sequenceName} synchronisée.`);
    } catch (error: any) {
      if (error.code === 'P2010' && error.message.includes('does not exist')) {
        console.log(`   ℹ️ Séquence non trouvée pour ${table}, passage...`);
      } else {
        console.error(`   ❌ Erreur pour ${table}:`, error.message);
      }
    }
  }

  console.log('\n✨ Synchronisation terminée.');
}

syncSequences()
  .catch((e) => {
    console.error('❌ Erreur fatale:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
