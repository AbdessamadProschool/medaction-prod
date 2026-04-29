const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const act = await prisma.actualite.findMany({
    include: { medias: true },
    take: 2
  });
  console.log(JSON.stringify(act, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
