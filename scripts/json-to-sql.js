const fs = require('fs');

const inputFile = process.argv[2] || 'backup.json';
const outputFile = process.argv[3] || 'restore.sql';

if (!fs.existsSync(inputFile)) {
  console.error(`❌ Fichier introuvable: ${inputFile}`);
  process.exit(1);
}

const content = fs.readFileSync(inputFile, 'utf8');
const backup = JSON.parse(content);
const data = backup.data || backup;

let sql = '-- Restauration MedAction\n';

// Helper pour échapper les valeurs SQL
function escape(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'boolean') return val ? 'true' : 'false';
  if (typeof val === 'number') return val;
  // Objets et tableaux -> JSON string
  if (typeof val === 'object') {
    return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
  }
  // Chaînes de caractères : échapper les quotes simples
  return `'${String(val).replace(/'/g, "''")}'`;
}

// Fields à ignorer (relations imbriquées ou champs invalides)
const SKIP_FIELDS = [
  'estMiseEnAvant', 'isPublic', 'resume', 'image', 'adresse', 'lieu', 
  'capacite', 'createurId', 'priorite', 'taille', 'horaires', 'services', 
  'photos', 'responsableNom', 'responsableTelephone', 'historique',
  // Relations Prisma (objets avec id)
  'commune', 'annexe', 'user', 'etablissement', 'createdByUser', 'assignedTo',
  'medias', 'evaluations', 'reclamations', 'evenements', 'actualites', 'articles'
];

function generateInsert(table, items) {
  if (!items || !items.length) return '';
  let script = `\n-- Table: ${table} (${items.length} enregistrements)\n`;
  
  for (const item of items) {
    const keys = [];
    const values = [];
    
    for (const [key, val] of Object.entries(item)) {
      // Ignorer les champs à exclure
      if (SKIP_FIELDS.includes(key)) continue;
      // Ignorer les relations (objets avec propriété id)
      if (val && typeof val === 'object' && !Array.isArray(val) && 'id' in val) continue;
      // Ignorer les tableaux (relations many)
      if (Array.isArray(val)) continue;

      keys.push(`"${key}"`);
      values.push(escape(val));
    }
    
    if (keys.length > 0) {
      script += `INSERT INTO "${table}" (${keys.join(', ')}) VALUES (${values.join(', ')}) ON CONFLICT ("id") DO NOTHING;\n`;
    }
  }
  return script;
}

// Ordre d'insertion respectant les clés étrangères
sql += generateInsert('Commune', data.communes);
sql += generateInsert('Annexe', data.annexes);
sql += generateInsert('User', data.users);
sql += generateInsert('Permission', data.permissions);
sql += generateInsert('SystemSetting', data.settings);
sql += generateInsert('Etablissement', data.etablissements);
sql += generateInsert('Campagne', data.campagnes);
sql += generateInsert('Actualite', data.actualites);
sql += generateInsert('Article', data.articles);
sql += generateInsert('Evenement', data.evenements);
sql += generateInsert('Reclamation', data.reclamations);
sql += generateInsert('Media', data.medias);

// Réinitialisation des séquences
const tables = ['User', 'Etablissement', 'Evenement', 'Reclamation', 'Media', 'Article', 'Campagne', 'Actualite', 'Commune', 'Permission', 'Annexe'];
sql += `\n-- Reset Sequences\n`;
for (const t of tables) {
  sql += `DO $$ BEGIN PERFORM setval(pg_get_serial_sequence('"${t}"', 'id'), coalesce((SELECT max(id) FROM "${t}"), 0) + 1, false); EXCEPTION WHEN OTHERS THEN NULL; END $$;\n`;
}

fs.writeFileSync(outputFile, sql);
console.log(`✅ Fichier SQL généré : ${outputFile} (${sql.split('\n').length} lignes)`);
