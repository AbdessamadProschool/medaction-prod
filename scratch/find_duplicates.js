const fs = require('fs');
const content = fs.readFileSync('locales/ar/common.json', 'utf8');

// We can't use JSON.parse because it will just keep the last duplicate
// We need to parse manually or use a regex to find root keys

const rootKeys = [];
const regex = /^  "([^"]+)":/gm;
let match;
while ((match = regex.exec(content)) !== null) {
    rootKeys.push(match[1]);
}

const duplicates = rootKeys.filter((item, index) => rootKeys.indexOf(item) !== index);
console.log('Duplicate root keys:', [...new Set(duplicates)]);

// Check for nested duplicates is harder but let's start with root
