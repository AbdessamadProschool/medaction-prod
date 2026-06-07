export interface GuideStep {
  title: string;
  text: string;
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
          subtitle: 'Bienvenue sur la plateforme officielle MedAction',
          image: '/images/guide/home.png',
          intro: 'La plateforme MedAction est le portail d\'information et de participation citoyenne de la Province de Médiouna. Elle permet à chaque citoyen et visiteur d\'accéder en toute transparence aux informations locales, de suivre les projets et événements publics, et de participer activement au développement de la province.',
          steps: [
            {
              title: 'Exploration sans compte',
              text: 'En tant que visiteur anonyme (consulteur), vous pouvez parcourir l\'annuaire complet des établissements publics, consulter la carte interactive, voir l\'agenda provincial, lire les actualités et consulter les suggestions citoyennes.'
            },
            {
              title: 'Transparence et Données Ouvertes',
              text: 'Accédez aux statistiques publiques et aux bilans des actions menées par les autorités locales et les délégations provinciales.'
            }
          ],
          alerts: [
            {
              type: 'info',
              text: 'Pour soumettre une réclamation, voter pour des suggestions ou publier du contenu, vous devrez vous connecter ou créer un compte citoyen gratuit.'
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
              text: 'Visualisez instantanément le nombre de réclamations soumises, le taux de résolution par les autorités et d\'autres statistiques de performance de la province.'
            },
            {
              title: 'Mises en Avant',
              text: 'Consultez rapidement les derniers événements programmés, les actualités urgentes et les établissements évalués les plus actifs.'
            },
            {
              title: 'Recherche Globale',
              text: 'Utilisez le raccourci clavier Ctrl+K ou cliquez sur l\'icône loupe dans l\'en-tête pour rechercher instantanément un établissement public, un événement ou une actualité.'
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
          subtitle: 'Explorer la Province de Médiouna en 2D et 3D',
          image: '/images/guide/map.png',
          intro: 'La carte interactive est l\'un des outils les plus puissants du portail. Basée sur Mapbox GL JS, elle géolocalise l\'ensemble des infrastructures et événements de la province.',
          steps: [
            {
              title: 'Bascule 2D / 3D',
              text: 'Cliquez sur le bouton 3D en haut à droite de la carte pour activer la vue en relief et naviguer à travers les reliefs et bâtiments de la province en maintenant le clic droit enfoncé.'
            },
            {
              title: 'Filtres de recherche',
              text: 'Affinez votre affichage grâce au panneau de contrôle : sélectionnez les communes (Médiouna, Tit Mellil, Lahraouiyine, etc.), choisissez des secteurs spécifiques (Santé, Éducation, Sport) ou filtrez selon la note des établissements.'
            },
            {
              title: 'Clustering intelligent',
              text: 'Les marqueurs se regroupent automatiquement lorsque vous zoomez en arrière pour garder une carte lisible. Cliquez sur un cluster pour zoomer directement sur la zone concernée.'
            },
            {
              title: 'Panneau latéral de détails',
              text: 'Cliquez sur l\'icône d\'un établissement pour ouvrir le panneau latéral interactif et parcourir ses informations, ses événements programmés, ses actualités et les évaluations laissées par les citoyens.'
            }
          ],
          alerts: [
            {
              type: 'warning',
              text: 'Pour des raisons de confidentialité, les localisations précises des réclamations citoyennes ne sont pas visibles pour le grand public. Seuls les décideurs (Gouverneur, Admin) disposent de ces informations sur leur carte privée.'
            }
          ]
        },
        {
          id: 'etablissements',
          title: 'Annuaire des Établissements',
          subtitle: 'Trouver et évaluer les services publics',
          image: '/images/guide/home.png',
          intro: 'L\'annuaire liste de manière exhaustive toutes les infrastructures publiques de Médiouna. Il permet de suivre la qualité des services offerts.',
          steps: [
            {
              title: 'Filtres avancés',
              text: 'Recherchez par nom ou filtrez par type d\'établissement (Hôpital, Lycée, Administration, Terrain de sport) et par commune.'
            },
            {
              title: 'Fiches détaillées',
              text: 'Consultez les horaires d\'ouverture, les adresses exactes, les numéros de contact et la liste des responsables.'
            },
            {
              title: 'Abonnement aux notifications',
              text: 'Abonnez-vous à un établissement pour recevoir des alertes par email et des notifications en temps réel dès qu\'un nouvel événement ou une actualité le concernant est publié.'
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
          title: 'Événements & Campagnes',
          subtitle: 'Participer à la vie de la communauté',
          image: '/images/guide/news.png',
          intro: 'La plateforme MedAction centralise l\'ensemble des actions sociales, sportives, éducatives et culturelles portées par les délégations provinciales.',
          steps: [
            {
              title: 'Agenda provincial',
              text: 'Consultez l\'onglet Événements pour voir la liste des activités en cours ou à venir. Les statuts indiquent clairement si l\'événement est programmé, en cours d\'action ou clôturé.'
            },
            {
              title: 'Détail et inscription',
              text: 'Chaque événement précise le nombre de places disponibles, le lieu et l\'organisateur. Vous pouvez copier le lien de l\'événement en un clic pour le partager avec vos proches.'
            },
            {
              title: 'Campagnes de Sensibilisation',
              text: 'Suivez les campagnes de santé publique, de propreté et d\'éducation citoyenne menées dans la province de Médiouna.'
            }
          ],
          alerts: [
            {
              type: 'success',
              text: 'Un événement "En Action" signifie qu\'il se déroule actuellement sur le terrain. Vous pouvez le suivre en direct ou vous rendre sur place si l\'accès est public.'
            }
          ]
        },
        {
          id: 'suggestions',
          title: 'Propositions & Talents',
          subtitle: 'Contribuer activement et découvrir nos forces',
          image: '/images/guide/participation.png',
          intro: 'Médiouna regorge de talents et d\'idées novatrices. MedAction offre un espace d\'expression et de valorisation pour la communauté.',
          steps: [
            {
              title: 'Boîte à suggestions',
              text: 'Consultez les propositions soumises par les citoyens pour améliorer la vie dans la province. Vous pouvez voir les idées les plus populaires classées par catégorie.'
            },
            {
              title: 'Mise en valeur des talents',
              text: 'Découvrez la section Talents locaux qui met en avant les réussites des jeunes et des associations de la région dans les domaines culturels, scientifiques et sportifs.'
            }
          ],
          alerts: [
            {
              type: 'info',
              text: 'Bien que vous puissiez lire les suggestions en tant que simple visiteur, la création d\'une nouvelle suggestion et le vote pour les idées existantes nécessitent d\'être connecté.'
            }
          ]
        }
      ]
    },
    {
      id: 'citoyen',
      title: 'Citoyen (Résident)',
      description: 'Découvrez comment soumettre des réclamations, suivre leur traitement, proposer des suggestions d\'amélioration et valoriser vos talents.',
      sections: [
        {
          id: 'compte',
          title: 'Inscription & Profil',
          subtitle: 'Créer votre compte et configurer vos alertes',
          image: '/images/guide/home.png',
          intro: 'En créant votre compte citoyen MedAction, vous devenez un acteur actif du développement de votre commune. Vous accédez à un espace personnel personnalisé.',
          steps: [
            {
              title: 'Création de compte',
              text: 'Cliquez sur le bouton "Connexion" puis "S\'inscrire". Saisissez votre nom, email, téléphone, et sélectionnez votre commune de résidence au sein de la province de Médiouna.'
            },
            {
              title: 'Personnalisation du profil',
              text: 'Choisissez vos secteurs d\'intérêt (Santé, Éducation, Environnement, Transport) pour recevoir en priorité les alertes et événements de ces catégories.'
            },
            {
              title: 'Système d\'activité et points',
              text: 'Chaque action citoyenne constructive (signalement validé, suggestion populaire, participation à des campagnes) vous rapporte des points de citoyenneté active visible sur votre profil.'
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
              text: 'Cliquez sur le bouton "Signaler un Incident" depuis l\'accueil ou votre tableau de bord.'
            },
            {
              title: 'Localisation précise',
              text: 'Utilisez la carte interactive pour placer un repère exactement à l\'emplacement de l\'incident. Le système détectera automatiquement la commune correspondante.'
            },
            {
              title: 'Détails et photos',
              text: 'Décrivez brièvement le problème et chargez une ou plusieurs photos réelles de l\'incident. Les photos permettent une intervention beaucoup plus rapide des équipes techniques.'
            },
            {
              title: 'Catégorisation et envoi',
              text: 'Sélectionnez le secteur concerné et soumettez la réclamation. Elle sera immédiatement envoyée aux services de votre commune.'
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
              text: 'Votre signalement a été enregistré avec succès et attend d\'être validé par les agents modérateurs de la commune.'
            },
            {
              title: 'Statut : Assigné / En cours',
              text: 'L\'autorité locale a validé le problème et l\'a attribué à une équipe technique ou une délégation sectorielle.'
            },
            {
              title: 'Messagerie intégrée',
              text: 'Vous pouvez ajouter des commentaires à votre réclamation si vous avez de nouvelles informations, et lire les messages officiels de l\'agent en charge.'
            },
            {
              title: 'Statut : Résolu',
              text: 'Une fois le problème réglé, l\'autorité publie une photo de preuve. Vous recevez un email automatique et une notification sur la plateforme.'
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
          title: 'Boîte à Idées & Talents',
          subtitle: 'Proposer des projets et valoriser vos compétences',
          image: '/images/guide/participation.png',
          intro: 'MedAction vous permet d\'influencer positivement l\'avenir de votre quartier en proposant des projets d\'intérêt général.',
          steps: [
            {
              title: 'Proposer une suggestion',
              text: 'Rédigez une proposition d\'aménagement ou de projet culturel pour votre commune et soumettez-la aux votes de la communauté.'
            },
            {
              title: 'Voter et débattre',
              text: 'Soutenez les idées de vos concitoyens en votant pour elles et participez aux discussions dans la section commentaires.'
            },
            {
              title: 'Inscription des Talents',
              text: 'Vous êtes artiste, athlète, scientifique, ou portez un projet associatif à Médiouna ? Inscrivez-vous dans la section Talents pour être mis en avant sur le portail.'
            }
          ],
          alerts: [
            {
              type: 'success',
              text: 'Les suggestions qui dépassent un seuil de 100 votes citoyens sont automatiquement inscrites à l\'ordre du jour de la commission provinciale d\'évaluation.'
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
              text: 'Consultez la file d\'attente de votre commune. Analysez le signalement, la localisation et la photo pour vérifier s\'il s\'agit d\'un incident réel situé sur votre territoire.'
            },
            {
              title: 'Changement de statut',
              text: 'Passez le statut à "En cours de traitement" pour informer le citoyen que sa demande a été prise en compte et qu\'une intervention est planifiée.'
            },
            {
              title: 'Assignation sectorielle',
              text: 'Si le problème relève d\'une délégation spécifique (ex: coupure d\'eau pour la Lydec/ONEE, entretien d\'un lycée pour l\'Éducation), transférez le dossier à la délégation concernée en un clic.'
            },
            {
              title: 'Clôture avec preuve',
              text: 'Une fois le problème résolu sur le terrain, modifiez le statut à "Résolu" et chargez obligatoirement une photo constatant la fin des travaux. Saisissez une brève description de l\'action menée.'
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
              text: 'Depuis votre panneau d\'administration, cliquez sur "Créer une alerte". Rédigez le titre et le corps de l\'annonce.'
            },
            {
              title: 'Ciblage et niveau d\'urgence',
              text: 'Sélectionnez le niveau d\'urgence (Info, Vigilance, Critique) et la zone ciblée. Les alertes critiques (coupure d\'eau majeure, travaux bloquant une route principale) déclenchent des notifications instantanées.'
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
              text: 'Accédez à votre espace, cliquez sur "Nouvel Événement" et suivez les étapes du stepper interactif : Informations générales, Date et lieu, jauge de participants.'
            },
            {
              title: 'Localisation de l\'activité',
              text: 'Associez l\'événement à un établissement public de votre secteur (ex: caravane de don du sang dans un hôpital de Tit Mellil).'
            },
            {
              title: 'Gestion des inscriptions',
              text: 'Activez la jauge d\'inscription si les places sont limitées. Vous pourrez exporter la liste des participants au format Excel ou PDF.'
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
              text: 'Consultez les taux de résolution globaux, le temps moyen de traitement par commune, et le taux de satisfaction des citoyens.'
            },
            {
              title: 'Suivi des retards',
              text: 'Identifiez immédiatement les réclamations en souffrance qui dépassent les délais réglementaires de traitement. Vous pouvez envoyer un signal de rappel automatique à l\'autorité communale en charge.'
            },
            {
              title: 'Bilan d\'activité trimestriel',
              text: 'Générez des rapports synthétiques sur l\'activité globale de la province de Médiouna en vue des comités de direction.'
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
              text: 'Affichez la concentration des réclamations citoyennes pour identifier visuellement les quartiers ou zones industrielles nécessitant des investissements d\'infrastructure.'
            },
            {
              title: 'Superposition des secteurs',
              text: 'Filtrez par secteur d\'activité (ex: Éclairage public, Eau et électricité, Déchets) pour superposer les couches de réclamations sur la carte des projets en cours.'
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
              text: 'Invitez de nouveaux membres du personnel (agents communaux, délégués sectoriels) en renseignant leur adresse email professionnelle.'
            },
            {
              title: 'Attribution des rôles',
              text: 'Attribuez le rôle adéquat avec précision (Citoyen, Autorité Locale, Délégation, Gouverneur, Administrateur) et associez l\'agent à une commune ou une délégation sectorielle.'
            },
            {
              title: 'Audit des logs de connexion',
              text: 'Surveillez les activités système pour identifier les anomalies de sécurité ou les tentatives d\'accès non autorisées.'
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
              text: 'Créez un nouvel établissement (école, hôpital, commissariat), placez-le sur la carte par coordonnées GPS, et affectez-lui un gestionnaire.'
            },
            {
              title: 'Modération des avis',
              text: 'Consultez les évaluations et commentaires laissés par les citoyens. Supprimez tout contenu injurieux, diffamatoire ou contraire aux CGU de la plateforme.'
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
          subtitle: 'مرحباً بكم في منصة مديونة أكشن الرسمية',
          image: '/images/guide/home.png',
          intro: 'منصة مديونة أكشن هي البوابة الرسمية للإعلام والمشاركة المواطنة لإقليم مديونة. تتيح لكل مواطن وزائر الوصول بكل شفافية إلى المعلومات المحلية، ومتابعة المشاريع والأنشطة العمومية، والمساهمة الفعالة في تنمية الإقليم.',
          steps: [
            {
              title: 'تصفح بدون حساب',
              text: 'بصفتك زائراً غير مسجل، يمكنك تصفح الدليل الكامل للمرافق العمومية، والاطلاع على الخريطة التفاعلية، ومعرفة أجندة الإقليم، وقراءة الأخبار، والاطلاع على مقترحات المواطنين.'
            },
            {
              title: 'الشفافية والبيانات المفتوحة',
              text: 'الوصول إلى الإحصائيات العامة وتقارير الحصيلة للأنشطة والتدخلات التي تقوم بها السلطات المحلية والمندوبيات الإقليمية.'
            }
          ],
          alerts: [
            {
              type: 'info',
              text: 'لتقديم شكاية، أو التصويت على المقترحات، أو نشر محتوى، ستحتاج إلى تسجيل الدخول أو إنشاء حساب مواطن مجاني.'
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
              text: 'اطلع فوراً على عدد الشكايات المقدمة، ومعدل معالجتها من قبل السلطات، وغيرها من مؤشرات أداء الخدمات بالإقليم.'
            },
            {
              title: 'المحتوى البارز',
              text: 'تصفح سريعاً أحدث الأنشطة المبرمجة، والأخبار العاجلة، والمرافق الأكثر تفاعلاً وتقييماً من قبل المواطنين.'
            },
            {
              title: 'البحث الشامل',
              text: 'استخدم اختصار لوحة المفاتيح Ctrl+K أو اضغط على أيقونة البحث في الأعلى للبحث الفوري عن مرفق عمومي، أو نشاط، أو خبر.'
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
          subtitle: 'استكشاف إقليم مديونة بأبعاد ثنائية وثلاثية',
          image: '/images/guide/map.png',
          intro: 'تعد الخريطة التفاعلية أحد أقوى أدوات البوابة. تعتمد على تكنولوجيا Mapbox GL JS، وتحدد المواقع الجغرافية لكافة البنيات التحتية والأنشطة بالإقليم.',
          steps: [
            {
              title: 'التبديل بين 2D و 3D',
              text: 'اضغط على زر 3D في أعلى يمين الخريطة لتفعيل العرض ثلاثي الأبعاد والتنقل عبر التضاريس والمباني بالإقليم من خلال الاستمرار بالضغط على زر الفأرة الأيمن.'
            },
            {
              title: 'مرشحات البحث',
              text: 'خصص عرض الخريطة عبر لوحة التحكم: اختر الجماعات (مديونة، تيط مليل، الهراويين، إلخ)، وحدد قطاعات معينة (الصحة، التعليم، الرياضة) أو صفّ حسب تقييمات المرافق.'
            },
            {
              title: 'التجميع الذكي للمؤشرات',
              text: 'تتجمع المؤشرات تلقائياً عند تصغير الخريطة للحفاظ على وضوحها. اضغط على أي تجميع (cluster) للتكبير المباشر للبلدة أو المنطقة المعنية.'
            },
            {
              title: 'اللوحة الجانبية للتفاصيل',
              text: 'اضغط على أيقونة أي مرفق لفتح اللوحة الجانبية التفاعلية واستعراض معلوماته، والأنشطة المبرمجة لديه، وآخر أخباره، والتقييمات المكتوبة من طرف المواطنين.'
            }
          ],
          alerts: [
            {
              type: 'warning',
              text: 'لدواعي السرية والأمان، فإن المواقع الدقيقة لشكايات المواطنين غير مرئية للعموم. فقط متخذو القرار (العامل، المسؤول عن الإدارة) يملكون حق الاطلاع على هذه البيانات في خريطتهم الخاصة.'
            }
          ]
        },
        {
          id: 'etablissements',
          title: 'دليل المرافق العمومية',
          subtitle: 'البحث وتقييم الخدمات الإدارية والعمومية',
          image: '/images/guide/home.png',
          intro: 'يسرد الدليل بشكل شامل جميع البنيات التحتية والمؤسسات العمومية بمديونة، ويسهل متابعة جودة الخدمات المقدمة للمواطنين.',
          steps: [
            {
              title: 'البحث والتصفية',
              text: 'ابحث بالاسم أو حدد نوع المرفق (مستشفى، ثانوية، إدارة، ملعب رياضي) وقم بالتصفية حسب الجماعة الترابية التابع لها.'
            },
            {
              title: 'بطاقة معلومات المرفق',
              text: 'اطلع على أوقات العمل، والعنوان الدقيق، وأرقام الهاتف للتواصل، بالإضافة إلى أسماء المسؤولين.'
            },
            {
              title: 'الاشتراك في التنبيهات',
              text: 'اشترك في المرفق لتلقي إشعارات فورية عبر البريد الإلكتروني والمنصة عند نشر أي نشاط جديد أو إعلان يخصه.'
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
          title: 'الأنشطة والحملات',
          subtitle: 'المشاركة الفعالة في حياة المجتمع',
          image: '/images/guide/news.png',
          intro: 'تجمع منصة مديونة أكشن كافة الأنشطة والمبادرات الاجتماعية، الرياضية، التعليمية والثقافية التي تشرف عليها المندوبيات الإقليمية.',
          steps: [
            {
              title: 'أجندة الإقليم',
              text: 'تصفح قائمة الأنشطة المبرمجة. تشير البطاقات بوضوح إلى حالة النشاط (مستقبلي، جارٍ حالياً، أو منتهٍ).'
            },
            {
              title: 'التفاصيل والتسجيل',
              text: 'يوضح كل نشاط عدد المقاعد المتاحة، المكان الدقيق، والجهة المنظمة. يمكنك نسخ الرابط لمشاركته مع عائلتك بنقرة واحدة.'
            },
            {
              title: 'حملات التوعية',
              text: 'تابع حملات الصحة العامة، النظافة والتربية البيئية المنظمة على مستوى تراب إقليم مديونة.'
            }
          ],
          alerts: [
            {
              type: 'success',
              text: 'نشاط "جارٍ حالياً" يعني أن الفعالية تقام الآن على أرض الواقع. يمكنك متابعة مجرياتها أو الحضور للمكان إذا كانت المبادرة مفتوحة للعموم.'
            }
          ]
        },
        {
          id: 'suggestions',
          title: 'المقترحات والمواهب',
          subtitle: 'تقديم الأفكار والتعرف على كفاءات الإقليم',
          image: '/images/guide/participation.png',
          intro: 'يزخر إقليم مديونة بالطاقات الشابة والأفكار الخلاقة. وتوفر المنصة فضاءً للتعبير والتقدير والتميز.',
          steps: [
            {
              title: 'صندوق المقترحات',
              text: 'طالع الأفكار والمقترحات التي يقدمها المواطنون لتحسين جودة الحياة بالإقليم، وتصفح الأفكار الأكثر شعبية وتصويتاً حسب كل فئة.'
            },
            {
              title: 'إبراز الكفاءات والمواهب',
              text: 'اكتشف فضاء المواهب المحلية الذي يسلط الضوء على نجاحات الشباب والجمعيات النشيطة في العلوم، الثقافة، الفنون، والرياضة.'
            }
          ],
          alerts: [
            {
              type: 'info',
              text: 'رغم إمكانية قراءة المقترحات لجميع الزوار، فإن تقديم مقترح جديد أو التصويت لصالح المقترحات الحالية يتطلب تسجيل الدخول بحساب مواطن.'
            }
          ]
        }
      ]
    },
    {
      id: 'citoyen',
      title: 'المواطن (مقيم)',
      description: 'اكتشف كيفية تقديم الشكايات، ومتابعة معالجتها، وتقديم مقترحات للتحسين، وإبراز مواهبك المحلية.',
      sections: [
        {
          id: 'compte',
          title: 'التسجيل والملف الشخصي',
          subtitle: 'إنشاء حسابك وإعداد التنبيهات الخاصة بك',
          image: '/images/guide/home.png',
          intro: 'من خلال إنشاء حساب مواطن في مديونة أكشن، تصبح فاعلاً نشطاً في تنمية جماعتك الترابية وتستفيد من مساحة شخصية مخصصة.',
          steps: [
            {
              title: 'إنشاء الحساب',
              text: 'اضغط على زر "تسجيل الدخول" ثم "إنشاء حساب". أدخل اسمك، بريدك الإلكتروني، ورقم هاتفك، واختر جماعتك الترابية داخل إقليم مديونة.'
            },
            {
              title: 'تخصيص ملف التعريف',
              text: 'اختر قطاعات اهتمامك (الصحة، التعليم، البيئة، النقل) لتلقي التنبيهات والأنشطة المتعلقة بهذه الفئات في المقام الأول.'
            },
            {
              title: 'نظام النقاط والمواطنة النشطة',
              text: 'كل عمل مواطن بناء (شكاية معتمدة، مقترح شائع، مشاركة في الأنشطة) يمنحك نقاط مواطنة تظهر على صفحتك الشخصية.'
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
              text: 'اضغط على زر "تقديم شكاية" من الصفحة الرئيسية أو من لوحة التحكم الخاصة بك.'
            },
            {
              title: 'تحديد الموقع الجغرافي',
              text: 'استخدم الخريطة التفاعلية لوضع علامة بدقة على مكان الحادث. سيقوم النظام تلقائياً بالتعرف على الجماعة المعنية.'
            },
            {
              title: 'التفاصيل والصور',
              text: 'اكتب وصفاً موجزاً للمشكلة وأرفق صورة أو أكثر من الواقع. تساعد الصور الفرق التقنية على التدخل السريع.'
            },
            {
              title: 'تحديد القطاع والإرسال',
              text: 'حدد القطاع المعني بالحادث وأرسل الشكاية. سيتم إرسالها على الفور إلى مصالح جماعتك الترابية.'
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
              text: 'تم تسجيل بلاغك بنجاح وفي انتظار التحقق والموافقة من قبل مشرفي الجماعة الترابية.'
            },
            {
              title: 'الحالة: معينة / قيد المعالجة',
              text: 'وافقت السلطة المحلية على البلاغ وأحالته إلى الفريق التقني أو المندوبية الإقليمية المختصة.'
            },
            {
              title: 'المراسلة المدمجة',
              text: 'يمكنك إضافة تعليقات جديدة على شكايتك لإضافة تفاصيل، وقراءة الرسائل والتوضيحات الرسمية من الموظف المسؤول.'
            },
            {
              title: 'الحالة: تم الحل',
              text: 'عند حل المشكلة، تنشر السلطة صورة توضح النتيجة. ستتلقى بريداً إلكترونياً تلقائياً وإشعاراً على المنصة.'
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
          title: 'صندوق الأفكار والمواهب',
          subtitle: 'اقتراح مشاريع محلية وإبراز مهاراتك',
          image: '/images/guide/participation.png',
          intro: 'تتيح لك منصة مديونة أكشن التأثير بشكل إيجابي على محيطك من خلال اقتراح مشاريع ذات منفعة عامة.',
          steps: [
            {
              title: 'تقديم مقترح',
              text: 'اكتب فكرة لمشروع تهيئة أو نشاط ثقافي لجماعتك، واعرضها لتصويت بقية المواطنين.'
            },
            {
              title: 'التصويت والنقاش',
              text: 'ادعم أفكار جيرانك ومواطني إقليمك بالتصويت لصالحها والمشاركة في النقاشات عبر التعليقات.'
            },
            {
              title: 'تسجيل المواهب والكفاءات',
              text: 'هل أنت فنان، رياضي، مخترع، أو تدير مشروعاً جمعوياً في مديونة ؟ سجل معلوماتك في فضاء المواهب ليتم إبرازك في البوابة.'
            }
          ],
          alerts: [
            {
              type: 'success',
              text: 'المقترحات التي تتجاوز عتبة 100 تصويت من المواطنين تدرج تلقائياً في جدول أعمال لجنة التقييم الإقليمية.'
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
              text: 'تصفح قائمة الشكايات الواردة إلى جماعتك. تحقق من الوصف، الموقع والصورة للتأكد من جدية البلاغ ووقوعه ضمن ترابك الجغرافي.'
            },
            {
              title: 'تغيير الحالة',
              text: 'قم بتغيير الحالة إلى "قيد المعالجة" لإعلام المواطن بأن طلبه قيد الاهتمام وتمت جدولة التدخل التقني.'
            },
            {
              title: 'الإحالة للقطاع المختص',
              text: 'إذا كانت المشكلة تقع ضمن مسؤولية مندوبية معينة (مثل ليدك للماء والكهرباء، أو وزارة التعليم)، يمكنك إحالة الملف بنقرة واحدة.'
            },
            {
              title: 'إغلاق الشكاية مع الإثبات',
              text: 'بعد حل المشكلة ميدانياً، غير الحالة إلى "تم الحل" وقم بإرفاق صورة تثبت إنجاز الأشغال، واكتب تفاصيل التدخل.'
            }
          ],
          alerts: [
            {
              type: 'warning',
              text: 'كل رفض لشكاية (مثال: خارج النطاق الترابي، بلاغ كاذب) يجب أن يكون مبرراً كتابة بشكل واضح للشفافية مع المواطن.'
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
              text: 'من لوحة التحكم الإدارية، اضغط على "إنشاء تنبيه". اكتب العنوان والتفاصيل باللغتين العربية والفرنسية.'
            },
            {
              title: 'تحديد درجة الخطورة والمنطقة',
              text: 'اختر درجة الخطورة (معلومة، يقظة، حرج). تؤدي التنبيهات الحرجة (مثل انقطاع الماء الصالح للشرب، أشغال تعطل حركة السير) إلى إرسال إشعارات فورية للمواطنين المعنيين.'
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
              text: 'ادخل إلى فضاء المندوبية، واضغط على "نشاط جديد"، ثم اتبع الخطوات التفاعلية: معلومات عامة، التاريخ والوقت، والعدد الأقصى للحضور.'
            },
            {
              title: 'ربط النشاط بمرفق عمومي',
              text: 'اربط النشاط بمرفق عمومي تابع لقطاعك (مثال: قافلة طبية في المركز الصحي بمديونة).'
            },
            {
              title: 'تدبير طلبات التسجيل',
              text: 'فَعِّل خيار التسجيل المسبق إذا كانت المقاعد محدودة. يمكنك تحميل قائمة المسجلين بصيغة Excel أو PDF.'
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
              text: 'تابع نسب حل الشكايات الإجمالية، ومتوسط وقت الاستجابة لكل جماعة ترابية، ونسبة رضا المواطنين عن التدخلات.'
            },
            {
              title: 'متابعة التأخيرات والتعثرات',
              text: 'حدد فوراً الشكايات المتأخرة التي تجاوزت الآجال القانونية للمعالجة، لإصدار تذكيرات ومتابعتها مع الجماعة المعنية.'
            },
            {
              title: 'تقارير الحصيلة الدورية',
              text: 'قم بتحميل تقارير دورية شاملة حول نشاط خدمات القرب ومؤشرات الاستجابة بإقليم مديونة.'
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
              text: 'اعرض كثافة الشكايات لتحديد الأحياء أو المناطق الصناعية التي تعاني من نقص في خدمات أو بنيات تحتية معينة.'
            },
            {
              title: 'تراكب القطاعات والخدمات',
              text: 'قم بتصفية الخريطة حسب القطاع (الإنارة، البيئة والتطهير، الطرق) لمقارنة الشكايات مع المشاريع المقررة في الميزانية الإقليمية.'
            }
          ],
          alerts: [
            {
              type: 'success',
              text: 'تحدث هذه الخرائط بشكل لحظي بناءً على إحداثيات GPS الموثقة في بلاغات المواطنين المعتمدة.'
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
              text: 'أرسل دعوات الانضمام للموظفين الجدد (جماعات ترابية، مندوبيات) باستخدام بريدهم الإلكتروني المهني والفرعي.'
            },
            {
              title: 'توزيع الصلاحيات والأدوار',
              text: 'حدد بدقة دور كل موظف (مواطن، سلطة محلية، مندوبية، ديوان العامل، مدير النظام) واربط حسابه بالجماعة أو القطاع المناسب.'
            },
            {
              title: 'سجلات النشاط والأمان (Logs)',
              text: 'راجع سجل العمليات في النظام لضمان نزاهة استخدام المعطيات ورصد أي عمليات مشبوهة أو دخول غير مصرح به.'
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
              text: 'أنشئ بطاقة لمرفق جديد (مستشفى، مؤسسة تعليمية، إدارة)، وحدد موقعه على الخريطة عبر إحداثيات GPS، وعين له مشرفاً.'
            },
            {
              title: 'مراقبة وتقييم التعليقات',
              text: 'راجع التقييمات والتعليقات المكتوبة من طرف المواطنين، واحذف كل محتوى مسيء، غير لائق أو مخالف لشروط استخدام البوابة.'
            }
          ]
        }
      ]
    }
  ]
};
