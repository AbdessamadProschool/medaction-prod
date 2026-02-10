# 🏛️ MedAction - Province de Médiouna

<div align="center">

![Portail Mediouna Logo](public/images/logo-portal-mediouna.png)

**Plateforme Citoyenne de la Province de Médiouna**

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)

[📖 Documentation](#documentation) • [🚀 Démarrage Rapide](#-démarrage-rapide) • [🔧 Configuration](#-configuration) • [📡 API](#-api)

</div>

---

## 📋 Table des Matières

- [À Propos](#-à-propos)
- [Fonctionnalités](#-fonctionnalités)
- [Architecture](#-architecture)
- [Démarrage Rapide](#-démarrage-rapide)
- [Configuration](#-configuration)
- [Scripts NPM](#-scripts-npm)
- [Structure du Projet](#-structure-du-projet)
- [API](#-api)
- [Tests](#-tests)
- [Déploiement](#-déploiement)
- [Contribution](#-contribution)
- [Licence](#-licence)

---

## 🎯 À Propos

**MedAction** est une plateforme citoyenne développée pour la Province de Médiouna au Maroc. Elle permet aux citoyens de :

- 📝 **Soumettre des réclamations** concernant les services publics
- ⭐ **Évaluer les établissements** publics (écoles, hôpitaux, services administratifs)
- 📅 **Consulter les événements** locaux
- 📰 **Accéder aux actualités** de la province
- 💡 **Proposer des suggestions** d'amélioration
- 🎨 **Découvrir les talents** locaux

### Rôles Utilisateurs

| Rôle | Description |
|------|-------------|
| **Citoyen** | Utilisateur standard, peut soumettre et suivre ses réclamations |
| **Autorité Locale** | Responsable du traitement des réclamations de sa commune |
| **Délégation** | Gère les activités de son secteur (événements, articles, campagnes, actualités) |
| **Gouverneur** | Vue globale et statistiques sur toute la province |
| **Admin** | Administration complète de la plateforme |

---

## ✨ Fonctionnalités

### 🏠 Portail Public
- Page d'accueil interactive avec carte
- Liste des établissements filtrables
- Calendrier des événements
- Actualités et campagnes

### 📝 Gestion des Réclamations
- Formulaire multi-étapes avec upload de photos
- Géolocalisation sur carte
- Suivi en temps réel du statut
- Historique complet des actions

### 👤 Espace Citoyen
- Tableau de bord personnalisé
- Liste de ses réclamations
- Notifications en temps réel
- Gestion du profil

### 🏢 Dashboards Administratifs
- **Délégation** : Gestion des événements, articles, campagnes
- **Autorité Locale** : Traitement des réclamations
- **Admin** : Gestion complète (utilisateurs, établissements, rapports)
- **Gouverneur** : Statistiques provinciales

### 🔒 Sécurité
- Authentification NextAuth.js
- Gestion des rôles et permissions
- Rate limiting
- Audit logs

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                              │
│                   (Next.js 15 App Router)                   │
├─────────────────────────────────────────────────────────────┤
│                     API Routes                               │
│                   (/app/api/*)                              │
├─────────────────────────────────────────────────────────────┤
│                    Prisma ORM                                │
├─────────────────────────────────────────────────────────────┤
│                   PostgreSQL                                 │
└─────────────────────────────────────────────────────────────┘
```

### Stack Technologique

| Catégorie | Technologies |
|-----------|-------------|
| **Frontend** | Next.js 15, React 19, TypeScript, Tailwind CSS |
| **Backend** | Next.js API Routes, Prisma ORM |
| **Database** | PostgreSQL |
| **Auth** | NextAuth.js v5, bcrypt |
| **UI** | Framer Motion, Lucide Icons, Recharts |
| **Maps** | Mapbox GL JS |
| **Testing** | Jest, Playwright |
| **Monitoring** | Sentry, Google Analytics |

---

## 🚀 Démarrage Rapide

### Prérequis

- **Node.js** >= 18.0
- **npm** >= 9.0
- **PostgreSQL** >= 14
- **Git**

### Installation

```bash
# 1. Cloner le repository
git clone https://github.com/votre-org/medaction.git
cd medaction

# 2. Installer les dépendances
npm install

# 3. Configurer les variables d'environnement
cp .env.example .env
# Modifier .env avec vos valeurs

# 4. Générer le client Prisma
npx prisma generate

# 5. Appliquer les migrations
npx prisma migrate dev

# 6. (Optionnel) Seed la base de données
npx prisma db seed

# 7. Lancer le serveur de développement
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000)

---

## ⚙️ Configuration

### Variables d'Environnement

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/medaction"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"
JWT_MAX_AGE=86400

# Mapbox
NEXT_PUBLIC_MAPBOX_TOKEN="your-mapbox-token"

# Sentry (Production)
NEXT_PUBLIC_SENTRY_DSN=""
SENTRY_DSN=""

# Google Analytics
NEXT_PUBLIC_GA_ID=""

# Logging
LOG_LEVEL="info"
```

### Configuration Base de Données

```bash
# Créer la base de données
createdb medaction

# Appliquer les migrations
npx prisma migrate deploy

# Visualiser la DB
npx prisma studio
```

---

## 📜 Scripts NPM

| Script | Description |
|--------|-------------|
| `npm run dev` | Lancer en mode développement |
| `npm run build` | Build de production |
| `npm start` | Lancer le build de production |
| `npm run lint` | Vérifier le code avec ESLint |
| `npm run format` | Formater avec Prettier |
| `npm test` | Lancer les tests Jest |
| `npm run test:watch` | Tests en mode watch |
| `npm run test:coverage` | Rapport de couverture |
| `npm run e2e` | Tests E2E Playwright |
| `npm run e2e:ui` | Playwright mode interactif |

---

## 📁 Structure du Projet

```
medaction/
├── app/                      # App Router Next.js
│   ├── (main)/              # Routes publiques
│   │   ├── etablissements/  # Pages établissements
│   │   ├── evenements/      # Pages événements
│   │   ├── reclamations/    # Création réclamation
│   │   └── profil/          # Espace utilisateur
│   ├── admin/               # Dashboard admin
│   ├── autorite/            # Dashboard autorité locale
│   ├── delegation/          # Dashboard délégation
│   ├── gouverneur/          # Dashboard gouverneur
│   ├── api/                 # API Routes
│   │   ├── auth/           # Authentification
│   │   ├── etablissements/ # CRUD établissements
│   │   ├── reclamations/   # CRUD réclamations
│   │   ├── evenements/     # CRUD événements
│   │   └── health/         # Health check
│   ├── login/               # Page connexion
│   ├── register/            # Page inscription
│   └── layout.tsx           # Layout racine
├── components/              # Composants React
│   ├── ui/                  # Composants UI réutilisables
│   ├── layout/              # Header, Footer, Sidebar
│   ├── home/                # Sections page d'accueil
│   ├── reclamations/        # Composants réclamations
│   ├── etablissements/      # Composants établissements
│   └── admin/               # Composants admin
├── lib/                     # Utilitaires
│   ├── db.ts               # Client Prisma
│   ├── auth/               # Config NextAuth
│   ├── validations/        # Schémas Zod
│   ├── logger.ts           # Système de logging
│   └── utils.ts            # Fonctions utilitaires
├── prisma/                  # Configuration Prisma
│   ├── schema.prisma       # Schéma de la DB
│   └── seed.ts             # Script de seed
├── public/                  # Fichiers statiques
├── __tests__/              # Tests unitaires Jest
├── e2e/                    # Tests E2E Playwright
└── docs/                   # Documentation
```

---

## 📡 API

### Endpoints Principaux

#### Authentification
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/auth/signin` | Connexion |
| POST | `/api/auth/register` | Inscription |
| GET | `/api/auth/session` | Session courante |

#### Établissements
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/etablissements` | Liste paginée |
| GET | `/api/etablissements/[id]` | Détail |
| POST | `/api/etablissements` | Créer (Admin) |
| PATCH | `/api/etablissements/[id]` | Modifier |

#### Réclamations
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/reclamations` | Liste filtrée |
| GET | `/api/reclamations/[id]` | Détail |
| POST | `/api/reclamations` | Créer |
| PATCH | `/api/reclamations/[id]` | Modifier statut |
| POST | `/api/reclamations/[id]/affecter` | Affecter |

#### Événements
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/evenements` | Liste |
| GET | `/api/evenements/[id]` | Détail |
| POST | `/api/evenements` | Créer |

#### Monitoring
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/health` | Health check |

📄 **Documentation complète** : Voir `/docs/API.md`

---

## 🧪 Tests

### Tests Unitaires (Jest)

```bash
# Lancer tous les tests
npm test

# Mode watch
npm run test:watch

# Avec couverture
npm run test:coverage
```

**Couverture :** 112 tests

### Tests E2E (Playwright)

```bash
# Lancer les tests
npm run e2e

# Mode interactif
npm run e2e:ui

# Avec navigateur visible
npm run e2e:headed
```

**Couverture :** 65 tests

---

## 🚢 Déploiement

Voir le guide complet : [`/docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md)

### Plateformes Recommandées

- **Vercel** (recommandé pour Next.js)
- **Railway** (avec PostgreSQL intégré)
- **DigitalOcean App Platform**
- **AWS Amplify**

### Déploiement Vercel

```bash
# Installer Vercel CLI
npm i -g vercel

# Déployer
vercel
```

---

## 🤝 Contribution

1. Fork le repository
2. Créer une branche (`git checkout -b feature/amazing-feature`)
3. Commit (`git commit -m 'Add amazing feature'`)
4. Push (`git push origin feature/amazing-feature`)
5. Ouvrir une Pull Request

### Standards de Code

- ESLint + Prettier configurés
- Commits conventionnels
- Tests requis pour nouvelles features
- Documentation à jour

---

## 📞 Support

- **Email** : support@medaction.ma
- **Issues** : [GitHub Issues](https://github.com/votre-org/medaction/issues)
- **Documentation** : `/docs`

---

## 📄 Licence

Ce projet est sous licence **MIT**. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

---

<div align="center">

**Développé avec ❤️ pour la Province de Médiouna**

*© 2024 MedAction - Province de Médiouna*

</div>
