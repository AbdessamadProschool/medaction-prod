$Server = "root@192.168.1.18"
$TarFile = "medaction-app-security-update.tar"

Write-Host "Attente de la création de $TarFile..."
while (-not (Test-Path $TarFile)) { Start-Sleep -Seconds 5 }

Write-Host "Fichier trouvé ! Upload vers $Server..."
scp docker-compose.server.yml $TarFile deploy-security-update.sh "${Server}:/tmp/"

Write-Host "Exécution du déploiement sur le serveur..."
ssh $Server "mv /tmp/docker-compose.server.yml /tmp/deploy-security-update.sh /root/ && chmod +x /root/deploy-security-update.sh && /root/deploy-security-update.sh"
