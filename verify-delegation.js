const fs = require('fs');
const path = require('path');

const fr = JSON.parse(fs.readFileSync('locales/fr/common.json', 'utf8'));
const ar = JSON.parse(fs.readFileSync('locales/ar/common.json', 'utf8'));

function getNestedValue(obj, keyPath) {
    return keyPath.split('.').reduce((acc, key) => {
        if (!acc || typeof acc !== 'object') return undefined;
        return acc[key];
    }, obj);
}

function setNestedValue(obj, keyPath, value) {
    const keys = keyPath.split('.');
    let current = obj;
    for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]] || typeof current[keys[i]] !== 'object') {
            current[keys[i]] = {};
        }
        current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
}

// Scanned delegation pages and their namespaces + keys used:

// From page.tsx: useTranslations('delegation.dashboard') => all keys under delegation.dashboard.*
// From layout.tsx: useTranslations('delegation') => sidebar.*, sectors.*
// From evenements/nouveau/page.tsx: useTranslations('delegation.dashboard.event_creation') => all keys under delegation.dashboard.event_creation.*

// Check and collect all missing keys under delegation namespace in FR
const missingFR = [];
const missingAR = [];

function checkKey(frPath, arPath, description) {
    const frVal = getNestedValue(fr, frPath);
    const arVal = getNestedValue(ar, arPath);
    if (frVal === undefined) missingFR.push({ path: frPath, description });
    if (arVal === undefined) missingAR.push({ path: arPath, frVal, description });
}

// Keys from delegation/page.tsx (useTranslations('delegation.dashboard'))
const dashboardKeys = [
    ['title', 'عنوان لوحة التحكم مع قطاع'],
    ['welcome', 'رسالة ترحيب'],
    ['content_summary', 'ملخص المحتوى'],
    ['total_views', 'إجمالي المشاهدات'],
    ['engagement', 'الالتزام'],
    ['kpi.events', 'بطاقة الأحداث'],
    ['kpi.pending', 'في الانتظار'],
    ['kpi.published', 'منشور'],
    ['kpi.news', 'الأخبار'],
    ['kpi.views_this_month', 'مشاهدات هذا الشهر'],
    ['kpi.campaigns', 'الحملات'],
    ['kpi.participants', 'المشاركون'],
    ['kpi.library', 'المكتبة'],
    ['kpi.publication_rate', 'معدل النشر'],
    ['recent_activity.title', 'النشاط الأخير'],
    ['recent_activity.view_all', 'عرض الكل'],
    ['recent_activity.empty', 'لا يوجد نشاط'],
    ['recent_activity.columns.title', 'عمود العنوان'],
    ['recent_activity.columns.type', 'عمود النوع'],
    ['recent_activity.columns.date', 'عمود التاريخ'],
    ['recent_activity.columns.status', 'عمود الحالة'],
    ['recent_activity.columns.performance', 'عمود الأداء'],
    ['recent_activity.types.evenement', 'نوع حدث'],
    ['recent_activity.types.actualite', 'نوع خبر'],
    ['recent_activity.types.article', 'نوع مقال'],
    ['recent_activity.types.campagne', 'نوع حملة'],
    ['recent_activity.status.published', 'منشور'],
    ['recent_activity.status.pending', 'في الانتظار'],
    ['recent_activity.status.draft', 'مسودة'],
    ['quick_actions.title', 'عنوان الإجراءات السريعة'],
    ['quick_actions.new_event', 'حدث جديد'],
    ['quick_actions.new_event_desc', 'وصف حدث جديد'],
    ['quick_actions.new_news', 'خبر جديد'],
    ['quick_actions.new_news_desc', 'وصف خبر جديد'],
    ['todo.title', 'عنوان للقيام به'],
    ['todo.to_close', 'أحداث للإغلاق'],
    ['todo.manage_now', 'إدارة الآن'],
    ['todo.pending_validation', 'في انتظار التحقق'],
    ['todo.all_good', 'كل شيء على ما يرام'],
];

