# 🚀 Guide Final de Déploiement MedAction sur Proxmox VE
## Version Production - 30 Décembre 2025

---

## 📋 Informations du Projet

| Élément | Valeur |
|---------|--------|
| **Application** | MedAction - Portail Citoyen |
| **Serveur** | Proxmox VE (IP: 192.168.1.42) |
| **Conteneur** | medaction-prod (IP: 192.168.1.50) |
| **Port Application** | 3000 |
| **Base de données** | PostgreSQL 16 |
| **Utilisateur SSH** | medaction / MedAction2024! |

---

## 🛠️ Outils Nécessaires (sur votre PC Windows)

| Outil | Usage | Installation |
|-------|-------|--------------|
| **WinSCP** | Transfert de fichiers | https://winscp.net |
| **Navigateur Web** | Interface Proxmox | Chrome/Firefox |
| **PowerShell** | Tunnel SSH + Prisma | Intégré Windows |

---

# 📍 PHASE 1 : Configuration Initiale

## Étape 1.1 - Vérifier l'accès Proxmox
**📍 Où : Votre PC (Navigateur)**

1. Ouvrez : `https://192.168.1.42:8006`
2. Connectez-vous avec vos identifiants admin
3. Vérifiez que le conteneur `medaction-prod` (ID: 101) est visible

---

## Étape 1.2 - Vérifier la configuration réseau du conteneur
**📍 Où : Interface Web Proxmox**

1. **Cliquez** sur le conteneur `medaction-prod` (101)
2. **Cliquez** sur **Network**
3. Vérifiez :

| Champ | Valeur Attendue |
|-------|-----------------|
| Bridge | vmbr0 |
| IPv4/CIDR | 192.168.1.50/24 |
| Gateway | 192.168.1.1 |

4. Si besoin de modifier, **double-cliquez** sur `net0` et corrigez

---

## Étape 1.3 - Démarrer le conteneur
**📍 Où : Interface Web Proxmox**

1. **Sélectionnez** `medaction-prod`
2. **Cliquez** sur **Start** (▶️)
3. Attendez que le statut soit `running`

---

# 📍 PHASE 2 : Transfert des Fichiers

## Étape 2.1 - Connexion WinSCP
**📍 Où : Votre PC (WinSCP)**

1. **Lancez** WinSCP
2. **Nouvelle session** avec :

| Champ | Valeur |
|-------|--------|
| Protocole | SFTP |
| Hôte | **192.168.1.50** |
| Port | 22 |
| Utilisateur | medaction |
| Mot de passe | MedAction2024! |

3. **Cliquez** sur **Connexion**
4. Acceptez la clé si demandé

---

## Étape 2.2 - Transférer les fichiers Docker
**📍 Où : Votre PC (WinSCP)**

**Panneau gauche** (votre PC) - Naviguez vers :
```
C:\Users\Proschool\Desktop\ABDESSAMAD\TEAMACTION\medaction
```

**Panneau droit** (serveur) - Vous êtes dans `/home/medaction`

**Glissez-déposez** ces fichiers :

| Fichier Local | Action |
|---------------|--------|
| `medaction-app.tar` | Glisser vers la droite |
| `docker-compose.prod.yml` | Glisser vers la droite |

---

## Étape 2.3 - Renommer le fichier docker-compose
**📍 Où : WinSCP (panneau droit)**

1. **Clic droit** sur `docker-compose.prod.yml`
2. **Renommer** → `docker-compose.yml`
3. **OK**

---

## Étape 2.4 - Transférer les images/uploads
**📍 Où : Votre PC (WinSCP)**

Si vous avez un dossier `public/uploads` avec des images :

1. Dans le **panneau gauche**, naviguez vers `public/uploads`
2. **Sélectionnez** tout le contenu
3. **Glissez** vers `/home/medaction/uploads_backup/`

---

# 📍 PHASE 3 : Déploiement de l'Application

## Étape 3.1 - Ouvrir la Console du Conteneur
**📍 Où : Interface Web Proxmox**

1. **Sélectionnez** `medaction-prod` (101)
2. **Cliquez** sur **Console** → **xterm.js**
3. **Connectez-vous** :
   - Login: `root`
   - Password: (votre mot de passe root du conteneur)

---

## Étape 3.2 - Charger et lancer Docker
**📍 Où : Console du CONTENEUR medaction-prod**

**Copiez-collez ce bloc complet :**

```bash
cd /home/medaction && docker load -i medaction-app.tar && docker compose down 2>/dev/null; docker compose up -d && sleep 15 && docker compose ps
```

**Résultat attendu :**
```
Container medaction-postgres  Healthy
Container medaction-app       Started
```

---

## Étape 3.3 - Créer le dossier uploads
**📍 Où : Console du CONTENEUR medaction-prod**

```bash
docker compose exec -u root app mkdir -p /app/public/uploads && docker compose exec -u root app chmod -R 777 /app/public/uploads
```

---

## Étape 3.4 - Restaurer les images (si transférées)
**📍 Où : Console du CONTENEUR medaction-prod**

Si vous avez copié des uploads à l'étape 2.4 :

```bash
docker cp /home/medaction/uploads_backup/. medaction-app:/app/public/uploads/
```

---

# 📍 PHASE 4 : Initialisation Base de Données

