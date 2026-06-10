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

    // Sometimes the sidebar isn't <aside>, it's a fixed div. We'll try common selectors.
    addZone('aside', 'Navigation Latérale');
    // For GOUVERNEUR which uses a custom div for sidebar
    addZone('div.fixed.w-72.bg-slate-900', 'Navigation');
    addZone('header', 'En-tête');
    addZone('main', 'Contenu Principal');
  });
}

const rolesToCapture = [
  {
    role: 'GOUVERNEUR',
    email: 'gouverneur_test@mediouna.ma',
    pages: [
      { name: 'Dashboard', url: '/gouverneur', action: null },
      { name: 'Performance', url: '/gouverneur', action: async (page) => {
        // click the 2nd nav button
        await page.evaluate(() => { const btns = document.querySelectorAll('nav button'); if(btns[1]) btns[1].click(); });
      }},
      { name: 'Reclamations', url: '/gouverneur', action: async (page) => {
        await page.evaluate(() => { const btns = document.querySelectorAll('nav button'); if(btns[2]) btns[2].click(); });
      }}
    ]
  },
  {
    role: 'DELEGATION',
    email: 'delegation_test@mediouna.ma',
    pages: [
      { name: 'Dashboard', url: '/delegation', action: null },
      { name: 'Evenements', url: '/delegation/evenements', action: null },
      { name: 'Etablissements', url: '/delegation/etablissements', action: null }
    ]
  },
  {
    role: 'COORDINATEUR',
    email: 'coordinateur_test@mediouna.ma',
    pages: [
      { name: 'Dashboard', url: '/coordinateur', action: null },
      { name: 'Activites', url: '/coordinateur/activites', action: null },
      { name: 'Calendrier', url: '/coordinateur/calendrier', action: null }
    ]
  },
  {
    role: 'ADMIN',
    email: 'admin_test@mediouna.ma',
    pages: [
      { name: 'Dashboard', url: '/admin', action: null },
      { name: 'Reclamations', url: '/admin/reclamations', action: null },
      { name: 'Utilisateurs', url: '/admin/utilisateurs', action: null }
    ]
  }
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
    for (const roleConfig of rolesToCapture) {
      console.log(`=== Processing Role: ${roleConfig.role} | Locale: ${locale} ===`);
      
      const context = await browser.newContext({
        viewport: { width: 1440, height: 900 },
        locale: locale === 'ar' ? 'ar-MA' : 'fr-FR',
        timezoneId: 'Africa/Casablanca'
      });
      
      const page = await context.newPage();
      
      page.on('console', msg => {
        if (msg.type() === 'error') console.log(`[BROWSER ERROR]`, msg.text());
      });
      
      // Login
      console.log(`Logging in ${roleConfig.role} for ${locale}...`);
      await page.goto(`${baseUrl}/${locale}/login`);
      
      try {
        await page.waitForTimeout(2000);
        await page.waitForSelector('input[type="email"]', { state: 'visible', timeout: 30000 });
        await page.fill('input[type="email"]', roleConfig.email);
        await page.fill('input[type="password"]', 'Password123!');
        
        const submitBtnSelector = locale === 'ar' ? 'button:has-text("الدخول للبوابة")' : 'button:has-text("Se connecter")';
        await page.click(submitBtnSelector, { force: true });
        
        // Wait for redirect to their respective dashboard
        await page.waitForTimeout(5000); 
        console.log(`Successfully logged in ${roleConfig.role}`);
      } catch (e) {
        console.error(`Failed to login for ${roleConfig.role} / ${locale}:`, e);
        continue;
      }

      for (const item of roleConfig.pages) {
        console.log(`Capturing ${roleConfig.role} -> ${item.name} (${locale})...`);
        
        if (item.action) {
           await item.action(page);
        } else {
           await page.goto(`${baseUrl}/${locale}${item.url}`);
        }
        
        // Wait for data to fully render
        await page.waitForTimeout(4000);

        // Apply visual zoning
        await markZones(page);
        
        // Small wait for CSS to render
        await page.waitForTimeout(500);

        const filename = `${item.name.toLowerCase()}_${roleConfig.role.toLowerCase()}_${locale}.png`;
        await page.screenshot({ 
          path: path.join(outDir, filename),
          fullPage: false // Capturing only viewport as a guide
        });
        
        // Save to project root too so we can easily copy it
        await page.screenshot({
          path: path.join(__dirname, filename),
          fullPage: false
        });
        
        console.log(`Saved ${filename}`);
      }

      await context.close();
    }
  }

  console.log('All captures done.');
  await browser.close();
}

main().catch(console.error);
