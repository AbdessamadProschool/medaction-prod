const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function markZones(page) {
  await page.evaluate(() => {
    // Inject CSS for zones if not already present
    if (!document.getElementById('zone-marker-styles')) {
      const style = document.createElement('style');
      style.id = 'zone-marker-styles';
      style.innerHTML = `
        .highlight-zone {
          position: relative !important;
        }
        .highlight-zone::after {
          content: attr(data-zone-name);
          position: absolute;
          top: 0;
          left: 0;
          background: rgba(239, 68, 68, 0.9);
          color: white;
          font-weight: bold;
          padding: 4px 8px;
          font-size: 12px;
          z-index: 10000;
          pointer-events: none;
          border-bottom-right-radius: 8px;
        }
        .highlight-zone::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          border: 3px dashed rgba(239, 68, 68, 0.8);
          background: rgba(239, 68, 68, 0.05);
          z-index: 9999;
          pointer-events: none;
        }
      `;
      document.head.appendChild(style);
    }

    // Function to add the zone securely
    const addZone = (selector, name) => {
      const el = document.querySelector(selector);
      if (el) {
        el.classList.add('highlight-zone');
        el.setAttribute('data-zone-name', name);
      }
    };

    // Typical public zones
    addZone('header', 'Navigation Principale');
    addZone('main', 'Contenu Principal');
    addZone('footer', 'Pied de page');
    
    // For auth pages
    addZone('form', "Formulaire d'Authentification");
    
    // Specific sections
    addZone('section.hero', 'Hero Section');
    addZone('#search-filters', 'Filtres de Recherche');
  });
}

const publicPagesToCapture = [
  { name: 'Accueil', url: '/' },
  { name: 'Etablissements', url: '/etablissements' },
  { name: 'Evenements', url: '/evenements' },
  { name: 'Carte', url: '/carte' },
  { name: 'Guide', url: '/guide' },
  { name: 'Login', url: '/login' },
  { name: 'Register', url: '/register' }
];

async function main() {
  const browser = await chromium.launch({ headless: true });
  const baseUrl = 'http://localhost:3000';
  const outDir = path.join(__dirname, 'public', 'images', 'guide');

  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const locales = ['fr', 'ar'];

  for (const locale of locales) {
    console.log(`=== Processing Public Pages | Locale: ${locale} ===`);
    
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      locale: locale === 'ar' ? 'ar-MA' : 'fr-FR',
      timezoneId: 'Africa/Casablanca'
    });
    
    const page = await context.newPage();
    
    page.on('console', msg => {
      if (msg.type() === 'error') console.log(`[BROWSER ERROR]`, msg.text());
    });

    for (const item of publicPagesToCapture) {
      console.log(`Capturing VISITEUR -> ${item.name} (${locale})...`);
      
      try {
        await page.goto(`${baseUrl}/${locale}${item.url}`, { waitUntil: 'networkidle', timeout: 60000 });
        
        // Wait for potential animations or images to load
        await page.waitForTimeout(3000);
        
        // Try to close cookie banners or introductory modals
        try {
          await page.evaluate(() => {
            document.querySelectorAll('button').forEach(btn => {
              const text = btn.innerText.toLowerCase();
              if (text.includes('ok') || text.includes('موافق') || text.includes('fermer') || text.includes('إغلاق')) {
                btn.click();
              }
            });
          });
          await page.waitForTimeout(1000);
        } catch (e) {}

        // Apply visual zoning
        await markZones(page);
        
        await page.waitForTimeout(500);

        const filename = `${item.name.toLowerCase()}_visiteur_${locale}.png`;
        
        await page.screenshot({ 
          path: path.join(outDir, filename),
          fullPage: false // Capturing only viewport to act as a realistic user view
        });
        
        await page.screenshot({
          path: path.join(__dirname, filename),
          fullPage: false
        });
        
        console.log(`Saved ${filename}`);
      } catch (e) {
        console.error(`Failed to capture ${item.name} (${locale}):`, e.message);
      }
    }

    await context.close();
  }

  console.log('All public captures done.');
  await browser.close();
}

main().catch(console.error);
