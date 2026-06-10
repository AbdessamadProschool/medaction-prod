const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function autoScroll(page) {
    await page.evaluate(async () => {
        await new Promise((resolve) => {
            let totalHeight = 0;
            const distance = 100;
            const timer = setInterval(() => {
                const scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;

                if (totalHeight >= scrollHeight - window.innerHeight) {
                    clearInterval(timer);
                    // Scroll back to top
                    window.scrollTo(0, 0);
                    setTimeout(resolve, 500); // Wait for things to settle
                }
            }, 100);
        });
    });
}

async function capture() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  const baseUrl = 'http://localhost:3000';
  const outDir = path.join(__dirname, 'public', 'images', 'guide');

  const locales = ['ar'];

  // Define routes to capture
  const routes = [
    { url: '/mes-reclamations', filename: 'mes_reclamations' },
    { url: '/suggestions', filename: 'suggestions_citoyen' }
  ];

  for (const locale of locales) {
    console.log(`\n=== Processing locale: ${locale} ===`);
    
    try {
      // Login
      console.log(`Logging in for ${locale}...`);
      page.setDefaultTimeout(120000); // 120 seconds
      await page.goto(`${baseUrl}/${locale}/login`);
      
      await page.waitForSelector('input[type="email"]', { state: 'visible', timeout: 120000 });
      
      // Try to dismiss the beta modal if it appears
      try {
        await page.click('button:has-text("OK")', { timeout: 2000 });
      } catch (e) {
        // Modal not present, ignore
      }

      await page.fill('input[type="email"]', 'citoyen_test2@mediouna.ma');
      await page.fill('input[type="password"]', 'Password123!');
      await page.click('button[type="submit"]');
      
      // Wait for login to complete and redirect
      await page.waitForURL(url => !url.href.includes('/login'), { timeout: 120000 });
      console.log('Logged in successfully!');
      
      // Wait a bit for the session to be fully established and UI to stabilize
      await page.waitForTimeout(5000);
    } catch (e) {
      console.error('Error during login:', e);
      await page.screenshot({ path: path.join(outDir, `debug_login_${locale}.png`) });
      throw e;
    }

    for (const route of routes) {
      console.log(`Capturing ${route.url}...`);
      const targetUrl = `${baseUrl}/${locale}${route.url}`;
      await page.goto(targetUrl, { timeout: 120000 });
      
      await page.waitForLoadState('load', { timeout: 120000 });
      await page.waitForTimeout(5000); // Extra wait for client-side data
      
      await autoScroll(page);
      
      const screenshotPath = path.join(outDir, `${route.filename}_${locale}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: false });
      console.log(`Saved ${screenshotPath}`);
    }
    
    // Logout to prepare for next locale
    console.log('Logging out...');
    await page.goto(`${baseUrl}/${locale}`);
    await page.waitForTimeout(2000);
    
    // Try to click logout if there's a button, or just clear cookies
    await context.clearCookies();
  }

  await browser.close();
}

capture().catch(console.error);
