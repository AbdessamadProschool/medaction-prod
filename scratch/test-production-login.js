const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function main() {
  console.log('Lancement du navigateur...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  console.log('Navigation vers la page de connexion de production...');
  await page.goto('https://bo.provincemediouna.ma/fr/login');
  await page.waitForTimeout(3000);
  
  console.log('Remplissage du formulaire...');
  await page.fill('input[type="email"]', 'superadmin@medaction.ma');
  await page.fill('input[type="password"]', '12345678');
  
  console.log('Clic sur le bouton de connexion...');
  await page.click('button:has-text("Se connecter")', { force: true });
  
  console.log('Attente de la redirection...');
  await page.waitForTimeout(5000);
  
  const currentUrl = page.url();
  console.log('URL actuelle après connexion:', currentUrl);
  
  if (currentUrl.includes('/super-admin') || currentUrl.includes('/admin')) {
    console.log('CONNEXION RÉUSSIE !');
  } else {
    console.log('ÉCHEC DE CONNEXION. URL:', currentUrl);
    // Prendre une capture d'écran pour voir l'erreur
    await page.screenshot({ path: path.join(__dirname, 'login-failed.png') });
    console.log('Capture d\'échec sauvegardée.');
  }
  
  await browser.close();
}

main().catch(console.error);
