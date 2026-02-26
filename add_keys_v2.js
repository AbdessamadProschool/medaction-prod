const fs = require('fs');
const path = require('path');

const frUpdates = {
    auth: {
        placeholders: {
            email: "exemple@email.com",
            password: "Mot de passe",
            code: "000000"
        }
    },
    reclamation: {
        progress: {
            creating: "Création de la réclamation...",
            uploading: "Envoi des photos...",
            finalizing: "Finalisation..."
        }
    },
    profile_page: {
        errors: {
            upload_fail: "Erreur lors du téléchargement",
            delete_fail: "Erreur lors de la suppression"
        },
        placeholders: {
            phone: "0600000000"
        }
    },
    common: {
        loading: "Chargement..."
    }
};

const arUpdates = {
    auth: {
        placeholders: {
            email: "example@email.com",
            password: "كلمة المرور",
            code: "000000"
        }
    },
    reclamation: {
        progress: {
            creating: "جاري إنشاء الشكاية...",
            uploading: "جاري رفع الصور...",
            finalizing: "جاري الانتهاء..."
        }
    },
    profile_page: {
        errors: {
            upload_fail: "خطأ في التحميل",
            delete_fail: "خطأ في الحذف"
        },
        placeholders: {
            phone: "0600000000"
        }
    },
    common: {
        loading: "جاري التحميل..."
    }
};

function updateFile(filePath, updates) {
    if (!fs.existsSync(filePath)) {
        console.log(`File not found: ${filePath}`);
        return;
    }
    
    console.log(`Updating ${filePath}...`);
    try {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        
        const merge = (target, source) => {
            for (const key of Object.keys(source)) {
                if (source[key] instanceof Object && !Array.isArray(source[key])) {
                    if (!target[key]) target[key] = {};
                    merge(target[key], source[key]);
                } else {
                     if (!target[key]) {
                        target[key] = source[key];
                        console.log(`  Added key: ${key}`);
                     }
                }
            }
        };
        merge(data, updates);
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
        console.log(`Success.`);
    } catch (e) {
        console.error(`Error: ${e.message}`);
    }
}

updateFile(path.join('locales', 'fr', 'common.json'), frUpdates);
updateFile(path.join('locales', 'ar', 'common.json'), arUpdates);
