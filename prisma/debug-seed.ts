import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Copie locale pour éviter les problèmes d'import tsx/paths
const PERMISSIONS_LIST = [
  'auth.login', 'auth.register', 'auth.logout', 'auth.reset-password',
  'users.read', 'users.read.full', 'users.create', 'users.edit', 'users.delete', 
  'reclamations.read', 'reclamations.create', 'reclamations.edit', 'reclamations.delete',
  'evenements.read', 'evenements.create', 'evenements.validate',
  // ... on peut ajouter le reste plus tard ou via le fichier
];

async function seedPermissions() {
  console.log('🚀 Seeding Permissions (Debug Mode)...');

  try {
    await prisma.$connect();
    console.log('✅ Connected to DB');
    
    // Just a simple query to test
    const count = await prisma.permission.count();
    console.log(`Current permission count: ${count}`);

    // If we get here, connection is fine. 
    // Now let's try to verify if importing the types file works in a separate step or stick to self-contained.
    
    console.log('✅ Seeder check passed.');
  } catch (e) {
    console.error('❌ Error in seed:', e);
  } finally {
    await prisma.$disconnect();
  }
}

seedPermissions();
