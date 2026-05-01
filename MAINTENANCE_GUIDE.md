# 🛠️ Guide de Maintenance MedAction (Proxmox + Docker)

Ce guide récapitule toutes les procédures de maintenance, les commandes de secours et la configuration de l'infrastructure de production sur le serveur Proxmox.

---

## 1. 💾 Système de Sauvegarde & Maintenance

Le script central est `scripts/maintenance.sh`. Il gère la base de données et les images (uploads).

### Commandes de base (sur CT100) :
- **Lancer une sauvegarde complète :**
  ```bash
  bash scripts/maintenance.sh backup
  ```
- **Vider les tables de test (Evenement, Activite, Campagne) :**
  ```bash
  bash scripts/maintenance.sh clear
  ```
- **Restaurer une sauvegarde :**
  ```bash
  bash scripts/maintenance.sh restore ./backups/full-backup-YYYY-MM-DD-HH-MM-SS
  ```

### Emplacement des sauvegardes :
1.  **Primaires (Disque Système) :** `~/medaction-prod/backups/`
2.  **Miroir (Disque 916 Go) :** `/mnt/data/backups/`

---

## 2. 💽 Gestion du Stockage (Proxmox / local-lvm)

Si votre stockage `local-lvm` (LVM-Thin) dépasse 80%-90%, le serveur risque de s'arrêter.

### Nettoyage d'urgence (sur l'Hôte `pve`) :
- **Supprimer un disque orphelin :**
  ```bash
  lvremove pve/vm-ID-disk-X
  ```
- **Nettoyer Docker dans un container :**
  ```bash
  pct exec 100 -- docker system prune -a -f
  ```
- **Voir l'occupation réelle :**
  ```bash
  lvs
  ```

### Nettoyage dans le CT100 :
- **Supprimer les fichiers temporaires de build :**
  ```bash
  rm -rf ~/medaction-prod/.next/cache
  ```
- **Vider les backups locaux (déjà copiés sur le gros disque) :**
  ```bash
  rm -rf ~/medaction-prod/backups/*
  ```

---

## 3. 🛡️ Résolution des Problèmes (Troubleshooting)

### Erreur "Operation not permitted" (PostgreSQL)
Si la base de données ne démarre pas avec des erreurs de droits sur Proxmox :
1.  **Vérifier les droits du volume Docker :**
    ```bash
    chown -R 999:999 /var/lib/docker/volumes/medaction_postgres_data/_data
    chmod -R 777 /var/lib/docker/volumes/medaction_postgres_data/_data
    ```
2.  **Note :** Toujours utiliser l'image `postgres:16` (pas alpine) pour une meilleure compatibilité avec Proxmox LXC.

---

## 4. 🚀 Procédure de Déploiement

Pour mettre à jour l'application de façon propre :
```bash
git pull origin main
./deploy.sh
```

---

## 5. ⏰ Automatisation (Cron)

Pour automatiser le backup à 3h00 du matin tous les jours :
```bash
# Ouvrir le crontab
crontab -e

# Ajouter la ligne :
0 3 * * * cd /root/medaction-prod && bash scripts/maintenance.sh backup >> /var/log/medaction-backup.log 2>&1
```

---

## 6. 🖼️ Gestion des Uploads & Permissions

Si vous rencontrez une erreur 500 ou "Erreur de configuration du stockage" lors de l'envoi d'images :

### Fixer les droits sur l'Hôte (Proxmox/LXC) :
Le dossier `/app/public/uploads` dans Docker est désormais monté sur le volume nommé `medaction_uploads`. 
Pour manipuler les fichiers directement sur l'hôte :
```bash
# Chemin réel du volume sur le disque (CT100) :
/var/lib/docker/volumes/medaction_uploads/_data/
```

### Note sur la Casse (Case Sensitivity) :
Le serveur est configuré pour être **insensible à la casse** sur les dossiers de premier niveau (ex: `CAMPAGNE` ou `campagne` fonctionneront tous les deux).

### Nettoyage des Uploads :
Pour supprimer les images temporaires ou obsolètes :
```bash
find /var/lib/docker/volumes/medaction_uploads/_data -name "*.tmp" -delete
```

---

*Document mis à jour le 30 Avril 2026 suite à la correction des uploads et des traductions.*
