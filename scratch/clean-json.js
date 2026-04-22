const fs = require('fs');
const path = require('path');

function cleanJson(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        // JSON.parse in Node.js handles duplicate keys by taking the last one
        const data = JSON.parse(content);
        // Write back formatted
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
        console.log(`Successfully cleaned ${filePath}`);
    } catch (e) {
        console.error(`Error cleaning ${filePath}: ${e.message}`);
    }
}

const arPath = path.join(__dirname, '..', 'locales', 'ar', 'common.json');
const frPath = path.join(__dirname, '..', 'locales', 'fr', 'common.json');

cleanJson(arPath);
cleanJson(frPath);
