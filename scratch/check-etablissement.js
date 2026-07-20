const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const etablissement = await prisma.etablissement.findUnique({
    where: { id: 756 },
    include: {
      commune: true,
      annexe: true
    }
  });
  console.log('Etablissement 756:', JSON.stringify(etablissement, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
