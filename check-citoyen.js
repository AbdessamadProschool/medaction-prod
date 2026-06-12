const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const u = await prisma.user.findUnique({
    where: { email: 'citoyen_test2@mediouna.ma' },
    include: {
      reclamationsCreees: true,
      suggestions: true
    }
  });
  console.log(JSON.stringify(u, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
