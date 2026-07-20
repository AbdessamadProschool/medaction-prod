/**
 * VERIF-DATEPICKER-RENDU
 * Capture le calendrier GovDatePicker ouvert et extrait ses styles computés.
 */
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'http://localhost:3000';
const SCREENSHOT_DIR = path.join(__dirname, 'audit-screenshots', 'datepicker-audit');

async function main() {
  if (!fs.existsSync(SCREENSHOT_DIR)) fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  // Navigation vers la page de login
  console.log('Navigating to login...');
  await page.goto(`${BASE_URL}/fr/login`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(2000);

  // Dismiss any announcement modal
  try {
    const okBtn = await page.$('button:has-text("OK")');
    if (okBtn) { await okBtn.click(); await page.waitForTimeout(800); }
    const closeBtn = await page.$('[aria-label="Fermer"], button[class*="close"], .modal-close');
    if (closeBtn) { await closeBtn.click(); await page.waitForTimeout(800); }
  } catch (e) { /* ignore */ }

  // Login as DELEGATION (has evenement creation with datepicker)
  console.log('Logging in as DELEGATION...');
  try {
    await page.fill('input[type="email"], input[name="email"]', 'delegation@mediouna.ma', { timeout: 5000 });
    await page.fill('input[type="password"], input[name="password"]', 'Delegation123!', { timeout: 5000 });
    await page.click('button[type="submit"], button:has-text("Se connecter")', { timeout: 5000 });
    await page.waitForNavigation({ timeout: 15000 });
    console.log('Login successful, URL:', page.url());
  } catch (e) {
    console.log('Login failed or redirected:', e.message);
  }

  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_after_login.png'), fullPage: false });

  // Navigate to event creation page
  console.log('Navigating to event creation...');
  const creationPages = [
    '/fr/delegation/evenements/nouveau',
    '/fr/delegation/evenements/create',
    '/fr/delegation/evenements/new',
    '/fr/delegation/activites/nouvelle',
    '/fr/delegation/activites/new',
  ];

  let foundCreationPage = false;
  for (const url of creationPages) {
    try {
      await page.goto(`${BASE_URL}${url}`, { waitUntil: 'domcontentloaded', timeout: 10000 });
      await page.waitForTimeout(2000);
      // Check if page has a datepicker
      const datepickerInput = await page.$('.react-datepicker__input-container input, [class*="datepicker"], input[placeholder*="Date"], input[aria-label*="date"]');
      if (datepickerInput) {
        console.log('Found datepicker on:', url);
        foundCreationPage = true;
        break;
      }
      console.log('No datepicker on:', url, '- trying next');
    } catch (e) {
      console.log('Page not accessible:', url);
    }
  }

  if (!foundCreationPage) {
    // Try to find any form with datepicker
    console.log('Searching for any page with datepicker...');
    await page.goto(`${BASE_URL}/fr/delegation`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_delegation_home.png'), fullPage: false });
  }

  // Take screenshot of current state
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_before_datepicker.png'), fullPage: true });

  // Try to click any datepicker input to open calendar
  console.log('Attempting to open datepicker...');
  const report = { url: page.url(), foundDatepicker: false, styles: {}, calendarVisible: false };

  try {
    // Look for datepicker inputs
    const inputs = await page.$$('.react-datepicker__input-container input, input[class*="date"], [data-testid*="date"] input');
    console.log(`Found ${inputs.length} potential datepicker inputs`);

    if (inputs.length > 0) {
      report.foundDatepicker = true;
      await inputs[0].click({ timeout: 3000 });
      await page.waitForTimeout(1500);

      // Check if calendar appeared
      const calendar = await page.$('.react-datepicker, .react-datepicker-popper, [class*="calendar"]');
      if (calendar) {
        report.calendarVisible = true;
        console.log('Calendar is visible!');
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_datepicker_open.png'), fullPage: false });

        // Extract computed styles of calendar
        report.styles = await page.evaluate(() => {
          const calendar = document.querySelector('.react-datepicker, [class*="react-datepicker"]');
          if (!calendar) return { error: 'Calendar DOM element not found' };

          const cs = window.getComputedStyle(calendar);
          const header = calendar.querySelector('.react-datepicker__header, [class*="header"]');
          const headerCs = header ? window.getComputedStyle(header) : null;
          const day = calendar.querySelector('.react-datepicker__day--selected, .react-datepicker__day');
          const dayCs = day ? window.getComputedStyle(day) : null;
          const selectedDay = calendar.querySelector('.react-datepicker__day--selected');
          const selectedCs = selectedDay ? window.getComputedStyle(selectedDay) : null;
          const navBtn = calendar.querySelector('.react-datepicker__navigation, button');
          const navCs = navBtn ? window.getComputedStyle(navBtn) : null;

          return {
            calendar: {
              backgroundColor: cs.backgroundColor,
              border: cs.border,
              borderRadius: cs.borderRadius,
              fontFamily: cs.fontFamily,
              fontSize: cs.fontSize,
              boxShadow: cs.boxShadow,
              color: cs.color,
              zIndex: cs.zIndex,
            },
            header: headerCs ? {
              backgroundColor: headerCs.backgroundColor,
              color: headerCs.color,
              fontFamily: headerCs.fontFamily,
              fontSize: headerCs.fontSize,
            } : null,
            dayCell: dayCs ? {
              color: dayCs.color,
              backgroundColor: dayCs.backgroundColor,
              borderRadius: dayCs.borderRadius,
              fontFamily: dayCs.fontFamily,
            } : null,
            selectedDay: selectedCs ? {
              backgroundColor: selectedCs.backgroundColor,
              color: selectedCs.color,
              borderRadius: selectedCs.borderRadius,
            } : null,
            navigation: navCs ? {
              backgroundColor: navCs.backgroundColor,
              color: navCs.color,
            } : null,
          };
        });

        console.log('Extracted styles:', JSON.stringify(report.styles, null, 2));
      } else {
        console.log('Calendar did not appear after click');
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_no_calendar.png'), fullPage: false });
      }
    } else {
      console.log('No datepicker inputs found on this page');
      // Search entire page for date-related inputs
      const allInputs = await page.$$('input');
      console.log(`Total inputs on page: ${allInputs.length}`);
      for (const input of allInputs) {
        const type = await input.getAttribute('type');
        const placeholder = await input.getAttribute('placeholder');
        const ariaLabel = await input.getAttribute('aria-label');
        console.log(`Input: type=${type}, placeholder=${placeholder}, aria-label=${ariaLabel}`);
      }
    }
  } catch (e) {
    console.log('Error during datepicker interaction:', e.message);
    report.error = e.message;
  }

  // Save report
  fs.writeFileSync(
    path.join(SCREENSHOT_DIR, 'datepicker_styles_report.json'),
    JSON.stringify(report, null, 2)
  );

  // List what was captured
  const files = fs.readdirSync(SCREENSHOT_DIR);
  console.log('\n=== Files in datepicker-audit/ ===');
  files.forEach(f => {
    const stat = fs.statSync(path.join(SCREENSHOT_DIR, f));
    console.log(`  ${f}: ${(stat.size / 1024).toFixed(1)} KB`);
  });

  await browser.close();
  console.log('\nDone!');
}

main().catch(console.error);
