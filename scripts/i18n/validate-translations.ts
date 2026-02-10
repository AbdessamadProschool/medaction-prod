import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

const LOCALES_DIR = path.join(process.cwd(), 'locales');
const DEFAULT_LOCALE = 'fr';

async function validateTranslations() {
  console.log('🔍 Validating translations...');
  
  // Get all namespace files from the default locale
  const defaultLocaleDir = path.join(LOCALES_DIR, DEFAULT_LOCALE);
  if (!fs.existsSync(defaultLocaleDir)) {
    console.error(`❌ Default locale directory not found: ${defaultLocaleDir}`);
    process.exit(1);
  }

  const namespaceFiles = fs.readdirSync(defaultLocaleDir).filter(f => f.endsWith('.json'));
  const otherLocales = fs.readdirSync(LOCALES_DIR).filter(d => 
    fs.statSync(path.join(LOCALES_DIR, d)).isDirectory() && d !== DEFAULT_LOCALE
  );

  let hasErrors = false;

  for (const file of namespaceFiles) {
    console.log(`\nChecking ${file}...`);
    const defaultContent = JSON.parse(fs.readFileSync(path.join(defaultLocaleDir, file), 'utf-8'));
    const defaultKeys = flattenKeys(defaultContent);

    for (const locale of otherLocales) {
      const localeFile = path.join(LOCALES_DIR, locale, file);
      
      if (!fs.existsSync(localeFile)) {
        console.warn(`  ⚠️  Missing file for ${locale}: ${file}`);
        hasErrors = true;
        continue;
      }

      const localeContent = JSON.parse(fs.readFileSync(localeFile, 'utf-8'));
      const localeKeys = flattenKeys(localeContent);

      // Check for missing keys
      const missingKeys = defaultKeys.filter(k => !localeKeys.includes(k));
      if (missingKeys.length > 0) {
        console.error(`  ❌ [${locale}] Missing ${missingKeys.length} keys:`);
        missingKeys.slice(0, 5).forEach(k => console.error(`     - ${k}`));
        if (missingKeys.length > 5) console.error(`     ... and ${missingKeys.length - 5} more`);
        hasErrors = true;
      }
    }
  }

  if (hasErrors) {
    console.error('\n❌ Validation failed with errors.');
    process.exit(1);
  } else {
    console.log('\n✅ All translations are valid.');
  }
}

function flattenKeys(obj: any, prefix = ''): string[] {
  return Object.keys(obj).reduce((acc: string[], k) => {
    const pre = prefix.length ? prefix + '.' : '';
    if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k])) {
      acc.push(...flattenKeys(obj[k], pre + k));
    } else {
      acc.push(pre + k);
    }
    return acc;
  }, []);
}

validateTranslations();
