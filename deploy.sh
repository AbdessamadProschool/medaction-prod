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

# 4. Correction des permissions Proxmox LXC (Fix permanent)
# Sur Proxmox LXC, Docker ne peut pas faire chown/chmod sur les volumes nommés.
# On applique les droits manuellement avant le démarrage.
echo -e "${YELLOW}[4/5] Correction permissions Proxmox pour PostgreSQL...${NC}"
PGDATA_PATH="/var/lib/docker/volumes/medaction_postgres_data/_data"
if [ -d "$PGDATA_PATH" ]; then
    chown -R 999:999 "$PGDATA_PATH"
    chmod -R 700 "$PGDATA_PATH"
    echo -e "${GREEN}  ✅ Permissions PostgreSQL corrigées.${NC}"
else
    echo -e "${YELLOW}  ⚠️  Dossier de données PG non trouvé (première installation).${NC}"
fi

# 5. Relancer les containers
echo -e "${YELLOW}[5/5] Lancement des conteneurs...${NC}"
docker compose -f docker-compose.prod.yml up -d

# 5. Nettoyage
echo -e "${YELLOW}[5/5] Nettoyage du système...${NC}"
docker image prune -f

echo -e "${GREEN}=== ✅ Déploiement terminé avec succès ! ===${NC}"
docker compose -f docker-compose.prod.yml ps
