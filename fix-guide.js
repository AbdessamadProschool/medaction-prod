const fs = require('fs');
let data = fs.readFileSync('c:/Users/Proschool/Desktop/medaction/app/[locale]/(main)/guide/guideData.ts', 'utf8');

// Find the Citoyen blocks
const citoyenRegex = /\{\s*id:\s*'citoyen',[\s\S]*?(?=\{\s*id:\s*'autorite')/g;
const matches = data.match(citoyenRegex);

if (matches && matches.length === 2) {
  let frCitoyen = matches[0];
  let arCitoyen = matches[1];

  let frConsulteur = frCitoyen
    .replace("id: 'citoyen'", "id: 'consulteur'")
    .replace("title: 'Citoyen (Visiteur & Résident)'", "title: 'Visiteur (Non connecté)'")
    .replace("description: 'Découvrez comment explorer la province, consulter les services publics, soumettre des réclamations et participer aux événements.'", "description: 'Découvrez comment explorer la province, consulter les services publics et participer aux événements.'");

  let arConsulteur = arCitoyen
    .replace("id: 'citoyen'", "id: 'consulteur'")
    .replace("title: 'مواطن (زائر ومقيم)'", "title: 'زائر (غير مسجل)'")
    .replace("description: 'اكتشف كيف يمكنك استكشاف الإقليم، استشارة المرافق العامة، تقديم الشكايات، والمشاركة في الفعاليات.'", "description: 'اكتشف كيف يمكنك استكشاف الإقليم، استشارة المرافق العامة، والمشاركة في الفعاليات.'");

  // Remove the private sections from consulteur
  // 1. gestion_compte
  // 2. demarches_reclamations
  // 3. boite_a_idees (actually let's leave boite_a_idees since visiteur can submit ideas)
  
  const removeSection = (str, sectionId) => {
    const regex = new RegExp(`\\{\\s*id:\\s*'${sectionId}',[\\s\\S]*?\\},(?=\\s*\\{\\s*id:\\s*')`, 'g');
    return str.replace(regex, '');
  };

  frConsulteur = removeSection(frConsulteur, 'gestion_compte');
  frConsulteur = removeSection(frConsulteur, 'demarches_reclamations');
  
  arConsulteur = removeSection(arConsulteur, 'gestion_compte');
  arConsulteur = removeSection(arConsulteur, 'demarches_reclamations');

  data = data.replace(matches[0], frConsulteur + "\n    " + matches[0]);
  data = data.replace(matches[1], arConsulteur + "\n    " + matches[1]);

  fs.writeFileSync('c:/Users/Proschool/Desktop/medaction/app/[locale]/(main)/guide/guideData.ts', data);
  console.log('Successfully duplicated citoyen to consulteur.');
} else {
  console.log('Regex match failed');
}
