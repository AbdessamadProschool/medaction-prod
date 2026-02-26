# 🚀 GUIDE DE DÉPLOIEMENT MEDACTION - VERSION PRODUCTION

## Province de Médiouna - Portail Citoyen
**Version :** 1.0.0  
**Dernière mise à jour :** Janvier 2026  
**Testé sur :** Proxmox VE + Debian 12 + Docker

---

## 📋 TABLE DES MATIÈRES

1. [Prérequis](#prérequis)
2. [Préparation Locale (Windows)](#étape-1--préparation-locale-windows)
3. [Build de l'Image Docker](#étape-2--build-de-limage-docker)
4. [Transfert vers le Serveur](#étape-3--transfert-vers-le-serveur)
5. [Configuration du Serveur](#étape-4--configuration-du-serveur)
6. [Déploiement](#étape-5--déploiement)
7. [Restauration des Données](#étape-6--restauration-des-données)
8. [Vérification](#étape-7--vérification)
9. [Dépannage](#dépannage)
10. [Maintenance](#maintenance)

---

## 🔧 PRÉREQUIS

### Sur votre PC Windows :
- ✅ Docker Desktop installé et fonctionnel
- ✅ Node.js 20+ installé
- ✅ WinSCP (pour transfert de fichiers)
- ✅ Accès SSH au serveur

### Sur le Serveur (Debian/Proxmox) :
- ✅ Docker installé (`docker --version`)
- ✅ Docker Compose installé (`docker compose version`)
- ✅ Ports ouverts : **3000** (app), **5432** (PostgreSQL)
- ✅ Utilisateur `medaction` créé avec accès au dossier `/home/medaction`

### Identifiants Serveur :
| Élément | Valeur |
|---------|--------|
| IP Serveur | `192.168.1.100` |
| Utilisateur SSH | `medaction` ou `root` |
| Dossier de travail | `/home/medaction` |
| User PostgreSQL | `medaction` |
| Password PostgreSQL | `medaction_secure_2024` |
| Database | `medaction` |

---

## 📦 ÉTAPE 1 : PRÉPARATION LOCALE (WINDOWS)

### 1.1 Cloner/Ouvrir le projet
```powershell
cd C:\Users\Proschool\Desktop\ABDESSAMAD\TEAMACTION\medaction
```

### 1.2 Vérifier les fichiers critiques

**`prisma/schema.prisma`** - Doit contenir :
```prisma
generator client {
  provider      = "prisma-client-js"
  binaryTargets = ["native", "linux-musl-openssl-3.0.x"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

**`package.json`** - Versions Prisma (IMPORTANT) :
```json
"dependencies": {
  "@prisma/client": "^5.22.0",
  ...
},
"devDependencies": {
  "prisma": "^5.22.0",
  ...
}
```
> ⚠️ **NE PAS utiliser Prisma 7.x** - Incompatible avec le schema actuel

### 1.3 Vérifier docker-compose.server.yml

Créez/vérifiez ce fichier à la racine du projet :
```yaml
# docker-compose.server.yml
services:
  postgres:
    image: postgres:16
    container_name: medaction-postgres
    restart: unless-stopped
    command: postgres -c unix_socket_directories=''
    environment:
      POSTGRES_USER: medaction
      POSTGRES_PASSWORD: medaction_secure_2024
      POSTGRES_DB: medaction
      POSTGRES_HOST_AUTH_METHOD: md5
    volumes:
      - postgres_data_clean:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: [ "CMD-SHELL", "pg_isready -U medaction -h 127.0.0.1" ]
      interval: 10s
      timeout: 5s
      retries: 10
      start_period: 30s
    networks:
      - medaction-network

  app:
    image: medaction-app:latest
    container_name: medaction-app
    restart: unless-stopped
    depends_on:
      postgres:
        condition: service_healthy
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://medaction:medaction_secure_2024@postgres:5432/medaction
      - NEXTAUTH_URL=http://192.168.1.100:3000
      - NEXTAUTH_SECRET=votre_secret_tres_long_et_unique_ici
      - LICENSE_KEY=MED-0D84-C0A3-3DF4-C9AF
      - LICENSE_DOMAINS=localhost,127.0.0.1,192.168.1.100,bo.provincemediouna.ma
      - LICENSE_EXPIRY=2026-12-25
    ports:
      - "3000:3000"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s
    networks:
      - medaction-network

volumes:
  postgres_data_clean:

networks:
  medaction-network:
    driver: bridge
```

> ⚠️ **IMPORTANT** : Changez `NEXTAUTH_URL` avec l'IP réelle de votre serveur !

---

## 🏗️ ÉTAPE 2 : BUILD DE L'IMAGE DOCKER

### 2.1 Ouvrir un terminal PowerShell dans le projet
```powershell
cd C:\Users\Proschool\Desktop\ABDESSAMAD\TEAMACTION\medaction
```

### 2.2 Construire l'image (30 min environ)
```powershell
docker build --no-cache -t medaction-app:security-update .
```

> ✅ Attendez le message `naming to docker.io/library/medaction-app:security-update done`

### 2.3 Exporter l'image en fichier .tar (~250 Mo)
```powershell
docker save -o medaction-app-security-update.tar medaction-app:security-update
```

---

## 📤 ÉTAPE 3 : TRANSFERT VERS LE SERVEUR

### 3.1 Ouvrir WinSCP
- **Protocole :** SFTP
- **Hôte :** `192.168.1.100`
- **Utilisateur :** `medaction` (ou `root`)
- **Mot de passe :** (votre mot de passe)

### 3.2 Transférer les fichiers vers `/home/medaction/`

| Fichier local | Destination serveur |
|---------------|---------------------|
| `medaction-app-security-update.tar` | `/home/medaction/` |
| `docker-compose.server.yml` | `/home/medaction/` |
| `backup.json` (si restauration) | `/home/medaction/` |
| `scripts/json-to-sql.js` | `/home/medaction/` |

---

## ⚙️ ÉTAPE 4 : CONFIGURATION DU SERVEUR

### 4.1 Connexion SSH au serveur
```bash
ssh medaction@192.168.1.100
# ou
ssh root@192.168.1.100
```

> Si erreur "Host key changed" :
> ```bash
> ssh-keygen -R 192.168.1.100
> ```

### 4.2 Vérifier Docker
```bash
docker --version
docker compose version
```

### 4.3 Préparer le dossier
```bash
cd /home/medaction
ls -la
# Vous devez voir : medaction-app-security-update.tar, docker-compose.server.yml
```

---

## 🚀 ÉTAPE 5 : DÉPLOIEMENT

### 5.1 Charger l'image Docker
```bash
docker load -i medaction-app-security-update.tar
```
> ✅ Message attendu : `Loaded image: medaction-app:security-update`

### 5.2 Taguer l'image comme "latest"
```bash
docker tag medaction-app:security-update medaction-app:latest
```

### 5.3 Arrêter l'ancienne version (si existante)
```bash
docker compose -f docker-compose.server.yml down -v
```
> ⚠️ L'option `-v` supprime les volumes. Omettez-la si vous voulez garder les données.

### 5.4 Lancer les conteneurs
```bash
docker compose -f docker-compose.server.yml up -d
```

### 5.5 Vérifier le statut
```bash
docker compose -f docker-compose.server.yml ps
```
> ✅ Les deux conteneurs doivent être "Up" et "healthy"

### 5.6 Appliquer la migration de base de données
```bash
docker exec -e DATABASE_URL="postgresql://medaction:medaction_secure_2024@postgres:5432/medaction" medaction-app npx prisma@5.22.0 db push --skip-generate
```

### 5.7 Fix OpenSSL (si erreur Prisma)
Si vous voyez des erreurs `libssl.so.1.1: No such file`, exécutez :
```bash
docker exec -u root medaction-app sh -c "cd /app/node_modules/.prisma/client && rm -f libquery_engine-linux-musl.so.node && ln -s libquery_engine-linux-musl-openssl-3.0.x.so.node libquery_engine-linux-musl.so.node"
docker compose -f docker-compose.server.yml restart app
```

---

## 💾 ÉTAPE 6 : RESTAURATION DES DONNÉES

### Option A : Depuis un backup JSON (Recommandé)

#### 6.1 Générer le fichier SQL (sur votre PC Windows)
```powershell
node scripts/json-to-sql.js backup.json restore.sql
```

#### 6.2 Transférer `restore.sql` via WinSCP vers `/home/medaction/`

#### 6.3 Importer les données (sur le serveur)
```bash
# Vider les tables existantes (optionnel, si données corrompues)
docker exec medaction-postgres psql -U medaction -h 127.0.0.1 -d medaction -c "TRUNCATE \"Media\", \"Reclamation\", \"Evenement\", \"Article\", \"Actualite\", \"Campagne\", \"Etablissement\", \"User\", \"Annexe\", \"Commune\", \"Permission\", \"SystemSetting\" CASCADE;"

# Importer le backup
docker exec -i medaction-postgres psql -U medaction -h 127.0.0.1 -d medaction < /home/medaction/restore.sql
```

### Option B : Créer un Super Admin vide
Si vous partez d'une base vierge :
```bash
docker exec medaction-postgres psql -U medaction -h 127.0.0.1 -d medaction -c "INSERT INTO \"User\" (\"nom\", \"prenom\", \"email\", \"motDePasse\", \"role\", \"isActive\", \"isEmailVerifie\", \"createdAt\", \"updatedAt\") VALUES ('Admin', 'Super', 'admin@medaction.ma', '\$2b\$10\$cD6VNKlWlZ7eH9HbMVBGZuQ4QjJBV1PkZQ5q3TmHjKl.Xs2Z6pL9e', 'SUPER_ADMIN', true, true, NOW(), NOW()) ON CONFLICT DO NOTHING;"
```
> 📧 Email : `admin@medaction.ma`  
> 🔑 Mot de passe : `admin123`

---

## ✅ ÉTAPE 7 : VÉRIFICATION

### 7.1 Vérifier les logs
```bash
docker logs medaction-app --tail 50
```
> ❌ Pas d'erreur Prisma ou SSL

### 7.2 Vérifier les données
```bash
docker exec medaction-postgres psql -U medaction -h 127.0.0.1 -d medaction -c "SELECT 'Communes:' AS t, COUNT(*) FROM \"Commune\" UNION ALL SELECT 'Users:', COUNT(*) FROM \"User\" UNION ALL SELECT 'Etablissements:', COUNT(*) FROM \"Etablissement\";"
```

### 7.3 Tester l'application
Ouvrez dans votre navigateur :
```
http://192.168.1.100:3000
```

✅ **Vous devez voir :**
- La page d'accueil avec les établissements
- La possibilité de se connecter
- Les données restaurées

---

## 🔧 DÉPANNAGE

### Erreur : `ECONNREFUSED` (base de données)
```bash
# Vérifier que PostgreSQL est démarré
docker logs medaction-postgres --tail 20

# Redémarrer les services
docker compose -f docker-compose.server.yml restart
```

### Erreur : `SSL_get_peer_certificate` ou `libssl.so.1.1`
```bash
# Appliquer le fix OpenSSL
docker exec -u root medaction-app sh -c "cd /app/node_modules/.prisma/client && rm -f libquery_engine-linux-musl.so.node && ln -s libquery_engine-linux-musl-openssl-3.0.x.so.node libquery_engine-linux-musl.so.node"
docker compose -f docker-compose.server.yml restart app
```

### Erreur : `Service temporairement indisponible` (login)
Vérifiez les logs :
```bash
docker logs medaction-app --tail 50 | grep -i error
```

### Erreur : Page blanche ou erreur HTTPS
L'application est configurée pour HTTP. N'utilisez pas `https://`.

### Réinitialisation complète
```bash
docker compose -f docker-compose.server.yml down -v
docker compose -f docker-compose.server.yml up -d
# Puis réimportez les données
```

---

## 🛠️ MAINTENANCE

### Voir les logs en temps réel
```bash
docker logs -f medaction-app
```

### Redémarrer l'application
```bash
docker compose -f docker-compose.server.yml restart app
```

### Sauvegarder la base de données
```bash
docker exec medaction-postgres pg_dump -U medaction -h 127.0.0.1 medaction > backup_$(date +%Y%m%d).sql
```

### Mettre à jour l'application
1. Rebuild l'image sur votre PC
2. Transférez le nouveau `.tar`
3. Exécutez :
```bash
docker load -i medaction-app-security-update.tar
docker tag medaction-app:security-update medaction-app:latest
docker compose -f docker-compose.server.yml up -d --force-recreate
```

---

## 📞 CONTACTS

| Rôle | Contact |
|------|---------|
| Développeur | [Votre email] |
| Admin Système | [Email admin] |
| Province de Médiouna | [Contact officiel] |

---

## 📝 HISTORIQUE DES VERSIONS

| Version | Date | Changements |
|---------|------|-------------|
| 1.0.0 | Jan 2026 | Déploiement initial avec corrections OpenSSL/Prisma |

---

**Document créé le 3 Janvier 2026**  
**Province de Médiouna - Portail Citoyen MedAction**
