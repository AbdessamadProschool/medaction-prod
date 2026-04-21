
const fs = require('fs');
const path = require('path');

const arPath = path.join(process.cwd(), 'locales/ar/common.json');
const frPath = path.join(process.cwd(), 'locales/fr/common.json');

const ar = JSON.parse(fs.readFileSync(arPath, 'utf8'));
const fr = JSON.parse(fs.readFileSync(frPath, 'utf8'));

// Massive Fix for articles_page
const articlesKeys = {
  ar: {
    filters: "تصفية",
    stats: {
      total: "المجموع",
      published: "منشورة",
      pending: "قيد الانتظار",
      views: "المشاهدات",
      views_desc: "إجمالي مشاهدات المقالات"
    }
  },
  fr: {
    filters: "Filtres",
    stats: {
      total: "Total",
      published: "Publiés",
      pending: "En attente",
      views: "Vues",
      views_desc: "Total des vues"
    }
  }
};

// Massive Fix for establishments.requests
const requestsKeys = {
  ar: {
    subtitle: "مركز تحكيم وفض نزاعات البيانات التقنية للمؤسسات",
    refresh: "تحديث البيانات",
    no_requests: "لا توجد طلبات معلقة",
    select_to_view: "اختر طلباً من القائمة لعرض التفاصيل",
    can_validate_reject: "يمكنك قبول أو رفض التعديلات المقترحة"
  },
  fr: {
    subtitle: "Centre d'arbitrage et de validation des données techniques",
    refresh: "Actualiser la liste",
    no_requests: "Aucune demande en attente",
    select_to_view: "Sélectionnez une demande pour voir les détails",
    can_validate_reject: "Vous pouvez valider ou rejeter les modifications proposées"
  }
};

// Create Modal Sync
const createModalAr = {
  title: "مستخدم جديد",
  subtitle: "إنشاء حساب جديد",
  loading_establishments: "جاري تحميل المؤسسات...",
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
    password: "كلمة المرور",
    phone: "رقم الهاتف"
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
};

const createModalFr = {
  title: "Nouvel Utilisateur",
  subtitle: "Créer un nouveau compte",
  loading_establishments: "Chargement des établissements...",
  fields: {
    first_name: "Prénom",
    last_name: "Nom",
    email: "Email",
    phone: "Téléphone",
    password: "Mot de passe",
    confirm_password: "Confirmer le mot de passe",
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
    password: "Mot de passe",
    phone: "N° de téléphone"
  },
  helpers: {
    commune_helper: "La commune dont il/elle dépend",
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
    password_length: "6 caractères minimum",
    sector_required: "Secteur requis",
    commune_required: "Commune requise",
    establishment_required: "Au moins un établissement requis",
    create_error: "Erreur de création",
    server_error: "Erreur serveur"
  },
  success: "Utilisateur {name} créé avec succès"
};

// Apply everything
ar.admin = ar.admin || {};
ar.admin.articles_page = { ...ar.admin.articles_page, ...articlesKeys.ar };
ar.admin.establishments = ar.admin.establishments || {};
ar.admin.establishments.requests = { ...ar.admin.establishments.requests, ...requestsKeys.ar };
ar.admin.users_page = ar.admin.users_page || {};
ar.admin.users_page.create_modal = createModalAr;

fr.admin = fr.admin || {};
fr.admin.articles_page = { ...fr.admin.articles_page, ...articlesKeys.fr };
fr.admin.establishments = fr.admin.establishments || {};
fr.admin.establishments.requests = { ...fr.admin.establishments.requests, ...requestsKeys.fr };
fr.admin.users_page = fr.admin.users_page || {};
fr.admin.users_page.create_modal = createModalFr;

// Backups fix
ar.admin.backups = ar.admin.backups || {
  title: "نسخ النظام الاحتياطية",
  subtitle: "تاريخ نقاط استعادة قاعدة البيانات الخاصة بك.",
  create: "نسخة جديدة",
  restore: "استعادة",
  empty_title: "لا توجد نسخ احتياطية",
  empty_desc: "لم تقم بإنشاء أي نقاط استعادة للنظام بعد.",
  create_first: "إنشاء أول نسخة احتياطية",
  success_create: "تم إنشاء النسخة الاحتياطية بنجاح",
  success_restore: "تمت استعادة النظام بنجاح",
  messages: {
    confirm_restore: "هل أنت متأكد من استعادة هذه النسخة الاحتياطية؟ سيمحو هذا البيانات الحالية.",
    confirm_delete: "هل أنت متأكد من حذف هذه النسخة الاحتياطية؟ هذا الإجراء لا يمكن التراجع عنه."
  }
};

// Save files
fs.writeFileSync(arPath, JSON.stringify(ar, null, 2), 'utf8');
fs.writeFileSync(frPath, JSON.stringify(fr, null, 2), 'utf8');

console.log('Final complete audit and repair of translations successful!');
