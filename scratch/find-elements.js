const { chromium } = require('@playwright/test');

async function run() {
  console.log('Finding elements bounding boxes...');
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('https://bo.provincemediouna.ma/ar', { waitUntil: 'load' });
  await page.waitForTimeout(4000);

  const elements = await page.evaluate(() => {
    const results = [];
    
    // Find all headings
    document.querySelectorAll('h1, h2, h3, h4, section, div').forEach(el => {
      const text = el.innerText || '';
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      
      // We look for sections containing stats (e.g. text like 75% or number indicators or labels like "الشكايات")
      if (rect.height > 50 && rect.width > 200) {
        if (text.includes('مؤشرات') || text.includes('إحصائيات') || text.includes('الشكايات المرسلة') || text.includes('نسبة الحل')) {
          results.push({
            tag: el.tagName,
            id: el.id,
            className: el.className,
            text: text.substring(0, 50).replace(/\n/g, ' '),
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height
          });
        }
      }
    });

    // Also look for search bar/icon in header
    const searchBtn = document.querySelector('button[class*="search"], div[class*="search"], input[class*="search"]');
    if (searchBtn) {
      const rect = searchBtn.getBoundingClientRect();
      results.push({ tag: 'search', top: rect.top, left: rect.left, width: rect.width, height: rect.height });
    }

    return results;
  });

  console.log('Detected elements:', JSON.stringify(elements, null, 2));
  await browser.close();
}

run();
