#!/bin/bash
# ╔══════════════════════════════════════════════════════════════════════════════╗
# ║                SCRIPT DE SAUVEGARDE COMPLÈTE - MEDACTION                     ║
# ║           DISQUE LOCAL + DISQUE SECONDAIRE (DISASTER RECOVERY)               ║
# ╚══════════════════════════════════════════════════════════════════════════════╝

set -e

# --- CONFIGURATION ---
DATE=$(date +%Y-%m-%d_%H%M)
BACKUP_NAME="backup_$DATE"
LOCAL_ROOT="./backups"
LOCAL_DEST="$LOCAL_ROOT/$BACKUP_NAME"
SECONDARY_ROOT="/mnt/data/medaction/backups_dr"
SECONDARY_DEST="$SECONDARY_ROOT/$BACKUP_NAME"

# Couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}🚀 Démarrage de la sauvegarde de sécurité MedAction...${NC}"

# 1. Création des répertoires
mkdir -p "$LOCAL_DEST"
if [ -d "/mnt/data" ]; then
    mkdir -p "$SECONDARY_DEST"
else
    echo -e "${YELLOW}⚠️  Attention: /mnt/data non trouvé, sauvegarde secondaire ignorée.${NC}"
fi

# 2. Sauvegarde de la Base de Données (PostgreSQL)
echo -e "${YELLOW}📦 [1/3] Exportation de la base de données...${NC}"
docker exec medaction-postgres pg_dump -U medaction medaction | gzip > "$LOCAL_DEST/database.sql.gz"

# 3. Sauvegarde des Images (Uploads)
echo -e "${YELLOW}🖼️  [2/3] Archivage des images...${NC}"
tar -czf "$LOCAL_DEST/uploads.tar.gz" -C public/uploads .

# 4. Miroir sur le disque secondaire
if [ -d "$SECONDARY_ROOT" ]; then
    echo -e "${YELLOW}🛡️  [3/3] Synchronisation sur le disque secondaire (/mnt/data)...${NC}"
    cp -r "$LOCAL_DEST" "$SECONDARY_ROOT/"
    echo -e "${GREEN}✅ Miroir créé sur le disque secondaire.${NC}"
else
    echo -e "⏭️  Étape 3 ignorée (Disque secondaire non monté)."
fi

echo -e "\n${GREEN}================================================================${NC}"
echo -e "${GREEN} ✅ SAUVEGARDE RÉUSSIE !${NC}"
echo -e " 📍 Emplacement local : $LOCAL_DEST"
if [ -d "$SECONDARY_DEST" ]; then
    echo -e " 📍 Emplacement DR    : $SECONDARY_DEST"
fi
echo -e "${GREEN}================================================================${NC}"
