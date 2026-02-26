# Guide de Transition Développement → Production
*Province de Médiouna - Projet MedAction*

Ce document détaille les changements et configurations nécessaires pour passer de l'environnement de développement à l'environnement de production en respectant les normes professionnelles et de sécurité.

---

## 1. Différences Fondamentales

| Aspect | Développement (`dev`) | Production (`prod`) |
|--------|----------------------|---------------------|
| **Vitesse** | Hot Reloading (lent) | Build Optimisé (rapide) |
| **Logs** | Verbeux, Debug | Minimal, Erreurs critiques uniquement |
| **Erreurs** | Affichées à l'écran (Stack trace) | Page générique "Erreur 500" + Sentry |
| **Données** | Fake data (Seed), Mock | Données réelles, Backup quotidien |
| **Sécurité** | HTTP, cookies lâches | HTTPS, Secure, SameSite, HSTS |
| **Cache** | Désactivé souvent | Activé agressivement |

---

## 2. Checklist de Transition (Détails)

### A. Variables d'Environnement (`.env`)

**En DEV :**
```env
NODE_ENV=development
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=dev_secret_123
POSTGRES_PASSWORD=password
LOG_LEVEL=debug
```

**En PROD (À changer IMPÉRATIVEMENT) :**
```env
NODE_ENV=production
NEXTAUTH_URL=https://votre-domaine.ma
# Générer avec : openssl rand -base64 32
NEXTAUTH_SECRET=valeur_tres_longue_et_complexe_unique
POSTGRES_PASSWORD=mot_de_passe_robuste_genere_aleatoirement
LOG_LEVEL=error
```

### B. Base de Données

1.  **Migrations** :
    *   *Dev* : `prisma migrate dev` (crée des migrations, peut reset la DB).
    *   *Prod* : `prisma migrate deploy` (applique uniquement les migrations en attente sans perte de données).
2.  **Seeding (Données initiales)** :
    *   *Dev* : Seed complet avec fake users (`npm run db:seed`).
    *   *Prod* : Seed minimal uniquement (Roles, Secteurs, 1 Super Admin). **Ne jamais injecter de fake data en prod.**

### C. Build & Performance

1.  **Compilation** :
    *   Lancer `npm run build` pour générer les fichiers statiques et optimisés.
    *   Vérifier qu'il n'y a pas d'erreurs TypeScript ou ESLint bloquantes (le CI/CD le fait).
2.  **Sourcemaps** :
    *   Désactivés en production (par défaut avec `NODE_ENV=production`) pour ne pas exposer le code source original dans le navigateur.

### D. Sécurité & Infrastructure

1.  **HTTPS/SSL** :
    *   Obligatoire. Utiliser Nginx comme Reverse Proxy avec des certificats (Let's Encrypt ou Certificat officiel).
    *   Configurer les headers de sécurité (HSTS, X-Frame-Options) - *Déjà fait dans `nginx.conf`*.
2.  **Cookies** :
    *   En prod, NextAuth passe automatiquement les cookies en `Secure` (envoyés uniquement via HTTPS). Si vous n'avez pas HTTPS, le login échouera.
3.  **Ports** :
    *   Ne jamais exposer le port `5432` (Base de données) ou `6379` (Redis) sur internet. Ils doivent rester internes au réseau Docker (`127.0.0.1` ou interne au docker network).

### E. Monitoring

1.  **Sentry** :
    *   S'assurer que `SENTRY_DSN` est configuré. Il capturera les erreurs invisibles aux utilisateurs.
2.  **Logs** :
    *   Ne jamais logger de données sensibles (mots de passe, tokens) en console.

---

## 3. Procédure de Déploiement Type

1.  **Préparation** :
    ```bash
    git pull origin main
    cp .env.example .env
    nano .env # Mettre les vraies valeurs de PROD
    ```

2.  **Lancement (avec Docker)** :
    ```bash
    # Nettoyage
    docker system prune -f
    
    # Build & Start (Mode Production)
    ./scripts/deploy.sh production
    ```

3.  **Vérification Post-Déploiement** :
    *   Vérifier les logs : `docker-compose logs -f app`
    *   Vérifier le Health Check : `curl https://votre-domaine.ma/api/health`
    *   Tester le login Super Admin.
