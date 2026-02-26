const fs = require('fs');
const content = fs.readFileSync('locales/fr/common.json', 'utf8');
let count = 0;
let pos = 0;
while ((pos = content.indexOf('"articles_page"', pos)) !== -1) {
    // Find line number
    const line = content.substring(0, pos).split('\n').length;
    console.log(`  Occurrence ${++count} at line ${line}`);
    pos++;
}

// Also check the admin block
const fr = JSON.parse(content);
console.log('\nadmin.articles_page.empty type:', typeof fr.admin?.articles_page?.empty);
console.log('admin.articles_page.empty value:', fr.admin?.articles_page?.empty);
