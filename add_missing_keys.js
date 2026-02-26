const fs = require('fs');

function addKeys(filePath, newKeys) {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    // Ensure decision_center.infos exists
    if (!data.decision_center) data.decision_center = {};
    if (!data.decision_center.infos) data.decision_center.infos = {};

    // Add keys
    Object.assign(data.decision_center.infos, newKeys);

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`Updated ${filePath}`);
}

const frKeys = {
    "budget_management": "Gestion & Budget",
    "financing_sources": "Sources de Financement",
    "technical_specs": "Caractéristiques Techniques",
    "surface_total": "Superficie Totale",
    "tutelle": "Tutelle",
    "budget_annual": "Budget Annuel",
    "rooms_count": "Nombre de Salles"
};

const arKeys = {
    "budget_management": "الإدارة والميزانية",
    "financing_sources": "مصادر التمويل",
    "technical_specs": "الخصائص التقنية",
    "surface_total": "المساحة الإجمالية",
    "tutelle": "الوصاية",
    "budget_annual": "الميزانية السنوية",
    "rooms_count": "عدد القاعات"
};

addKeys('c:\\Users\\Proschool\\Desktop\\medaction\\locales\\fr\\common.json', frKeys);
addKeys('c:\\Users\\Proschool\\Desktop\\medaction\\locales\\ar\\common.json', arKeys);
