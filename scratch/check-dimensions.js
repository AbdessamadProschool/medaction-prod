const { chromium } = require('@playwright/test');
const path = require('path');

async function check() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  const files = ['home.png', 'etablissements.png', 'map.png', 'news.png', 'participation.png', 'reclamation.png'];
  for (const file of files) {
    const filePath = path.join(__dirname, '../public/images/guide', file);
    const fileUrl = 'file:///' + filePath.replace(/\\/g, '/');
    await page.goto(fileUrl);
    const dims = await page.evaluate(() => {
      const img = document.querySelector('img');
      return img ? { width: img.naturalWidth, height: img.naturalHeight } : null;
    });
    console.log(`${file} dimensions:`, dims);
  }
  
  await browser.close();
}
check();
