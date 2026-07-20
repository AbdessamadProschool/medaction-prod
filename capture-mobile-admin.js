const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const outDir = path.join(__dirname, 'public', 'images', 'mobile-audit');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

async function closeBetaModal(page) {
  try {
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const okBtn = btns.find(b => b.textContent.trim() === 'OK');
      if (okBtn) okBtn.click();
    });
    await page.waitForTimeout(1000);
  } catch (e) {}
}

async function login(page, email, password = 'Password123!', locale = 'fr') {
  console.log(`Logging in ${email} for ${locale}...`);
  await page.goto(`http://localhost:3000/${locale}/login`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  
  await closeBetaModal(page);
  
  await page.waitForSelector('input[type="email"]', { state: 'visible', timeout: 10000 });
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  
  const submitBtnSelector = 'button[type="submit"]'; // more robust
  await page.click(submitBtnSelector, { force: true });
  await page.waitForTimeout(5000);
}

const allPages = [
  // Admin pages
  { name: 'admin-dashboard', path: '/admin' },
  { name: 'admin-reclamations', path: '/admin/reclamations' },
  { name: 'admin-utilisateurs', path: '/admin/utilisateurs' },
  { name: 'admin-etablissements', path: '/admin/etablissements' },
  { name: 'admin-evenements', path: '/admin/evenements' },
  { name: 'admin-actualites', path: '/admin/actualites' },
  { name: 'admin-articles', path: '/admin/articles' },
  { name: 'admin-campagnes', path: '/admin/campagnes' },
  { name: 'admin-programmes', path: '/admin/programmes-activites' },
  { name: 'admin-bilans', path: '/admin/bilans' },
  { name: 'admin-validation', path: '/admin/validation' },
  { name: 'admin-messages', path: '/admin/messages' },
  { name: 'admin-suggestions', path: '/admin/suggestions' },
  { name: 'admin-logs', path: '/admin/logs' },
  { name: 'admin-settings', path: '/admin/settings' },
  { name: 'admin-profil', path: '/admin/profil' },
  // Super Admin pages
  { name: 'superadmin-dashboard', path: '/super-admin' },
  { name: 'superadmin-admins', path: '/super-admin/admins' },
  { name: 'superadmin-audit', path: '/super-admin/audit' },
  { name: 'superadmin-licence', path: '/super-admin/licence' },
  { name: 'superadmin-settings', path: '/super-admin/settings' },
];

async function capturePages(context, pages, locale = 'fr') {
  const page = await context.newPage();
  
  for (const p of pages) {
    try {
      console.log(`Capturing ${p.name}...`);
      await page.goto(`http://localhost:3000/${locale}${p.path}`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(3000); // give it more time to render data
      
      await closeBetaModal(page);

      await page.screenshot({ path: path.join(outDir, `${p.name}.png`), fullPage: true });
    } catch (err) {
      console.log(`Failed to capture ${p.name}: ${err.message}`);
    }
  }
  await page.close();
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 360, height: 800 },
    locale: 'fr-FR',
    timezoneId: 'Africa/Casablanca'
  });

  const loginPage = await context.newPage();
  
  // Use Super Admin for ALL pages
  await login(loginPage, 'superadmin@medaction.ma', 'Password123!', 'fr');
  await capturePages(context, allPages, 'fr');

  console.log('Done capturing mobile screenshots.');
  await browser.close();
}

main().catch(console.error);
