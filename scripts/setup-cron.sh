#!/bin/bash
# ╔══════════════════════════════════════════════════════════════════════════════╗
# ║          CONFIGURATION CRON POUR BACKUPS - PORTAIL MEDIOUNA                  ║
# ║                   Installation automatique des tâches cron                   ║
# ╚══════════════════════════════════════════════════════════════════════════════╝
#
# Usage: sudo ./scripts/setup-cron.sh
#
# Ce script configure les tâches cron suivantes :
#   - Backup quotidien de la base de données à 2h00
#   - Nettoyage des logs à 3h00
#   - Vérification de santé toutes les 5 minutes

set -e

# ============================================
# CONFIGURATION
# ============================================
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
BACKUP_SCRIPT="$SCRIPT_DIR/backup-database.sh"
LOG_DIR="/var/log/medaction"
CRON_USER="${CRON_USER:-$(whoami)}"

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# ============================================
# FONCTIONS
# ============================================

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

check_root() {
    if [ "$EUID" -ne 0 ]; then
        log_warn "Ce script nécessite les droits root pour créer les dossiers de logs"
        log_warn "Exécutez: sudo $0"
        echo ""
    fi
}

create_log_directory() {
    log_step "Création du dossier de logs..."
    
    if [ ! -d "$LOG_DIR" ]; then
        sudo mkdir -p "$LOG_DIR"
        sudo chown "$CRON_USER:$CRON_USER" "$LOG_DIR"
        sudo chmod 750 "$LOG_DIR"
        log_info "Dossier créé: $LOG_DIR"
    else
        log_info "Dossier existe déjà: $LOG_DIR"
    fi
}

make_scripts_executable() {
    log_step "Rendre les scripts exécutables..."
    
    chmod +x "$BACKUP_SCRIPT"
    log_info "Scripts rendus exécutables"
}

create_backup_directory() {
    log_step "Création du dossier de backups..."
    
    BACKUP_DIR="$PROJECT_DIR/backups"
    if [ ! -d "$BACKUP_DIR" ]; then
        mkdir -p "$BACKUP_DIR"
        chmod 700 "$BACKUP_DIR"
        log_info "Dossier créé: $BACKUP_DIR"
    else
        log_info "Dossier existe déjà: $BACKUP_DIR"
    fi
}

setup_cron_jobs() {
    log_step "Configuration des tâches cron..."
    
    # Créer le fichier crontab temporaire
    CRON_FILE=$(mktemp)
    
    # Récupérer les cron jobs existants (sauf ceux de medaction)
    crontab -l 2>/dev/null | grep -v "medaction" > "$CRON_FILE" || true
    
    # Ajouter un commentaire de section
    echo "" >> "$CRON_FILE"
    echo "# ═══════════════════════════════════════════════════════════════════" >> "$CRON_FILE"
    echo "# PORTAIL MEDIOUNA - Tâches automatisées" >> "$CRON_FILE"
    echo "# ═══════════════════════════════════════════════════════════════════" >> "$CRON_FILE"
    echo "" >> "$CRON_FILE"
    
    # Backup quotidien à 2h00
    echo "# Backup quotidien de la base de données" >> "$CRON_FILE"
    echo "0 2 * * * cd $PROJECT_DIR && $BACKUP_SCRIPT >> $LOG_DIR/backup.log 2>&1 # medaction-backup" >> "$CRON_FILE"
    
    # Backup hebdomadaire complet le dimanche à 1h00
    echo "" >> "$CRON_FILE"
    echo "# Backup hebdomadaire complet (dimanche 1h00)" >> "$CRON_FILE"
    echo "0 1 * * 0 cd $PROJECT_DIR && BACKUP_RETENTION_DAYS=90 $BACKUP_SCRIPT >> $LOG_DIR/backup-weekly.log 2>&1 # medaction-weekly" >> "$CRON_FILE"
    
    # Nettoyage des logs vieux de 30 jours
    echo "" >> "$CRON_FILE"
    echo "# Nettoyage des anciens logs (chaque jour à 3h00)" >> "$CRON_FILE"
    echo "0 3 * * * find $LOG_DIR -name '*.log' -mtime +30 -delete # medaction-cleanup" >> "$CRON_FILE"
    
    # Rotation des logs
    echo "" >> "$CRON_FILE"
    echo "# Rotation des logs si taille > 100MB" >> "$CRON_FILE"
    echo "0 4 * * * find $LOG_DIR -name '*.log' -size +100M -exec mv {} {}.old \\; # medaction-rotate" >> "$CRON_FILE"
    
    # Health check (optionnel, décommenter si nécessaire)
    echo "" >> "$CRON_FILE"
    echo "# Health check toutes les 5 minutes (disponible si besoin)" >> "$CRON_FILE"
    echo "# */5 * * * * curl -sf http://localhost:3000/api/health > /dev/null || echo \"[ALERT] App down at \$(date)\" >> $LOG_DIR/health.log # medaction-health" >> "$CRON_FILE"
    
    # Installer les cron jobs
    crontab "$CRON_FILE"
    rm "$CRON_FILE"
    
    log_info "Tâches cron installées avec succès"
}

show_cron_jobs() {
    echo ""
    log_step "Tâches cron configurées:"
    echo ""
    echo "╔══════════════════════════════════════════════════════════════════╗"
    crontab -l 2>/dev/null | grep "medaction" | while read line; do
        echo "║ $line"
    done
    echo "╚══════════════════════════════════════════════════════════════════╝"
    echo ""
}

show_summary() {
    echo ""
    echo "╔══════════════════════════════════════════════════════════════════╗"
    echo "║              ✅ CONFIGURATION TERMINÉE                           ║"
    echo "╠══════════════════════════════════════════════════════════════════╣"
    echo "║                                                                  ║"
    echo "║  📁 Dossiers créés:                                              ║"
    echo "║     • $LOG_DIR (logs)                             ║"
    echo "║     • $PROJECT_DIR/backups                        ║"
    echo "║                                                                  ║"
    echo "║  ⏰ Tâches programmées:                                          ║"
    echo "║     • Backup quotidien: tous les jours à 2h00                    ║"
    echo "║     • Backup hebdo: dimanche à 1h00 (rétention 90j)              ║"
    echo "║     • Nettoyage logs: tous les jours à 3h00                      ║"
    echo "║     • Rotation logs: tous les jours à 4h00                       ║"
    echo "║                                                                  ║"
    echo "║  📋 Commandes utiles:                                            ║"
    echo "║     • Voir les tâches: crontab -l                                ║"
    echo "║     • Voir les logs: tail -f $LOG_DIR/backup.log  ║"
    echo "║     • Test manuel: $BACKUP_SCRIPT                 ║"
    echo "║                                                                  ║"
    echo "╚══════════════════════════════════════════════════════════════════╝"
    echo ""
}

# ============================================
# EXECUTION PRINCIPALE
# ============================================

echo ""
echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║        CONFIGURATION CRON - PORTAIL MEDIOUNA                     ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo ""

check_root
create_log_directory
create_backup_directory
make_scripts_executable
setup_cron_jobs
show_cron_jobs
show_summary

log_info "Configuration terminée! 🎉"
