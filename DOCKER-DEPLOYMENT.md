# 🐳 MedAction - Guide de Déploiement Docker

Province de Médiouna - Portail Citoyen

---

## 📋 Prérequis

- Docker >= 24.0
- Docker Compose >= 2.20
- 2GB RAM minimum
- 10GB espace disque

---

## 🚀 Démarrage Rapide

### 1. Configuration

```bash
# Copier le fichier d'environnement
cp .env.example .env

# Éditer les variables (OBLIGATOIRE)
nano .env
```

**Variables requises :**
```env
# Générer avec: openssl rand -base64 32
NEXTAUTH_SECRET=votre_secret_32_caracteres

# Base de données
POSTGRES_USER=medaction
POSTGRES_PASSWORD=mot_de_passe_fort_2024
POSTGRES_DB=medaction
```

### 2. Build & Démarrage

```bash
# Build de l'image
./scripts/build.sh

# Démarrer les services
docker-compose up -d

# Vérifier le statut
docker-compose ps
```

### 3. Vérification

```bash
# Health check
curl http://localhost:3000/api/health

# Voir les logs
docker-compose logs -f app
```

---

## 📦 Architecture Docker

```
┌─────────────────────────────────────────────────────────────┐
│                         NGINX                                │
│                    (Port 80/443)                            │
│                   [Profile: production]                     │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                    NEXT.JS APP                              │
│                    (Port 3000)                              │
│                 medaction-app                               │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                    POSTGRESQL                               │
│                  (Port 5432 local)                          │
│                 medaction-postgres                          │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 Commandes Utiles

### Services

```bash
# Démarrer tous les services
docker-compose up -d

# Avec Nginx (production)
docker-compose --profile production up -d

# Avec Adminer (dev)
docker-compose --profile dev up -d

# Arrêter
docker-compose down

# Arrêter et supprimer les volumes
docker-compose down -v
```

### Logs

```bash
# Tous les logs
docker-compose logs -f

# Logs de l'application
docker-compose logs -f app

# Logs de la base de données
docker-compose logs -f postgres
```

### Base de Données

```bash
# Exécuter les migrations
docker-compose exec app npx prisma migrate deploy

# Ouvrir Prisma Studio
docker-compose exec app npx prisma studio

# Shell PostgreSQL
docker-compose exec postgres psql -U medaction

# Backup
./scripts/backup.sh

# Restore
gunzip -c backups/medaction_YYYYMMDD_HHMMSS.sql.gz | \
  docker-compose exec -T postgres psql -U medaction medaction
```

### Debug

```bash
# Shell dans le container app
docker-compose exec app sh

# Vérifier les variables d'environnement
docker-compose exec app env | grep -E 'DATABASE|NEXT'

# Tester la connexion DB
docker-compose exec app npx prisma db pull
```

---

## 🏭 Déploiement Production

### 1. Configuration SSL

```bash
# Créer le dossier des certificats
mkdir -p certs

# Copier vos certificats
cp /path/to/fullchain.pem certs/
cp /path/to/privkey.pem certs/
```

### 2. Variables de Production

```env
# .env
NODE_ENV=production
NEXTAUTH_URL=https://mediouna-action.gov.ma
NEXTAUTH_SECRET=secret_tres_long_et_complexe_32_chars
POSTGRES_PASSWORD=mot_de_passe_tres_fort_production
```

### 3. Démarrer avec Nginx

```bash
docker-compose --profile production up -d
```

---

## 📊 Monitoring

### Health Check

```bash
# Simple
curl http://localhost:3000/api/health

# Détaillé
curl -s http://localhost:3000/api/health | jq
```

**Réponse attendue :**
```json
{
  "status": "healthy",
  "timestamp": "2024-12-18T...",
  "version": "1.0.0",
  "uptime": 3600,
  "checks": {
    "database": { "status": "healthy", "latency": 5 },
    "memory": { "status": "ok", "percentage": 45 }
  }
}
```

### Ressources

```bash
# Utilisation CPU/RAM
docker stats

# Espace disque des volumes
docker system df -v
```

---

## 🔐 Sécurité

### Checklist

- [ ] NEXTAUTH_SECRET de 32+ caractères
- [ ] POSTGRES_PASSWORD complexe
- [ ] Ports DB non exposés publiquement
- [ ] HTTPS activé en production
- [ ] Certificats SSL valides
- [ ] Backups automatisés

### Scan de Vulnérabilités

```bash
# Docker Scout
docker scout quickview medaction:latest

# Trivy
trivy image medaction:latest
```

---

## 🆘 Dépannage

### Container ne démarre pas

```bash
# Voir les logs détaillés
docker-compose logs app

# Vérifier la config
docker-compose config
```

### Erreur de connexion DB

```bash
# Vérifier que PostgreSQL est prêt
docker-compose exec postgres pg_isready

# Tester la connexion
docker-compose exec app npx prisma db pull
```

### Mémoire insuffisante

```bash
# Augmenter les limits dans docker-compose.yml
deploy:
  resources:
    limits:
      memory: 2G
```

---

## 📞 Support

Province de Médiouna
- Email: support@mediouna.gov.ma
- Site: https://mediouna-action.gov.ma

---

*Documentation générée pour MedAction v1.0.0*
