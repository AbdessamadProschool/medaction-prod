# ╔══════════════════════════════════════════════════════════════════════════════╗
# ║   SCRIPT DE BUILD LOCAL (WINDOWS DOCKER DESKTOP)                             ║
# ║   Ce script construit l'image localement et l'exporte en .tar                ║
# ╚══════════════════════════════════════════════════════════════════════════════╝

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   BUILD DOCKER LOCAL & EXPORT D'IMAGE                            ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan

# Vérifier Docker
if (-not (Get-Command "docker" -ErrorAction SilentlyContinue)) {
    Write-Host "✗ Docker n'est pas installé ou détecté !" -ForegroundColor Red
    Write-Host "  Installez Docker Desktop sur ce PC avant de continuer."
    exit 1
}

if (!(docker info 2>$null)) {
    Write-Host "✗ Docker Desktop n'est pas lancé !" -ForegroundColor Red
    Write-Host "  Lancez Docker Desktop et réessayez."
    exit 1
}

# 1. Nettoyage ancienne compilation
Write-Host "`n[1/3] Nettoyage..." -ForegroundColor Yellow
if (Test-Path "medaction-image.tar") { Remove-Item "medaction-image.tar" }
docker rmi medaction-app:prod -f 2>$null

# 2. Construction de l'image (Utilisation du Dockerfile unique et propre)
Write-Host "`n[2/3] Construction de l'image Docker (Patience, ça chauffe !)..." -ForegroundColor Yellow
docker build --no-cache -t medaction-app:prod .

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ ÉCHEC DU BUILD DOCKER" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Image construite avec succès" -ForegroundColor Green

# 3. Export de l'image en fichier
Write-Host "`n[3/3] Export de l'image vers 'medaction-image.tar'..." -ForegroundColor Yellow
Write-Host "    (Cela peut prendre quelques minutes car l'image est grosse)" -ForegroundColor Gray

docker save -o medaction-image.tar medaction-app:prod

if (Test-Path "medaction-image.tar") {
    $size = (Get-Item "medaction-image.tar").Length / 1MB
    Write-Host "✓ Export terminé : medaction-image.tar ($([math]::Round($size, 0)) MB)" -ForegroundColor Green
    
    Write-Host ""
    Write-Host "╔══════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║   PRÊT POUR LE TRANSFERT !                                       ║" -ForegroundColor Cyan
    Write-Host "╚══════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
    Write-Host "1. Transférez le fichier 'medaction-image.tar' vers votre serveur Proxmox via WinSCP."
    Write-Host "   Destination : /tmp/"
    Write-Host ""
    Write-Host "2. Sur le serveur Proxmox (Shell) :"
    Write-Host "   pct enter 100"
    Write-Host "   docker load -i /tmp/medaction-image.tar"
    Write-Host ""
    Write-Host "3. Lancez le conteneur :"
    Write-Host "   (Copiez la commande docker run fournie dans prepare-deploy.ps1)"
}
else {
    Write-Host "✗ Échec de l'export de l'image" -ForegroundColor Red
}
