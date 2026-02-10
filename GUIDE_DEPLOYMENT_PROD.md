# Guide de Déploiement Production - MedAction
**Version Validée - Décembre 2025**

Ce guide détaille la procédure pour déployer MedAction sur un serveur Proxmox/Debian en évitant les erreurs connues (permissions, sockets unix, hachage).

## 1. Préparation des Fichiers (Sur PC Dev)

Créez ou vérifiez le fichier `docker-compose.prod.yml` avant le transfert.

### `docker-compose.prod.yml` (Configuration Robuste)
```yaml
services:
  postgres:
    image: postgres:16
    container_name: medaction-postgres
    restart: unless-stopped
    # IMPORTANT: Désactive les unix sockets pour éviter les erreurs "Permission denied" sur Proxmox
    command: postgres -c unix_socket_directories=''
    environment:
      POSTGRES_USER: medaction
      POSTGRES_PASSWORD: medaction_secure_2024
      POSTGRES_DB: medaction
      POSTGRES_HOST_AUTH_METHOD: md5
    volumes:
      - postgres_data_prod:/var/lib/postgresql/data
    ports:
      - "5432:5432" # Indispensable pour l'initialisation à distance
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U medaction -h 127.0.0.1"]
      interval: 10s
      timeout: 5s
      retries: 5
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
      # Mettez l'URL interne du réseau Docker
      - DATABASE_URL=postgresql://medaction:medaction_secure_2024@postgres:5432/medaction
      # Mettez l'IP publique ou LAN du serveur
      - NEXTAUTH_URL=http://IP_SERVEUR:3000
      - NEXTAUTH_SECRET=votre_secret_prod
      - NEXT_PUBLIC_MAPBOX_TOKEN=votre_token
    ports:
      - "3000:3000"
    volumes:
      - uploads_data:/app/public/uploads
    networks:
      - medaction-network

volumes:
  postgres_data_prod:
    driver: local
  uploads_data:
    driver: local

networks:
  medaction-network:
    driver: bridge
```

---

## 2. Déploiement (Sur le Serveur)

### A. Transfert
Depuis votre PC :
```powershell
scp medaction-app.tar medaction@IP_SERVEUR:/home/medaction/
scp docker-compose.prod.yml medaction@IP_SERVEUR:/home/medaction/docker-compose.yml
```

### B. Démarrage
Sur le serveur (SSH) :
```bash
cd /home/medaction
# Charger l'image Docker
docker load < medaction-app.tar

# Nettoyage (optionnel, pour reset)
# docker compose down -v

# Démarrer
docker compose up -d
```

Attendez 30 secondes que la base de données soit prête (`docker compose ps` pour vérifier).

---

## 3. Initialisation de la Base de Données (Méthode Tunnel)

Cette méthode est **la plus fiable** car elle utilise votre PC (où Prisma fonctionne) pour configurer la DB du serveur.

### A. Ouvrir le Tunnel SSH
Dans un terminal dédié sur votre PC :
```powershell
# Mappe le port 5432 du serveur sur le port 5433 de votre PC
ssh -L 5433:localhost:5432 medaction@IP_SERVEUR
```
*Gardez cette fenêtre ouverte.*

### B. Lancer les Migrations
Dans votre terminal VS Code (PC) :

1. **Configurer l'URL vers le tunnel** :
   ```powershell
   $env:DATABASE_URL="postgresql://medaction:medaction_secure_2024@localhost:5433/medaction"
   ```

2. **Créer les tables** :
   ```powershell
   npx prisma db push
   ```

3. **Insérer les données (Seed)** :
   ```powershell
   npx tsx prisma/seed-permissions.ts
   # Si le seed superadmin JS échoue, voir méthode SQL ci-dessous
   ```

---

## 4. Création Super Admin (Méthode de Secours SQL)

Si le seed automatique échoue (problème de hash ou typescript), faites ceci manuellement.

### A. Générer le Hash (PC)
```powershell
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('MON_MOT_DE_PASSE', 12).then(h => console.log(h))"
```
Copiez le résultat (ex: `$2b$12$XaYz...`).

### B. Insérer dans la DB (Serveur)
Sur le serveur SSH :
```bash
# Entrer dans la console SQL
docker compose exec postgres psql -U medaction -d medaction
```

Une fois dans `medaction=#` :
```sql
INSERT INTO "User" (email, "motDePasse", nom, prenom, role, "isActive", "isEmailVerifie", "createdAt", "updatedAt") 
VALUES ('admin@prod.ma', '$2b$12$LE_HASH_ICI...', 'Admin', 'Prod', 'SUPER_ADMIN', true, true, NOW(), NOW())
ON CONFLICT (email) DO UPDATE SET role='SUPER_ADMIN';
```

---

## 5. Finalisation

1. Fermez le tunnel SSH.
2. Sur le serveur, redémarrez l'application pour qu'elle prenne en compte les changements :
   ```bash
   docker compose restart app
   ```
3. Accédez à `http://IP_SERVEUR:3000`.

**Succès garanti !**

---

## 6. 🆘 Dépannage (Troubleshooting)

### A. Erreur de permissions Uploads (EACCES)
Si vous ne pouvez pas uploader d'images, fixez les permissions du dossier uploads :
```bash
docker compose exec -u root app chmod -R 777 /app/public/uploads
```

### B. Erreur "Unique constraint failed" (Base de données)
Si vous avez restauré des données manuellement et que vous ne pouvez plus créer de nouveaux éléments, réinitialisez les compteurs d'ID :
```bash
docker compose exec -e PGPASSWORD=medaction_secure_2024 postgres psql -h 127.0.0.1 -U medaction -d medaction -c "SELECT setval(pg_get_serial_sequence('\"Evaluation\"', 'id'), coalesce(max(id)+1, 1), false) FROM \"Evaluation\"; SELECT setval(pg_get_serial_sequence('\"Media\"', 'id'), coalesce(max(id)+1, 1), false) FROM \"Media\"; SELECT setval(pg_get_serial_sequence('\"User\"', 'id'), coalesce(max(id)+1, 1), false) FROM \"User\";"
```
