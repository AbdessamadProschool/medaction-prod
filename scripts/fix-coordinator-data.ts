
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = 'cordinatrice@mediouna.com';
  
  // 1. Get existing establishments
  console.log('Fetching available establishments...');
  const establishments = await prisma.etablissement.findMany({
    take: 5,
    select: { id: true, nom: true }
  });

  if (establishments.length === 0) {
    console.log('CRITICAL: No establishments found in database!');
    return;
  }

  console.log('Found establishments:', establishments);
  const validIds = establishments.map(e => e.id);

  // 2. Update user with valid IDs
  console.log(`Updating user ${email} with valid IDs: ${validIds.join(', ')}`);
  
  const updatedUser = await prisma.user.update({
    where: { email },
    data: {
      etablissementsGeres: validIds
    },
    select: {
      id: true,
      nom: true,
      etablissementsGeres: true
    }
  });

  console.log('User updated successfully:', updatedUser);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
