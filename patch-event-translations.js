const fs = require('fs');

const frPath = 'locales/fr/common.json';
const arPath = 'locales/ar/common.json';

const fr = JSON.parse(fs.readFileSync(frPath, 'utf8'));
const ar = JSON.parse(fs.readFileSync(arPath, 'utf8'));

const newKeys = {
    organizer_unknown: { fr: "Organisateur inconnu", ar: "منظم غير معروف" },
    location_unspecified: { fr: "Lieu non précisé", ar: "الموقع غير محدد" },
    organizing_entity: { fr: "Entité organisatrice", ar: "مؤسسة منظمة" }
};

if (fr.delegation?.dashboard?.event_details) {
    Object.keys(newKeys).forEach(key => {
        fr.delegation.dashboard.event_details[key] = newKeys[key].fr;
    });
}

if (ar.delegation?.dashboard?.event_details) {
    Object.keys(newKeys).forEach(key => {
        ar.delegation.dashboard.event_details[key] = newKeys[key].ar;
    });
}

fs.writeFileSync(frPath, JSON.stringify(fr, null, 2), 'utf8');
fs.writeFileSync(arPath, JSON.stringify(ar, null, 2), 'utf8');

console.log('✅ Added missing event detail translations');
