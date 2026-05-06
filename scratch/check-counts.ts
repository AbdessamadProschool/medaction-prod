import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkData() {
  console.log('--- Database Stats Check (Step-by-Step) ---');
  try {
    console.log('Checking Users...');
    const users = await prisma.user.count();
    console.log(`Users: ${users}`);

    console.log('Checking Etablissements...');
    const etabs = await prisma.etablissement.count();
    console.log(`Etablissements: ${etabs}`);

    console.log('Checking Reclamations...');
    const recls = await prisma.reclamation.count();
    console.log(`Reclamations: ${recls}`);

    console.log('Checking Evenements...');
    const evts = await prisma.evenement.count();
    console.log(`Evenements: ${evts}`);

    console.log('Checking Actualites...');
    const actualites = await prisma.actualite.count();
    console.log(`Actualites: ${actualites}`);

    console.log('Checking Suggestions...');
    const suggestions = await prisma.suggestion.count();
    console.log(`Suggestions: ${suggestions}`);

  } catch (error) {
    console.error('Error checking data:', error);
  } finally {
    await prisma.$disconnect();
    console.log('Done.');
  }
}

checkData();
