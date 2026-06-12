const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://medaction:medaction_secure_2024@localhost:5433/medaction'
    }
  }
});

async function main() {
  const u = await prisma.user.findUnique({
    where: { email: 'citoyen_test@mediouna.ma' }
  });
  console.log(u);
  
  if (u) {
      console.log("isActive:", u.isActive);
      console.log("loginAttempts:", u.loginAttempts);
      console.log("lockedUntil:", u.lockedUntil);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
