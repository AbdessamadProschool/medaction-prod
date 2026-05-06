const fs = require('fs');
const path = require('path');

const arPath = path.join(__dirname, '..', 'locales', 'ar', 'common.json');
const frPath = path.join(__dirname, '..', 'locales', 'fr', 'common.json');

const arData = JSON.parse(fs.readFileSync(arPath, 'utf8'));
const frData = JSON.parse(fs.readFileSync(frPath, 'utf8'));

// Arabic translations
if (!arData.suggestions) arData.suggestions = {};
arData.suggestions.admin_response_title = "رد الإدارة";
arData.suggestions.admin_response_placeholder = "...أضف ردا رسميا";
arData.suggestions.super_admin_delete_warning = "إجراء لا رجعة فيه مخصص للمشرفين العامين";

// French translations
if (!frData.suggestions) frData.suggestions = {};
frData.suggestions.admin_response_title = "Réponse de l'administration";
frData.suggestions.admin_response_placeholder = "...Ajouter une réponse officielle";
frData.suggestions.super_admin_delete_warning = "Action irréversible réservée aux Super Admins";

fs.writeFileSync(arPath, JSON.stringify(arData, null, 2), 'utf8');
fs.writeFileSync(frPath, JSON.stringify(frData, null, 2), 'utf8');

console.log("Translations added successfully.");
