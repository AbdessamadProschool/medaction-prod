# 🚢 Guide de Déploiement

Ce guide couvre le déploiement de MedAction en production.

## 📋 Prérequis de Production

- Base de données PostgreSQL (14+)
- Node.js 18+ ou conteneur Docker
- Certificat SSL
- Nom de domaine

---

## 🚀 Option 1 : Vercel (Recommandé)

### Avantages
- Déploiement automatique depuis Git
- SSL automatique
- CDN global
- Serverless functions
- Analytics intégré

### Étapes

#### 1. Créer un Compte Vercel

Aller sur [vercel.com](https://vercel.com) et se connecter avec GitHub.

#### 2. Importer le Projet

```bash
# Installer Vercel CLI
npm i -g vercel

# Se connecter
vercel login

# Déployer
vercel
```

Ou via l'interface web : "Import Project" → Sélectionner le repo GitHub.

#### 3. Configurer les Variables d'Environnement

Dans Vercel Dashboard → Settings → Environment Variables :

```bash
DATABASE_URL=postgresql://user:pass@host:5432/db
NEXTAUTH_URL=https://votre-domaine.com
NEXTAUTH_SECRET=votre_secret_production
NEXT_PUBLIC_MAPBOX_TOKEN=pk.xxxxx
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx
SENTRY_DSN=https://xxxxx
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

#### 4. Base de Données

Options PostgreSQL compatibles Vercel :
- **Vercel Postgres** (intégré)
- **Neon** (serverless PostgreSQL)
- **Supabase**
- **Railway**

```bash
# Exemple avec Neon
DATABASE_URL="postgresql://user:pass@ep-xxx.neon.tech/medaction?sslmode=require"
```

#### 5. Déployer

```bash
# Déploiement production
vercel --prod
```

---

## 🐳 Option 2 : Docker

### Dockerfile

```dockerfile
# Dockerfile
FROM node:18-alpine AS base

# Installer les dépendances
FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Builder
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Générer Prisma
RUN npx prisma generate

# Build Next.js
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# Runner
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma

USER nextjs

EXPOSE 3000
ENV PORT 3000

CMD ["node", "server.js"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/medaction
      - NEXTAUTH_URL=http://localhost:3000
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: postgres:15-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=medaction
    ports:
      - "5432:5432"
    restart: unless-stopped

volumes:
  postgres_data:
```

### Déployer avec Docker

```bash
# Build l'image
docker build -t medaction .

# Lancer avec docker-compose
docker-compose up -d

# Appliquer les migrations
docker-compose exec app npx prisma migrate deploy
```

---

## ☁️ Option 3 : Railway

### Étapes

1. Aller sur [railway.app](https://railway.app)
2. "New Project" → "Deploy from GitHub"
3. Sélectionner le repo
4. Ajouter un service PostgreSQL
5. Configurer les variables d'environnement

```bash
# Railway configure automatiquement DATABASE_URL
NEXTAUTH_URL=https://votre-app.railway.app
NEXTAUTH_SECRET=votre_secret
```

---

## 🌐 Option 4 : VPS (DigitalOcean, AWS EC2, OVH)

### 1. Préparer le Serveur

```bash
# Mettre à jour le système
sudo apt update && sudo apt upgrade -y

# Installer Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Installer PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Installer Nginx
sudo apt install -y nginx

# Installer PM2
sudo npm install -g pm2
```

### 2. Configurer PostgreSQL

```bash
sudo -u postgres psql

CREATE USER medaction WITH PASSWORD 'secure_password';
CREATE DATABASE medaction OWNER medaction;
GRANT ALL PRIVILEGES ON DATABASE medaction TO medaction;
\q
```

### 3. Cloner et Builder

```bash
cd /var/www
git clone https://github.com/votre-org/medaction.git
cd medaction

# Installer les dépendances
npm ci

# Configurer l'environnement
cp .env.example .env
nano .env  # Modifier les variables

# Générer Prisma et migrer
npx prisma generate
npx prisma migrate deploy

# Build
npm run build
```

### 4. Configurer PM2

```bash
# Créer ecosystem.config.js
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'medaction',
    script: 'npm',
    args: 'start',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}
EOF

# Démarrer l'application
pm2 start ecosystem.config.js

# Sauvegarder et activer au démarrage
pm2 save
pm2 startup
```

### 5. Configurer Nginx

```nginx
# /etc/nginx/sites-available/medaction
server {
    listen 80;
    server_name votre-domaine.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Activer le site
sudo ln -s /etc/nginx/sites-available/medaction /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 6. SSL avec Certbot

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d votre-domaine.com
```

---

## 📊 Monitoring en Production

### Health Check

```bash
# Endpoint de monitoring
curl https://votre-domaine.com/api/health
```

### Sentry (Errors)

Configurer dans `.env` :
```bash
NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
```

### Uptime Monitoring

Configurer UptimeRobot ou Better Uptime pour monitorer `/api/health`.

---

## 🔄 CI/CD avec GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

---

## ✅ Checklist Pré-Production

- [ ] Variables d'environnement configurées
- [ ] Base de données migrée
- [ ] SSL configuré
- [ ] Sentry configuré
- [ ] Google Analytics configuré
- [ ] Backups base de données
- [ ] Monitoring uptime
- [ ] Rate limiting vérifié
- [ ] Tests E2E passés
- [ ] DNS configuré

---

## 🆘 Rollback

### Vercel

```bash
# Lister les déploiements
vercel ls

# Rollback vers un déploiement précédent
vercel rollback [deployment-id]
```

### Docker

```bash
docker-compose down
docker-compose up -d --build
```

### VPS

```bash
cd /var/www/medaction
git fetch origin
git checkout [commit-hash]
npm run build
pm2 restart medaction
```

---

**Support :** Contacter l'équipe DevOps pour toute assistance.
