const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Find all .tsx files that have .map( calls on potentially non-array data
const appDir = path.join('c:', 'Users', 'Proschool', 'Desktop', 'medaction', 'app');

function findFiles(dir, ext) {
  let results = [];
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const full = path.join(dir, item);
    const stat = fs.statSync(full);
    if (stat.isDirectory() && !item.startsWith('.') && item !== 'api') {
      results = results.concat(findFiles(full, ext));
    } else if (item.endsWith(ext)) {
      results.push(full);
    }
  }
  return results;
}

const files = findFiles(appDir, '.tsx');
const problematic = [];

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  
  // Find patterns where .map() is called on data that might not be an array
  // Look for: someVar.map( where someVar is derived from API data without Array.isArray check
  
  const lines = content.split('\n');
  const issues = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Check for direct .map( calls without Array.isArray guard
    if (line.match(/\w+\.map\(/) && !line.includes('Array(') && !line.includes('[1,') && !line.includes('[0,')) {
      // Check if it's on a variable derived from API data
      const varMatch = line.match(/(\w+)\.map\(/);
      if (varMatch) {
        const varName = varMatch[1];
        // Look for where this variable is assigned in the file
        const assignPattern = new RegExp(`const ${varName}[^=]*=.*(?:responseData|data|fetch|useData)`, '');
        if (assignPattern.test(content)) {
          // Check if there's no Array.isArray protection nearby (3 lines before/after)
          const surroundingLines = lines.slice(Math.max(0, i-3), i+2).join('\n');
          if (!surroundingLines.includes('Array.isArray') && !surroundingLines.includes('?.map(')) {
            issues.push({ line: i + 1, content: line.trim(), var: varName });
          }
        }
      }
    }
  }
  
  if (issues.length > 0) {
    problematic.push({ file: file.replace('c:\\Users\\Proschool\\Desktop\\medaction\\', ''), issues });
  }
}

console.log(JSON.stringify(problematic, null, 2));
