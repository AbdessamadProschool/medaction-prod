# Guide Complet de Déploiement : MedAction sur Proxmox
**Version Finale - Décembre 2025**

Ce guide couvre l'installation complète, de la configuration de Proxmox jusqu'à la résolution des problèmes d'images et de base de données.

---

## 🏗️ Phase 1 : Préparation du Serveur Proxmox

### 1. Désactiver les dépôts Enterprise & Docker
**Dans le Shell Proxmox (root) :**

```bash
# Dépôts gratuits
sed -i "s/^deb/#deb/g" /etc/apt/sources.list.d/pve-enterprise.list
echo "deb http://download.proxmox.com/debian/pve bookworm pve-no-subscription" > /etc/apt/sources.list.d/pve-no-subscription.list
apt update && apt dist-upgrade -y

# Installer Docker
apt install -y ca-certificates curl gnupg
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg
echo \
  "deb [arch="$(dpkg --print-architecture)" signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian \
  "$(. /etc/os-release && echo "$VERSION_CODENAME")" stable" | \
  tee /etc/apt/sources.list.d/docker.list > /dev/null
apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Créer l'utilisateur
useradd -m -s /bin/bash medaction
usermod -aG docker medaction
passwd medaction
```

---

## 🚀 Phase 2 : Déploiement Fichiers & Images

### 1. Préparation Archive Images (Sur PC Dev)
Dans le terminal VS Code (PowerShell) :
```powershell
# Créer une archive des images locales
tar -czf uploads.tar.gz public/uploads
```

### 2. Transfert vers le Serveur (Sur PC Dev)
```powershell
# Remplacer IP_SERVEUR par l'IP réelle (ex: 192.168.1.16)
scp medaction-app.tar medaction@IP_SERVEUR:/home/medaction/
scp docker-compose.prod.yml medaction@IP_SERVEUR:/home/medaction/docker-compose.yml
scp uploads.tar.gz medaction@IP_SERVEUR:/home/medaction/
```

### 3. Démarrage et Installation Images (Sur Serveur SSH)
```bash
ssh medaction@IP_SERVEUR
cd /home/medaction

# Charger l'app et lancer
docker load < medaction-app.tar
docker compose up -d

# Installer les images
cat uploads.tar.gz | docker compose exec -T app tar -xz -C /app

# FIX IMAGES : Donner les permissions larges (sinon erreur EACCES)
docker compose exec -u root app chmod -R 777 /app/public/uploads
```

---

## 🛠️ Phase 3 : Initialisation Base de Données (Méthode Tunnel)

### 1. Tunnel SSH (PC Dev - Terminal A)
```powershell
ssh -L 5433:localhost:5432 medaction@IP_SERVEUR
```

### 2. Migrations & Seed (PC Dev - Terminal B)
```powershell
$env:DATABASE_URL="postgresql://medaction:medaction_secure_2024@localhost:5433/medaction"
npx prisma db push
npx tsx prisma/seed-permissions.ts
```

### 3. Réparer les Séquences ID (CRITIQUE)
Si vous insérez des données manuellement (Super Admin, etc), les compteurs PostgreSQL ne sont pas à jour, ce qui cause des erreurs ("Unique constraint failed") lors de la création de nouveaux utilisateurs ou réclamations.

**À exécuter sur le Serveur (SSH) :**
```bash
docker compose exec -e PGPASSWORD=medaction_secure_2024 postgres psql -h localhost -U medaction -d medaction -c "
SELECT setval(pg_get_serial_sequence('\"User\"', 'id'), coalesce(max(id)+1, 1), false) FROM \"User\";
SELECT setval(pg_get_serial_sequence('\"Reclamation\"', 'id'), coalesce(max(id)+1, 1), false) FROM \"Reclamation\";
SELECT setval(pg_get_serial_sequence('\"HistoriqueReclamation\"', 'id'), coalesce(max(id)+1, 1), false) FROM \"HistoriqueReclamation\";
SELECT setval(pg_get_serial_sequence('\"Media\"', 'id'), coalesce(max(id)+1, 1), false) FROM \"Media\";
SELECT setval(pg_get_serial_sequence('\"Evaluation\"', 'id'), coalesce(max(id)+1, 1), false) FROM \"Evaluation\";
SELECT setval(pg_get_serial_sequence('\"Notification\"', 'id'), coalesce(max(id)+1, 1), false) FROM \"Notification\";
SELECT setval(pg_get_serial_sequence('\"Evenement\"', 'id'), coalesce(max(id)+1, 1), false) FROM \"Evenement\";
SELECT setval(pg_get_serial_sequence('\"Actualite\"', 'id'), coalesce(max(id)+1, 1), false) FROM \"Actualite\";
"
```

---

## ✅ Phase 4 : Création Super Admin et Finalisation

### 1. Insérer Super Admin (Serveur SSH via SQL)
```bash
docker compose exec -e PGPASSWORD=medaction_secure_2024 postgres psql -h localhost -U medaction -d medaction
```
Puis exécuter la requête SQL d'insertion (voir guide précédent pour le détail).

### 2. Redémarrage Final
```bash
# Pour s'assurer que toutes les configs et permissions sont prises en compte
docker compose restart app
```

---

### 🚨 Résumé des Commandes de Survie
- **Voir les logs** : `docker compose logs -f app`
- **Erreur images** ? -> `docker compose exec -u root app chmod -R 777 /app/public/uploads`
- **Erreur création (ID failed)** ? -> Relancer le script sql de réparation des `setval`.
- **Licence invalide** ? -> Mettre à jour `LICENSE_DOMAINS` dans `docker-compose.yml` et faire `docker compose up -d`.
