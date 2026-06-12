const fs = require('fs');

const file = 'app/[locale]/(main)/guide/guideData.ts';
let data = fs.readFileSync(file, 'utf8');

const { newGuideDataContent } = require('./newGuideContent.js'); 

function extractRoles(langText) {
    let roles = {};
    const roleIds = ['autorite', 'delegation', 'gouverneur', 'admin'];
    
    for (let roleId of roleIds) {
        let regex = new RegExp("\\{\\s*id:\\s*'" + roleId + "',[\\s\\S]*?\\n    \\}(?=,|\\r?\\n  \\])");
        let match = langText.match(regex);
        if (match) {
            roles[roleId] = match[0];
        }
    }
    return roles;
}

let frStart = data.indexOf('fr: [');
let frEnd = data.indexOf('ar: [');
let frText = data.substring(frStart, frEnd);

let arStart = frEnd;
let arEnd = data.lastIndexOf(']');
let arText = data.substring(arStart, arEnd);

let frRoles = extractRoles(frText);
let arRoles = extractRoles(arText);

const headerMatch = data.match(/([\s\S]*?export const guideData: Record<string, GuideRole\[\]> = \{\r?\n)/);
const header = headerMatch[1];

const finalFr = '  fr: [\n' + newGuideDataContent.fr + ',\n    ' + frRoles['autorite'] + ',\n    ' + frRoles['delegation'] + ',\n    ' + frRoles['gouverneur'] + ',\n    ' + frRoles['admin'] + '\n  ],\n';

const finalAr = '  ar: [\n' + newGuideDataContent.ar + ',\n    ' + arRoles['autorite'] + ',\n    ' + arRoles['delegation'] + ',\n    ' + arRoles['gouverneur'] + ',\n    ' + arRoles['admin'] + '\n  ]\n';

const finalData = header + finalFr + finalAr + '};\n';

fs.writeFileSync(file, finalData);
console.log('Successfully updated guideData.ts');
