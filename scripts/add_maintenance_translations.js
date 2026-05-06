const fs = require('fs');
const path = require('path');

const locales = ['fr', 'ar'];
const maintenanceTranslations = {
  fr: {
    title: "Maintenance en cours",
    description: "Le Portail de Médiouna est actuellement en cours de maintenance pour vous offrir une meilleure expérience. Nous serons de retour très bientôt.",
    estimated_duration: "Durée estimée :",
    retry: "Rafraîchir",
    contact_us: "Nous contacter",
    footer: "Merci de votre patience - La Province de Médiouna",
    admin_access: "Accès Administratif"
  },
  ar: {
    title: "صيانة جارية",
    description: "بوابة مديونة تخضع حاليًا للصيانة لنقدم لكم تجربة أفضل. سنعود قريبًا جداً.",
    estimated_duration: "المدة التقديرية :",
    retry: "تحديث الصفحة",
    contact_us: "اتصل بنا",
    footer: "شكرا لصبركم - عمالة إقليم مديونة",
    admin_access: "وصول الإدارة"
  }
};

for (const locale of locales) {
  const filePath = path.join(__dirname, '..', 'locales', locale, 'common.json');
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    const json = JSON.parse(data);
    
    if (!json.maintenance) {
      json.maintenance = maintenanceTranslations[locale];
      fs.writeFileSync(filePath, JSON.stringify(json, null, 2), 'utf8');
      console.log(`Updated ${locale}/common.json`);
    } else {
      console.log(`Maintenance key already exists in ${locale}/common.json`);
    }
  } catch (err) {
    console.error(`Error processing ${locale}:`, err);
  }
}
