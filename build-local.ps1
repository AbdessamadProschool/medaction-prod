<# 
╔══════════════════════════════════════════════════════════════════════════════╗
║                    BUILD-LOCAL.PS1 - MEDACTION                               ║
║                    Province de Médiouna                                       ║
║                                                                               ║
║  Script PowerShell pour créer une image Docker à partir du build local       ║
║  Optimisé pour Windows avec Docker Desktop                                    ║
╚══════════════════════════════════════════════════════════════════════════════╝

Usage:
  .\build-local.ps1                    # Build standard
  .\build-local.ps1 -SkipNpmBuild      # Skip npm build (si déjà fait)
  .\build-local.ps1 -OutputFile "custom.tar"  # Nom personnalisé

#>

param(
    [switch]$SkipNpmBuild,
    [string]$OutputFile = "medaction-app-clean.tar",
    [string]$ImageName = "medaction-app",
    [string]$ImageTag = "latest"
)

# ═══════════════════════════════════════════════════════════════════════════════
# Configuration
# ═══════════════════════════════════════════════════════════════════════════════

$ErrorActionPreference = "Stop"
$ProjectRoot = $PSScriptRoot
if (-not $ProjectRoot) { $ProjectRoot = Get-Location }

# Colors for output
function Write-Step { param([string]$Message) Write-Host "▶ $Message" -ForegroundColor Cyan }
function Write-Success { param([string]$Message) Write-Host "✓ $Message" -ForegroundColor Green }
function Write-Error { param([string]$Message) Write-Host "✗ $Message" -ForegroundColor Red }
function Write-Info { param([string]$Message) Write-Host "  $Message" -ForegroundColor Gray }

# ═══════════════════════════════════════════════════════════════════════════════
# Header
# ═══════════════════════════════════════════════════════════════════════════════

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════════════╗" -ForegroundColor Yellow
Write-Host "║         MEDACTION - Docker Build Script (Local)                   ║" -ForegroundColor Yellow
Write-Host "║                   Province de Médiouna                            ║" -ForegroundColor Yellow
Write-Host "╚══════════════════════════════════════════════════════════════════╝" -ForegroundColor Yellow
Write-Host ""

# ═══════════════════════════════════════════════════════════════════════════════
# Pre-flight Checks
# ═══════════════════════════════════════════════════════════════════════════════

Write-Step "Vérification des prérequis..."

# Check Docker
try {
    $dockerVersion = docker --version
    Write-Success "Docker installé: $dockerVersion"
}
catch {
    Write-Error "Docker n'est pas installé ou n'est pas démarré!"
    Write-Info "Veuillez démarrer Docker Desktop et réessayer."
    exit 1
}

# Check Docker is running
try {
    docker info | Out-Null
    Write-Success "Docker Desktop est en cours d'exécution"
}
catch {
    Write-Error "Docker Desktop n'est pas démarré!"
    Write-Info "Veuillez démarrer Docker Desktop et réessayer."
    exit 1
}

# ═══════════════════════════════════════════════════════════════════════════════
# Clean Previous Build (optional)
# ═══════════════════════════════════════════════════════════════════════════════

Write-Step "Nettoyage des fichiers temporaires..."

if (Test-Path ".next") {
    if (-not $SkipNpmBuild) {
        Remove-Item -Recurse -Force ".next" -ErrorAction SilentlyContinue
        Write-Success "Dossier .next supprimé"
    }
    else {
        Write-Info "Dossier .next conservé (SkipNpmBuild activé)"
    }
}

Remove-Item -Recurse -Force "node_modules\.cache" -ErrorAction SilentlyContinue

# ═══════════════════════════════════════════════════════════════════════════════
# NPM Build
# ═══════════════════════════════════════════════════════════════════════════════

# Npm build disabled for Docker-internal build strategy
# if (-not $SkipNpmBuild) {
#    ...
# }
Write-Info "Le build sera effectué DANS Docker pour garantir la compatibilité Linux"

# ═══════════════════════════════════════════════════════════════════════════════
# Prepare Docker Build
# ═══════════════════════════════════════════════════════════════════════════════

Write-Step "Préparation du build Docker..."

# Backup original .dockerignore
$dockerignoreBackup = $false
if (Test-Path ".dockerignore") {
    Rename-Item ".dockerignore" ".dockerignore.backup" -Force
    $dockerignoreBackup = $true
    Write-Info "Backup de .dockerignore créé"
}

# Use local dockerignore
Copy-Item ".dockerignore.local" ".dockerignore" -Force
Write-Success "Utilisation de .dockerignore.local"

# ═══════════════════════════════════════════════════════════════════════════════
# Docker Build
# ═══════════════════════════════════════════════════════════════════════════════

Write-Step "Construction de l'image Docker..."
Write-Info "Image: ${ImageName}:${ImageTag}"

try {
    docker build -f Dockerfile.local -t "${ImageName}:${ImageTag}" .
    
    if ($LASTEXITCODE -ne 0) {
        throw "Docker build failed"
    }
    
    Write-Success "Image Docker créée: ${ImageName}:${ImageTag}"
}
catch {
    Write-Error "Le build Docker a échoué: $_"
    
    # Restore dockerignore
    if ($dockerignoreBackup) {
        Remove-Item ".dockerignore" -Force -ErrorAction SilentlyContinue
        Rename-Item ".dockerignore.backup" ".dockerignore" -Force
    }
    
    exit 1
}

# ═══════════════════════════════════════════════════════════════════════════════
# Save Image
# ═══════════════════════════════════════════════════════════════════════════════

Write-Step "Sauvegarde de l'image Docker..."
Write-Info "Fichier de sortie: $OutputFile"

docker save "${ImageName}:${ImageTag}" -o $OutputFile

if ($LASTEXITCODE -ne 0) {
    Write-Error "La sauvegarde de l'image a échoué!"
    exit 1
}

$fileSize = (Get-Item $OutputFile).Length / 1MB
Write-Success "Image sauvegardée: $OutputFile ($([math]::Round($fileSize, 2)) MB)"

# ═══════════════════════════════════════════════════════════════════════════════
# Cleanup
# ═══════════════════════════════════════════════════════════════════════════════

Write-Step "Nettoyage..."

# Restore original .dockerignore
Remove-Item ".dockerignore" -Force -ErrorAction SilentlyContinue
if ($dockerignoreBackup) {
    Rename-Item ".dockerignore.backup" ".dockerignore" -Force
    Write-Success ".dockerignore original restauré"
}

# ═══════════════════════════════════════════════════════════════════════════════
# Summary
# ═══════════════════════════════════════════════════════════════════════════════

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                    BUILD TERMINÉ AVEC SUCCÈS !                    ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "  Fichier créé: $OutputFile" -ForegroundColor White
Write-Host "  Taille: $([math]::Round($fileSize, 2)) MB" -ForegroundColor White
Write-Host ""
Write-Host "  Prochaines étapes:" -ForegroundColor Yellow
Write-Host "  1. Uploadez '$OutputFile' sur Google Drive" -ForegroundColor Gray
Write-Host "  2. Sur Proxmox, utilisez gdown pour télécharger" -ForegroundColor Gray
Write-Host "  3. docker load -i $OutputFile" -ForegroundColor Gray
Write-Host ""
