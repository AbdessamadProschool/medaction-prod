const fs = require('fs');

const arPath = 'locales/ar/common.json';
const content = fs.readFileSync(arPath, 'utf8');

// Find all keys with [MISSING] prefix
const missingLines = [];
const lines = content.split('\n');
lines.forEach((line, i) => {
    if (line.includes('[MISSING]')) {
        missingLines.push(line.trim());
    }
});

console.log('Keys with [MISSING]:', missingLines.length);
missingLines.forEach(l => console.log(l));
