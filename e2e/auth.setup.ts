import { test as setup, expect } from '@playwright/test';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const authFile = path.join(__dirname, '.auth/user.json');

/**
 * Setup d'authentification - Exécuté une fois avant tous les tests
 */
setup('authenticate', async ({ page }) => {
  // S'assurer que l'utilisateur test existe dans la base de données locale
  const prisma = new PrismaClient();
  const hashedPassword = await bcrypt.hash('TestPassword123!', 12);
  await prisma.user.upsert({
    where: { email: 'test@medaction.ma' },
    update: {
      role: 'ADMIN',
      isActive: true,
      isEmailVerifie: true,
    },
    create: {
      email: 'test@medaction.ma',
      nom: 'Test',
      prenom: 'Admin',
      motDePasse: hashedPassword,
      role: 'ADMIN',
      isActive: true,
      isEmailVerifie: true,
    }
  });
  await prisma.$disconnect();

  // Aller sur la page de connexion
  await page.goto('/login');
  
  // Attendre que la page soit chargée
  await page.waitForLoadState('networkidle');
  
  // Remplir le formulaire de connexion
  await page.fill('input[type="email"], input[name="email"]', 'test@medaction.ma');
  await page.fill('input[type="password"], input[name="password"]', 'TestPassword123!');
  
  // Cliquer sur le bouton de connexion
  await page.click('button[type="submit"]');
  
  // Attendre la redirection après connexion réussie
  await page.waitForURL((url) => 
    !url.pathname.includes('/login') && !url.pathname.includes('/register')
  , { timeout: 10000 }).catch(() => {
    // Si pas de redirection, on continue quand même pour les tests
    console.log('Note: Redirection après login non détectée, continuation...');
  });
  
  // Sauvegarder l'état d'authentification
  await page.context().storageState({ path: authFile });
});
