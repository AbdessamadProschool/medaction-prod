const fs = require('fs');

const frPath = 'locales/fr/common.json';
const arPath = 'locales/ar/common.json';

const fr = JSON.parse(fs.readFileSync(frPath, 'utf8'));
const ar = JSON.parse(fs.readFileSync(arPath, 'utf8'));

// ============================================================
// COMPREHENSIVE SUPER-ADMIN TRANSLATIONS
// ============================================================

// --- Backups ---
if (!fr.super_admin.backups) fr.super_admin.backups = {};
Object.assign(fr.super_admin.backups, {
    title: "Sauvegardes Système",
    subtitle: "Historique et création de points de restauration sécurisés pour votre base de données.",
    restore_btn: "Restaurer",
    create_btn: "Nouvelle sauvegarde",
    confirm_restore: "Êtes-vous sûr de vouloir restaurer cette sauvegarde ? Cette action écrasera les données actuelles.",
    confirm_delete: "Supprimer cette sauvegarde définitivement ?",
    empty: "Aucune sauvegarde",
    empty_desc: "Vous n'avez pas encore créé de points de restauration système.",
    messages: {
        created: "Sauvegarde créée avec succès",
        deleted: "Sauvegarde supprimée",
        restored: "Restauration terminée avec succès",
        error_create: "Erreur lors de la création",
        error_delete: "Erreur lors de la suppression",
        error_restore: "Erreur lors de la restauration",
        error_format: "Format de fichier invalide (.json requis)",
        error_network: "Erreur de connexion au serveur"
    }
});

if (!ar.super_admin) ar.super_admin = {};
if (!ar.super_admin.backups) ar.super_admin.backups = {};
Object.assign(ar.super_admin.backups, {
    title: "نسخ النظام الاحتياطية",
    subtitle: "تاريخ ونقاط استعادة آمنة لقاعدة البيانات الخاصة بك.",
    restore_btn: "استعادة",
    create_btn: "نسخة جديدة",
    confirm_restore: "هل أنت متأكد من رغبتك في استعادة هذه النسخة؟ سيؤدي ذلك إلى استبدال البيانات الحالية.",
    confirm_delete: "حذف هذه النسخة الاحتياطية نهائياً؟",
    empty: "لا توجد نسخ احتياطية",
    empty_desc: "لمتقم بإنشاء أي نقاط استعادة للنظام بعد.",
    messages: {
        created: "تم إنشاء النسخة الاحتياطية بنجاح",
        deleted: "تم حذف النسخة الاحتياطية",
        restored: "تمت الاستعادة بنجاح",
        error_create: "خطأ أثناء الإنشاء",
        error_delete: "خطأ أثناء الحذف",
        error_restore: "خطأ أثناء الاستعادة",
        error_format: "صيغة ملف غير صالحة (يتطلب .json)",
        error_network: "خطأ في الاتصال بالخادم"
    }
});

