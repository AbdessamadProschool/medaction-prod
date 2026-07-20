const { chromium } = require('playwright');
const path = require('path');

async function main() {
  console.log('Lancement du navigateur Chromium de Playwright...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  console.log('Navigation vers http://localhost:3000/fr/login...');
  await page.goto('http://localhost:3000/fr/login', { waitUntil: 'networkidle' });
  
  console.log('Remplissage des identifiants...');
  await page.fill('input[type="email"]', 'superadmin@medaction.ma');
  await page.fill('input[type="password"]', 'Password123!');
  await page.waitForTimeout(1000);
  
  console.log('Clic sur le bouton de connexion et attente de la navigation...');
  await Promise.all([
    page.click('button[type="submit"], button:has-text("Se connecter")', { force: true }),
    page.waitForNavigation({ timeout: 15000, waitUntil: 'networkidle' }).catch(e => console.log('Navigation timeout ou déjà effectuée:', e.message))
  ]);
  
  await page.waitForTimeout(5000);
  
  const currentUrl = page.url();
  console.log('URL actuelle après soumission:', currentUrl);
  
  const imgPath = path.join(__dirname, 'local-login-robust-result.png');
  await page.screenshot({ path: imgPath });
  console.log('Capture d\'écran du résultat sauvegardée dans scratch/local-login-robust-result.png');
  
  if (currentUrl.includes('/super-admin') || currentUrl.includes('/admin')) {
    console.log('CONNEXION LOCALE RÉUSSIE !');
  } else {
    console.log('ÉCHEC DE CONNEXION LOCALE.');
    const errorText = await page.locator('.text-red-500, .bg-red-50').innerText().catch(() => 'Aucune erreur visible.');
    console.log('Message d\'erreur détecté:', errorText);
  }
  
  await browser.close();
}

main().catch(console.error);
