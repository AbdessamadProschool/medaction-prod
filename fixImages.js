const fs = require('fs');
const path = require('path');

const guideDataPath = path.join(__dirname, 'app/[locale]/(main)/guide/guideData.ts');
const guideContent = fs.readFileSync(guideDataPath, 'utf8');

const regex = /\/images\/guide\/citoyen\/([^'"]+\.png)/g;
let match;
const imagesToCreate = new Set();

while ((match = regex.exec(guideContent)) !== null) {
  imagesToCreate.add(match[1]);
}

const defaultFr = path.join(__dirname, 'public/images/guide/home_fr.png');
const defaultAr = path.join(__dirname, 'public/images/guide/home_ar.png');

imagesToCreate.forEach(fileName => {
  const targetPath = path.join(__dirname, 'public/images/guide/citoyen', fileName);
  if (!fs.existsSync(targetPath)) {
    const sourcePath = fileName.includes('_ar') ? defaultAr : defaultFr;
    if (fs.existsSync(sourcePath)) {
      fs.copyFileSync(sourcePath, targetPath);
      console.log('Created placeholder for ' + fileName);
    }
  }
});
