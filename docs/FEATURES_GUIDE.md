# 📋 Guide Complet des Fonctionnalités - MedAction

**Version:** 1.0.0  
**Date:** 2024-12-10

---

## 📑 Table des Matières

1. [Pages Publiques (Tous Visiteurs)](#-pages-publiques-tous-visiteurs)
2. [Rôle CITOYEN](#-rôle-citoyen)
3. [Rôle AUTORITÉ LOCALE](#-rôle-autorité-locale)
4. [Rôle DÉLÉGATION](#-rôle-délégation)
5. [Rôle GOUVERNEUR](#-rôle-gouverneur)
6. [Rôle ADMIN / SUPER_ADMIN](#-rôle-admin--super_admin)

---

## 🌐 Pages Publiques (Tous Visiteurs)

Ces pages sont accessibles sans connexion.

### Accueil `/`
**Description:** Page d'accueil principale de la plateforme
**Fonctionnalités:**
- Bandeau de bienvenue avec statistiques clés
- Sections mises en avant (établissements, événements, actualités)
- Carte interactive de la province
- Appel à l'action pour les réclamations
- Footer avec liens utiles

### Établissements `/etablissements`
**Description:** Liste de tous les établissements publics de la province
**Fonctionnalités:**
- Affichage en grille avec cards
- Filtres par :
  - Secteur (Santé, Éducation, Administration, Sport, Culture...)
  - Commune
  - Note minimum
  - Recherche textuelle
- Pagination / Infinite scroll
- Tri par note, nom, date
- Compteur de résultats

### Détail Établissement `/etablissements/[id]`
**Description:** Page détaillée d'un établissement
**Fonctionnalités:**
- Informations complètes (nom, adresse, téléphone, horaires)
- Galerie photos
- Carte de localisation interactive
- Note moyenne et nombre d'évaluations
- Liste des évaluations récentes
- Liste des événements de l'établissement
- Liste des actualités de l'établissement
- Bouton "Évaluer" (si connecté)
- Bouton "S'abonner" pour recevoir les notifications

### Toutes les Évaluations `/etablissements/[id]/evaluations`
**Description:** Liste complète des évaluations d'un établissement
**Fonctionnalités:**
- Pagination des évaluations
- Affichage note, commentaire, date, auteur (initiales)

### Tous les Événements `/etablissements/[id]/evenements-tous`
**Description:** Tous les événements d'un établissement
**Fonctionnalités:**
- Liste chronologique des événements passés et à venir

### Toutes les Actualités `/etablissements/[id]/actualites-toutes`
**Description:** Toutes les actualités d'un établissement
**Fonctionnalités:**
- Liste chronologique des actualités publiées

---

### Événements `/evenements`
**Description:** Calendrier des événements de la province
**Fonctionnalités:**
- Affichage en grille de cards
- Filtres par :
  - Statut (Tous, À venir, En cours, Terminés)
  - Secteur (Éducation, Santé, Sport, Social, Culturel)
  - Recherche textuelle
- Card avec :
  - Image ou gradient par défaut
  - Badge statut (En cours, À venir, Terminé)
  - Date, lieu, établissement
  - Nombre de vues et inscrits
- Infinite scroll

### Détail Événement `/evenements/[id]`
**Description:** Page détaillée d'un événement
**Fonctionnalités:**
- Image principale / galerie
- Informations complètes :
  - Titre, description
  - Dates et horaires
  - Lieu avec carte
  - Organisateur et contact
  - Capacité et places restantes
- Bouton partage (copie lien)
- Tags associés
- Bilan (si événement terminé)

---

### Actualités `/actualites`
**Description:** Dernières nouvelles de la province
**Fonctionnalités:**
- Liste des actualités avec image, titre, extrait
- Filtrage par catégorie
- Pagination

### Détail Actualité `/actualites/[id]`
**Description:** Article complet
**Fonctionnalités:**
- Contenu riche avec images
- Date de publication
- Établissement source
- Partage social

---

### Articles `/articles`
**Description:** Articles informatifs
**Fonctionnalités:**
- Liste d'articles thématiques
- Catégories

### Détail Article `/articles/[id]`
**Description:** Article complet
**Fonctionnalités:**
- Contenu riche
- Navigation entre articles

---

### Campagnes `/campagnes`
**Description:** Campagnes de sensibilisation
**Fonctionnalités:**
- Liste des campagnes actives et passées
- Participation / inscription

---

### Carte Interactive `/carte`
**Description:** Vue cartographique avancée de la province
**Fonctionnalités:**

#### Affichage Carte
- **Mapbox GL JS** avec support 2D et 3D
- Toggle 2D/3D (bouton en haut à droite)
- Zoom fluide + rotation (mode 3D)
- Thème gouvernemental (couleurs province)

#### Markers Établissements
- Icônes personnalisées par **secteur** :
  - 🏥 Santé (rouge)
  - 🎓 Éducation (bleu)
  - ⚽ Sport (vert)
  - 🎭 Culture (orange)
  - 🏛️ Administration (gris)
- **Hover** → Popup avec : nom, secteur, note moyenne
- **Clic** → Sidebar détails (5 onglets)

#### Markers Événements EN_ACTION
- Affichage des événements en cours
- Animation **pulse vert** pour attirer l'attention
- Popup avec titre, date, lieu

#### Sidebar Détails (au clic)
5 onglets disponibles :
1. **Infos** - Coordonnées, description
2. **Évaluations** - Note et commentaires
3. **Événements** - Liste des événements
4. **Actualités** - Dernières news
5. **Réclamations** - (si role GOUVERNEUR/ADMIN)

#### Filtres Multiples
| Filtre | Options |
|--------|---------|
| Secteur | Multi-select (Santé, Éducation, Sport...) |
| Commune | Dropdown 6 communes |
| Annexe | Sous-divisions communes |
| Note minimum | Slider 1-5 étoiles |
| Types affichés | Établissements, Événements, Campagnes |

#### Optimisation
- **Clustering** automatique si > 50 markers proches
- Lazy loading des données
- Cache des tuiles carte

#### Permissions
| Rôle | Peut voir réclamations sur carte |
|------|----------------------------------|
| CITOYEN | ❌ Non |
| DÉLÉGATION | ❌ Non |
| AUTORITE_LOCALE | ✅ Sa commune uniquement |
| GOUVERNEUR | ✅ Toutes communes |
| ADMIN | ✅ Toutes communes |

---

### Talents Locaux `/talents`
**Description:** Découverte des talents de la région
**Fonctionnalités:**
- Galerie de profils
- Catégories (Art, Sport, Science, etc.)
- Page détail de chaque talent

---

### Suggestions `/suggestions`
**Description:** Soumettre des idées d'amélioration
**Fonctionnalités:**
- Liste des suggestions existantes
- Formulaire de soumission
- Vote pour les suggestions (si connecté)

### Nouvelle Suggestion `/suggestions/nouvelle`
**Description:** Créer une suggestion
**Fonctionnalités:**
- Formulaire avec titre, description, catégorie

---

### Statistiques Publiques `/statistiques-publiques`
**Description:** Données ouvertes sur la province
**Fonctionnalités:**
- Graphiques interactifs
- Réclamations par commune, secteur
- Événements par mois
- Export des données

---

### FAQ `/faq`
**Description:** Questions fréquemment posées
**Fonctionnalités:**
- Accordéon par catégorie
- Recherche dans les questions

### Contact `/contact`
**Description:** Formulaire de contact
**Fonctionnalités:**
- Formulaire (nom, email, sujet, message)
- Informations de contact de la province

### À Propos `/a-propos`
**Description:** Présentation de la plateforme
**Fonctionnalités:**
- Mission et vision
- Équipe
- Historique

### Mentions Légales `/mentions-legales`
**Description:** Informations juridiques
**Fonctionnalités:**
- CGU, politique de confidentialité, cookies

---

## 👤 Rôle CITOYEN

**Accès après connexion.** Utilisateur standard de la plateforme.

### Menu Utilisateur
| Lien | Description |
|------|-------------|
| Mon profil | Gérer ses informations |
| Mes réclamations | Voir et suivre ses réclamations |

---

### Profil `/profil`
**Description:** Gestion du compte personnel
**Onglets:**

#### Onglet "Informations"
- Modifier prénom, nom
- Modifier numéro de téléphone
- Voir email (non modifiable)
- Voir rôle et date d'inscription

#### Onglet "Sécurité"
- Changer le mot de passe
  - Ancien mot de passe requis
  - Nouveau mot de passe avec validation (8 car., majuscule, minuscule, chiffre)
  - Confirmation du nouveau mot de passe

#### Onglet "Notifications"
- Paramètres de notification
- Fréquence des emails

#### Photo de profil
- Changer sa photo (upload)
- Supprimer sa photo
- Formats acceptés : JPG, PNG (max 2 Mo)

---

### Abonnements `/profil/abonnements`
**Description:** Gérer les établissements suivis
**Fonctionnalités:**
- Liste des établissements auxquels on est abonné
- Se désabonner
- Recevoir les notifications des établissements suivis

---

### Notifications `/notifications`
**Description:** Centre de notifications
**Fonctionnalités:**
- Liste des notifications reçues
- Marquer comme lue
- Types : nouvelles sur réclamations, événements, actualités

---

### Mes Réclamations `/mes-reclamations`
**Description:** Suivi de ses propres réclamations
**Fonctionnalités:**
- Statistiques personnelles :
  - Total de réclamations
  - En attente
  - Acceptées
- Filtres par statut (Toutes, En attente, Acceptées)
- Liste des réclamations avec :
  - Titre, catégorie
  - Statut visuel (badge coloré)
  - Date de création
  - Commune
- Clic → Modal détail avec :
  - Informations complètes
  - Photos jointes
  - Historique des actions

---

### Nouvelle Réclamation `/reclamations/nouvelle`
**Description:** Formulaire de création de réclamation (Stepper 3 étapes)

#### Étape 1 : Localisation
- Sélection de la commune (dropdown)
- Saisie du quartier/douar
- Carte interactive :
  - Clic pour placer le marqueur
  - Bouton "Ma position" (GPS)
- Coordonnées latitude/longitude

#### Étape 2 : Détails
- Titre de la réclamation
- Catégorie :
  - Infrastructure
  - Hygiène
  - Sécurité
  - Service public
  - Environnement
  - Autre
- Description détaillée
- Établissement concerné (optionnel) - dropdown filtré par commune

#### Étape 3 : Preuves
- Upload de photos (jusqu'à 5)
- Drag & drop ou clic
- Preview des photos
- Supprimer une photo
- Formats : JPG, PNG (max 5 Mo chacun)

#### Confirmation
- Bouton "Soumettre"
- Redirection vers `/reclamations/succes`

---

### Confirmation Réclamation `/reclamations/succes`
**Description:** Page de confirmation après soumission
**Fonctionnalités:**
- Message de succès
- Numéro de suivi (REC-XXXX-XXXX)
- Bouton vers "Mes réclamations"
- Bouton vers l'accueil

---

### Évaluer un Établissement `/evaluer/[id]`
**Description:** Formulaire d'évaluation
**Fonctionnalités:**
- Note de 1 à 5 étoiles (clic interactif)
- Commentaire textuel
- Validation :
  - Note requise
  - Une seule évaluation par établissement et par utilisateur
- Soumission avec confirmation

---

### Mes Évaluations `/mes-evaluations`
**Description:** Historique de ses évaluations
**Fonctionnalités:**
- Liste des établissements évalués
- Note donnée (étoiles)
- Date de l'évaluation
- **Modification:** Bouton "Modifier" actif pendant 7 jours
- Après 7 jours : évaluation verrouillée (non modifiable)
- Message informatif : "Modification possible pendant 7 jours après publication"

---

## 🏛️ Rôle AUTORITÉ LOCALE

**Accès :** Responsables des services municipaux d'une commune.
**Scope :** Uniquement les données de leur commune.

### Menu Utilisateur
| Lien | Description |
|------|-------------|
| Mon profil | Gérer ses informations |
| Tableau de bord | Dashboard autorité |
| Réclamations | Gérer les réclamations de la commune |

---

### Dashboard Autorité `/autorite`
**Description:** Tableau de bord de l'autorité locale
**Fonctionnalités:**
- Statistiques de la commune :
  - Nombre de réclamations
  - Réclamations en attente / traitées
  - Taux de résolution
- Graphiques de tendance
- Réclamations récentes
- Actions rapides

---

### Réclamations de la Commune `/autorite/reclamations`
**Description:** Liste des réclamations reçues pour la commune
**Fonctionnalités:**
- Tableau avec colonnes :
  - ID, Titre, Catégorie
  - Citoyen (nom/email)
  - Statut
  - Date
  - Actions
- Filtres :
  - Par statut
  - Par catégorie
  - Par date
  - Recherche textuelle
- Pagination
- Export CSV/PDF

---

### Détail Réclamation `/autorite/reclamations/[id]`
**Description:** Vue détaillée d'une réclamation AFFECTÉE à ma commune
**Fonctionnalités:**
- Informations complètes
- Photos jointes (galerie, téléchargement possible)
- Localisation sur carte
- Historique des actions

**⚠️ WORKFLOW CORRECT - Actions disponibles AUTORITÉ LOCALE :**

| Action | Description |
|--------|-------------|
| Ajouter commentaire interne | Note visible uniquement par admin/autorité |
| Marquer comme résolue | Ajouter la solution apportée |
| Ajouter photos preuve | Photos de la résolution |
| Voir historique | Toutes les actions sur cette réclamation |

**❌ L'AUTORITÉ LOCALE NE PEUT PAS :**
- Accepter la réclamation (action ADMIN)
- Rejeter la réclamation (action ADMIN)
- Changer l'affectation

**📋 Workflow Réclamations :**
```
1. Citoyen soumet → statut: null, affectation: NON_AFFECTEE
2. ADMIN décide → statut: ACCEPTEE ou REJETEE
3. Si ACCEPTEE, ADMIN affecte → affectation: AFFECTEE + autoriteLocaleId
4. AUTORITÉ LOCALE traite → ajoute solution, photos, commentaires
```

---

## 📊 Rôle DÉLÉGATION

**Accès :** Délégations sectorielles (Santé, Éducation, etc.)
**Scope :** Établissements et contenus de leur secteur uniquement.

### Menu Utilisateur
| Lien | Description |
|------|-------------|
| Mon profil | Gérer ses informations |
| Tableau de bord | Dashboard délégation |
| Événements | Gérer les événements |

---

### Dashboard Délégation `/delegation`
**Description:** Tableau de bord sectoriel
**Fonctionnalités:**
- Affichage du secteur responsable (Santé, Éducation, etc.)
- Statistiques :
  - Événements (total, publiés, en attente)
  - Actualités (total, publiées, vues)
  - Articles (total, publiés, vues)
  - Campagnes (total, actives, participations)
- Graphiques par type de contenu
- Éléments récents créés
- Accès rapides aux sections

---

### Mes Événements `/delegation/evenements`
**Description:** Gestion des événements du secteur
**Fonctionnalités:**
- Liste des événements créés par ma délégation
- Filtres par statut
- Bouton "Créer un événement"

**⚠️ WORKFLOW CORRECT - Statuts des événements :**

| Statut | Description | Actions Délégation |
|--------|-------------|-------------------|
| EN_ATTENTE_VALIDATION | Nouveau, en attente | Modifier, Supprimer |
| PUBLIEE | Validé par admin | Passer EN_ACTION (si date début atteinte) |
| REJETEE | Refusé par admin | Voir motif, Modifier, Resoumettre |
| EN_ACTION | En cours | Clôturer |
| CLOTUREE | Terminé | Ajouter bilan |

**⚠️ LA DÉLÉGATION NE PEUT PAS :**
- Publier directement (validation admin requise)
- Dépublier un événement publié

#### Créer/Modifier un Événement
Formulaire avec :
- Titre
- Description (éditeur riche)
- Type catégorique
- Dates (début, fin)
- Horaires
- Lieu et adresse
- Coordonnées GPS (carte)
- Capacité max
- Inscriptions ouvertes (oui/non)
- Lien d'inscription externe
- Contact organisateur
- Photos/médias
- Tags

**→ À la soumission : statut = EN_ATTENTE_VALIDATION**

---

### Mes Actualités `/delegation/actualites`
**Description:** Gestion des actualités du secteur
**Fonctionnalités:**
- Liste des actualités créées
- Créer une nouvelle actualité
- Modifier, publier, supprimer

#### Créer/Modifier une Actualité
- Titre
- Contenu (éditeur riche)
- Image principale
- Catégorie
- Établissement associé
- Date de publication

---

### Mes Articles `/delegation/articles`
**Description:** Gestion des articles informatifs
**Fonctionnalités:**
- Liste des articles
- Créer, modifier, supprimer
- Catégorisation

---

### Mes Campagnes `/delegation/campagnes`
**Description:** Gestion des campagnes de sensibilisation
**Fonctionnalités:**
- Liste des campagnes
- Créer une nouvelle campagne
- Suivre les participations
- Gérer les dates (début/fin)

---

### Statistiques Sectorielles `/delegation/statistiques`
**Description:** Analytics du secteur
**Fonctionnalités:**
- Graphiques de performance
- Événements les plus vus
- Évolution dans le temps
- Export des données

---

## 👔 Rôle GOUVERNEUR

**Accès :** Vue d'ensemble provinciale (lecture seule)
**Scope :** Toute la province, toutes les communes, tous les secteurs.

### Menu Utilisateur
| Lien | Description |
|------|-------------|
| Mon profil | Gérer ses informations |
| Tableau de bord | Vue provinciale |

---

### Dashboard Gouverneur `/gouverneur`
**Description:** Tableau de bord provincial (LECTURE SEULE)
**Fonctionnalités:**
- **Statistiques globales :**
  - Réclamations totales / en attente / en cours / résolues
  - Taux de résolution (%)
  - Nombre de communes
  - Nombre d'établissements
- **Événements :**
  - Total, à venir, en cours
- **Citoyens :**
  - Total inscrit
  - Actifs ce mois
- **Accès rapides :**
  - Établissements
  - Événements
  - Carte interactive
  - Statistiques publiques

---

### Réclamations Urgentes `/gouverneur/reclamations` *(à développer)*
**Description:** Vue des 3 dernières réclamations urgentes
**Fonctionnalités:**
- Liste des réclamations prioritaires (toutes communes)
- Lecture seule
- Accès aux détails

### Détail Réclamation `/gouverneur/reclamations/[id]` *(à développer)*
**Description:** Vue détaillée en lecture seule
**Fonctionnalités:**
- Toutes les informations
- Photos (avec téléchargement)
- Localisation carte
- Historique des actions
- **⚠️ Aucune action possible (lecture seule)**

### Carte Gouverneur `/gouverneur/carte` *(à développer)*
**Description:** Carte interactive avancée pour le Gouverneur
**Fonctionnalités:**

#### Vue Carte Complète
- **Mapbox GL JS** 2D/3D toggle
- Couverture complète des 6 communes
- Zones administratives colorées

#### Markers Établissements
- Tous les établissements (tous secteurs)
- Couleur par secteur (Santé:rouge, Éducation:bleu, etc.)
- Popup hover : nom, secteur, note moyenne
- Clic → Sidebar détails complets

#### Markers Événements EN_ACTION
- Événements en cours (animation pulse vert)
- Tous secteurs confondus
- Popup : titre, organisateur, dates

#### Markers Réclamations *(EXCLUSIF GOUVERNEUR)*
- 🔴 Réclamations NON_AFFECTEES (prioritaires)
- 🟡 Réclamations AFFECTEES en attente
- 🟢 Réclamations résolues récemment
- Popup : titre, commune, statut, date

#### Filtres Avancés
| Filtre | Options |
|--------|---------|
| Commune | Multi-select 6 communes |
| Annexe | Sous-divisions par commune |
| Secteur | Multi-select tous secteurs |
| Type de marker | Établissements, Événements, Réclamations |
| Statut réclamations | Non affectées, Affectées, Résolues |
| Période | Aujourd'hui, 7 jours, 30 jours |

#### Statistiques Overlay
- Badge compteur par commune
- Heatmap densité réclamations
- Timeline événements

#### Permissions Gouverneur
- ✅ Voir TOUS les markers
- ✅ Voir réclamations toutes communes
- ✅ Télécharger photos réclamations
- ❌ Aucune action de modification

---

### Événements Gouverneur `/gouverneur/evenements` *(à développer)*
**Description:** Vue globale des événements provinciaux
**Fonctionnalités:**
- Liste des 3 derniers événements (tous secteurs)
- Événements EN_ACTION en priorité
- Statistiques : participants, vues
- Accès détail complet (lecture seule)
- Filtres par secteur et commune

---

## ⚙️ Rôle ADMIN / SUPER_ADMIN

**Accès :** Administration complète de la plateforme
**Scope :** Toutes les données, tous les utilisateurs.

### Menu Utilisateur
| Lien | Description |
|------|-------------|
| Mon profil | Gérer ses informations |
| Administration | Accès au panel admin |

---

### Dashboard Admin `/admin`
**Description:** Tableau de bord administrateur
**Fonctionnalités:**
- **Statistiques globales :**
  - Utilisateurs totaux
  - Réclamations (total, en attente, résolues)
  - Établissements
  - Événements
- **Graphiques :**
  - Réclamations par mois
  - Utilisateurs par rôle
  - Top communes
- **Actions récentes**
- **Alertes système**
- **Accès rapides** aux sections

---

### Gestion Réclamations `/admin/reclamations`
**Description:** Administration des réclamations
**Fonctionnalités:**
- Vue globale de toutes les réclamations (toutes communes)
- Filtres avancés :
  - Commune
  - Secteur
  - Statut
  - Affectation
  - Date
- Actions :
  - Voir détail
  - Affecter à une autorité locale
  - Modifier le statut
  - Supprimer

### Détail Réclamation Admin `/admin/reclamations/[id]`
- Toutes les informations
- Historique complet
- Actions administratives

---

### Gestion Utilisateurs `/admin/utilisateurs`
**Description:** Administration des comptes utilisateurs
**Fonctionnalités:**
- **Liste des utilisateurs** avec :
  - Photo/initiales
  - Nom, prénom, email
  - Rôle (badge coloré)
  - Commune
  - Statut (actif/inactif)
  - Date inscription
  - Actions
- **Filtres :**
  - Par rôle
  - Par commune
  - Par statut
  - Recherche
- **Actions :**
  - Créer un utilisateur
  - Modifier un utilisateur
  - Changer le rôle
  - Activer/Désactiver
  - Réinitialiser mot de passe
  - Supprimer

#### Modal Création Utilisateur
- Prénom, Nom
- Email
- Téléphone
- Mot de passe
- Rôle
- Commune (si rôle local)
- Secteur responsable (si délégation)
- Photo (optionnel)

#### Modal Modifier Rôle
- Sélection du nouveau rôle
- Attribution de commune/secteur selon le rôle

---

### Validation des Contenus `/admin/validation`
**Description:** Modération des contenus soumis
**Fonctionnalités:**
- Liste des contenus en attente de validation :
  - Événements
  - Actualités
  - Évaluations
  - Suggestions
- Actions :
  - Approuver
  - Rejeter avec motif
  - Demander modifications

---

### Gestion Événements `/admin/evenements`
**Description:** Administration globale des événements
**Fonctionnalités:**
- Liste de tous les événements
- Filtres par secteur, statut, date
- Actions admin :
  - Forcer publication
  - Supprimer
  - Modifier

---

### Gestion Suggestions `/admin/suggestions`
**Description:** Administration des suggestions citoyennes
**Fonctionnalités:**
- Liste des suggestions
- Modérer, approuver, rejeter
- Voir les votes

---

### Gestion Talents `/admin/talents`
**Description:** Administration des profils talents
**Fonctionnalités:**
- Liste des talents
- Approuver, modifier, supprimer

---

### Journaux d'Activité `/admin/logs`
**Description:** Audit trail de la plateforme
**Fonctionnalités:**
- Liste chronologique des actions
- Filtres par :
  - Type d'action
  - Utilisateur
  - Date
  - Entité concernée
- Détails :
  - Qui a fait quoi, quand
  - Valeurs avant/après modification
- Pagination
- Export

---

### Statistiques Admin `/admin/stats`
**Description:** Analytics détaillées
**Fonctionnalités:**
- **Période sélectionnable** : 7j, 30j, 90j, 1 an
- **KPIs :**
  - Réclamations totales avec variation
  - Établissements et note moyenne
  - Événements ce mois
  - Nouveaux utilisateurs
- **Graphiques :**
  - Réclamations par statut
  - Établissements par secteur
  - Événements par secteur
  - Utilisateurs par rôle

---

### Paramètres `/admin/settings`
**Description:** Configuration de la plateforme
**Onglets:**

#### Général
- Nom de la plateforme
- Description
- Mode maintenance (toggle)

#### Notifications
- Notifier admins pour nouvelles réclamations
- Notifier pour nouveaux utilisateurs
- Rapport quotidien par email

#### Sécurité
- Durée de session (heures)
- Tentatives de connexion max
- 2FA pour admins (toggle)

#### Email
- Email d'envoi (From)
- Email de contact
- Configuration SMTP (info)

---

### Rapports `/admin/rapports`
**Description:** Génération de rapports
**Fonctionnalités:**
- Rapport réclamations par période
- Rapport établissements
- Rapport utilisateurs
- Export PDF/Excel

---

### Profil Admin `/admin/profil`
**Description:** Gestion du profil administrateur
**Fonctionnalités:**
- Mêmes fonctions que `/profil` citoyen
- Historique de ses actions admin

---

## 🔒 Pages d'Authentification

### Connexion `/login`
**Fonctionnalités:**
- Email et mot de passe
- Bouton "Se connecter"
- Lien vers inscription
- Lien "Mot de passe oublié" (si implémenté)
- Redirection selon le rôle après connexion

### Inscription `/register`
**Fonctionnalités:**
- Prénom, Nom
- Email
- Téléphone (format marocain)
- Commune de résidence
- Mot de passe + confirmation
- Validation en temps réel
- CGU à accepter
- Redirection vers login après succès

---

## 📱 Navigation

### Header Public (GovHeader)
- Logo Province de Médiouna
- Menu principal :
  - Accueil
  - Établissements
  - Événements
  - Actualités
  - Carte
- Menu Services (dropdown) :
  - Nouvelle réclamation
  - Mes réclamations
  - Suggestions
- Bouton Connexion/Inscription
- OU Menu utilisateur (si connecté) :
  - Photo/initiales
  - Nom
  - Dropdown avec liens selon rôle

### Sidebar Admin
- Logo
- Dashboard
- Réclamations
- Suggestions
- Utilisateurs
- Validation
- Événements
- Logs
- Statistiques
- Paramètres
- Déconnexion

### Sidebar Délégation
- Logo + Secteur
- Tableau de bord
- Mes Événements
- Mes Actualités
- Mes Articles
- Mes Campagnes
- Statistiques
- Info utilisateur
- Déconnexion

---

## 📧 Notifications

Types de notifications envoyées :
- Nouvelle réclamation créée
- Réclamation acceptée/rejetée
- Nouvel événement dans un établissement suivi
- Nouvelle actualité
- Bienvenue après inscription

---

**Document généré automatiquement - MedAction v1.0.0**
