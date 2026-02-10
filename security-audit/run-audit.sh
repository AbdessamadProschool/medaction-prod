#!/bin/bash
#
# ╔══════════════════════════════════════════════════════════════════════╗
# ║  MEDACTION - SECURITY AUDIT LAUNCHER                                 ║
# ║  Script de lancement rapide pour l'audit de sécurité                ║
# ╚══════════════════════════════════════════════════════════════════════╝

set -e

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration par défaut
TARGET_URL="${TARGET_URL:-http://192.168.1.100:3000}"
AGGRESSIVE="${AGGRESSIVE:-true}"
THREADS="${THREADS:-20}"

echo -e "${BLUE}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║        MEDACTION SECURITY AUDIT FRAMEWORK v2.0               ║"
echo "║              Province de Médiouna                            ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

echo -e "${YELLOW}Configuration:${NC}"
echo "  Target URL:  $TARGET_URL"
echo "  Aggressive:  $AGGRESSIVE"
echo "  Threads:     $THREADS"
echo ""

# Vérifier les dépendances
echo -e "${BLUE}[1/4] Vérification des dépendances...${NC}"

if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js n'est pas installé${NC}"
    exit 1
fi

NODE_VERSION=$(node -v)
echo -e "  ✓ Node.js $NODE_VERSION"

if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm n'est pas installé${NC}"
    exit 1
fi

# Installer les dépendances si nécessaire
echo -e "${BLUE}[2/4] Installation des dépendances...${NC}"
cd "$(dirname "$0")"

if [ ! -d "node_modules" ]; then
    npm install --silent
fi
echo -e "  ✓ Dépendances installées"

# Créer le dossier de rapports
echo -e "${BLUE}[3/4] Préparation du dossier de rapports...${NC}"
mkdir -p reports
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
REPORT_DIR="reports/audit_$TIMESTAMP"
mkdir -p "$REPORT_DIR"
echo -e "  ✓ Dossier créé: $REPORT_DIR"

# Lancer l'audit
echo -e "${BLUE}[4/4] Lancement de l'audit de sécurité...${NC}"
echo ""
echo -e "${YELLOW}═══════════════════════════════════════════════════════════════${NC}"
echo ""

# Exporter les variables d'environnement
export TARGET_URL
export AGGRESSIVE
export THREADS
export REPORT_DIR

# Exécuter le script principal
node audit-master.mjs

# Résumé
echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}AUDIT TERMINÉ${NC}"
echo ""
echo -e "📂 Rapports sauvegardés dans: ${BLUE}$REPORT_DIR${NC}"
echo ""
echo -e "Fichiers générés:"
ls -la "$REPORT_DIR" 2>/dev/null || echo "  (aucun fichier)"
echo ""
