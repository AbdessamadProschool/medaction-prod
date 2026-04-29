const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    console.log('Testing DB connection...');
    const total = await prisma.campagne.count();
    console.log('Total campagnes:', total);
    const campaigns = await prisma.campagne.findMany({
      take: 1,
      include: {
        _count: { select: { participations: true } }
      }
    });
    console.log('Campaign sample:', JSON.stringify(campaigns, null, 2));
    process.exit(0);
  } catch (err) {
    console.error('DB Error:', err.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

test();
