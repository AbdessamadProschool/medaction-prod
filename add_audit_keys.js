const fs = require('fs');

const arPath = './locales/ar/common.json';
const frPath = './locales/fr/common.json';

const newKeysAr = {
  "total_entries": "إجمالي السجلات",
  "last_update": "آخر تحديث",
  "auto": "تلقائي",
  "filters_btn": "تصفية",
  "refresh_now": "تحديث الآن",
  "export_csv": "تصدير CSV",
  "export_json": "تصدير JSON",
  "user_activity": "نشاط المستخدم",
  "system_logs": "سجلات النظام",
  "security_audit": "تدقيق الأمان",
  "date": "التاريخ",
  "user": "المستخدم",
  "action_label": "الإجراء",
  "entity": "الكيان",
  "ip": "عنوان IP",
  "details": "التفاصيل",
  "page_x_of_y": "صفحة {{x}} من {{y}}",
  "actions": {
    "LOGIN": "تسجيل الدخول",
    "UPDATE": "تحديث"
  },
  "entities": {
    "User": "المستخدم"
  }
};

const newKeysFr = {
  "total_entries": "Entrées totales",
  "last_update": "Dernière mise à jour",
  "auto": "Auto",
  "filters_btn": "Filtres",
  "refresh_now": "Actualiser",
  "export_csv": "Exporter CSV",
  "export_json": "Exporter JSON",
  "user_activity": "Activité utilisateur",
  "system_logs": "Journaux système",
  "security_audit": "Audit de sécurité",
  "date": "Date",
  "user": "Utilisateur",
  "action_label": "Action",
  "entity": "Entité",
  "ip": "Adresse IP",
  "details": "Détails",
  "page_x_of_y": "Page {{x}} sur {{y}}",
  "actions": {
    "LOGIN": "Connexion",
    "UPDATE": "Mise à jour"
  },
  "entities": {
    "User": "Utilisateur"
  }
};

function updateFile(path, newKeys) {
  const data = JSON.parse(fs.readFileSync(path, 'utf8'));
  
  if (!data.audit_page) {
    data.audit_page = {};
  }
  
  // Merge missing keys
  data.audit_page = { ...data.audit_page, ...newKeys, actions: { ...(data.audit_page.actions || {}), ...newKeys.actions }, entities: { ...(data.audit_page.entities || {}), ...newKeys.entities } };
  
  fs.writeFileSync(path, JSON.stringify(data, null, 2), 'utf8');
  console.log(`Updated ${path}`);
}

updateFile(arPath, newKeysAr);
updateFile(frPath, newKeysFr);
