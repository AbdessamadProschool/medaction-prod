const fs = require('fs');

// Patch AR file with remaining missing keys
const arPath = 'locales/ar/common.json';
const ar = JSON.parse(fs.readFileSync(arPath, 'utf8'));

// 1. news_creation errors
if (!ar.delegation.dashboard.news_creation.errors) ar.delegation.dashboard.news_creation.errors = {};
ar.delegation.dashboard.news_creation.errors.upload_failed = "حدث خطأ أثناء تحميل الصورة";
ar.delegation.dashboard.news_creation.errors.create_failed = "حدث خطأ أثناء الإنشاء";

// 2. my_news extras
if (!ar.delegation.dashboard.my_news) ar.delegation.dashboard.my_news = {};
ar.delegation.dashboard.my_news.page = "صفحة";
ar.delegation.dashboard.my_news.limit = "حد";
ar.delegation.dashboard.my_news.search = "بحث";
ar.delegation.dashboard.my_news.statut = "الحالة";

// 3. event_creation buttons
if (!ar.delegation.dashboard.event_creation.buttons) ar.delegation.dashboard.event_creation.buttons = {};
ar.delegation.dashboard.event_creation.buttons.cancel = "إلغاء";
ar.delegation.dashboard.event_creation.buttons.creating = "جارٍ الإنشاء...";
ar.delegation.dashboard.event_creation.buttons.create = "إنشاء الحدث";

// 4. my_events extras  
if (!ar.delegation.dashboard.my_events) ar.delegation.dashboard.my_events = {};
ar.delegation.dashboard.my_events.success = "تم حذف الحدث بنجاح";
ar.delegation.dashboard.my_events.page = "صفحة";
ar.delegation.dashboard.my_events.limit = "حد";
ar.delegation.dashboard.my_events.search = "بحث";
ar.delegation.dashboard.my_events.statut = "الحالة";

// 5. articles extras
if (!ar.delegation.dashboard.articles) ar.delegation.dashboard.articles = {};
ar.delegation.dashboard.articles.limit = "حد";
ar.delegation.dashboard.articles.search = "بحث";
ar.delegation.dashboard.articles.statut = "الحالة";

// 6. campaigns extras
if (!ar.delegation.dashboard.campaigns) ar.delegation.dashboard.campaigns = {};
ar.delegation.dashboard.campaigns.limit = "حد";
ar.delegation.dashboard.campaigns.search = "بحث";
ar.delegation.dashboard.campaigns.statut = "الحالة";

// Save
fs.writeFileSync(arPath, JSON.stringify(ar, null, 2), 'utf8');
console.log('✅ AR file patched with remaining missing keys');
