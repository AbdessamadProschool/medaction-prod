<# 
╔══════════════════════════════════════════════════════════════════════════════╗
║                  PACKAGE-SOURCE.PS1 - MEDACTION                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
#>

$OutputFile = "medaction-source-ready.zip"

Write-Host "Création de l'archive source: $OutputFile..." -ForegroundColor Cyan

if (Test-Path $OutputFile) { Remove-Item $OutputFile }

# ON EXCLUT .next et node_modules
# On veut que le serveur Linux construise ses propres fichiers !
$files = @(
    "package.json",
    "package-lock.json",
    "next.config.mjs",
    "prisma",
    "public",
    "components", 
    "app",
    "lib",
    "hooks",
    "styles",
    "types",
    "utils",
    "locales",
    "i18n",
    "Dockerfile.local",
    "tsconfig.json",
    "middleware.ts",
    "postcss.config.mjs",
    "tailwind.config.ts"
)

# On filtre les fichiers qui n'existent pas pour éviter les erreurs
$existingFiles = $files | Where-Object { Test-Path $_ }

Compress-Archive -Path $existingFiles -DestinationPath $OutputFile -Force

Write-Host "Archive propre créée !" -ForegroundColor Green
Write-Host "Taille: $([math]::Round((Get-Item $OutputFile).Length / 1MB, 2)) MB" -ForegroundColor White
