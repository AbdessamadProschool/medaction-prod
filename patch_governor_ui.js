const fs = require('fs');
const path = require('path');

const filePath = 'c:\\Users\\Proschool\\Desktop\\medaction\\app\\[locale]\\gouverneur\\page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Update Stats interface
content = content.replace(
    /sectorRankings: Array<\{([\s\S]*?)rank: number;\s*\}\>;/,
    (match, p1) => {
        if (!p1.includes('actualites')) {
            return `sectorRankings: Array<{${p1}actualites: number;\n    rank: number;\n  }>;`;
        }
        return match;
    }
);

// 2. Update Fallback stats in the loop
content = content.replace(
    /ranking: Array<\{[\s\S]*?\}\>\s*\).map/, // Wait, this is not the right regex
    (match) => match // placeholder
);

// Use a simpler approach for the loop
const loopReplacement = `{(s.sectorRankings.length > 0 ? s.sectorRankings.slice(0, 5) : [
                                   { rank: 1, secteur: 'EDUCATION', score: 0, noteMoyenne: 0, evenements: 0, actualites: 0, etablissements: 0, reclamations: 0 },
                                   { rank: 2, secteur: 'SANTE', score: 0, noteMoyenne: 0, evenements: 0, actualites: 0, etablissements: 0, reclamations: 0 },
                                   { rank: 3, secteur: 'SPORT', score: 0, noteMoyenne: 0, evenements: 0, actualites: 0, etablissements: 0, reclamations: 0 }
                                 ]).map((sector, idx) => {`;

content = content.replace(/\(s\.sectorRankings\.length \> 0 \? s\.sectorRankings\.slice\(0, 5\) \: \[[\s\S]*?\]\)\.map\(\(sector, idx\) \=\> \{/, loopReplacement);

// 3. Update Grid to 3 columns and add Actualités
content = content.replace(/className="grid grid-cols-2 gap-3 mt-4"/g, 'className="grid grid-cols-3 gap-3 mt-4"');

const eventStatBlock = `<div className="bg-slate-100 rounded-xl p-2 flex flex-col items-center justify-center">
                                                <div className="flex items-center gap-1 text-slate-400 mb-1">
                                                   <Calendar size={10} />
                                                   <span className="text-[9px] font-bold uppercase">{t('overview.territorial.events')}</span>
                                                </div>
                                                <span className="font-black text-slate-900">{sector.evenements}</span>
                                             </div>`;

const newsStatBlock = `
                                             <div className="bg-slate-100 rounded-xl p-2 flex flex-col items-center justify-center">
                                                <div className="flex items-center gap-1 text-slate-400 mb-1">
                                                   <Megaphone size={10} />
                                                   <span className="text-[9px] font-bold uppercase">{t('stats.actualites') || 'News'}</span>
                                                </div>
                                                <span className="font-black text-slate-900">{sector.actualites}</span>
                                             </div>`;

if (content.includes(eventStatBlock) && !content.includes('sector.actualites')) {
    content = content.replace(eventStatBlock, eventStatBlock + newsStatBlock);
}

// 4. Fix span col-span
content = content.replace(/col-span-2 flex items-center justify-between px-4/g, 'col-span-3 flex items-center justify-between px-4');

fs.writeFileSync(filePath, content);
console.log('Successfully patched page.tsx');
