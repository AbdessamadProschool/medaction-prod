import { PrismaClient } from '@prisma/client';

async function test() {
  const url = "postgresql://medaction:medaction_secure_2024@localhost:5433/medaction";
  console.log('Testing with default password...');
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: url,
      },
    },
  });

  try {
    const campagnes = await prisma.campagne.findMany({
      take: 1,
    });
    console.log('SUCCESS with default password!');
    console.log('Campagnes found:', campagnes.length);
  } catch (error: any) {
    console.error('FAILED with default password:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

test();
