module.exports.newGuideDataContent = {
  fr: `    {
      id: 'citoyen',
      title: 'Citoyen (Visiteur & Résident)',
      description: 'Découvrez comment explorer la province, consulter les services publics, soumettre des réclamations et participer aux événements.',
      sections: [
        {
          id: 'intro_navigation',
          title: 'Accueil & Navigation Générale',
          subtitle: 'Bienvenue sur le Portail Médiouna officiel',
          image: '/images/guide/citoyen/accueil_fr.png',
          intro: 'Le portail vous offre un accès centralisé à toutes les informations de la province. Depuis l\\'en-tête, vous pouvez accéder rapidement aux services essentiels.',
          steps: [
            {
              title: 'Notifications',
              text: 'Cliquez sur l\\'icône en forme de cloche pour consulter vos dernières alertes et mises à jour concernant vos abonnements.',
              image: '/images/guide/citoyen/notifications_fr.png',
              highlight: { top: '2%', left: '85%', width: '4%', height: '6%', tooltipFr: 'Vos notifications', tooltipAr: 'إشعاراتك' }
            },
            {
              title: 'Changement de langue',
              text: 'Utilisez le sélecteur de langue pour basculer facilement entre la version Arabe et Française du portail.',
              image: '/images/guide/citoyen/langues_fr.png',
              highlight: { top: '2%', left: '75%', width: '8%', height: '6%', tooltipFr: 'Changer la langue', tooltipAr: 'تغيير اللغة' }
            }
          ]
        },
        {
          id: 'gestion_compte',
          title: 'Mon Compte & Sécurité',
          subtitle: 'Gérez vos informations et sécurisez votre espace',
          image: '/images/guide/citoyen/profil_fr.png',
          intro: 'L\\'espace profil vous permet de garder vos informations à jour et de renforcer la sécurité de votre compte citoyen.',
          steps: [
            {
              title: 'Informations Personnelles',
              text: 'Consultez et modifiez vos coordonnées (Nom, Email, Téléphone) directement depuis votre espace "Mon Profil".',
              highlight: { top: '25%', left: '15%', width: '70%', height: '40%', tooltipFr: 'Vos informations', tooltipAr: 'معلوماتك الشخصية' }
            },
            {
              title: 'Mes Abonnements',
              text: 'Retrouvez la liste des établissements auxquels vous êtes abonnés pour suivre leurs événements et actualités.',
              image: '/images/guide/citoyen/abonnements_fr.png',
              highlight: { top: '15%', left: '20%', width: '60%', height: '70%', tooltipFr: 'Gérer vos abonnements', tooltipAr: 'إدارة اشتراكاتك' }
            },
            {
              title: 'Sécurité et 2FA',
              text: 'Activez l\\'Authentification à Double Facteur (2FA) pour protéger au maximum votre compte contre les accès non autorisés.',
              image: '/images/guide/citoyen/securite_2fa_fr.png',
              highlight: { top: '30%', left: '25%', width: '50%', height: '25%', tooltipFr: 'Activer le 2FA', tooltipAr: 'تفعيل المصادقة الثنائية' }
            }
          ]
        },
        {
          id: 'etablissements',
          title: 'Guide des Établissements',
          subtitle: 'Trouvez et interagissez avec les services publics',
          image: '/images/guide/citoyen/etablissements_liste_fr.png',
          intro: 'Explorez tous les établissements publics, écoles, centres de santé et infrastructures sportives de la province.',
          steps: [
            {
              title: 'Recherche et Filtrage',
              text: 'Utilisez les filtres par secteur (Santé, Éducation, Sport) ou tapez le nom de l\\'établissement pour le trouver rapidement.',
              highlight: { top: '15%', left: '5%', width: '25%', height: '80%', tooltipFr: 'Filtres de recherche', tooltipAr: 'مرشحات البحث' }
            },
            {
              title: 'Détails de l\\'Établissement',
              text: 'Sur la fiche détaillée, consultez les informations complètes, événements associés, et les avis des autres citoyens.',
              image: '/images/guide/citoyen/etablissement_details_fr.png',
              highlight: { top: '10%', left: '10%', width: '80%', height: '40%', tooltipFr: 'Fiche détaillée', tooltipAr: 'تفاصيل المرفق' }
            },
            {
              title: 'S\\'abonner',
              text: 'Cliquez sur le bouton "S\\'abonner" pour recevoir des notifications immédiates lors de la publication de nouvelles actualités pour cet établissement.',
              highlight: { top: '40%', left: '15%', width: '15%', height: '8%', tooltipFr: 'Bouton d\\'abonnement', tooltipAr: 'زر الاشتراك' }
            }
          ]
        },
        {
          id: 'carte_interactive',
          title: 'Carte Interactive',
          subtitle: 'Visualisez les infrastructures géolocalisées',
          image: '/images/guide/citoyen/carte_interactive_fr.png',
          intro: 'La carte interactive est l\\'outil idéal pour localiser tous les services publics proches de chez vous.',
          steps: [
            {
              title: 'Exploration de la Carte',
              text: 'Naviguez sur la carte pour voir la répartition des établissements. Les points sont regroupés pour une meilleure lisibilité.',
              highlight: { top: '10%', left: '25%', width: '70%', height: '85%', tooltipFr: 'Carte géolocalisée', tooltipAr: 'الخريطة التفاعلية' }
            },
            {
              title: 'Filtres Rapides',
              text: 'Utilisez les filtres latéraux pour n\\'afficher que certains types d\\'infrastructures (ex: Uniquement les écoles ou les centres de santé).',
              highlight: { top: '15%', left: '2%', width: '20%', height: '30%', tooltipFr: 'Filtres par catégorie', tooltipAr: 'تصفية حسب الفئة' }
            }
          ]
        },
        {
          id: 'demarches_reclamations',
          title: 'Soumettre une Réclamation',
          subtitle: 'Signaler un incident en 4 étapes simples',
          image: '/images/guide/citoyen/reclamation_etape1_fr.png',
          intro: 'Participez à l\\'amélioration de votre commune en signalant les incidents sur la voie publique (éclairage, voirie, propreté).',
          steps: [
            {
              title: 'Étape 1: Localisation',
              text: 'Indiquez l\\'emplacement exact de l\\'incident sur la carte interactive pour faciliter l\\'intervention.',
              highlight: { top: '15%', left: '15%', width: '70%', height: '60%', tooltipFr: 'Placer le repère', tooltipAr: 'تحديد الموقع' }
            },
            {
              title: 'Étape 2: Détails',
              text: 'Choisissez la catégorie de l\\'incident et décrivez précisément le problème rencontré.',
              image: '/images/guide/citoyen/reclamation_etape2_fr.png',
              highlight: { top: '25%', left: '20%', width: '60%', height: '50%', tooltipFr: 'Catégorie et description', tooltipAr: 'التصنيف والوصف' }
            },
            {
              title: 'Étape 3: Preuves',
              text: 'Ajoutez des photos ou des documents pour appuyer votre demande et aider les autorités à évaluer la situation.',
              image: '/images/guide/citoyen/reclamation_etape3_fr.png',
              highlight: { top: '30%', left: '25%', width: '50%', height: '30%', tooltipFr: 'Upload de fichiers', tooltipAr: 'تحميل الملفات المرفقة' }
            }
          ],
          alerts: [
            {
              type: 'info',
              text: 'Une fois soumise, vous pourrez suivre l\\'état d\\'avancement de votre réclamation depuis votre tableau de bord.'
            }
          ]
        },
        {
          id: 'evenements',
          title: 'Événements & Activités',
          subtitle: 'Ne manquez aucune activité provinciale',
          image: '/images/guide/citoyen/evenements_liste_fr.png',
          intro: 'Restez informé de tous les événements, festivals, et campagnes organisés dans la province.',
          steps: [
            {
              title: 'Agenda Provincial',
              text: 'Explorez la liste complète des événements avec des filtres par date (Passé, En cours, À venir) et par secteur.',
              highlight: { top: '15%', left: '5%', width: '25%', height: '80%', tooltipFr: 'Filtres d\\'événements', tooltipAr: 'تصفية الفعاليات' }
            },
            {
              title: 'Aperçu Rapide',
              text: 'Chaque carte d\\'événement (Box) présente la date, le lieu, et l\\'organisateur pour un survol rapide.',
              image: '/images/guide/citoyen/evenement_box_fr.png',
              highlight: { top: '25%', left: '30%', width: '40%', height: '40%', tooltipFr: 'Carte d\\'événement', tooltipAr: 'بطاقة الفعالية' }
            },
            {
              title: 'Détails et Inscription',
              text: 'Accédez à la page complète de l\\'événement pour lire le programme détaillé et vous y inscrire si nécessaire.',
              image: '/images/guide/citoyen/evenement_details_fr.png',
              highlight: { top: '15%', left: '10%', width: '80%', height: '50%', tooltipFr: 'Informations détaillées', tooltipAr: 'المعلومات التفصيلية' }
            }
          ]
        },
        {
          id: 'actualites_ressources',
          title: 'Actualités, Campagnes & Articles',
          subtitle: 'Toute l\\'information de la province',
          image: '/images/guide/citoyen/actualites_liste_fr.png',
          intro: 'Le portail est votre source d\\'information officielle pour les actualités, les grandes campagnes citoyennes et les articles de ressources.',
          steps: [
            {
              title: 'Fil d\\'Actualités',
              text: 'Lisez les dernières nouvelles et annonces officielles. Le système de filtrage fonctionne de la même manière que pour les événements.',
              highlight: { top: '20%', left: '30%', width: '60%', height: '60%', tooltipFr: 'Liste des actualités', tooltipAr: 'قائمة الأخبار' }
            },
            {
              title: 'Campagnes Citoyennes',
              text: 'Découvrez les grandes campagnes de sensibilisation et d\\'action menées par les autorités locales et les délégations.',
              image: '/images/guide/citoyen/campagnes_liste_fr.png',
              highlight: { top: '15%', left: '10%', width: '80%', height: '70%', tooltipFr: 'Campagnes en cours', tooltipAr: 'الحملات الحالية' }
            },
            {
              title: 'Ressources et Articles',
              text: 'Accédez à des guides pratiques, des documents téléchargeables et des articles d\\'information pour faciliter vos démarches.',
              image: '/images/guide/citoyen/articles_liste_fr.png',
              highlight: { top: '15%', left: '10%', width: '80%', height: '70%', tooltipFr: 'Centre de ressources', tooltipAr: 'مركز الموارد والمقالات' }
            }
          ]
        },
        {
          id: 'boite_a_idees',
          title: 'Participation (Boîte à Idées)',
          subtitle: 'Contribuez au développement de Médiouna',
          image: '/images/guide/citoyen/idees_liste_fr.png',
          intro: 'La Boîte à Idées vous permet de proposer des projets innovants et d\\'interagir avec les suggestions des autres citoyens.',
          steps: [
            {
              title: 'Tableau des Suggestions',
              text: 'Suivez le statut de vos idées et de celles de la communauté : "En attente", "Validée", ou "Rejetée".',
              highlight: { top: '15%', left: '15%', width: '70%', height: '30%', tooltipFr: 'Statut des idées', tooltipAr: 'حالة المقترحات' }
            },
            {
              title: 'Proposer une Idée',
              text: 'Cliquez sur "Nouvelle suggestion" pour rédiger votre proposition. Vous pouvez ajouter un titre, une description détaillée et une image d\\'illustration.',
              image: '/images/guide/citoyen/idee_nouvelle_fr.png',
              highlight: { top: '20%', left: '20%', width: '60%', height: '60%', tooltipFr: 'Formulaire de proposition', tooltipAr: 'نموذج تقديم المقترح' }
            }
          ]
        }
      ]
    }`,
  ar: `    {
      id: 'citoyen',
      title: 'مواطن (زائر ومقيم)',
      description: 'اكتشف كيف يمكنك استكشاف الإقليم، استشارة المرافق العامة، تقديم الشكايات، والمشاركة في الفعاليات.',
      sections: [
        {
          id: 'intro_navigation',
          title: 'الرئيسية والتنقل العام',
          subtitle: 'مرحباً بك في البوابة الرسمية لمديونة',
          image: '/images/guide/citoyen/accueil_ar.png',
          intro: 'توفر لك البوابة وصولاً مركزياً لجميع المعلومات الخاصة بالإقليم. من خلال القائمة العلوية، يمكنك الوصول بسرعة إلى الخدمات الأساسية.',
          steps: [
            {
              title: 'الإشعارات',
              text: 'انقر على أيقونة الجرس للتحقق من أحدث التنبيهات والتحديثات المتعلقة باشتراكاتك.',
              image: '/images/guide/citoyen/notifications_ar.png',
              highlight: { top: '2%', left: '5%', width: '4%', height: '6%', tooltipFr: 'Vos notifications', tooltipAr: 'إشعاراتك' }
            },
            {
              title: 'تغيير اللغة',
              text: 'استخدم محدد اللغة للتبديل بسهولة بين النسختين العربية والفرنسية للبوابة.',
              image: '/images/guide/citoyen/langues_ar.png',
              highlight: { top: '2%', left: '10%', width: '8%', height: '6%', tooltipFr: 'Changer la langue', tooltipAr: 'تغيير اللغة' }
            }
          ]
        },
        {
          id: 'gestion_compte',
          title: 'حسابي والأمان',
          subtitle: 'إدارة معلوماتك وتأمين مساحتك الخاصة',
          image: '/images/guide/citoyen/profil_ar.png',
          intro: 'تتيح لك صفحة الملف الشخصي تحديث معلوماتك وتعزيز أمان حسابك كمواطن.',
          steps: [
            {
              title: 'المعلومات الشخصية',
              text: 'عرض وتعديل بيانات الاتصال الخاصة بك (الاسم، البريد الإلكتروني، الهاتف) مباشرة من مساحة "ملفي الشخصي".',
              highlight: { top: '25%', left: '15%', width: '70%', height: '40%', tooltipFr: 'Vos informations', tooltipAr: 'معلوماتك الشخصية' }
            },
            {
              title: 'اشتراكاتي',
              text: 'ابحث عن قائمة المرافق التي اشتركت فيها لمتابعة فعالياتها وأخبارها.',
              image: '/images/guide/citoyen/abonnements_ar.png',
              highlight: { top: '15%', left: '20%', width: '60%', height: '70%', tooltipFr: 'Gérer vos abonnements', tooltipAr: 'إدارة اشتراكاتك' }
            },
            {
              title: 'الأمان والمصادقة الثنائية 2FA',
              text: 'قم بتفعيل المصادقة الثنائية (2FA) لتوفير أقصى قدر من الحماية لحسابك من الوصول غير المصرح به.',
              image: '/images/guide/citoyen/securite_2fa_ar.png',
              highlight: { top: '30%', left: '25%', width: '50%', height: '25%', tooltipFr: 'Activer le 2FA', tooltipAr: 'تفعيل المصادقة الثنائية' }
            }
          ]
        },
        {
          id: 'etablissements',
          title: 'دليل المؤسسات',
          subtitle: 'ابحث وتفاعل مع المرافق العامة',
          image: '/images/guide/citoyen/etablissements_liste_ar.png',
          intro: 'استكشف جميع المرافق العامة، المدارس، المراكز الصحية، والمرافق الرياضية في الإقليم.',
          steps: [
            {
              title: 'البحث والتصفية',
              text: 'استخدم عوامل التصفية حسب القطاع (الصحة، التعليم، الرياضة) أو اكتب اسم المؤسسة للعثور عليها بسرعة.',
              highlight: { top: '15%', left: '70%', width: '25%', height: '80%', tooltipFr: 'Filtres de recherche', tooltipAr: 'مرشحات البحث' }
            },
            {
              title: 'تفاصيل المؤسسة',
              text: 'في البطاقة التفصيلية، يمكنك عرض المعلومات الكاملة، الفعاليات المرتبطة، وتقييمات المواطنين الآخرين.',
              image: '/images/guide/citoyen/etablissement_details_ar.png',
              highlight: { top: '10%', left: '10%', width: '80%', height: '40%', tooltipFr: 'Fiche détaillée', tooltipAr: 'تفاصيل المرفق' }
            },
            {
              title: 'الاشتراك',
              text: 'انقر على زر "اشتراك" لتلقي إشعارات فورية عند نشر أخبار جديدة لهذه المؤسسة.',
              highlight: { top: '40%', left: '70%', width: '15%', height: '8%', tooltipFr: 'Bouton d\\'abonnement', tooltipAr: 'زر الاشتراك' }
            }
          ]
        },
        {
          id: 'carte_interactive',
          title: 'الخريطة التفاعلية',
          subtitle: 'رؤية البنية التحتية المحددة جغرافياً',
          image: '/images/guide/citoyen/carte_interactive_ar.png',
          intro: 'الخريطة التفاعلية هي الأداة المثالية لتحديد موقع جميع الخدمات العامة القريبة منك.',
          steps: [
            {
              title: 'استكشاف الخريطة',
              text: 'تصفح الخريطة لرؤية توزيع المرافق. يتم تجميع النقاط لتسهيل القراءة.',
              highlight: { top: '10%', left: '5%', width: '70%', height: '85%', tooltipFr: 'Carte géolocalisée', tooltipAr: 'الخريطة التفاعلية' }
            },
            {
              title: 'عوامل التصفية السريعة',
              text: 'استخدم عوامل التصفية الجانبية لعرض أنواع معينة من البنية التحتية فقط (مثل: المدارس فقط أو المراكز الصحية).',
              highlight: { top: '15%', left: '78%', width: '20%', height: '30%', tooltipFr: 'Filtres par catégorie', tooltipAr: 'تصفية حسب الفئة' }
            }
          ]
        },
        {
          id: 'demarches_reclamations',
          title: 'تقديم شكاية',
          subtitle: 'الإبلاغ عن حادث في 4 خطوات بسيطة',
          image: '/images/guide/citoyen/reclamation_etape1_ar.png',
          intro: 'شارك في تحسين جماعتك من خلال الإبلاغ عن الحوادث في الأماكن العامة (الإنارة، الطرق، النظافة).',
          steps: [
            {
              title: 'الخطوة 1: تحديد الموقع',
              text: 'حدد الموقع الدقيق للحادث على الخريطة التفاعلية لتسهيل التدخل.',
              highlight: { top: '15%', left: '15%', width: '70%', height: '60%', tooltipFr: 'Placer le repère', tooltipAr: 'تحديد الموقع' }
            },
            {
              title: 'الخطوة 2: التفاصيل',
              text: 'اختر فئة الحادث واوصف المشكلة التي واجهتها بدقة.',
              image: '/images/guide/citoyen/reclamation_etape2_ar.png',
              highlight: { top: '25%', left: '20%', width: '60%', height: '50%', tooltipFr: 'Catégorie et description', tooltipAr: 'التصنيف والوصف' }
            },
            {
              title: 'الخطوة 3: الأدلة',
              text: 'أضف صوراً أو مستندات لدعم طلبك ومساعدة السلطات في تقييم الوضع.',
              image: '/images/guide/citoyen/reclamation_etape3_ar.png',
              highlight: { top: '30%', left: '25%', width: '50%', height: '30%', tooltipFr: 'Upload de fichiers', tooltipAr: 'تحميل الملفات المرفقة' }
            }
          ],
          alerts: [
            {
              type: 'info',
              text: 'بمجرد التقديم، ستتمكن من تتبع تقدم شكايتك من لوحة القيادة الخاصة بك.'
            }
          ]
        },
        {
          id: 'evenements',
          title: 'الفعاليات والأنشطة',
          subtitle: 'لا تفوت أي نشاط إقليمي',
          image: '/images/guide/citoyen/evenements_liste_ar.png',
          intro: 'ابق على اطلاع بجميع الفعاليات، المهرجانات، والحملات المنظمة في الإقليم.',
          steps: [
            {
              title: 'الأجندة الإقليمية',
              text: 'استكشف القائمة الكاملة للفعاليات مع عوامل تصفية حسب التاريخ (الماضية، الجارية، القادمة) والقطاع.',
              highlight: { top: '15%', left: '70%', width: '25%', height: '80%', tooltipFr: 'Filtres d\\'événements', tooltipAr: 'تصفية الفعاليات' }
            },
            {
              title: 'نظرة سريعة',
              text: 'كل بطاقة فعالية (Box) تعرض التاريخ، المكان، والجهة المنظمة لإلقاء نظرة سريعة.',
              image: '/images/guide/citoyen/evenement_box_ar.png',
              highlight: { top: '25%', left: '30%', width: '40%', height: '40%', tooltipFr: 'Carte d\\'événement', tooltipAr: 'بطاقة الفعالية' }
            },
            {
              title: 'التفاصيل والتسجيل',
              text: 'قم بزيارة الصفحة الكاملة للفعالية لقراءة البرنامج المفصل والتسجيل إذا لزم الأمر.',
              image: '/images/guide/citoyen/evenement_details_ar.png',
              highlight: { top: '15%', left: '10%', width: '80%', height: '50%', tooltipFr: 'Informations détaillées', tooltipAr: 'المعلومات التفصيلية' }
            }
          ]
        },
        {
          id: 'actualites_ressources',
          title: 'الأخبار، المبادرات والمقالات',
          subtitle: 'كل المعلومات عن الإقليم',
          image: '/images/guide/citoyen/actualites_liste_ar.png',
          intro: 'البوابة هي مصدرك الرسمي للمعلومات للأخبار، حملات المواطنين الكبرى والمقالات المرجعية.',
          steps: [
            {
              title: 'شريط الأخبار',
              text: 'اقرأ آخر الأخبار والإعلانات الرسمية. يعمل نظام التصفية بنفس طريقة الفعاليات.',
              highlight: { top: '20%', left: '10%', width: '60%', height: '60%', tooltipFr: 'Liste des actualités', tooltipAr: 'قائمة الأخبار' }
            },
            {
              title: 'الحملات والمبادرات',
              text: 'اكتشف حملات التوعية والعمل الكبرى التي تقودها السلطات المحلية والمندوبيات.',
              image: '/images/guide/citoyen/campagnes_liste_ar.png',
              highlight: { top: '15%', left: '10%', width: '80%', height: '70%', tooltipFr: 'Campagnes en cours', tooltipAr: 'الحملات الحالية' }
            },
            {
              title: 'الموارد والمقالات',
              text: 'الوصول إلى أدلة عملية، مستندات قابلة للتنزيل، ومقالات إعلامية لتسهيل إجراءاتك.',
              image: '/images/guide/citoyen/articles_liste_ar.png',
              highlight: { top: '15%', left: '10%', width: '80%', height: '70%', tooltipFr: 'Centre de ressources', tooltipAr: 'مركز الموارد والمقالات' }
            }
          ]
        },
        {
          id: 'boite_a_idees',
          title: 'المشاركة (صندوق الأفكار)',
          subtitle: 'ساهم في تنمية مديونة',
          image: '/images/guide/citoyen/idees_liste_ar.png',
          intro: 'يتيح لك صندوق الأفكار اقتراح مشاريع مبتكرة والتفاعل مع مقترحات المواطنين الآخرين.',
          steps: [
            {
              title: 'لوحة المقترحات',
              text: 'تتبع حالة أفكارك وأفكار المجتمع: "في الانتظار"، "مقبولة"، أو "مرفوضة".',
              highlight: { top: '15%', left: '15%', width: '70%', height: '30%', tooltipFr: 'Statut des idées', tooltipAr: 'حالة المقترحات' }
            },
            {
              title: 'اقتراح فكرة',
              text: 'انقر على "مقترح جديد" لكتابة مقترحك. يمكنك إضافة عنوان، وصف تفصيلي وصورة توضيحية.',
              image: '/images/guide/citoyen/idee_nouvelle_ar.png',
              highlight: { top: '20%', left: '20%', width: '60%', height: '60%', tooltipFr: 'Formulaire de proposition', tooltipAr: 'نموذج تقديم المقترح' }
            }
          ]
        }
      ]
    }`
};
