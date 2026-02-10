# 🖥️ Guide de Déploiement MedAction - 100% Interface Graphique
**Aucune ligne de commande requise**

---

## 📋 Outils Nécessaires (à installer sur votre PC)

| Outil | Usage | Téléchargement |
|-------|-------|----------------|
| **WinSCP** | Transfert de fichiers | https://winscp.net/eng/download.php |
| **PuTTY** (optionnel) | Connexion SSH | https://www.putty.org/ |
| **Navigateur Web** | Interface Proxmox | Chrome/Firefox |

---

## 🔧 Phase 1 : Configuration Proxmox via Interface Web

### 1.1 Connexion à Proxmox

1. Ouvrez votre navigateur
2. Allez à : `https://IP_SERVEUR:8006`
3. Connectez-vous avec vos identifiants (root ou admin)

### 1.2 Désactiver les dépôts Enterprise

1. **Cliquez** sur votre nœud (ex: `med`) dans le panneau gauche
2. **Cliquez** sur **Updates** → **Repositories**
3. **Sélectionnez** chaque ligne contenant "enterprise"
4. **Cliquez** sur le bouton **Disable**
5. **Cliquez** sur **Add** → Sélectionnez **No-Subscription**
6. **Cliquez** sur **Reload**

![Repositories](https://i.imgur.com/placeholder.png)

### 1.3 Télécharger un Template de Conteneur

1. **Cliquez** sur **local (votre-noeud)** dans le panneau gauche
2. **Cliquez** sur **CT Templates**
3. **Cliquez** sur **Templates**
4. **Recherchez** : `debian-12`
5. **Sélectionnez** : `debian-12-standard`
6. **Cliquez** sur **Download**
7. Attendez la fin du téléchargement

### 1.4 Créer un Conteneur LXC

1. **Cliquez** sur le bouton **Create CT** (en haut à droite)
2. Remplissez les informations :

**Onglet General :**
| Champ | Valeur |
|-------|--------|
| CT ID | 101 (ou auto) |
| Hostname | medaction-prod |
| Password | (votre mot de passe) |
| Confirm Password | (répéter) |

3. **Cliquez** sur **Next**

**Onglet Template :**
| Champ | Valeur |
|-------|--------|
| Storage | local |
| Template | debian-12-standard |

4. **Cliquez** sur **Next**

**Onglet Disks :**
| Champ | Valeur |
|-------|--------|
| Storage | local-lvm |
| Disk size | 30 (GB) |

5. **Cliquez** sur **Next**

**Onglet CPU :**
| Champ | Valeur |
|-------|--------|
| Cores | 2 |

6. **Cliquez** sur **Next**

**Onglet Memory :**
| Champ | Valeur |
|-------|--------|
| Memory | 4096 (MB) |
| Swap | 2048 (MB) |

7. **Cliquez** sur **Next**

**Onglet Network :**
| Champ | Valeur |
|-------|--------|
| Bridge | vmbr0 |
| IPv4 | DHCP ou IP statique |

8. **Cliquez** sur **Next** → **Finish**

### 1.5 Configurer le Conteneur pour Docker

1. **Sélectionnez** votre conteneur (101 - medaction-prod)
2. **Cliquez** sur **Options**
3. **Double-cliquez** sur **Features**
4. **Cochez** : ☑️ **Nesting**
5. **Cliquez** sur **OK**

### 1.6 Démarrer le Conteneur

1. **Sélectionnez** votre conteneur
2. **Cliquez** sur le bouton **Start** (▶️)
3. **Attendez** que le statut passe à "running"

---

## 🐳 Phase 2 : Installer Docker via l'Interface Web Proxmox

### 2.1 Ouvrir la Console Web

1. **Sélectionnez** votre conteneur (medaction-prod)
2. **Cliquez** sur **Console** → **xterm.js**
3. Une fenêtre console s'ouvre dans votre navigateur
4. **Connectez-vous** avec : 
   - Login: `root`
   - Password: (celui défini à la création)

### 2.2 Copier-Coller le Script Docker (une seule fois)

**Copiez ce bloc complet** et **collez-le** dans la console (clic droit → Coller) :

---------------------------------------------------------
# 1. Installer les prérequis
apt update
apt install -y ca-certificates curl gnupg lsb-release

# 2. Ajouter la clé GPG de Docker
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg

# 3. Ajouter le dépôt Docker
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian bookworm stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

# 4. Mettre à jour avec le nouveau dépôt
apt update

# 5. Installer Docker (cette fois ça va marcher)
apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# 6. Vérifier l'installation
docker --version
docker compose version
------------------------------------------------------
```
apt update && apt install -y docker.io docker-compose-plugin && useradd -m -s /bin/bash medaction && usermod -aG docker medaction && echo "medaction:VotreMotDePasse123" | chpasswd && systemctl enable docker && echo "Docker installé avec succès!"
```

> ⚠️ Remplacez `VotreMotDePasse123` par votre mot de passe souhaité

5. Appuyez sur **Entrée**
6. Attendez le message : `Docker installé avec succès!`

### 2.3 Récupérer l'IP du Conteneur

Dans la même console, **copiez et collez** :
```
hostname -I
```

**Notez l'IP affichée** (ex: 192.168.1.50) - vous en aurez besoin !

---

## 📦 Phase 3 : Transfert des Fichiers avec WinSCP

### 3.1 Ouvrir WinSCP

1. **Lancez** WinSCP sur votre PC
2. **Cliquez** sur **Nouvelle Session**

### 3.2 Configuration de la Connexion

| Champ | Valeur |
|-------|--------|
| Protocole | SFTP |
| Nom d'hôte | IP du conteneur (celle notée) |
| Port | 22 |
| Utilisateur | medaction |
| Mot de passe | (celui défini) |

3. **Cliquez** sur **Connexion**
4. Si un avertissement apparaît, **cliquez** sur **Oui**

### 3.3 Transférer les Fichiers

**Panneau gauche** (votre PC) : Naviguez vers :
```
C:\Users\Proschool\Desktop\ABDESSAMAD\TEAMACTION\medaction
```

**Panneau droit** (serveur) : Vous êtes dans `/home/medaction`

**Glissez-déposez** ces fichiers vers la droite :
1. `medaction-app.tar`
2. `docker-compose.prod.yml`

**Renommez** `docker-compose.prod.yml` → `docker-compose.yml` (clic droit → Renommer)

---

## 🚀 Phase 4 : Lancer l'Application via Console Web

### 4.1 Retournez dans la Console Proxmox

1. Dans Proxmox, **cliquez** sur votre conteneur
2. **Cliquez** sur **Console**
3. **Connectez-vous** en tant que `medaction`

### 4.2 Charger et Lancer l'Application

**Copiez-collez ce bloc** dans la console :

```
cd /home/medaction && docker load -i medaction-app.tar && docker compose up -d && docker compose ps
```

Attendez quelques secondes, vous devriez voir :
```
Container medaction-postgres  Healthy
Container medaction-app       Started
```

---

## ✅ Phase 5 : Vérification

### 5.1 Accéder à l'Application

1. **Ouvrez** votre navigateur
2. **Allez à** : `http://IP_CONTENEUR:3000`
   (ex: http://192.168.1.50:3000)

### 5.2 Vous devriez voir la page d'accueil MedAction !

---

## 🔄 Commandes Rapides (à copier-coller si besoin)

| Action | Commande à copier-coller |
|--------|--------------------------|
| Voir le statut | `docker compose ps` |
| Redémarrer l'app | `docker compose restart app` |
| Voir les logs | `docker compose logs -f app` |
| Arrêter tout | `docker compose down` |
| Relancer | `docker compose up -d` |

---

## 🆘 Dépannage Visuel

### L'application ne s'affiche pas ?

Dans la console, **collez** :
```
docker compose logs --tail 50 app
```

### Erreur d'images/uploads ?

**Collez** :
```
docker compose exec -u root app chmod -R 777 /app/public/uploads
```

---

## 📱 Résumé des Étapes

1. ☐ Créer conteneur LXC via interface Proxmox
2. ☐ Activer "Nesting" dans les options
3. ☐ Installer Docker (copier-coller une commande)
4. ☐ Transférer fichiers avec WinSCP
5. ☐ Lancer l'application (copier-coller une commande)
6. ☐ Accéder à http://IP:3000

---

**Félicitations ! Votre application est en production !** 🎉
