const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('Password123!', 10);
  
  // 1. GOUVERNEUR
  await prisma.user.upsert({
    where: { email: 'gouverneur_test@mediouna.ma' },
    update: { motDePasse: hash, role: 'GOUVERNEUR', isActive: true, telephone: '0699000001' },
    create: {
      email: 'gouverneur_test@mediouna.ma',
      motDePasse: hash,
      nom: 'Gouverneur',
      prenom: 'Test',
      role: 'GOUVERNEUR',
      isActive: true,
      telephone: '0699000001'
    }
  });
  console.log('Test GOUVERNEUR created: gouverneur_test@mediouna.ma');

  // 2. DELEGATION
  await prisma.user.upsert({
    where: { email: 'delegation_test@mediouna.ma' },
    update: { motDePasse: hash, role: 'DELEGATION', isActive: true, telephone: '0699000002' },
    create: {
      email: 'delegation_test@mediouna.ma',
      motDePasse: hash,
      nom: 'Delegation',
      prenom: 'Test',
      role: 'DELEGATION',
      isActive: true,
      telephone: '0699000002'
    }
  });
  console.log('Test DELEGATION created: delegation_test@mediouna.ma');

  // 3. COORDINATEUR_ACTIVITES
  await prisma.user.upsert({
    where: { email: 'coordinateur_test@mediouna.ma' },
    update: { motDePasse: hash, role: 'COORDINATEUR_ACTIVITES', isActive: true, telephone: '0699000003' },
    create: {
      email: 'coordinateur_test@mediouna.ma',
      motDePasse: hash,
      nom: 'Coordinateur',
      prenom: 'Test',
      role: 'COORDINATEUR_ACTIVITES',
      isActive: true,
      telephone: '0699000003'
    }
  });
  console.log('Test COORDINATEUR created: coordinateur_test@mediouna.ma');

  // 4. ADMIN
  await prisma.user.upsert({
    where: { email: 'admin_test@mediouna.ma' },
    update: { motDePasse: hash, role: 'ADMIN', isActive: true, telephone: '0699000004' },
    create: {
      email: 'admin_test@mediouna.ma',
      motDePasse: hash,
      nom: 'Admin',
      prenom: 'Test',
      role: 'ADMIN',
      isActive: true,
      telephone: '0699000004'
    }
  });
  console.log('Test ADMIN created: admin_test@mediouna.ma');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
