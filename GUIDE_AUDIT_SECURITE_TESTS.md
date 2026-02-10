# 🛡️ Guide Complet : Audit de Sécurité et Tests - MedAction

Ce document détaille les procédures pour valider, tester et sécuriser l'application MedAction déployée sur Proxmox.

---

## 📋 1. Tests Fonctionnels (Validation Utilisateur)

Avant de passer à la sécurité technique, validez que l'application fonctionne "métier".

### 👤 Scénarios de Test (User Stories)

| Acteur | Action à Tester | Résultat Attendu | Statut |
|--------|-----------------|------------------|--------|
| **Citoyen** | Créer un compte | Email de confirmation envoyé (ou compte créé si pas d'email SMTP) | ⬜ |
| **Citoyen** | Se connecter | Redirection vers tableau de bord Citoyen | ⬜ |
| **Citoyen** | Soumettre une réclamation (avec photo) | Réclamation visible dans "Mes réclamations" | ⬜ |
| **Citoyen** | Modifier son profil (Avatar) | Nouvelle photo visible partout | ⬜ |
| **Gouverneur** | Se connecter | Accès au Dashboard Analytique | ⬜ |
| **Gouverneur** | Filtrer les statistiques | Les graphiques se mettent à jour | ⬜ |
| **SuperAdmin** | Créer un utilisateur "Autorité" | L'utilisateur reçoit ses accès | ⬜ |
| **SuperAdmin** | Gérer les Permissions | L'accès change immédiatement pour l'utilisateur ciblé | ⬜ |

### 🧪 Tests Automatisés

Si vous avez installé Playwright/Cypress :
```bash
npx playwright test
```
*Si non, effectuez ces tests manuellement en suivant la grille ci-dessus.*

---

## 🔒 2. Audit de Sécurité (AppSec)

### 🩺 A. Audit Automatisé
Lancez le script d'audit inclus dans le projet :

```bash
# Depuis votre PC (tunnel SSH doit être fermé si check distant, ou ouvert si check local)
# Ciblez l'IP du serveur
$env:TARGET_URL="http://192.168.1.18:3000"
npx tsx scripts/audit-security.ts
```

**Ce script vérifie :**
1. **Les Headers HTTP** (Protection XSS, Frame Options).
2. **Les Vulnérabilités NPM** (Failles connues dans les librairies).
3. **L'exposition des fichiers sensibles** (.env, .git).

### 👮 B. Contrôle d'Accès (RBAC) - CRITIQUE
Testez l'étanchéité des rôles :

1. **Test d'Escalade de Privilèges :**
   - Connectez-vous en tant que **Citoyen**.
   - Essayez d'accéder manuellement à `/admin` ou `/dashboard`.
   - **Attendu** : Redirection vers 403 (Non Autorisé) ou Accueil.

2. **Test d'API Sécurisée :**
   - Utilisez Postman ou `curl`.
   - Tentez une requête `DELETE /api/users/1` sans être connecté (ou en étant Citoyen).
   - **Attendu** : Erreur 401 (Unauthorized) ou 403 (Forbidden).

### 💉 C. Test d'Injection (Input Validation)
Bien que Prisma protège contre les Injections SQL, testez les failles XSS (Cross-Site Scripting).

1. **Test XSS Formulaire :**
   - Dans un champ "Nom" ou "Description" (ex: Réclamation).
   - Entrez : `<script>alert('HACK')</script>`.
   - Sauvegardez et affichez la page.
   - **Attendu** : Le texte s'affiche tel quel, aucune fenêtre d'alerte ne s'ouvre. (React échappe le HTML par défaut).

---

## 🏰 3. Sécurité de l'Infrastructure (DevSecOps)

### 🐳 Docker & Conteneurs
Vérifiez que votre conteneur est bien isolé.

**Sur le serveur (`medaction-prod`) :**
```bash
# Vérifier que le conteneur ne tourne pas en mode privileged (sauf si nécessaire)
docker inspect --format='{{.HostConfig.Privileged}}' medaction-app
# Doit retourner 'false'

# Vérifier les ports exposés
docker ps
# Seuls 3000 (App) et éventuellement 5432 (DB) doivent être listés.
# Idéalement, la DB ne doit PAS exposer de port sur 0.0.0.0 si seule l'app l'utilise.
```

### 🕸️ Réseau & Firewall (Proxmox)
1. **Pare-feu Proxmox** : Activez le Firewall sur l'interface du conteneur LXC 100.
2. **Règles entrantes (IN)** :
   - Autoriser TCP 3000 (Application)
   - Autoriser TCP 22 (SSH - Admin uniquement)
   - **Bloquer tout le reste**.

### 🔑 Gestion des Secrets
- Vérifiez que le fichier `.env` **n'est pas** commité dans Git.
- Vérifiez que `NEXTAUTH_SECRET` est une chaîne longue et aléatoire en production.

---

## 🚀 4. Performance & Optimisation

### ⚡ LightHouse (Chrome DevTools)
1. Ouvrez Chrome sur la page d'accueil.
2. `F12` > Onglet **Lighthouse**.
3. Cochez "Mobile" ou "Desktop".
4. Cliquez sur **Analyze page load**.
   - **Visez un score > 90** en Performance et Best Practices.
   - Si les images sont lourdes, vérifiez que `next/image` fonctionne bien.

### 💾 Base de Données
Vérifiez la taille et les index si l'application ralentit.
```sql
-- Dans le conteneur DB
SELECT pg_size_pretty(pg_database_size('medaction'));
```

---

## 🚨 Planning de Maintenance

| Fréquence | Action | Commande |
|-----------|--------|----------|
| **Hebdo** | Backup Base de Données | `./scripts/backup-database.sh` |
| **Mensuel** | Mise à jour OS Serveur | `apt update && apt upgrade` |
| **Mensuel** | Mise à jour Dépendances App | `npm audit fix` puis redéploiement |
| **Trimestriel** | Rotation des Secrets | Changer `NEXTAUTH_SECRET` et `DATABASE_PASSWORD` |

---

## 🆘 En cas d'Incident de Sécurité

1. **Isoler** : Arrêtez le conteneur (`docker compose stop`).
2. **Analyser** : Regardez les logs (`docker compose logs`).
3. **Restaurer** : Utilisez le dernier backup JSON ou SQL sain.
4. **Patcher** : Corrigez la faille avant de relancer.

---
*Généré par Antigravity pour MedAction - Province de Médiouna*
