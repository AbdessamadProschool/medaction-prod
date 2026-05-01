
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const actualites = await prisma.actualite.findMany({
    take: 5,
    include: {
      medias: true
    }
  });
  console.log(JSON.stringify(actualites, null, 2));
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
