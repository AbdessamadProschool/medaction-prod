const fs = require('fs');
const fr = JSON.parse(fs.readFileSync('locales/fr/common.json', 'utf8'));
const ar = JSON.parse(fs.readFileSync('locales/ar/common.json', 'utf8'));

function getKeys(obj, prefix = '') {
    let keys = [];
    for (let key in obj) {
        if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
            keys = keys.concat(getKeys(obj[key], prefix + key + '.'));
        } else {
            keys.push(prefix + key);
        }
    }
    return keys;
}

const frKeys = getKeys(fr);
const arKeys = getKeys(ar);

const filter = process.argv[2] || '';
const missingInAr = frKeys.filter(k => !arKeys.includes(k) && k.includes(filter));

console.log(`Missing in AR (filter: ${filter}):`, missingInAr.length);
missingInAr.forEach(k => console.log('  - ' + k));
