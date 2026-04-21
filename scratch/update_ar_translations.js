const fs = require('fs');
const path = require('path');

const arPath = path.join(process.cwd(), 'locales', 'ar', 'common.json');
const data = JSON.parse(fs.readFileSync(arPath, 'utf8'));

// 1. Update admin.articles_page
if (!data.admin) data.admin = {};
if (!data.admin.articles_page) data.admin.articles_page = {};

Object.assign(data.admin.articles_page, {
  "status": {
    "draft": "مسودة",
    "pending": "قيد الانتظار",
    "published": "منشورة",
    "rejected": "مرفوضة",
    "archived": "مؤرشفة"
  },
  "labels": {
    "featured": "مميز",
    "search_placeholder": "بحث...",
    "all_statuses": "جميع الحالات",
    "reset": "إعادة تعيين",
    "no_resume": "لا يوجد ملخص",
    "confirm_delete": "هل أنت متأكد من حذف هذا المقال؟",
    "deleted": "تم الحذف بنجاح",
    "highlighted": "تم التمييز بنجاح",
    "unhighlighted": "تم إلغاء التمييز",
    "status_changed": "تم تغيير الحالة بنجاح"
  },
  "modal": {
    "title": "تفاصيل المقال",
    "resume": "الملخص",
    "views": "المشاهدات",
    "likes": "الإعجابات",
    "author": "الكاتب",
    "change_status": "تغيير الحالة",
    "toggle_featured": "تمييز المقال",
    "toggle_featured_off": "إلغاء التمييز",
    "delete": "حذف المقال"
  },
  "messages": {
    "status_changed": "تم تغيير الحالة بنجاح",
    "highlighted": "تم التمييز بنجاح",
    "unhighlighted": "تم إلغاء التمييز",
    "deleted": "تم الحذف بنجاح",
    "confirm_delete": "هل أنت متأكد من حذف هذا المقال؟"
  }
});

// 2. Add admin.news_page (Actualités)
data.admin.news_page = {
  "page_title": "الأخبار والمستجدات",
  "total_news": "{count} خبر",
  "filters": "تصفية",
  "new_news": "خبر جديد",
  "search_placeholder": "بحث في الأخبار...",
  "all_sectors": "جميع القطاعات",
  "reset": "إعادة تعيين",
  "no_news": "لا توجد أخبار",
  "no_results": "لم يتم العثور على نتائج",
  "create_first": "كن أول من ينشر خبراً",
  "highlight": "مميز",
  "view_details": "عرض التفاصيل",
  "edit": "تعديل",
  "delete": "حذف",
  "views": "{count} مشاهدة",
  "pagination": "صفحة {page} من {totalPages} (إجمالي {total} خبر)",
  "modal": {
    "title": "تفاصيل الخبر",
    "resume": "الملخص",
    "no_resume": "لا يوجد ملخص",
    "sector": "القطاع",
    "views": "المشاهدات",
    "establishment": "المؤسسة",
    "commune": "الجماعة",
    "created_on": "أنشئ في {date}",
    "change_status": "تغيير الحالة",
    "view_online": "عرض على الموقع",
    "remove_highlight": "إزالة التمييز",
    "add_highlight": "تمييز الخبر",
    "delete": "حذف الخبر"
  },
  "statuses": {
    "BROUILLON": "مسودة",
    "EN_ATTENTE_VALIDATION": "بانتظار التحقق",
    "VALIDEE": "تم التحقق",
    "PUBLIEE": "منشور",
    "DEPUBLIEE": "غير منشور",
    "ARCHIVEE": "مؤرشف"
  },
  "messages": {
    "loading_error": "خطأ أثناء التحميل",
    "status_changed": "تم تغيير الحالة إلى \"{status}\"",
    "highlight_removed": "تمت إزالة التمييز بنجاح",
    "highlight_added": "تم تمييز الخبر بنجاح",
    "delete_confirm": "هل أنت متأكد من حذف هذا الخبر؟",
    "deleted": "تم الحذف بنجاح",
    "error": "حدث خطأ غير متوقع"
  }
};

// 3. Add admin.events_page (Événements)
data.admin.events_page = {
  "title": "إدارة الأحداث",
  "subtitle": "{count} حدث إجمالي",
  "filters": "تصفية",
  "create": "حدث جديد",
  "stats": {
    "total": "المجموع",
    "pending": "قيد الانتظار",
    "published": "منشورة",
    "in_progress": "جارية",
    "closed": "منتهية"
  },
  "filter_labels": {
    "search": "بحث بالاسم...",
    "all_statuses": "جميع الحالات",
    "all_sectors": "جميع القطاعات",
    "all_muncipalities": "جميع الجماعات",
    "reset": "إعادة تعيين"
  },
  "table": {
    "event": "الحدث",
    "sector": "القطاع",
    "location": "المكان",
    "date": "التاريخ",
    "status": "الحالة",
    "registrations": "التسجيلات",
    "actions": "إجراءات"
  },
  "status": {
    "pending": "قيد الانتظار",
    "published": "منشور",
    "in_progress": "جارية",
    "closed": "منتهية",
    "rejected": "مرفوض"
  },
  "actions": {
    "view": "عرض",
    "edit": "تعديل",
    "validate": "قبول",
    "reject": "رفض",
    "close": "إغلاق"
  },
  "empty": "لا توجد أحداث مطابقة للبحث",
  "messages": {
    "reject_reason": "يرجى إدخال سبب الرفض (10 أحرف على الأقل)",
    "reject_error": "سبب الرفض قصير جداً",
    "validated": "تم قبول الحدث بنجاح",
    "rejected": "تم رفض الحدث",
    "error": "حدث خطأ أثناء العملية"
  }
};

// 4. Fix users_page sectors if needed (ensure they are reachable)
if (!data.admin.users_page) data.admin.users_page = {};
data.admin.users_page.sectors = {
  "EDUCATION": "التعليم",
  "SANTE": "الصحة",
  "SPORT": "الرياضة",
  "SOCIAL": "الشؤون الاجتماعية",
  "CULTUREL": "ثقافي",
  "AUTRE": "أخرى"
};

fs.writeFileSync(arPath, JSON.stringify(data, null, 2), 'utf8');
console.log('Arabic translations updated successfully!');
