# Advanced Translation Audit Report

**Date:** 01/03/2026 14:55:33

## File: `common.json`

### Summary

| Metric | Count |
| :--- | :--- |
| French Keys | 4096 |
| Arabic Keys | 4096 |
| Missing in Arabic | 0 |
| Missing in French | 0 |
| Interpolation Mismatches | 10 |
| Empty Arabic Values | 0 |
| Identical FR/AR (Untranslated?) | 2 |
| Potential French in Arabic | 58 |

### ⚠️ Interpolation Mismatches (10)

| Key | French Vars | Arabic Vars |
| :--- | :--- | :--- |
| `governor.header.notifications.new` | `count` | `count, {count, إشعار جديد, إشعاران جديدان` |
| `campaigns.detail.status_days_left` | `count` | `count, {count, يومان متبقيان` |
| `notifications.new` | `count, nouvelles` | `count, جديدة` |
| `header.notifications.new` | `count, une nouvelle, {count` | `count` |
| `delegation.dashboard.kpi.pending` | `count, un en attente, {count` | `count, {count, واحد في الانتظار` |
| `delegation.dashboard.todo.to_close` | `count, un événement à clôturer, {count` | `count, {count, فعالية واحدة للإغلاق` |
| `delegation.dashboard.todo.to_close_campaigns` | `count, une campagne à clôturer, {count` | `count, {count, حملة واحدة للإغلاق` |
| `delegation.dashboard.my_events.count_label` | `count, un événement, {count` | `count, {count` |
| `delegation.dashboard.articles.count_label` | `count, un article, {count` | `count, {count` |
| `delegation.dashboard.campaigns.count_label` | `count, une campagne, {count` | `count, {count` |

<details><summary><b>🔍 Identical Values FR/AR (2)</b></summary>

- `contact_page.email_contact_value`: "contact@provincemediouna.ma"
- `admin.users_page.create_modal.placeholders.email`: "email@exemple.com"
</details>

<details><summary><b>🌐 Potential French Words in Arabic (58)</b></summary>

- `governor.reclamations_tab.pagination.page_x_of_y`: "صفحة {current} / {total}"
- `governor.performance_tab.pagination.page_x_of_y`: "صفحة {current} / {total}"
- `governor.header.notifications.new`: "{count, plural, =0 {لا توجد إشعارات} =1 {إشعار جديد} =2 {إشعاران جديدان} other {{count} إشعارات جديدة}}"
- `campaigns.detail.status_days_left`: "{count, plural, =1 {يوم واحد متبقي} =2 {يومان متبقيان} other {{count} أيام متبقية}}"
- `notifications.new`: "{count, plural, one {جديد} other {جديدة}}"
- `sectors.filter_by`: "تصفية حسب قطاع {sector}"
- `news_page.page_info`: "الصفحة {page} من {totalPages}"
- `news_page.showing`: "عرض {start}-{end} من أصل {total} خبر"
- `contact_page.phone_value`: "05 22 51 00 51 (Standard) • 05 22 51 00 10 (Fax)"
- `contact_page.email_contact_value`: "contact@provincemediouna.ma"
- `footer.idarati`: "Idarati.ma"
- `footer.watiqa`: "Watiqa.ma"
- `my_reclamations_page.empty.filtered`: "لا توجد شكايات {filter}"
- `common.stars_rating`: "تقييم {rating} نجوم"
- `events_page.showing`: "عرض {start}-{end} من أصل {total} فعالية"
- `directory.showing`: "عرض {start}-{end} من أصل {total} مؤسسة"
- `reclamation.auth.too_many_attempts`: "محاولات اتصال كثيرة جدًا. يرجى المحاولة مرة أخرى خلال {minutes} من الدقائق."
- `reclamation.auth.account_locked`: "تم حظر الحساب مؤقتًا. حاول مرة أخرى خلال {minutes} دقيقة."
- `security_page.authenticator_apps`: "استخدم تطبيق مصادقة مثل <strong>Google Authenticator</strong> أو <strong>Microsoft Authenticator</strong> أو <strong>Authy</strong> لتوليد رموز التحقق."
- `etablissement_page.buttons.view_on_maps`: "فتح في Google Maps"
- `search_page.results.count`: "{count} نتيجة لـ "{query}""
- `search_page.no_results.title`: "لا توجد نتائج لـ "{query}""
- `search_page.pagination`: "الصفحة {page} من {totalPages}"
- `accessibility_page.features.keyboard.description`: "يمكن الوصول إلى معظم الميزات عبر التنقل بلوحة المفاتيح (Tab، Enter، Space)."
- `admin.events_page.create_modal.step_indicator`: "المرحلة {current} من {total}"
- `admin.news_page.pagination`: "صفحة {page} من {totalPages} ({total})"
- `admin.users_page.pagination`: "صفحة {start}-{end} من {total}"
- `admin.users_page.messages.reset_password_alert`: "كلمة المرور الجديدة: {password}"
- `admin.users_page.create_modal.placeholders.email`: "email@exemple.com"
- `admin.suggestions_page.page_info`: "الصفحة {current} من {total}"
- `admin.reports_page.excel`: "تصدير Excel"
- `audit_page.page_x_of_y`: "الصفحة {current} من {total} ({count} مدخلات)"
- `import_page.subtitle`: "أضف البيانات بسرعة عبر ملفات CSV/Excel"
- `import_page.upload.supported_formats`: "CSV أو Excel مدعوم"
- `licence_page.help.step2`: "إضافة المتغيرات: LICENSE_KEY، LICENSE_DOMAINS، LICENSE_EXPIRY"
- `licence_page.help.step3`: "إعادة تشغيل التطبيق باستخدام docker compose restart app"
- `auth.too_many_attempts`: "محاولات دخول كثيرة جداً. يرجى المحاولة بعد {minutes} دقيقة."
- `auth.account_locked`: "الحساب مغلق مؤقتاً. يرجى المحاولة بعد {minutes} دقيقة."
- `auth.placeholders.email`: "example@email.com"
- `coordinator.dashboard.alert.message`: "لديك <strong>{count} أنشطة منجزة</strong> تتطلب تقرير إغلاق."
- `coordinator.dashboard.side_stats.progression`: "{percent}% من الهدف الأسبوعي"
- `coordinator.calendar.import_modal.help.step3`: "استخدم المعرفات أدناه لعمود etablissementId"
- `coordinator.calendar.import_modal.reference.hint`: "استخدم المعرف (الرقم الأول) في عمود 'etablissementId' في ملفك"
- `coordinator.calendar.import_modal.upload.hint`: "CSV أو Excel (.csv, .xlsx)"
- `coordinator.calendar.import_modal.upload.error_type`: "يرجى اختيار ملف CSV أو Excel"
- `coordinator.calendar.import_modal.import.success`: "تم استيراد {success} نشاط(أنشطة) من أصل {total}"
- `coordinator.calendar.import_modal.import.row_error`: "السطر {row}: {message}"
- `delegation.dashboard.title`: "تفويض {sector}"
- `delegation.dashboard.kpi.pending`: "{count, plural, =0 {لا شيء في الانتظار} =1 {واحد في الانتظار} other {{count} في الانتظار}}"
- `delegation.dashboard.todo.to_close`: "{count, plural, =0 {لا توجد فعاليات للإغلاق} =1 {فعالية واحدة للإغلاق} other {{count} فعاليات للإغلاق}}"
- ... and 8 more
</details>

