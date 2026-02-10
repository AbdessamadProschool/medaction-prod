# ════════════════════════════════════════════════════════════════════════════
# SCRIPT DE BUILD - CORRECTIONS DE SÉCURITÉ MEDACTION
# ════════════════════════════════════════════════════════════════════════════
#
# Ce script construit l'image Docker avec les corrections de sécurité
# Exécutez-le sur votre machine Windows (avec Docker Desktop)
#
# Usage: .\build-security-update.ps1
#
# ════════════════════════════════════════════════════════════════════════════

Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  🛡️  BUILD DES CORRECTIONS DE SÉCURITÉ - MEDACTION" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Configuration
$IMAGE_NAME = "medaction-app"
$IMAGE_TAG = "latest"
$OUTPUT_FILE = "medaction-app-security-update.tar"

# Vérifier que Docker est disponible
Write-Host "🔍 Vérification de Docker..." -ForegroundColor Yellow
try {
    docker version | Out-Null
    Write-Host "✅ Docker est disponible" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker n'est pas disponible. Lancez Docker Desktop." -ForegroundColor Red
    exit 1
}
Write-Host ""

# Étape 1: Build de l'image
Write-Host "📦 Construction de l'image Docker..." -ForegroundColor Yellow
Write-Host "   Cela peut prendre plusieurs minutes..." -ForegroundColor Gray
Write-Host ""

docker build -t "${IMAGE_NAME}:${IMAGE_TAG}" .

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erreur lors du build de l'image" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ Image construite avec succès" -ForegroundColor Green
Write-Host ""

# Étape 2: Exporter l'image
Write-Host "💾 Export de l'image Docker..." -ForegroundColor Yellow
docker save "${IMAGE_NAME}:${IMAGE_TAG}" -o $OUTPUT_FILE

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erreur lors de l'export de l'image" -ForegroundColor Red
    exit 1
}

$fileSize = (Get-Item $OUTPUT_FILE).Length / 1MB
Write-Host "✅ Image exportée: $OUTPUT_FILE ($('{0:N2}' -f $fileSize) MB)" -ForegroundColor Green
Write-Host ""

# Résumé
Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  ✅ BUILD TERMINÉ" -ForegroundColor Green
Write-Host "════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Fichiers créés:" -ForegroundColor Yellow
Write-Host "   • $OUTPUT_FILE" -ForegroundColor White
Write-Host "   • deploy-security-update.sh (script de déploiement)" -ForegroundColor White
Write-Host ""
Write-Host "🚀 Prochaines étapes:" -ForegroundColor Yellow
Write-Host "   1. Transférer les fichiers vers le serveur:" -ForegroundColor White
Write-Host "      scp $OUTPUT_FILE user@192.168.1.18:/tmp/" -ForegroundColor Gray
Write-Host "      scp deploy-security-update.sh user@192.168.1.18:/root/" -ForegroundColor Gray
Write-Host ""
Write-Host "   2. Se connecter au serveur et exécuter:" -ForegroundColor White
Write-Host "      ssh user@192.168.1.18" -ForegroundColor Gray
Write-Host "      chmod +x deploy-security-update.sh" -ForegroundColor Gray
Write-Host "      ./deploy-security-update.sh" -ForegroundColor Gray
Write-Host ""
