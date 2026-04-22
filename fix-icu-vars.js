const fs = require('fs');

// ====== FIX AR COMMON.JSON ======
const arPath = 'locales/ar/common.json';
const ar = JSON.parse(fs.readFileSync(arPath, 'utf8'));

// 1. Fix variable names in title, welcome, kpi.participants
// The translator wrongly translated ICU variable names {sector}->{قطاع}, {name}->{الاسم}, {count}->{عدد}
ar.delegation.dashboard.title = "تفويض {sector}";
ar.delegation.dashboard.welcome = "فضاء الإدارة - {name}";
ar.delegation.dashboard.kpi.participants = "{count} مشارك";

// 2. Fix event_details: has flat keys "success.created", "success.updated" with literal dots
// These should be nested objects
const eventDetails = ar.delegation.dashboard.event_details;

// Check if flat keys with dots exist and convert them to nested
const flatKeys = Object.keys(eventDetails).filter(k => k.includes('.'));
if (flatKeys.length > 0) {
    console.log('Found flat keys to fix:', flatKeys);
    // Extract values of flat keys
    const flatValues = {};
    for (const k of flatKeys) {
        flatValues[k] = eventDetails[k];
        delete eventDetails[k];
    }
    // Convert to nested structure
    for (const [k, v] of Object.entries(flatValues)) {
        const parts = k.split('.');
        let obj = eventDetails;
        for (let i = 0; i < parts.length - 1; i++) {
            const part = parts[i];
            // BLOC 6.1 - Prototype Pollution Protection (CWE-1321)
            if (part === '__proto__' || part === 'constructor' || part === 'prototype') {
                continue;
            }
            if (!obj[part]) obj[part] = {};
            obj = obj[part];
        }
        obj[parts[parts.length - 1]] = v;
    }
}

// Also ensure success object exists with proper keys
if (!eventDetails.success) {
    eventDetails.success = {
        created: "تم إنشاء الحدث بنجاح",
        updated: "تم تحديث الحدث بنجاح"
    };
}

console.log('event_details after fix:', JSON.stringify(ar.delegation.dashboard.event_details, null, 2));

// Save AR
fs.writeFileSync(arPath, JSON.stringify(ar, null, 2), 'utf8');
console.log('\n✅ AR file fixed');

// ====== FIX FR COMMON.JSON ======
const frPath = 'locales/fr/common.json';
const fr = JSON.parse(fs.readFileSync(frPath, 'utf8'));

// Fix event_details in FR too (same potential issue)
const frEventDetails = fr.delegation?.dashboard?.event_details;
if (frEventDetails) {
    const frFlatKeys = Object.keys(frEventDetails).filter(k => k.includes('.'));
    if (frFlatKeys.length > 0) {
        console.log('\nFound flat keys in FR:', frFlatKeys);
        const frFlatValues = {};
        for (const k of frFlatKeys) {
            frFlatValues[k] = frEventDetails[k];
            delete frEventDetails[k];
        }
        for (const [k, v] of Object.entries(frFlatValues)) {
            const parts = k.split('.');
            let obj = frEventDetails;
        for (let i = 0; i < parts.length - 1; i++) {
            const part = parts[i];
            // BLOC 6.1 - Prototype Pollution Protection (CWE-1321)
            if (part === '__proto__' || part === 'constructor' || part === 'prototype') {
                continue;
            }
            if (!obj[part]) obj[part] = {};
            obj = obj[part];
        }
            obj[parts[parts.length - 1]] = v;
        }
    }

    // Ensure success exists in FR
    if (!frEventDetails.success) {
        frEventDetails.success = {
            created: "Événement créé avec succès",
            updated: "Événement mis à jour avec succès"
        };
    }
}

fs.writeFileSync(frPath, JSON.stringify(fr, null, 2), 'utf8');
console.log('✅ FR file fixed');
