const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const roles = [
  {
    name: 'PUBLIC',
    email: null,
    url: '/fr'
  },
  {
    name: 'CITOYEN',
    email: 'citoyen_test@mediouna.ma',
    url: '/fr/mes-reclamations'
  },
  {
    name: 'DELEGATION',
    email: 'delegation_test@mediouna.ma',
    url: '/fr/delegation'
  },
  {
    name: 'AUTORITE_LOCALE',
    email: 'autorite_test@mediouna.ma',
    url: '/fr/autorite'
  },
  {
    name: 'GOUVERNEUR',
    email: 'gouverneur_test@mediouna.ma',
    url: '/fr/gouverneur'
  }
];

async function extractLayoutStyles(page, pageName) {
  return await page.evaluate((name) => {
    const data = {
      page: name,
      borderRadius: [],
      boxShadow: [],
      paddingKPI: [],
      containers: []
    };

    // Helper to log computed values
    const addVal = (list, val, elementInfo) => {
      if (val && val !== 'none' && val !== '0px') {
        // Normalize val a bit
        list.push({ val, element: elementInfo });
      }
    };

    // 1. Audit Buttons
    document.querySelectorAll('button').forEach((el, i) => {
      if (i < 5) {
        const style = window.getComputedStyle(el);
        addVal(data.borderRadius, style.borderRadius, `button (${el.textContent.trim().substring(0, 15)})`);
        addVal(data.boxShadow, style.boxShadow, `button (${el.textContent.trim().substring(0, 15)})`);
      }
    });

    // 2. Audit Inputs
    document.querySelectorAll('input, select').forEach((el, i) => {
      if (i < 5) {
        const style = window.getComputedStyle(el);
        addVal(data.borderRadius, style.borderRadius, `input/select (${el.placeholder || el.name || 'input'})`);
      }
    });

    // 3. Audit Cards
    // Cards usually have rounded margins, white or card background, and border/shadows
    document.querySelectorAll('div').forEach((el) => {
      const className = el.className || '';
      const isCard = className.includes('card') || 
                     (className.includes('bg-white') && (className.includes('rounded-') || className.includes('shadow')));
      
      if (isCard) {
        const style = window.getComputedStyle(el);
        addVal(data.borderRadius, style.borderRadius, `card (${className.substring(0, 25)})`);
        addVal(data.boxShadow, style.boxShadow, `card (${className.substring(0, 25)})`);
        
        // Internal padding of cards (check KPI cards specifically)
        const text = el.textContent || '';
        const isKPI = text.match(/\d+/) && (text.includes('Total') || text.includes('cours') || text.includes('Réclamations') || text.includes('إجمالي') || text.includes('مستقبلة'));
        if (isKPI) {
          data.paddingKPI.push({
            element: `KPI Card (${className.substring(0, 25)})`,
            paddingTop: style.paddingTop,
            paddingBottom: style.paddingBottom,
            paddingLeft: style.paddingLeft,
            paddingRight: style.paddingRight
          });
        }
      }
    });

    // 4. Audit Containers Max Width & Lateral Margins
    // Typically .container or max-w-7xl, or direct child of main
    document.querySelectorAll('main, .container, [class*="max-w-"]').forEach((el) => {
      const style = window.getComputedStyle(el);
      const className = el.className || '';
      if (style.maxWidth && style.maxWidth !== 'none') {
        data.containers.push({
          element: `${el.tagName.toLowerCase()}.${className.split(' ').join('.')}`,
          maxWidth: style.maxWidth,
          marginLeft: style.marginLeft,
          marginRight: style.marginRight,
          paddingLeft: style.paddingLeft,
          paddingRight: style.paddingRight
        });
      }
    });

    return data;
  }, pageName);
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const baseUrl = 'http://localhost:3000';
  const report = [];

  for (const role of roles) {
    console.log(`=== Auditing Layout for Role: ${role.name} ===`);
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      locale: 'fr-FR',
      timezoneId: 'Africa/Casablanca'
    });
    const page = await context.newPage();
    page.setDefaultTimeout(60000);

    try {
      if (role.email) {
        // Go to login page
        await page.goto(`${baseUrl}/fr/login`, { waitUntil: 'networkidle' });
        await page.waitForSelector('input[type="email"]', { state: 'visible', timeout: 30000 });
        await page.fill('input[type="email"]', role.email);
        await page.fill('input[type="password"]', 'Password123!');
        
        const submitBtn = await page.$('button[type="submit"]');
        if (submitBtn) {
          await submitBtn.click();
        } else {
          await page.click('button:has-text("Se connecter")', { force: true });
        }
        await page.waitForTimeout(5000); // Wait for transition
      }

      // Navigate to role page
      await page.goto(`${baseUrl}${role.url}`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(4000); // Wait for content load

      // Extract layout styles
      const layoutData = await extractLayoutStyles(page, role.name);
      report.push(layoutData);
    } catch (err) {
      console.error(`Error auditing role ${role.name}:`, err.message);
      report.push({ page: role.name, error: err.message });
    } finally {
      await context.close();
    }
  }

  // Save report to disk
  fs.writeFileSync(path.join(__dirname, 'layout_audit_report.json'), JSON.stringify(report, null, 2), 'utf8');
  console.log('Layout audit complete. JSON saved.');

  await browser.close();
}

main().catch(console.error);
