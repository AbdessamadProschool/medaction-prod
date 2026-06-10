const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('Password123!', 10);
  
  await prisma.user.upsert({
    where: { email: 'citoyen_test2@mediouna.ma' },
    update: { motDePasse: hash, role: 'CITOYEN', isActive: true },
    create: {
      email: 'citoyen_test2@mediouna.ma',
      motDePasse: hash,
      nom: 'Citoyen',
      prenom: 'Test',
      role: 'CITOYEN',
      isActive: true,
      telephone: '0600000001'
    }
  });
  
  console.log('Test user created: citoyen_test@mediouna.ma / Password123!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
