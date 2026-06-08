export interface StepHighlight {
  top: string;
  left: string;
  width: string;
  height: string;
  tooltipFr: string;
  tooltipAr: string;
}

export interface GuideStep {
  title: string;
  text: string;
  image?: string;
  highlight?: StepHighlight;
}

export interface GuideAlert {
  type: 'info' | 'success' | 'warning' | 'danger';
  text: string;
}

export interface GuideSection {
  id: string;
  title: string;
  subtitle: string;
  image?: string;
  intro: string;
  steps?: GuideStep[];
  alerts?: GuideAlert[];
  conclusion?: string;
}

export interface GuideRole {
  id: string;
  title: string;
  description: string;
  sections: GuideSection[];
}

export const guideData: Record<string, GuideRole[]> = {
  fr: [
    {
      id: 'consulteur',
      title: 'Consulteur (Visiteur)',
      description: 'Découvrez comment explorer la province de Médiouna, consulter les établissements publics, participer aux événements et suivre les actualités sans compte.',
      sections: [
        {
          id: 'intro',
          title: 'Introduction au Portail',
          subtitle: 'Bienvenue sur le Portail Médiouna officiel',
          image: '/images/guide/home.png',
          intro: 'Le Portail Médiouna est la plateforme officielle d\'information et de participation citoyenne de la Province de Médiouna. Elle permet à chaque citoyen et visiteur d\'accéder en toute transparence aux informations locales, de suivre les projets et événements publics, et de participer activement au développement de la province.',
          steps: [
            {
              title: 'Exploration sans compte',
              text: 'En tant que visiteur anonyme (consulteur), vous pouvez parcourir l\'annuaire complet des établissements publics, consulter la carte interactive, voir l\'agenda provincial, lire les actualités et consulter les suggestions citoyennes.',
              highlight: { top: '0%', left: '0%', width: '100%', height: '2.5%', tooltipFr: 'Accès libre à tout le contenu public', tooltipAr: 'وصول حر لكافة المحتويات العامة' }
            },
            {
              title: 'Données Publiques',
              text: 'Consultez les statistiques d\'activité globale et les indicateurs de performance de la province directement depuis la page d\'accueil.',
              highlight: { top: '71.4%', left: '0%', width: '100%', height: '11.1%', tooltipFr: 'Statistiques de la province', tooltipAr: 'إحصائيات الإقليم' }
            }
          ],
          alerts: [
            {
              type: 'info',
              text: 'Pour soumettre une réclamation, proposer des suggestions ou publier du contenu, vous devrez vous connecter ou créer un compte citoyen gratuit.'
            }
          ]
        },
        {
          id: 'accueil',
          title: 'Page d\'Accueil',
          subtitle: 'Le tableau de bord de la Province de Médiouna',
          image: '/images/guide/home.png',
          intro: 'La page d\'accueil est le point de départ de votre visite. Elle offre une synthèse dynamique de la vie provinciale et de l\'état des services publics.',
          steps: [
            {
              title: 'Chiffres Clés',
              text: 'Visualisez instantanément le nombre de réclamations soumises, le taux de résolution par les autorités et d\'autres statistiques de performance de la province.',
              highlight: { top: '71.4%', left: '0%', width: '100%', height: '11.1%', tooltipFr: 'Suivi des performances publiques', tooltipAr: 'متابعة الأداء العام' }
            },
            {
              title: 'Mises en Avant',
              text: 'Consultez rapidement les derniers événements programmés, les actualités urgentes et les établissements évalués les plus actifs.',
              highlight: { top: '31%', left: '0%', width: '100%', height: '40.4%', tooltipFr: 'Dernières actualités et activités', tooltipAr: 'أحدث الأخبار والأنشطة' }
            },
            {
              title: 'Recherche Globale',
              text: 'Utilisez le raccourci clavier Ctrl+K ou cliquez sur l\'icône loupe dans l\'en-tête pour rechercher instantanément un établissement public, un événement ou une actualité.',
              highlight: { top: '1.7%', left: '13.4%', width: '2.5%', height: '0.6%', tooltipFr: 'Barre de recherche instantanée', tooltipAr: 'شريط Recherche instantanée' }
            }
          ],
          alerts: [
            {
              type: 'success',
              text: 'La plateforme est entièrement responsive. Vous pouvez l\'utiliser de manière fluide sur votre smartphone, tablette ou ordinateur.'
            }
          ]
        },
        {
          id: 'carte',
          title: 'Carte Interactive',
          subtitle: 'Visualiser les infrastructures provinciales',
          image: '/images/guide/map.png',
          intro: 'La carte interactive géolocalise l\'ensemble des infrastructures et des services publics de la Province de Médiouna.',
          steps: [
            {
              title: 'Localisation des services',
              text: 'Parcourez la carte interactive pour localiser facilement les établissements publics, les écoles, les hôpitaux et autres infrastructures de la province.',
              highlight: { top: '12.4%', left: '0%', width: '100%', height: '87.6%', tooltipFr: 'Carte interactive de la province', tooltipAr: 'الخريطة التفاعلية للإقليم' }
            },
            {
              title: 'Filtres de recherche',
              text: 'Affinez votre affichage grâce au panneau de contrôle : sélectionnez les communes (Médiouna, Tit Mellil, Lahraouiyine, etc.), choisissez des secteurs spécifiques (Santé, Éducation, Sport) ou filtrez selon la note des établissements.',
              highlight: { top: '14.2%', left: '1.1%', width: '22.2%', height: '45.3%', tooltipFr: 'Sélection des filtres cartographiques', tooltipAr: 'اختيار مرشحات الخريطة' }
            },
            {
              title: 'Clustering intelligent',
              text: 'Les marqueurs se regroupent automatiquement lorsque vous zoomez en arrière pour garder une carte lisible. Cliquez sur un cluster pour zoomer directement sur la zone concernée.',
              highlight: { top: '35%', left: '40%', width: '20%', height: '20%', tooltipFr: 'Groupement dynamique de marqueurs', tooltipAr: 'التجميع الديناميكي للمؤشرات' }
            },
            {
              title: 'Panneau latéral de détails',
              text: 'Cliquez sur l\'icône d\'un établissement pour ouvrir le panneau latéral interactif et parcourir ses informations, ses événements programmés, ses actualités et les évaluations laissées par les citoyens.',
              highlight: { top: '12.4%', left: '72.2%', width: '27.8%', height: '87.6%', tooltipFr: 'Fiche détaillée de l\'établissement', tooltipAr: 'بطاقة معلومات المرفق' }
            }
          ],
          alerts: [
            {
              type: 'warning',
              text: 'Pour des raisons de confidentialité et de protection de la vie privée, les localisations précises des réclamations ne sont pas affichées publiquement sur la carte.'
            }
          ]
        },
        {
          id: 'etablissements',
          title: 'Annuaire des Établissements',
          subtitle: 'Trouver et évaluer les services publics',
          image: '/images/guide/etablissements.png',
          intro: 'L\'annuaire liste de manière exhaustive toutes les infrastructures publiques de Médiouna. Il permet de suivre la qualité des services offerts.',
          steps: [
            {
              title: 'Filtres avancés',
              text: 'Recherchez par nom ou filtrez par type d\'établissement (Hôpital, Lycée, Administration, Terrain de sport) et par commune.',
              highlight: { top: '24.8%', left: '72%', width: '19.3%', height: '2%', tooltipFr: 'Recherche par nom ou filtre', tooltipAr: 'البحث بالاسم أو التصفية' }
            },
            {
              title: 'Fiches détaillées',
              text: 'Consultez les horaires d\'ouverture, les adresses exactes, les numéros de contact et la liste des responsables.',
              highlight: { top: '25.8%', left: '7.2%', width: '61.1%', height: '68%', tooltipFr: 'Informations de contact et horaires', tooltipAr: 'معلومات الاتصال وأوقات العمل' }
            },
            {
              title: 'Abonnement aux notifications',
              text: 'Abonnez-vous à un établissement pour recevoir des alertes par email et des notifications en temps réel dès qu\'un nouvel événement ou une actualité le concernant est publié.',
              highlight: { top: '27%', left: '55%', width: '12%', height: '3%', tooltipFr: 'S\'abonner aux alertes', tooltipAr: 'الاشتراك في التنبيهات' }
            }
          ],
          alerts: [
            {
              type: 'info',
              text: 'Les citoyens peuvent évaluer les établissements en leur attribuant une note de 1 à 5 étoiles avec un commentaire. Chaque citoyen dispose d\'un délai de 7 jours après publication pour modifier son avis.'
            }
          ]
        },
        {
          id: 'evenements',
          title: 'Événements',
          subtitle: 'Participer aux activités de la province',
          image: '/images/guide/evenements.png',
          intro: 'Découvrez les événements, caravanes et activités citoyennes programmés dans la Province de Médiouna.',
          steps: [
            {
              title: 'Agenda provincial',
              text: 'Consultez la liste des activités en cours ou à venir. Les statuts indiquent clairement si l\'événement est programmé, en cours d\'action ou clôturé.',
              highlight: { top: '44.6%', left: '7.2%', width: '61.1%', height: '34.3%', tooltipFr: 'Consulter l\'agenda', tooltipAr: 'تصفح الأجندة الإقليمية' }
            },
            {
              title: 'Filtres et recherche',
              text: 'Recherchez par mot-clé ou filtrez par commune et par statut pour cibler un événement précis.',
              highlight: { top: '37%', left: '70.5%', width: '22.2%', height: '60.5%', tooltipFr: 'Filtres de recherche', tooltipAr: 'مرشحات البحث' }
            }
          ],
          alerts: [
            {
              type: 'success',
              text: 'Un événement "En Action" signifie qu\'il se déroule actuellement sur le terrain. Vous pouvez le suivre en direct ou vous rendre sur place.'
            }
          ]
        },
        {
          id: 'campagnes',
          title: 'Campagnes Citoyennes',
          subtitle: 'Suivre les campagnes de sensibilisation',
          image: '/images/guide/campagnes.png',
          intro: 'Découvrez les campagnes thématiques de sensibilisation menées par la province (environnement, santé, éducation).',
          steps: [
            {
              title: 'Liste des campagnes',
              text: 'Parcourez les différentes initiatives provinciales en cours ou planifiées pour la communauté.',
              highlight: { top: '54.4%', left: '7.2%', width: '61.1%', height: '37%', tooltipFr: 'Campagnes citoyennes', tooltipAr: 'الحملات المواطنة' }
            },
            {
              title: 'Recherche et filtres',
              text: 'Filtrez les campagnes par domaine ou statut pour retrouver rapidement une initiative spécifique.',
              highlight: { top: '45.2%', left: '70.5%', width: '22.2%', height: '46.1%', tooltipFr: 'Filtres de recherche', tooltipAr: 'تصفية البحث' }
            }
          ]
        },
        {
          id: 'actualites',
          title: 'Actualités Provinciales',
          subtitle: 'Suivre les dernières nouvelles de la province',
          image: '/images/guide/actualites.png',
          intro: 'Restez informé des derniers communiqués, projets et décisions officielles de la Province de Médiouna.',
          steps: [
            {
              title: 'Fil d\'actualités',
              text: 'Consultez les articles et annonces officielles publiés par la Province et les communes.',
              highlight: { top: '38%', left: '7.2%', width: '63.3%', height: '52.5%', tooltipFr: 'Articles et annonces', tooltipAr: 'المقالات والإعلانات' }
            },
            {
              title: 'Filtres sectoriels et géographiques',
              text: 'Filtrez l\'actualité par commune ou par secteur d\'activité pour cibler les informations qui vous concernent.',
              highlight: { top: '32%', left: '72.7%', width: '20%', height: '66%', tooltipFr: 'Recherche et filtres', tooltipAr: 'البحث والتصفية' }
            }
          ]
        },
        {
          id: 'statistiques',
          title: 'Statistiques Publiques',
          subtitle: 'Consulter les indicateurs et rapports de performance',
          image: '/images/guide/statistiques.png',
          intro: 'Accédez en toute transparence aux chiffres clés de la gestion provinciale et au taux de résolution des réclamations.',
          steps: [
            {
              title: 'Chiffres clés de performance',
              text: 'Visualisez les statistiques globales d\'activité de la province, telles que le volume total des signalements et le taux de traitement.',
              highlight: { top: '27.5%', left: '7.2%', width: '85.5%', height: '7.2%', tooltipFr: 'Statistiques globales', tooltipAr: 'الإحصائيات العامة' }
            },
            {
              title: 'Graphiques sectoriels',
              text: 'Analysez la répartition des demandes par secteur d\'activité et par commune via des graphiques interactifs.',
              highlight: { top: '39.3%', left: '7.2%', width: '85.5%', height: '60.7%', tooltipFr: 'Graphiques interactifs', tooltipAr: 'الرسوم البيانية التفاعلية' }
            }
          ]
        },
        {
          id: 'suggestions',
          title: 'Propositions Citoyennes',
          subtitle: 'Découvrir les idées d\'amélioration de la communauté',
          image: '/images/guide/participation.png',
          intro: 'Le Portail Médiouna offre un espace d\'expression pour la communauté afin d\'améliorer la qualité de vie dans la province.',
          steps: [
            {
              title: 'Boîte à suggestions',
              text: 'Consultez les propositions soumises par les citoyens pour améliorer la vie dans la province. Vous pouvez voir les idées classées par catégorie.',
              highlight: { top: '28.4%', left: '7.8%', width: '84.4%', height: '8%', tooltipFr: 'Suggestions des citoyens', tooltipAr: 'مقترحات وأفكار المواطنين' }
            }
          ],
          alerts: [
            {
              type: 'info',
              text: 'Bien que vous puissiez lire les suggestions en tant que simple visiteur, la création d\'une nouvelle suggestion nécessite d\'être connecté.'
            }
          ]
        }
      ]
    },
    {
      id: 'citoyen',
      title: 'Citoyen (Résident)',
      description: 'Découvrez comment soumettre des réclamations, suivre leur traitement, et proposer des suggestions d\'amélioration pour votre commune.',
      sections: [
        {
          id: 'compte',
          title: 'Inscription & Profil',
          subtitle: 'Créer votre compte et configurer vos alertes',
          image: '/images/guide/home.png',
          intro: 'En créant votre compte citoyen sur le Portail Médiouna, vous devenez un acteur actif du développement de votre commune. Vous accédez à un espace personnel personnalisé.',
          steps: [
            {
              title: 'Création de compte',
              text: 'Cliquez sur le bouton "Connexion" puis "S\'inscrire". Saisissez votre nom, email, téléphone, et sélectionnez votre commune de résidence au sein de la province de Médiouna.',
              highlight: { top: '20%', left: '30%', width: '40%', height: '60%', tooltipFr: 'Formulaire de création de compte', tooltipAr: 'استمارة التسجيل وإنشاء الحساب' }
            },
            {
              title: 'Personnalisation du profil',
              text: 'Choisissez vos secteurs d\'intérêt (Santé, Éducation, Environnement, Transport) pour recevoir en priorité les alertes et événements de ces catégories.',
              highlight: { top: '35%', left: '30%', width: '40%', height: '30%', tooltipFr: 'Abonnement aux secteurs d\'intérêt', tooltipAr: 'تحديد مجالات الاهتمام المفضل' }
            },
            {
              title: 'Système d\'activité et points',
              text: 'Chaque action citoyenne constructive (signalement validé, suggestion publiée, participation à des campagnes) vous rapporte des points de citoyenneté active visible sur votre profil.',
              highlight: { top: '5%', left: '75%', width: '20%', height: '10%', tooltipFr: 'Points de citoyenneté active', tooltipAr: 'مؤشر نقاط المواطنة النشطة' }
            }
          ],
          alerts: [
            {
              type: 'success',
              text: 'Vos données personnelles sont strictement confidentielles et traitées conformément aux directives de la CNDP pour la protection des données personnelles.'
            }
          ]
        },
        {
          id: 'signalement',
          title: 'Dépôt de Réclamation',
          subtitle: 'Signaler un incident sur la voie publique',
          image: '/images/guide/reclamation.png',
          intro: 'Un lampadaire en panne, un dépôt sauvage de déchets, ou une chaussée endommagée ? Signalez l\'incident en moins de deux minutes pour que les autorités compétentes interviennent.',
          steps: [
            {
              title: 'Initier le signalement',
              text: 'Cliquez sur le bouton "Signaler un Incident" depuis l\'accueil ou votre tableau de bord.',
              highlight: { top: '2%', left: '78%', width: '18%', height: '6%', tooltipFr: 'Bouton de signalement', tooltipAr: 'زر إضافة شكاية جديدة' }
            },
            {
              title: 'Localisation précise',
              text: 'Utilisez la carte interactive pour placer un repère exactement à l\'emplacement de l\'incident. Le système détectera automatiquement la commune correspondante.',
              highlight: { top: '65%', left: '15%', width: '70%', height: '22%', tooltipFr: 'Placer l\'incident sur la carte', tooltipAr: 'تحديد موقع الحادث بدقة' }
            },
            {
              title: 'Détails et photos',
              text: 'Décrivez brièvement le problème et chargez une ou plusieurs photos réelles de l\'incident. Les photos permettent une intervention beaucoup plus rapide des équipes techniques.',
              highlight: { top: '15%', left: '15%', width: '70%', height: '35%', tooltipFr: 'Titre, description et photo preuve', tooltipAr: 'عنوان، وصف وإرفاق صورة الحادث' }
            },
            {
              title: 'Catégorisation et envoi',
              text: 'Sélectionnez le secteur concerné et soumettez la réclamation. Elle sera immédiatement envoyée aux services de votre commune.',
              highlight: { top: '52%', left: '15%', width: '70%', height: '10%', tooltipFr: 'Sélection du secteur', tooltipAr: 'اختيار تصنيف وقطاع الشكاية' }
            }
          ],
          alerts: [
            {
              type: 'warning',
              text: 'Veillez à ce que vos photos ne montrent pas de visages lisibles ou de plaques d\'immatriculation afin de respecter le droit à la vie privée d\'autrui.'
            }
          ]
        },
        {
          id: 'suivi_reclamation',
          title: 'Suivi des Réclamations',
          subtitle: 'Suivre le traitement de votre réclamation en temps réel',
          image: '/images/guide/reclamation.png',
          intro: 'Une fois soumise, votre réclamation suit un parcours de traitement transparent jusqu\'à sa résolution.',
          steps: [
            {
              title: 'Statut : Soumis',
              text: 'Votre signalement a été enregistré avec succès et attend d\'être validé par les agents modérateurs de la commune.',
              highlight: { top: '15%', left: '10%', width: '80%', height: '10%', tooltipFr: 'Statut initial de dépôt', tooltipAr: 'الحالة الأولية للإرسال' }
            },
            {
              title: 'Statut : Assigné / En cours',
              text: 'L\'autorité locale a validé le problème et l\'a attribué à une équipe technique ou une délégation sectorielle.',
              highlight: { top: '30%', left: '10%', width: '80%', height: '20%', tooltipFr: 'Traitement ou affectation en cours', tooltipAr: 'شكاية مقبولة وقيد الإنجاز' }
            },
            {
              title: 'Messagerie intégrée',
              text: 'Vous pouvez ajouter des commentaires à votre réclamation si vous avez de nouvelles informations, et lire les messages officiels de l\'agent en charge.',
              highlight: { top: '55%', left: '10%', width: '80%', height: '35%', tooltipFr: 'Messagerie de suivi avec l\'agent', tooltipAr: 'تواصل مباشر بالتعليقات مع المسؤول' }
            },
            {
              title: 'Statut : Résolu',
              text: 'Une fois le problème réglé, l\'autorité publie une photo de preuve. Vous recevez un email automatique et une notification sur la plateforme.',
              highlight: { top: '5%', left: '80%', width: '15%', height: '6%', tooltipFr: 'Résolution confirmée par photo', tooltipAr: 'تأكيد الحل بصور ميدانية' }
            }
          ],
          alerts: [
            {
              type: 'info',
              text: 'Si vous estimez que le problème n\'est pas correctement résolu, vous disposez d\'un bouton "Réouvrir" dans un délai de 3 jours pour soumettre une objection motivée.'
            }
          ]
        },
        {
          id: 'participation_citoyenne',
          title: 'Boîte à Idées',
          subtitle: 'Proposer des projets d\'intérêt général',
          image: '/images/guide/participation.png',
          intro: 'Le Portail Médiouna vous permet d\'influencer positivement l\'avenir de votre quartier en proposant des projets d\'intérêt général.',
          steps: [
            {
              title: 'Proposer une suggestion',
              text: 'Rédigez une proposition d\'aménagement ou de projet culturel pour votre commune et publiez-la sur la plateforme.',
              highlight: { top: '15%', left: '10%', width: '80%', height: '25%', tooltipFr: 'Soumission d\'idée projet', tooltipAr: 'تقديم مقترح لمشروع محلي' }
            },
            {
              title: 'Suivi des suggestions',
              text: 'Consultez les suggestions publiées et suivez les réponses apportées par les administrateurs du portail.',
              highlight: { top: '45%', left: '10%', width: '80%', height: '30%', tooltipFr: 'Suivi de votre suggestion', tooltipAr: 'متابعة مقترحك' }
            }
          ],
          alerts: [
            {
              type: 'success',
              text: 'Les suggestions pertinentes sont étudiées par les administrateurs pour une éventuelle intégration dans les projets de développement de la province.'
            }
          ]
        }
      ]
    },
    {
      id: 'autorite',
      title: 'Autorité Locale',
      description: 'Découvrez comment gérer les réclamations citoyennes, mettre à jour leur statut, et publier des communiqués pour votre commune.',
      sections: [
        {
          id: 'traitement_signalement',
          title: 'Traitement des Réclamations',
          subtitle: 'Instruction et résolution des signalements',
          image: '/images/guide/reclamation.png',
          intro: 'En tant qu\'agent de l\'autorité locale (commune ou autorité de district), vous êtes le premier maillon de la résolution des incidents signalés par les citoyens.',
          steps: [
            {
              title: 'Réception et validation',
              text: 'Consultez la file d\'attente de votre commune. Analysez le signalement, la localisation et la photo pour vérifier s\'il s\'agit d\'un incident réel situé sur votre territoire.',
              highlight: { top: '10%', left: '5%', width: '90%', height: '20%', tooltipFr: 'File de validation communale', tooltipAr: 'دراسة الشكايات الواردة للجماعة' }
            },
            {
              title: 'Changement de statut',
              text: 'Passez le statut à "En cours de traitement" pour informer le citoyen que sa demande a été prise en compte et qu\'une intervention est planifiée.',
              highlight: { top: '35%', left: '10%', width: '80%', height: '15%', tooltipFr: 'Mise en traitement de l\'incident', tooltipAr: 'تحديث حالة الشكاية قيد المعالجة' }
            },
            {
              title: 'Assignation sectorielle',
              text: 'Si le problème relève d\'une délégation spécifique (ex: coupure d\'eau pour la Lydec/ONEE, entretien d\'un lycée pour l\'Éducation), transférez le dossier à la délégation concernée en un clic.',
              highlight: { top: '55%', left: '10%', width: '80%', height: '15%', tooltipFr: 'Affecter à une délégation', tooltipAr: 'إحالة الشكاية للمندوبية المختصة' }
            },
            {
              title: 'Clôture avec preuve',
              text: 'Une fois le problème résolu sur le terrain, modifiez le statut à "Résolu" et chargez obligatoirement une photo constatant la fin des travaux. Saisissez une brève description de l\'action menée.',
              highlight: { top: '75%', left: '10%', width: '80%', height: '20%', tooltipFr: 'Clôturer avec photo preuve', tooltipAr: 'إغلاق الشكاية وإرفاق صورة الإثبات' }
            }
          ],
          alerts: [
            {
              type: 'warning',
              text: 'Chaque rejet de réclamation (ex: hors territoire, fausse alerte) doit être explicitement justifié par écrit. Le citoyen sera notifié de la raison.'
            }
          ]
        },
        {
          id: 'communique_autorite',
          title: 'Alertes & Actualités',
          subtitle: 'Informer les habitants de votre commune',
          image: '/images/guide/news.png',
          intro: 'Publiez des communiqués officiels et des alertes de proximité pour tenir informés les habitants de votre secteur géographique.',
          steps: [
            {
              title: 'Création d\'alerte',
              text: 'Depuis votre panneau d\'administration, cliquez sur "Créer une alerte". Rédigez le titre et le corps de l\'annonce.',
              highlight: { top: '10%', left: '15%', width: '70%', height: '40%', tooltipFr: 'Rédiger l\'alerte communale', tooltipAr: 'كتابة تفاصيل التنبيه المحلي' }
            },
            {
              title: 'Ciblage et niveau d\'urgence',
              text: 'Sélectionnez le niveau d\'urgence (Info, Vigilance, Critique) et la zone ciblée. Les alertes critiques (coupure d\'eau majeure, travaux bloquant une route principale) déclenchent des notifications instantanées.',
              highlight: { top: '55%', left: '15%', width: '70%', height: '30%', tooltipFr: 'Urgence et ciblage géographique', tooltipAr: 'تحديد درجة الخطورة والنطاق المستهدف' }
            }
          ]
        }
      ]
    },
    {
      id: 'delegation',
      title: 'Délégation Sectorielle',
      description: 'Découvrez comment créer et gérer des événements, mener des campagnes de sensibilisation, et suivre les statistiques sectorielles.',
      sections: [
        {
          id: 'evenements_delegation',
          title: 'Créer un Événement',
          subtitle: 'Planifier des actions locales d\'intérêt public',
          image: '/images/guide/news.png',
          intro: 'Les délégations provinciales (Santé, Éducation, Jeunesse et Sports, etc.) peuvent planifier des événements, des caravanes médicales ou des campagnes de sensibilisation sur le portail.',
          steps: [
            {
              title: 'Remplir le stepper de création',
              text: 'Accédez à votre espace, cliquez sur "Nouvel Événement" et suivez les étapes du stepper interactif : Informations générales, Date et lieu, jauge de participants.',
              highlight: { top: '15%', left: '15%', width: '70%', height: '50%', tooltipFr: 'Remplir les étapes de création', tooltipAr: 'ملء خطوات الاستمارة التفاعلية' }
            },
            {
              title: 'Localisation de l\'activité',
              text: 'Associez l\'événement à un établissement public de votre secteur (ex: caravane de don du sang dans un hôpital de Tit Mellil).',
              highlight: { top: '70%', left: '15%', width: '70%', height: '15%', tooltipFr: 'Géolocaliser l\'événement', tooltipAr: 'ربط النشاط بمرفق عمومي محدد' }
            },
            {
              title: 'Gestion des inscriptions',
              text: 'Activez la jauge d\'inscription si les places sont limitées. Vous pourrez exporter la liste des participants au format Excel ou PDF.',
              highlight: { top: '45%', left: '30%', width: '40%', height: '15%', tooltipFr: 'Gérer les places et participants', tooltipAr: 'تدبير التسجيل وقائمة الحضور' }
            }
          ],
          alerts: [
            {
              type: 'info',
              text: 'Les événements validés apparaissent automatiquement sur l\'agenda provincial de la page d\'accueil et sur la fiche de l\'établissement associé.'
            }
          ]
        }
      ]
    },
    {
      id: 'gouverneur',
      title: 'Gouverneur (Cabinet)',
      description: 'Accédez au tableau de bord de supervision globale, analysez la carte de chaleur des réclamations et suivez les performances de la province.',
      sections: [
        {
          id: 'dashboard_gouverneur',
          title: 'Supervision Provinciale',
          subtitle: 'Suivi des indicateurs clés de performance',
          image: '/images/guide/home.png',
          intro: 'Le rôle de Gouverneur (et son cabinet) dispose d\'une console de décision de haut niveau pour piloter le développement provincial et veiller à l\'efficacité des services publics.',
          steps: [
            {
              title: 'Indicateurs de performance (KPIs)',
              text: 'Consultez les taux de résolution globaux, le temps moyen de traitement par commune, et le taux de satisfaction des citoyens.',
              highlight: { top: '15%', left: '5%', width: '90%', height: '20%', tooltipFr: 'Performance globale de la province', tooltipAr: 'مؤشرات الأداء ورضا المواطنين' }
            },
            {
              title: 'Suivi des retards',
              text: 'Identifiez immédiatement les réclamations en souffrance qui dépassent les délais réglementaires de traitement. Vous pouvez envoyer un signal de rappel automatique à l\'autorité communale en charge.',
              highlight: { top: '40%', left: '5%', width: '90%', height: '25%', tooltipFr: 'Alertes de retards de traitement', tooltipAr: 'متابعة الشكايات المتأخرة والتعثرات' }
            },
            {
              title: 'Bilan d\'activité trimestriel',
              text: 'Générez des rapports synthétiques sur l\'activité globale de la province de Médiouna en vue des comités de direction.',
              highlight: { top: '75%', left: '5%', width: '90%', height: '15%', tooltipFr: 'Télécharger les rapports d\'activité', tooltipAr: 'تحميل تقارير الحصيلة الدورية' }
            }
          ]
        },
        {
          id: 'heatmaps_gouverneur',
          title: 'Cartes Thématiques & Chaleur',
          subtitle: 'Identifier les zones de tension et besoins d\'infrastructures',
          image: '/images/guide/map.png',
          intro: 'La carte décisionnelle du Gouverneur intègre des calques de données avancés pour analyser géographiquement les besoins de la province.',
          steps: [
            {
              title: 'Activer la carte de chaleur (Heatmap)',
              text: 'Affichez la concentration des réclamations citoyennes pour identifier visuellement les quartiers ou zones industrielles nécessitant des investissements d\'infrastructure.',
              highlight: { top: '5%', left: '80%', width: '15%', height: '8%', tooltipFr: 'Activer le calque Heatmap', tooltipAr: 'تفعيل خريطة الشكايات الحرارية' }
            },
            {
              title: 'Superposition des secteurs',
              text: 'Filtrez par secteur d\'activité (ex: Éclairage public, Eau et électricité, Déchets) pour superposer les couches de réclamations sur la carte des projets en cours.',
              highlight: { top: '15%', left: '2%', width: '25%', height: '70%', tooltipFr: 'Filtrer par secteur d\'activité', tooltipAr: 'تراكب قطاعات الخدمات والشكايات' }
            }
          ],
          alerts: [
            {
              type: 'success',
              text: 'Ces cartes sont générées en temps réel à partir des coordonnées GPS validées par les signalements des citoyens.'
            }
          ]
        }
      ]
    },
    {
      id: 'admin',
      title: 'Administrateur',
      description: 'Découvrez comment gérer les utilisateurs, configurer le système, administrer la carte interactive et modérer les publications.',
      sections: [
        {
          id: 'gestion_rbac',
          title: 'Gestion des Utilisateurs',
          subtitle: 'Contrôle des accès basés sur les rôles (RBAC)',
          image: '/images/guide/home.png',
          intro: 'L\'administrateur gère l\'intégrité des comptes et distribue les droits d\'accès aux différents agents publics de la Province de Médiouna.',
          steps: [
            {
              title: 'Invitation d\'agents',
              text: 'Invitez de nouveaux membres du personnel (agents communaux, délégués sectoriels) en renseignant leur adresse email professionnelle.',
              highlight: { top: '10%', left: '75%', width: '20%', height: '8%', tooltipFr: 'Inviter un agent public', tooltipAr: 'دعوة مستخدم أو موظف جديد' }
            },
            {
              title: 'Attribution des rôles',
              text: 'Attribuez le rôle adéquat avec précision (Citoyen, Autorité Locale, Délégation, Gouverneur, Administrateur) et associez l\'agent à une commune ou une délégation sectorielle.',
              highlight: { top: '25%', left: '10%', width: '80%', height: '40%', tooltipFr: 'Formulaire d\'attribution de rôle', tooltipAr: 'نموذج تحديد الأدوار والصلاحيات' }
            },
            {
              title: 'Audit des logs de connexion',
              text: 'Surveillez les activités système pour identifier les anomalies de sécurité ou les tentatives d\'accès non autorisées.',
              highlight: { top: '70%', left: '10%', width: '80%', height: '20%', tooltipFr: 'Salles d\'audit de sécurité', tooltipAr: 'مراقبة سجل العمليات والأمان' }
            }
          ],
          alerts: [
            {
              type: 'warning',
              text: 'L\'attribution d\'un rôle d\'autorité locale ou de délégation nécessite une double validation par email pour prévenir toute usurpation de fonction officielle.'
            }
          ]
        },
        {
          id: 'gestion_carte',
          title: 'Administration de la Carte',
          subtitle: 'Gérer l\'annuaire et les points géolocalisés',
          image: '/images/guide/map.png',
          intro: 'Configurez et mettez à jour le référentiel géographique de la province.',
          steps: [
            {
              title: 'Ajouter un établissement',
              text: 'Créez un nouvel établissement (école, hôpital, commissariat), placez-le sur la carte par coordonnées GPS, et affectez-lui un gestionnaire.',
              highlight: { top: '10%', left: '75%', width: '20%', height: '8%', tooltipFr: 'Créer un point d\'intérêt public', tooltipAr: 'إضافة مرفق عمومي جديد' }
            },
            {
              title: 'Modération des avis',
              text: 'Consultez les évaluations et commentaires laissés par les citoyens. Supprimez tout contenu injurieux, diffamatoire ou contraire aux CGU de la plateforme.',
              highlight: { top: '25%', left: '10%', width: '80%', height: '55%', tooltipFr: 'Liste des avis à modérer', tooltipAr: 'مراقبة وتقييم التعليقات والآراء' }
            }
          ]
        }
      ]
    }
  ],
  ar: [
    {
      id: 'consulteur',
      title: 'متصفح الموقع (زائر)',
      description: 'اكتشف كيفية استكشاف إقليم مديونة، والاطلاع على المرافق العمومية، والمشاركة في الأنشطة ومتابعة الأخبار دون الحاجة إلى إنشاء حساب.',
      sections: [
        {
          id: 'intro',
          title: 'مقدمة عن البوابة',
          subtitle: 'مرحباً بكم في بوابة مديونة الرسمية',
          image: '/images/guide/home.png',
          intro: 'بوابة مديونة هي المنصة الرسمية للإعلام والمشاركة المواطنة لإقليم مديونة. تتيح لكل مواطن وزائر الوصول بكل شفافية إلى المعلومات المحلية، ومتابعة المشاريع والأنشطة العمومية، والمساهمة الفعالة في تنمية الإقليم.',
          steps: [
            {
              title: 'تصفح بدون حساب',
              text: 'بصفتك زائراً غير مسجل، يمكنك تصفح الدليل الكامل للمرافق العمومية، والاطلاع على الخريطة التفاعلية، ومعرفة أجندة الإقليم، وقراءة الأخبار، والاطلاع على مقترحات المواطنين.',
              highlight: { top: '0%', left: '0%', width: '100%', height: '2.5%', tooltipFr: 'Accès libre à tout le contenu public', tooltipAr: 'وصول حر لكافة المحتويات العامة' }
            },
            {
              title: 'البيانات العامة',
              text: 'الاطلاع على إحصائيات النشاط العام ومؤشرات الأداء للإقليم مباشرة من الصفحة الرئيسية.',
              highlight: { top: '71.4%', left: '0%', width: '100%', height: '11.1%', tooltipFr: 'Statistiques de la province', tooltipAr: 'إحصائيات الإقليم' }
            }
          ],
          alerts: [
            {
              type: 'info',
              text: 'لتقديم شكاية، أو تقديم اقتراحات، أو نشر محتوى، ستحتاج إلى تسجيل الدخول أو إنشاء حساب مواطن مجاني.'
            }
          ]
        },
        {
          id: 'accueil',
          title: 'الصفحة الرئيسية',
          subtitle: 'لوحة القيادة لإقليم مديونة',
          image: '/images/guide/home.png',
          intro: 'الصفحة الرئيسية هي نقطة الانطلاق لزيارتك. وتقدم ملخصاً ديناميكياً للحياة بالإقليم وحالة المرافق والخدمات العمومية.',
          steps: [
            {
              title: 'الأرقام والشركاء',
              text: 'اطلع فوراً على عدد الشكايات القدمة، ومعدل معالجتها من قبل السلطات، وغيرها من مؤشرات أداء الخدمات بالإقليم.',
              highlight: { top: '71.4%', left: '0%', width: '100%', height: '11.1%', tooltipFr: 'Suivi des performances publiques', tooltipAr: 'متابعة الأداء العام' }
            },
            {
              title: 'المحتوى البارز',
              text: 'تصفح سريعاً أحدث الأنشطة المبرمجة، والأخبار العاجلة، والمرافق الأكثر تفاعلاً وتقييماً من قبل المواطنين.',
              highlight: { top: '31%', left: '0%', width: '100%', height: '40.4%', tooltipFr: 'Dernières actualités et activités', tooltipAr: 'أحدث الأخبار والأنشطة' }
            },
            {
              title: 'البحث الشامل',
              text: 'استخدم اختصار لوحة المفاتيح Ctrl+K أو اضغط على أيقونة البحث في الأعلى للبحث الفوري عن مرفق عمومي، أو نشاط، ou خبر.',
              highlight: { top: '1.7%', left: '13.4%', width: '2.5%', height: '0.6%', tooltipFr: 'Barre de recherche instantanée', tooltipAr: 'شريط البحث الفوري' }
            }
          ],
          alerts: [
            {
              type: 'success',
              text: 'المنصة متوافقة تماماً مع جميع الأجهزة. يمكنك تصفحها بسلاسة من هاتفك الذكي، جهازك اللوحي، أو حاسوبك الشخصي.'
            }
          ]
        },
        {
          id: 'carte',
          title: 'الخريطة التفاعلية',
          subtitle: 'تحديد مواقع المرافق الإقليمية',
          image: '/images/guide/map.png',
          intro: 'تحدد الخريطة التفاعلية المواقع الجغرافية لكافة البنيات التحتية والمرافق العمومية لإقليم مديونة.',
          steps: [
            {
              title: 'تحديد مواقع الخدمات',
              text: 'تصفح الخريطة التفاعلية لتحديد مواقع المرافق العمومية، المدارس، المستشفيات وغيرها من البنيات التحتية للإقليم بسهولة.',
              highlight: { top: '12.4%', left: '0%', width: '100%', height: '87.6%', tooltipFr: 'Carte interactive de la province', tooltipAr: 'الخريطة التفاعلية للإقليم' }
            },
            {
              title: 'مرشحات البحث',
              text: 'خصص عرض الخريطة عبر لوحة التحكم: اختر الجماعات (مديونة، تيط مليل، الهراويين، إلخ)، وحدد قطاعات معينة (الصحة، التعليم، الرياضة) أو صفّ حسب تقييمات المرافق.',
              highlight: { top: '14.2%', left: '1.1%', width: '22.2%', height: '45.3%', tooltipFr: 'Sélection des filtres cartographiques', tooltipAr: 'اختيار مرشحات الخريطة' }
            },
            {
              title: 'التجميع الذكي للمؤشرات',
              text: 'تتجمع المؤشرات تلقائياً عند تصغير الخريطة للحفاظ على وضوحها. اضغط على أي تجميع (cluster) للتكبير المباشر للبلدة أو المنطقة المعنية.',
              highlight: { top: '35%', left: '40%', width: '20%', height: '20%', tooltipFr: 'Groupement dynamique de marqueurs', tooltipAr: 'التجميع الديناميكي للمؤشرات' }
            },
            {
              title: 'اللوحة الجانبية للتفاصيل',
              text: 'اضغط على أيقونة أي مرفق لفتح اللوحة الجانبية التفاعلية واستعراض معلوماته، والأنشطة المبرمجة لديه، وآخر أخباره، والتقييمات المكتوبة من طرف المواطنين.',
              highlight: { top: '12.4%', left: '72.2%', width: '27.8%', height: '87.6%', tooltipFr: 'Fiche détaillée de l\'établissement', tooltipAr: 'بطاقة معلومات المرفق' }
            }
          ],
          alerts: [
            {
              type: 'warning',
              text: 'لدواعي السرية وحماية المعطيات الشخصية، فإن المواقع الدقيقة للشكايات لا تظهر بشكل علني على الخريطة العامة.'
            }
          ]
        },
        {
          id: 'etablissements',
          title: 'دليل المرافق العمومية',
          subtitle: 'البحث وتقييم الخدمات الإدارية والعمومية',
          image: '/images/guide/etablissements.png',
          intro: 'يسرد الدليل بشكل شامل جميع البنيات التحتية والمؤسسات العمومية بمديونة، ويسهل متابعة جودة الخدمات المقدمة للمواطنين.',
          steps: [
            {
              title: 'البحث والتصفية',
              text: 'ابحث بالاسم أو حدد نوع المرفق (مستشفى، ثانوية، إدارة، ملعب رياضي) وقم بالتصفية حسب الجماعة الترابية التابع لها.',
              highlight: { top: '24.8%', left: '72%', width: '19.3%', height: '2%', tooltipFr: 'Recherche par nom ou filtre', tooltipAr: 'البحث بالاسم أو التصفية' }
            },
            {
              title: 'بطاقة معلومات المرفق',
              text: 'اطلع على أوقات العمل، والعنوان الدقيق، وأرقام الهاتف للتواصل, بالإضافة إلى أسماء المسؤولين.',
              highlight: { top: '25.8%', left: '7.2%', width: '61.1%', height: '68%', tooltipFr: 'Informations de contact et horaires', tooltipAr: 'معلومات الاتصال وأوقات العمل' }
            },
            {
              title: 'الاشتراك في التنبيهات',
              text: 'اشترك in المرفق لتلقي إشعارات فورية عبر البريد الإلكتروني والمنصة عند نشر أي نشاط جديد أو إعلان يخصه.',
              highlight: { top: '27%', left: '55%', width: '12%', height: '3%', tooltipFr: 'S\'abonner aux alertes', tooltipAr: 'الاشتراك في التنبيهات' }
            }
          ],
          alerts: [
            {
              type: 'info',
              text: 'يمكن للمواطنين تقييم المرافق بمنحها تنقيطاً من 1 إلى 5 نجوم مع تعليق. يحق للمواطن تعديل تقييمه خلال 7 أيام من تاريخ النشر فقط.'
            }
          ]
        },
        {
          id: 'evenements',
          title: 'الأنشطة والفعاليات',
          subtitle: 'المشاركة في أنشطة الإقليم',
          image: '/images/guide/evenements.png',
          intro: 'اكتشف الأنشطة، القوافل والمبادرات المواطنة المبرمجة في إقليم مديونة.',
          steps: [
            {
              title: 'أجندة الإقليم',
              text: 'تصفح قائمة الأنشطة المبرمجة. تشير البطاقات بوضوح إلى حالة النشاط (مستقبلي، جارٍ حالياً، أو منتهٍ).',
              highlight: { top: '44.6%', left: '7.2%', width: '61.1%', height: '34.3%', tooltipFr: 'Consulter l\'agenda', tooltipAr: 'تصفح الأجندة الإقليمية' }
            },
            {
              title: 'البحث والتصفية',
              text: 'ابحث بكلمات مفتاحية أو صفّ حسب الجماعة الترابية والحالة لتحديد نشاط معين.',
              highlight: { top: '37%', left: '70.5%', width: '22.2%', height: '60.5%', tooltipFr: 'Filtres de recherche', tooltipAr: 'مرشحات البحث' }
            }
          ],
          alerts: [
            {
              type: 'success',
              text: 'نشاط "جارٍ حالياً" يعني أن الفعالية تقام الآن على أرض الواقع. يمكنك متابعة مجرياتها أو الحضور للمكان.'
            }
          ]
        },
        {
          id: 'campagnes',
          title: 'الحملات المواطنة',
          subtitle: 'متابعة حملات التوعية والتحسيس',
          image: '/images/guide/campagnes.png',
          intro: 'اكتشف الحملات التوعوية الموضوعاتية المنظمة بالإقليم (البيئة، الصحة، التربية المواطنة).',
          steps: [
            {
              title: 'قائمة الحملات',
              text: 'تصفح مختلف المبادرات الإقليمية الجارية أو المبرمجة لفائدة الساكنة.',
              highlight: { top: '54.4%', left: '7.2%', width: '61.1%', height: '37%', tooltipFr: 'Campagnes citoyennes', tooltipAr: 'الحملات المواطنة' }
            },
            {
              title: 'البحث والتصفية',
              text: 'صفّ الحملات حسب المجال أو الحالة للعثور بسرعة على مبادرة معينة.',
              highlight: { top: '45.2%', left: '70.5%', width: '22.2%', height: '46.1%', tooltipFr: 'Filtres de recherche', tooltipAr: 'تصفية البحث' }
            }
          ]
        },
        {
          id: 'actualites',
          title: 'الأخبار الإقليمية',
          subtitle: 'متابعة آخر مستجدات الإقليم',
          image: '/images/guide/actualites.png',
          intro: 'ابق على اطلاع بآخر البلاغات، المشاريع والقرارات الرسمية لإقليم مديونة.',
          steps: [
            {
              title: 'شريط الأخبار',
              text: 'طالع المقالات والإعلانات الرسمية المنشورة من طرف الإقليم والجماعات الترابية.',
              highlight: { top: '38%', left: '7.2%', width: '63.3%', height: '52.5%', tooltipFr: 'Articles et annonces', tooltipAr: 'المقالات والإعلانات' }
            },
            {
              title: 'مرشحات البحث والتصفية',
              text: 'صفّ الأخبار حسب الجماعة أو القطاع للوصول إلى المعلومات التي تهمك مباشرة.',
              highlight: { top: '32%', left: '72.7%', width: '20%', height: '66%', tooltipFr: 'Recherche et filtres', tooltipAr: 'البحث والتصفية' }
            }
          ]
        },
        {
          id: 'statistiques',
          title: 'الإحصائيات العامة',
          subtitle: 'الاطلاع على مؤشرات الأداء والتقارير',
          image: '/images/guide/statistiques.png',
          intro: 'ولوج شفاف إلى الأرقام الرئيسية للحصيلة الإقليمية ونسب معالجة شكايات المواطنين.',
          steps: [
            {
              title: 'الأرقام الرئيسية للأداء',
              text: 'طالع الإحصائيات العامة لنشاط الإقليم، مثل الحجم الإجمالي للبلاغات ومعدلات الاستجابة.',
              highlight: { top: '27.5%', left: '7.2%', width: '85.5%', height: '7.2%', tooltipFr: 'Statistiques globales', tooltipAr: 'الإحصائيات العامة' }
            },
            {
              title: 'الالرسوم البيانية القطاعية',
              text: 'حلل توزيع الطلبات حسب القطاع الخدماتي وحسب الجماعة الترابية عبر مبيانات تفاعلية.',
              highlight: { top: '39.3%', left: '7.2%', width: '85.5%', height: '60.7%', tooltipFr: 'Graphiques interactifs', tooltipAr: 'الرسوم البيانية التفاعلية' }
            }
          ]
        },
        {
          id: 'suggestions',
          title: 'المقترحات المواطنة',
          subtitle: 'الاطلاع على أفكار التحسين المقدمة من طرف المجتمع',
          image: '/images/guide/participation.png',
          intro: 'توفر البوابة فضاءً للتعبير والمشاركة المواطنة من أجل تحسين جودة الحياة والخدمات بالإقليم.',
          steps: [
            {
              title: 'صندوق المقترحات',
              text: 'طالع الأفكار والمقترحات التي يقدمها المواطنون لتحسين جودة الحياة بالإقليم، وتصفح الأفكار حسب كل فئة.',
              highlight: { top: '28.4%', left: '7.8%', width: '84.4%', height: '8%', tooltipFr: 'Suggestions des citoyens', tooltipAr: 'مقترحات وأفكار المواطنين' }
            }
          ],
          alerts: [
            {
              type: 'info',
              text: 'رغم إمكانية قراءة المقترحات لجميع الزوار، فإن تقديم مقترح جديد يتطلب تسجيل الدخول بحساب مواطن.'
            }
          ]
        }
      ]
    },
    {
      id: 'citoyen',
      title: 'المواطن (مقيم)',
      description: 'اكتشف كيفية تقديم الشكايات، ومتابعة معالجتها، وتقديم مقترحات لتحسين جماعتك الترابية.',
      sections: [
        {
          id: 'compte',
          title: 'التسجيل والملف الشخصي',
          subtitle: 'إنشاء حسابك وإعداد التنبيهات الخاصة بك',
          image: '/images/guide/home.png',
          intro: 'من خلال إنشاء حساب مواطن في بوابة مديونة، تصبح فاعلاً نشطاً في تنمية جماعتك الترابية وتستفيد من مساحة شخصية مخصصة.',
          steps: [
            {
              title: 'إنشاء الحساب',
              text: 'اضغط على زر "تسجيل الدخول" ثم "إنشاء حساب". أدخل اسمك، بريدك الإلكتروني، ورقم هاتفك، واختر جماعتك الترابية داخل إقليم مديونة.',
              highlight: { top: '20%', left: '30%', width: '40%', height: '60%', tooltipFr: 'Formulaire de création de compte', tooltipAr: 'استمارة التسجيل وإنشاء الحساب' }
            },
            {
              title: 'تخصيص ملف التعريف',
              text: 'اختر قطاعات اهتمامك (الصحة، التعليم، البيئة، النقل) لتلقي التنبيهات والأنشطة المتعلقة بهذه الفئات في المقام الأول.',
              highlight: { top: '35%', left: '30%', width: '40%', height: '30%', tooltipFr: 'Abonnement aux secteurs d\'intérêt', tooltipAr: 'تحديد مجالات الاهتمام المفضل' }
            },
            {
              title: 'نظام النقاط والمواطنة النشطة',
              text: 'كل عمل مواطن بناء (شكاية معتمدة، مقترح منشور، مشاركة في الأنشطة) يمنحك نقاط مواطنة تظهر على صفحتك الشخصية.',
              highlight: { top: '5%', left: '75%', width: '20%', height: '10%', tooltipFr: 'Points de citoyenneté active', tooltipAr: 'مؤشر نقاط المواطنة النشطة' }
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
          id: 'signalement',
          title: 'تقديم الشكايات',
          subtitle: 'الإبلاغ عن حادث أو خلل في الفضاء العام',
          image: '/images/guide/reclamation.png',
          intro: 'مصباح إنارة معطل، تراكم للنفايات، أو طريق متضرر ؟ أبلغ عن الحادث في أقل من دقيقتين لتتدخل السلطات المعنية بسرعة.',
          steps: [
            {
              title: 'بدء التبليغ',
              text: 'اضغط على زر "تقديم شكاية" من الصفحة الرئيسية أو من لوحة التحكم الخاصة بك.',
              highlight: { top: '2%', left: '78%', width: '18%', height: '6%', tooltipFr: 'Bouton de signalement', tooltipAr: 'زر إضافة شكاية جديدة' }
            },
            {
              title: 'تحديد الموقع الجغرافي',
              text: 'استخدم الخريطة التفاعلية لوضع علامة بدقة على مكان الحادث. سيقوم النظام تلقائياً بالتعرف على الجماعة المعنية.',
              highlight: { top: '65%', left: '15%', width: '70%', height: '22%', tooltipFr: 'Placer l\'incident sur la carte', tooltipAr: 'تحديد موقع الحادث بدقة' }
            },
            {
              title: 'التفاصيل والصور',
              text: 'اكتب وصفاً موجزاً للمشكلة وأرفق صورة أو أكثر من الواقع. تساعد الصور الفرق التقنية على التدخل السريع.',
              highlight: { top: '15%', left: '15%', width: '70%', height: '35%', tooltipFr: 'Titre, description et photo preuve', tooltipAr: 'عنوان، وصف وإرفاق صورة الحادث' }
            },
            {
              title: 'تحديد القطاع والإرسال',
              text: 'حدد القطاع المعني بالحادث وأرسل الشكاية. سيتم إرسالها على الفور إلى مصالح جماعتك الترابية.',
              highlight: { top: '52%', left: '15%', width: '70%', height: '10%', tooltipFr: 'Sélection du secteur', tooltipAr: 'اختيار تصنيف وقطاع الشكاية' }
            }
          ],
          alerts: [
            {
              type: 'warning',
              text: 'يرجى الحرص على ألا تظهر الصور وجوه الأشخاص أو لوحات ترخيص السيارات احتراماً للخصوصية وحماية للمعطيات الشخصية.'
            }
          ]
        },
        {
          id: 'suivi_reclamation',
          title: 'متابعة الشكايات',
          subtitle: 'مراقبة حالة معالجة شكايتك في الوقت الفعلي',
          image: '/images/guide/reclamation.png',
          intro: 'بمجرّد إرسالها، تتبع شكايتك مسار معالجة شفاف بالكامل حتى حل المشكلة بنجاح.',
          steps: [
            {
              title: 'الحالة: مرسلة',
              text: 'تم تسجيل بلاغك بنجاح وفي انتظار التحقق والموافقة من قبل مشرفي الجماعة الترابية.',
              highlight: { top: '15%', left: '10%', width: '80%', height: '10%', tooltipFr: 'Statut initial de dépôt', tooltipAr: 'الحالة الأولية للإرسال' }
            },
            {
              title: 'الحالة: معينة / قيد المعالجة',
              text: 'وافقت السلطة المحلية على البلاغ وأحالته إلى الفريق التقني أو المندوبية الإقليمية المختصة.',
              highlight: { top: '30%', left: '10%', width: '80%', height: '20%', tooltipFr: 'Traitement ou affectation en cours', tooltipAr: 'شكاية مقبولة وقيد الإنجاز' }
            },
            {
              title: 'المراسلة المدمجة',
              text: 'يمكنك إضافة تعليقات جديدة على شكايتك لإضافة تفاصيل، وقراءة الرسائل والتوضيحات الرسمية من الموظف المسؤول.',
              highlight: { top: '55%', left: '10%', width: '80%', height: '35%', tooltipFr: 'Messagerie de suivi avec l\'agent', tooltipAr: 'تواصل مباشر بالتعليقات مع المسؤول' }
            },
            {
              title: 'الحالة: تم الحل',
              text: 'عند حل المشكلة، تنشر السلطة صورة توضح النتيجة. ستتلقى بريداً إلكترونياً تلقائياً وإشعاراً على المنصة.',
              highlight: { top: '5%', left: '80%', width: '15%', height: '6%', tooltipFr: 'Résolution confirmée par photo', tooltipAr: 'تأكيد الحل بصور ميدانية' }
            }
          ],
          alerts: [
            {
              type: 'info',
              text: 'إذا رأيت أن المشكلة لم تحل بالشكل الصحيح، يمكنك الضغط على زر "إعادة فتح الشكاية" خلال 3 أيام لتقديم اعتراض مبرر.'
            }
          ]
        },
        {
          id: 'participation_citoyenne',
          title: 'صندوق الأفكار',
          subtitle: 'تقديم اقتراحات ومشاريع محلية',
          image: '/images/guide/participation.png',
          intro: 'تتيح لك منصة بوابة مديونة التأثير بشكل إيجابي على محيطك من خلال اقتراح مشاريع ذات منفعة عامة.',
          steps: [
            {
              title: 'تقديم مقترح',
              text: 'اكتب فكرة لمشروع تهيئة أو نشاط ثقافي لجماعتك، وانشرها على المنصة.',
              highlight: { top: '15%', left: '10%', width: '80%', height: '25%', tooltipFr: 'Soumission d\'idée projet', tooltipAr: 'تقديم مقترح لمشروع محلي' }
            },
            {
              title: 'متابعة المقترحات',
              text: 'طالع المقترحات المنشورة وتتبع الردود المقدمة من طرف مديري البوابة.',
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
      id: 'autorite',
      title: 'السلطة المحلية',
      description: 'اكتشف كيفية تدبير شكايات المواطنين، وتحديث حالتها، ونشر البلاغات الخاصة بجماعتك الترابية.',
      sections: [
        {
          id: 'traitement_signalement',
          title: 'معالجة وتدبير الشكايات',
          subtitle: 'دراسة الشكايات الواردة وحل المشكلات',
          image: '/images/guide/reclamation.png',
          intro: 'بصفتك ممثلاً للسلطة المحلية (جماعة ترابية أو سلطة ملحقة)، فإنك تمثل الحلقة الأساسية في حل الحوادث المبلغ عنها من قبل المواطنين.',
          steps: [
            {
              title: 'الاستلام والتحقق',
              text: 'تصفح قائمة الشكايات الواردة إلى جماعتك. تحقق من الوصف، الموقع والصورة للتأكد من جدية البlaغ ووقوعه ضمن ترابك الجغرافي.',
              highlight: { top: '10%', left: '5%', width: '90%', height: '20%', tooltipFr: 'File de validation communale', tooltipAr: 'دراسة الشكايات الواردة للجماعة' }
            },
            {
              title: 'تغيير الحالة',
              text: 'قم بتغيير الحالة إلى "قيد المعالجة" لإعلام المواطن بأن طلبه قيد الاهتمام وتمت جدولة التدخل التقني.',
              highlight: { top: '35%', left: '10%', width: '80%', height: '15%', tooltipFr: 'Mise en traitement de l\'incident', tooltipAr: 'تحديث حالة الشكاية قيد المعالجة' }
            },
            {
              title: 'الإحالة للقطاع المختص',
              text: 'إذا كانت المشكلة تقع ضمن مسؤولية مندوبية معينة (مثل ليدك للماء والكهرباء، أو وزارة التعليم)، يمكنك إحالة الملف بنقرة واحدة.',
              highlight: { top: '55%', left: '10%', width: '80%', height: '15%', tooltipFr: 'Affecter à une délégation', tooltipAr: 'إحالة الشكاية للمندوبية المختصة' }
            },
            {
              title: 'إغلاق الشكاية مع الإثبات',
              text: 'بعد حل المشكلة ميدانياً، غير الحالة إلى "تم الحل" وقم بإرفاق صورة تثبت إنجاز الأشغال، واكتب تفاصيل التدخل.',
              highlight: { top: '75%', left: '10%', width: '80%', height: '20%', tooltipFr: 'Clôturer avec photo preuve', tooltipAr: 'إغلاق الشكاية وإرفاق صورة الإثبات' }
            }
          ],
          alerts: [
            {
              type: 'warning',
              text: 'كل رفض لشكاية (مثال: خارج النطاق الترابي، بلاغ كاذب) يجب أن يكون مبرراً كتابة بشكل واضح للشفافية avec المواطن.'
            }
          ]
        },
        {
          id: 'communique_autorite',
          title: 'التنبيهات والأخبار الإدارية',
          subtitle: 'إعلام سكان جماعتك الترابية بالقرارات والمستجدات',
          image: '/images/guide/news.png',
          intro: 'انشر بلاغات رسمية وتنبيهات محلية لإبقاء السكان على علم بالمستجدات الطارئة في نطاقهم الجغرافي.',
          steps: [
            {
              title: 'إنشاء تنبيه جديد',
              text: 'من لوحة التحكم الإدارية، اضغط على "إنشاء تنبيه". اكتب العنوان والتفاصيل باللغتين العربية والفرنسية.',
              highlight: { top: '10%', left: '15%', width: '70%', height: '40%', tooltipFr: 'Rédiger l\'alerte communale', tooltipAr: 'كتابة تفاصيل التنبيه المحلي' }
            },
            {
              title: 'تحديد درجة الخطورة والمنطقة',
              text: 'اختر درجة الخطورة (معلومة، يقظة، حرج). تؤدي التنبيهات الحرجة (مثل انقطاع الماء الصالح للشرب، أشغال تعطل حركة السير) إلى إرسال إشعارات فورية للمواطنين المعنيين.',
              highlight: { top: '55%', left: '15%', width: '70%', height: '30%', tooltipFr: 'Urgence et ciblage géographique', tooltipAr: 'تحديد درجة الخطورة والنطاق المستهدف' }
            }
          ]
        }
      ]
    },
    {
      id: 'delegation',
      title: 'المندوبية القطاعية',
      description: 'اكتشف كيفية إنشاء وتدبير الأنشطة، وإطلاق حملات التوعية، ومتابعة إحصائيات القطاع الخاص بك.',
      sections: [
        {
          id: 'evenements_delegation',
          title: 'إنشاء وتدبير الأنشطة',
          subtitle: 'تخطيط المبادرات والأنشطة القطاعية بالإقليم',
          image: '/images/guide/news.png',
          intro: 'تستطيع المندوبيات الإقليمية (الصحة، التعليم، الشباب والرياضة...) تخطيط الأنشطة، القوافل الطبية، أو الحملات البيئية والتوعوية وإتاحتها للجمهور عبر البوابة.',
          steps: [
            {
              title: 'ملء نموذج الإعداد',
              text: 'ادخل إلى فضاء المندوبية، واضغط على "نشاط جديد"، ثم اتبع الخطوات التفاعلية: معلومات عامة، التاريخ والوقت، والعدد الأقصى للحضور.',
              highlight: { top: '15%', left: '15%', width: '70%', height: '50%', tooltipFr: 'Remplir les étapes de création', tooltipAr: 'ملء خطوات الاستمارة التفاعلية' }
            },
            {
              title: 'ربط النشاط بمرفق عمومي',
              text: 'اربط النشاط بمرفق عمومي تابع لقطاعك (مثال: قافلة طبية في المركز الصحي بمديونة).',
              highlight: { top: '70%', left: '15%', width: '70%', height: '15%', tooltipFr: 'Géolocaliser l\'événement', tooltipAr: 'ربط النشاط بمرفق عمومي محدد' }
            },
            {
              title: 'تدبير طلبات التسجيل',
              text: 'فَعِّل خيار التسجيل المسبق إذا كانت المقاعد محدودة. يمكنك تحميل قائمة المسجلين بصيغة Excel أو PDF.',
              highlight: { top: '45%', left: '30%', width: '40%', height: '15%', tooltipFr: 'Gérer les places et participants', tooltipAr: 'تدبير التسجيل وقائمة الحضور' }
            }
          ],
          alerts: [
            {
              type: 'info',
              text: 'تظهر الأنشطة المعتمدة تلقائياً في الأجندة الإقليمية على الصفحة الرئيسية وفي بطاقة المرفق العمومي المرتبط بالنشاط.'
            }
          ]
        }
      ]
    },
    {
      id: 'gouverneur',
      title: 'عامل الإقليم (الديوان)',
      description: 'الولوج إلى لوحة القيادة الشاملة والمراقبة، وتحليل خريطة الشكايات، ومتابعة مؤشرات أداء جماعات الإقليم.',
      sections: [
        {
          id: 'dashboard_gouverneur',
          title: 'المراقبة والإشراف الإقليمي',
          subtitle: 'متابعة مؤشرات الأداء وجودة الخدمات العمومية',
          image: '/images/guide/home.png',
          intro: 'يملك عامل الإقليم وديوانه لوحة تحكم رفيعة المستوى لمتابعة التنمية المحلية وقياس مدى كفاءة معالجة شكايات المواطنين في مختلف الجماعات الترابية.',
          steps: [
            {
              title: 'مؤشرات الأداء العامة (KPIs)',
              text: 'تابع نسب حل الشكايات الإجمالية، ومتوسط وقت الاستجابة لكل جماعة ترابية، ونسبة رضا المواطنين عن التدخلات.',
              highlight: { top: '15%', left: '5%', width: '90%', height: '20%', tooltipFr: 'Performance globale de la province', tooltipAr: 'مؤشرات الأداء ورضا المواطنين' }
            },
            {
              title: 'متابعة التأخيرات والتعثرات',
              text: 'حدد فوراً الشكايات المتأخرة التي تجاوزت الآجال القانونية للمعالجة، لإصدار تذكيرات ومتابعتها مع الجماعة المعنية.',
              highlight: { top: '40%', left: '5%', width: '90%', height: '25%', tooltipFr: 'Alertes de retards de traitement', tooltipAr: 'متابعة الشكايات المتأخرة والتعثرات' }
            },
            {
              title: 'تقارير الحصيلة الدورية',
              text: 'قم بتحميل تقارير دورية شاملة حول نشاط خدمات القرب ومؤشرات الاستجابة بإقليم مديونة.',
              highlight: { top: '75%', left: '5%', width: '90%', height: '15%', tooltipFr: 'Télécharger les rapports d\'activité', tooltipAr: 'تحميل تقارير الحصيلة الدورية' }
            }
          ]
        },
        {
          id: 'heatmaps_gouverneur',
          title: 'الخرائط الموضوعاتية والحرارية',
          subtitle: 'تحديد بؤر المشكلات واحتياجات البنيات التحتية',
          image: '/images/guide/map.png',
          intro: 'تدمج خريطة اتخاذ القرار الخاصة بالعامل طبقات متطورة لتحليل المشكلات جغرافياً وتوجيه المشاريع التنموية.',
          steps: [
            {
              title: 'تفعيل الخريطة الحرارية (Heatmap)',
              text: 'اعرض كثافة الشكايات لتحديد الأحياء أو المناطق الصناعية التي تعاني من نقص في خدمات أو بنيات تحتية معينة.',
              highlight: { top: '5%', left: '80%', width: '15%', height: '8%', tooltipFr: 'Activer le calque Heatmap', tooltipAr: 'تفعيل خريطة الشكايات الحرارية' }
            },
            {
              title: 'تراكب القطاعات والخدمات',
              text: 'قم بتصفية الخريطة حسب القطاع (الإنارة، البيئة والتطهير، الطرق) لمقارنة الشكايات مع المشاريع المقررة في الميزانية الإقليمية.',
              highlight: { top: '15%', left: '2%', width: '25%', height: '70%', tooltipFr: 'Filtrer par secteur d\'activité', tooltipAr: 'تراكب قطاعات الخدمات والشكايات' }
            }
          ],
          alerts: [
            {
              type: 'success',
              text: 'تحدث هذه الخرائط بشكل لفظي بناءً على إحداثيات GPS الموثقة في بلاغات المواطنين المعتمدة.'
            }
          ]
        }
      ]
    },
    {
      id: 'admin',
      title: 'مدير المنصة',
      description: 'اكتشف كيفية إدارة المستخدمين، وإعدادات النظام، وتدبير الخريطة التفاعلية، ومراقبة المنشورات.',
      sections: [
        {
          id: 'gestion_rbac',
          title: 'إدارة المستخدمين والصلاحيات',
          subtitle: 'التحكم في الوصول والأدوار الإدارية (RBAC)',
          image: '/images/guide/home.png',
          intro: 'يتحكم مدير المنصة في سلامة الحسابات ويوزع حقوق الوصول لمختلف الموظفين العموميين بإقليم مديونة.',
          steps: [
            {
              title: 'دعوة الموظفين الجدد',
              text: 'أرسل دعوات الانضمام للموظفين الجدد (جماعات ترابية، مندوبيات) باستخدام بريدهم الإلكتروني المهني والفرعي.',
              highlight: { top: '10%', left: '75%', width: '20%', height: '8%', tooltipFr: 'Inviter un agent public', tooltipAr: 'دعوة مستخدم أو موظف جديد' }
            },
            {
              title: 'توزيع الصلاحيات والأدوار',
              text: 'حدد بدقة دور كل موظف (مواطن، سلطة محلية، مندوبية، ديوان العامل، مدير النظام) واربط حسابه بالجماعة أو القطاع المناسب.',
              highlight: { top: '25%', left: '10%', width: '80%', height: '40%', tooltipFr: 'Formulaire d\'attribution de rôle', tooltipAr: 'نموذج تحديد الأدوار والصلاحيات' }
            },
            {
              title: 'سجلات النشاط والأمان (Logs)',
              text: 'راجع سجل العمليات في النظام لضمان نزاهة استخدام المعطيات ورصد أي عمليات مشبوهة أو دخول غير مصرح به.',
              highlight: { top: '70%', left: '10%', width: '80%', height: '20%', tooltipFr: 'Salles d\'audit de sécurité', tooltipAr: 'مراقبة سجل العمليات والأمان' }
            }
          ],
          alerts: [
            {
              type: 'warning',
              text: 'يتطلب منح دور السلطة المحلية أو المندوبية تفعيلاً مزدوجاً للبريد الإلكتروني المهني لمنع أي انتحال للصفة الرسمية.'
            }
          ]
        },
        {
          id: 'gestion_carte',
          title: 'إدارة وتحديث الخريطة',
          subtitle: 'تدبير المرافق العمومية والتقييمات',
          image: '/images/guide/map.png',
          intro: 'إعداد وتحديث البيانات الجغرافية للإقليم والمحافظة على مصداقية تفاعلات البوابة.',
          steps: [
            {
              title: 'إضافة مرفق عمومي جديد',
              text: 'أنشئ بطاقة لمرفق جديد (مستشفى، مؤسسة تعليمية، إدارة)، وحدد موقعه على الخريطة عبر إحداثيات GPS، وعين له مشرفاً.',
              highlight: { top: '10%', left: '75%', width: '20%', height: '8%', tooltipFr: 'Créer un point d\'intérêt public', tooltipAr: 'إضافة مرفق عمومي جديد' }
            },
            {
              title: 'مراقبة وتقييم التعليقات',
              text: 'راجع التقييمات والتعليقات المكتوبة من طرف المواطنين، واحذف كل محتوى مسيء، غير لائق أو مخالف لشروط استخدام البوابة.',
              highlight: { top: '25%', left: '10%', width: '80%', height: '55%', tooltipFr: 'Liste des avis à modérer', tooltipAr: 'مراقبة وتقييم التعليقات والآراء' }
            }
          ]
        }
      ]
    }
  ]
};
