import fs from 'fs';
import path from 'path';

// Mock function - In real world, use DeepL/Google API
async function translateText(text: string, targetLang: string): Promise<string> {
    // Determine if text looks like a key or actual value
    if (!text || text.startsWith('[MISSING]')) {
         const cleanText = text.replace('[MISSING] ', '');
         // Very simple heuristic for demo purposes
         if (targetLang === 'ar') {
             return `[AR] ${cleanText}`; 
         }
         return cleanText;
    }
    return text;
}

const LOCALES_DIR = path.join(process.cwd(), 'locales');
const DEFAULT_LOCALE = 'fr';

async function translateMissing() {
  console.log('🌍 Translating missing keys...');

  const defaultLocaleDir = path.join(LOCALES_DIR, DEFAULT_LOCALE);
  const namespaceFiles = fs.readdirSync(defaultLocaleDir).filter(f => f.endsWith('.json'));
  const otherLocales = fs.readdirSync(LOCALES_DIR).filter(d => 
    fs.statSync(path.join(LOCALES_DIR, d)).isDirectory() && d !== DEFAULT_LOCALE
  );

  for (const file of namespaceFiles) {
    for (const locale of otherLocales) {
      const localeFile = path.join(LOCALES_DIR, locale, file);
      
      if (!fs.existsSync(localeFile)) continue;

      const content = JSON.parse(fs.readFileSync(localeFile, 'utf-8'));
      let modified = false;

      // Recursive traverse
      const traverseAndTranslate = async (obj: any) => {
        for (const key in obj) {
          if (typeof obj[key] === 'string') {
             if (obj[key].startsWith('[MISSING] ')) {
                 const sourceText = obj[key].replace('[MISSING] ', '');
                 const translated = await translateText(sourceText, locale);
                 obj[key] = translated;
                 modified = true;
             }
          } else if (typeof obj[key] === 'object' && obj[key] !== null) {
              await traverseAndTranslate(obj[key]);
          }
        }
      };

      await traverseAndTranslate(content);

      if (modified) {
         fs.writeFileSync(localeFile, JSON.stringify(content, null, 2));
         console.log(`  ✅ Translated ${locale}/${file}`);
      }
    }
  }
  console.log('✅ Auto-translation complete.');
}

translateMissing();
