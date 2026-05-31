const fs = require('fs');
const path = require('path');

function replaceInFile(filePath, replacements) {
    const fullPath = path.resolve(filePath);
    if (!fs.existsSync(fullPath)) {
        console.log(`File not found: ${filePath}`);
        return;
    }
    let content = fs.readFileSync(fullPath, 'utf8');
    let modified = false;
    for (const [search, replace] of replacements) {
        if (content.includes(search)) {
            content = content.replace(search, replace);
            modified = true;
        } else {
            console.log(`Could not find "${search}" in ${filePath}`);
        }
    }
    if (modified) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated ${filePath}`);
    }
}

// 1. app/[locale]/admin/articles/page.tsx
replaceInFile('app/[locale]/admin/articles/page.tsx', [
    ['.map((item, i) =>', '.map((item: any, i: any) =>']
]);

// 2. app/[locale]/admin/campagnes/page.tsx
replaceInFile('app/[locale]/admin/campagnes/page.tsx', [
    ['.map((campagne) =>', '.map((campagne: any) =>'],
    ['STATUTS_COLORS[statut]', 'STATUTS_COLORS[statut as keyof typeof STATUTS_COLORS]']
]);

// 3. app/[locale]/admin/etablissements/page.tsx
replaceInFile('app/[locale]/admin/etablissements/page.tsx', [
    ['setFormData({ ...formData, commune: val?.value })', 'setFormData({ ...formData, commune: val?.value || "" })'],
    ['setFormData({ ...formData, typeEtablissement: val?.value })', 'setFormData({ ...formData, typeEtablissement: val?.value || "" })'],
    ['.map((etablissement) =>', '.map((etablissement: any) =>']
]);

// 4. app/[locale]/admin/evenements/[id]/modifier/page.tsx
replaceInFile('app/[locale]/admin/evenements/[id]/modifier/page.tsx', [
    ['.filter((m) =>', '.filter((m: any) =>'],
    ['.map((doc, idx) =>', '.map((doc: any, idx: any) =>'],
    ['.map((img, idx) =>', '.map((img: any, idx: any) =>']
]);

// 5. app/[locale]/admin/evenements/nouveau/page.tsx
replaceInFile('app/[locale]/admin/evenements/nouveau/page.tsx', [
    ['.map(e =>', '.map((e: any) =>']
]);

// 6. app/[locale]/admin/evenements/page.tsx
replaceInFile('app/[locale]/admin/evenements/page.tsx', [
    ['.find(c =>', '.find((c: any) =>'],
    ['.map((evenement) =>', '.map((evenement: any) =>']
]);

// 7. app/[locale]/admin/page.tsx
replaceInFile('app/[locale]/admin/page.tsx', [
    ['.map((item, i) =>', '.map((item: any, i: any) =>']
]);

// 8. app/[locale]/admin/programmes-activites/nouvelle/page.tsx
replaceInFile('app/[locale]/admin/programmes-activites/nouvelle/page.tsx', [
    ['.map(etab =>', '.map((etab: any) =>']
]);

// 9. app/[locale]/admin/programmes-activites/page.tsx
replaceInFile('app/[locale]/admin/programmes-activites/page.tsx', [
    ['.reduce((acc, a) =>', '.reduce((acc: any, a: any) =>'],
    ['.map((activite) =>', '.map((activite: any) =>']
]);

// 10. app/[locale]/admin/reclamations/[id]/page.tsx
replaceInFile('app/[locale]/admin/reclamations/[id]/page.tsx', [
    ['.filter((m) =>', '.filter((m: any) =>'],
    ['.map((media) =>', '.map((media: any) =>'],
    ['.map((h, i) =>', '.map((h: any, i: any) =>']
]);

// 11. app/[locale]/admin/reclamations/page.tsx
replaceInFile('app/[locale]/admin/reclamations/page.tsx', [
    ['.find(c =>', '.find((c: any) =>'],
    ['.map((r, i) =>', '.map((r: any, i: any) =>'],
    ['.reduce((acc, a) =>', '.reduce((acc: any, a: any) =>']
]);

// 12. app/[locale]/admin/suggestions/page.tsx
replaceInFile('app/[locale]/admin/suggestions/page.tsx', [
    ['.sort((a, b) =>', '.sort((a: any, b: any) =>'],
    ['.map((suggestion) =>', '.map((suggestion: any) =>']
]);

// 13. app/[locale]/admin/validation/page.tsx
replaceInFile('app/[locale]/admin/validation/page.tsx', [
    ['.sort((a, b) =>', '.sort((a: any, b: any) =>'],
    ['a[sortConfig.key]', '(a as any)[sortConfig.key]'],
    ['b[sortConfig.key]', '(b as any)[sortConfig.key]'],
    ['.map((item) =>', '.map((item: any) =>']
]);

// 14. app/[locale]/autorite/reclamations/page.tsx
replaceInFile('app/[locale]/autorite/reclamations/page.tsx', [
    ['await fetchReclamations()', 'await refreshReclamations()'],
    ['mutate: fetchReclamations', 'mutate: refreshReclamations'],
    ['.map((cat) =>', '.map((cat: any) =>'],
    ['.map((reclamation, index) =>', '.map((reclamation: any, index: any) =>']
]);

// 15. app/[locale]/coordinateur/calendrier/page.tsx
replaceInFile('app/[locale]/coordinateur/calendrier/page.tsx', [
    ['const activites = ', 'let activites = '],
    ['.map((e) =>', '.map((e: any) =>']
]);

// 16. app/[locale]/coordinateur/etablissements/page.tsx
replaceInFile('app/[locale]/coordinateur/etablissements/page.tsx', [
    ['.map(e =>', '.map((e: any) =>'],
    ['.map((etablissement) =>', '.map((etablissement: any) =>']
]);

// 17. app/[locale]/coordinateur/page.tsx
replaceInFile('app/[locale]/coordinateur/page.tsx', [
    ['.reduce((groups, activite) =>', '.reduce((groups: any, activite: any) =>'],
    ['activites.map((activite) =>', '(activites as any[]).map((activite: any) =>']
]);

// 18. app/[locale]/coordinateur/rapports/page.tsx
replaceInFile('app/[locale]/coordinateur/rapports/page.tsx', [
    ['.map((rapport) =>', '.map((rapport: any) =>'],
    ['.find(r =>', '.find((r: any) =>'],
    ['.filter(r =>', '.filter((r: any) =>'],
    ['.map((rapport, index) =>', '.map((rapport: any, index: any) =>']
]);

// 19. app/[locale]/delegation/actualites/page.tsx
replaceInFile('app/[locale]/delegation/actualites/page.tsx', [
    ['.map((actu, index) =>', '.map((actu: any, index: any) =>']
]);

// 20. app/[locale]/delegation/articles/page.tsx
replaceInFile('app/[locale]/delegation/articles/page.tsx', [
    ['.map((article, index) =>', '.map((article: any, index: any) =>']
]);

// 21. app/[locale]/delegation/campagnes/page.tsx
replaceInFile('app/[locale]/delegation/campagnes/page.tsx', [
    ['.map((campagne, index) =>', '.map((campagne: any, index: any) =>']
]);

// 22. app/[locale]/delegation/etablissements/page.tsx
replaceInFile('app/[locale]/delegation/etablissements/page.tsx', [
    ['.map(e =>', '.map((e: any) =>']
]);

// 23. app/[locale]/super-admin/permissions/page.tsx
replaceInFile('app/[locale]/super-admin/permissions/page.tsx', [
    ['.every(p =>', '.every((p: any) =>'],
    ['.filter(p =>', '.filter((p: any) =>']
]);
