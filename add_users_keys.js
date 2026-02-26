const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, 'locales');
const locales = ['fr', 'ar'];

const adminUsersPageKeys = {
  fr: {
    page_title: "Gestion des Utilisateurs",
    total_users: "{count} utilisateurs",
    export: "Exporter",
    add: "Ajouter",
    search_placeholder: "Rechercher...",
    filter_roles_all: "Tous les rôles",
    filter_status_all: "Tous statuts",
    reset_filters: "Réinitialiser",
    no_users: "Aucun utilisateur",
    pagination: "Page {start}-{end} sur {total}",
    roles: {
      CITOYEN: "Citoyen",
      DELEGATION: "Délégation",
      AUTORITE_LOCALE: "Autorité Locale",
      COORDINATEUR_ACTIVITES: "Coordinateur des activités",
      ADMIN: "Administrateur",
      SUPER_ADMIN: "Super Admin",
      GOUVERNEUR: "Gouverneur"
    },
    role_descriptions: {
      CITOYEN: "Accès citoyen standard",
      DELEGATION: "Représentant provincial",
      AUTORITE_LOCALE: "Gestion territoire",
      COORDINATEUR_ACTIVITES: "Supervision terrain",
      ADMIN: "Gestion technique",
      SUPER_ADMIN: "Accès complet",
      GOUVERNEUR: "Supervision globale"
    },
    sectors: {
      EDUCATION: "Éducation",
      SANTE: "Santé",
      SPORT: "Sport",
      SOCIAL: "Social",
      CULTUREL: "Culturel",
      AUTRE: "Autre"
    },
    table: {
      user: "Utilisateur",
      role: "Rôle",
      status: "Statut",
      sector_establishment: "Secteur / Établissement",
      activity: "Activité",
      actions: "Actions",
      actions_count: "{count} actions",
      estab_count: "{count} étab."
    },
    statuses: {
      active: "Actif",
      inactive: "Inactif",
      activated: "activé",
      deactivated: "désactivé"
    },
    actions: {
      edit_role: "Modifier le rôle",
      reset_password: "Réinitialiser MDP",
      deactivate: "Désactiver",
      activate: "Activer",
      delete: "Supprimer"
    },
    messages: {
      error: "Une erreur est survenue",
      status_changed: "Statut {status}",
      delete_confirm: "Supprimer {name} ?",
      user_deleted: "Utilisateur supprimé",
      reset_password_confirm: "Réinitialiser MDP pour {name} ?",
      reset_password_alert: "Nouveau mot de passe: {password}",
      reset_password_success: "Mot de passe réinitialisé"
    },
    create_modal: {
      title: "Nouvel Utilisateur",
      subtitle: "Créer un compte",
      fields: {
        first_name: "Prénom",
        last_name: "Nom",
        email: "Email",
        phone: "Téléphone",
        password: "Mot de passe",
        confirm_password: "Confirmer",
        role: "Rôle",
        sector: "Secteur",
        commune: "Commune",
        establishments: "Établissements ({count})",
        active_account: "Compte actif"
      },
      placeholders: {
        first_name: "Prénom",
        last_name: "Nom",
        email: "email@exemple.com",
        phone: "06XXXXXXXX",
        password: "Mot de passe"
      },
      helpers: {
        commune_helper: "Commune de rattachement",
        establishments_helper: "Établissements gérés (multisélection)"
      },
      select_option: {
        sector: "Choisir un secteur",
        commune: "Choisir une commune"
      },
      cancel_btn: "Annuler",
      submit_btn: "Créer",
      errors: {
        password_mismatch: "Mots de passe non identiques",
        password_length: "Min 6 caractères",
        sector_required: "Secteur requis",
        commune_required: "Commune requise",
        establishment_required: "Établissement requis",
        create_error: "Erreur de création",
        server_error: "Erreur serveur"
      },
      success: "Utilisateur {name} créé"
    },
    edit_role_modal: {
      title: "Modifier le Rôle",
      current_role: "Rôle Actuel",
      new_role: "Nouveau Rôle",
      errors: {
        edit_error: "Erreur modification",
        sector_required: "Secteur requis",
        commune_required: "Commune requise",
        establishment_required: "Établissement requis",
        server_error: "Erreur serveur"
      }
    }
  },
  ar: {
    page_title: "إدارة المستخدمين",
    total_users: "{count} مستخدم",
    export: "تصدير",
    add: "إضافة",
    search_placeholder: "بحث...",
    filter_roles_all: "كل الأدوار",
    filter_status_all: "كل الحالات",
    reset_filters: "إعادة ضبط",
    no_users: "لا يوجد مستخدمين",
    pagination: "صفحة {start}-{end} من {total}",
    roles: {
      CITOYEN: "مواطن",
      DELEGATION: "مندوبية",
      AUTORITE_LOCALE: "سلطة محلية",
      COORDINATEUR_ACTIVITES: "منسق الأنشطة",
      ADMIN: "مسؤول",
      SUPER_ADMIN: "مسؤول ممتاز",
      GOUVERNEUR: "السيد العامل"
    },
    role_descriptions: {
      CITOYEN: "ولوج للخدمات العامة",
      DELEGATION: "ممثل القطاع",
      AUTORITE_LOCALE: "الإدارة الترابية",
      COORDINATEUR_ACTIVITES: "تنسيق ميداني",
      ADMIN: "إدارة تقنية",
      SUPER_ADMIN: "صلاحيات كاملة",
      GOUVERNEUR: "الإشراف العام"
    },
    sectors: {
      EDUCATION: "التعليم",
      SANTE: "الصحة",
      SPORT: "الرياضة",
      SOCIAL: "الشؤون الاجتماعية",
      CULTUREL: "الثقافة",
      AUTRE: "آخر"
    },
    table: {
      user: "المستخدم",
      role: "الدور",
      status: "الحالة",
      sector_establishment: "القطاع / المؤسسة",
      activity: "النشاط",
      actions: "إجراءات",
      actions_count: "{count} عملية",
      estab_count: "{count} مؤسسة"
    },
    statuses: {
      active: "نشط",
      inactive: "غير نشط",
      activated: "مفعل",
      deactivated: "معطل"
    },
    actions: {
      edit_role: "تعديل الدور",
      reset_password: "تغيير كلمة المرور",
      deactivate: "تعطيل",
      activate: "تفعيل",
      delete: "حذف"
    },
    messages: {
      error: "حدث خطأ",
      status_changed: "تم {status} الحساب",
      delete_confirm: "حذف {name}؟",
      user_deleted: "تم حذف المستخدم",
      reset_password_confirm: "تغيير كلمة مرور {name}؟",
      reset_password_alert: "كلمة المرور الجديدة: {password}",
      reset_password_success: "تم تغيير كلمة المرور"
    },
    create_modal: {
      title: "مستخدم جديد",
      subtitle: "إنشاء حساب جديد",
      fields: {
        first_name: "الاسم",
        last_name: "النسب",
        email: "البريد الإلكتروني",
        phone: "الهاتف",
        password: "كلمة المرور",
        confirm_password: "تأكيد كلمة المرور",
        role: "الدور",
        sector: "القطاع",
        commune: "الجماعة",
        establishments: "المؤسسات ({count})",
        active_account: "حساب نشط"
      },
      placeholders: {
        first_name: "الاسم",
        last_name: "النسب",
        email: "email@exemple.com",
        phone: "06XXXXXXXX",
        password: "كلمة المرور"
      },
      helpers: {
        commune_helper: "الجماعة التابعة لها",
        establishments_helper: "المؤسسات المسيرة (اختيار متعدد)"
      },
      select_option: {
        sector: "اختر القطاع",
        commune: "اختر الجماعة"
      },
      cancel_btn: "إلغاء",
      submit_btn: "إنشاء",
      errors: {
        password_mismatch: "كلمات المرور غير متطابقة",
        password_length: "6 أحرف على الأقل",
        sector_required: "القطاع مطلوب",
        commune_required: "الجماعة مطلوبة",
        establishment_required: "مؤسسة واحدة على الأقل",
        create_error: "خطأ في الإنشاء",
        server_error: "خطأ في الخادم"
      },
      success: "تم إنشاء المستخدم {name}"
    },
    edit_role_modal: {
      title: "تعديل الدور",
      current_role: "الدور الحالي",
      new_role: "الدور الجديد",
      errors: {
        edit_error: "خطأ في التعديل",
        sector_required: "القطاع مطلوب",
        commune_required: "الجماعة مطلوبة",
        establishment_required: "مؤسسة واحدة على الأقل",
        server_error: "خطأ في الخادم"
      }
    }
  }
};

function deepMerge(target, source) {
  for (const key in source) {
    if (source[key] instanceof Object && key in target) {
      Object.assign(source[key], deepMerge(target[key], source[key]));
    }
  }
  Object.assign(target || {}, source);
  return target;
}

locales.forEach(locale => {
  const filePath = path.join(localesDir, locale, 'common.json');
  if (fs.existsSync(filePath)) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const json = JSON.parse(content);

      if (!json.admin) json.admin = {};
      
      // Ensure users_page exists
      if (!json.admin.users_page) json.admin.users_page = {};

      // Merge data
      // We use a simpler merge strategy: overwrite/add keys to admin.users_page
      // But we must preserve other admin keys if any
      json.admin.users_page = { ...json.admin.users_page, ...adminUsersPageKeys[locale] };

      fs.writeFileSync(filePath, JSON.stringify(json, null, 2), 'utf8');
      console.log(`Updated ${locale}/common.json`);
    } catch (e) {
      console.error(`Error processing ${locale}:`, e);
    }
  } else {
      console.log(`File not found: ${filePath}`);
  }
});
