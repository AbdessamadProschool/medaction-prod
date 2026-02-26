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
# Lancer le backup
npx ts-node scripts/backup.ts
```
✅ **Résultat :** Un dossier est créé : `backups/backup-2026-02-13-10h00/` contenant `database.dump` et `uploads.zip`.

### 2.2 Automatisation Quotidienne (Cron)
Pour sauvegarder tous les jours à 3h00 du matin :

1. Ouvrir l'éditeur crontab :
```bash
crontab -e
```

2. Ajouter la ligne suivante :
```bash
0 3 * * * cd /chemin/vers/votre/projet && /usr/bin/npx ts-node scripts/backup.ts >> /var/log/medaction_backup.log 2>&1
```

---

## 🔄 PARTIE 3 : Restauration en cas de Désastre (Restore)

Scénario : Le serveur a brûlé ou vous avez tout effacé par erreur. Vous avez réinstallé Docker et récupéré le code source.

### Étape 3.1 : Pré-requis
1. **Redémarrer les conteneurs** (vides) :
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```
   *La base de données sera vide, le site sera "neuf".*

2. **Avoir votre dossier de backup** prêt (récupéré depuis votre stockage externe/cloud).
   Disons qu'il est dans `./backups/backup-2026-02-13-10h00`.

### Étape 3.2 : Lancer la Restauration "One-Click"
```bash
# Commande magique
npx ts-node scripts/restore.ts ./backups/backup-2026-02-13-10h00
```

### Étape 3.3 : Ce que fait le script automatiquement
1. 🛑 Il lit le fichier `database.dump`.
2. 🗑️ Il vide la base de données actuelle.
3. 📥 Il injecte toutes les anciennes données (utilisateurs, réclamations, configs...).
4. 📂 Il dézippe `uploads.zip` et remet toutes les images à leur place dans `/mnt/data/medaction/uploads`.

### Étape 3.4 : Vérification
Connectez-vous au site. Tout doit être revenu exactement comme au moment du backup.

---

## 🛡️ Résumé des Commandes Utiles

| Action | Commande |
| :--- | :--- |
| **Vérifier l'espace disque** | `df -h /mnt/data` |
| **Voir les backups** | `ls -lh ./backups` |
| **Lancer un backup** | `npx ts-node scripts/backup.ts` |
| **Restaurer** | `npx ts-node scripts/restore.ts <dossier_backup>` |
| **Logs Docker** | `docker-compose -f docker-compose.prod.yml logs -f --tail=100` |
