# 🛠️ Guide de Setup Développement

Ce guide vous aide à configurer votre environnement de développement pour MedAction.

## 📋 Prérequis

### Logiciels Requis

| Logiciel | Version | Lien |
|----------|---------|------|
| Node.js | >= 18.0 | [nodejs.org](https://nodejs.org/) |
| npm | >= 9.0 | Inclus avec Node.js |
| PostgreSQL | >= 14 | [postgresql.org](https://www.postgresql.org/) |
| Git | >= 2.30 | [git-scm.com](https://git-scm.com/) |
| VS Code | Dernière | [code.visualstudio.com](https://code.visualstudio.com/) |

### Extensions VS Code Recommandées

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "prisma.prisma",
    "bradlc.vscode-tailwindcss",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense"
  ]
}
```

---

## 🚀 Installation Étape par Étape

### 1. Cloner le Projet

```bash
git clone https://github.com/votre-org/medaction.git
cd medaction
```

### 2. Installer les Dépendances

```bash
npm install
```

### 3. Configurer PostgreSQL

#### Option A : Installation Locale

```bash
# Windows (avec chocolatey)
choco install postgresql

# macOS
brew install postgresql

# Linux (Ubuntu/Debian)
sudo apt install postgresql postgresql-contrib
```

#### Créer la Base de Données

```sql
-- Connexion à PostgreSQL
psql -U postgres

-- Créer l'utilisateur
CREATE USER medaction_user WITH PASSWORD 'votre_mot_de_passe';

-- Créer la base de données
CREATE DATABASE medaction OWNER medaction_user;

-- Accorder les privilèges
GRANT ALL PRIVILEGES ON DATABASE medaction TO medaction_user;
```

#### Option B : Docker

```bash
docker run --name medaction-db \
  -e POSTGRES_USER=medaction_user \
  -e POSTGRES_PASSWORD=votre_mot_de_passe \
  -e POSTGRES_DB=medaction \
  -p 5432:5432 \
  -d postgres:15
```

### 4. Configurer les Variables d'Environnement

```bash
# Copier le fichier exemple
cp .env.example .env
```

Modifier `.env` :

```bash
# Database
DATABASE_URL="postgresql://medaction_user:votre_mot_de_passe@localhost:5432/medaction"

# NextAuth (générer avec: openssl rand -base64 32)
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="votre_secret_genere"

# Mapbox (optionnel pour les cartes)
NEXT_PUBLIC_MAPBOX_TOKEN="pk.votre_token_mapbox"
```

### 5. Initialiser Prisma

```bash
# Générer le client Prisma
npx prisma generate

# Appliquer les migrations
npx prisma migrate dev --name init

# (Optionnel) Ouvrir Prisma Studio
npx prisma studio
```

### 6. Seed de la Base de Données (Optionnel)

```bash
npx prisma db seed
```

### 7. Lancer le Serveur

```bash
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000)

---

## 🔧 Configuration IDE

### VS Code Settings

Créer `.vscode/settings.json` :

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "typescript.preferences.importModuleSpecifier": "non-relative",
  "emmet.includeLanguages": {
    "javascript": "javascriptreact",
    "typescript": "typescriptreact"
  },
  "tailwindCSS.experimental.classRegex": [
    ["cn\\(([^)]*)\\)", "'([^']*)'"]
  ]
}
```

### Configuration TypeScript

Le fichier `tsconfig.json` est déjà configuré avec :
- Paths alias (`@/*`)
- Strict mode
- Next.js plugin

---

## 📂 Structure des Fichiers de Configuration

```
medaction/
├── .env                    # Variables d'environnement (local)
├── .env.example           # Template des variables
├── .eslintrc.json         # Configuration ESLint
├── .prettierrc            # Configuration Prettier
├── next.config.js         # Configuration Next.js
├── tailwind.config.ts     # Configuration Tailwind
├── tsconfig.json          # Configuration TypeScript
├── jest.config.js         # Configuration Jest
├── playwright.config.ts   # Configuration Playwright
└── prisma/
    └── schema.prisma      # Schéma de la base de données
```

---

## 🧪 Workflow de Développement

### 1. Créer une Branche

```bash
git checkout -b feature/ma-nouvelle-feature
```

### 2. Développer

```bash
# Lancer le serveur en mode watch
npm run dev

# Lancer les tests en mode watch
npm run test:watch
```

### 3. Vérifier le Code

```bash
# Linting
npm run lint

# Formatage
npm run format

# Tests
npm test
```

### 4. Commit et Push

```bash
git add .
git commit -m "feat: ajouter ma nouvelle fonctionnalité"
git push origin feature/ma-nouvelle-feature
```

---

## 🐛 Débogage

### Console Navigateur

Les erreurs côté client apparaissent dans la console du navigateur (F12).

### Logs Serveur

Les logs du serveur apparaissent dans le terminal où `npm run dev` est lancé.

### Prisma Studio

```bash
npx prisma studio
```

Ouvre une interface web pour explorer la base de données.

### Debug Mode VS Code

Créer `.vscode/launch.json` :

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js: debug server-side",
      "type": "node-terminal",
      "request": "launch",
      "command": "npm run dev"
    },
    {
      "name": "Next.js: debug client-side",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:3000"
    }
  ]
}
```

---

## 🔄 Mise à Jour des Dépendances

```bash
# Vérifier les mises à jour disponibles
npm outdated

# Mettre à jour les dépendances
npm update

# Mettre à jour Prisma
npx prisma migrate dev
npx prisma generate
```

---

## ❓ Résolution de Problèmes Courants

### Erreur de connexion à la base de données

```bash
# Vérifier que PostgreSQL est lancé
# Windows
net start postgresql-x64-15

# macOS/Linux
sudo service postgresql start
```

### Erreur Prisma "Schema out of sync"

```bash
npx prisma migrate reset
npx prisma generate
```

### Port 3000 déjà utilisé

```bash
# Trouver le processus
netstat -ano | findstr :3000

# Ou utiliser un autre port
PORT=3001 npm run dev
```

### Module not found

```bash
# Nettoyer et réinstaller
rm -rf node_modules
rm package-lock.json
npm install
```

---

## 📚 Ressources

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [NextAuth.js](https://next-auth.js.org)

---

**Besoin d'aide ?** Contactez l'équipe de développement ou ouvrez une issue sur GitHub.
