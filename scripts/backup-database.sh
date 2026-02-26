#!/bin/bash
# ╔══════════════════════════════════════════════════════════════════════════════╗
# ║          SCRIPT DE BACKUP POSTGRESQL - PORTAIL MEDIOUNA                      ║
# ║                    Sauvegarde automatisée de la base de données              ║
# ╚══════════════════════════════════════════════════════════════════════════════╝
#
# Usage: ./scripts/backup-database.sh
# Cron:  0 2 * * * /path/to/backup-database.sh >> /var/log/medaction-backup.log 2>&1
#
# Variables d'environnement requises:
#   - POSTGRES_USER (ou utilise 'medaction' par défaut)
#   - POSTGRES_PASSWORD
#   - POSTGRES_DB (ou utilise 'medaction' par défaut)
#   - POSTGRES_HOST (ou utilise 'localhost' par défaut)
#   - BACKUP_DIR (ou utilise './backups' par défaut)
#   - BACKUP_RETENTION_DAYS (ou utilise 30 par défaut)

set -e

# ============================================
# CONFIGURATION
# ============================================
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Variables avec valeurs par défaut
POSTGRES_USER="${POSTGRES_USER:-medaction}"
POSTGRES_DB="${POSTGRES_DB:-medaction}"
POSTGRES_HOST="${POSTGRES_HOST:-localhost}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"
BACKUP_DIR="${BACKUP_DIR:-$PROJECT_DIR/backups}"
BACKUP_RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"

# Format de date pour le nom du fichier
DATE=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_FILE="$BACKUP_DIR/medaction_${DATE}.sql.gz"

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ============================================
# FONCTIONS
# ============================================

log_info() {
    echo -e "${GREEN}[INFO]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

check_requirements() {
    if ! command -v pg_dump &> /dev/null; then
        log_error "pg_dump n'est pas installé. Installez postgresql-client."
        exit 1
    fi
    
    if [ -z "$POSTGRES_PASSWORD" ]; then
        log_error "POSTGRES_PASSWORD n'est pas défini."
        exit 1
    fi
}

create_backup_dir() {
    if [ ! -d "$BACKUP_DIR" ]; then
        log_info "Création du dossier de backup: $BACKUP_DIR"
        mkdir -p "$BACKUP_DIR"
        chmod 700 "$BACKUP_DIR"
    fi
}

perform_backup() {
    log_info "Démarrage du backup de la base de données..."
    log_info "Base: $POSTGRES_DB | Hôte: $POSTGRES_HOST:$POSTGRES_PORT"
    
    export PGPASSWORD="$POSTGRES_PASSWORD"
    
    # Backup avec compression
    pg_dump \
        --host="$POSTGRES_HOST" \
        --port="$POSTGRES_PORT" \
        --username="$POSTGRES_USER" \
        --dbname="$POSTGRES_DB" \
        --format=plain \
        --no-owner \
        --no-privileges \
        --clean \
        --if-exists \
        | gzip > "$BACKUP_FILE"
    
    unset PGPASSWORD
    
    # Vérifier que le fichier a été créé
    if [ -f "$BACKUP_FILE" ]; then
        BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
        log_info "Backup réussi: $BACKUP_FILE ($BACKUP_SIZE)"
    else
        log_error "Échec de la création du backup"
        exit 1
    fi
}

cleanup_old_backups() {
    log_info "Nettoyage des backups de plus de $BACKUP_RETENTION_DAYS jours..."
    
    DELETED_COUNT=$(find "$BACKUP_DIR" -name "medaction_*.sql.gz" -type f -mtime +$BACKUP_RETENTION_DAYS -delete -print | wc -l)
    
    if [ "$DELETED_COUNT" -gt 0 ]; then
        log_info "Supprimé $DELETED_COUNT ancien(s) backup(s)"
    else
        log_info "Aucun ancien backup à supprimer"
    fi
}

show_backup_stats() {
    TOTAL_BACKUPS=$(find "$BACKUP_DIR" -name "medaction_*.sql.gz" -type f | wc -l)
    TOTAL_SIZE=$(du -sh "$BACKUP_DIR" 2>/dev/null | cut -f1)
    OLDEST_BACKUP=$(ls -t "$BACKUP_DIR"/medaction_*.sql.gz 2>/dev/null | tail -1 | xargs basename 2>/dev/null || echo "N/A")
    
    log_info "=== Statistiques ==="
    log_info "Total backups: $TOTAL_BACKUPS"
    log_info "Taille totale: $TOTAL_SIZE"
    log_info "Plus ancien: $OLDEST_BACKUP"
}

# ============================================
# EXECUTION PRINCIPALE
# ============================================

echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║              BACKUP POSTGRESQL - PORTAIL MEDIOUNA                ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo ""

check_requirements
create_backup_dir
perform_backup
cleanup_old_backups
show_backup_stats

echo ""
log_info "Backup terminé avec succès ✅"
