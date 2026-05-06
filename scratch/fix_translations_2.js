const fs = require('fs');
const frPath = 'locales/fr/common.json';
const arPath = 'locales/ar/common.json';
let fr = JSON.parse(fs.readFileSync(frPath, 'utf8'));
let ar = JSON.parse(fs.readFileSync(arPath, 'utf8'));

const setDeep = (obj, path, val) => {
  const keys = path.split('.');
  let curr = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    if (!curr[keys[i]]) curr[keys[i]] = {};
    curr = curr[keys[i]];
  }
  curr[keys[keys.length - 1]] = val;
};

const arTranslations = {
  'permissions.reclamations.read.assigned': 'قراءة الشكايات المعينة',
  'permissions.reclamations.read.all': 'قراءة جميع الشكايات',
  'permissions.evenements.read.all': 'قراءة جميع الفعاليات',
  'permissions.map.view.full': 'عرض الخريطة الكاملة',
  'admin.reports_page.subtitle': 'التقارير والإحصائيات المفصلة',
  'admin.reports_page.export_buttons.excel_reclamations': 'تصدير الشكايات (Excel)',
  'admin.reports_page.export_buttons.excel_events': 'تصدير الفعاليات (Excel)',
  'admin.reports_page.kpi_cards.total_reclamations': 'إجمالي الشكايات',
  'admin.reports_page.kpi_cards.total_events': 'إجمالي الفعاليات',
  'admin.reports_page.kpi_cards.average_rating': 'متوسط التقييم',
  'admin.reports_page.kpi_cards.event_participation': 'المشاركة في الفعاليات',
  'admin.reports_page.charts.reclamations_by_status': 'الشكايات حسب الحالة',
  'admin.reports_page.charts.reclamations_evolution': 'تطور الشكايات',
  'admin.reports_page.charts.reclamations_by_commune': 'الشكايات حسب الجماعة',
  'admin.reports_page.charts.top_5_establishments': 'أفضل 5 مؤسسات',
  'admin.reports_page.reviews_count': 'عدد التقييمات',
  'admin_announcement.types.popup': 'نافذة منبثقة (Popup)',
  'admin_announcement.types.ticker': 'شريط متحرك',
  'admin_announcement.style_variant': 'النمط / المتغير',
  'admin_announcement.start_time': 'وقت البدء (مثال: 09:00)',
  'admin_announcement.end_time': 'وقت الانتهاء (مثال: 15:00)',
  'admin_announcement.scroll_speed': 'سرعة التمرير (ثانية)',
  'admin_announcement.speed_fast': 'سريع (20ث)',
  'admin_announcement.speed_slow': 'بطيء جداً (300ث)',
};

const frTranslations = {
  'permissions.reclamations.read.assigned': 'Lecture des réclamations assignées',
  'permissions.reclamations.read.all': 'Lecture de toutes les réclamations',
  'permissions.evenements.read.all': 'Lecture de tous les événements',
  'permissions.map.view.full': 'Vue complète de la carte',
  'admin.reports_page.subtitle': 'Rapports et statistiques détaillés',
  'admin.reports_page.export_buttons.excel_reclamations': 'Exporter Réclamations (Excel)',
  'admin.reports_page.export_buttons.excel_events': 'Exporter Événements (Excel)',
  'admin.reports_page.kpi_cards.total_reclamations': 'Total Réclamations',
  'admin.reports_page.kpi_cards.total_events': 'Total Événements',
  'admin.reports_page.kpi_cards.average_rating': 'Note Moyenne',
  'admin.reports_page.kpi_cards.event_participation': 'Participation Événements',
  'admin.reports_page.charts.reclamations_by_status': 'Réclamations par statut',
  'admin.reports_page.charts.reclamations_evolution': 'Évolution des réclamations',
  'admin.reports_page.charts.reclamations_by_commune': 'Réclamations par commune',
  'admin.reports_page.charts.top_5_establishments': 'Top 5 des établissements',
  'admin.reports_page.reviews_count': "Nombre d'avis",
  'admin_announcement.types.popup': 'Fenêtreale (Popup)',
  'admin_announcement.types.ticker': 'Bandeau Défilant',
  'admin_announcement.style_variant': 'Style / Variant',
  'admin_announcement.start_time': 'Heure Début (ex: 09:00)',
  'admin_announcement.end_time': 'Heure Fin (ex: 15:00)',
  'admin_announcement.scroll_speed': 'Vitesse de défilement (s)',
  'admin_announcement.speed_fast': 'Rapide (20s)',
  'admin_announcement.speed_slow': 'Très Lent (300s)',
};

for (const [k, v] of Object.entries(arTranslations)) setDeep(ar, k, v);
for (const [k, v] of Object.entries(frTranslations)) setDeep(fr, k, v);

fs.writeFileSync(arPath, JSON.stringify(ar, null, 2));
fs.writeFileSync(frPath, JSON.stringify(fr, null, 2));

console.log('Done!');
