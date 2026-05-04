
const fs = require('fs');
const path = 'c:/Users/Proschool/Desktop/medaction/locales/fr/common.json';

let content = fs.readFileSync(path, 'utf8');
let lines = content.split(/\r?\n/);

// Campaigns (472-479)
lines[471] = '    "showing": "Affichage de {start}-{end} sur {total} initiatives",';
lines[472] = '    "filter_title": "Filtrer les initiatives",';
lines[473] = '    "badge": "Campagnes",';
lines[474] = '    "featured": "Campagne à la une",';
lines[475] = '    "participating": "Participation en cours...",';
lines[476] = '    "success_title": "Opération réussie",';
lines[477] = '    "success_message": "Merci pour votre participation à cette initiative !",';
lines[478] = '    "close": "Fermer"';

// Articles (710-711)
lines[709] = '    "showing": "Affichage de {start}-{end} sur {total} articles",';
lines[710] = '    "filter_title": "Filtrer les articles"';

// View Details (1237)
lines[1236] = '      "view_details": "Voir les détails"';

// Reclamation Fields (1358-1366)
lines[1357] = '      "location_label": "Localisation géographique",';
lines[1358] = '      "address_label": "Adresse détaillée",';
lines[1359] = '      "commune_label": "Commune",';
lines[1360] = '      "commune_select": "Choisir la commune...",';
lines[1361] = '      "category_label": "Catégorie de la réclamation",';
lines[1362] = '      "category_select": "Choisir la catégorie...",';
lines[1363] = '      "title_label": "Titre de la réclamation",';
lines[1364] = '      "description_label": "Description détaillée",';
lines[1365] = '      "address_placeholder_field": "Adresse complète..."';

// Success Page (1371-1374)
lines[1370] = '      "title": "Réclamation envoyée avec succès",';
lines[1371] = '      "message": "Merci, votre réclamation a été enregistrée avec succès et sera traitée dans les plus brefs délais.",';
lines[1372] = '      "view_my_reclamations": "Suivre mes réclamations",';
lines[1373] = '      "back_home": "Retour à l’accueil"';

fs.writeFileSync(path, lines.join('\n'), 'utf8');
console.log('Done');
