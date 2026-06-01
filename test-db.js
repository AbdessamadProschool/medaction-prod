const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const e663 = await prisma.etablissement.findUnique({
    where: { id: 663 },
    include: { commune: true, medias: true }
  });
  console.log('Etablissement 663:', JSON.stringify(e663, null, 2));

  const e527 = await prisma.etablissement.findUnique({
    where: { id: 527 },
    include: { commune: true, medias: true }
  });
  console.log('Etablissement 527:', JSON.stringify(e527, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
