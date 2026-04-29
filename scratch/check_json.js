const fs = require('fs');
const path = 'c:/Users/Proschool/Desktop/medaction/locales/ar/common.json';
const content = fs.readFileSync(path, 'utf8');

try {
  JSON.parse(content);
  console.log('JSON is valid');
} catch (e) {
  console.log('Error:', e.message);
  const pos = parseInt(e.message.match(/at position (\d+)/)[1]);
  console.log('Position:', pos);
  console.log('Surrounding content:', content.substring(pos - 50, pos + 50));
}
