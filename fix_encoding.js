const fs = require('fs');
const path = require('path');

const filePath = path.join('c:', 'Users', 'Proschool', 'Desktop', 'medaction', 'locales', 'fr', 'common.json');

let content = fs.readFileSync(filePath, 'utf8');

// Fix the corrupted encoding in pending_requests_desc
const corrupted = '"pending_requests_desc": "Suivez l\'\\u00c3\\u00a9tat de validation de vos propositions par l\'administration."';
// More reliable: just replace the whole line with correct content using a regex
content = content.replace(
  /"pending_requests_desc": "Suivez l'[^"]*tat de validation de vos propositions par l'administration\."/,
  '"pending_requests_desc": "Suivez l\'état de validation de vos propositions par l\'administration."'
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed pending_requests_desc encoding');

// Verify
const verify = fs.readFileSync(filePath, 'utf8');
const match = verify.match(/"pending_requests_desc": "([^"]+)"/);
if (match) {
  console.log('Value is now:', match[1]);
}
