const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const etabId = 663;
  console.log(`Checking establishment with ID ${etabId}...`);
  const etab = await prisma.etablissement.findUnique({
    where: { id: etabId },
    include: {
      _count: true
    }
  });

  if (!etab) {
    console.log("Establishment not found!");
    return;
  }

  console.log("Establishment found:", {
    id: etab.id,
    nom: etab.nom,
    secteur: etab.secteur,
    _count: etab._count
  });

  console.log("\nChecking events for this establishment...");
  const events = await prisma.evenement.findMany({
    where: { etablissementId: etabId }
  });

  console.log(`Found ${events.length} events:`);
  events.forEach((e, idx) => {
    console.log(`Event #${idx + 1}:`, {
      id: e.id,
      titre: e.titre,
      statut: e.statut,
      dateDebut: e.dateDebut,
      dateFin: e.dateFin
    });
  });

  console.log("\nChecking activities for this establishment...");
  const activities = await prisma.programmeActivite.findMany({
    where: { etablissementId: etabId }
  });

  console.log(`Found ${activities.length} activities:`);
  activities.forEach((a, idx) => {
    console.log(`Activity #${idx + 1}:`, {
      id: a.id,
      titre: a.titre,
      statut: a.statut
    });
  });

  console.log("\nChecking actualites for this establishment...");
  const news = await prisma.actualite.findMany({
    where: { etablissementId: etabId }
  });

  console.log(`Found ${news.length} news items:`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
