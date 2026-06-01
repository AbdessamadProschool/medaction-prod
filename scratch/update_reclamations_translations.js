const fs = require('fs');

const updateTranslations = (lang) => {
    const file = `locales/${lang}/common.json`;
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));

    // 1. Add confirm_delete to root if missing
    if (!data.confirm_delete) {
        data.confirm_delete = lang === 'ar' ? 'تأكيد الحذف' : 'Confirmer la suppression';
    }

    // 2. Add delete_confirmation to admin.reclamations_page if missing
    if (!data.admin) data.admin = {};
    if (!data.admin.reclamations_page) data.admin.reclamations_page = {};
    if (!data.admin.reclamations_page.delete_confirmation) {
        data.admin.reclamations_page.delete_confirmation = lang === 'ar' ? 'هل أنت متأكد من حذف هذه الشكاية؟ لا يمكن التراجع عن هذا الإجراء.' : 'Êtes-vous sûr de vouloir supprimer cette réclamation ? Cette action est irréversible.';
    }

    fs.writeFileSync(file, JSON.stringify(data, null, 4));
    console.log(`Updated ${file}`);
};

updateTranslations('ar');
updateTranslations('fr');
