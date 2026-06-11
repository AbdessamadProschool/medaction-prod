export interface StepHighlight {
  top: string;
  left: string;
  width: string;
  height: string;
  tooltipFr: string;
  tooltipAr: string;
}

export interface GuideStep {
  link?: string;
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
      title: 'Visiteur (Non connecté)',
      description: 'Découvrez comment explorer la province, consulter les services publics et participer aux événements.',
      sections: [
        {
          id: 'intro_navigation',
          title: 'Accueil & Navigation Générale',
          subtitle: 'Bienvenue sur le Portail Médiouna officiel',
          image: '/images/guide/citoyen/accueil_fr.png',
          intro: 'Le portail vous offre un accès centralisé à toutes les informations de la province. Depuis l\'en-tête, vous pouvez accéder rapidement aux services essentiels.',
          steps: [
            {
              title: 'Notifications',
              text: 'Cliquez sur l\'icône en forme de cloche pour consulter vos dernières alertes et mises à jour concernant vos abonnements.',
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
          id: 'etablissements',
          title: 'Guide des Établissements',
          subtitle: 'Trouvez et interagissez avec les services publics',
          image: '/images/guide/citoyen/etablissements_liste_fr.png',
          intro: 'Explorez tous les établissements publics, écoles, centres de santé et infrastructures sportives de la province.',
          steps: [
            {
              title: 'Recherche et Filtrage',
              text: 'Utilisez les filtres par secteur (Santé, Éducation, Sport) ou tapez le nom de l\'établissement pour le trouver rapidement.',
              highlight: { top: '15%', left: '5%', width: '25%', height: '80%', tooltipFr: 'Filtres de recherche', tooltipAr: 'مرشحات البحث' }
            },
            {
              title: 'Détails de l\'Établissement',
              text: 'Sur la fiche détaillée, consultez les informations complètes, événements associés, et les avis des autres citoyens.',
              image: '/images/guide/citoyen/etablissement_details_fr.png',
              highlight: { top: '10%', left: '10%', width: '80%', height: '40%', tooltipFr: 'Fiche détaillée', tooltipAr: 'تفاصيل المرفق' }
            },
            {
              title: 'S\'abonner',
              text: 'Cliquez sur le bouton "S\'abonner" pour recevoir des notifications immédiates lors de la publication de nouvelles actualités pour cet établissement.',
              highlight: { top: '40%', left: '15%', width: '15%', height: '8%', tooltipFr: 'Bouton d\'abonnement', tooltipAr: 'زر الاشتراك' }
            }
          ]
        },
        {
          id: 'carte_interactive',
          title: 'Carte Interactive',
          subtitle: 'Visualisez les infrastructures géolocalisées',
          image: '/images/guide/citoyen/carte_interactive_fr.png',
          intro: 'La carte interactive est l\'outil idéal pour localiser tous les services publics proches de chez vous.',
          steps: [
            {
              title: 'Exploration de la Carte',
              text: 'Naviguez sur la carte pour voir la répartition des établissements. Les points sont regroupés pour une meilleure lisibilité.',
              highlight: { top: '10%', left: '25%', width: '70%', height: '85%', tooltipFr: 'Carte géolocalisée', tooltipAr: 'الخريطة التفاعلية' }
            },
            {
              title: 'Filtres Rapides',
              text: 'Utilisez les filtres latéraux pour n\'afficher que certains types d\'infrastructures (ex: Uniquement les écoles ou les centres de santé).',
              highlight: { top: '15%', left: '2%', width: '20%', height: '30%', tooltipFr: 'Filtres par catégorie', tooltipAr: 'تصفية حسب الفئة' }
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
              highlight: { top: '15%', left: '5%', width: '25%', height: '80%', tooltipFr: 'Filtres d\'événements', tooltipAr: 'تصفية الفعاليات' }
            },
            {
              title: 'Aperçu Rapide',
              text: 'Chaque carte d\'événement (Box) présente la date, le lieu, et l\'organisateur pour un survol rapide.',
              image: '/images/guide/citoyen/evenement_box_fr.png',
              highlight: { top: '25%', left: '30%', width: '40%', height: '40%', tooltipFr: 'Carte d\'événement', tooltipAr: 'بطاقة الفعالية' }
            },
            {
              title: 'Détails et Inscription',
              text: 'Accédez à la page complète de l\'événement pour lire le programme détaillé et vous y inscrire si nécessaire.',
              image: '/images/guide/citoyen/evenement_details_fr.png',
              highlight: { top: '15%', left: '10%', width: '80%', height: '50%', tooltipFr: 'Informations détaillées', tooltipAr: 'المعلومات التفصيلية' }
            }
          ]
        },
        {
          id: 'actualites_ressources',
          title: 'Actualités, Campagnes & Articles',
          subtitle: 'Toute l\'information de la province',
          image: '/images/guide/citoyen/actualites_liste_fr.png',
          intro: 'Le portail est votre source d\'information officielle pour les actualités, les grandes campagnes citoyennes et les articles de ressources.',
          steps: [
            {
              title: 'Fil d\'Actualités',
              text: 'Lisez les dernières nouvelles et annonces officielles. Le système de filtrage fonctionne de la même manière que pour les événements.',
              highlight: { top: '20%', left: '30%', width: '60%', height: '60%', tooltipFr: 'Liste des actualités', tooltipAr: 'قائمة الأخبار' }
            },
            {
              title: 'Campagnes Citoyennes',
              text: 'Découvrez les grandes campagnes de sensibilisation et d\'action menées par les autorités locales et les délégations.',
              image: '/images/guide/citoyen/campagnes_liste_fr.png',
              highlight: { top: '15%', left: '10%', width: '80%', height: '70%', tooltipFr: 'Campagnes en cours', tooltipAr: 'الحملات الحالية' }
            },
            {
              title: 'Ressources et Articles',
              text: 'Accédez à des guides pratiques, des documents téléchargeables et des articles d\'information pour faciliter vos démarches.',
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
          intro: 'La Boîte à Idées vous permet de proposer des projets innovants et d\'interagir avec les suggestions des autres citoyens.',
          steps: [
            {
              title: 'Tableau des Suggestions',
              text: 'Suivez le statut de vos idées et de celles de la communauté : "En attente", "Validée", ou "Rejetée".',
              highlight: { top: '15%', left: '15%', width: '70%', height: '30%', tooltipFr: 'Statut des idées', tooltipAr: 'حالة المقترحات' }
            },
            {
              title: 'Proposer une Idée',
              text: 'Cliquez sur "Nouvelle suggestion" pour rédiger votre proposition. Vous pouvez ajouter un titre, une description détaillée et une image d\'illustration.',
              image: '/images/guide/citoyen/idee_nouvelle_fr.png',
              highlight: { top: '20%', left: '20%', width: '60%', height: '60%', tooltipFr: 'Formulaire de proposition', tooltipAr: 'نموذج تقديم المقترح' }
            }
          ]
        }
      ]
    },
    
    {
      id: 'citoyen',
      title: 'Citoyen (Visiteur & Résident)',
      description: 'Découvrez comment explorer la province, consulter les services publics, soumettre des réclamations et participer aux événements.',
      sections: [
        {
          id: 'intro_navigation',
          title: 'Accueil & Navigation Générale',
          subtitle: 'Bienvenue sur le Portail Médiouna officiel',
          image: '/images/guide/citoyen/accueil_fr.png',
          intro: 'Le portail vous offre un accès centralisé à toutes les informations de la province. Depuis l\'en-tête, vous pouvez accéder rapidement aux services essentiels.',
          steps: [
            {
              title: 'Notifications',
              text: 'Cliquez sur l\'icône en forme de cloche pour consulter vos dernières alertes et mises à jour concernant vos abonnements.',
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
          intro: 'L\'espace profil vous permet de garder vos informations à jour et de renforcer la sécurité de votre compte citoyen.',
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
              text: 'Activez l\'Authentification à Double Facteur (2FA) pour protéger au maximum votre compte contre les accès non autorisés.',
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
              text: 'Utilisez les filtres par secteur (Santé, Éducation, Sport) ou tapez le nom de l\'établissement pour le trouver rapidement.',
              highlight: { top: '15%', left: '5%', width: '25%', height: '80%', tooltipFr: 'Filtres de recherche', tooltipAr: 'مرشحات البحث' }
            },
            {
              title: 'Détails de l\'Établissement',
              text: 'Sur la fiche détaillée, consultez les informations complètes, événements associés, et les avis des autres citoyens.',
              image: '/images/guide/citoyen/etablissement_details_fr.png',
              highlight: { top: '10%', left: '10%', width: '80%', height: '40%', tooltipFr: 'Fiche détaillée', tooltipAr: 'تفاصيل المرفق' }
            },
            {
              title: 'S\'abonner',
              text: 'Cliquez sur le bouton "S\'abonner" pour recevoir des notifications immédiates lors de la publication de nouvelles actualités pour cet établissement.',
              highlight: { top: '40%', left: '15%', width: '15%', height: '8%', tooltipFr: 'Bouton d\'abonnement', tooltipAr: 'زر الاشتراك' }
            }
          ]
        },
        {
          id: 'carte_interactive',
          title: 'Carte Interactive',
          subtitle: 'Visualisez les infrastructures géolocalisées',
          image: '/images/guide/citoyen/carte_interactive_fr.png',
          intro: 'La carte interactive est l\'outil idéal pour localiser tous les services publics proches de chez vous.',
          steps: [
            {
              title: 'Exploration de la Carte',
              text: 'Naviguez sur la carte pour voir la répartition des établissements. Les points sont regroupés pour une meilleure lisibilité.',
              highlight: { top: '10%', left: '25%', width: '70%', height: '85%', tooltipFr: 'Carte géolocalisée', tooltipAr: 'الخريطة التفاعلية' }
            },
            {
              title: 'Filtres Rapides',
              text: 'Utilisez les filtres latéraux pour n\'afficher que certains types d\'infrastructures (ex: Uniquement les écoles ou les centres de santé).',
              highlight: { top: '15%', left: '2%', width: '20%', height: '30%', tooltipFr: 'Filtres par catégorie', tooltipAr: 'تصفية حسب الفئة' }
            }
          ]
        },
        {
          id: 'demarches_reclamations',
          title: 'Soumettre une Réclamation',
          subtitle: 'Signaler un incident en 4 étapes simples',
          image: '/images/guide/citoyen/reclamation_etape1_fr.png',
          intro: 'Participez à l\'amélioration de votre commune en signalant les incidents sur la voie publique (éclairage, voirie, propreté).',
          steps: [
            {
              title: 'Étape 1: Localisation',
              text: 'Indiquez l\'emplacement exact de l\'incident sur la carte interactive pour faciliter l\'intervention.',
              highlight: { top: '15%', left: '15%', width: '70%', height: '60%', tooltipFr: 'Placer le repère', tooltipAr: 'تحديد الموقع' }
            },
            {
              title: 'Étape 2: Détails',
              text: 'Choisissez la catégorie de l\'incident et décrivez précisément le problème rencontré.',
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
              text: 'Une fois soumise, vous pourrez suivre l\'état d\'avancement de votre réclamation depuis votre tableau de bord.'
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
              highlight: { top: '15%', left: '5%', width: '25%', height: '80%', tooltipFr: 'Filtres d\'événements', tooltipAr: 'تصفية الفعاليات' }
            },
            {
              title: 'Aperçu Rapide',
              text: 'Chaque carte d\'événement (Box) présente la date, le lieu, et l\'organisateur pour un survol rapide.',
              image: '/images/guide/citoyen/evenement_box_fr.png',
              highlight: { top: '25%', left: '30%', width: '40%', height: '40%', tooltipFr: 'Carte d\'événement', tooltipAr: 'بطاقة الفعالية' }
            },
            {
              title: 'Détails et Inscription',
              text: 'Accédez à la page complète de l\'événement pour lire le programme détaillé et vous y inscrire si nécessaire.',
              image: '/images/guide/citoyen/evenement_details_fr.png',
              highlight: { top: '15%', left: '10%', width: '80%', height: '50%', tooltipFr: 'Informations détaillées', tooltipAr: 'المعلومات التفصيلية' }
            }
          ]
        },
        {
          id: 'actualites_ressources',
          title: 'Actualités, Campagnes & Articles',
          subtitle: 'Toute l\'information de la province',
          image: '/images/guide/citoyen/actualites_liste_fr.png',
          intro: 'Le portail est votre source d\'information officielle pour les actualités, les grandes campagnes citoyennes et les articles de ressources.',
          steps: [
            {
              title: 'Fil d\'Actualités',
              text: 'Lisez les dernières nouvelles et annonces officielles. Le système de filtrage fonctionne de la même manière que pour les événements.',
              highlight: { top: '20%', left: '30%', width: '60%', height: '60%', tooltipFr: 'Liste des actualités', tooltipAr: 'قائمة الأخبار' }
            },
            {
              title: 'Campagnes Citoyennes',
              text: 'Découvrez les grandes campagnes de sensibilisation et d\'action menées par les autorités locales et les délégations.',
              image: '/images/guide/citoyen/campagnes_liste_fr.png',
              highlight: { top: '15%', left: '10%', width: '80%', height: '70%', tooltipFr: 'Campagnes en cours', tooltipAr: 'الحملات الحالية' }
            },
            {
              title: 'Ressources et Articles',
              text: 'Accédez à des guides pratiques, des documents téléchargeables et des articles d\'information pour faciliter vos démarches.',
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
          intro: 'La Boîte à Idées vous permet de proposer des projets innovants et d\'interagir avec les suggestions des autres citoyens.',
          steps: [
            {
              title: 'Tableau des Suggestions',
              text: 'Suivez le statut de vos idées et de celles de la communauté : "En attente", "Validée", ou "Rejetée".',
              highlight: { top: '15%', left: '15%', width: '70%', height: '30%', tooltipFr: 'Statut des idées', tooltipAr: 'حالة المقترحات' }
            },
            {
              title: 'Proposer une Idée',
              text: 'Cliquez sur "Nouvelle suggestion" pour rédiger votre proposition. Vous pouvez ajouter un titre, une description détaillée et une image d\'illustration.',
              image: '/images/guide/citoyen/idee_nouvelle_fr.png',
              highlight: { top: '20%', left: '20%', width: '60%', height: '60%', tooltipFr: 'Formulaire de proposition', tooltipAr: 'نموذج تقديم المقترح' }
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
          ]
        },
        {
          id: 'etablissement_autorite',
          title: 'Gestion des Établissements',
          subtitle: 'Superviser les infrastructures de la commune',
          image: '/images/guide/etablissement_autorite_fr.png',
          intro: 'En tant qu\'autorité locale, vous avez la supervision des établissements publics situés sur votre commune. Vous pouvez suivre leurs performances et les avis citoyens.',
          steps: [
            {
              title: 'Suivi des évaluations',
              text: 'Consultez la liste des établissements de votre territoire et visualisez leurs notes moyennes attribuées par les citoyens.',
              highlight: { top: '20%', left: '10%', width: '80%', height: '40%', tooltipFr: 'Liste des établissements', tooltipAr: 'قائمة المرافق' }
            },
            {
              title: 'Détail par établissement',
              text: 'Accédez à la fiche détaillée d\'un établissement pour voir les réclamations et événements qui y sont liés.',
              highlight: { top: '65%', left: '10%', width: '80%', height: '20%', tooltipFr: 'Détail de l\'établissement', tooltipAr: 'تفاصيل المرفق' }
            }
          ]
        },
        {
          id: 'statistiques_autorite',
          title: 'Statistiques & Performance',
          subtitle: 'Analyser les données de votre commune',
          image: '/images/guide/statistiques_autorite_fr.png',
          intro: 'Le tableau de bord statistique vous offre une vue globale sur les performances de traitement des réclamations et l\'état des établissements de votre commune.',
          steps: [
            {
              title: 'Indicateurs de résolution',
              text: 'Suivez le taux de résolution des réclamations, le nombre de signalements en attente et les statistiques globales par secteur.',
              highlight: { top: '15%', left: '5%', width: '90%', height: '35%', tooltipFr: 'Taux de résolution et KPIs', tooltipAr: 'معدل الحل والمؤشرات الرئيسية' }
            },
            {
              title: 'Analyse par catégorie',
              text: 'Visualisez la répartition des problèmes par catégorie (propreté, voirie, éclairage) pour mieux orienter vos ressources communales.',
              highlight: { top: '55%', left: '10%', width: '80%', height: '40%', tooltipFr: 'Répartition par catégorie', tooltipAr: 'التوزيع حسب الفئة' }
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
          image: '/images/guide/home_fr.png',
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
          image: '/images/guide/map_fr.png',
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
          image: '/images/guide/home_fr.png',
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
          image: '/images/guide/map_fr.png',
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
      title: 'زائر (غير مسجل)',
      description: 'اكتشف كيف يمكنك استكشاف الإقليم، استشارة المرافق العامة، والمشاركة في الفعاليات.',
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
            },
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
        },
        
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
              highlight: { top: '20%', left: '20%', width: '60%', height: '60%', tooltipFr: 'Conditions d\'utilisation', tooltipAr: 'شروط الاستخدام' }
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
              highlight: { top: '40%', left: '70%', width: '15%', height: '8%', tooltipFr: 'Bouton d\'abonnement', tooltipAr: 'زر الاشتراك' }
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
          id: 'evenements',
          title: 'الفعاليات والأنشطة',
          subtitle: 'لا تفوت أي نشاط إقليمي',
          image: '/images/guide/citoyen/evenements_liste_ar.png',
          intro: 'ابق على اطلاع بجميع الفعاليات، المهرجانات، والحملات المنظمة في الإقليم.',
          steps: [
            {
              title: 'الأجندة الإقليمية',
              text: 'استكشف القائمة الكاملة للفعاليات مع عوامل تصفية حسب التاريخ (الماضية، الجارية، القادمة) والقطاع.',
              highlight: { top: '15%', left: '70%', width: '25%', height: '80%', tooltipFr: 'Filtres d\'événements', tooltipAr: 'تصفية الفعاليات' }
            },
            {
              title: 'نظرة سريعة',
              text: 'كل بطاقة فعالية (Box) تعرض التاريخ، المكان، والجهة المنظمة لإلقاء نظرة سريعة.',
              image: '/images/guide/citoyen/evenement_box_ar.png',
              highlight: { top: '25%', left: '30%', width: '40%', height: '40%', tooltipFr: 'Carte d\'événement', tooltipAr: 'بطاقة الفعالية' }
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
    },
    
    {
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
            },
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
              highlight: { top: '40%', left: '70%', width: '15%', height: '8%', tooltipFr: 'Bouton d\'abonnement', tooltipAr: 'زر الاشتراك' }
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
              highlight: { top: '15%', left: '70%', width: '25%', height: '80%', tooltipFr: 'Filtres d\'événements', tooltipAr: 'تصفية الفعاليات' }
            },
            {
              title: 'نظرة سريعة',
              text: 'كل بطاقة فعالية (Box) تعرض التاريخ، المكان، والجهة المنظمة لإلقاء نظرة سريعة.',
              image: '/images/guide/citoyen/evenement_box_ar.png',
              highlight: { top: '25%', left: '30%', width: '40%', height: '40%', tooltipFr: 'Carte d\'événement', tooltipAr: 'بطاقة الفعالية' }
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
          image: '/images/guide/home_ar.png',
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
          image: '/images/guide/map_ar.png',
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
    }
  ]
};