// Keys from event creation page (useTranslations('delegation.dashboard.event_creation'))
const eventCreationKeys = [
    ['title', 'عنوان نموذج الحدث'],
    ['subtitle', 'عنوان فرعي للحدث'],
    ['back_to_list', 'العودة للقائمة'],
    ['validation.title_min', 'التحقق من الحد الأدنى للعنوان'],
    ['validation.description_min', 'التحقق من الحد الأدنى للوصف'],
    ['validation.establishment_required', 'المؤسسة مطلوبة'],
    ['validation.type_required', 'النوع مطلوب'],
    ['validation.start_date_required', 'تاريخ البدء مطلوب'],
    ['validation.email_invalid', 'بريد إلكتروني غير صالح'],
    ['validation.url_invalid', 'رابط غير صالح'],
    ['validation.error', 'خطأ في التحقق'],
    ['validation.success', 'تم الإنشاء بنجاح'],
    ['validation.success_no_image', 'تم الإنشاء بنجاح بدون صورة'],
    ['validation.upload.generic', 'فشل التحميل'],
    ['validation.upload.size', 'الحجم كبير'],
    ['validation.upload.small', 'الملف صغير'],
    ['validation.upload.type', 'النوع غير مدعوم'],
    ['validation.upload.filename', 'اسم الملف غير صالح'],
    ['validation.upload.security', 'محتوى خطير'],
    ['validation.upload.no_file', 'لا يوجد ملف'],
    ['validation.upload.too_many_files', 'عدد كبير من الملفات'],
    ['sections.visual.title', 'صورة الغلاف'],
    ['sections.visual.subtitle', 'وصف الغلاف'],
    ['sections.visual.click_to_add', 'انقر للإضافة'],
    ['sections.visual.formats', 'الصيغ المقبولة'],
    ['sections.visual.remove', 'إزالة'],
    ['sections.visual.selected_image', 'الصورة المختارة'],
    ['sections.visual.error_size', 'الصورة كبيرة جدًا'],
    ['sections.general.title', 'عنوان القسم العام'],
    ['sections.general.event_title', 'عنوان الحدث'],
    ['sections.general.event_title_placeholder', 'مكان عنوان الحدث'],
    ['sections.general.description', 'الوصف'],
    ['sections.general.description_placeholder', 'مكان الوصف'],
    ['sections.general.event_type', 'نوع الحدث'],
    ['sections.general.select_type', 'اختر النوع'],
    ['sections.general.establishment', 'المؤسسة'],
    ['sections.general.select_establishment', 'اختر مؤسسة'],
    ['sections.general.tags', 'الوسوم'],
    ['sections.general.tags_hint', 'نصيحة الوسوم'],
    ['sections.general.tags_placeholder', 'مكان الوسوم'],
    ['sections.datetime.title', 'عنوان التاريخ والوقت'],
    ['sections.datetime.start_date', 'تاريخ البدء'],
    ['sections.datetime.end_date', 'تاريخ الانتهاء'],
    ['sections.datetime.start_time', 'وقت البدء'],
    ['sections.datetime.end_time', 'وقت الانتهاء'],
    ['sections.datetime.optional', 'اختياري'],
    ['sections.datetime.location', 'المكان'],
    ['sections.datetime.location_placeholder', 'مكان الموقع'],
    ['sections.datetime.address', 'العنوان'],
    ['sections.datetime.address_placeholder', 'مكان العنوان'],
    ['sections.datetime.neighborhood', 'الحي / الدوار'],
    ['sections.datetime.neighborhood_placeholder', 'مكان الحي'],
    ['sections.organizer.title', 'عنوان المنظم'],
    ['sections.organizer.name', 'اسم المنظم'],
    ['sections.organizer.name_placeholder', 'مكان اسم المنظم'],
    ['sections.organizer.phone', 'هاتف المنظم'],
    ['sections.organizer.phone_placeholder', 'مكان الهاتف'],
    ['sections.organizer.email', 'بريد المنظم'],
    ['sections.organizer.email_placeholder', 'مكان البريد'],
    ['sections.participation.title', 'عنوان المشاركة'],
    ['sections.participation.max_capacity', 'الطاقة القصوى'],
    ['sections.participation.max_capacity_placeholder', 'مكان الطاقة القصوى'],
    ['sections.participation.open_registrations', 'فتح التسجيلات'],
    ['sections.participation.open_registrations_desc', 'السماح للزوار بالتسجيل'],
    ['sections.participation.external_link', 'رابط خارجي'],
    ['sections.participation.external_link_placeholder', 'مكان الرابط الخارجي'],
    ['types.culturel', 'ثقافي'],
    ['types.sportif', 'رياضي'],
    ['types.social', 'اجتماعي'],
    ['types.educatif', 'تعليمي'],
    ['types.sante', 'صحة'],
    ['types.autre', 'آخر'],
    ['buttons.cancel', 'إلغاء'],
    ['buttons.create', 'إنشاء'],
    ['buttons.creating', 'جاري الإنشاء...'],
];

