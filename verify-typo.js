const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const roles = [
  {
    name: 'PUBLIC_AR',
    email: null,
    url: '/ar'
  },
  {
    name: 'CITOYEN_AR',
    email: 'citoyen_test@mediouna.ma',
    url: '/ar/mes-reclamations'
  },
  {
    name: 'DELEGATION_AR',
    email: 'delegation_test@mediouna.ma',
    url: '/ar/delegation'
  },
  {
    name: 'AUTORITE_LOCALE_AR',
    email: 'autorite_test@mediouna.ma',
    url: '/ar/autorite'
  },
  {
    name: 'COORDINATEUR_ACTIVITES_AR',
    email: 'coordinateur_test@mediouna.ma',
    url: '/ar/coordinateur'
  },
  {
    name: 'GOUVERNEUR_AR',
    email: 'gouverneur_test@mediouna.ma',
    url: '/ar/gouverneur'
  },
  {
    name: 'ADMIN_AR',
    email: 'admin_test@mediouna.ma',
    url: '/ar/admin'
  },
  {
    name: 'SUPER_ADMIN_AR',
    email: 'superadmin@medaction.ma',
    url: '/ar/super-admin'
  }
];

async function extractTypoStyles(page, pageName) {
  return await page.evaluate((name) => {
    const results = {
      page: name,
      elements: []
    };

    // Helper to extract styles for selected elements
    const getElementTypo = (selector, label) => {
      const el = document.querySelector(selector);
      if (el) {
        const style = window.getComputedStyle(el);
        return {
          label,
          selector,
          fontFamily: style.fontFamily,
          fontSize: style.fontSize,
          fontWeight: style.fontWeight,
          lineHeight: style.lineHeight,
          text: el.textContent ? el.textContent.trim().substring(0, 40) : ''
        };
      }
      return null;
    };

    // Extract H1, H2, H3
    const h1 = getElementTypo('h1', 'H1');
    if (h1) results.elements.push(h1);

    const h2 = getElementTypo('h2', 'H2');
    if (h2) results.elements.push(h2);

    const h3 = getElementTypo('h3', 'H3');
    if (h3) results.elements.push(h3);

    // Extract body text
    const p = getElementTypo('p', 'Texte Courant (p)');
    if (p) results.elements.push(p);

    const span = getElementTypo('span', 'Texte Courant (span)');
    if (span) results.elements.push(span);

    // Extract label
    const label = getElementTypo('label', 'Label de formulaire');
    if (label) results.elements.push(label);

    // Extract button
    const button = getElementTypo('button', 'Bouton');
    if (button) results.elements.push(button);

    // Extract input placeholder font family (we inspect input element)
    const input = getElementTypo('input', 'Input');
    if (input) results.elements.push(input);

    // Check third party elements (datepicker, toasts) if present
    const datepicker = getElementTypo('.react-datepicker', 'DatePicker');
    if (datepicker) results.elements.push(datepicker);

    const toast = getElementTypo('[data-sonner-toast]', 'Toast');
    if (toast) results.elements.push(toast);

    return results;
  }, pageName);
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const baseUrl = 'http://localhost:3000';
  const report = [];
  const screenshotDir = path.join(__dirname, 'public', 'images', 'typo-audit');

  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  // --- PRE-WARM / COMPILATION PHASE FOR NEXT.JS DEV MODE ---
  console.log('=== Pre-warming / compiling Arabic login route to avoid timeouts... ===');
  const warmContext = await browser.newContext();
  const warmPage = await warmContext.newPage();
  try {
    await warmPage.goto(`${baseUrl}/ar/login`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    console.log('=== Pre-warm loaded. Waiting 5s for compilation stabilization... ===');
    await warmPage.waitForTimeout(5000);
  } catch (e) {
    console.log('=== Pre-warm got a timeout or error, proceeding anyway:', e.message);
  } finally {
    await warmContext.close();
  }

  for (const role of roles) {
    console.log(`=== Auditing Typo for Role: ${role.name} ===`);
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      locale: 'ar-MA',
      timezoneId: 'Africa/Casablanca'
    });
    const page = await context.newPage();
    page.setDefaultTimeout(60000);

    try {
      if (role.email) {
        // Go to login page
        await page.goto(`${baseUrl}/ar/login`, { waitUntil: 'domcontentloaded' });
        await page.waitForSelector('input[type="email"]', { state: 'visible', timeout: 45000 });
        await page.fill('input[type="email"]', role.email);
        await page.fill('input[type="password"]', 'Password123!');
        
        const submitBtn = await page.$('button[type="submit"]');
        if (submitBtn) {
          await Promise.all([
            page.waitForURL(url => !url.href.includes('/login'), { timeout: 25000 }),
            submitBtn.click()
          ]);
        } else {
          await Promise.all([
            page.waitForURL(url => !url.href.includes('/login'), { timeout: 25000 }),
            page.click('button:has-text("Se connecter"), button:has-text("الدخول")', { force: true })
          ]);
        }
        console.log(`[DEBUG - ${role.name}] Authentication redirect completed successfully. URL is now:`, page.url());
        await page.waitForTimeout(2000); // Allow Next.js page hydration
      }

      // Navigate to role page
      console.log(`[DEBUG - ${role.name}] Navigating to target URL: ${baseUrl}${role.url}`);
      await page.goto(`${baseUrl}${role.url}`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(4000); // Wait for async API fetches to complete

      // Take screenshot for evidence
      const ssPath = path.join(screenshotDir, `${role.name.toLowerCase()}_screen.png`);
      await page.screenshot({ path: ssPath });
      console.log(`Saved screenshot: ${role.name.toLowerCase()}_screen.png`);

      // Extract typo styles
      const typoData = await extractTypoStyles(page, role.name);
      report.push(typoData);
    } catch (err) {
      console.error(`Error auditing role ${role.name}:`, err.message);
      report.push({ page: role.name, error: err.message });
    } finally {
      await context.close();
    }
  }

  // Save report to disk
  fs.writeFileSync(path.join(__dirname, 'typo_audit_report.json'), JSON.stringify(report, null, 2), 'utf8');
  console.log('Typo audit complete. JSON saved.');

  await browser.close();
}

main().catch(console.error);
