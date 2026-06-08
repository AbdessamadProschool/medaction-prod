const { chromium } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

async function run() {
  console.log('Starting Playwright screenshot capture (improved)...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    locale: 'ar-MA',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  const page = await context.newPage();

  const outputDir = path.join(__dirname, '../public/images/guide');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const targets = [
    { url: 'https://bo.provincemediouna.ma/ar', file: 'home.png' },
    { url: 'https://bo.provincemediouna.ma/ar/carte', file: 'map.png' },
    { url: 'https://bo.provincemediouna.ma/ar/evenements', file: 'news.png' },
    { url: 'https://bo.provincemediouna.ma/ar/suggestions', file: 'participation.png' },
    { url: 'https://bo.provincemediouna.ma/ar/reclamations/nouvelle', file: 'reclamation.png' }
  ];

  for (const target of targets) {
    console.log(`Navigating to ${target.url}...`);
    try {
      // Use 'load' state and a 45 second timeout
      await page.goto(target.url, { waitUntil: 'load', timeout: 45000 });
      
      // Wait 5 seconds for all visual elements/maps/charts to load and settle
      await page.waitForTimeout(5000);
      
      const outputPath = path.join(outputDir, target.file);
      await page.screenshot({ path: outputPath, fullPage: false });
      console.log(`Successfully captured and saved to ${outputPath}`);
    } catch (e) {
      console.error(`Error capturing ${target.url}:`, e.message);
    }
  }

  await browser.close();
  console.log('Finished capturing screenshots!');
}

run();
