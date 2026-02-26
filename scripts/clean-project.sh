#!/bin/bash
# ╔══════════════════════════════════════════════════════════════════════════════╗
# ║                    CLEAN PROJECT - MEDACTION                                 ║
# ║                         Province de Médiouna                                 ║
# ╚══════════════════════════════════════════════════════════════════════════════╝
#
# Usage: ./scripts/clean-project.sh [--all] [--force]
# Options:
#   --all    : Supprime tout (node_modules, .next, coverage, pentest scripts)
#   --force  : Pas de confirmation

set -e

# Configuration
FORCE_MODE=false
CLEAN_ALL=false

# Parse arguments
for arg in "$@"; do
    case $arg in
        --force) FORCE_MODE=true ;;
        --all) CLEAN_ALL=true ;;
    esac
done

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# Counters
DELETED_FILES=0
DELETED_SIZE=0

echo -e "${MAGENTA}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║           MEDACTION - Nettoyage de Projet                   ║"
echo "║                Province de Médiouna                         ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Utility functions
confirm() {
    if $FORCE_MODE; then
        return 0
    fi
    read -p "$1 (y/n) " -n 1 -r
    echo
    [[ $REPLY =~ ^[Yy]$ ]]
}

log_deleted() {
    echo -e "  ${GREEN}✓${NC} Supprimé: $1"
    ((DELETED_FILES++))
}

get_size() {
    if [ -e "$1" ]; then
        du -sh "$1" 2>/dev/null | cut -f1
    else
        echo "0"
    fi
}

# ═══════════════════════════════════════════════════════════════════════════
# PHASE 1: Analyse
# ═══════════════════════════════════════════════════════════════════════════
echo -e "${CYAN}📊 PHASE 1: Analyse de l'état actuel${NC}"
echo ""

INITIAL_SIZE=$(du -sh . 2>/dev/null | cut -f1)
INITIAL_FILES=$(find . -type f | wc -l)
NODE_MODULES_SIZE=$(get_size "node_modules")
NEXT_SIZE=$(get_size ".next")
COVERAGE_SIZE=$(get_size "coverage")

echo -e "  Taille totale:     ${YELLOW}${INITIAL_SIZE}${NC}"
echo -e "  Nombre de fichiers: ${YELLOW}${INITIAL_FILES}${NC}"
echo -e "  node_modules:      ${YELLOW}${NODE_MODULES_SIZE}${NC}"
echo -e "  .next:             ${YELLOW}${NEXT_SIZE}${NC}"
echo -e "  coverage:          ${YELLOW}${COVERAGE_SIZE}${NC}"
echo ""

# ═══════════════════════════════════════════════════════════════════════════
# PHASE 2: Fichiers Système
# ═══════════════════════════════════════════════════════════════════════════
echo -e "${CYAN}🗂️  PHASE 2: Fichiers Système${NC}"
echo ""

# .DS_Store (macOS)
DS_COUNT=$(find . -name ".DS_Store" 2>/dev/null | wc -l)
if [ "$DS_COUNT" -gt 0 ]; then
    find . -name ".DS_Store" -delete 2>/dev/null
    echo -e "  ${GREEN}✓${NC} .DS_Store supprimés: ${DS_COUNT}"
fi

# Thumbs.db (Windows)
THUMBS_COUNT=$(find . -name "Thumbs.db" 2>/dev/null | wc -l)
if [ "$THUMBS_COUNT" -gt 0 ]; then
    find . -name "Thumbs.db" -delete 2>/dev/null
    echo -e "  ${GREEN}✓${NC} Thumbs.db supprimés: ${THUMBS_COUNT}"
fi

# Fichiers temporaires
find . -name "*.swp" -delete 2>/dev/null
find . -name "*.swo" -delete 2>/dev/null
find . -name "*~" -delete 2>/dev/null
echo -e "  ${GREEN}✓${NC} Fichiers temporaires nettoyés"

# Fichier de test à la racine
if [ -f "testfile.txt" ]; then
    rm -f testfile.txt
    echo -e "  ${GREEN}✓${NC} testfile.txt supprimé"
