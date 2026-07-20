$file = 'c:\Users\Proschool\Desktop\medaction\locales\fr\common.json'
$content = [System.IO.File]::ReadAllText($file, [System.Text.Encoding]::UTF8)

$old = '"soumettre": "Soumettre la demande"' + "`r`n  },"
$new = '"soumettre": "Soumettre la demande",' + "`r`n" + '    "pending_requests_title": "Mes demandes en cours",' + "`r`n" + "    " + '"pending_requests_desc": "' + "Suivez l'état de validation de vos propositions par l'administration." + '",' + "`r`n" + "    " + '"view_history": "' + "Voir l'historique" + '"' + "`r`n  },"

if ($content.Contains($old)) {
    $content = $content.Replace($old, $new)
    [System.IO.File]::WriteAllText($file, $content, [System.Text.Encoding]::UTF8)
    Write-Host "SUCCESS: Keys added to fr/common.json"
} else {
    Write-Host "ERROR: Could not find target string"
    # Try with LF only
    $old2 = '"soumettre": "Soumettre la demande"' + "`n  },"
    if ($content.Contains($old2)) {
        $new2 = '"soumettre": "Soumettre la demande",' + "`n" + '    "pending_requests_title": "Mes demandes en cours",' + "`n" + "    " + '"pending_requests_desc": "' + "Suivez l'état de validation de vos propositions par l'administration." + '",' + "`n" + "    " + '"view_history": "' + "Voir l'historique" + '"' + "`n  },"
        $content = $content.Replace($old2, $new2)
        [System.IO.File]::WriteAllText($file, $content, [System.Text.Encoding]::UTF8)
        Write-Host "SUCCESS (LF): Keys added to fr/common.json"
    } else {
        Write-Host "ERROR: Could not find target with LF either"
    }
}
