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
    name: 'COORDINATEUR_ACTIVITES',
    email: 'coordinateur_test@mediouna.ma',
    url: '/fr/coordinateur'
  },
  {
    name: 'GOUVERNEUR',
    email: 'gouverneur_test@mediouna.ma',
    url: '/fr/gouverneur'
  },
  {
    name: 'ADMIN',
    email: 'admin_test@mediouna.ma',
    url: '/fr/admin'
  },
  {
    name: 'SUPER_ADMIN',
    email: 'superadmin@medaction.ma',
    url: '/fr/super-admin'
  }
];

// Helper to convert rgb/rgba color to hex
function rgbToHex(rgb) {
  if (!rgb) return null;
  const matches = rgb.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)$/);
  if (!matches) return rgb;
  const r = parseInt(matches[1], 10);
  const g = parseInt(matches[2], 10);
  const b = parseInt(matches[3], 10);
  
  const toHex = (c) => {
    const hex = c.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

async function extractStyles(page, roleName) {
  return await page.evaluate((role) => {
    const results = {};
    
    // 1. Body background
    const body = document.body;
    if (body) {
      const style = window.getComputedStyle(body);
      results.bodyBg = style.backgroundColor;
      results.bodyText = style.color;
    }
    
    // 2. Primary buttons
    const primaryBtns = Array.from(document.querySelectorAll('button, a')).filter(el => {
      const text = el.textContent ? el.textContent.toLowerCase() : '';
      const classes = el.className ? el.className.toLowerCase() : '';
      return classes.includes('primary') || classes.includes('bg-gov-blue') || classes.includes('bg-primary') || text.includes('enregistrer') || text.includes('valider') || text.includes('ajouter') || text.includes('créer') || text.includes('se connecter');
    });
    
    if (primaryBtns.length > 0) {
      const style = window.getComputedStyle(primaryBtns[0]);
      results.primaryBtnBg = style.backgroundColor;
      results.primaryBtnText = style.color;
    } else {
      // Fallback
      results.primaryBtnBg = 'N/A';
      results.primaryBtnText = 'N/A';
    }
    
    // 3. Secondary buttons
    const secondaryBtns = Array.from(document.querySelectorAll('button, a')).filter(el => {
      const classes = el.className ? el.className.toLowerCase() : '';
      return classes.includes('secondary') || classes.includes('border') || classes.includes('bg-white') || classes.includes('bg-secondary');
    });
    
    if (secondaryBtns.length > 0) {
      const style = window.getComputedStyle(secondaryBtns[0]);
      results.secondaryBtnBg = style.backgroundColor;
      results.secondaryBtnText = style.color;
      results.secondaryBtnBorder = style.borderColor;
    } else {
      results.secondaryBtnBg = 'N/A';
      results.secondaryBtnText = 'N/A';
      results.secondaryBtnBorder = 'N/A';
    }
    
    // 4. Input borders
    const inputs = document.querySelectorAll('input, select, textarea');
    if (inputs.length > 0) {
      const style = window.getComputedStyle(inputs[0]);
      results.inputBorder = style.borderColor;
      results.inputBg = style.backgroundColor;
    } else {
      results.inputBorder = 'N/A';
      results.inputBg = 'N/A';
    }
    
    // 5. Badges de statut
    // Rechercher les éléments avec des classes de couleurs de statuts communes
    const statusBadges = Array.from(document.querySelectorAll('span, div')).filter(el => {
      const text = el.textContent ? el.textContent.trim().toLowerCase() : '';
      const classes = el.className ? el.className.toLowerCase() : '';
      return (classes.includes('badge') || classes.includes('rounded-full') || classes.includes('status')) && 
             (text === 'en attente' || text === 'publié' || text === 'en cours' || text === 'clôturé' || text === 'rejeté' || text === 'résolu');
    });
    
    results.statuses = [];
    statusBadges.forEach(badge => {
      const style = window.getComputedStyle(badge);
      results.statuses.push({
        text: badge.textContent.trim(),
        bg: style.backgroundColor,
        color: style.color
      });
    });
    
    // 6. Liens
    const links = document.querySelectorAll('a');
    if (links.length > 0) {
      // Find a visible link that is not a button
      let foundLink = null;
      for (const link of Array.from(links)) {
        const classes = link.className ? link.className.toLowerCase() : '';
        if (!classes.includes('button') && !classes.includes('bg-') && link.textContent && link.textContent.trim().length > 0) {
          foundLink = link;
          break;
        }
      }
      if (foundLink) {
        const style = window.getComputedStyle(foundLink);
        results.linkLabel = foundLink.textContent.trim().substring(0, 20);
        results.linkColor = style.color;
      } else {
        const style = window.getComputedStyle(links[0]);
        results.linkLabel = 'Default link';
        results.linkColor = style.color;
      }
    } else {
      results.linkColor = 'N/A';
    }
    
    return results;
  }, roleName);
}

async function dismissAnnouncement(page) {
  try {
    const okBtn = await page.$('button:has-text("OK")');
    if (okBtn) {
      await okBtn.click();
      await page.waitForTimeout(1000); // Wait for fade out animation
      console.log('Dismissed global announcement popup');
    }
  } catch (e) {
    // Ignore if not present
  }
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const baseUrl = 'http://localhost:3000';
  const report = {};
  const screenshotDir = path.join(__dirname, 'public', 'images', 'charte-audit');

  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  // --- PRE-WARM / COMPILATION PHASE FOR NEXT.JS DEV MODE ---
  console.log('=== Pre-warming / compiling login route to avoid timeouts... ===');
  const warmContext = await browser.newContext();
  const warmPage = await warmContext.newPage();
  try {
    // Wait up to 60s for initial compilation
    await warmPage.goto(`${baseUrl}/fr/login`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    console.log('=== Pre-warm loaded. Waiting 5s for compilation stabilization... ===');
    await warmPage.waitForTimeout(5000);
  } catch (e) {
    console.log('=== Pre-warm got a timeout or error, proceeding anyway:', e.message);
  } finally {
    await warmContext.close();
  }

  for (const role of roles) {
    console.log(`=== Auditing Role: ${role.name} ===`);
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      locale: 'fr-FR',
      timezoneId: 'Africa/Casablanca'
    });
    const page = await context.newPage();
    page.setDefaultTimeout(60000);

    // Capture console messages from the browser
    page.on('console', msg => {
      console.log(`[Browser Console - ${role.name}] ${msg.type()}: ${msg.text()}`);
    });

    try {
      if (role.email) {
        // Go to login page
        await page.goto(`${baseUrl}/fr/login`, { waitUntil: 'domcontentloaded' });
        await dismissAnnouncement(page);
        
        try {
          // Timeout augmenté à 45s car la compilation peut encore prendre du temps en dev
          await page.waitForSelector('input[type="email"]', { state: 'visible', timeout: 45000 });
        } catch (selectorErr) {
          const errPath = path.join(screenshotDir, `login_timeout_${role.name.toLowerCase()}.png`);
          await page.screenshot({ path: errPath });
          console.error(`[DEBUG] Saved timeout screenshot to ${errPath}`);
          throw selectorErr;
        }
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
            page.click('button:has-text("Se connecter")', { force: true })
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

      // Extract colors
      const rawStyles = await extractStyles(page, role.name);
      
      // Format colors
      const styles = {
        bodyBg: rgbToHex(rawStyles.bodyBg),
        bodyText: rgbToHex(rawStyles.bodyText),
        primaryBtnBg: rgbToHex(rawStyles.primaryBtnBg),
        primaryBtnText: rgbToHex(rawStyles.primaryBtnText),
        secondaryBtnBg: rgbToHex(rawStyles.secondaryBtnBg),
        secondaryBtnText: rgbToHex(rawStyles.secondaryBtnText),
        secondaryBtnBorder: rgbToHex(rawStyles.secondaryBtnBorder),
        inputBorder: rgbToHex(rawStyles.inputBorder),
        inputBg: rgbToHex(rawStyles.inputBg),
        linkColor: rgbToHex(rawStyles.linkColor),
        statuses: (rawStyles.statuses || []).map(s => ({
          text: s.text,
          bg: rgbToHex(s.bg),
          color: rgbToHex(s.color)
        }))
      };

      report[role.name] = styles;
    } catch (err) {
      console.error(`Error auditing role ${role.name}:`, err.message);
      report[role.name] = { error: err.message };
    } finally {
      await context.close();
    }
  }

  // --- SPECIFIC TEST FOR THIRD-PARTY GovDatePicker / DatePicker ---
  // Let's audit a creation page with datepicker
  try {
    console.log(`=== Auditing Third Party DatePicker / GovDatePicker ===`);
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      locale: 'fr-FR',
      timezoneId: 'Africa/Casablanca'
    });
    const page = await context.newPage();
    page.setDefaultTimeout(60000);
    
    // Login as Delegation (which has event creation form)
    await page.goto(`${baseUrl}/fr/login`, { waitUntil: 'networkidle' });
    await page.waitForSelector('input[type="email"]', { state: 'visible', timeout: 30000 });
    await page.fill('input[type="email"]', 'delegation_test@mediouna.ma');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(4000);
    
    // Go to create event page
    await page.goto(`${baseUrl}/fr/delegation/evenements`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    
    // Click on "Nouvel événement" to open creation form/page
    const createBtn = await page.$('button:has-text("Nouvel événement")');
    if (createBtn) {
      await createBtn.click();
    } else {
      // try to go directly if direct routing is available
      await page.goto(`${baseUrl}/fr/delegation/evenements/nouveau`, { waitUntil: 'networkidle' });
    }
    await page.waitForTimeout(4000);

    // Take screenshot of form
    await page.screenshot({ path: path.join(screenshotDir, `datepicker_form.png`) });

    // Try to find a datepicker input and click it to open the calendar popover
    const datepickerInput = await page.$('.react-datepicker-wrapper input, input[placeholder*="date"], input[type="text"]');
    if (datepickerInput) {
      await datepickerInput.click();
      await page.waitForTimeout(1000);
      // Take screenshot of open calendar popover
      await page.screenshot({ path: path.join(screenshotDir, `datepicker_open.png`) });
      
      // Extract computed colors of calendar elements
      const calendarStyles = await page.evaluate(() => {
        const daySelected = document.querySelector('.react-datepicker__day--selected');
        const header = document.querySelector('.react-datepicker__header');
        const navigation = document.querySelector('.react-datepicker__navigation');
        
        return {
          daySelected: daySelected ? window.getComputedStyle(daySelected).backgroundColor : 'N/A',
          header: header ? window.getComputedStyle(header).backgroundColor : 'N/A',
          navigation: navigation ? window.getComputedStyle(navigation).color : 'N/A'
        };
      });
      
      report.DatePicker = {
        daySelected: rgbToHex(calendarStyles.daySelected),
        header: rgbToHex(calendarStyles.header),
        navigation: rgbToHex(calendarStyles.navigation)
      };
    } else {
      report.DatePicker = { error: 'No datepicker input found on page' };
    }

    await context.close();
  } catch (err) {
    console.error(`Error auditing DatePicker:`, err.message);
    report.DatePicker = { error: err.message };
  }
  
  // Save report to disk
  fs.writeFileSync(path.join(__dirname, 'charte_audit_report.json'), JSON.stringify(report, null, 2), 'utf8');
  console.log('Audit complete. JSON saved.');

  await browser.close();
}

main().catch(console.error);
