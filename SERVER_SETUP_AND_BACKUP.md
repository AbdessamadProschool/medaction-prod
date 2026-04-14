# Guide de Gestion du Stockage et Sauvegardes - Serveur Proxmox
**Date:** 13 Février 2026  
**Infrastructure:** Docker sur Proxmox / Linux

Ce guide détaille étape par étape comment configurer le disque de stockage secondaire, mettre en place les sauvegardes automatiques et effectuer une restauration complète en cas de désastre.

---

## 🏗️ PARTIE 1 : Préparer le Disque de Données (Proxmox / Linux)

Pour protéger vos données en cas de réinstallation du système principal, nous utilisons un disque ou une partition séparée montée sur `/mnt/data`.

### Étape 1.1 : Identifier le disque
Connectez-vous à votre serveur en SSH ou via la console Proxmox et lancez :
```bash
lsblk
```
Repérez votre disque de données (par sa taille, ex: 800G). Disons qu'il s'appelle `/dev/sdb`.

### Étape 1.2 : Formater le disque (Si nouveau disque uniquement)
⚠️ **ATTENTION :** Cela efface toutes les données du disque !
```bash
# Formater en ext4
mkfs.ext4 /dev/sdb
```

### Étape 1.3 : Créer le point de montage et monter le disque
```bash
# 1. Créer le dossier
mkdir -p /mnt/data

# 2. Monter le disque temporairement pour tester
mount /dev/sdb /mnt/data

# 3. Vérifier
df -h | grep /mnt/data
# Doit afficher quelque chose comme : /dev/sdb  800G  ...  /mnt/data
```

### Étape 1.4 : Montage Permanent (Survivre au redémarrage)
Il faut ajouter le disque dans `/etc/fstab`.
```bash
# 1. Trouver l'UUID du disque (plus sûr que /dev/sdb)
blkid /dev/sdb
# Copiez l'UUID (ex: UUID="a1b2-c3d4...")

# 2. Editer fstab
nano /etc/fstab

# 3. Ajouter cette ligne à la fin (remplacez l'UUID) :
UUID=votre-uuid-ici  /mnt/data  ext4  defaults  0  2
```
Testez avec `mount -a` (si aucune erreur, c'est bon).

### Étape 1.5 : Préparer les dossiers pour Docker
```bash
# Créer l'arborescence pour Medaction
mkdir -p /mnt/data/medaction/postgres
mkdir -p /mnt/data/medaction/uploads

# Donner les permissions (large, pour éviter les soucis Docker)
chmod -R 777 /mnt/data/medaction
```

---

## 💾 PARTIE 2 : Stratégie de Sauvegarde (Backup)

Le script `scripts/backup.ts` crée une archive complète (Base de données + Fichiers) dans le dossier `./backups`.

### 2.1 Lancement Manuel (Test)
Depuis le dossier du projet :
```bash
# Lancer le backup (Base de données + Uploads)
npm run system:backup
```
✅ **Résultat :** Un dossier est créé dans `backups/backup-YYYY-MM-DD.../` contenant `database.dump` et `uploads.zip`.

### 2.2 Automatisation Quotidienne (Cron)
Pour sauvegarder tous les jours à 3h00 du matin sur deux disques :

1. Ouvrir l'éditeur crontab : `crontab -e`
2. Ajouter la ligne suivante :
```bash
0 3 * * * cd /home/medaction && SECONDARY_BACKUP_DIR=/mnt/backup_disk npm run system:backup >> /var/log/medaction_backup.log 2>&1
```

---

## 🔄 PARTIE 3 : Test de Reprise après Désastre (DR Test)

### Étape 3.1 : Simuler la perte de données
⚠️ **ATTENTION :** Ne faites cela que si vous avez une sauvegarde valide !
```bash
# Supprimer toutes les données de la base
docker exec -it medaction-postgres psql -U medaction -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
```

### Étape 3.2 : Lancer la Restauration
```bash
npm run system:restore ./backups/backup-2026-04-14...
```

### Étape 3.3 : Ce que fait le script automatiquement
1. 🛑 Il restaure `database.dump` dans PostgreSQL.
2. 📂 Il dézippe `uploads.zip` et remet toutes les images dans le dossier des uploads.

---

## 🛡️ Résumé des Commandes Finales

| Action | Commande |
| :--- | :--- |
| **Lancer Backup** | `npm run system:backup` |
| **Restaurer Backup** | `npm run system:restore <chemin_backup>` |
| **Vérifier Espace** | `df -h /mnt/data` |
| **Voir les Backups** | `ls -lh ./backups` |
| **Logs de Maintenance** | `cat /var/log/medaction_backup.log` |
