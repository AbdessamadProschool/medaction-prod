const fs = require('fs');
const file = 'c:/Users/Proschool/Desktop/medaction/app/[locale]/(main)/guide/guideData.ts';
let code = fs.readFileSync(file, 'utf8');

const newConsulteurSections = `
        {
          id: 'inscription',
          title: 'إنشاء حساب وتسجيل الدخول',
          subtitle: 'انضم لمجتمعنا واستفد من جميع الخدمات',
          image: '/images/guide/citoyen/register_step1_ar.png',
          intro: 'بإنشاء حساب على البوابة، ستتمكن من تقديم الشكايات، المشاركة في صندوق الأفكار، وتخصيص إشعاراتك.',
          steps: [
            {
              title: 'الهوية (الخطوة 1)',
              text: 'قم بإدخال معلوماتك الشخصية كالاسم العائلي والشخصي للبدء في إنشاء الحساب.',
              image: '/images/guide/citoyen/register_step1_ar.png',
              link: '/ar/register',
              highlight: { top: '25%', left: '10%', width: '30%', height: '45%', tooltipFr: 'Identité', tooltipAr: 'الهوية' }
            },
            {
              title: 'التواصل (الخطوة 2)',
              text: 'أدخل بريدك الإلكتروني ورقم هاتفك (اختياري) لتتمكن الإدارة من التواصل معك.',
              image: '/images/guide/citoyen/register_step2_ar.png',
              link: '/ar/register',
              highlight: { top: '25%', left: '10%', width: '30%', height: '45%', tooltipFr: 'Contact', tooltipAr: 'التواصل' }
            },
            {
              title: 'الأمان (الخطوة 3)',
              text: 'قم بتعيين كلمة مرور آمنة لحماية حسابك وتأكيدها لإتمام التسجيل.',
              image: '/images/guide/citoyen/register_step3_ar.png',
              link: '/ar/register',
              highlight: { top: '25%', left: '10%', width: '30%', height: '45%', tooltipFr: 'Sécurité', tooltipAr: 'الأمان' }
            },
            {
              title: 'تسجيل الدخول',
              text: 'إذا كان لديك حساب بالفعل، يمكنك تسجيل الدخول للوصول إلى فضائك الشخصي.',
              image: '/images/guide/citoyen/login_ar.png',
              link: '/ar/login',
              highlight: { top: '30%', left: '30%', width: '40%', height: '40%', tooltipFr: 'Connexion', tooltipAr: 'تسجيل الدخول' }
            }
          ]
        },
        {
          id: 'accessibilite',
          title: 'إمكانية الوصول والشروط',
          subtitle: 'التزامنا ببيئة رقمية شاملة',
          image: '/images/guide/citoyen/accessibilite_ar.png',
          intro: 'تعرف على التزام البوابة بتوفير الوصول للجميع بالإضافة إلى السياسات والشروط المتبعة لحماية بياناتك.',
          steps: [
            {
              title: 'بيان إمكانية الوصول',
              text: 'نعمل باستمرار على تحسين تجربة المستخدم للجميع، اقرأ بيان إمكانية الوصول لمعرفة الميزات المتوفرة.',
              image: '/images/guide/citoyen/accessibilite_ar.png',
              link: '/ar/accessibilite',
              highlight: { top: '20%', left: '20%', width: '60%', height: '60%', tooltipFr: 'Accessibilité', tooltipAr: 'إمكانية الوصول' }
            },
            {
              title: 'سياسة الخصوصية',
              text: 'اطلع على كيفية جمع ومعالجة البوابة لبياناتك الشخصية لضمان أقصى درجات الحماية.',
              image: '/images/guide/citoyen/politique_confidentialite_ar.png',
              link: '/ar/politique-confidentialite',
              highlight: { top: '20%', left: '20%', width: '60%', height: '60%', tooltipFr: 'Politique de confidentialité', tooltipAr: 'سياسة الخصوصية' }
            },
            {
              title: 'شروط الاستخدام',
              text: 'راجع الشروط والأحكام العامة لاستخدام بوابة مديونة.',
              image: '/images/guide/citoyen/conditions_utilisation_ar.png',
              link: '/ar/conditions-utilisation',
              highlight: { top: '20%', left: '20%', width: '60%', height: '60%', tooltipFr: 'Conditions d\\'utilisation', tooltipAr: 'شروط الاستخدام' }
            }
          ]
        },
        {
          id: 'contact',
          title: 'المساعدة والاتصال',
          subtitle: 'نحن هنا للاستماع إليكم',
          image: '/images/guide/citoyen/contact_ar.png',
          intro: 'إذا كانت لديك أي استفسارات أو احتجت إلى مساعدة إضافية، لا تتردد في الاتصال بنا.',
          steps: [
            {
              title: 'تواصل معنا',
              text: 'استخدم نموذج التواصل أو معلومات الاتصال المتاحة لإرسال استفسارك مباشرة إلى الإدارة.',
              image: '/images/guide/citoyen/contact_ar.png',
              link: '/ar/contact',
              highlight: { top: '20%', left: '10%', width: '80%', height: '60%', tooltipFr: 'Nous contacter', tooltipAr: 'تواصل معنا' }
            }
          ]
        },`;

