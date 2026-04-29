const fs = require('fs');
const path = require('path');
function checkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      checkDir(fullPath);
    } else if (fullPath.endsWith('.json')) {
      try {
        JSON.parse(fs.readFileSync(fullPath, 'utf8'));
      } catch (e) {
        console.log('Error in ' + fullPath + ':', e.message);
      }
    }
  }
}
checkDir('c:/Users/Proschool/Desktop/medaction/locales');
console.log('Done checking JSONs');
