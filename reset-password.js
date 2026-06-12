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
  const hash = await bcrypt.hash('Password123!', 10);
  await prisma.user.update({
    where: { email: 'citoyen_test@mediouna.ma' },
    data: {
      motDePasse: hash,
      lockedUntil: null,
      loginAttempts: 0,
      isActive: true
    }
  });
  console.log('Password reset successfully to Password123!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