const newCitoyenSections = `
        {
          id: 'suivi_reclamations',
          title: 'تتبع الشكايات',
          subtitle: 'متابعة شكاياتك المسجلة بكل شفافية',
          image: '/images/guide/citoyen/mes_reclamations_dashboard_ar.png',
          intro: 'توفر لك المنصة لوحة تحكم خاصة لمتابعة حالة الشكايات التي قمت بتقديمها وتقديم شكايات جديدة.',
          steps: [
            {
              title: 'لوحة التحكم',
              text: 'استعرض جميع شكاياتك مع إمكانية تصفح حالتها (قيد المعالجة، معالجة، إلخ).',
              image: '/images/guide/citoyen/mes_reclamations_dashboard_ar.png',
              highlight: { top: '20%', left: '5%', width: '90%', height: '70%', tooltipFr: 'Tableau de bord', tooltipAr: 'لوحة التحكم' }
            },
            {
              title: 'شكاية جديدة',
              text: 'يمكنك بسهولة تقديم شكاية جديدة من خلال النقر على زر الإضافة من فضائك الشخصي.',
              image: '/images/guide/citoyen/mes_reclamations_nouvelle_ar.png',
              highlight: { top: '15%', left: '10%', width: '80%', height: '20%', tooltipFr: 'Nouvelle réclamation', tooltipAr: 'شكاية جديدة' }
            }
          ]
        },`;

// Additions to intro_navigation of both
const introAdditions = `,
            {
              title: 'البحث الشامل',
              text: 'استخدم شريط البحث للوصول السريع إلى أي محتوى في المنصة باستخدام الاختصار CTRL+K.',
              image: '/images/guide/citoyen/recherche_globale_ar.png',
              highlight: { top: '20%', left: '20%', width: '60%', height: '20%', tooltipFr: 'Recherche globale', tooltipAr: 'البحث الشامل' }
            },
            {
              title: 'استكشاف الإقليم',
              text: 'قسم مخصص للبحث المتقدم وتصفية المؤسسات والخدمات حسب القطاع للوصول السريع.',
              image: '/images/guide/citoyen/recherche_avancee_ar.png',
              highlight: { top: '30%', left: '10%', width: '80%', height: '50%', tooltipFr: 'Exploration et filtrage', tooltipAr: 'استكشاف الإقليم' }
            },
            {
              title: 'الأحداث الأخيرة',
              text: 'ابق على اطلاع بآخر الفعاليات والأنشطة القادمة في الإقليم مع إمكانية التصفح السريع.',
              image: '/images/guide/citoyen/derniers_evenements_ar.png',
              link: '/ar/events',
              highlight: { top: '10%', left: '5%', width: '90%', height: '80%', tooltipFr: 'Derniers événements', tooltipAr: 'الأحداث الأخيرة' }
            },
            {
              title: 'الحملات والمبادرات',
              text: 'شارك في المبادرات الإقليمية واكتشف الحملات التحسيسية المستمرة.',
              image: '/images/guide/citoyen/dernieres_campagnes_ar.png',
              highlight: { top: '40%', left: '40%', width: '40%', height: '40%', tooltipFr: 'Campagnes récentes', tooltipAr: 'الحملات والمبادرات' }
            },
            {
              title: 'آخر الأخبار',
              text: 'تصفح أحدث الأخبار والإعلانات الهامة الخاصة بالإقليم لتكون دائماً في قلب الحدث.',
              image: '/images/guide/citoyen/dernieres_actualites_ar.png',
              link: '/ar/news',
              highlight: { top: '20%', left: '5%', width: '90%', height: '70%', tooltipFr: 'Dernières actualités', tooltipAr: 'آخر الأخبار' }
            },
            {
              title: 'روابط هامة (تذييل الصفحة)',
              text: 'في أسفل الصفحة تجد روابط سريعة للوصول إلى البوابات الرسمية الأخرى ومعلومات الاتصال.',
              image: '/images/guide/citoyen/footer_ar.png',
              highlight: { top: '10%', left: '5%', width: '90%', height: '80%', tooltipFr: 'Liens rapides (Footer)', tooltipAr: 'روابط هامة (تذييل الصفحة)' }
            }
          ]
        },`;

