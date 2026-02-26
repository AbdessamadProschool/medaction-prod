# Stratégie de Déploiement Progressif - MedAction

Ce document guide le déploiement de l'application à travers 3 environnements distincts, du test local à la production finale.

## 🗺️ Vue d'Ensemble

| Étape | Environnement | Objectif | URL | SSL/HTTPS |
|-------|---------------|----------|-----|-----------|
| **1** | **PC Local** | Test fonctionnel immédiat | `http://localhost:3000` | Non (ou Self-Signed) |
| **2** | **Serveur Proxmox** | Test d'intégration & Réseau | `http://192.168.x.x:3000` | Non (Interne) |
| **3** | **Production** | Accès Public Final | `https://mediouna.ma` | **Oui (Obligatoire)** |

---

## 1️⃣ ÉTAPE 1 : Test sur PC Local (Maintenant)

**Objectif** : Vérifier que l'application tourne dans Docker (Base de données + App).

### Configuration
Utilisez le profil `dev` pour éviter la complexité de Nginx/SSL pour l'instant.

1.  **Fichier `.env`** :
    ```env
    NODE_ENV=development
    NEXTAUTH_URL=http://localhost:3000
    ```

2.  **Lancement** :
    ```bash
    # Lancer Uniquement App + DB (Sans Nginx)
    docker-compose up -d
    ```
    *Note : Ne pas utiliser `--profile production` ici.*

3.  **Accès** :
    Ouvrez votre navigateur sur : `http://localhost:3000`

---

## 2️⃣ ÉTAPE 2 : Serveur Local (Proxmox + Docker)

**Objectif** : Simuler un environnement serveur linux stable, accessible sur le réseau local.

### Configuration Proxmox
1.  Créer une **VM (Virtual Machine)** ou un **LXC Container** (Ubuntu 22.04 recommandé).
2.  Installer Docker & Docker Compose sur cette VM.
3.  **Adresse IP Fixe** : Configurez une IP statique pour cette VM (ex: `192.168.1.50`).

### Déploiement
1.  Transférer le code (via `git clone` ou `scp`).
2.  **Fichier `.env`** :
    ```env
    NODE_ENV=production
    # Important : Mettre l'IP du serveur Proxmox
    NEXTAUTH_URL=http://192.168.1.50:3000
    ```
3.  **Lancement** :
    ```bash
    docker-compose up -d --build
    ```

### Accès
Depuis n'importe quel PC du réseau : `http://192.168.1.50:3000`

---

## 3️⃣ ÉTAPE 3 : Production (Domaine + IP Publique)

**Objectif** : Accès public sécurisé avec HTTPS.

### Prérequis
*   Un **Nom de Domaine** (ex: `mediouna-action.ma`).
*   Une **IP Publique Fixe** (fournie par le FAI ou Hébergeur).
*   Configuration **NAT/Port Forwarding** sur le routeur (Rediriger ports 80 et 443 vers votre serveur Proxmox `192.168.1.50`).

### Configuration SSL (Le "Piège" à éviter)
En production, HTTPS est **obligatoire** pour que tout fonctionne (Login, Géolocalisation).

1.  **Obtenir les certificats** (avec Certbot/Let's Encrypt sur le serveur Proxmox) :
    ```bash
    certbot certonly --standalone -d mediouna-action.ma
    ```
    *Cela génère `fullchain.pem` et `privkey.pem`*.

2.  **Configurer Nginx** :
    Copier ces clés dans le dossier `./certs` du projet.

3.  **Fichier `.env`** :
    ```env
    NODE_ENV=production
    NEXTAUTH_URL=https://mediouna-action.ma
    ```

4.  **Lancement (Mode Production)** :
    Cette fois, on active Nginx :
    ```bash
    docker-compose --profile production up -d
    ```

---

## 📝 Résumé des Commandes par Étape

### PC Local
```bash
# Start
docker-compose up -d

# Stop
docker-compose down
```

### Proxmox / Production
```bash
# Start (avec Nginx pour HTTPS)
docker-compose --profile production up -d

# Mise à jour
git pull
./scripts/deploy.sh production
```
