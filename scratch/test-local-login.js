const { chromium } = require('playwright');

async function main() {
  console.log('Lancement du navigateur...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  console.log('Navigation vers la page de connexion locale...');
  await page.goto('http://localhost:3000/fr/login');
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
    await page.screenshot({ path: 'C:/Users/Proschool/Desktop/medaction/scratch/local-login-failed.png' });
    console.log('Capture d\'échec sauvegardée.');
  }
  
  await browser.close();
}

main().catch(console.error);
