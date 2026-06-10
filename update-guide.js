const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'app/[locale]/(main)/guide/guideData.ts');
let content = fs.readFileSync(filePath, 'utf8');

// --- FR Replacements ---

content = content.replace(
  /\{\s*id:\s*'compte',\s*title:\s*'Inscription & Profil'[\s\S]*?id:\s*'signalement',/m,
  `{
          id: 'compte',
          title: 'Inscription & Profil',
          subtitle: 'Créer votre compte et gérer vos informations',
          image: '/images/guide/profil_fr.png',
          intro: 'En créant votre compte citoyen sur le Portail Médiouna, vous devenez un acteur actif du développement de votre commune. Vous accédez à un espace personnel personnalisé.',
          steps: [
            {
              title: 'Création de compte',
              text: 'Cliquez sur le bouton "Connexion" puis "S\\'inscrire". Saisissez votre nom, email, téléphone, et sélectionnez votre commune de résidence.',
              highlight: { top: '20%', left: '30%', width: '40%', height: '60%', tooltipFr: 'Formulaire de création de compte', tooltipAr: 'استمارة التسجيل وإنشاء الحساب' }
            },
            {
              title: 'Gestion du profil',
              text: 'Depuis votre espace personnel, vous pouvez consulter et mettre à jour vos informations de contact ainsi que vos abonnements aux établissements.',
              highlight: { top: '15%', left: '10%', width: '80%', height: '30%', tooltipFr: 'Informations personnelles', tooltipAr: 'المعلومات الشخصية' }
            }
          ],
          alerts: [
            {
              type: 'success',
              text: 'Vos données personnelles sont strictement confidentielles et traitées conformément aux directives de la CNDP.'
            }
          ]
        },
        {
          id: 'signalement',`
);

content = content.replace(
  /id:\s*'signalement',\s*title:\s*'Dépôt de Réclamation',\s*subtitle:\s*'Signaler un incident sur la voie publique',\s*image:\s*'\/images\/guide\/reclamation\.png',/m,
  `id: 'signalement',
          title: 'Dépôt de Réclamation',
          subtitle: 'Signaler un incident sur la voie publique',
          image: '/images/guide/nouvelle_reclamation_fr.png',`
);

content = content.replace(
  /\{\s*id:\s*'suivi_reclamation',\s*title:\s*'Suivi des Réclamations'[\s\S]*?id:\s*'participation_citoyenne',/m,
  `{
          id: 'suivi_reclamation',
          title: 'Suivi des Réclamations',
          subtitle: 'Suivre le traitement de votre réclamation',
          image: '/images/guide/mes_reclamations_fr.png',
          intro: 'Une fois soumise, votre réclamation suit un parcours de traitement transparent jusqu\\'à sa résolution.',
          steps: [
            {
              title: 'Statut : En attente',
              text: 'Votre signalement a été enregistré avec succès et attend d\\'être validé par les agents modérateurs de la commune.',
              highlight: { top: '25%', left: '10%', width: '80%', height: '15%', tooltipFr: 'Statut initial de dépôt', tooltipAr: 'الحالة الأولية للإرسال' }
            },
            {
              title: 'Statut : Acceptée',
              text: 'L\\'autorité locale a validé le problème et l\\'a attribué à une équipe technique ou une délégation sectorielle.',
              highlight: { top: '45%', left: '10%', width: '80%', height: '15%', tooltipFr: 'Réclamation acceptée', tooltipAr: 'شكاية مقبولة' }
            },
            {
              title: 'Statut : Rejetée',
              text: 'L\\'autorité a rejeté le signalement. Vous pouvez consulter le motif exact du rejet (doublon, fausse information, etc.).',
              highlight: { top: '65%', left: '10%', width: '80%', height: '15%', tooltipFr: 'Réclamation rejetée', tooltipAr: 'شكاية مرفوضة' }
            }
          ],
          alerts: [
            {
              type: 'info',
              text: 'Si vous estimez que le problème n\\'est pas réglé, vous pouvez cliquer sur "Réouvrir la réclamation" pour la contester.'
            }
          ]
        },
        {
          id: 'participation_citoyenne',`
);

content = content.replace(
  /\{\s*id:\s*'participation_citoyenne',\s*title:\s*'Boîte à Idées'[\s\S]*?id:\s*'autorite_locale',/m,
  `{
          id: 'participation_citoyenne',
          title: 'Boîte à Idées',
          subtitle: 'Proposer des projets d\\'intérêt général',
          image: '/images/guide/suggestions_citoyen_fr.png',
          intro: 'Le Portail Médiouna vous permet d\\'influencer positivement l\\'avenir de votre quartier en proposant des projets d\\'intérêt général.',
          steps: [
            {
              title: 'Proposer un projet',
              text: 'Remplissez le formulaire de suggestion en décrivant votre idée (création d\\'un parc, nouvel arrêt de bus, etc.) et en sélectionnant la catégorie appropriée.',
              highlight: { top: '15%', left: '15%', width: '70%', height: '40%', tooltipFr: 'Formulaire de suggestion citoyenne', tooltipAr: 'استمارة تقديم مقترح' }
            },
            {
              title: 'Suivi de la suggestion',
              text: 'Suivez l\\'état de votre proposition (Soumise, En examen, Approuvée, Rejetée, Implémentée) depuis votre espace.',
              highlight: { top: '60%', left: '15%', width: '70%', height: '20%', tooltipFr: 'Statut de la proposition', tooltipAr: 'حالة المقترح' }
            }
          ],
          alerts: [
            {
              type: 'success',
              text: 'Les propositions pertinentes sont étudiées par les comités locaux et peuvent être intégrées aux plans de développement de la région.'
            }
          ]
        }
      ]
    },
    {
      id: 'autorite_locale',`
);

// --- AR Replacements ---

content = content.replace(
  /\{\s*id:\s*'compte',\s*title:\s*'التسجيل والملف الشخصي'[\s\S]*?id:\s*'signalement',/m,
  `{
          id: 'compte',
          title: 'التسجيل والملف الشخصي',
          subtitle: 'إنشاء حسابك وإدارة معلوماتك',
          image: '/images/guide/profil_ar.png',
          intro: 'من خلال إنشاء حساب مواطن في بوابة مديونة، تصبح فاعلاً نشطاً في تنمية جماعتك الترابية وتستفيد من مساحة شخصية مخصصة.',
          steps: [
            {
              title: 'إنشاء الحساب',
              text: 'اضغط على زر "تسجيل الدخول" ثم "إنشاء حساب". أدخل اسمك، بريدك الإلكتروني، ورقم هاتفك، واختر جماعتك الترابية.',
              highlight: { top: '20%', left: '30%', width: '40%', height: '60%', tooltipFr: 'Formulaire de création de compte', tooltipAr: 'استمارة التسجيل وإنشاء الحساب' }
            },
            {
              title: 'إدارة الملف الشخصي',
              text: 'من خلال مساحتك الشخصية، يمكنك الإطلاع على معلومات الاتصال الخاصة بك وتحديثها، بالإضافة إلى إدارة اشتراكاتك في المؤسسات.',
              highlight: { top: '15%', left: '10%', width: '80%', height: '30%', tooltipFr: 'Informations personnelles', tooltipAr: 'المعلومات الشخصية' }
            }
          ],
          alerts: [
            {
              type: 'success',
              text: 'بياناتك الشخصية سرية للغاية ويتم معالجتها وفقاً لتعليمات اللجنة الوطنية لمراقبة حماية المعطيات ذات الطابع الشخصي (CNDP).'
            }
          ]
        },
        {
          id: 'signalement',`
);

content = content.replace(
  /id:\s*'signalement',\s*title:\s*'تقديم الشكايات',\s*subtitle:\s*'الإبلاغ عن حادث أو خلل في الفضاء العام',\s*image:\s*'\/images\/guide\/reclamation\.png',/m,
  `id: 'signalement',
          title: 'تقديم الشكايات',
          subtitle: 'الإبلاغ عن حادث أو خلل في الفضاء العام',
          image: '/images/guide/nouvelle_reclamation_ar.png',`
);

content = content.replace(
  /\{\s*id:\s*'suivi_reclamation',\s*title:\s*'متابعة الشكايات'[\s\S]*?id:\s*'participation_citoyenne',/m,
  `{
          id: 'suivi_reclamation',
          title: 'متابعة الشكايات',
          subtitle: 'مراقبة حالة معالجة شكايتك',
          image: '/images/guide/mes_reclamations_ar.png',
          intro: 'بمجرّد إرسالها، تتبع شكايتك مسار معالجة شفاف بالكامل حتى حل المشكلة بنجاح.',
          steps: [
            {
              title: 'الحالة: قيد الانتظار',
              text: 'تم تسجيل بلاغك بنجاح وفي انتظار التحقق والموافقة من قبل مشرفي الجماعة الترابية.',
              highlight: { top: '25%', left: '10%', width: '80%', height: '15%', tooltipFr: 'Statut initial de dépôt', tooltipAr: 'الحالة الأولية للإرسال' }
            },
            {
              title: 'الحالة: مقبولة',
              text: 'وافقت السلطة المحلية على البلاغ وأحالته إلى الفريق التقني أو المندوبية الإقليمية المختصة.',
              highlight: { top: '45%', left: '10%', width: '80%', height: '15%', tooltipFr: 'Réclamation acceptée', tooltipAr: 'شكاية مقبولة' }
            },
            {
              title: 'الحالة: مرفوضة',
              text: 'رفضت السلطة البلاغ. يمكنك الإطلاع على سبب الرفض الدقيق (تكرار، معلومات خاطئة، إلخ).',
              highlight: { top: '65%', left: '10%', width: '80%', height: '15%', tooltipFr: 'Réclamation rejetée', tooltipAr: 'شكاية مرفوضة' }
            }
          ],
          alerts: [
            {
              type: 'info',
              text: 'إذا رأيت أن المشكلة لم تحل بالشكل الصحيح، يمكنك الضغط على زر "إعادة فتح الشكاية" للاعتراض.'
            }
          ]
        },
        {
          id: 'participation_citoyenne',`
);

content = content.replace(
  /\{\s*id:\s*'participation_citoyenne',\s*title:\s*'صندوق الأفكار'[\s\S]*?id:\s*'autorite_locale',/m,
  `{
          id: 'participation_citoyenne',
          title: 'صندوق الأفكار',
          subtitle: 'تقديم اقتراحات ومشاريع محلية',
          image: '/images/guide/suggestions_citoyen_ar.png',
          intro: 'تتيح لك منصة بوابة مديونة التأثير بشكل إيجابي على محيطك من خلال اقتراح مشاريع ذات منفعة عامة.',
          steps: [
            {
              title: 'تقديم مقترح',
              text: 'اكتب فكرة لمشروع تهيئة أو نشاط ثقافي لجماعتك، وانشرها على المنصة.',
              highlight: { top: '15%', left: '10%', width: '80%', height: '25%', tooltipFr: 'Soumission d\\'idée projet', tooltipAr: 'تقديم مقترح لمشروع محلي' }
            },
            {
              title: 'متابعة المقترحات',
              text: 'تتبع حالة مقترحك (مقدم، قيد المراجعة، معتمد، مرفوض، منفذ) من خلال مساحتك الشخصية.',
              highlight: { top: '45%', left: '10%', width: '80%', height: '30%', tooltipFr: 'Suivi de votre suggestion', tooltipAr: 'متابعة مقترحك' }
            }
          ],
          alerts: [
            {
              type: 'success',
              text: 'يتم دراسة المقترحات الوجيهة من طرف المشرفين لإمكانية دمجها في مشاريع التنمية بالإقليم.'
            }
          ]
        }
      ]
    },
    {
      id: 'autorite_locale',`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('guideData.ts successfully updated!');
