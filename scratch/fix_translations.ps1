
$path = "c:\Users\Proschool\Desktop\medaction\locales\fr\common.json"
$content = Get-Content $path -Encoding UTF8

# Campaigns (472-479)
$content[471] = '    "showing": "Affichage de {start}-{end} sur {total} initiatives",'
$content[472] = '    "filter_title": "Filtrer les initiatives",'
$content[473] = '    "badge": "Campagnes",'
$content[474] = '    "featured": "Campagne à la une",'
$content[475] = '    "participating": "Participation en cours...",'
$content[476] = '    "success_title": "Opération réussie",'
$content[477] = '    "success_message": "Merci pour votre participation à cette initiative !",'
$content[478] = '    "close": "Fermer"'

# Articles (710-711)
$content[709] = '    "showing": "Affichage de {start}-{end} sur {total} articles",'
$content[710] = '    "filter_title": "Filtrer les articles"'

# View Details (1237)
$content[1236] = '      "view_details": "Voir les détails"'

# Reclamation Fields (1358-1366)
$content[1357] = '      "location_label": "Localisation géographique",'
$content[1358] = '      "address_label": "Adresse détaillée",'
$content[1359] = '      "commune_label": "Commune",'
$content[1360] = '      "commune_select": "Choisir la commune...",'
$content[1361] = '      "category_label": "Catégorie de la réclamation",'
$content[1362] = '      "category_select": "Choisir la catégorie...",'
$content[1363] = '      "title_label": "Titre de la réclamation",'
$content[1364] = '      "description_label": "Description détaillée",'
$content[1365] = '      "address_placeholder_field": "Adresse complète..."'

# Success Page (1371-1374)
$content[1370] = '      "title": "Réclamation envoyée avec succès",'
$content[1371] = '      "message": "Merci, votre réclamation a été enregistrée avec succès et sera traitée dans les plus brefs délais.",'
$content[1372] = '      "view_my_reclamations": "Suivre mes réclamations",'
$content[1373] = '      "back_home": "Retour à l’accueil"'

# Write as UTF-8 without BOM
$utf8NoBOM = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllLines($path, $content, $utf8NoBOM)
