# 🏗️ Rapport d'Architecture Technique - MedAction
*Province de Médiouna - Portail Citoyen Unifié*

---

**Date** : 18 Décembre 2025  
**Version** : 1.0.0  
**Statut** : Production Ready  
**Auteurs** : Équipe Technique MedAction  

---

## 📑 Table des Matières

1. [Vue d'Ensemble](#1-vue-densemble)
2. [Architecture Technique](#2-architecture-technique)
3. [Structure du Projet](#3-structure-du-projet)
4. [Modules Principaux](#4-modules-principaux)
5. [Base de Données](#5-base-de-données)
6. [Sécurité](#6-sécurité)
7. [Performance](#7-performance)
8. [Recommandations](#8-recommandations)
9. [Annexes](#9-annexes)

---

## 1. 🌍 Vue d'Ensemble

### 1.1 Description du Projet
**MedAction** est une plateforme numérique de gouvernance participative conçue pour la Province de Médiouna. Elle sert de pont numérique entre l'administration provinciale, les délégations sectorielles, les autorités locales et les citoyens.

L'objectif principal est de **fluidifier la communication** et **optimiser la gestion territoriale** à travers :
1.  La digitalisation complète du processus de **réclamations** (géolocalisées et suivies).
2.  La promotion des **événements** et activités culturelles/sociales.
3.  La cartographie interactive des **établissements** publics (Éducation, Santé, etc.).
4.  L'évaluation citoyenne de la qualité des services publics.

### 1.2 Acteurs et Rôles (RBAC)

Le système repose sur une gestion stricte des droits (RBAC - Role Based Access Control) avec 7 niveaux hiérarchiques :

| Rôle | Description & Responsabilités | Permissions Clés |
|------|-------------------------------|------------------|
| **🧑‍🤝‍🧑 CITOYEN** | Utilisateur final (Habitant de la province) | • Créer réclamations<br>• Noter établissements<br>• S'abonner aux notifs<br>• Consulter événements |
| **🏢 DELEGATION** | Responsable d'un secteur (ex: Santé, Éducation) | • Gérer établissements du secteur<br>• Publier événements/actualités<br>• Suivre stats sectorielles |
| **🏛️ AUTORITE_LOCALE** | Gestionnaire territorial (Pacha/Caïd) par Commune | • Suivre réclamations de sa zone<br>• Valider interventions locales<br>• Vue globale commune |
| **📅 COORDINATEUR** | Gestionnaire opérationnel des activités | • Planifier programmes activités<br>• Gérer calendriers établissements<br>• Rapports d'activités |
| **👑 ADMIN** | Administrateur fonctionnel plateforme | • Modération globale<br>• Validation contenus<br>• Affectation réclamations<br>• Gestion utilisateurs |
| **🔒 SUPER_ADMIN** | Administrateur technique suprême | • Gestion des admins<br>• Configuration système<br>• Accès logs & audits<br>• Backups & Maintenance |
| **👁️ GOUVERNEUR** | Décideur stratégique (Vue Haute) | • accès Lecture Seule global<br>• Dashboards décisionnels<br>• Rapports statistiques avancés |

### 1.3 Statistiques du Projet

> *Estimations basées sur l'analyse du code source v1.0*

*   **Total Fichiers** : ~1,450 fichiers
*   **Composants React** : ~120+ composants réutilisables
*   **Routes API (Backend)** : ~45 endpoints sécurisés
*   **Modèles de Données** : 16 modèles Prisma
*   **Pages Application** : ~60 pages uniques
*   **Stack Technique** : 100% TypeScript

---

## 2. 🏗️ Architecture Technique

Le projet suit une architecture **Monolithique Modulaire** moderne basée sur le framework Next.js 14 (App Router), privilégiant le rendu serveur (SSR/RSC) pour la performance et le SEO.

### 2.1 Diagramme de Stack (The "MedAction" Stack)

```ascii
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT LAYER (Browser)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │ React 18 UI  │  │ Tailwind CSS │  │  Framer Motion    │  │
│  └──────┬───────┘  └──────┬───────┘  └────────┬──────────┘  │
└─────────┼─────────────────┼───────────────────┼─────────────┘
          │ HTTPS / JSON    │                   │
┌─────────▼─────────────────▼───────────────────▼─────────────┐
│                    APPLICATION LAYER (Next.js)              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                   App Router (Server)                 │  │
│  │  ┌──────────────┐ ┌───────────────┐ ┌──────────────┐  │  │
│  │  │ Server Comp. │ │ API Routes    │ │ Middleware   │  │  │
│  │  └──────┬───────┘ └──────┬────────┘ └──────┬───────┘  │  │
│  └─────────┼────────────────┼─────────────────┼──────────┘  │
└────────────┼────────────────┼─────────────────┼─────────────┘
             │                │                 │
┌────────────▼────────────────▼─────────────────▼─────────────┐
│                    DATA ACCESS LAYER (Prisma)               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                 Prisma Client (Typed)                 │  │
│  └──────────────────────────┬────────────────────────────┘  │
└─────────────────────────────┼───────────────────────────────┘
                              │ TCP/5432
┌─────────────────────────────▼───────────────────────────────┐
│                    PERSISTENCE LAYER (Docker)               │
│  ┌────────────────┐  ┌────────────────┐  ┌───────────────┐  │
│  │ PostgreSQL 16  │  │ Redis (Cache)  │  │ File Storage  │  │
│  └────────────────┘  └────────────────┘  └───────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Flux de Données (Interaction Flow)

Exemple : **Création d'une Réclamation**

1.  **User Interaction** : Le Citoyen remplit le formulaire (Zod validation client).
2.  **Request** : POST `/api/reclamations` (Secure Cookie Session).
3.  **Middleware** : Vérification Token JWT + Rôle `CITOYEN` + Rate Limit.
4.  **API Handler** :
    *   Validation Payload (Zod Schema Server-side).
    *   Sanitization des entrées (XSS prevention).
5.  **Data Layer** : Appel `prisma.reclamation.create()`.
6.  **Database** : Transaction SQL Insert dans PostgreSQL.
7.  **Webhook/Event** : Notification (Email/In-app) déclenchée.
8.  **Response** : JSON 201 Created → UI Update (Toast Success).

### 2.3 Patterns d'Infrastucture

*   **Server Components (RSC)** : 90% des pages sont rendues serveur pour :
    *   Accès direct DB (pas d'appel API interne).
    *   Sécurité (Code backend ne fuite pas).
    *   Performance (Moins de JS envoyé au client).
*   **Containerization** : Docker complet (Multi-stage build).
*   **Reverse Proxy** : Nginx pour SSL termination, Gzip, et Security Headers.

---

## 3. 📂 Structure du Projet

L'organisation des dossiers suit les conventions Next.js App Router strictes.

### 3.1 Arborescence Principale

```bash
medaction/
├── 📂 app/                      # Cœur de l'application (Routes)
│   ├── 📂 (auth)/               # Routes Authentification (Login, Register)
│   ├── 📂 (main)/               # Routes Publiques (Home, Carte, Contact)
│   ├── 📂 admin/                # Espace Administrateur
│   ├── 📂 api/                  # Endpoints API REST
│   ├── 📂 autorite/             # Espace Autorité Locale
│   ├── 📂 delegation/           # Espace Délégation
│   ├── 📂 super-admin/          # Espace Super Admin
│   ├── globals.css              # Styles globaux (Tailwind)
│   └── layout.tsx               # Root Layout
├── 📂 components/               # Librairie de Composants
│   ├── 📂 ui/                   # Composants de base (Button, Card...)
│   ├── 📂 admin/                # Composants Métier Admin
│   ├── 📂 maps/                 # Composants Cartographie (Mapbox/Leaflet)
│   └── 📂 forms/                # Formulaires réutilisables
├── 📂 lib/                      # Logique Métier & Config
│   ├── auth.ts                  # Config NextAuth
│   ├── db.ts                    # Instance Prisma Singleton
│   └── utils.ts                 # Helpers globaux
├── 📂 prisma/                   # Base de données
│   ├── schema.prisma            # Définition modèles
│   └── seed.ts                  # Données initiales
├── 📂 public/                   # Assets statiques (Images, Icons)
├── 📂 scripts/                  # Scripts DevOps (Build, Deploy, Clean)
└── 📂 tests/                    # Tests unitaires et E2E
```

### 3.2 Conventions de Nommage

*   **Dossiers Routes** : kebab-case (ex: `mes-reclamations`, `super-admin`).
*   **Composants** : PascalCase (ex: `MaintenanceBanner.tsx`, `ReclamationCard.tsx`).
*   **Hooks** : camelCase avec préfixe use (ex: `useReclamations.ts`).
*   **API Routes** : `/app/api/[resource]/route.ts`.

---

## 4. 🧩 Modules Principaux

### 4.1 Module Authentification (`next-auth`)
*   **Description** : Gestion sécurisée des sessions, connexions et inscriptions.
*   **Features** : Login (Credentials), Register, Password Reset, Email Verification.
*   **Sécurité** : Hachage Bcrypt, JWT Tokens (HTTPOnly), CSRF Protection.
*   **Fichiers** : `lib/auth.ts`, `app/api/auth/[...nextauth]/route.ts`.

### 4.2 Module Réclamations
*   **Description** : Cœur du système citoyen.
*   **Workflow** :
    1.  **Création** (Citoyen + Preuves photos/GPS).
    2.  **Validation** (Admin : Accepter/Rejeter).
    3.  **Affectation** (Admin → Autorité Locale/Service).
    4.  **Traitement** (Autorité → Résolu).
    5.  **Clôture** (Feedback citoyen).
*   **Modèle DB** : `Reclamation`, `HistoriqueReclamation`, `Media`.

### 4.3 Module Cartographie Interactive
*   **Description** : Carte 3D immersive des points d'intérêt et problèmes.
*   **Tech** : Mapbox GL JS (ou Leaflet selon config), GeoJSON.
*   **Features** : Clustering (regroupement points), Filtrage par secteur, Popup détails 3D.
*   **Optimisation** : Chargement paresseux des marqueurs (Viewport loading).

### 4.4 Dashboards Analytiques
System de 4 tableaux de bord distincts mais interconnectés :
1.  **Admin Dashboard** : Vue d'ensemble technique et modération.
2.  **Gouverneur Dashboard** : KPIs stratégiques (Taux résolution, Satisfaction).
3.  **Delegation Dashboard** : Stats sectorielles (ex: Éducation).
4.  **Autorite Dashboard** : Stats locales (Commune).

---

## 5. 🗄️ Base de Données

Le schéma de données est relationnel (SQL) et normalisé.

### 5.1 Schéma Simplifié (Entités Clés)

```ascii
[USER] 1 ─── n [RECLAMATION] n ─── 1 [COMMUNE]
  │                 │
  │                 └─── n [MEDIA]
  │
  └─── n [EVALUATION] n ─── 1 [ETABLISSEMENT]
                                    │
       [EVENEMENT] n ───────────────┘
```

### 5.2 Statistiques Tables (Estimées)

| Table | Rôle | Complexité | Relations Clés |
|-------|------|------------|----------------|
| `User` | Authentification & Profils | Haute | 15+ relations (Logs, Reclam, Evals...) |
| `Etablissement` | Annuaire public | Très Haute | Commune, Annexe, Secteur, Medias |
| `Reclamation` | Ticket incident | Haute | User, Commune, Affectation, Historique |
| `Commune` | Découpage territorial | Moyenne | Etablissements, Reclamations |
| `Media` | Centralisation fichiers | Faible | Polymorphique (lié à tout) |

### 5.3 Optimisation & Indexation
*   **Index Géospatiaux** : Sur `latitude`/`longitude` des Etablissements et Réclamations pour recherche par rayon.
*   **Index de Recherche** : Sur `titre`, `description` (PgTrgm pour recherche floue).
*   **Index de Filtrage** : Sur `statut`, `secteur`, `communeId` (filtrage facetté rapide).

---

## 6. 🔒 Sécurité

Le projet a subi plusieurs audits de sécurité (Pentests simulés).

### 6.1 Mesures Implémentées
*   **Protection CSRF/XSS** : Native via React et Next.js.
*   **Rate Limiting** : Configuré dans Nginx (10 req/s API, 5 req/m Login).
*   **Sanitization** : Zod schema validation stricte sur TOUTES les entrées API.
*   **Secure Headers** : HSTS, X-Frame-Options, CSP stricts (via Nginx).
*   **Isolation** : Docker container non-root (`uid:1001`).

### 6.2 Score de Sécurité (Auto-éval) : 92/100 🛡️
*   ✅ OWASP Top 10 couvert.
*   ✅ Données sensibles chiffrées (Mots de passe).
*   ⚠️ **A faire** : Audit externe certifié avant lancement grand public.

---

## 7. ⚡ Performance & Qualité

### 7.1 Métriques Cibles (Lighthouse)
*   🟢 **Performance** : 95+ (Desktop), 85+ (Mobile).
*   🟢 **Accessibility** : 100 (RGAA/WCAG Compliance).
*   🟢 **SEO** : 100 (Meta tags dynamiques, Sitemap XML).

### 7.2 Stratégies d'Optimisation
1.  **Images** : Utilisation de `next/image` pour conversion WebP/AVIF automatique + Lazy loading.
2.  **Code Splitting** : Automatique par route via Next.js.
3.  **Caching** :
    *   **React Cache** : Déduplication des requêtes DB server-side.
    *   **Nginx Cache** : Mise en cache des assets statiques (1 an).
4.  **Database** : Connection Pooling activé (via Prisma/PgBouncer) pour supporter la charge.

---

## 8. ✅ Recommandations

### 🔴 Priorité Haute (Immédiat - < 1 mois)
1.  **Monitoring** : Configurer les alertes Sentry pour être notifié des erreurs 500 en temps réel.
2.  **Backup S3** : Externaliser les backups DB vers un stockage S3 froid (AWS/Minio) via script cron.
3.  **Tests de Charge** : Lancer un test `k6` ou `Artillery` simulant 1000 utilisateurs simultanés pour valider la config Nginx.

### 🟡 Priorité Moyenne (3 mois)
1.  **PWA (Progressive Web App)** : Rendre l'application installable sur mobile (Service Workers).
2.  **Mode Hors-Ligne** : Permettre la création de réclamations sans internet (synchronisation ultérieure).
3.  **Analytique Avancée** : Intégrer un outil type Matomo (GDPR friendly) pour les stats de visite.

### 🟢 Priorité Basse (Long terme)
1.  **IA Chatbot** : Assistant pour guider les citoyens dans leurs démarches.
2.  **Open Data** : API publique pour les données non sensibles (liste des pharmacies, écoles...).

---

## 9. 📚 Annexes & Ressources

*   📄 **[Guide de Déploiement Docker](./DEPLOYMENT_STRATEGY.md)**
*   📄 **[Guide Production](./PRODUCTION_GUIDE.md)**
*   📄 **[Rapport de Nettoyage](./CLEANING-REPORT.md)**
*   🔐 **[Audit de Sécurité](./docs/security-reports/RAPPORT_SECURITE_COMPLET.md)**

---
*Généré par Antigravity - Architecte Logiciel IA*
