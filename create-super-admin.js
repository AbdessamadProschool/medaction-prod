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
  
  await prisma.user.upsert({
    where: { email: 'superadmin@medaction.ma' },
    update: { motDePasse: hash, role: 'SUPER_ADMIN', isActive: true },
    create: {
      email: 'superadmin@medaction.ma',
      motDePasse: hash,
      nom: 'SuperAdmin',
      prenom: 'Test',
      role: 'SUPER_ADMIN',
      isActive: true,
      telephone: '0600000009'
    }
  });
  
  console.log('Test SUPER_ADMIN user created: superadmin@medaction.ma / Password123!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
