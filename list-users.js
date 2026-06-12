const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://medaction:medaction_secure_2024@localhost:5433/medaction'
    }
  }
});

async function main() {
  const users = await prisma.user.findMany({
    select: { role: true, email: true, nom: true, prenom: true }
  });
  console.table(users);
}

main().catch(console.error).finally(() => prisma.$disconnect());
