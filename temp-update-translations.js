const fs = require('fs');

const missingFr = {
    participate: 'Participer'
};

const missingAr = {
    participate: 'شارك'
};

for (const lang of ['fr', 'ar']) {
    const path = `locales/${lang}/common.json`;
    const data = JSON.parse(fs.readFileSync(path, 'utf8'));

    if (!data.campaigns) data.campaigns = {};

    if (lang === 'fr') {
        Object.assign(data.campaigns, missingFr);
    } else {
        Object.assign(data.campaigns, missingAr);
    }

    fs.writeFileSync(path, JSON.stringify(data, null, 2));
    console.log(`Updated ${lang}`);
}