fi

echo ""

# ═══════════════════════════════════════════════════════════════════════════
# PHASE 3: Logs
# ═══════════════════════════════════════════════════════════════════════════
echo -e "${CYAN}📋 PHASE 3: Fichiers Log${NC}"
echo ""

LOG_COUNT=$(find . -name "*.log" -not -path "./node_modules/*" 2>/dev/null | wc -l)
if [ "$LOG_COUNT" -gt 0 ]; then
    find . -name "*.log" -not -path "./node_modules/*" -delete 2>/dev/null
    echo -e "  ${GREEN}✓${NC} Fichiers .log supprimés: ${LOG_COUNT}"
fi

rm -f npm-debug.log* yarn-debug.log* yarn-error.log* 2>/dev/null
echo -e "  ${GREEN}✓${NC} Debug logs nettoyés"
echo ""

# ═══════════════════════════════════════════════════════════════════════════
# PHASE 4: Scripts de Pentest/Audit (non nécessaires en production)
# ═══════════════════════════════════════════════════════════════════════════
echo -e "${CYAN}🔐 PHASE 4: Scripts de Pentest/Audit (à la racine)${NC}"
echo ""

PENTEST_FILES=(
    "business-logic-audit.ts"
    "business-logic-exploit.ts"
    "business-logic-pentest-suite.ts"
    "business-logic-pentest.ts"
    "chaos-engineering-suite.ts"
    "file-upload-security-suite.ts"
    "final-security-check.ts"
    "infrastructure-audit.ts"
    "injection-pentest.ts"
    "load-testing-professional.ts"
    "load-testing-suite.ts"
    "professional-security-audit.ts"
    "race-condition-exploit.ts"
    "security-pentest.ts"
    "ultimate-auth-pentest.ts"
    "ultimate-security-audit.ts"
    "ultra-injection-pentest.ts"
    "validation-checklist.ts"
    "xss-advanced-pentest.ts"
)

PENTEST_SIZE=0

if $CLEAN_ALL || confirm "Déplacer les scripts de pentest vers scripts/pentest/ ?"; then
    # Create pentest directory
    mkdir -p scripts/pentest
    
    for file in "${PENTEST_FILES[@]}"; do
        if [ -f "$file" ]; then
            SIZE=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null || echo 0)
            PENTEST_SIZE=$((PENTEST_SIZE + SIZE))
            mv "$file" scripts/pentest/ 2>/dev/null || true
            echo -e "  ${YELLOW}→${NC} Déplacé: $file"
        fi
    done
    
    echo -e "  ${GREEN}✓${NC} Scripts pentest déplacés vers scripts/pentest/"
else
    echo -e "  ${YELLOW}⚠${NC} Scripts pentest conservés à la racine"
fi
echo ""

# ═══════════════════════════════════════════════════════════════════════════
# PHASE 5: Rapports de sécurité (archivage)
# ═══════════════════════════════════════════════════════════════════════════
echo -e "${CYAN}📄 PHASE 5: Rapports de sécurité${NC}"
echo ""

REPORT_FILES=(
    "RAPPORT_CORRECTIONS_SECURITE.md"
    "RAPPORT_PENTEST_AUTH_ULTIME.md"
    "RAPPORT_PENTEST_AUTORISATION.md"
    "RAPPORT_PENTEST_INJECTION.md"
    "RAPPORT_SECURITE_COMPLET.md"
    "RAPPORT_SECURITE_GLOBAL.md"
    "SECURITY-UPLOAD-REPORT.md"
    "DEVSECOPS-AUDIT-REPORT.md"
    "VALIDATION-REPORT.md"
)

if $CLEAN_ALL || confirm "Déplacer les rapports vers docs/security-reports/ ?"; then
    mkdir -p docs/security-reports
    
    for file in "${REPORT_FILES[@]}"; do
        if [ -f "$file" ]; then
            mv "$file" docs/security-reports/ 2>/dev/null || true
            echo -e "  ${YELLOW}→${NC} Déplacé: $file"
        fi
    done
    
    echo -e "  ${GREEN}✓${NC} Rapports déplacés vers docs/security-reports/"
