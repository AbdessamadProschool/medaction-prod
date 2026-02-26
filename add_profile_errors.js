const fs = require('fs');
const path = require('path');

const frUpdates = {
    profile_page: {
        errors: {
            min_2: "Minimum 2 caractères",
            required: "Requis",
            invalid_format: "Format invalide",
            min_8: "Minimum 8 caractères",
            uppercase: "Une majuscule requise",
            lowercase: "Une minuscule requise",
            number: "Un chiffre requis",
            password_mismatch: "Les mots de passe ne correspondent pas"
        }
    }
};

const arUpdates = {
    profile_page: {
        errors: {
            min_2: "على الأقل حرفين",
            required: "مطلوب",
            invalid_format: "تنسيق غير صالح",
            min_8: "8 أحرف على الأقل",
            uppercase: "حرف كبير مطلوب",
            lowercase: "حرف صغير مطلوب",
            number: "رقم مطلوب",
            password_mismatch: "كلمات المرور غير متطابقة"
        }
    }
};

function updateFile(filePath, updates) {
    if (!fs.existsSync(filePath)) return;
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    const merge = (target, source) => {
        for (const key of Object.keys(source)) {
            if (source[key] instanceof Object && !Array.isArray(source[key])) {
                if (!target[key]) target[key] = {};
                merge(target[key], source[key]);
            } else {
                 target[key] = source[key];
            }
        }
    };
    merge(data, updates);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`Updated ${filePath}`);
}

updateFile(path.join('locales', 'fr', 'common.json'), frUpdates);
updateFile(path.join('locales', 'ar', 'common.json'), arUpdates);
