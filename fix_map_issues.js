const fs = require('fs');
const path = require('path');

const filesToFix = [
  { file: 'app/[locale]/(main)/articles/page.tsx', vars: ['categories', 'articles'] },
  { file: 'app/[locale]/(main)/campagnes/page.tsx', vars: ['featuredCampagnes', 'campagnes'] },
  { file: 'app/[locale]/(main)/etablissements/page.tsx', vars: ['communes', 'annexes', 'etablissements'] },
  { file: 'app/[locale]/(main)/reclamations/urgentes/page.tsx', vars: ['communes', 'reclamations'] },
  { file: 'app/[locale]/(main)/suggestions/page.tsx', vars: ['suggestions'] },
  { file: 'app/[locale]/(main)/talents/page.tsx', vars: ['talents'] },
  { file: 'app/[locale]/(main)/mes-evaluations/page.tsx', vars: ['evaluations'] },
  { file: 'app/[locale]/admin/actualites/page.tsx', vars: ['actualites'] },
  { file: 'app/[locale]/admin/articles/page.tsx', vars: ['articles'] },
  { file: 'app/[locale]/admin/campagnes/page.tsx', vars: ['campagnes'] },
  { file: 'app/[locale]/admin/etablissements/page.tsx', vars: ['etablissements'] },
  { file: 'app/[locale]/admin/evenements/nouveau/page.tsx', vars: ['etablissements'] },
  { file: 'app/[locale]/admin/evenements/page.tsx', vars: ['evenements'] },
  { file: 'app/[locale]/admin/programmes-activites/nouvelle/page.tsx', vars: ['etablissements'] },
  { file: 'app/[locale]/admin/reclamations/page.tsx', vars: ['reclamations'] },
  { file: 'app/[locale]/admin/suggestions/page.tsx', vars: ['suggestions'] },
  { file: 'app/[locale]/admin/validation/page.tsx', vars: ['items'] },
  { file: 'app/[locale]/autorite/page.tsx', vars: ['recentReclamations'] },
  { file: 'app/[locale]/autorite/reclamations/page.tsx', vars: ['categories', 'reclamations'] },
  { file: 'app/[locale]/coordinateur/calendrier/page.tsx', vars: ['etablissements'] },
  { file: 'app/[locale]/coordinateur/page.tsx', vars: ['activites'] },
  { file: 'app/[locale]/delegation/actualites/page.tsx', vars: ['actualites'] },
  { file: 'app/[locale]/delegation/articles/page.tsx', vars: ['articles'] },
  { file: 'app/[locale]/delegation/campagnes/page.tsx', vars: ['campagnes'] },
  { file: 'app/[locale]/delegation/etablissements/page.tsx', vars: ['etablissements'] },
  { file: 'app/[locale]/delegation/evenements/nouveau/page.tsx', vars: ['etablissements', 'allEtablissements'] },
  { file: 'app/[locale]/delegation/evenements/page.tsx', vars: ['evenements'] },
  { file: 'app/[locale]/delegation/page.tsx', vars: ['recentItems'] },
  { file: 'app/[locale]/gouverneur/page.tsx', vars: ['alerts'] },
  { file: 'app/[locale]/profil/historique/page.tsx', vars: ['logs'] },
  { file: 'app/[locale]/super-admin/audit/AuditClient.tsx', vars: ['logs'] },
];

const baseDir = 'c:/Users/Proschool/Desktop/medaction';
let totalFixed = 0;

for (const { file, vars } of filesToFix) {
  const fullPath = path.join(baseDir, file);
  if (!fs.existsSync(fullPath)) continue;
  
  let content = fs.readFileSync(fullPath, 'utf8');
  let originalContent = content;
  
  for (const varName of vars) {
    // Basic pattern for raw varName.map(
    // We want to replace `{varName.map(` with `{(Array.isArray(varName) ? varName : []).map(`
    // Also handle non-jsx usage like `varName.map(` -> `(Array.isArray(varName) ? varName : []).map(`
    
    // Pattern 1: {varName.map(
    const pattern1 = new RegExp(`\\{${varName}\\.map\\(`, 'g');
    content = content.replace(pattern1, `{(Array.isArray(${varName}) ? ${varName} : []).map(`);
    
    // Pattern 2: just varName.map( not preceded by { or ? or . or (Array.isArray(
    // Example:  return etablissements.map(
    const pattern2 = new RegExp(`(?<![\\{\\?\\.\\]\\w])\\b${varName}\\.map\\(`, 'g');
    // We need to be careful with pattern2 to not match already fixed or safe code
    // A better approach is to use a negative lookbehind if supported or just standard replace
    // Actually JS supports negative lookbehind
    content = content.replace(new RegExp(`(?<!Array\\.isArray\\(${varName}\\) \\? ${varName} : \\[\\]\\))(?<!\\?\\.)\\b${varName}\\.map\\(`, 'g'), `(Array.isArray(${varName}) ? ${varName} : []).map(`);
    
    // Pattern 3: ...varName.map(
    const pattern3 = new RegExp(`\\.\\.\\.${varName}\\.map\\(`, 'g');
    content = content.replace(pattern3, `...(Array.isArray(${varName}) ? ${varName} : []).map(`);
  }
  
  // Custom fix for delegation/evenements/nouveau/page.tsx
  if (file === 'app/[locale]/delegation/evenements/nouveau/page.tsx') {
    // Specifically ensure fetch returns array
    content = content.replace(
      /if \(data\.data\) {\s*setEtablissements\(data\.data\);\s*}/g,
      "if (data.data) { setEtablissements(Array.isArray(data.data) ? data.data : (Array.isArray(data.data.data) ? data.data.data : [])); }"
    );
    content = content.replace(
      /if \(dataAll\.data\) {\s*setAllEtablissements\(dataAll\.data\);\s*}/g,
      "if (dataAll.data) { setAllEtablissements(Array.isArray(dataAll.data) ? dataAll.data : (Array.isArray(dataAll.data.data) ? dataAll.data.data : [])); }"
    );
  }

  // Also fix gouverneur bilans
  if (file === 'app/[locale]/gouverneur/bilans/page.tsx') {
    content = content.replace(/filteredEvenements\.map\(/g, '(Array.isArray(filteredEvenements) ? filteredEvenements : []).map(');
    content = content.replace(/filteredActivites\.map\(/g, '(Array.isArray(filteredActivites) ? filteredActivites : []).map(');
    content = content.replace(/actualites\.map\(/g, '(Array.isArray(actualites) ? actualites : []).map(');
    content = content.replace(/filteredCampagnes\.map\(/g, '(Array.isArray(filteredCampagnes) ? filteredCampagnes : []).map(');
  }
  
  if (content !== originalContent) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`Fixed map calls in ${file}`);
    totalFixed++;
  }
}

console.log(`Total files fixed: ${totalFixed}`);