## Étape 4.1 - Créer le tunnel SSH
**📍 Où : Votre PC (PowerShell - Terminal 1)**

```powershell
ssh -L 5433:localhost:5432 medaction@192.168.1.50
```

Entrez le mot de passe : `MedAction2024!`

**⚠️ Laissez cette fenêtre ouverte !**

---

## Étape 4.2 - Appliquer le schéma Prisma
**📍 Où : Votre PC (PowerShell - Terminal 2)**

```powershell
cd c:\Users\Proschool\Desktop\ABDESSAMAD\TEAMACTION\medaction
$env:DATABASE_URL="postgresql://medaction:medaction_secure_2024@localhost:5433/medaction"
npx prisma db push
```

**Résultat attendu :**
```
Your database is now in sync with your Prisma schema.
```

---

## Étape 4.3 - Initialiser les permissions
**📍 Où : Votre PC (PowerShell - Terminal 2)**

```powershell
npx tsx prisma/seed-permissions.ts
```

---

## Étape 4.4 - Créer le Super Admin
**📍 Où : Votre PC (PowerShell - Terminal 2)**

```powershell
npx tsx prisma/seed-superadmin.ts
```

---

## Étape 4.5 - (Optionnel) Restaurer les données de production
**📍 Où : Votre PC (PowerShell - Terminal 2)**

Si vous avez un backup JSON :

```powershell
npx tsx scripts/restore-prod-json.ts
```

---

## Étape 4.6 - Réparer les séquences ID
**📍 Où : Console du CONTENEUR medaction-prod**

```bash
docker compose exec -e PGPASSWORD=medaction_secure_2024 postgres psql -h localhost -U medaction -d medaction -c "
SELECT setval(pg_get_serial_sequence('\"User\"', 'id'), coalesce(max(id)+1, 1), false) FROM \"User\";
SELECT setval(pg_get_serial_sequence('\"Reclamation\"', 'id'), coalesce(max(id)+1, 1), false) FROM \"Reclamation\";
SELECT setval(pg_get_serial_sequence('\"HistoriqueReclamation\"', 'id'), coalesce(max(id)+1, 1), false) FROM \"HistoriqueReclamation\";
SELECT setval(pg_get_serial_sequence('\"Evenement\"', 'id'), coalesce(max(id)+1, 1), false) FROM \"Evenement\";
SELECT setval(pg_get_serial_sequence('\"Actualite\"', 'id'), coalesce(max(id)+1, 1), false) FROM \"Actualite\";
SELECT setval(pg_get_serial_sequence('\"Article\"', 'id'), coalesce(max(id)+1, 1), false) FROM \"Article\";
SELECT setval(pg_get_serial_sequence('\"Media\"', 'id'), coalesce(max(id)+1, 1), false) FROM \"Media\";
SELECT setval(pg_get_serial_sequence('\"Notification\"', 'id'), coalesce(max(id)+1, 1), false) FROM \"Notification\";
SELECT setval(pg_get_serial_sequence('\"Permission\"', 'id'), coalesce(max(id)+1, 1), false) FROM \"Permission\";
"
```

---

# 📍 PHASE 5 : Vérification et Accès

## Étape 5.1 - Vérifier les logs
**📍 Où : Console du CONTENEUR medaction-prod**

```bash
docker compose logs --tail 20 app
```

**Cherchez :** `Ready on http://0.0.0.0:3000`

---

## Étape 5.2 - Tester l'application
**📍 Où : Votre PC (Navigateur)**

Ouvrez : `http://192.168.1.50:3000`

Vous devriez voir la page d'accueil MedAction !

---

## Étape 5.3 - Tester la connexion
**📍 Où : Navigateur**

1. Cliquez sur **Connexion**
2. Utilisez les identifiants Super Admin créés

---

# 📍 PHASE 6 : Commandes de Maintenance

## Sur le CONTENEUR medaction-prod :

| Action | Commande |
|--------|----------|
| Voir le statut | `docker compose ps` |
| Voir les logs | `docker compose logs -f app` |
| Redémarrer l'app | `docker compose restart app` |
| Arrêter tout | `docker compose down` |
| Relancer | `docker compose up -d` |
| Permissions uploads | `docker compose exec -u root app chmod -R 777 /app/public/uploads` |

---

# ✅ Checklist de Déploiement

- [ ] Conteneur démarré et accessible
- [ ] Fichiers Docker transférés
- [ ] Image Docker chargée
- [ ] Conteneurs medaction-app et postgres en running
- [ ] Base de données initialisée (prisma db push)
- [ ] Permissions seed appliquées
- [ ] Super Admin créé
- [ ] Séquences ID réparées
- [ ] Application accessible sur http://192.168.1.50:3000
- [ ] Connexion admin fonctionnelle

---

# 🆘 Dépannage Rapide

| Problème | Solution |
|----------|----------|
| "Access denied" WinSCP | Vérifier IP du conteneur (pas du host) |
| PostgreSQL unhealthy | `docker compose down && docker compose up -d` |
| Images ne s'affichent pas | `docker compose exec -u root app chmod -R 777 /app/public/uploads` |
| Erreur création user | Réparer les séquences ID (Phase 4.6) |
| App ne démarre pas | `docker compose logs app` pour voir l'erreur |

---

**🎉 Félicitations ! Votre application MedAction est en production !**

---

*Guide créé le 30 Décembre 2025*
