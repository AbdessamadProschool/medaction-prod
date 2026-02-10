import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seedSuperAdmin() {
  console.log('🚀 Création du Super Admin...');

  const email = 'superadmin@medaction.ma';
  const password = 'SuperAdmin123!';
  const hashedPassword = await bcrypt.hash(password, 12);

  try {
    // Vérifier si le super admin existe déjà
    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      console.log('⚠️ Le Super Admin existe déjà');
      console.log('  Email:', email);
      
      // S'assurer que le rôle est bien SUPER_ADMIN
      if (existing.role !== 'SUPER_ADMIN') {
        await prisma.user.update({
          where: { id: existing.id },
          data: { role: 'SUPER_ADMIN', isActive: true },
        });
        console.log('  Rôle mis à jour vers SUPER_ADMIN');
      }
      
      return;
    }

    // Créer le super admin
    const superAdmin = await prisma.user.create({
      data: {
        email,
        motDePasse: hashedPassword,
        nom: 'Admin',
        prenom: 'Super',
        telephone: '+212600000000',
        role: 'SUPER_ADMIN',
        isActive: true,
        isEmailVerifie: true,
      },
    });

    console.log('✅ Super Admin créé avec succès!');
    console.log('📧 Email:', email);
    console.log('🔑 Mot de passe:', password);

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedSuperAdmin();
