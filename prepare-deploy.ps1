# ╔══════════════════════════════════════════════════════════════════════════════╗
# ║   SCRIPT DE PACKAGING POUR DEPLOIEMENT PROXMOX - MODE FULL OPTIMISÉ          ║
# ║   Utilise Dockerfile.standalone (mais en mode npm start + COPY --chown)      ║
# ╚══════════════════════════════════════════════════════════════════════════════╝

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   PREPARATION DU PACKAGE - MODE FULL OPTIMISÉ (npm start)        ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $projectRoot

# ═══════════════════════════════════════════════════════════════════════════════
# ÉTAPE 1: Nettoyage des caches (pour libérer de l'espace)
# ═══════════════════════════════════════════════════════════════════════════════
Write-Host "`n[1/5] Nettoyage des caches..." -ForegroundColor Yellow

if (Test-Path ".next") {
    Remove-Item -Recurse -Force ".next" -ErrorAction SilentlyContinue
    Write-Host "  ✓ .next supprimé" -ForegroundColor Green
}
else {
    Write-Host "  .next déjà nettoyé." -ForegroundColor Green
}

if (Test-Path "node_modules\.cache") {
    Remove-Item -Recurse -Force "node_modules\.cache" -ErrorAction SilentlyContinue
    Write-Host "  ✓ node_modules\.cache supprimé" -ForegroundColor Green
}

# ═══════════════════════════════════════════════════════════════════════════════
# ÉTAPE 2: Vérifications importantes
# ═══════════════════════════════════════════════════════════════════════════════
Write-Host "`n[2/5] Vérifications..." -ForegroundColor Yellow

# Vérifier que standalone est ACTIVÉ (Requis pour la stabilité Docker)
$nextConfig = Get-Content "next.config.mjs" -Raw
if ($nextConfig -match "(?m)^\s*output:\s*'standalone'") {
    Write-Host "  ✓ Mode standalone ACTIVÉ (Correct)" -ForegroundColor Green
}
else {
    Write-Host "  ⚠ ATTENTION: Mode standalone DÉSACTIVÉ dans next.config.mjs" -ForegroundColor Yellow
    Write-Host "  Cela peut causer des erreurs 'clientModules'. Activez 'output: standalone'." -ForegroundColor Yellow
}

# Vérifier Prisma binaryTargets
$prismaSchema = Get-Content "prisma\schema.prisma" -Raw
if ($prismaSchema -match "debian-openssl-1.1.x") {
    Write-Host "  ✓ Prisma configuré pour debian-openssl-1.1.x (Requis pour Bullseye)" -ForegroundColor Green
}
else {
    Write-Host "  ⚠ Prisma: debian-openssl-1.1.x non trouvé dans schema.prisma" -ForegroundColor Yellow
}

# Vérifier Dockerfile
if (Test-Path "Dockerfile") {
    Write-Host "  ✓ Dockerfile présent" -ForegroundColor Green
}
else {
    Write-Host "  ✗ ERREUR: Dockerfile manquant!" -ForegroundColor Red
    exit 1
}

# ═══════════════════════════════════════════════════════════════════════════════
# ÉTAPE 3: Vérifier le root layout (fix hydration)
# ═══════════════════════════════════════════════════════════════════════════════
Write-Host "`n[3/5] Vérification du layout..." -ForegroundColor Yellow

$rootLayout = Get-Content "app\layout.tsx" -Raw
if ($rootLayout -match "return children") {
    Write-Host "  ✓ app/layout.tsx est un pass-through (évite les duplications html/body)" -ForegroundColor Green
}
else {
    Write-Host "  ⚠ ATTENTION: app/layout.tsx pourrait avoir des balises html/body" -ForegroundColor Yellow
    Write-Host "    Cela peut causer des erreurs d'hydratation" -ForegroundColor Yellow
}

# ═══════════════════════════════════════════════════════════════════════════════
# ÉTAPE 4: Création du package TAR.GZ
# ═══════════════════════════════════════════════════════════════════════════════
Write-Host "`n[4/5] Création du package TAR.GZ..." -ForegroundColor Yellow

$tarName = "medaction-full.tar.gz"
if (Test-Path $tarName) {
    Remove-Item $tarName -Force
}

