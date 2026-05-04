# Migration
$source = ".\public\uploads"
$target = ".\uploads"

if (Test-Path $source) {
    if (-not (Test-Path $target)) { New-Item -ItemType Directory -Path $target }
    Copy-Item -Path "$source\*" -Destination $target -Recurse -Force
    Write-Host "Done"
} else {
    Write-Host "Source not found"
}
