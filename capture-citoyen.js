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

    addZone('header', 'Navigation Principale');
    addZone('main', 'Contenu Principal');
    addZone('footer', 'Pied de page');
    addZone('form', 'Formulaire Citoyen');
  });
}

const citoyenPagesToCapture = [
  { name: 'Profil', filename: 'profil', url: '/profil' },
  { name: 'Nouvelle_Reclamation', filename: 'nouvelle_reclamation', url: '/nouvelle-reclamation' },
  { name: 'Mes_Reclamations', filename: 'mes_reclamations', url: '/mes-reclamations' },
  { name: 'Participation', filename: 'participation', url: '/suggestions' }
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
    console.log(`=== Processing CITOYEN Pages | Locale: ${locale} ===`);
    
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      locale: locale === 'ar' ? 'ar-MA' : 'fr-FR',
      timezoneId: 'Africa/Casablanca'
    });
    
    const page = await context.newPage();
    
    page.on('console', msg => {
      if (msg.type() === 'error') console.log(`[BROWSER ERROR]`, msg.text());
    });

    // Login CITOYEN
    console.log(`Logging in CITOYEN for ${locale}...`);
    await page.goto(`${baseUrl}/${locale}/login`, { waitUntil: 'networkidle', timeout: 60000 });
    
    try {
      await page.waitForTimeout(2000);
      await page.waitForSelector('input[type="email"]', { state: 'visible', timeout: 30000 });
      await page.fill('input[type="email"]', 'citoyen_test@mediouna.ma'); // The correct test citoyen email
      await page.fill('input[type="password"]', 'Password123!');
      
      const submitBtnSelector = locale === 'ar' ? 'button:has-text("الدخول للبوابة")' : 'button:has-text("Se connecter")';
      await page.click(submitBtnSelector, { force: true });
      
      await page.waitForTimeout(5000); 
      console.log(`Successfully logged in CITOYEN`);
    } catch (e) {
      console.error(`Failed to login for CITOYEN / ${locale}:`, e);
      continue;
    }

    for (const item of citoyenPagesToCapture) {
      console.log(`Capturing CITOYEN -> ${item.name} (${locale})...`);
      
      try {
        await page.goto(`${baseUrl}/${locale}${item.url}`, { waitUntil: 'networkidle', timeout: 60000 });
        
        await page.waitForTimeout(3000);
        
        // Remove cookie banners / modals
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

        await markZones(page);
        
        await page.waitForTimeout(500);

        const filename = `${item.filename}_${locale}.png`;
        
        await page.screenshot({ 
          path: path.join(outDir, filename),
          fullPage: false
        });
        
        console.log(`Saved ${filename}`);
      } catch (e) {
        console.error(`Failed to capture ${item.name} (${locale}):`, e.message);
      }
    }

    await context.close();
  }

  console.log('All CITOYEN captures done.');
  await browser.close();
}

main().catch(console.error);
