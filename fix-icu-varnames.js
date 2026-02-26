const fs = require('fs');

const arPath = 'locales/ar/common.json';
const ar = JSON.parse(fs.readFileSync(arPath, 'utf8'));

// Fix arabic variable names back to their original French/English names
// These were wrongly translated by the auto-translator

// 1. reclamation.auth.too_many_attempts - {دقائق} -> {minutes}
if (ar.reclamation?.auth?.too_many_attempts) {
    ar.reclamation.auth.too_many_attempts = ar.reclamation.auth.too_many_attempts
        .replace('{دقائق}', '{minutes}');
    console.log('Fixed: reclamation.auth.too_many_attempts');
}

// 2. reclamation.auth.account_locked - {دقائق} -> {minutes}
if (ar.reclamation?.auth?.account_locked) {
    ar.reclamation.auth.account_locked = ar.reclamation.auth.account_locked
        .replace('{دقائق}', '{minutes}');
    console.log('Fixed: reclamation.auth.account_locked');
}

// 3. delegation.dashboard.kpi.pending - {عد} -> {count}
if (ar.delegation?.dashboard?.kpi?.pending) {
    ar.delegation.dashboard.kpi.pending = ar.delegation.dashboard.kpi.pending
        .replace('{عد}', '{count}');
    console.log('Fixed: delegation.dashboard.kpi.pending');
}

// 4. performance_tab.pagination.page_x_of_y - {الحالية} -> {current}, {الإجمالي} -> {total}
if (ar.performance_tab?.pagination?.page_x_of_y) {
    ar.performance_tab.pagination.page_x_of_y = ar.performance_tab.pagination.page_x_of_y
        .replace('{الحالية}', '{current}')
        .replace('{الإجمالي}', '{total}');
    console.log('Fixed: performance_tab.pagination.page_x_of_y');
}

// 5. header.notifications.new - {العدد} -> {count}
if (ar.header?.notifications?.new) {
    ar.header.notifications.new = ar.header.notifications.new
        .replace('{العدد}', '{count}');
    console.log('Fixed: header.notifications.new');
}

// 6. reports.kpi.upcoming - {عدد} -> {count}
if (ar.reports?.kpi?.upcoming) {
    ar.reports.kpi.upcoming = ar.reports.kpi.upcoming
        .replace('{عدد}', '{count}');
    console.log('Fixed: reports.kpi.upcoming');
}

// Save
fs.writeFileSync(arPath, JSON.stringify(ar, null, 2), 'utf8');
console.log('\n✅ All ICU variable names fixed in AR file');
