const fs = require('fs');
const path = require('path');

// Load translation files
const fr = JSON.parse(fs.readFileSync('locales/fr/common.json', 'utf8'));
const ar = JSON.parse(fs.readFileSync('locales/ar/common.json', 'utf8'));

// Get a nested value from object using dot notation
function getNestedValue(obj, keyPath) {
    return keyPath.split('.').reduce((acc, key) => {
        if (acc === undefined || acc === null) return undefined;
        return acc[key];
    }, obj);
}

// Scan all TSX files in delegation folder recursively
function scanDir(dir) {
    const files = [];
    const items = fs.readdirSync(dir);
    for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            files.push(...scanDir(fullPath));
        } else if (item.endsWith('.tsx') || item.endsWith('.ts')) {
            files.push(fullPath);
        }
    }
    return files;
}

const delegationDir = path.join(process.cwd(), 'app/[locale]/delegation');
const files = scanDir(delegationDir);

// Extract all t('...') and tDel('...') key patterns
const keyRegex = /\bt(?:Del|Common|Nav)?\s*\(\s*['"`]([^'"`]+)['"`]/g;

const allKeys = new Set();

for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    let match;
    while ((match = keyRegex.exec(content)) !== null) {
        allKeys.add(match[1]);
    }
}

console.log(`\nFound ${allKeys.size} unique translation keys used in delegation pages\n`);

// Check each key against FR and AR files
const missingFR = [];
const missingAR = [];
const missingBoth = [];

// The layout uses useTranslations('delegation') so keys map to delegation.*
// Some pages may use different namespaces - we'll check both root and delegation prefix
for (const key of [...allKeys].sort()) {
    // Try with delegation. prefix (layout context)
    const frValDel = getNestedValue(fr, `delegation.${key}`);
    const arValDel = getNestedValue(ar, `delegation.${key}`);
    // Try root (for pages that use useTranslations())
    const frValRoot = getNestedValue(fr, key);
    const arValRoot = getNestedValue(ar, key);

    const frExists = frValDel !== undefined || frValRoot !== undefined;
    const arExists = arValDel !== undefined || arValRoot !== undefined;

    if (!frExists && !arExists) {
        missingBoth.push(key);
    } else if (!frExists) {
        missingFR.push(key);
    } else if (!arExists) {
        missingAR.push({ key, frValue: frValDel || frValRoot });
    }
}

if (missingBoth.length > 0) {
    console.log('❌ MISSING IN BOTH FR AND AR:');
    missingBoth.forEach(k => console.log('  -', k));
    console.log();
}

if (missingFR.length > 0) {
    console.log('❌ MISSING IN FR (exists in AR):');
    missingFR.forEach(k => console.log('  -', k));
    console.log();
}

if (missingAR.length > 0) {
    console.log('❌ MISSING IN AR (exists in FR):');
    missingAR.forEach(({ key, frValue }) => console.log(`  - ${key}  =>  FR: "${frValue}"`));
    console.log();
}

if (missingBoth.length === 0 && missingFR.length === 0 && missingAR.length === 0) {
    console.log('✅ All delegation translation keys exist in both FR and AR!');
}
