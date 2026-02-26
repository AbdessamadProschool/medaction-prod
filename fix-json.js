const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'locales/fr/common.json');
let data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

function deepMerge(target, source) {
  if (!target) return source;
  for (const key of Object.keys(source)) {
    if (source[key] instanceof Object && key in target && target[key] instanceof Object) {
      deepMerge(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
}

const mappings = [
  ['super_admin', 'del_super_admin_2'],
  ['licence_page', 'del_licence_page'],
  ['admin_management', 'del_admin_management'],
  ['suggestions', 'del_suggestions_2'],
  ['delegation', 'del_delegation_2']
];

for (const [targetKey, dupKey] of mappings) {
  if (data[dupKey]) {
    deepMerge(data[targetKey], data[dupKey]);
    delete data[dupKey];
  }
}

fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
console.log('Successfully merged and cleaned up fr/common.json');
