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
echo -e "${YELLOW}[1/4] Récupération du code depuis GitHub...${NC}"
git pull origin main

# 2. Reconstruire les images Docker
# On utilise --no-cache pour éviter les problèmes de fichiers fantômes, 
# mais on peut le retirer si les builds sont trop longs.
echo -e "${YELLOW}[2/4] Reconstruction des images Docker...${NC}"
docker compose -f docker-compose.prod.yml build --pull

# 3. Relancer les containers
echo -e "${YELLOW}[3/4] Lancement des conteneurs...${NC}"
docker compose -f docker-compose.prod.yml up -d

# 4. Nettoyage des anciennes images inutiles
echo -e "${YELLOW}[4/4] Nettoyage du système...${NC}"
docker image prune -f

echo -e "${GREEN}=== ✅ Déploiement terminé avec succès ! ===${NC}"
echo -e "${BLUE}L'application est disponible sur le port habituel.${NC}"
docker compose -f docker-compose.prod.yml ps
