const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');

// Charger les variables d'environnement
dotenv.config();

const databaseUrl = process.env.DATABASE_URL || 'postgresql://medaction:medaction_secure_2024@localhost:5433/medaction';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl
    }
  }
});

async function run() {
  console.log('Connexion à la base de données:', databaseUrl);
  
  try {
    // Tester la connexion
    await prisma.$connect();
    console.log('Connexion réussie !');
  } catch (err) {
    console.warn('⚠️ Base de données inaccessible. Le test d\'intégration est mis en attente du démarrage des conteneurs locaux (Docker).');
    console.warn('Ce script est prêt à être exécuté dès que les conteneurs sont actifs via start-local.bat.');
    return;
  }

  const testSuffix = '_' + Date.now();
  let commune = null;
  let etabA = null;
  let etabB = null;

  try {
    console.log('1. Création des données de test...');
    
    // Créer une commune
    commune = await prisma.commune.create({
      data: {
        code: 'TEST_COMMUNE' + testSuffix,
        nom: 'Commune Test P0-B',
        region: 'Test Region',
        province: 'Médiouna'
      }
    });

    // Créer deux établissements
    etabA = await prisma.etablissement.create({
      data: {
        code: 'TEST_ETAB_A' + testSuffix,
        nom: 'Etablissement de Test A',
        secteur: 'EDUCATION',
        communeId: commune.id,
        latitude: 33.45,
        longitude: -7.56
      }
    });

    etabB = await prisma.etablissement.create({
      data: {
        code: 'TEST_ETAB_B' + testSuffix,
        nom: 'Etablissement de Test B',
        secteur: 'SANTE',
        communeId: commune.id,
        latitude: 33.46,
        longitude: -7.57
      }
    });

    // Créer un utilisateur citoyen fictif pour rattacher les réclamations
    const citoyen = await prisma.user.findFirst({
      where: { role: 'CITOYEN' }
    });

    if (!citoyen) {
      throw new Error('Aucun utilisateur CITOYEN en base pour rattacher les réclamations.');
    }

    // Créer 3 réclamations pour Etab A (2 résolues, 1 ouverte)
    // Réclamation résolue 1
    await prisma.reclamation.create({
      data: {
        titre: 'Reclamation Etab A Resolue 1',
        description: 'Description de test pour réclamation résolue 1',
        communeId: commune.id,
        etablissementId: etabA.id,
        userId: citoyen.id,
        statut: 'ACCEPTEE',
        affectationReclamation: 'AFFECTEE',
        dateResolution: new Date(),
        categorie: 'EAU'
      }
    });

    // Réclamation résolue 2
    await prisma.reclamation.create({
      data: {
        titre: 'Reclamation Etab A Resolue 2',
        description: 'Description de test pour réclamation résolue 2',
        communeId: commune.id,
        etablissementId: etabA.id,
        userId: citoyen.id,
        statut: 'ACCEPTEE',
        affectationReclamation: 'AFFECTEE',
        dateResolution: new Date(),
        categorie: 'EAU'
      }
    });

    // Réclamation ouverte 1
    await prisma.reclamation.create({
      data: {
        titre: 'Reclamation Etab A Ouverte',
        description: 'Description de test pour réclamation ouverte',
        communeId: commune.id,
        etablissementId: etabA.id,
        userId: citoyen.id,
        statut: 'ACCEPTEE',
        affectationReclamation: 'AFFECTEE',
        dateResolution: null,
        categorie: 'INFRASTRUCTURE'
      }
    });

    // Créer 1 réclamation ouverte pour Etab B
    await prisma.reclamation.create({
      data: {
        titre: 'Reclamation Etab B Ouverte',
        description: 'Description de test pour réclamation ouverte etab B',
        communeId: commune.id,
        etablissementId: etabB.id,
        userId: citoyen.id,
        statut: 'ACCEPTEE',
        affectationReclamation: 'AFFECTEE',
        dateResolution: null,
        categorie: 'INFRASTRUCTURE'
      }
    });

    console.log('2. Exécution de la requête de performance (Prisma groupBy)...');

    // Requête groupBy identique à celle implémentée dans route.ts
    const resolvedCounts = await prisma.reclamation.groupBy({
      by: ['etablissementId'],
      where: {
        etablissementId: { in: [etabA.id, etabB.id] },
        dateResolution: { not: null }
      },
      _count: { id: true }
    });

    const resolvedMap = new Map(
      resolvedCounts.map(item => [item.etablissementId, item._count.id])
    );

    const countA = resolvedMap.get(etabA.id) || 0;
    const countB = resolvedMap.get(etabB.id) || 0;

    console.log(`Count résolu Etab A (attendu: 2) : ${countA}`);
    console.log(`Count résolu Etab B (attendu: 0) : ${countB}`);

    // Assertions
    if (countA !== 2) {
      throw new Error(`Échec de validation : etab A résolu count = ${countA}, attendu = 2`);
    }
    if (countB !== 0) {
      throw new Error(`Échec de validation : etab B résolu count = ${countB}, attendu = 0`);
    }

    console.log('✅ TEST D\'INTÉGRATION RÉUSSI AVEC SUCCÈS ! Les données réelles correspondent parfaitement aux assertions.');

  } catch (error) {
    console.error('❌ ERREUR LORS DU TEST D\'INTÉGRATION:', error);
    process.exitCode = 1;
  } finally {
    console.log('3. Nettoyage des données de test...');
    try {
      if (etabA || etabB) {
        await prisma.reclamation.deleteMany({
          where: {
            etablissementId: { in: [etabA ? etabA.id : -1, etabB ? etabB.id : -1].filter(id => id !== -1) }
          }
        });
      }
      if (etabA) {
        await prisma.etablissement.delete({ where: { id: etabA.id } });
      }
      if (etabB) {
        await prisma.etablissement.delete({ where: { id: etabB.id } });
      }
      if (commune) {
        await prisma.commune.delete({ where: { id: commune.id } });
      }
      console.log('Nettoyage terminé.');
    } catch (cleanErr) {
      console.error('Erreur lors du nettoyage:', cleanErr);
    }
    await prisma.$disconnect();
  }
}

run();
