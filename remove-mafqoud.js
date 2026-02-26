const fs = require('fs');

const arPath = 'locales/ar/common.json';
const content = fs.readFileSync(arPath, 'utf8');

// Remove all [مفقود] prefixes from values
const fixed = content.replace(/\[مفقود\]\s*/g, '');

// Validate JSON
try {
    JSON.parse(fixed);
    fs.writeFileSync(arPath, fixed, 'utf8');

    // Count how many were removed
    const matches = content.match(/\[مفقود\]/g);
    console.log(`✅ Supprimé ${matches ? matches.length : 0} occurrences de [مفقود] du fichier AR`);
    console.log('✅ Fichier AR sauvegardé avec succès');
} catch (e) {
    console.error('❌ JSON invalide après correction:', e.message);
}
