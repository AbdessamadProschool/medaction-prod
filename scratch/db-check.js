const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    const count = await prisma.user.count();
    console.log('COUNT_USERS:' + count);
  } catch (err) {
    console.error('ERROR:' + err.message);
  } finally {
    await prisma.$disconnect();
  }
}

check();
