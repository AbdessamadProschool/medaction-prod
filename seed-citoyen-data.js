const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://medaction:medaction_secure_2024@localhost:5433/medaction'
    }
  }
});

async function main() {
  const email = 'citoyen_test@mediouna.ma';
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.log('User not found!');
    return;
  }

  console.log(`Found user: ${user.email} (ID: ${user.id})`);

  // Check Reclamations
  const recs = await prisma.reclamation.findMany({ where: { userId: user.id } });
  if (recs.length === 0) {
    console.log('Creating dummy reclamations...');
    await prisma.reclamation.create({
      data: {
        titre: 'Fuite d\'eau importante',
        description: 'Une fuite d\'eau majeure sur la voie publique.',
        statut: 'ACCEPTEE',
        affectationReclamation: 'AFFECTEE',
        categorie: 'EAU',
        communeId: 1, // Assumes commune 1 exists
        latitude: 33.4500,
        longitude: -7.5000,
        adresseComplete: 'Quartier Administratif, Médiouna',
        userId: user.id,
      }
    });
    await prisma.reclamation.create({
      data: {
        titre: 'Éclairage public défectueux',
        description: 'Plusieurs lampadaires ne fonctionnent plus dans la rue principale.',
        statut: 'REJETEE',
        motifRejet: 'Problème déjà signalé et en cours de résolution.',
        affectationReclamation: 'NON_AFFECTEE',
        categorie: 'ECLAIRAGE',
        communeId: 1,
        latitude: 33.4520,
        longitude: -7.5010,
        adresseComplete: 'Boulevard Mohammed V, Médiouna',
        userId: user.id,
      }
    });
    console.log('Dummy reclamations created.');
  } else {
    console.log(`User already has ${recs.length} reclamations.`);
  }

  // Check Suggestions
  const suggs = await prisma.suggestion.findMany({ where: { userId: user.id } });
  if (suggs.length === 0) {
    console.log('Creating dummy suggestions...');
    await prisma.suggestion.create({
      data: {
        titre: 'Aménagement d\'un parc pour enfants',
        description: 'Il serait bien d\'aménager un espace de jeux pour les enfants près de la nouvelle école.',
        statut: 'EN_EXAMEN',
        categorie: 'Aménagement urbain',
        userId: user.id,
      }
    });
    console.log('Dummy suggestions created.');
  } else {
    console.log(`User already has ${suggs.length} suggestions.`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
