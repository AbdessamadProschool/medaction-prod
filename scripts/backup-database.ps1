# ╔══════════════════════════════════════════════════════════════════════════════╗
# ║          SCRIPT DE BACKUP POSTGRESQL - WINDOWS                               ║
# ║                    Portail Mediouna Action                                   ║
# ╚══════════════════════════════════════════════════════════════════════════════╝
#
# Usage: .\scripts\backup-database.ps1
# Planification: Utiliser le Planificateur de tâches Windows
#
# Variables d'environnement requises:
#   - POSTGRES_PASSWORD (ou définir dans le script)
#   - POSTGRES_USER (défaut: medaction)
#   - POSTGRES_DB (défaut: medaction)

# Configuration
$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectDir = Split-Path -Parent $ScriptDir
$Date = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"

# Paramètres de connexion (modifier selon votre configuration)
$POSTGRES_HOST = if ($env:POSTGRES_HOST) { $env:POSTGRES_HOST } else { "localhost" }
$POSTGRES_PORT = if ($env:POSTGRES_PORT) { $env:POSTGRES_PORT } else { "5432" }
$POSTGRES_USER = if ($env:POSTGRES_USER) { $env:POSTGRES_USER } else { "medaction" }
$POSTGRES_DB = if ($env:POSTGRES_DB) { $env:POSTGRES_DB } else { "medaction" }
$POSTGRES_PASSWORD = $env:POSTGRES_PASSWORD

# Dossier de backup
$BACKUP_DIR = if ($env:BACKUP_DIR) { $env:BACKUP_DIR } else { "$ProjectDir\backups" }
$BACKUP_FILE = "$BACKUP_DIR\medaction_$Date.sql"
$BACKUP_FILE_ZIP = "$BACKUP_FILE.zip"

# Rétention des backups (en jours)
$RETENTION_DAYS = if ($env:BACKUP_RETENTION_DAYS) { [int]$env:BACKUP_RETENTION_DAYS } else { 30 }

# ============================================
# FONCTIONS
# ============================================

function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $Color = switch ($Level) {
        "INFO"  { "Green" }
        "WARN"  { "Yellow" }
        "ERROR" { "Red" }
        default { "White" }
    }
    Write-Host "[$Level] $Timestamp - $Message" -ForegroundColor $Color
}

function Test-PostgresInstalled {
    try {
        $null = Get-Command pg_dump -ErrorAction Stop
        return $true
    }
    catch {
        return $false
    }
}

# ============================================
# EXECUTION PRINCIPALE
# ============================================

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║              BACKUP POSTGRESQL - PORTAIL MEDIOUNA                ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Vérifier que pg_dump est installé
if (-not (Test-PostgresInstalled)) {
    Write-Log "pg_dump n'est pas installé ou n'est pas dans le PATH" "ERROR"
    Write-Log "Installez PostgreSQL et ajoutez le dossier bin au PATH" "ERROR"
    exit 1
}

# Vérifier le mot de passe
if (-not $POSTGRES_PASSWORD) {
    Write-Log "POSTGRES_PASSWORD n'est pas défini" "ERROR"
    Write-Log "Définissez la variable d'environnement POSTGRES_PASSWORD" "ERROR"
    exit 1
}

# Créer le dossier de backup si nécessaire
if (-not (Test-Path $BACKUP_DIR)) {
    Write-Log "Création du dossier de backup: $BACKUP_DIR"
    New-Item -ItemType Directory -Force -Path $BACKUP_DIR | Out-Null
}

# Définir le mot de passe pour pg_dump
$env:PGPASSWORD = $POSTGRES_PASSWORD

Write-Log "Démarrage du backup..."
Write-Log "Base: $POSTGRES_DB | Hôte: ${POSTGRES_HOST}:${POSTGRES_PORT}"

try {
    # Exécuter pg_dump
    $pgDumpArgs = @(
        "-h", $POSTGRES_HOST,
        "-p", $POSTGRES_PORT,
        "-U", $POSTGRES_USER,
        "-d", $POSTGRES_DB,
        "-f", $BACKUP_FILE,
        "--no-owner",
        "--no-privileges",
        "--clean",
        "--if-exists"
    )
    
    & pg_dump @pgDumpArgs
    
    if ($LASTEXITCODE -ne 0) {
        throw "pg_dump a échoué avec le code: $LASTEXITCODE"
    }
    
    # Vérifier que le fichier a été créé
    if (Test-Path $BACKUP_FILE) {
        $BackupSize = (Get-Item $BACKUP_FILE).Length / 1MB
        Write-Log "Backup SQL créé: $BACKUP_FILE ($([math]::Round($BackupSize, 2)) MB)"
        
        # Compression
        Write-Log "Compression en cours..."
        Compress-Archive -Path $BACKUP_FILE -DestinationPath $BACKUP_FILE_ZIP -Force
        
        # Supprimer le fichier SQL non compressé
        Remove-Item $BACKUP_FILE
        
        $ZipSize = (Get-Item $BACKUP_FILE_ZIP).Length / 1MB
        Write-Log "Backup compressé: $BACKUP_FILE_ZIP ($([math]::Round($ZipSize, 2)) MB)"
    }
    else {
        throw "Le fichier de backup n'a pas été créé"
    }
    
    # Nettoyage des anciens backups
    Write-Log "Nettoyage des backups de plus de $RETENTION_DAYS jours..."
    $CutoffDate = (Get-Date).AddDays(-$RETENTION_DAYS)
    $OldBackups = Get-ChildItem -Path $BACKUP_DIR -Filter "medaction_*.zip" | Where-Object { $_.LastWriteTime -lt $CutoffDate }
    
    if ($OldBackups.Count -gt 0) {
        $OldBackups | Remove-Item -Force
        Write-Log "Supprimé $($OldBackups.Count) ancien(s) backup(s)"
    }
    else {
        Write-Log "Aucun ancien backup à supprimer"
    }
    
    # Statistiques
    $AllBackups = Get-ChildItem -Path $BACKUP_DIR -Filter "medaction_*.zip"
    $TotalSize = ($AllBackups | Measure-Object -Property Length -Sum).Sum / 1MB
    
    Write-Host ""
    Write-Log "=== Statistiques ===" 
    Write-Log "Total backups: $($AllBackups.Count)"
    Write-Log "Taille totale: $([math]::Round($TotalSize, 2)) MB"
    
    Write-Host ""
    Write-Log "Backup terminé avec succès ✅"
}
catch {
    Write-Log "Erreur lors du backup: $_" "ERROR"
    exit 1
}
finally {
    # Nettoyer le mot de passe
    $env:PGPASSWORD = $null
}
