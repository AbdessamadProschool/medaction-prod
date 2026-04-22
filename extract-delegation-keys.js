const fs = require('fs');
const path = require('path');

// Read all delegation TSX files
const delegationDir = 'app/[locale]/delegation';
const files = [];

function walkDir(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) walkDir(fullPath);
        else if (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts')) {
            files.push(fullPath);
        }
    }
}
walkDir(delegationDir);

// Extract all useTranslations namespaces and t('key') calls
const namespaceMap = {}; // namespace -> Set of keys

for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');

    // Find all useTranslations calls
    const nsRegex = /const\s+(\w+)\s*=\s*useTranslations\(['"]([^'"]+)['"]\)/g;
    let nsMatch;
    const varToNs = {};

    while ((nsMatch = nsRegex.exec(content)) !== null) {
        const varName = nsMatch[1];
        const ns = nsMatch[2];
        varToNs[varName] = ns;
        if (!namespaceMap[ns]) namespaceMap[ns] = new Set();
    }

    // Find all t('key') and varName('key') calls
    for (const [varName, ns] of Object.entries(varToNs)) {
        // Match t('key') or t("key") or t(`key`)
        const keyRegex = new RegExp(`${varName}\\(['"\`]([^'"\`]+)['"\`]`, 'g');
        let keyMatch;
        while ((keyMatch = keyRegex.exec(content)) !== null) {
            namespaceMap[ns].add(keyMatch[1]);
        }
    }
}

// Print summary
console.log('\n=== NAMESPACES AND KEYS USED IN DELEGATION PAGES ===\n');
for (const [ns, keys] of Object.entries(namespaceMap)) {
    console.log(`\n📦 ${ns} (${keys.size} keys):`);
    for (const key of [...keys].sort()) {
        console.log(`   - ${key}`);
    }
}

// Check which ones exist in FR
const frCommon = require('./locales/fr/common.json');
const arCommon = require('./locales/ar/common.json');

function getNestedValue(obj, path) {
    const parts = path.split('.');
    let current = obj;
    for (const part of parts) {
        if (part === '__proto__' || part === 'constructor' || part === 'prototype') return undefined; // BLOC 6.1 fix
        if (current === undefined || current === null) return undefined;
        current = current[part];
    }
    return current;
}

console.log('\n\n=== MISSING IN FR FILE ===\n');
for (const [ns, keys] of Object.entries(namespaceMap)) {
    const nsParts = ns.split('.');
    let nsObj = frCommon;
    for (const part of nsParts) {
        nsObj = nsObj?.[part];
    }

    for (const key of keys) {
        const val = getNestedValue(nsObj, key);
        if (val === undefined) {
            console.log(`❌ ${ns}.${key}`);
        }
    }
}

console.log('\n\n=== MISSING IN AR FILE ===\n');
for (const [ns, keys] of Object.entries(namespaceMap)) {
    const nsParts = ns.split('.');
    let nsObj = arCommon;
    for (const part of nsParts) {
        if (part === '__proto__' || part === 'constructor' || part === 'prototype') { // BLOC 6.1 fix
           nsObj = undefined;
           break;
        }
        nsObj = nsObj?.[part];
    }

    for (const key of keys) {
        const val = getNestedValue(nsObj, key);
        if (val === undefined) {
            console.log(`❌ ${ns}.${key}`);
        }
    }
}
