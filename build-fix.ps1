
Write-Host "╔════════════════════════════════════════════════════════════╗"
Write-Host "║   BUILD DOCKER FIX (Clean Dependencies)                      ║"
Write-Host "╚════════════════════════════════════════════════════════════╝"

$DOCKERFILE = "Dockerfile.fix"
$IMAGE_NAME = "medaction-app:fix"
$EXPORT_FILE = "medaction-fix.tar"

# 1. Nettoyage
if (Test-Path $EXPORT_FILE) { Remove-Item $EXPORT_FILE }
docker rmi $IMAGE_NAME -f 2>$null

# 2. Build
Write-Host "Building Docker image... (This will take a few minutes)"
docker build --no-cache -f $DOCKERFILE -t $IMAGE_NAME .

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}

# 3. Export
Write-Host "Exporting image to $EXPORT_FILE..."
docker save -o $EXPORT_FILE $IMAGE_NAME

if (Test-Path $EXPORT_FILE) {
    $size = (Get-Item $EXPORT_FILE).Length / 1MB
    Write-Host "✅ Success! File created: $EXPORT_FILE ($([math]::Round($size, 0)) MB)" -ForegroundColor Green
    Write-Host ""
    Write-Host "INSTRUCTIONS :"
    Write-Host "1. Transfer $EXPORT_FILE to Proxmox (/tmp/)"
    Write-Host "2. On Proxmox:"
    Write-Host "   pct enter 100"
    Write-Host "   docker load -i /tmp/$EXPORT_FILE"
    Write-Host "   docker stop medaction-app || true"
    Write-Host "   docker rm medaction-app || true"
    Write-Host "   docker run -d --name medaction-app --restart unless-stopped -p 3000:3000 -e DATABASE_URL='...' -e NEXTAUTH_URL='...' $IMAGE_NAME"
}
else {
    Write-Host "❌ Export failed!" -ForegroundColor Red
}
