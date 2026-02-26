
$files = Get-ChildItem -Path "C:\Users\Proschool\Desktop\medaction\app\[locale]\delegation" -Recurse -Include "*.tsx"

$emojis = @('🎭', '⚽', '🤝', '📚', '🏥', '📌', '🌿', '🏗️', '🏛️', '⚠️')

foreach ($file in $files) {
    $content = Get-Content -LiteralPath $file.FullName -Raw
    $originalContent = $content
    
    # 1. Remove emojis specific to options (and generally in text if appropriate, but be careful)
    # We will just remove the specific emojis we know are used as icons in options/text
    foreach ($emoji in $emojis) {
        if ($emoji -eq '⚠️') {
            continue # Handle warning separately
        }
        # Remove emoji and following space if exists
        $content = $content -replace "$emoji\s*", ""
    }

    # 2. Replace warning emoji with AlertCircle icon
    if ($content -match '⚠️') {
        # Check if AlertCircle is imported
        if ($content -notmatch 'import.*AlertCircle') {
            if ($content -match 'import.*from ''lucide-react''') {
                $content = $content -replace "from 'lucide-react';", ", AlertCircle } from 'lucide-react';"
                $content = $content -replace ", AlertCircle }", ", AlertCircle }" # Handle potential double brace if needed, but simple append is safer:
                # Better: insert AlertCircle into the list
                $content = $content -replace "import \{", "import { AlertCircle,"
            }
            else {
                # Add new import if no lucide-react import exists (unlikely in these files but possible)
                $content = "import { AlertCircle } from 'lucide-react';`n" + $content
            }
        }
        
        # Replace the warning emoji. 
        # Usually it's in a <p> tag. We replace it with the icon component.
        # We use a simple inline replacement.
        $content = $content -replace '⚠️', '<AlertCircle className="w-4 h-4 inline mx-1" />'
    }

    if ($content -ne $originalContent) {
        Set-Content -LiteralPath $file.FullName -Value $content -NoNewline -Encoding UTF8
        Write-Host "Updated: $($file.Name)"
    }
}
