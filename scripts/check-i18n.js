const fs = require('fs');
const path = require('path');

const frLocalePath = path.join(__dirname, '../locales/fr/common.json');
const frLocale = JSON.parse(fs.readFileSync(frLocalePath, 'utf8'));

// Flatten JSON to get all dot notation keys
function flattenObj(obj, parent = '', res = {}) {
  for (let key in obj) {
    let propName = parent ? parent + '.' + key : key;
    if (typeof obj[key] == 'object' && obj[key] !== null) {
      flattenObj(obj[key], propName, res);
    } else {
      res[propName] = obj[key];
    }
  }
  return res;
}

const allKeys = flattenObj(frLocale);

// Recursively get all tsx/ts files
function getAllFiles(dirPath, arrayOfFiles) {
  try {
    const files = fs.readdirSync(dirPath);
    arrayOfFiles = arrayOfFiles || [];

    files.forEach(function(file) {
      if (fs.statSync(dirPath + "/" + file).isDirectory()) {
        arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
      } else {
        if (file.endsWith('.tsx') || file.endsWith('.ts')) {
          arrayOfFiles.push(path.join(__dirname, '../', dirPath, "/", file));
        }
      }
    });
  } catch (e) {
    // ignore
  }
  return arrayOfFiles;
}

const appFiles = getAllFiles('app', []);
const componentFiles = getAllFiles('components', []);
const filesToCheck = [...appFiles, ...componentFiles];

let missingKeys = new Set();
let totalFound = 0;

const tRegex = /\b(?:t|tCommon|tModal|tSectors)\(\s*['"]([^'"]+)['"]/g;

filesToCheck.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  
  // Find namespace if any
  const useTranslationsRegex = /useTranslations\(\s*['"]([^'"]+)['"]\s*\)/g;
  let namespaces = [];
  let nsMatch;
  while ((nsMatch = useTranslationsRegex.exec(content)) !== null) {
    namespaces.push(nsMatch[1]);
  }
  
  let match;
  while ((match = tRegex.exec(content)) !== null) {
    let key = match[1];
    
    if (key.includes('${')) continue; // Skip template literals

    let found = false;
    
    // Check exact key
    if (allKeys[key]) found = true;
    
    // Check with namespaces
    if (!found && namespaces.length > 0) {
      for (const ns of namespaces) {
        if (allKeys[ns + '.' + key]) {
          found = true;
          break;
        }
      }
    }

    if (!found) {
      // It might be a global key like "confirm", "cancel" etc mapped in next-intl config.
      // But we report it anyway for the audit.
      missingKeys.add(key);
    }
    totalFound++;
  }
});

console.log(`[i18n Audit] Found ${totalFound} translation calls in the codebase.`);
console.log(`[i18n Audit] Keys potentially missing from locales/fr/common.json: ${missingKeys.size}`);

if (missingKeys.size > 0) {
  console.log(`\nSample of missing keys:`);
  let arr = Array.from(missingKeys).slice(0, 20);
  arr.forEach(k => console.log(`- ${k}`));
  
  // Add to package.json scripts "test:i18n": "node scripts/check-i18n.js"
  if (process.argv.includes('--strict')) {
    console.error('Strict mode enabled. Failing the build because of missing keys.');
    process.exit(1);
  }
} else {
  console.log('[i18n Audit] All keys are successfully mapped!');
}
