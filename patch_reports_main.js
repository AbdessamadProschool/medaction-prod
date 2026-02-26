const fs = require('fs');

function patchFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');

    // Main Page version (Section 4)
    const insertionPointRegex = /<div class="section" style="page-break-inside: avoid;">\s*<h2 style="[^"]*">4\. Alertes & Recommandations<\/h2>/;

    const newSectionMain = `
              <div class="section">
                 <h2 style="font-size: 18px; font-weight: 800; color: #0f172a; border-left: 4px solid #10b981; padding-left: 10px; margin-bottom: 20px;">4. Communication & Projets</h2>
                 <div class="grid" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px;">
                    <div class="card">
                       <h3>Actualités Publiées</h3>
                       <div class="value">\${d.stats.actualites?.total || 0}</div>
                    </div>
                    <div class="card">
                       <h3>Campagnes Actives</h3>
                       <div class="value">\${d.stats.campagnes?.total || 0}</div>
                    </div>
                 </div>
              </div>

`;

    if (insertionPointRegex.test(content) && !content.includes('Communication & Projets')) {
        content = content.replace(insertionPointRegex, (match) => {
            return newSectionMain + '\n              ' + match.replace('4. Alertes', '5. Alertes');
        });
        fs.writeFileSync(filePath, content);
        console.log(`Patched ${filePath}`);
    } else {
        console.log(`Could not find insertion point in ${filePath} or already patched.`);
    }
}

patchFile('c:\\Users\\Proschool\\Desktop\\medaction\\app\\[locale]\\gouverneur\\page.tsx');
