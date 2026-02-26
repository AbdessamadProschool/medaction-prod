const fs = require('fs');
const path = require('path');

// Scan admin AND super-admin directories
const dirsToScan = [
    'app/[locale]/admin',
    'app/[locale]/super-admin',
    'components/admin',
    'components/super-admin',
];

const files = [];

function walkDir(dir) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) walkDir(fullPath);
        else if (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts')) {
            files.push(fullPath);
        }
    }
}

for (const dir of dirsToScan) walkDir(dir);
console.log(`Found ${files.length} files to scan\n`);

// Extract all useTranslations namespaces and t('key') calls
const namespaceMap = {}; // namespace -> Set of keys

for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');

    const nsRegex = /const\s+(\w+)\s*=\s*useTranslations\(['"]([^'"]+)['"]\)/g;
    let nsMatch;
    const varToNs = {};

    while ((nsMatch = nsRegex.exec(content)) !== null) {
        const varName = nsMatch[1];
        const ns = nsMatch[2];
        varToNs[varName] = ns;
        if (!namespaceMap[ns]) namespaceMap[ns] = new Set();
    }

    for (const [varName, ns] of Object.entries(varToNs)) {
        const keyRegex = new RegExp(`${varName}\\(['"\`]([^'"\`.()\s]+)['"\`]`, 'g');
        let keyMatch;
        while ((keyMatch = keyRegex.exec(content)) !== null) {
            namespaceMap[ns].add(keyMatch[1]);
        }
    }
}

const fr = JSON.parse(fs.readFileSync('locales/fr/common.json', 'utf8'));
const ar = JSON.parse(fs.readFileSync('locales/ar/common.json', 'utf8'));

function getNested(obj, nsPath) {
    const parts = nsPath.split('.');
    let current = obj;
    for (const part of parts) {
        if (current === undefined || current === null) return undefined;
        current = current[part];
    }
    return current;
}

function getKey(nsObj, key) {
    const parts = key.split('.');
    let current = nsObj;
    for (const part of parts) {
        if (current === undefined || current === null) return undefined;
        current = current[part];
    }
    return current;
}

console.log('\n=== NAMESPACES FOUND ===');
for (const ns of Object.keys(namespaceMap).sort()) {
    console.log(`  📦 ${ns} (${namespaceMap[ns].size} keys)`);
}

console.log('\n\n=== MISSING IN FR ===');
let missingFR = 0;
for (const [ns, keys] of Object.entries(namespaceMap)) {
    const nsObj = getNested(fr, ns);
    for (const key of keys) {
        const val = getKey(nsObj, key);
        if (val === undefined) {
            console.log(`  ❌ ${ns}.${key}`);
            missingFR++;
        }
    }
}
console.log(`Total missing in FR: ${missingFR}`);

console.log('\n\n=== MISSING IN AR ===');
let missingAR = 0;
for (const [ns, keys] of Object.entries(namespaceMap)) {
    const nsObj = getNested(ar, ns);
    for (const key of keys) {
        const val = getKey(nsObj, key);
        if (val === undefined) {
            console.log(`  ❌ ${ns}.${key}`);
            missingAR++;
        }
    }
}
console.log(`Total missing in AR: ${missingAR}`);
