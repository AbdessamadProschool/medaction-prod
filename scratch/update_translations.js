
const fs = require('fs');
const frPath = 'locales/fr/common.json';
const arPath = 'locales/ar/common.json';

const fr = JSON.parse(fs.readFileSync(frPath, 'utf8'));
const ar = JSON.parse(fs.readFileSync(arPath, 'utf8'));

const newFr = {
  admin: {
    events: {
      steps: {
        info: 'Informations',
        location: 'Lieu & Organisation',
        participation: 'Participation',
        media: 'Médias'
      },
      placeholders: {
        title: 'Ex: Nettoyage de la plage',
        category: 'Ex: Concours de dessin',
        description: "Détails de l'événement...",
        venue: 'Ex: Grande Salle du Conseil',
        capacity: 'Ex: 500',
        price: 'Ex: 50'
      },
      form: {
        category: "Catégorie d'événement",
        organization: 'Organisation & Établissement',
        organized_by_province: 'Organisé par la Province',
        organized_by_province_hint: "L'événement sera rattaché à la Province de Médiouna",
        under_province_patronage: 'Sous le couvert de la Province',
        under_province_patronage_hint: 'Affichage "Sous le couvert de Monsieur le Gouverneur"',
        location_type: "Type de lieu d'événement",
        manual_entry: 'Saisie Manuelle',
        existing_establishment: 'Établissement Existant',
        venue_sector: 'Secteur du lieu (optionnel)',
        all_sectors: 'Tous les secteurs',
        establishment_venue: 'Établissement (Emplacement)',
        venue_name: 'Lieu exact ou Nom de la salle',
        map_position: 'Position sur la carte',
        map_hint: "Glissez le marqueur pour définir l'emplacement exact",
        is_free: 'Participation gratuite',
        price: 'Prix d\'entrée (DH)',
        event_photos: 'Photos de l\'événement',
        add_photo: 'Ajouter'
      },
      summary: {
        title: "Résumé de l'événement",
        field_title: 'Titre',
        field_sector: 'Secteur',
        field_location: 'Lieu',
        field_date: 'Date',
        field_org: 'Organisation',
        province_org: 'Province de Médiouna',
        establishment_org: 'Établissement'
      },
      buttons: {
        draft: 'Brouillon',
        prev: 'Retour',
        next: 'Suivant',
        create: "Créer l'événement",
        save_draft_success: 'Brouillon enregistré'
      }
    }
  },
  super_admin: {
    home: 'Accueil',
    dashboard_admin: 'Tableau de bord Admin'
  }
};

const newAr = {
  admin: {
    events: {
      steps: {
        info: 'المعلومات',
        location: 'المكان والتنظيم',
        participation: 'المشاركة',
        media: 'الوسائط'
      },
      placeholders: {
        title: 'مثال: حملة تنظيف الشاطئ',
        category: 'مثال: مسابقة الرسم',
        description: 'تفاصيل الحدث...',
        venue: 'مثال: القاعة الكبرى للمجلس',
        capacity: 'مثال: 500',
        price: 'مثال: 50'
      },
      form: {
        category: 'فئة الحدث',
        organization: 'التنظيم والمؤسسة',
        organized_by_province: 'منظم من طرف العمالة',
        organized_by_province_hint: 'سيتم ربط الحدث بعمالة مديونة',
        under_province_patronage: 'تحت غطاء العمالة',
        under_province_patronage_hint: 'عرض "تحت غطاء السيد العامل"',
        location_type: 'نوع مكان الحدث',
        manual_entry: 'إدخال يدوي',
        existing_establishment: 'مؤسسة موجودة',
        venue_sector: 'قطاع المكان (اختياري)',
        all_sectors: 'جميع القطاعات',
        establishment_venue: 'المؤسسة (الموقع)',
        venue_name: 'المكان بالضبط أو اسم القاعة',
        map_position: 'الموقع على الخريطة',
        map_hint: 'قم بسحب العلامة لتحديد الموقع بالضبط',
        is_free: 'مشاركة مجانية',
        price: 'سعر الدخول (درهم)',
        event_photos: 'صور الحدث',
        add_photo: 'إضافة'
      },
      summary: {
        title: 'ملخص الحدث',
        field_title: 'العنوان',
        field_sector: 'القطاع',
        field_location: 'المكان',
        field_date: 'التاريخ',
        field_org: 'المنظمة',
        province_org: 'عمالة مديونة',
        establishment_org: 'المؤسسة'
      },
      buttons: {
        draft: 'مسودة',
        prev: 'رجوع',
        next: 'التالي',
        create: 'إنشاء الحدث',
        save_draft_success: 'تم حفظ المسودة'
      }
    }
  },
  super_admin: {
    home: 'الرئيسية',
    dashboard_admin: 'لوحة تحكم المسؤول'
  }
};

const mergeDeep = (target, source) => {
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      if (!target[key]) target[key] = {};
      mergeDeep(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
};

mergeDeep(fr, newFr);
mergeDeep(ar, newAr);

fs.writeFileSync(frPath, JSON.stringify(fr, null, 2));
fs.writeFileSync(arPath, JSON.stringify(ar, null, 2));
console.log('Translations updated successfully');