// Replace intro_navigation steps for AR
let replacedConsulteur = code.replaceAll(
  `title: 'تغيير اللغة',\n              text: 'استخدم محدد اللغة للتبديل بسهولة بين النسختين العربية والفرنسية للبوابة.',\n              image: '/images/guide/citoyen/langues_ar.png',\n              highlight: { top: '2%', left: '10%', width: '8%', height: '6%', tooltipFr: 'Changer la langue', tooltipAr: 'تغيير اللغة' }\n            }\n          ]\n        },`,
  `title: 'تغيير اللغة',
              text: 'استخدم محدد اللغة للتبديل بسهولة بين النسختين العربية والفرنسية للبوابة.',
              image: '/images/guide/citoyen/langues_ar.png',
              highlight: { top: '2%', left: '10%', width: '8%', height: '6%', tooltipFr: 'Changer la langue', tooltipAr: 'تغيير اللغة' }
            }${introAdditions}`
);

// Inject new sections for AR consulteur (after intro_navigation, right before etablissements)
// Let's find the FIRST occurrence of `id: 'etablissements'` and replace it.
// The first occurrence should be under `consulteur` `ar`. Wait, `fr` comes first!
// `code` has `fr: [` then `ar: [`.
// We need to only modify the Arabic side.
const arIndex = replacedConsulteur.indexOf('ar: [');
let beforeAr = replacedConsulteur.slice(0, arIndex);
let afterAr = replacedConsulteur.slice(arIndex);

afterAr = afterAr.replace(
  `id: 'etablissements',\n          title: 'دليل المؤسسات',`,
  `${newConsulteurSections}\n        {\n          id: 'etablissements',\n          title: 'دليل المؤسسات',`
);

// Inject new sections for AR citoyen
afterAr = afterAr.replace(
  `id: 'demarches_reclamations',\n          title: 'تقديم شكاية',`,
  `${newCitoyenSections}\n        {\n          id: 'demarches_reclamations',\n          title: 'تقديم شكاية',`
);

// Add deconnexion to gestion_compte for AR citoyen
afterAr = afterAr.replace(
  `title: 'كلمة المرور والأمان',\n              text: 'غير كلمة المرور الخاصة بك وقم بإدارة إعدادات أمان حسابك.',\n              image: '/images/guide/citoyen/securite_ar.png',\n              highlight: { top: '10%', left: '50%', width: '40%', height: '30%', tooltipFr: 'Sécurité', tooltipAr: 'الأمان' }\n            }\n          ]\n        },`,
  `title: 'كلمة المرور والأمان',
              text: 'غير كلمة المرور الخاصة بك وقم بإدارة إعدادات أمان حسابك.',
              image: '/images/guide/citoyen/securite_ar.png',
              highlight: { top: '10%', left: '50%', width: '40%', height: '30%', tooltipFr: 'Sécurité', tooltipAr: 'الأمان' }
            },
            {
              title: 'تسجيل الخروج',
              text: 'لحماية حسابك، تذكر دائماً تسجيل الخروج عند الانتهاء من تصفح الفضاء الشخصي.',
              image: '/images/guide/citoyen/deconnexion_ar.png',
              highlight: { top: '2%', left: '5%', width: '15%', height: '10%', tooltipFr: 'Déconnexion', tooltipAr: 'تسجيل الخروج' }
            }
          ]
        },`
);

// Finally, add notification step somewhere. The user said "IMAGE 5 : REPRESENT LA PAGE QUI PRESENT LE DETAILS DES NOTIFICATION RECU A CE UTILISATEUR https://bo.provincemediouna.ma/fr/notifications"
// I will add it to gestion_compte or intro_navigation. Let's add it right after securite in gestion_compte, or as a step in gestion_compte
afterAr = afterAr.replace(
  `title: 'كلمة المرور والأمان',`,
  `title: 'الإشعارات المفصلة',
              text: 'راجع جميع التنبيهات والإشعارات التي تلقيتها في صفحة مخصصة.',
              image: '/images/guide/citoyen/notifications_page_ar.png',
              link: '/ar/notifications',
              highlight: { top: '10%', left: '10%', width: '80%', height: '60%', tooltipFr: 'Détails des notifications', tooltipAr: 'الإشعارات المفصلة' }
            },
            {
              title: 'كلمة المرور والأمان',`
);

fs.writeFileSync(file, beforeAr + afterAr);
console.log('Successfully updated guideData.ts!');
