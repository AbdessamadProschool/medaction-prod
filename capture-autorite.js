const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function main() {
  const browser = await chromium.launch({ headless: true });
  const baseUrl = 'http://localhost:3000';
  const outDir = path.join(__dirname, 'public', 'images', 'guide');

  // Ensure output directory exists
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const locales = ['fr', 'ar'];

  for (const locale of locales) {
    console.log(`=== Processing locale: ${locale} ===`);
    
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      locale: locale === 'ar' ? 'ar-MA' : 'fr-FR',
      timezoneId: 'Africa/Casablanca'
    });
    
    const page = await context.newPage();
    
    page.on('console', msg => {
      if (msg.type() === 'error' || msg.type() === 'warning') {
        console.log(`[BROWSER ${msg.type().toUpperCase()}]`, msg.text());
      }
    });
    page.on('pageerror', error => console.log('[BROWSER UNCAUGHT EXCEPTION]', error));
    
    // Login
    console.log(`Logging in for ${locale}...`);
    await page.goto(`${baseUrl}/${locale}/login`);
    
    // Try to dismiss the beta modal if it appears
    try {
      await page.waitForTimeout(5000); // Give it time to show up
      await page.waitForSelector('button:has-text("OK"), button:has-text("موافق")', { timeout: 5000 });
      const buttons = await page.$$('button');
      for (const btn of buttons) {
        const text = await btn.textContent();
        if (text && (text.includes('OK') || text.includes('موافق') || text.includes('Compris') || text.includes('فهمت'))) {
          await btn.click({ force: true });
          await page.waitForTimeout(1000); // Wait for modal to disappear
          break;
        }
      }
    } catch (e) {
      console.log('No beta modal, continuing...');
    }
    
    // Fill credentials
    try {
      await page.waitForSelector('input[type="email"]', { state: 'visible', timeout: 60000 });
      await page.fill('input[type="email"]', 'autorite_test@mediouna.ma');
      // Wait a bit to ensure UI is ready
      await page.waitForTimeout(2000);
      
      await page.fill('input[type="password"]', 'Password123!');
      
      const submitBtnSelector = locale === 'ar' ? 'button:has-text("الدخول للبوابة")' : 'button:has-text("Se connecter")';
      await page.click(submitBtnSelector, { force: true });
      
      // Wait for navigation to dashboard
      await page.waitForURL(`**/${locale}/autorite**`, { timeout: 60000 });
      console.log(`Successfully logged in for ${locale}`);
    } catch (e) {
      console.error(`Failed to login for ${locale}:`, e);
      await page.screenshot({ path: `login_failed_${locale}.png` });
      continue;
    }

    // Wait a bit for the data to load
    await page.waitForTimeout(3000);

    const pagesToCapture = [
      {
        url: `${baseUrl}/${locale}/autorite`,
        filename: `dashboard_autorite_${locale}.png`,
        name: 'Dashboard'
      },
      {
        url: `${baseUrl}/${locale}/autorite/reclamations`,
        filename: `reclamations_autorite_${locale}.png`,
        name: 'Réclamations'
      },
      {
        url: `${baseUrl}/${locale}/autorite/etablissement`,
        filename: `etablissement_autorite_${locale}.png`,
        name: 'Etablissements'
      },
      {
        url: `${baseUrl}/${locale}/autorite/statistiques`,
        filename: `statistiques_autorite_${locale}.png`,
        name: 'Statistiques'
      }
    ];

    for (const item of pagesToCapture) {
      console.log(`Capturing ${item.name} (${locale})...`);
      await page.goto(item.url);
      
      // Try to dismiss any modals or cookie banners
      try {
        await page.evaluate(() => {
          document.querySelectorAll('button').forEach(btn => {
            if (btn.innerText.includes('OK') || btn.innerText.includes('موافق')) {
              btn.click();
            }
          });
        });
      } catch (e) {}

      // Wait for data to fully render
      await page.waitForTimeout(4000);

      // Screenshot full page or viewport? Viewport is often better for a guide
      await page.screenshot({ 
        path: path.join(outDir, item.filename),
        fullPage: false // Only viewport so it looks like what the user sees
      });
      console.log(`Saved ${item.filename}`);
    }

    // Logout for next locale
    console.log(`Logging out for ${locale}...`);
    try {
      await page.goto(`${baseUrl}/${locale}`);
      // find logout button by href or text
      await page.evaluate(() => {
        // clear localstorage or cookies to force logout
        localStorage.clear();
        sessionStorage.clear();
      });
      // also clear cookies in context
      await context.clearCookies();
    } catch (e) {
      console.error(`Error logging out for ${locale}:`, e);
    }
  }

  console.log('All captures done.');
  await browser.close();
}

main().catch(console.error);
