const fs = require('fs');

const frPath = 'locales/fr/common.json';
const arPath = 'locales/ar/common.json';

const fr = JSON.parse(fs.readFileSync(frPath, 'utf8'));
const ar = JSON.parse(fs.readFileSync(arPath, 'utf8'));

if (fr.delegation?.dashboard?.event_details) {
    fr.delegation.dashboard.event_details.partager = "Partager l'événement";
}

if (ar.delegation?.dashboard?.event_details) {
    ar.delegation.dashboard.event_details.partager = "مشاركة الحدث";
}

fs.writeFileSync(frPath, JSON.stringify(fr, null, 2), 'utf8');
fs.writeFileSync(arPath, JSON.stringify(ar, null, 2), 'utf8');

console.log('✅ Added "partager" translation');
