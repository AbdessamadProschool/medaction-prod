const fs = require('fs');

const arPath = 'locales/ar/common.json';
const ar = JSON.parse(fs.readFileSync(arPath, 'utf8'));

// 1. Sidebar Admin AR
if (!ar.admin) ar.admin = {};
if (!ar.admin.sidebar) ar.admin.sidebar = {};
Object.assign(ar.admin.sidebar, {
    messages: "الرسائل",
    notifications: "التنبيهات",
    audit_logs: "سجلات التدقيق",
    system_config: "إعدادات النظام",
    backup: "نسخة احتياطية",
    legal: "إشعارات قانونية",
    help: "المساعدة والدعم"
});

// 2. SuperAdmin AR
if (!ar.super_admin) ar.super_admin = {};
Object.assign(ar.super_admin, {
    title: "الإدارة العامة",
    subtitle: "الإشراف الكامل على منصة مد أكشن",
    dashboard: {
        total_users: "إجمالي المستخدمين",
        active_sessions: "الجلسات النشطة",
        database_size: "حجم قاعدة البيانات",
        server_status: "حالة الخادم"
    },
    permissions: {
        title: "إدارة الصلاحيات",
        subtitle: "تحديد الوصول لكل دور",
        add_role: "إضافة دور",
        edit_permission: "تعديل الصلاحية",
        role_name: "اسم الدور",
        permissions_list: "قائمة الصلاحيات",
        save_changes: "حفظ التغييرات",
        delete_role: "حذف الدور"
    },
    backups: {
        title: "نسخ النظام الاحتياطية",
        subtitle: "تاريخ ونقاط استعادة النظام",
        create_now: "نسخ الآن",
        restore: "استعادة",
        download: "تحميل",
        last_backup: "آخر نسخة احتياطية",
        status: "الحالة"
    }
});

// 3. Admin Portal Messages AR
if (!ar.admin_portal) ar.admin_portal = {};
if (!ar.admin_portal.messages) ar.admin_portal.messages = {};
Object.assign(ar.admin_portal.messages, {
    title: "صندوق الوارد",
    subtitle: "إدارة رسائل المنصة",
    messages_count: "إجمالي {count} رسائل",
    search_placeholder: "البحث حسب المرسل أو الموضوع...",
    author: "المرسل",
    date: "تاريخ الاستلام",
    member: "نوع العضو",
    subject_message: "الرسالة والموضوع",
    actions: "إجراءات",
    view: "التفاصيل",
    reply: "رد",
    received_on: "تم الاستلام في",
    reply_email: "الرد عبر البريد الإلكتروني"
});

// Write back to AR
fs.writeFileSync(arPath, JSON.stringify(ar, null, 2), 'utf8');
console.log('✅ AR file updated with Admin and SuperAdmin translations');
