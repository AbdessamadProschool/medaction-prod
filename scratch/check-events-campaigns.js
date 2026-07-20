const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://medaction:medaction_secure_2024@localhost:5433/medaction'
    }
  }
});

async function main() {
  console.log('--- USERS ---');
  const users = await prisma.user.findMany({
    select: { id: true, role: true, email: true, nom: true, prenom: true }
  });
  console.table(users);

  console.log('--- EVENTS ---');
  const events = await prisma.evenement.findMany({
    select: { id: true, titre: true, statut: true, createdBy: true, dateFin: true }
  });
  console.table(events);

  console.log('--- CAMPAIGNS ---');
  const campaigns = await prisma.campagne.findMany({
    select: { id: true, titre: true, nom: true, statut: true, createdBy: true, dateFin: true }
  });
  console.table(campaigns);
}

main().catch(console.error).finally(() => prisma.$disconnect());
