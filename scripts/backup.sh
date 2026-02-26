#!/bin/bash
# ╔══════════════════════════════════════════════════════════════════════════════╗
# ║                    BACKUP SCRIPT - MEDACTION                                 ║
# ║                         Province de Médiouna                                 ║
# ╚══════════════════════════════════════════════════════════════════════════════╝
#
# Usage: ./scripts/backup.sh
# Creates timestamped database backup

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
MAGENTA='\033[0;35m'
NC='\033[0m'

# Configuration
BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DB_NAME="${POSTGRES_DB:-medaction}"
DB_USER="${POSTGRES_USER:-medaction}"
BACKUP_FILE="${BACKUP_DIR}/medaction_${TIMESTAMP}.sql"
BACKUP_FILE_GZ="${BACKUP_FILE}.gz"

echo -e "${MAGENTA}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║           MEDACTION - Database Backup                       ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Create backup directory
mkdir -p "${BACKUP_DIR}"

# Check if postgres container is running
if ! docker-compose ps postgres | grep -q "Up"; then
    echo -e "${YELLOW}⚠ PostgreSQL container is not running!${NC}"
    exit 1
fi

echo -e "${BLUE}📦 Creating backup...${NC}"
echo -e "  Database: ${DB_NAME}"
echo -e "  File: ${BACKUP_FILE_GZ}"
echo ""

# Create backup
docker-compose exec -T postgres pg_dump -U ${DB_USER} ${DB_NAME} | gzip > "${BACKUP_FILE_GZ}"

if [ $? -eq 0 ]; then
    BACKUP_SIZE=$(du -h "${BACKUP_FILE_GZ}" | cut -f1)
    echo -e "${GREEN}✅ Backup created successfully!${NC}"
    echo -e "  Size: ${BACKUP_SIZE}"
    echo ""
    
    # Keep only last 10 backups
    echo -e "${BLUE}🧹 Cleaning old backups (keeping last 10)...${NC}"
    cd "${BACKUP_DIR}" && ls -t *.sql.gz 2>/dev/null | tail -n +11 | xargs -r rm
    echo -e "${GREEN}✓ Cleanup complete${NC}"
    
    # List backups
    echo ""
    echo -e "${BLUE}📋 Available backups:${NC}"
    ls -lh "${BACKUP_DIR}"/*.sql.gz 2>/dev/null | tail -5
else
    echo -e "${RED}❌ Backup failed!${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}📥 To restore, run:${NC}"
echo -e "  gunzip -c ${BACKUP_FILE_GZ} | docker-compose exec -T postgres psql -U ${DB_USER} ${DB_NAME}"
echo ""
