const fs = require('fs');
const path = require('path');

// Files and their problematic .map() calls to inspect more closely
const filesToCheck = [
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
  { file: 'app/[locale]/delegation/evenements/page.tsx', vars: ['evenements'] },
  { file: 'app/[locale]/delegation/page.tsx', vars: ['recentItems'] },
  { file: 'app/[locale]/gouverneur/page.tsx', vars: ['alerts'] },
  { file: 'app/[locale]/profil/historique/page.tsx', vars: ['logs'] },
  { file: 'app/[locale]/super-admin/audit/AuditClient.tsx', vars: ['logs'] },
];

const baseDir = 'c:/Users/Proschool/Desktop/medaction';

for (const { file, vars } of filesToCheck) {
  const fullPath = path.join(baseDir, file);
  if (!fs.existsSync(fullPath)) continue;
  
  const content = fs.readFileSync(fullPath, 'utf8');
  
  for (const varName of vars) {
    // Check initialization - look for useState([]) or const varName = ... || []
    const initAsEmptyArray = new RegExp(`const \\[${varName},.*useState<[^>]*>\\(\\[\\]\\)`, 's').test(content);
    const initWithFallback = new RegExp(`const ${varName}[^=]*=.*(?:\\?\\?|\\|\\|)\\s*\\[\\]`, 's').test(content);
    const initWithArrayIsArray = new RegExp(`const ${varName}[^=]*=.*Array\\.isArray`, 's').test(content);
    const initWithArrayIsArraySpread = new RegExp(`${varName}.*Array\\.isArray`, 's').test(content);
    
    if (initAsEmptyArray) {
      // These are safe - useState([]) means they start as array
      console.log(`SAFE (useState[]): ${file} - ${varName}`);
    } else if (initWithArrayIsArray || initWithArrayIsArraySpread) {
      console.log(`SAFE (Array.isArray guard): ${file} - ${varName}`);
    } else if (initWithFallback) {
      console.log(`LIKELY_SAFE (|| [] fallback): ${file} - ${varName}`);
    } else {
      // Find how the variable is actually defined
      const lines = content.split('\n');
      const defLines = [];
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes(`const ${varName}`) || lines[i].includes(`let ${varName}`) || lines[i].includes(`[${varName},`)) {
          defLines.push({ line: i + 1, content: lines[i].trim() });
        }
      }
      console.log(`RISKY: ${file} - ${varName}`);
      console.log(`  Definitions:`, JSON.stringify(defLines));
    }
  }
}
