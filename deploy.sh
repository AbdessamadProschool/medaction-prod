#!/bin/bash

# =================================================================
# 🚀 Script de Déploiement Automatique MedAction (via GitHub)
# =================================================================

# Couleurs pour le terminal
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}=== Début du déploiement MedAction ===${NC}"

# 1. Récupérer les dernières modifications de GitHub
echo -e "${YELLOW}[1/5] Récupération du code depuis GitHub...${NC}"
git pull origin main

# 2. Arrêter les services existants pour éviter les conflits
echo -e "${YELLOW}[2/5] Arrêt des services existants...${NC}"
docker compose -f docker-compose.prod.yml down --remove-orphans

# 3. Reconstruire les images Docker
echo -e "${YELLOW}[3/5] Reconstruction des images Docker...${NC}"
docker compose -f docker-compose.prod.yml build

# 4. Correction des permissions Proxmox LXC (Fix intelligent)
echo -e "${YELLOW}[4/6] Correction permissions Proxmox pour PostgreSQL...${NC}"

# Extraire le chemin du volume depuis le docker-compose.prod.yml
PGDATA_PATH=$(grep -A 2 "postgres:" docker-compose.prod.yml | grep "\- " | head -n 1 | cut -d':' -f1 | cut -d'-' -f2 | xargs)

if [ -z "$PGDATA_PATH" ]; then
    PGDATA_PATH="/var/lib/docker/volumes/medaction_postgres_data/_data"
fi

echo -e "  🔍 Chemin détecté : ${BLUE}$PGDATA_PATH${NC}"

if [ -d "$PGDATA_PATH" ]; then
    chown -R 999:999 "$PGDATA_PATH"
    chmod -R 700 "$PGDATA_PATH"
    echo -e "${GREEN}  ✅ Permissions corrigées sur $PGDATA_PATH${NC}"
else
    # Essayer de créer le dossier si c'est un mount local manquant
    mkdir -p "$PGDATA_PATH"
    chown -R 999:999 "$PGDATA_PATH"
    echo -e "${YELLOW}  ⚠️  Dossier créé et permissions appliquées.${NC}"
fi

# 5. Relancer les containers
echo -e "${YELLOW}[5/6] Lancement des conteneurs...${NC}"
docker compose -f docker-compose.prod.yml up -d

# 6. Synchronisation automatique du schéma de base de données
echo -e "${YELLOW}[6/6] Synchronisation du schéma de base de données...${NC}"
echo -e "${YELLOW}  ⏳ Attente que PostgreSQL soit prêt (15 secondes)...${NC}"
sleep 15

if docker exec medaction-app npx prisma db push --accept-data-loss > /dev/null 2>&1; then
    echo -e "${GREEN}  ✅ Schéma Prisma synchronisé avec succès.${NC}"
else
    echo -e "${YELLOW}  ⚠️  Synchronisation schéma : vérifiez les logs.${NC}"
fi

# Exécution des scripts additionnels (données initiales) si présents
if docker exec medaction-postgres psql -U medaction -d medaction -f - < scripts/db-migrate.sql > /dev/null 2>&1; then
    echo -e "${GREEN}  ✅ Données de migration SQL appliquées.${NC}"
fi

# Nettoyage
echo -e "${YELLOW}Nettoyage du système...${NC}"
docker image prune -f

echo -e "${GREEN}=== ✅ Déploiement terminé avec succès ! ===${NC}"
docker compose -f docker-compose.prod.yml ps
