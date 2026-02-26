$files = Get-ChildItem -LiteralPath "C:\Users\Proschool\Desktop\medaction\components" -Recurse -Filter "*.tsx"
foreach ($file in $files) {
    $content = [System.IO.File]::ReadAllText($file.FullName)
    if ($content.Contains("import Link from 'next/link';")) {
        $content = $content.Replace("import Link from 'next/link';", "import { Link } from '@/i18n/navigation';")
        [System.IO.File]::WriteAllText($file.FullName, $content)
        Write-Host "Fixed: $($file.FullName)"
    }
}
Write-Host "Done!"
