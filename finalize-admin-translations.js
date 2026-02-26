const fs = require('fs');

const frPath = 'locales/fr/common.json';
const arPath = 'locales/ar/common.json';

const fr = JSON.parse(fs.readFileSync(frPath, 'utf8'));
const ar = JSON.parse(fs.readFileSync(arPath, 'utf8'));

// 1. Refine Admin Portal Messages
if (!fr.admin_portal) fr.admin_portal = {};
if (!fr.admin_portal.messages) fr.admin_portal.messages = {};
Object.assign(fr.admin_portal.messages, {
    db_error_desc: "Une erreur est survenue lors de la récupération des messages depuis la base de données.",
    no_messages_desc: "Votre boîte de réception est vide pour le moment. Les nouveaux messages apparaîtront ici.",
    close: "Fermer",
    mark_read_success: "Message marqué comme lu",
    delete_confirm: "Voulez-vous vraiment supprimer ce message ?",
    delete_success: "Message supprimé avec succès"
});

if (!ar.admin_portal) ar.admin_portal = {};
if (!ar.admin_portal.messages) ar.admin_portal.messages = {};
Object.assign(ar.admin_portal.messages, {
    db_error_desc: "حدث خطأ أثناء استرداد الرسائل من قاعدة البيانات.",
    no_messages_desc: "صندوق الوارد الخاص بك فارغ حالياً. ستظهر الرسائل الجديدة هنا.",
    close: "إغلاق",
    mark_read_success: "تم تحديد الرسالة كمقروءة",
    delete_confirm: "هل أنت متأكد من رغبتك في حذف هذه الرسالة؟",
    delete_success: "تم حذف الرسالة بنجاح"
});

// 2. Sidebar Keys ensure
if (!fr.admin.sidebar) fr.admin.sidebar = {};
Object.assign(fr.admin.sidebar, {
    dashboard: 'Tableau de bord',
    reclamations: 'Réclamations',
    suggestions: 'Suggestions',
    users: 'Utilisateurs',
    etablissements: 'Établissements',
    activities: 'Activités',
    validation: 'Validation',
    events: 'Événements',
    news: 'Actualités',
    articles: 'Articles',
    campaigns: 'Campagnes',
    messages: 'Boîte aux lettres',
    reports: 'Rapports',
    statistics: 'Statistiques'
});

if (!ar.admin.sidebar) ar.admin.sidebar = {};
Object.assign(ar.admin.sidebar, {
    dashboard: 'لوحة القيادة',
    reclamations: 'الشكايات',
    suggestions: 'المقترحات',
    users: 'المستخدمون',
    etablissements: 'المؤسسات',
    activities: 'الأنشطة',
    validation: 'التحقق',
    events: 'الأحداث',
    news: 'الأخبار',
    articles: 'المقالات',
    campaigns: 'الحملات',
    messages: 'صندوق الرسائل',
    reports: 'التقارير',
    statistics: 'الإحصائيات'
});

// Save both
fs.writeFileSync(frPath, JSON.stringify(fr, null, 2), 'utf8');
fs.writeFileSync(arPath, JSON.stringify(ar, null, 2), 'utf8');
console.log('✅ Sidebar and Messages finalized in FR and AR');
