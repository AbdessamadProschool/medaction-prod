const fs = require('fs');
const path = require('path');

const src = path.join(process.env.LOCALAPPDATA, 'BraveSoftware/Brave-Browser/User Data/Default/Network/Cookies');
const dst = 'C:/Users/Proschool/Desktop/medaction/scratch/Cookies-temp';

try {
  console.log(`Lecture de ${src}...`);
  const data = fs.readFileSync(src);
  console.log(`Écriture de ${dst}...`);
  fs.writeFileSync(dst, data);
  console.log('Copie réussie ! Taille:', data.length);
} catch (e) {
  console.error('Erreur lors de la copie:', e);
}
