const { chromium } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

async function run() {
  console.log('Starting Playwright screenshot capture (comprehensive & clean)...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    locale: 'ar-MA',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  const page = await context.newPage();

  // Prevent welcome popup from showing by setting the correct session storage key
  await page.addInitScript(() => {
    sessionStorage.setItem('hasSeenAnnouncement', 'true');
    sessionStorage.setItem('announcement_seen', 'true');
  });

  const outputDir = path.join(__dirname, '../public/images/guide');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const targets = [
    { url: 'https://bo.provincemediouna.ma/ar', file: 'home.png', fullPage: true },
    { url: 'https://bo.provincemediouna.ma/ar/etablissements', file: 'etablissements.png', fullPage: true },
    { url: 'https://bo.provincemediouna.ma/ar/carte', file: 'map.png', fullPage: false },
    { url: 'https://bo.provincemediouna.ma/ar/evenements', file: 'evenements.png', fullPage: true },
    { url: 'https://bo.provincemediouna.ma/ar/actualites', file: 'actualites.png', fullPage: true },
    { url: 'https://bo.provincemediouna.ma/ar/campagnes', file: 'campagnes.png', fullPage: true },
    { url: 'https://bo.provincemediouna.ma/ar/suggestions', file: 'participation.png', fullPage: true },
    { url: 'https://bo.provincemediouna.ma/ar/statistiques-publiques', file: 'statistiques.png', fullPage: true }
  ];

  for (const target of targets) {
    console.log(`Navigating to ${target.url}...`);
    try {
      // Use 'load' state and a 45 second timeout
      await page.goto(target.url, { waitUntil: 'load', timeout: 45000 });
      
      // Wait 5 seconds for all visual elements/maps/charts to load and settle
      await page.waitForTimeout(5000);
      
      // Additional check to remove any active modal overlays if they still manage to appear
      await page.evaluate(() => {
        const modal = document.querySelector('div.fixed.z-\\[100\\]');
        if (modal) {
          modal.remove();
        }
        // Force-remove global announcement overlay if present
        document.querySelectorAll('div').forEach(div => {
          if (div.innerText && (div.innerText.includes('عيد الأضحى') || div.innerText.includes('مرحبًا بكم في بوابة مديونة'))) {
            // Find its top-level parent modal container and remove it
            let parent = div;
            while (parent && parent.tagName !== 'BODY') {
              if (window.getComputedStyle(parent).position === 'fixed') {
                parent.remove();
                break;
              }
              parent = parent.parentElement;
            }
          }
        });
      });
      
      const outputPath = path.join(outputDir, target.file);
      await page.screenshot({ path: outputPath, fullPage: target.fullPage });
      console.log(`Successfully captured and saved to ${outputPath}`);
    } catch (e) {
      console.error(`Error capturing ${target.url}:`, e.message);
    }
  }

  await browser.close();
  console.log('Finished capturing screenshots!');
}

run();
