const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const [
    etabs,
    reclamations,
    evenements,
    communes,
    users
  ] = await Promise.all([
    prisma.etablissement.count(),
    prisma.reclamation.count(),
    prisma.evenement.count(),
    prisma.commune.count(),
    prisma.user.count({ where: { role: 'GOUVERNEUR' } })
  ]);

  console.log(JSON.stringify({
    etabs,
    reclamations,
    evenements,
    communes,
    gouverneurs: users
  }, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
