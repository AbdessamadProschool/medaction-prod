const fs = require('fs');

function checkDupes(path) {
    const content = fs.readFileSync(path, 'utf8');
    const lines = content.split('\n');
    const keyMap = new Map(); // key -> list of line numbers
    
    // Simple regex for top-level or second-level keys (common in these files)
    const regex = /^\s*\"([^\"]+)\"\s*:/;
    
    lines.forEach((line, index) => {
        const match = line.match(regex);
        if (match) {
            const key = match[1];
            if (!keyMap.has(key)) {
                keyMap.set(key, []);
            }
            keyMap.get(key).push(index + 1);
        }
    });
    
    const dupes = [];
    for (const [key, lines] of keyMap.entries()) {
        if (lines.length > 1) {
            dupes.push({ key, lines });
        }
    }
    return dupes;
}

console.log('--- FR DUPES ---');
console.log(JSON.stringify(checkDupes('locales/fr/common.json'), null, 2));
console.log('--- AR DUPES ---');
console.log(JSON.stringify(checkDupes('locales/ar/common.json'), null, 2));
