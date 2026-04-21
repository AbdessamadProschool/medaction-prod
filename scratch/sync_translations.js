const fs = require('fs');
const path = require('path');

function updateLocale(lang) {
  const filePath = path.join(process.cwd(), 'locales', lang, 'common.json');
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  if (!data.admin) data.admin = {};

  // 1. Suggestions Page Fixes
  if (!data.admin.suggestions_page) data.admin.suggestions_page = {};
  data.admin.suggestions_page.reset_filters = lang === 'ar' ? 'إعادة تعيين' : 'Réinitialiser';
  data.admin.suggestions_page.no_results = lang === 'ar' ? 'لم يتم العثور على نتائج للبحث.' : 'Aucun résultat pour votre recherche.';

  // 2. Articles Page Sync
  if (!data.admin.articles_page) data.admin.articles_page = {};
  data.admin.articles_page.status = {
    "draft": lang === 'ar' ? "مسودة" : "Brouillon",
    "pending": lang === 'ar' ? "قيد الانتظار" : "En attente",
    "published": lang === 'ar' ? "منشورة" : "Publiée",
    "rejected": lang === 'ar' ? "مرفوضة" : "Rejetée",
    "archived": lang === 'ar' ? "مؤرشفة" : "Archivée"
  };
  data.admin.articles_page.modal = {
    "title": lang === 'ar' ? "تفاصيل المقال" : "Détails de l'article",
    "resume": lang === 'ar' ? "الملخص" : "Résumé",
    "views": lang === 'ar' ? "المشاهدات" : "Vues",
    "likes": lang === 'ar' ? "الإعجابات" : "Likes",
    "author": lang === 'ar' ? "الكاتب" : "Auteur",
    "change_status": lang === 'ar' ? "تغيير الحالة" : "Changer le statut",
    "toggle_featured": lang === 'ar' ? "تمييز المقال" : "Mettre en avant",
    "toggle_featured_off": lang === 'ar' ? "إلغاء التمييز" : "Retirer de la une",
    "delete": lang === 'ar' ? "حذف المقال" : "Supprimer l'article"
  };
  data.admin.articles_page.messages = data.admin.articles_page.messages || {};
  Object.assign(data.admin.articles_page.messages, {
    "status_changed": lang === 'ar' ? "تم تغيير الحالة بنجاح" : "Statut mis à jour",
    "highlighted": lang === 'ar' ? "تم التمييز بنجاح" : "Mis en avant avec succès",
    "unhighlighted": lang === 'ar' ? "تم إلغاء التمييز" : "Retiré de la une",
    "deleted": lang === 'ar' ? "تم الحذف بنجاح" : "Supprimé avec succès",
    "confirm_delete": lang === 'ar' ? "هل أنت متأكد من حذف هذا المقال؟" : "Supprimer cet article ?"
  });

  // 3. News Page Sync (Actualités)
  if (!data.admin.news_page) data.admin.news_page = {};
  data.admin.news_page.modal = data.admin.news_page.modal || {};
  Object.assign(data.admin.news_page.modal, {
    "commune": lang === 'ar' ? "الجماعة" : "Commune",
    "establishment": lang === 'ar' ? "المؤسسة" : "Établissement"
  });

  // 4. Events Page Sync
  if (!data.admin.events_page) data.admin.events_page = {};
  data.admin.events_page.actions = data.admin.events_page.actions || {};
  Object.assign(data.admin.events_page.actions, {
    "close": lang === 'ar' ? "إغلاق" : "Clôturer"
  });

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

updateLocale('ar');
updateLocale('fr');
console.log('Arabic and French translations synced!');
