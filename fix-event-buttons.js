const fs = require('fs');

const frPath = 'locales/fr/common.json';
const arPath = 'locales/ar/common.json';

const fr = JSON.parse(fs.readFileSync(frPath, 'utf8'));
const ar = JSON.parse(fs.readFileSync(arPath, 'utf8'));

// Fix missing buttons keys for event_creation
if (fr.delegation?.dashboard?.event_creation?.buttons) {
    Object.assign(fr.delegation.dashboard.event_creation.buttons, {
        create: "Créer l'événement",
        cancel: "Annuler",
        creating: "Création en cours...",
    });
}

if (ar.delegation?.dashboard?.event_creation?.buttons) {
    Object.assign(ar.delegation.dashboard.event_creation.buttons, {
        create: "إنشاء الحدث",
        cancel: "إلغاء",
        creating: "جارٍ الإنشاء...",
    });
}

fs.writeFileSync(frPath, JSON.stringify(fr, null, 2), 'utf8');
fs.writeFileSync(arPath, JSON.stringify(ar, null, 2), 'utf8');

console.log('✅ Added missing buttons.create, buttons.cancel, buttons.creating');
