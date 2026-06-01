const fs = require('fs');
const path = require('path');

const arTranslations = require('./locales/ar/common.json');
const frTranslations = require('./locales/fr/common.json');

const directories = ['app', 'components'];

let missingKeys = [];

function getNestedValue(obj, path) {
  return path.split('.').reduce((acc, part) => acc && acc[part], obj);
}

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // Find useTranslations
  const regexUseTrans = /const\s+(\w+)\s*=\s*useTranslations\(\s*(?:['"]([^'"]+)['"])?\s*\)/g;
  let match;
  const translationFunctions = [];
  
  while ((match = regexUseTrans.exec(content)) !== null) {
    const fnName = match[1];
    const namespace = match[2] || '';
    translationFunctions.push({ fnName, namespace });
  }

  // Sometimes people use t('key') directly if t is destructured or from a generic context.
  // For each translation function, find its calls.
  for (const { fnName, namespace } of translationFunctions) {
    const callRegex = new RegExp(`\\b${fnName}\\s*\\(\\s*['"]([^'"]+)['"]`, 'g');
    let callMatch;
    while ((callMatch = callRegex.exec(content)) !== null) {
      const key = callMatch[1];
      // Skip dynamic keys like `sectors.${var}`
      if (key.includes('${')) continue;
      
      const fullKey = namespace ? `${namespace}.${key}` : key;
      
      const arVal = getNestedValue(arTranslations, fullKey);
      const frVal = getNestedValue(frTranslations, fullKey);
      
      if (arVal === undefined || frVal === undefined) {
        missingKeys.push({
          file: filePath,
          namespace,
          key,
          fullKey,
          missingAr: arVal === undefined,
          missingFr: frVal === undefined
        });
      }
    }
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      scanFile(fullPath);
    }
  }
}

directories.forEach(walkDir);

const uniqueMissingKeys = [...new Set(missingKeys.map(k => k.fullKey))].map(fullKey => {
  return missingKeys.find(k => k.fullKey === fullKey);
});

console.log(JSON.stringify(uniqueMissingKeys, null, 2));
