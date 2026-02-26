const fs = require('fs');
const frPath = 'c:\\Users\\Proschool\\Desktop\\medaction\\locales\\fr\\common.json';
const arPath = 'c:\\Users\\Proschool\\Desktop\\medaction\\locales\\ar\\common.json';

const frData = JSON.parse(fs.readFileSync(frPath, 'utf8'));
const arData = JSON.parse(fs.readFileSync(arPath, 'utf8'));

console.log('FR has root sectors:', !!frData.sectors);
console.log('AR has root sectors:', !!arData.sectors);
