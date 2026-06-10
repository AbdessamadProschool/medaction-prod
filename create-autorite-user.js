const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('Password123!', 10);
  
  // Find a commune to attach to
  const commune = await prisma.commune.findFirst();
  if (!commune) {
    console.log('No commune found! Please seed the database first.');
    return;
  }

  const user = await prisma.user.upsert({
    where: { email: 'autorite_test@mediouna.ma' },
    update: {
      motDePasse: hashedPassword,
      isActive: true,
      communeResponsableId: commune.id
    },
    create: {
      email: 'autorite_test@mediouna.ma',
      motDePasse: hashedPassword,
      nom: 'Test',
      prenom: 'Autorité',
      telephone: '0600000002',
      role: 'AUTORITE_LOCALE',
      isActive: true,
      isEmailVerifie: true,
      communeResponsableId: commune.id
    },
  });

  console.log('Test Autorité user created: autorite_test@mediouna.ma / Password123!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
