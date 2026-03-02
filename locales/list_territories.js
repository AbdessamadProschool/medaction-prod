const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const communes = await prisma.commune.findMany();
  const annexes = await prisma.annexe.findMany();
  
  console.log('--- COMMUNES ---');
  communes.forEach(c => console.log(`${c.id}: ${c.nom} (${c.nomArabe || 'N/A'})`));
  
  console.log('\n--- ANNEXES ---');
  annexes.forEach(a => console.log(`${a.id}: ${a.nom} (${a.nomArabe || 'N/A'})`));
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
