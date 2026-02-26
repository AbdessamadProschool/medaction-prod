# 🚀 Guide de Déploiement - Portail MedAction

> Guide complet pour déployer l'application MedAction sur votre serveur de production.

---

## 📋 Table des Matières

1. [Prérequis](#-prérequis)
2. [Préparation du Serveur](#-préparation-du-serveur)
3. [Installation Docker](#-installation-docker)
4. [Transfert des Fichiers](#-transfert-des-fichiers)
5. [Configuration de l'Application](#-configuration-de-lapplication)
6. [Déploiement](#-déploiement)
7. [Configuration SSL/HTTPS](#-configuration-sslhttps)
8. [Vérification](#-vérification)
9. [Maintenance](#-maintenance)

---

## 🔧 Prérequis

### Serveur Recommandé

| Composant | Minimum | Recommandé |
|-----------|---------|------------|
| **CPU** | 2 vCPU | 4 vCPU |
| **RAM** | 4 Go | 8 Go |
| **Stockage** | 40 Go SSD | 100 Go SSD |
| **OS** | Ubuntu 22.04 LTS | Ubuntu 24.04 LTS |
| **Réseau** | IP publique | IP fixe + nom de domaine |

### Ports à Ouvrir

| Port | Service | Description |
|------|---------|-------------|
| 22 | SSH | Accès administration |
| 80 | HTTP | Redirection HTTPS |
| 443 | HTTPS | Application web |

---

## 🖥️ Préparation du Serveur

### 1. Connexion SSH

```bash
ssh root@VOTRE_IP_SERVEUR
```

### 2. Mise à jour du système

```bash
apt update && apt upgrade -y
apt install -y curl wget git nano htop unzip
```

### 3. Créer un utilisateur dédié (recommandé)

```bash
# Créer l'utilisateur
adduser medaction

# Ajouter aux groupes sudo et docker
usermod -aG sudo medaction

# Passer sur cet utilisateur
su - medaction
```

---

## 🐳 Installation Docker

### 1. Installer Docker

```bash
# Script officiel Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Ajouter l'utilisateur au groupe docker
sudo usermod -aG docker $USER

# Redémarrer la session
exit
su - medaction
```

### 2. Installer Docker Compose

```bash
# Docker Compose est inclus dans les versions récentes
docker compose version

# Si absent, installer manuellement:
sudo apt install -y docker-compose-plugin
```

### 3. Vérifier l'installation

```bash
docker --version
docker compose version
```

---

## 📦 Transfert des Fichiers

### ⭐ MÉTHODE RECOMMANDÉE : Transférer l'image Docker (Plus rapide et sécurisé)

Cette méthode transfère l'image Docker pré-construite directement sur le serveur.

#### Étape 1 : Sur votre PC Windows (PowerShell)

```powershell
# Aller dans le dossier du projet
cd C:\Users\Proschool\Desktop\ABDESSAMAD\TEAMACTION\medaction

# Exporter l'image Docker (déjà fait, ~166 Mo)
docker save medaction-app:latest -o medaction-app.tar

# Transférer l'image vers le serveur via SCP (chiffré)
scp medaction-app.tar medaction@VOTRE_IP:/home/medaction/

# Transférer les fichiers de configuration nécessaires
scp docker-compose.yml medaction@VOTRE_IP:/home/medaction/medaction/
scp nginx.conf medaction@VOTRE_IP:/home/medaction/medaction/
scp .env.example medaction@VOTRE_IP:/home/medaction/medaction/
scp -r prisma medaction@VOTRE_IP:/home/medaction/medaction/
```

#### Étape 2 : Sur le serveur (SSH)

```bash
# Se connecter au serveur
ssh medaction@VOTRE_IP_SERVEUR

# Créer le dossier de l'application
mkdir -p /home/medaction/medaction
cd /home/medaction

# Charger l'image Docker
docker load -i medaction-app.tar

# Vérifier que l'image est chargée
docker images | grep medaction
```

---

### Alternative : Transférer tout le projet (Si besoin de modifier le code)

```powershell
# Sur Windows - Compresser le projet
cd C:\Users\Proschool\Desktop\ABDESSAMAD\TEAMACTION\medaction
Compress-Archive -Path * -DestinationPath medaction.zip -Force

# Transférer
scp medaction.zip medaction@VOTRE_IP:/home/medaction/
```

```bash
# Sur le serveur - Extraire
cd /home/medaction
unzip medaction.zip -d medaction
cd medaction

# Construire l'image (5-10 minutes)
docker compose build app --no-cache
```

---

## ⚙️ Configuration de l'Application

### 1. Créer le fichier `.env`

```bash
cd /home/medaction/medaction

# Copier le template
cp .env.example .env

# Éditer la configuration
nano .env
```

### 2. Variables importantes à modifier

```env
# ====== BASE DE DONNÉES ======
POSTGRES_USER=medaction
POSTGRES_PASSWORD=VOTRE_MOT_DE_PASSE_SECURISE
POSTGRES_DB=medaction
DATABASE_URL=postgresql://medaction:VOTRE_MOT_DE_PASSE_SECURISE@postgres:5432/medaction

# ====== AUTHENTIFICATION ======
NEXTAUTH_URL=https://VOTRE_DOMAINE.com
NEXTAUTH_SECRET=GENERER_AVEC_openssl_rand_base64_32

# ====== LICENCE ======
LICENSE_KEY=MED-0D84-C0A3-3DF4-C9AF
LICENSE_DOMAINS=VOTRE_DOMAINE.com,www.VOTRE_DOMAINE.com
LICENSE_EXPIRY=2026-12-25

# ====== OPTIONNEL ======
MOBILE_API_KEY=GENERER_AVEC_openssl_rand_hex_32
```

### 3. Générer les secrets

```bash
# Générer NEXTAUTH_SECRET
openssl rand -base64 32

# Générer MOBILE_API_KEY
openssl rand -hex 32

# Générer mot de passe PostgreSQL
openssl rand -base64 24
```

---

## 🚀 Déploiement

### 1. Démarrer les services (avec image pré-chargée)

```bash
cd /home/medaction/medaction

# Démarrer PostgreSQL + App
docker compose up -d

# Vérifier que tout fonctionne
docker compose ps
```

### 2. Initialiser la base de données

```bash
# Appliquer les migrations Prisma
docker compose exec app npx prisma db push

# Vérifier les tables
docker compose exec postgres psql -U medaction -d medaction -c "\dt"
```

### 4. Créer le Super Admin

```bash
# Exécuter le script SQL
docker compose exec -T postgres psql -U medaction -d medaction << 'EOF'
INSERT INTO "User" (
  email, 
  "motDePasse", 
  nom, 
  prenom, 
  role, 
  "isActive", 
  "isEmailVerifie", 
  "createdAt", 
  "updatedAt"
) VALUES (
  'admin@medaction.gov.ma',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.OLnOFcGnphMFJ.',
  'Admin',
  'Super',
  'SUPER_ADMIN',
  true,
  true,
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;
EOF
```

> **Mot de passe par défaut :** `Admin123!` - **Changez-le immédiatement après connexion !**

---

## 🔒 Configuration SSL/HTTPS

### Option A: Avec Certbot (Let's Encrypt) - Recommandé

#### 1. Installer Certbot

```bash
sudo apt install -y certbot
```

#### 2. Obtenir le certificat

```bash
# Arrêter temporairement nginx
docker compose stop nginx

# Obtenir le certificat
sudo certbot certonly --standalone -d VOTRE_DOMAINE.com -d www.VOTRE_DOMAINE.com

# Copier les certificats
sudo mkdir -p ssl
sudo cp /etc/letsencrypt/live/VOTRE_DOMAINE.com/fullchain.pem ssl/
sudo cp /etc/letsencrypt/live/VOTRE_DOMAINE.com/privkey.pem ssl/
sudo chown -R $USER:$USER ssl/
```

#### 3. Mettre à jour nginx.conf

```nginx
server {
    listen 80;
    server_name VOTRE_DOMAINE.com www.VOTRE_DOMAINE.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name VOTRE_DOMAINE.com www.VOTRE_DOMAINE.com;

    ssl_certificate /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;

    location / {
        proxy_pass http://app:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### 4. Redémarrer avec SSL

```bash
docker compose up -d nginx
```

---

## ✅ Vérification

### 1. Vérifier les logs

```bash
# Voir les logs en temps réel
docker compose logs -f app

# Logs PostgreSQL
docker compose logs -f postgres
```

### 2. Tester l'accès

| URL | Résultat attendu |
|-----|------------------|
| `https://VOTRE_DOMAINE.com` | Page d'accueil |
| `https://VOTRE_DOMAINE.com/login` | Page de connexion |
| `https://VOTRE_DOMAINE.com/api/health` | `{"status":"ok"}` |

### 3. Test de connexion

1. Allez sur `https://VOTRE_DOMAINE.com/login`
2. Email: `admin@medaction.gov.ma`
3. Mot de passe: `Admin123!`
4. **Changez immédiatement le mot de passe !**

---

## 🔧 Maintenance

### Commandes Utiles

```bash
# Voir le statut des containers
docker compose ps

# Redémarrer l'application
docker compose restart app

# Arrêter tout
docker compose down

# Démarrer tout
docker compose up -d

# Voir les logs
docker compose logs -f app

# Mise à jour
git pull
docker compose build app
docker compose up -d app
```

### Sauvegarde Automatique

```bash
# Créer le dossier de backups
mkdir -p /home/medaction/backups

# Script de backup quotidien
cat << 'EOF' > /home/medaction/backup.sh
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
docker compose exec -T postgres pg_dump -U medaction medaction > /home/medaction/backups/backup_$DATE.sql
find /home/medaction/backups -name "*.sql" -mtime +7 -delete
EOF

chmod +x /home/medaction/backup.sh

# Ajouter au cron (tous les jours à 2h)
(crontab -l 2>/dev/null; echo "0 2 * * * /home/medaction/backup.sh") | crontab -
```

### Restaurer une sauvegarde

```bash
docker compose exec -T postgres psql -U medaction medaction < /home/medaction/backups/backup_XXXXXXXX.sql
```

---

## 🆘 Dépannage

### L'application ne démarre pas

```bash
docker compose logs app
docker compose logs postgres
```

### Erreur "Database connection failed"

```bash
docker compose exec app printenv | grep DATABASE
docker compose exec postgres pg_isready
```

### Erreur de licence

```bash
docker compose exec app printenv | grep LICENSE
node scripts/generate-license.js
```

---

**Bonne installation ! 🎉**
