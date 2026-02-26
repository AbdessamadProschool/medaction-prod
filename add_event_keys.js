const fs = require('fs');
const path = require('path');

const frUpdates = {
    admin: {
        events: {
          new_title: "Nouvel Événement",
          new_subtitle: "Créez un événement complet pour informer et mobiliser les citoyens.",
          form: {
            visual: "Visuel de l'événement",
            visual_hint: "Une image attractive augmente la participation",
            general_info: "Informations Générales",
            title: "Titre de l'événement",
            description: "Description détaillée",
            establishment: "Établissement organisateur",
            type: "Type d'événement",
            date_place: "Date, Heure et Lieu",
            organizer_contact: "Organisateur & Contact",
            participation: "Participation & Inscription",
            create_btn: "Créer l'événement",
            creating: "Création en cours...",
            cancel: "Annuler",
            success_create: "Événement créé avec succès",
            image_select: "Image sélectionnée",
            delete_image: "Supprimer",
            click_add_image: "Cliquez pour ajouter une image",
            image_format: "PNG, JPG jusqu'à 5MB",
            select_establishment: "Sélectionner un établissement...",
            select_type: "Sélectionner un type...",
            tags: "Tags",
            tags_hint: "(séparés par virgule)",
            date_start: "Date de début",
            date_end: "Date de fin",
            time_start: "Heure de début",
            time_end: "Heure de fin",
            location: "Lieu / Salle",
            address: "Adresse complète",
            district: "Quartier / Douar",
            organizer_name: "Nom de l'organisateur",
            contact_phone: "Téléphone de contact",
            contact_email: "Email de contact",
            max_capacity: "Capacité maximale (personnes)",
            open_registration: "Ouvrir les inscriptions",
            open_registration_hint: "Permet aux citoyens de s'inscrire en ligne",
            external_link: "Lien d'inscription externe"
          },
          errors: {
            image_size: "L'image ne doit pas dépasser 5MB",
            upload_error: "Erreur lors de l'upload de l'image",
            create_error: "Erreur lors de la création"
          }
        }
    }
};

const arUpdates = {
    admin: {
        events: {
          new_title: "حدث جديد",
          new_subtitle: "قم بإنشاء حدث كامل لإعلام وتعبئة المواطنين.",
          form: {
            visual: "صورة الحدث",
            visual_hint: "صورة جذابة تزيد من المشاركة",
            general_info: "معلومات عامة",
            title: "عنوان الحدث",
            description: "وصف مفصل",
            establishment: "المؤسسة المنظمة",
            type: "نوع الحدث",
            date_place: "التاريخ، الوقت والمكان",
            organizer_contact: "المنظم والاتصال",
            participation: "المشاركة والتسجيل",
            create_btn: "إنشاء الحدث",
            creating: "جاري الإنشاء...",
            cancel: "إلغاء",
            success_create: "تم إنشاء الحدث بنجاح",
            image_select: "الصورة المحددة",
            delete_image: "حذف",
            click_add_image: "انقر لإضافة صورة",
            image_format: "PNG, JPG حتى 5 ميجابايت",
            select_establishment: "اختر مؤسسة...",
            select_type: "اختر نوعاً...",
            tags: "الوسوم",
            tags_hint: "(مفصولة بفواصل)",
            date_start: "تاريخ البدء",
            date_end: "تاريخ الانتهاء",
            time_start: "وقت البدء",
            time_end: "وقت الانتهاء",
            location: "المكان / القاعة",
            address: "العنوان الكامل",
            district: "الحي / الدوار",
            organizer_name: "اسم المنظم",
            contact_phone: "هاتف الاتصال",
            contact_email: "البريد الإلكتروني",
            max_capacity: "القدرة الاستيعابية القصوى",
            open_registration: "فتح التسجيل",
            open_registration_hint: "يسمح للمواطنين التسجيل عبر الإنترنت",
            external_link: "رابط تسجيل خارجي"
          },
          errors: {
            image_size: "يجب ألا تتجاوز الصورة 5 ميجابايت",
            upload_error: "خطأ في تحميل الصورة",
            create_error: "خطأ في الإنشاء"
          }
        }
    }
};

function updateFile(filePath, updates) {
    if (!fs.existsSync(filePath)) return;
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    const merge = (target, source) => {
        for (const key of Object.keys(source)) {
            if (source[key] instanceof Object && !Array.isArray(source[key])) {
                if (!target[key]) target[key] = {};
                merge(target[key], source[key]);
            } else {
                 target[key] = source[key];
            }
        }
    };
    merge(data, updates);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`Updated ${filePath}`);
}

updateFile(path.join('locales', 'fr', 'common.json'), frUpdates);
updateFile(path.join('locales', 'ar', 'common.json'), arUpdates);