# Liste des fichiers/dossiers à inclure
$includes = @(
    "app",
    "components",
    "lib",
    "public",
    "prisma",
    "locales",
    "i18n",
    "hooks",
    "types",
    "package.json",
    "package-lock.json",
    "next.config.mjs",
    "tsconfig.json",
    "tsconfig.json",
    "tailwind.config.ts",
    "postcss.config.mjs",
    "build-on-windows.ps1",
    "Dockerfile.standalone"
)

# Filtrer les éléments existants
$existingItems = $includes | Where-Object { Test-Path $_ }
$missingItems = $includes | Where-Object { -not (Test-Path $_) }

if ($missingItems.Count -gt 0) {
    Write-Host "  ⚠ Éléments manquants (ignorés): $($missingItems -join ', ')" -ForegroundColor Yellow
}

# Créer le tar.gz
$itemsList = $existingItems -join " "
$cmd = "tar -czvf $tarName $itemsList"
Write-Host "  Exécution: tar -czvf $tarName ..." -ForegroundColor Gray
Invoke-Expression $cmd 2>&1 | Out-Null

if (Test-Path $tarName) {
    $sizeBytes = (Get-Item $tarName).Length
    $sizeMB = [math]::Round($sizeBytes / 1MB, 1)
    Write-Host "  ✓ $tarName créé ($sizeMB MB)" -ForegroundColor Green
}
else {
    Write-Host "  ✗ ERREUR: Échec de création du tar.gz" -ForegroundColor Red
    exit 1
}

# ═══════════════════════════════════════════════════════════════════════════════
# ÉTAPE 5: Instructions de déploiement
# ═══════════════════════════════════════════════════════════════════════════════
Write-Host "`n[5/5] PACKAGE PRÊT!" -ForegroundColor Green

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                    INSTRUCTIONS DE DÉPLOIEMENT                    ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan

Write-Host ""
Write-Host "1. Transférez '$tarName' avec WinSCP :" -ForegroundColor White
Write-Host "   - Hôte : IP_DE_VOTRE_PROXMOX" -ForegroundColor Gray
Write-Host "   - Utilisateur : root" -ForegroundColor Gray
Write-Host "   - Destination : /tmp/" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Sur Proxmox (shell serveur):" -ForegroundColor White
Write-Host "   pct push 100 /tmp/$tarName /root/build/$tarName" -ForegroundColor Gray
Write-Host "   pct enter 100" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Dans le conteneur 100:" -ForegroundColor White
Write-Host "   cd /root/build" -ForegroundColor Gray
Write-Host "   rm -rf app components lib public prisma locales i18n hooks types *.json *.mjs *.ts *.class Dockerfile.* .next" -ForegroundColor Gray
Write-Host "   tar -xzvf $tarName" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Build Docker (MODE FULL OPTIMISÉ):" -ForegroundColor White
Write-Host "   docker build --no-cache -f Dockerfile.standalone -t medaction-app:full ." -ForegroundColor Gray
Write-Host "   docker stop medaction-app 2>/dev/null; docker rm medaction-app 2>/dev/null" -ForegroundColor Gray
Write-Host ""
Write-Host "5. Docker run (AVEC MOT DE PASSE CORRIGÉ):" -ForegroundColor Yellow
Write-Host @"
   docker run -d \
     --name medaction-app \
     --restart unless-stopped \
     -p 3000:3000 \
     -e DATABASE_URL='postgresql://medaction:Mediouna2024\!@192.168.1.83:5432/medaction_prod?schema=public' \
     -e NEXTAUTH_URL='https://bo.provincemediouna.ma' \
     -e NEXTAUTH_SECRET='lwcM7sCqBQ5FLuKkrOUUCjp3tQ+DQjv2s8UiSKTYRTg=' \
     -e NODE_ENV='production' \
     -e LICENSE_KEY='MED-0D84-C0A3-3DF4-C9AF' \
     -e LICENSE_DOMAINS='localhost,127.0.0.1,mediouna.gov.ma,bo.provincemediouna.ma,192.168.1.83' \
     -e LICENSE_EXPIRY='2026-12-25' \
     medaction-app:full
"@ -ForegroundColor Cyan
Write-Host ""
Write-Host "6. Vérifier les logs:" -ForegroundColor White
Write-Host "   docker logs -f medaction-app" -ForegroundColor Gray
Write-Host ""
