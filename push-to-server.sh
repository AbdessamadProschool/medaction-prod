#!/bin/bash
SERVER="root@192.168.1.18"
TAR_FILE="medaction-app-security-update.tar"
SCRIPT_FILE="deploy-security-update.sh"
COMPOSE_FILE="docker-compose.server.yml"

echo " waiting for $TAR_FILE..."
while [ ! -f "$TAR_FILE" ]; do sleep 5; done

echo "Uploading files to $SERVER..."
scp "$TAR_FILE" "$COMPOSE_FILE" "$SCRIPT_FILE" $SERVER:/tmp/

echo "Running deployment script on server..."
ssh $SERVER "mv /tmp/$COMPOSE_FILE /tmp/$SCRIPT_FILE /root/ && chmod +x /root/$SCRIPT_FILE && /root/$SCRIPT_FILE"
