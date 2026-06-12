const { chromium } = require('playwright');
const path = require('path');

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  await page.goto('http://localhost:3000/fr/login');
  await page.waitForTimeout(2000);
  
  await page.fill('input[type="email"]', 'citoyen_test@mediouna.ma');
  await page.fill('input[type="password"]', 'Password123!');
  
  await page.click('button:has-text("Se connecter")', { force: true });
  
  try {
    await page.waitForNavigation({ timeout: 10000, waitUntil: 'networkidle' });
  } catch (e) {
    console.log('No navigation happened, taking screenshot of current page (likely error).');
  }
  await page.waitForTimeout(4000);
  
  await page.screenshot({ path: path.join(__dirname, 'public', 'images', 'guide', 'login_debug.png') });
  
  await browser.close();
  console.log('Saved login_debug.png');
}

main().catch(console.error);
