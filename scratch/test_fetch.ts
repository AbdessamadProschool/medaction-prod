import { prisma } from '../lib/db';

async function test() {
  try {
    console.log('Testing Campagne fetch...');
    const campagnes = await prisma.campagne.findMany({
      take: 1,
      include: {
        _count: { select: { participations: true } },
      },
    });
    console.log('Fetch successful:', JSON.stringify(campagnes, null, 2));
  } catch (error: any) {
    console.error('Fetch failed:', error.message);
    if (error.code) console.error('Error code:', error.code);
    if (error.meta) console.error('Error meta:', error.meta);
  } finally {
    await prisma.$disconnect();
  }
}

test();
