#!/bin/bash

# ╔══════════════════════════════════════════════════════════════════════════════╗
# ║                  SCRIPT DE MAINTENANCE SERVEUR - MEDACTION                   ║
# ╚══════════════════════════════════════════════════════════════════════════════╝

COMMAND=$1
BACKUP_PATH=$2

case $COMMAND in
    backup)
        echo "🚀 Démarrage de la sauvegarde complète..."
        TIMESTAMP=$(date +%Y-%m-%dT%H-%M-%S)
        BACKUP_DIR="./backups/full-backup-$TIMESTAMP"
        mkdir -p "$BACKUP_DIR"

        # 1. Base de données
        echo "📊 Sauvegarde de la base de données..."
        docker exec medaction-postgres pg_dump -U medaction medaction -F c > "$BACKUP_DIR/database.dump"
        
        # 2. Uploads
        echo "📂 Sauvegarde des images..."
        docker exec medaction-app tar -czf - -C /app/public/uploads . > "$BACKUP_DIR/uploads.zip"

        # 3. Miroir secondaire (si configuré)
        # Adaptatif selon votre config Proxmox
        if [ -d "/mnt/data/backups" ]; then
            echo "💾 Miroir sur disque secondaire..."
            cp -r "$BACKUP_DIR" "/mnt/data/backups/"
        fi

        echo "✅ Sauvegarde réussie dans : $BACKUP_DIR"
        ;;

    clear)
        echo "🗑️ Vidage des tables : Evenement, ProgrammeActivite, Campagne..."
        # On utilise docker exec prisma pour être sûr d'avoir les bons accès
        docker exec medaction-app npx -y tsx scripts/clear-tables.ts
        ;;

    restore)
        if [ -z "$BACKUP_PATH" ]; then
            echo "❌ Erreur : Veuillez spécifier le chemin du backup."
            echo "Usage: ./scripts/maintenance.sh restore ./backups/full-backup-XYZ"
            exit 1
        fi
        echo "🚀 Restauration depuis $BACKUP_PATH..."
        
        # 1. Base
        cat "$BACKUP_PATH/database.dump" | docker exec -i medaction-postgres pg_restore -U medaction -d medaction -c
        
        # 2. Uploads
        cat "$BACKUP_PATH/uploads.zip" | docker exec -i medaction-app tar -xzf - -C /app/public/uploads
        
        echo "✅ Restauration terminée."
        ;;

    *)
        echo "Usage: $0 {backup|clear|restore [path]}"
        exit 1
        ;;
esac
