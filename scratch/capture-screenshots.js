const { chromium } = require('@playwright/test');
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
        if (totalHeight >= scrollHeight - window.innerHeight || totalHeight > 3000) {
          clearInterval(timer);
          window.scrollTo(0, 0); // Scroll back to top
          resolve();
        }
      }, 100);
    });
  });
}

async function captureLang(context, lang, suffix) {
  const page = await context.newPage();
  const outputDir = path.join(__dirname, '../public/images/guide');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  await page.addInitScript(() => {
    sessionStorage.setItem('hasSeenAnnouncement', 'true');
    sessionStorage.setItem('announcement_seen', 'true');
  });

  const routes = [
    { url: `/${lang}`, file: `home${suffix}.png` },
    { url: `/${lang}/etablissements`, file: `etablissements${suffix}.png` },
    { url: `/${lang}/carte`, file: `map${suffix}.png` },
    { url: `/${lang}/evenements`, file: `evenements${suffix}.png` },
    { url: `/${lang}/actualites`, file: `actualites${suffix}.png` },
    { url: `/${lang}/campagnes`, file: `campagnes${suffix}.png` },
    { url: `/${lang}/suggestions`, file: `participation${suffix}.png` },
    { url: `/${lang}/statistiques-publiques`, file: `statistiques${suffix}.png` },
    { url: `/${lang}/login`, file: `login${suffix}.png` },
    { url: `/${lang}/register`, file: `register${suffix}.png` },
    { url: `/${lang}/contact`, file: `contact${suffix}.png` },
    { url: `/${lang}/accessibilite`, file: `accessibilite${suffix}.png` },
    { url: `/${lang}/politique-confidentialite`, file: `confidentialite${suffix}.png` },
    { url: `/${lang}/conditions-utilisation`, file: `conditions${suffix}.png` },
    { url: `/${lang}/suggestions?new=true`, file: `suggestions_new${suffix}.png` }
  ];

  for (const target of routes) {
    const fullUrl = `https://bo.provincemediouna.ma${target.url}`;
    console.log(`[${lang.toUpperCase()}] Navigating to ${fullUrl}...`);
    try {
      await page.goto(fullUrl, { waitUntil: 'networkidle', timeout: 60000 });
      await autoScroll(page); // Trigger lazy loading
      await page.waitForTimeout(2000); // Wait for things to settle after scroll

      // Remove modals
      await page.evaluate(() => {
        const modal = document.querySelector('div.fixed.z-\\[100\\]');
        if (modal) modal.remove();
        document.querySelectorAll('div').forEach(div => {
          if (div.innerText && (div.innerText.includes('عيد الأضحى') || div.innerText.includes('مرحبًا بكم في بوابة مديونة'))) {
            let parent = div;
            while (parent && parent.tagName !== 'BODY') {
              if (window.getComputedStyle(parent).position === 'fixed') { parent.remove(); break; }
              parent = parent.parentElement;
            }
          }
        });
      });

      const outputPath = path.join(outputDir, target.file);
      await page.screenshot({ path: outputPath, fullPage: false }); // ALWAYS VIEWPORT
      console.log(`[${lang.toUpperCase()}] Captured ${target.file}`);
    } catch (e) {
      console.error(`Error capturing ${fullUrl}:`, e.message);
    }
  }
  await page.close();
}

async function run() {
  console.log('Starting viewport screenshots...');
  const browser = await chromium.launch({ headless: true });
  
  const arContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    locale: 'ar-MA',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0) Chrome/120.0.0.0 Safari/537.36'
  });
  await captureLang(arContext, 'ar', '_ar');
  
  const frContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    locale: 'fr-FR',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0) Chrome/120.0.0.0 Safari/537.36'
  });
  await captureLang(frContext, 'fr', '_fr');

  await browser.close();
  console.log('Finished capturing all viewport screenshots!');
}

run();
