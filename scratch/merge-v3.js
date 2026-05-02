const fs = require('fs');
const path = require('path');

function deepMergeAddOnly(target, source) {
  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        if (!target[key]) target[key] = {};
        deepMergeAddOnly(target[key], source[key]);
      } else if (!(key in target)) {
        target[key] = source[key];
      }
    }
  }
  return target;
}

const frPath = path.join(__dirname, 'locales', 'fr', 'common.json');
const arPath = path.join(__dirname, 'locales', 'ar', 'common.json');

const frData = JSON.parse(fs.readFileSync(frPath, 'utf8'));
const arData = JSON.parse(fs.readFileSync(arPath, 'utf8'));

const newFrKeys = {
  admin: {
    establishments: {
      search_placeholder: "Rechercher une établissement par nom ou code...",
      view_details: "Voir les détails",
      no_establishments: "Aucun établissement trouvé",
      error_loading: "Erreur lors du chargement des établissements"
    }
  }
};

const newArKeys = {
  establishments_workflow: {
    pending_requests_title: "طلباتي قيد المعالجة",
    pending_requests_desc: "تابع حالة التحقق من اقتراحاتك من قبل الإدارة.",
    view_history: "عرض السجل"
  },
  delegation: {
    dashboard: {
      title: "مندوبية {sector}",
      welcome: "مساحة الإدارة - {name}",
      content_summary: "المحتويات",
      total_views: "إجمالي المشاهدات",
      engagement: "التفاعل",
      kpi: {
        events: "الفعاليات",
        pending: "{count, plural, =0 {لا يوجد قيد الانتظار} =1 {واحد قيد الانتظار} other {{count} قيد الانتظار}}",
        published: "{count}/{total} منشور",
        news: "الأخبار",
        views_this_month: "{count} مشاهدات هذا الشهر",
        campaigns: "الحملات",
        participants: "{count} مشارك",
        library: "المكتبة",
        publication_rate: "معدل النشر"
      },
      recent_activity: {
        title: "النشاط الأخير",
        view_all: "عرض الكل",
        empty: "لا يوجد نشاط أخير",
        columns: {
          title: "العنوان",
          type: "النوع",
          date: "التاريخ",
          status: "الحالة",
          performance: "الأداء"
        },
        types: {
          evenement: "فعالية",
          actualite: "خبر",
          article: "مقال",
          campagne: "حملة"
        },
        status: {
          published: "منشور",
          pending: "قيد الانتظار",
          draft: "مسودة",
          closed: "مغلق"
        }
      },
      quick_actions: {
        title: "وصول سريع",
        new_event: "فعالية جديدة",
        new_event_desc: "تخطيط فعالية",
        new_news: "خبر جديد",
        new_news_desc: "نشر معلومة",
        establishments: "المؤسسات",
        establishments_desc: "اقتراح تحديثات"
      },
      todo: {
        title: "المهام",
        to_close: "{count, plural, =0 {لا توجد فعاليات للإغلاق} =1 {فعالية واحدة للإغلاق} other {{count} فعاليات للإغلاق}}",
        to_close_campaigns: "{count, plural, =0 {لا توجد حملات للإغلاق} =1 {حملة واحدة للإغلاق} other {{count} حملات للإغلاق}}",
        manage_now: "إدارة",
        pending_validation: "{count} فعاليات in انتظار المصادقة",
        all_good: "لا يوجد ما يبلغ عنه، كل شيء محدث!"
      }
    }
  },
  admin: {
    establishments: {
      search_placeholder: "البحث عن مؤسسة بالاسم أو الكود...",
      view_details: "عرض تفاصيل المؤسسة",
      no_establishments: "لم يتم العثور على أي مؤسسة",
      error_loading: "خطأ أثناء تحميل بيانات المؤسسات"
    }
  }
};

deepMergeAddOnly(frData, newFrKeys);
deepMergeAddOnly(arData, newArKeys);

fs.writeFileSync(frPath, JSON.stringify(frData, null, 2), 'utf8');
fs.writeFileSync(arPath, JSON.stringify(arData, null, 2), 'utf8');

console.log('Merge complete. FR deep keys:', (function countDeep(obj) { let c=0; for(let k in obj){c++; if(typeof obj[k]==='object' && obj[k]!==null) c+=countDeep(obj[k]);} return c; })(frData));
