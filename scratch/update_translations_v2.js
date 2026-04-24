
const fs = require('fs');
const frPath = 'locales/fr/common.json';
const arPath = 'locales/ar/common.json';

const fr = JSON.parse(fs.readFileSync(frPath, 'utf8'));
const ar = JSON.parse(fs.readFileSync(arPath, 'utf8'));

const newFr = {
  super_admin: {
    recent_activity: {
      system: 'Système',
      user: 'Utilisateur'
    }
  }
};

const newAr = {
  super_admin: {
    recent_activity: {
      system: 'النظام',
      user: 'مستخدم'
    }
  }
};

const mergeDeep = (target, source) => {
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      if (!target[key]) target[key] = {};
      mergeDeep(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
};

mergeDeep(fr, newFr);
mergeDeep(ar, newAr);

fs.writeFileSync(frPath, JSON.stringify(fr, null, 2));
fs.writeFileSync(arPath, JSON.stringify(ar, null, 2));
console.log('Translations updated successfully');
