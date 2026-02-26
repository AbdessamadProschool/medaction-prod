
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log("Connecting database...");
    const communes = await prisma.commune.findMany();
    console.log("COMMUNES FOUND:", communes.map(c => c.nom));
}

main()
  .catch((e) => {
    throw e;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
