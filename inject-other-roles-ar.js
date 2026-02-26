const fs = require('fs');

const arPath = 'locales/ar/common.json';
const ar = JSON.parse(fs.readFileSync(arPath, 'utf8'));

// ============================================================
// AR TRANSLATIONS FOR AUTHORITY AND COORDINATOR
// ============================================================

// ---- authority_reclamations_page ----
if (!ar.authority_reclamations_page) ar.authority_reclamations_page = {};
Object.assign(ar.authority_reclamations_page, {
    page: "الصفحة",
    limit: "الحد",
    statut: "الحالة",
    categorie: "الفئة",
    search: "بحث...",
    all: "جميع الشكايات"
});

// ---- coordinator.navigation ----
if (!ar.coordinator) ar.coordinator = {};
if (!ar.coordinator.navigation) ar.coordinator.navigation = {};
Object.assign(ar.coordinator.navigation, {
    dashboard: "لوحة القيادة",
    dashboard_desc: "نظرة عامة على الأنشطة",
    calendar: "التقويم",
    calendar_desc: "تخطيط الأنشطة",
    establishments: "المؤسسات",
    establishments_desc: "تسيير الهياكل",
    reports: "التقارير",
    reports_desc: "تقارير الأنشطة",
    profile: "ملفي الشخصي",
    home_access: "دخول البوابة",
    logout: "تسجيل الخروج"
});

// ---- coordinator.calendar.create_panel ----
if (!ar.coordinator.calendar) ar.coordinator.calendar = {};
if (!ar.coordinator.calendar.create_panel) ar.coordinator.calendar.create_panel = {};
Object.assign(ar.coordinator.calendar.create_panel, {
    activite: "نشاط",
    title: "إضافة نشاط",
    subtitle: "خطط لنشاط جديد في التقويم",
    today: "اليوم",
    submit_all: "حفظ الكل",
    import: "استيراد الأنشطة",
    new_activity: "نشاط جديد",
    loading: "جارٍ التحميل...",
    add: "إضافة",
    confirm_delete: "تأكيد الحذف؟",
    error_delete: "خطأ أثناء الحذف",
    date: "التاريخ",
    time_start: "وقت البداية",
    time_end: "وقت النهاية",
    location: "الموقع",
    responsible: "المسؤول",
    description: "الوصف",
    is_recurrent: "نشاط متكرر",
    recurrence_end: "نهاية التكرار",
    delete: "حذف",
    edit: "تعديل",
    success_update: "تم التحديث بنجاح",
    success_create: "تم الإنشاء بنجاح",
    success_message: "تم حفظ النشاط بنجاح",
    edit_title: "تعديل النشاط",
    activity_title: "عنوان النشاط",
    activity_title_placeholder: "أدخل العنوان...",
    establishment: "المؤسسة",
    select_establishment: "اختر مؤسسة",
    type: "نوع النشاط",
    select_type: "اختر نوع النشاط...",
    description_placeholder: "تفاصيل النشاط...",
    participants: "عدد المشاركين",
    recurrence_pattern: "نمط التكرار",
    daily: "يومي",
    weekly: "أسبوعي",
    monthly: "شهري",
    daily_no_weekend: "كل يوم (ما عدا نهاية الأسبوع)",
    select_days: "اختر الأيام",
    save_changes: "حفظ التغييرات",
    create: "إنشاء النشاط"
});

// ---- coordinator.establishments ----
if (!ar.coordinator.establishments) ar.coordinator.establishments = {};
Object.assign(ar.coordinator.establishments, {
    title: "المؤسسات",
    subtitle: "قائمة المؤسسات الخاضعة لتنسيقكم",
    search_placeholder: "البحث حسب الاسم أو الرمز...",
    view_details: "عرض التفاصيل"
});

// ---- coordinator.reports ----
if (!ar.coordinator.reports) ar.coordinator.reports = {};
Object.assign(ar.coordinator.reports, {
    title: "تقارير الأنشطة",
    subtitle: "الاطلاع على التقارير وتدبيرها",
    all: "جميع التقارير",
    pending: "في الانتظار",
    completed: "مكتملة",
    search_placeholder: "تصفية التقارير..."
});

// ---- sectors ----
if (!ar.sectors) ar.sectors = {};
ar.sectors.culturel = "ثقافي";

// Save AR
fs.writeFileSync(arPath, JSON.stringify(ar, null, 2), 'utf8');
console.log('✅ AR file updated for Authority & Coordinator');
