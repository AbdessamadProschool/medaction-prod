# Script de packaging pour deploiement Proxmox - MODE FULL (sans standalone)
# Utilise tar au lieu de Compress-Archive pour eviter les problemes d'encodage

Write-Host "PREPARATION DU PACKAGE POUR DEPLOIEMENT (MODE FULL)" -ForegroundColor Cyan

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $projectRoot

# Nettoyage
Write-Host "`nNettoyage des caches..." -ForegroundColor Yellow

if (Test-Path ".next") {
    Remove-Item -Recurse -Force ".next" -ErrorAction SilentlyContinue
    Write-Host "  .next supprime" -ForegroundColor Green
}

if (Test-Path "node_modules\.cache") {
    Remove-Item -Recurse -Force "node_modules\.cache" -ErrorAction SilentlyContinue
    Write-Host "  node_modules\.cache supprime" -ForegroundColor Green
}

# Verification next.config.mjs - Mode standalone doit etre DESACTIVE
Write-Host "`nVerification de next.config.mjs..." -ForegroundColor Yellow

$nextConfig = Get-Content "next.config.mjs" -Raw
if ($nextConfig -match "//\s*output:\s*'standalone'") {
    Write-Host "  Mode standalone DESACTIVE (OK pour mode full)" -ForegroundColor Green
}
elseif ($nextConfig -match "output:\s*'standalone'") {
    Write-Host "  ATTENTION: Mode standalone active - Commentez-le dans next.config.mjs" -ForegroundColor Yellow
    Write-Host "  Le mode full fonctionnera quand meme car Docker fera le build" -ForegroundColor Gray
}
else {
    Write-Host "  Mode standalone non trouve (OK)" -ForegroundColor Green
}

# Creation du package avec tar
Write-Host "`nCreation du package TAR.GZ..." -ForegroundColor Yellow

$tarName = "medaction-full.tar.gz"
if (Test-Path $tarName) {
    Remove-Item $tarName -Force
}

# Liste des fichiers/dossiers a inclure
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
    "tailwind.config.ts",
    "postcss.config.mjs",
    "Dockerfile.full"
)

# Filtrer les elements existants
$existingItems = $includes | Where-Object { Test-Path $_ }

# Creer le tar.gz avec l'outil tar natif de Windows
$itemsList = $existingItems -join " "
$cmd = "tar -czvf $tarName $itemsList"
Write-Host "  Execution: $cmd" -ForegroundColor Gray
Invoke-Expression $cmd

if (Test-Path $tarName) {
    $sizeBytes = (Get-Item $tarName).Length
    $sizeMB = [math]::Round($sizeBytes / 1MB, 1)
    Write-Host "  $tarName cree ($sizeMB MB)" -ForegroundColor Green
}
else {
    Write-Host "  ERREUR: Echec de creation du tar.gz" -ForegroundColor Red
    exit 1
}

Write-Host "`nPACKAGE PRET!" -ForegroundColor Green
Write-Host "`nInstructions de deploiement:" -ForegroundColor Cyan
Write-Host "  1. Uploadez $tarName sur Google Drive" -ForegroundColor White
Write-Host "  2. Sur Proxmox (root@pve):" -ForegroundColor White
Write-Host "     gdown 'VOTRE_LIEN'" -ForegroundColor Gray
Write-Host "     pct push 100 /tmp/$tarName /root/build/$tarName" -ForegroundColor Gray
Write-Host "  3. Dans le conteneur:" -ForegroundColor White
Write-Host "     cd /root/build && rm -rf app components lib public prisma locales i18n hooks types *.json *.mjs *.ts Dockerfile.*" -ForegroundColor Gray
Write-Host "     tar -xzvf $tarName" -ForegroundColor Gray
Write-Host "     docker build --no-cache -f Dockerfile.full -t medaction-app:full ." -ForegroundColor Gray
Write-Host "     docker stop medaction-app; docker rm medaction-app" -ForegroundColor Gray
Write-Host "     docker run -d --name medaction-app -p 3000:3000 ... medaction-app:full" -ForegroundColor Gray
