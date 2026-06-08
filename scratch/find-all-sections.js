const { chromium } = require('@playwright/test');
const path = require('path');

async function run() {
  console.log('Finding elements on all pages...');
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });

  // Prevent welcome popup
  await page.addInitScript(() => {
    sessionStorage.setItem('announcement_seen', 'true');
  });

  const pages = [
    { name: 'home', url: 'https://bo.provincemediouna.ma/ar' },
    { name: 'map', url: 'https://bo.provincemediouna.ma/ar/carte' },
    { name: 'news', url: 'https://bo.provincemediouna.ma/ar/evenements' },
    { name: 'participation', url: 'https://bo.provincemediouna.ma/ar/suggestions' },
    { name: 'reclamation', url: 'https://bo.provincemediouna.ma/ar/reclamations/nouvelle' }
  ];

  for (const p of pages) {
    console.log(`Analyzing ${p.name} page at ${p.url}...`);
    await page.goto(p.url, { waitUntil: 'load' });
    await page.waitForTimeout(4000);

    const docHeight = await page.evaluate(() => document.documentElement.scrollHeight);
    console.log(`Total height of ${p.name} page: ${docHeight}px`);

    const elements = await page.evaluate((pageName) => {
      const rects = [];

      if (pageName === 'home') {
        // Stats
        const stats = document.querySelector('section[class*="bg-gradient-to-br"]');
        if (stats) {
          const r = stats.getBoundingClientRect();
          rects.push({ name: 'stats_section', top: r.top, left: r.left, width: r.width, height: r.height });
        }
        
        // News grid or highlighted content
        const news = document.querySelector('section[class*="bg-white"], div[class*="grid"]'); // let's find the section containing "أحدث الأخبار" or "الأنشطة"
        document.querySelectorAll('section').forEach((s, idx) => {
          const r = s.getBoundingClientRect();
          rects.push({ name: `section_${idx}_${s.className.substring(0,20)}`, top: r.top, left: r.left, width: r.width, height: r.height });
        });
      }

      if (pageName === 'map') {
        // Main map container
        const mapContainer = document.querySelector('div[class*="mapboxgl-map"], #map');
        if (mapContainer) {
          const r = mapContainer.getBoundingClientRect();
          rects.push({ name: 'map_container', top: r.top, left: r.left, width: r.width, height: r.height });
        }
        // Sidebar inside map
        const sidebar = document.querySelector('div[class*="sidebar"], aside, div[class*="left-0"]');
        if (sidebar) {
          const r = sidebar.getBoundingClientRect();
          rects.push({ name: 'map_sidebar', top: r.top, left: r.left, width: r.width, height: r.height });
        }
      }

      if (pageName === 'news') {
        // News lists or agenda
        document.querySelectorAll('section, div[class*="grid"]').forEach((el, idx) => {
          const r = el.getBoundingClientRect();
          if (r.height > 100) {
            rects.push({ name: `news_element_${idx}`, top: r.top, left: r.left, width: r.width, height: r.height });
          }
        });
      }

      if (pageName === 'participation') {
        // Suggestions list
        const grid = document.querySelector('div[class*="grid"]');
        if (grid) {
          const r = grid.getBoundingClientRect();
          rects.push({ name: 'suggestions_grid', top: r.top, left: r.left, width: r.width, height: r.height });
        }
      }

      if (pageName === 'reclamation') {
        // Form fields
        const form = document.querySelector('form');
        if (form) {
          const r = form.getBoundingClientRect();
          rects.push({ name: 'reclamation_form', top: r.top, left: r.left, width: r.width, height: r.height });
        }
      }

      return rects;
    }, p.name);

    console.log(`Page ${p.name} results:`, JSON.stringify(elements, null, 2));
  }

  await browser.close();
}

run();
