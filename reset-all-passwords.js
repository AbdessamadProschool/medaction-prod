const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://medaction:medaction_secure_2024@localhost:5433/medaction'
    }
  }
});

async function main() {
  const hash = await bcrypt.hash('password123', 10);
  await prisma.user.updateMany({
    data: {
      motDePasse: hash,
      lockedUntil: null,
      loginAttempts: 0,
      isActive: true,
      isEmailVerifie: true
    }
  });
  console.log('All passwords reset successfully to password123!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
