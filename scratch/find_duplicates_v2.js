const fs = require('fs');

function findRootDuplicates(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const keys = {};
    const duplicates = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const match = line.match(/^  "([^"]+)":/);
        if (match) {
            const key = match[1];
            if (!keys[key]) {
                keys[key] = [];
            }
            keys[key].push(i + 1);
            if (keys[key].length > 1 && !duplicates.includes(key)) {
                duplicates.push(key);
            }
        }
    }

    if (duplicates.length === 0) {
        console.log('No duplicate root keys found.');
    } else {
        console.log('Duplicate root keys found:');
        duplicates.forEach(key => {
            console.log(`- ${key}: lines ${keys[key].join(', ')}`);
        });
    }
}

findRootDuplicates(process.argv[2] || 'locales/ar/common.json');
