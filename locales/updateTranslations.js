const fs = require('fs');

const frPath = 'c:/Users/Proschool/Desktop/medaction/locales/fr/common.json';
const arPath = 'c:/Users/Proschool/Desktop/medaction/locales/ar/common.json';

function updateJson(filePath) {
    let rawdata = fs.readFileSync(filePath);
    let data = JSON.parse(rawdata);

    // Fix admin.events.form.sector
    if (!data.admin) data.admin = {};
    if (!data.admin.events) data.admin.events = {};
    if (!data.admin.events.form) data.admin.events.form = {};
    
    // Fix campaigns.objective_progress
    if (!data.campaigns) data.campaigns = {};

    if (filePath.includes('fr')) {
        data.admin.events.form.sector = "Secteur de l'événement";
        data.campaigns.objective_progress = "Progression de l'objectif";
        data.campaigns.participants_required = "participants requis";
        data.campaigns.login_to_participate = "Connectez-vous pour participer";
        data.campaigns.confirm_participation = "Confirmer ma participation";
        
        data.admin.events_page = data.admin.events_page || {};
        data.admin.events_page.form = data.admin.events_page.form || {};
        data.admin.events_page.form.sector = "Secteur de l'événement";
    } else {
        data.admin.events.form.sector = "قطاع الحدث";
        data.campaigns.objective_progress = "تقدم الهدف";
        data.campaigns.participants_required = "المشاركين المطلوبين";
        data.campaigns.login_to_participate = "تسجيل الدخول للمشاركة";
        data.campaigns.confirm_participation = "تأكيد مشاركتي";

        data.admin.events_page = data.admin.events_page || {};
        data.admin.events_page.form = data.admin.events_page.form || {};
        data.admin.events_page.form.sector = "قطاع الحدث";
    }

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`Updated ${filePath}`);
}

updateJson(frPath);
updateJson(arPath);
