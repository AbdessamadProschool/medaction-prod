# 🛠️ RAPPORT TECHNIQUE - STACK TECHNOLOGIQUE (V1.0)

**Projet :** Portail Numérique de la Province de Médiouna (Portail Mediouna)  
**Date :** Décembre 2025  
**Responsabilité :** Lead Tech / Architecte Système  
**Statut :** Production Ready  

---

## 📑 SOMMAIRE

1.  [Vue d'ensemble et Dépendances](#1-vue-densemble-et-dépendances)
2.  [Frontend & UI](#2-frontend--ui)
3.  [Backend & API](#3-backend--api)
4.  [Base de Données & ORM](#4-base-de-données--orm)
5.  [Authentification & Sécurité](#5-authentification--sécurité)
6.  [Infrastructure & DevOps](#6-infrastructure--devops)
7.  [Outils de Développement & Qualité](#7-outils-de-développement--qualité)
8.  [Comparatif et Justification des Choix](#8-comparatif-et-justification-des-choix)
9.  [Analyse des Versions](#9-analyse-des-versions)
10. [Ressources d'Apprentissage](#10-ressources-dapprentissage)

---

## 1. VUE D'ENSEMBLE ET DÉPENDANCES

Le projet repose sur une stack **T3-like** modernisée (Next.js App Router, Prisma, Tailwind, TypeScript), optimisée pour la performance, la sécurité et la maintenabilité. L'architecture est monolithique modulaire, conçue pour être conteneurisée via Docker.

### 📦 Dépendances Principales (`package.json`)

| Catégorie | Technologie | Version | Description |
| :--- | :--- | :--- | :--- |
| **Core** | `next` | `14.2.33` | Framework React Fullstack (App Router) |
| **Core** | `react` | `18.x` | Librairie UI |
| **Langage** | `typescript` | `5.x` | Typage statique |
| **ORM** | `prisma` | `7.1.0` | ORM Type-safe pour PostgreSQL |
| **Auth** | `next-auth` | `4.24.13` | Gestion de l'authentification |
| **UI** | `tailwindcss` | `3.4.1` | Framework CSS Utility-first |
| **Validation** | `zod` | `4.1.13` | Validation de schémas (Runtime) |
| **Formulaires** | `react-hook-form` | `7.68.0` | Gestion des formulaires performante |
| **Cartographie** | `mapbox-gl` | `3.17.0` | Cartographie vectorielle interactive |
| **Graphiques** | `recharts` | `3.5.1` | Visualisation de données |

---

## 2. FRONTEND & UI

### ⚛️ Next.js 14 (App Router)
Le cœur de l'application. Nous utilisons l'architecture **App Router** (`app/`) pour bénéficier des dernières avancées React.
*   **Server Components (RSC) :** Utilisés par défaut pour réduire le bundle client (ex: Pages de listes, Tableaux de bord). Accès DB direct.
*   **Client Components :** Utilisés uniquement pour l'interactivité (ex: Formulaires, Carte, Modales) via la directive `'use client'`.
*   **Server Actions :** Remplacent les API Routes traditionnelles pour les mutations de données (ex: `submitReclamation`).
*   **Optimisations :** `<Image />` pour le format AVIF/WebP, `next/font` pour les polices Google optimisées.

### 🎨 Tailwind CSS & Shadcn/ui
L'interface est construite sans librairie de composants lourde (comme MUI).
*   **Tailwind CSS :** Styling via classes utilitaires. Configuration étendue dans `tailwind.config.ts` incluant le thème "Gouvernement" (Or, Vert, Rouge).
*   **Shadcn/ui :** Collection de composants réutilisables basés sur **Radix UI** (Headless accessible) et Tailwind.
    *   *Avantage :* Code source copié dans le projet (`components/ui`), pas de dépendance npm opaque. Contrôle total.
    *   *Composants installés :* Button, Dialog, Form, Select, Table, Toast (Sonner), Card, etc.
*   **Framer Motion :** Gestion des animations complexes (transitions de page, listes animées).

### 🗺️ Cartographie (Mapbox GL)
*   **Implémentation :** Intégration via `react-map-gl` ou wrapper custom.
*   **Features :** Marqueurs personnalisés (Pins), Popups interactives, Clustering pour les grands volumes de données.
*   **Hébergement :** Styles Mapbox hébergés sur CDN performant.

---

## 3. BACKEND & API

### 🛠️ Next.js API & Server Actions
*   **API Routes (`app/api/`) :** Utilisées pour les endpoints REST nécessaires aux services externes (Mobile, Webhooks) ou aux fonctionnalités complexes (Streaming, PDF generation).
*   **Middleware :** `middleware.ts` intercepte les requêtes pour vérifier l'authentification (NextAuth) et les permissions avant d'atteindre le serveur.

### ✅ Validation (Zod)
Toutes les données entrantes (API ou Formulaires) sont validées strictement.
*   **Schémas :** Définis dans `lib/validations/`.
*   **Exemple :**
    ```typescript
    const reclamationSchema = z.object({
      titre: z.string().min(10, "Le titre est trop court"),
      communeId: z.number().int(),
      // ...
    });
    ```
*   **Type Inference :** TypeScript déduit automatiquement les types depuis les schémas Zod (`z.infer<typeof schema>`).

---

## 4. BASE DE DONNÉES & ORM

### 🐘 PostgreSQL (via Docker)
Base de données relationnelle robuste, choisie pour sa fiabilité et sa gestion spatiale (PostGIS possible).
*   **Version :** 16-alpine (Production).
*   **Hébergement :** Conteneur Docker avec volume persistant.

### 💎 Prisma ORM (v7.1.0)
Couche d'abstraction type-safe entre le code et la DB.
*   **Schema (`prisma/schema.prisma`) :** Fichier unique définissant les modèles (User, Reclamation, Commune...).
*   **Relations :** Gestion claire des relations One-to-Many (Province -> Communes) et Many-to-Many.
*   **Migrations :** Gestionnaire de version de la DB (`prisma migrate`).
*   **Seeding :** Scripts (`seed-real-data.ts`) pour peupler la base avec les 500+ établissements réels.
*   **Prisma Client :** Singleton pattern utilisé dans `lib/db.ts` pour éviter l'épuisement des connexions en dev (Hot Reload).

---

## 5. AUTHENTIFICATION & SÉCURITÉ

### 🔐 NextAuth.js (v4)
Solution complète d'authentification.
*   **Provider :** `CredentialsProvider` personnalisé pour vérifier email/mot de passe hashé.
*   **Stratégie :** JWT (Stateless). Le token contient les infos essentielles (ID, Rôle) pour éviter les appels DB sur chaque page.
*   **Configuration :** `lib/auth/config.ts`.
*   **Securité 2FA :** Implémentation custom (`otplib`) par dessus NextAuth. Requis pour les Admins.

### 🛡️ Mesures de Sécurité Actives
*   **Bcrypt :** Hachage fort des mots de passe.
*   **Rate Limiting :** Protection contre Bruteforce sur le login.
*   **Account Locking :** Blocage temporaire après 5 échecs.
*   **Logs d'activité :** Table `ActivityLog` traçant toutes les actions critiques.
*   **Headers HTTP :** HSTS, X-Frame-Options, CSP configurés dans `next.config.mjs`.

---

## 6. INFRASTRUCTURE & DEVOPS

### 🐳 Docker & Docker Compose
L'application est entièrement conteneurisée pour garantir la portabilité (Dev = Prod).
*   **Dockerfile :** Build "Multi-stage" pour optimiser la taille de l'image finale (< 300Mo) et sécuriser (utilisateur non-root).
*   **Docker Compose :** Orchestre les services `app`, `postgres`, `nginx`, `redis`.
*   **Mode Standalone :** Next.js compilé en mode standalone pour ne déployer que le nécessaire (pas de `node_modules` massifs).

### 🌐 Nginx (Reverse Proxy)
Frontal web gérant :
*   Terminaison SSL/TLS.
*   Compression Gzip.
*   Cache des assets statiques.
*   Protection basique (Rate limiting IP).

### 🧪 Tests & Qualité
*   **Unitaires :** Jest + React Testing Library.
*   **E2E (End-to-End) :** Playwright (Scénarios critiques : Login, Création Réclamation).
*   **Monitoring :** Sentry intégré (Front & Back) pour le tracking d'erreurs en temps réel.

---

## 7. OUTILS DE DÉVELOPPEMENT & QUALITÉ

*   **TypeScript :** Mode `strict` activé. Typage fort de bout en bout (DB -> API -> Front).
*   **ESLint / Prettier :** Standardisation du code. Règles Next.js Core Web Vitals activées.
*   **Husky (implied) :** Hooks git pour vérifier le code avant commit (Linting).
*   **VS Code :** Configuration recommandée (`extensions.json`, `settings.json`) pour l'équipe (Tailwind IntelliSense, Prettier).

---

## 8. COMPARATIF ET JUSTIFICATION DES CHOIX

| Domaine | Choix Actuel | Alternative | Pourquoi ce choix ? |
| :--- | :--- | :--- | :--- |
| **Framework** | **Next.js** | Remix / Vite | Écosystème riche, Server Actions simplifiant le backend, SSR natif excellent pour le SEO gouvernemental. |
| **UI Lib** | **Shadcn/ui** | Material I (MUI) | Plus léger, pas de "Vendor Lock-in", design plus moderne et personnalisable aisément. |
| **ORM** | **Prisma** | Drizzle / TypeORM | Expérience développeur (DX) supérieure, typage auto-généré parfait, migrations stables. |
| **Auth** | **NextAuth** | Clerk / Auth0 | Souveraineté des données (Self-hosted), gratuit, flexibilité totale du flow de connexion. |
| **Maps** | **Mapbox** | Google Maps | Meilleur rapport qualité/prix, cartes vectorielles plus esthétiques et performantes. |

---

## 9. GRAPHE DE DÉPENDANCES (PRINCIPALES)

Vue conceptuelle de l'architecture logicielle :

```ascii
APP (Next.js)
├── UI Layer
│   ├── React 18
│   ├── Tailwind CSS (Styling)
│   ├── Framer Motion (Animation)
│   ├── Lucide React (Icons)
│   ├── Recharts (Dataviz)
│   └── Radix UI (Headless Primitives)
│
├── Logic Layer
│   ├── Zod (Validation)
│   ├── React Hook Form (Forms)
│   ├── Date-fns (Utils)
│   └── NextAuth.js (Security Logic)
│
├── Data Layer
│   ├── Prisma Client (ORM)
│   └── PostgreSQL (Driver pg)
│
└── Infrastructure (Dev/Build)
    ├── TypeScript (Compiler)
    ├── ESLint/Prettier (Linter)
    ├── Jest/Playwright (Tests)
    └── Docker (Containerization)
```

---

## 10. ANALYSE DE LA TAILLE DU BUNDLE (PERFORMANCE)

L'application utilise plusieurs stratégies pour maintenir un poids minimal :

1.  **Code Splitting Automatique :** Next.js découpe automatiquement le JS par route. Une page "Admin" n'est pas chargée pour un "Citoyen".
2.  **Server Components :** Tout le code serveur (Prisma, Zod validation backend, Hash password) ne quitte **jamais** le serveur. Cela réduit drastiquement le JS envoyé au navigateur (Zéro Ko pour la logique DB).
3.  **Optimisation des Imports :**
    *   `lucide-react` et `framer-motion` sont configurés dans `next.config.mjs` (`optimizePackageImports`) pour ne bundler que les icônes/fonctions réellement utilisées (Tree Shaking).
4.  **Images & Fonts :**
    *   `next/image` redimensionne et convertit les images en WebP/AVIF à la volée.
    *   `next/font` héberge les polices Google localement au build time (pas de requête externe bloquante).
5.  **Taille estimée (Build Production) :**
    *   JS Initial (Global) : ~80-100 KB (React + Framework).
    *   Pages simples (Login) : +5-10 KB.
    *   Pages complexes (Dashboard) : +30-50 KB (Recharts est lourd, mais lazy-loaded).

---

## 11. ANALYSE DES VERSIONS & OBSOLESCENCE

*   ✅ **Next.js 14.2** : Version stable et mature. La v15 est sortie mais nous restons sur la 14 pour la stabilité prod immédiate.
*   ✅ **React 18** : Standard actuel.
*   ✅ **NextAuth v4** : La v5 (Auth.js) est en beta/rc. Migration prévue Q2 2026 une fois stable.
*   ✅ **Prisma v7** : Dernière version majeure, très performante.

---

## 12. RESSOURCES D'APPRENTISSAGE

Pour les nouveaux développeurs rejoignant le projet :

1.  **Next.js App Router :** [Documentation Officielle](https://nextjs.org/docs) (Focus sur Server Components).
2.  **Tailwind CSS :** [Cheat Sheet](https://nerdcave.com/tailwind-cheat-sheet).
3.  **Prisma :** [Guide Data Modeling](https://www.prisma.io/docs/concepts/components/prisma-schema).
4.  **Zod :** [Tutoriel Validation](https://zod.dev/).
5.  **Projet Interne :** Lire le `USER_GUIDE.md` pour comprendre le métier avant le code.

---
*Fin du rapport technique.*
