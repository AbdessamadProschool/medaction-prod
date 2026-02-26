import fs from 'fs';
import path from 'path';

const LOCALES_DIR = path.join(process.cwd(), 'locales');
const DEFAULT_LOCALE = 'fr';

async function syncLocales() {
  console.log('🔄 Syncing locales with default locale (fr)...');

  const defaultLocaleDir = path.join(LOCALES_DIR, DEFAULT_LOCALE);
  const namespaceFiles = fs.readdirSync(defaultLocaleDir).filter(f => f.endsWith('.json'));
  const otherLocales = fs.readdirSync(LOCALES_DIR).filter(d => 
    fs.statSync(path.join(LOCALES_DIR, d)).isDirectory() && d !== DEFAULT_LOCALE
  );

  for (const file of namespaceFiles) {
    console.log(`Processing ${file}...`);
    const defaultContent = JSON.parse(fs.readFileSync(path.join(defaultLocaleDir, file), 'utf-8'));

    for (const locale of otherLocales) {
      const localeDir = path.join(LOCALES_DIR, locale);
      const localeFile = path.join(localeDir, file);

      let localeContent = {};
      if (fs.existsSync(localeFile)) {
        localeContent = JSON.parse(fs.readFileSync(localeFile, 'utf-8'));
      } else {
        console.log(`  Creating new file for ${locale}: ${file}`);
      }

      const syncedContent = syncObjects(defaultContent, localeContent);
      
      fs.writeFileSync(localeFile, JSON.stringify(syncedContent, null, 2));
      console.log(`  ✅ Synced ${locale}/${file}`);
    }
  }
}

function syncObjects(source: any, target: any): any {
  const result: any = { ...target };

  // Remove keys not in source
  Object.keys(result).forEach(key => {
    if (!(key in source)) {
      delete result[key];
    }
  });

  // Add missing keys from source
  Object.keys(source).forEach(key => {
    if (typeof source[key] === 'object' && source[key] !== null) {
      // Recursive sync for objects
      result[key] = syncObjects(source[key], result[key] || {});
    } else {
      // Primitive values
      if (!(key in result)) {
        result[key] = `[MISSING] ${source[key]}`; // Mark as missing
      }
    }
  });

  return result;
}

syncLocales();