else
    echo -e "  ${YELLOW}⚠${NC} Rapports conservés à la racine"
fi
echo ""

# ═══════════════════════════════════════════════════════════════════════════
# PHASE 6: Caches et Builds
# ═══════════════════════════════════════════════════════════════════════════
echo -e "${CYAN}🗑️  PHASE 6: Caches et Builds${NC}"
echo ""

# Coverage
if [ -d "coverage" ]; then
    rm -rf coverage
    echo -e "  ${GREEN}✓${NC} coverage/ supprimé (${COVERAGE_SIZE})"
fi

# Playwright report
if [ -d "playwright-report" ]; then
    rm -rf playwright-report
    echo -e "  ${GREEN}✓${NC} playwright-report/ supprimé"
fi

# Test results
if [ -d "test-results" ]; then
    rm -rf test-results
    echo -e "  ${GREEN}✓${NC} test-results/ supprimé"
fi

# TSBuildInfo
if [ -f "tsconfig.tsbuildinfo" ]; then
    rm -f tsconfig.tsbuildinfo
    echo -e "  ${GREEN}✓${NC} tsconfig.tsbuildinfo supprimé"
fi

# .swc cache
if [ -d ".swc" ]; then
    rm -rf .swc
    echo -e "  ${GREEN}✓${NC} .swc/ supprimé"
fi

# .next (optionnel)
if $CLEAN_ALL; then
    if [ -d ".next" ]; then
        rm -rf .next
        echo -e "  ${GREEN}✓${NC} .next/ supprimé (${NEXT_SIZE})"
    fi
    
    if [ -d "node_modules" ]; then
        if confirm "Supprimer node_modules ? (npm install requis après)"; then
            rm -rf node_modules
            echo -e "  ${GREEN}✓${NC} node_modules/ supprimé (${NODE_MODULES_SIZE})"
        fi
    fi
fi

echo ""

# ═══════════════════════════════════════════════════════════════════════════
# PHASE 7: Fichiers de lock redondants
# ═══════════════════════════════════════════════════════════════════════════
echo -e "${CYAN}🔒 PHASE 7: Fichiers de lock${NC}"
echo ""

# Si package-lock.json existe, supprimer pnpm-lock.yaml
if [ -f "package-lock.json" ] && [ -f "pnpm-lock.yaml" ]; then
    rm -f pnpm-lock.yaml pnpm-workspace.yaml
    echo -e "  ${GREEN}✓${NC} pnpm-lock.yaml supprimé (npm est utilisé)"
fi

echo ""

# ═══════════════════════════════════════════════════════════════════════════
# PHASE 8: Rapport Final
# ═══════════════════════════════════════════════════════════════════════════
echo -e "${MAGENTA}════════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Nettoyage terminé !${NC}"
echo -e "${MAGENTA}════════════════════════════════════════════════════════════════${NC}"
echo ""

FINAL_SIZE=$(du -sh . 2>/dev/null | cut -f1)
FINAL_FILES=$(find . -type f | wc -l)

echo -e "${BLUE}📊 Statistiques:${NC}"
echo -e "  Taille avant:  ${YELLOW}${INITIAL_SIZE}${NC}"
echo -e "  Taille après:  ${GREEN}${FINAL_SIZE}${NC}"
echo -e "  Fichiers avant: ${YELLOW}${INITIAL_FILES}${NC}"
echo -e "  Fichiers après: ${GREEN}${FINAL_FILES}${NC}"
echo ""

echo -e "${BLUE}📁 Structure nettoyée:${NC}"
echo -e "  scripts/pentest/   → Scripts de test de sécurité"
echo -e "  docs/security-reports/ → Rapports d'audit"
echo ""

echo -e "${BLUE}🔧 Prochaines étapes:${NC}"
if $CLEAN_ALL; then
    echo -e "  1. Réinstaller:  ${YELLOW}npm install${NC}"
fi
echo -e "  2. Rebuild:      ${YELLOW}npm run build${NC}"
echo -e "  3. Vérifier:     ${YELLOW}npm run lint${NC}"
echo ""
