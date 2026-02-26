const fs = require('fs');

const dataFr = JSON.parse(fs.readFileSync('locales/fr/common.json', 'utf8'));
const dataAr = JSON.parse(fs.readFileSync('locales/ar/common.json', 'utf8'));

[dataFr, dataAr].forEach(data => {
    if (!data.notifications_page) data.notifications_page = {};
    if (!data.notifications_page.types) data.notifications_page.types = {};
});

// Update FR
Object.assign(dataFr.notifications_page.types, {
    EVENT_CREATION: "Création d'Événement",
    ACTUALITE_CREATION: "Création d'Actualité",
    CAMPAGNE_CREATION: "Création de Campagne"
});

// Update AR
Object.assign(dataAr.notifications_page.types, {
    EVENT_CREATION: "إنشاء فعالية",
    ACTUALITE_CREATION: "إنشاء خبر",
    CAMPAGNE_CREATION: "إنشاء حملة"
});

fs.writeFileSync('locales/fr/common.json', JSON.stringify(dataFr, null, 2));
fs.writeFileSync('locales/ar/common.json', JSON.stringify(dataAr, null, 2));
console.log('Translations inserted');
