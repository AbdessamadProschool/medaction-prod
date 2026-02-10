
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkData() {
  console.log("--- COMMUNES ---");
  const communes = await prisma.commune.findMany();
  communes.forEach(c => console.log(`ID: ${c.id}, Nom: '${c.nom}', Code: ${c.code}`));

  console.log("\n--- ANNEXES ---");
  const annexes = await prisma.annexe.findMany();
  annexes.forEach(a => console.log(`ID: ${a.id}, Nom: '${a.nom}', CommuneID: ${a.communeId}`));

  console.log("\n--- ETABLISSEMENTS (Sample of 5) ---");
  const etabs = await prisma.etablissement.findMany({ 
      take: 5,
      include: { commune: true, annexe: true }
  });
  etabs.forEach(e => {
      console.log(`ID: ${e.id}, Nom: '${e.nom}'`);
      console.log(`   -> CommuneID: ${e.communeId}, CommuneNom: '${e.commune?.nom}'`);
      console.log(`   -> AnnexeID: ${e.annexeId}, AnnexeNom: '${e.annexe?.nom}'`);
  });

  console.log("\n--- ETABLISSEMENTS IN LAHRAOUIYINE (Try to find by name) ---");
  const lahra = communes.find(c => c.nom.toLowerCase().includes('lahra'));
  if (lahra) {
      console.log(`Found 'Lahraouiyine' Commune with ID: ${lahra.id}`);
      const etabsInLahra = await prisma.etablissement.count({ where: { communeId: lahra.id } });
      console.log(`Count of Etablissements with communeId=${lahra.id}: ${etabsInLahra}`);
      
      if (etabsInLahra === 0) {
          console.log("WARNING: No establishments linked directly to this commune ID.");
          console.log("Checking if they are linked via text search...");
          const etabsByName = await prisma.etablissement.findMany({
              where: {
                  OR: [
                      { adresseComplete: { contains: 'lahra', mode: 'insensitive' } },
                      { notes: { contains: 'lahra', mode: 'insensitive' } } // Assuming notes/remarques might capture it? Schema says 'remarques'
                  ]
              },
              take: 3
          });
          console.log(`Found ${etabsByName.length} by text search.`);
      }
  } else {
      console.log("Could not find a commune named like 'lahra'");
  }
}

checkData()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