console.log('\n============================================================');
console.log('          VÉRIFICATION COMPLÈTE PAGES DÉLÉGATION');
console.log('============================================================\n');

// Check dashboard keys
let missingInFR = 0;
let missingInAR = 0;

console.log('📋 delegation.dashboard.*');
dashboardKeys.forEach(([key]) => {
    const frKey = `delegation.dashboard.${key}`;
    const arKey = `delegation.dashboard.${key}`;
    const frVal = getNestedValue(fr, frKey);
    const arVal = getNestedValue(ar, arKey);
    if (frVal === undefined) { console.log(`  ❌ MISSING in FR: ${frKey}`); missingInFR++; }
    else if (arVal === undefined) { console.log(`  ❌ MISSING in AR: ${arKey}  (FR: "${frVal}")`); missingInAR++; }
});

console.log('\n📋 delegation.dashboard.event_creation.*');
eventCreationKeys.forEach(([key]) => {
    const frKey = `delegation.dashboard.event_creation.${key}`;
    const arKey = `delegation.dashboard.event_creation.${key}`;
    const frVal = getNestedValue(fr, frKey);
    const arVal = getNestedValue(ar, arKey);
    if (frVal === undefined) { console.log(`  ❌ MISSING in FR: ${frKey}`); missingInFR++; }
    else if (arVal === undefined) { console.log(`  ❌ MISSING in AR: ${arKey}  (FR: "${frVal}")`); missingInAR++; }
});

console.log('\n📋 delegation.sidebar.*');
const sidebarKeys = ['dashboard', 'my_events', 'my_news', 'my_articles', 'my_campaigns', 'stats'];
sidebarKeys.forEach(key => {
    const frVal = getNestedValue(fr, `delegation.sidebar.${key}`);
    const arVal = getNestedValue(ar, `delegation.sidebar.${key}`);
    if (frVal === undefined) { console.log(`  ❌ MISSING in FR: delegation.sidebar.${key}`); missingInFR++; }
    else if (arVal === undefined) { console.log(`  ❌ MISSING in AR: delegation.sidebar.${key}  (FR: "${frVal}")`); missingInAR++; }
});

console.log('\n📋 delegation.sectors.*');
const sectorKeys = ['health', 'education', 'sport', 'culture', 'youth', 'social', 'environment', 'administration'];
sectorKeys.forEach(key => {
    const frVal = getNestedValue(fr, `delegation.sectors.${key}`);
    const arVal = getNestedValue(ar, `delegation.sectors.${key}`);
    if (frVal === undefined) { console.log(`  ❌ MISSING in FR: delegation.sectors.${key}`); missingInFR++; }
    else if (arVal === undefined) { console.log(`  ❌ MISSING in AR: delegation.sectors.${key}  (FR: "${frVal}")`); missingInAR++; }
});

console.log('\n📋 nav.user_menu.*');
const navVal = getNestedValue(fr, 'nav.user_menu.delegation_space');
const navValAr = getNestedValue(ar, 'nav.user_menu.delegation_space');
if (!navVal) { console.log(`  ❌ MISSING in FR: nav.user_menu.delegation_space`); missingInFR++; }
else if (!navValAr) { console.log(`  ❌ MISSING in AR: nav.user_menu.delegation_space  (FR: "${navVal}")`); missingInAR++; }

console.log(`\n============================================================`);
console.log(`RÉSULTAT: ${missingInFR} manquant(s) en FR, ${missingInAR} manquant(s) en AR`);
if (missingInFR === 0 && missingInAR === 0) {
    console.log('✅ TOUTES LES CLÉS EXISTANTES - Délégation 100% traduite!');
} else {
    console.log(`⚠️  Des clés sont manquantes, une correction est nécessaire.`);
}
console.log('============================================================\n');
