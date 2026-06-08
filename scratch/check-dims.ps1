Add-Type -AssemblyName System.Drawing
$dir = "c:\Users\Proschool\Desktop\medaction\public\images\guide"
$files = @(
  "home_ar","home_fr","home",
  "map_ar","map_fr","map",
  "etablissements_ar","etablissements",
  "evenements_ar","evenements",
  "campagnes_ar","campagnes",
  "actualites_ar","actualites",
  "statistiques_ar","statistiques",
  "login_ar","register_ar",
  "contact_ar","accessibilite_ar",
  "confidentialite_ar","conditions_ar",
  "participation_ar","suggestions_new_ar",
  "reclamation","news","participation"
)
foreach ($name in $files) {
  $path = Join-Path $dir "$name.png"
  if (Test-Path $path) {
    $img = [System.Drawing.Image]::FromFile($path)
    Write-Output "$name : $($img.Width)x$($img.Height) ratio=$('{0:F2}' -f ($img.Width / $img.Height))"
    $img.Dispose()
  } else {
    Write-Output "$name : NOT FOUND"
  }
}
