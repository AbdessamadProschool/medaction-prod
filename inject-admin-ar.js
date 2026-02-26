const fs = require('fs');

const arPath = 'locales/ar/common.json';
const ar = JSON.parse(fs.readFileSync(arPath, 'utf8'));

// ============================================================
// DIRECT AR TRANSLATIONS FOR ADMIN/SUPER-ADMIN MISSING KEYS
// ============================================================

// ---- admin.dashboard ----
if (!ar.admin) ar.admin = {};
if (!ar.admin.dashboard) ar.admin.dashboard = {};
ar.admin.dashboard.no_data = "لا توجد بيانات متاحة";
ar.admin.dashboard.total = "المجموع";

// ---- admin.news_page ----
if (!ar.admin.news_page) ar.admin.news_page = {};
ar.admin.news_page.page = "صفحة";
ar.admin.news_page.limit = "حد";

// ---- admin.articles_page ----
if (!ar.admin.articles_page) ar.admin.articles_page = {};
ar.admin.articles_page.page = "صفحة";
ar.admin.articles_page.limit = "حد";

// ---- admin.reclamations_page ----
if (!ar.admin.reclamations_page) ar.admin.reclamations_page = {};
ar.admin.reclamations_page.page = "صفحة";
ar.admin.reclamations_page.limit = "حد";
ar.admin.reclamations_page.affectation = "التعيين";
ar.admin.reclamations_page.communeId = "الجماعة";
ar.admin.reclamations_page.categorie = "الفئة";
ar.admin.reclamations_page.ACCEPTEE = "مقبول";
ar.admin.reclamations_page.REJETEE = "مرفوض";

// ---- admin.suggestions_page ----
if (!ar.admin.suggestions_page) ar.admin.suggestions_page = {};
ar.admin.suggestions_page.page = "صفحة";
ar.admin.suggestions_page.limit = "حد";
ar.admin.suggestions_page.page_info = "الصفحة {current} من {total}";

// ---- admin.establishments_page ----
if (!ar.admin.establishments_page) ar.admin.establishments_page = {};
ar.admin.establishments_page.page = "صفحة";
ar.admin.establishments_page.limit = "حد";
ar.admin.establishments_page.includeNonPublie = "تضمين غير المنشور";

// ---- admin.events_page ----
if (!ar.admin.events_page) ar.admin.events_page = {};
ar.admin.events_page.communeId = "الجماعة";
ar.admin.events_page.dateDebut = "تاريخ البداية";
ar.admin.events_page.dateFin = "تاريخ النهاية";
ar.admin.events_page.page = "صفحة";
ar.admin.events_page.limit = "حد";

// ---- admin.users_page.edit_role_modal ----
if (!ar.admin.users_page) ar.admin.users_page = {};
if (!ar.admin.users_page.edit_role_modal) ar.admin.users_page.edit_role_modal = {};
ar.admin.users_page.edit_role_modal.loading = "جارٍ التحميل...";

// ---- admin.reports_page ----
if (!ar.admin.reports_page) ar.admin.reports_page = {};
ar.admin.reports_page.loading = "جارٍ تحميل البيانات...";
ar.admin.reports_page.title = "التقارير والإحصائيات";
ar.admin.reports_page.date_range_to = "إلى";
ar.admin.reports_page.excel = "تصدير Excel";
ar.admin.reports_page.no_data = "لا توجد بيانات متاحة لهذه الفترة";

// ---- common ----
if (!ar.common) ar.common = {};
ar.common.cancel = "إلغاء";
ar.common.confirm = "تأكيد";
ar.common.save = "حفظ";
ar.common.delete = "حذف";
ar.common.edit = "تعديل";
ar.common.close = "إغلاق";
ar.common.loading = "جارٍ التحميل...";
ar.common.error = "خطأ";
ar.common.success = "نجاح";
ar.common.yes = "نعم";
ar.common.no = "لا";

// ---- admin_campaigns.new ----
if (!ar.admin_campaigns) ar.admin_campaigns = {};
if (!ar.admin_campaigns.new) ar.admin_campaigns.new = {};
ar.admin_campaigns.new.BROUILLON = "مسودة";
ar.admin_campaigns.new.EN_ATTENTE = "في الانتظار";
ar.admin_campaigns.new.PUBLIEE = "منشور";
ar.admin_campaigns.new.TERMINEE = "منتهي";
ar.admin_campaigns.new.ANNULEE = "ملغى";

// ---- admin_campagnes ----
if (!ar.admin_campagnes) ar.admin_campagnes = {};
ar.admin_campagnes.page = "صفحة";
ar.admin_campagnes.limit = "حد";

// ---- admin_portal.messages ----
if (!ar.admin_portal) ar.admin_portal = {};
if (!ar.admin_portal.messages) ar.admin_portal.messages = {};
Object.assign(ar.admin_portal.messages, {
    title: "الرسائل",
    subtitle: "إدارة الرسائل الواردة",
    messages_count: "{count} رسائل",
    search_placeholder: "البحث في الرسائل...",
    db_error_title: "خطأ في قاعدة البيانات",
    author: "المُرسِل",
    date: "التاريخ",
    member: "عضو",
    subject_message: "الموضوع / الرسالة",
    actions: "إجراءات",
    view: "عرض",
    reply: "رد",
    received_on: "تم الاستلام في",
    reply_email: "الرد عبر البريد الإلكتروني",
    no_messages: "لا توجد رسائل",
    loading: "جارٍ تحميل الرسائل...",
    mark_read: "وضع علامة مقروء",
    delete: "حذف",
    categories: {
        info: "معلومات",
        tech: "تقني",
        question: "سؤال",
        complaint: "شكوى",
        suggestion: "اقتراح"
    }
});

// Save
fs.writeFileSync(arPath, JSON.stringify(ar, null, 2), 'utf8');
console.log('✅ AR file updated with all admin/super-admin translations');
