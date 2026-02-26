
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = 'cordinatrice@mediouna.com';
  console.log(`Checking user with email: ${email}`);

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
        id: true,
        nom: true,
        prenom: true,
        role: true,
        etablissementsGeres: true
    }
  });

  if (!user) {
    console.log('User not found!');
    return;
  }

  console.log('User found:', user);

  if (user.etablissementsGeres && user.etablissementsGeres.length > 0) {
    console.log(`Checking ${user.etablissementsGeres.length} establishments...`);
    const etablissements = await prisma.etablissement.findMany({
      where: {
        id: { in: user.etablissementsGeres }
      },
      select: {
        id: true,
        nom: true,
        code: true,
        isPublie: true,
        isValide: true
      }
    });
    console.log('Establishments found in DB:', etablissements);
  } else {
    console.log('No establishments managed by this user (array is empty).');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
