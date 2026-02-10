import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

const SRC_DIR = path.join(process.cwd(), 'app');
const OUTPUT_FILE = path.join(process.cwd(), 'scripts/i18n/extracted-keys.json');

async function extractKeys() {
  console.log('🔍 Extracting translation keys from source code...');

  const files = await glob('**/*.{ts,tsx}', { cwd: SRC_DIR, ignore: ['**/node_modules/**'] });
  const keys = new Set<string>();

  const regex = /t\(['"]([^'"]+)['"]\)/g;

  for (const file of files) {
    const content = fs.readFileSync(path.join(SRC_DIR, file), 'utf-8');
    let match;
    while ((match = regex.exec(content)) !== null) {
      keys.add(match[1]);
    }
  }

  const sortedKeys = Array.from(keys).sort();
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(sortedKeys, null, 2));
  
  console.log(`✅ Extracted ${sortedKeys.length} keys to ${OUTPUT_FILE}`);
}

extractKeys();