// --- Permissions ---
if (!fr.super_admin.permissions) fr.super_admin.permissions = {};
Object.assign(fr.super_admin.permissions, {
    title: "Gestion des Permissions",
    subtitle: "Contrôlez finement les accès aux différentes fonctionnalités du système.",
    search: "Rechercher une permission...",
    new: "Nouvelle permission",
    total: "Total permissions",
    active: "Activées",
    inactive: "Désactivées",
    groups: "Groupes",
    empty: "Aucune permission trouvée",
    empty_search: "Aucun résultat pour votre recherche",
    empty_desc: "Commencez par ajouter des permissions pour structurer les accès.",
    messages: {
        activated: "Permission activée",
        deactivated: "Permission désactivée",
        confirm_delete: "Supprimer la permission {name} ?",
        deleted: "Permission supprimée",
        required_fields: "Veuillez remplir tous les champs obligatoires",
        updated: "Permission mise à jour",
        created: "Permission créée"
    },
    modal: {
        title_create: "Créer une permission",
        title_edit: "Modifier la permission",
        code: "Code unique",
        code_tooltip: "Identifiant technique utilisé dans le code (ex: USERS_VIEW)",
        code_hint: "Utilisez uniquement MAJUSCULES et UNDERSCORES",
        name: "Nom public",
        name_tooltip: "Nom qui sera affiché aux administrateurs",
        name_placeholder: "Ex: Gestion des utilisateurs",
        description: "Description",
        description_placeholder: "À quoi sert cette permission ?",
        group: "Groupe technique",
        group_select: "Sélectionner un groupe",
        group_title: "Label du groupe",
        group_title_hint: "Titre d'affichage pour ce groupe",
        cancel: "Annuler",
        update: "Mettre à jour",
        create: "Créer la permission",
        groups_label: {
            USERS: "Administrateurs & Utilisateurs",
            RECLAMATIONS: "Réclamations & Plaintes",
            ETABLISSEMENTS: "Gestion des Établissements",
            EVENEMENTS: "Événements & Campagnes",
            CONTENT: "Gestion du Contenu",
            SETTINGS: "Paramètres Système",
            SYSTEM: "Infrastructure & API"
        }
    }
});

if (!ar.super_admin.permissions) ar.super_admin.permissions = {};
Object.assign(ar.super_admin.permissions, {
    title: "إدارة الصلاحيات",
    subtitle: "تحكم دقيق في الوصول إلى وظائف النظام المختلفة.",
    search: "البحث عن صلاحية...",
    new: "صلاحية جديدة",
    total: "إجمالي الصلاحيات",
    active: "مفعلة",
    inactive: "معطلة",
    groups: "مجموعات",
    empty: "لم يتم العثور على صلاحيات",
    empty_search: "لا توجد نتائج لبحثك",
    empty_desc: "ابدأ بإضافة صلاحيات لتنظيم الوصول.",
    messages: {
        activated: "تم تفعيل الصلاحية",
        deactivated: "تم تعطيل الصلاحية",
        confirm_delete: "حذف الصلاحية {name}؟",
        deleted: "تم حذف الصلاحية",
        required_fields: "يرجى ملء جميع الحقول المطلوبة",
        updated: "تم تحديث الصلاحية",
        created: "تم إنشاء الصلاحية"
    },
    modal: {
        title_create: "إنشاء صلاحية",
        title_edit: "تعديل الصلاحية",
        code: "الرمز الفريد",
        code_tooltip: "المعرف التقني المستخدم في الكود (مثال: USERS_VIEW)",
        code_hint: "استخدم الحروف الكبيرة والشرطات السفلية فقط",
        name: "الاسم العام",
        name_tooltip: "الاسم الذي سيظهر للمسؤولين",
        name_placeholder: "مثال: إدارة المستخدمين",
        description: "الوصف",
        description_placeholder: "ما الغرض من هذه الصلاحية؟",
        group: "المجموعة التقنية",
        group_select: "اختر مجموعة",
        group_title: "تسمية المجموعة",
        group_title_hint: "عنوان العرض لهذه المجموعة",
        cancel: "إلغاء",
        update: "تحديث",
        create: "إنشاء الصلاحية",
        groups_label: {
            USERS: "المسؤولون والمستخدمون",
            RECLAMATIONS: "الشكاوى والبلاغات",
            ETABLISSEMENTS: "إدارة المؤسسات",
            EVENEMENTS: "الأحداث والحملات",
            CONTENT: "إدارة المحتوى",
            SETTINGS: "إعدادات النظام",
            SYSTEM: "البنية التحتية والواجهة البرمجية"
        }
    }
});

// Save both
fs.writeFileSync(frPath, JSON.stringify(fr, null, 2), 'utf8');
fs.writeFileSync(arPath, JSON.stringify(ar, null, 2), 'utf8');
console.log('✅ FR and AR files updated with complete SuperAdmin translations');
