const fs = require('fs');

const arPath = './locales/ar/common.json';
const frPath = './locales/fr/common.json';

const arData = JSON.parse(fs.readFileSync(arPath, 'utf-8'));
const frData = JSON.parse(fs.readFileSync(frPath, 'utf-8'));

// 1. admin.backups.messages.created
if (!arData.admin.backups) arData.admin.backups = {};
if (!arData.admin.backups.messages) arData.admin.backups.messages = {};
arData.admin.backups.messages.created = "تم إنشاء النسخة الاحتياطية بنجاح";

if (!frData.admin.backups) frData.admin.backups = {};
if (!frData.admin.backups.messages) frData.admin.backups.messages = {};
frData.admin.backups.messages.created = "Sauvegarde créée avec succès";

// 2. notifications_page.types.MOT_DE_PASSE_REINITIALISE
if (!arData.notifications_page) arData.notifications_page = {};
if (!arData.notifications_page.types) arData.notifications_page.types = {};
arData.notifications_page.types.MOT_DE_PASSE_REINITIALISE = "إعادة تعيين كلمة المرور";

if (!frData.notifications_page) frData.notifications_page = {};
if (!frData.notifications_page.types) frData.notifications_page.types = {};
frData.notifications_page.types.MOT_DE_PASSE_REINITIALISE = "Mot de passe réinitialisé";

// notifications_page.title
if (!arData.notifications_page.title) arData.notifications_page.title = "الإشعارات";
if (!frData.notifications_page.title) frData.notifications_page.title = "Notifications";

fs.writeFileSync(arPath, JSON.stringify(arData, null, 2));
fs.writeFileSync(frPath, JSON.stringify(frData, null, 2));

console.log("Done!");
