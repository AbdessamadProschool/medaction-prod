const fs = require('fs');
const path = require('path');

const filePath = 'c:\\Users\\Proschool\\Desktop\\medaction\\app\\[locale]\\gouverneur\\bilans\\page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add Actualités state and type
if (!content.includes('actualites, setActualites')) {
    content = content.replace(
        /const \[campagnes, setCampagnes\] = useState\<BilanCampagne\[\]\>\(\[\]\);/,
        "const [campagnes, setCampagnes] = useState<BilanCampagne[]>([]);\n  const [actualites, setActualites] = useState<any[]>([]);"
    );
}

// 2. Update activeTab type
content = content.replace(
    /activeTab, setActiveTab\] = useState\<(\'reports\' \| \'evenements\' \| \'activites\' \| \'campagnes\')\>\(\'reports\'\);/,
    "activeTab, setActiveTab] = useState<'reports' | 'evenements' | 'activites' | 'campagnes' | 'actualites'>('reports');"
);

// 3. Update fetchBilans
content = content.replace(
    /const \[reportsRes, evtRes, actRes, campRes\] = await Promise.all\(\[/,
    "const [reportsRes, evtRes, actRes, campRes, newsRes] = await Promise.all(["
);

content = content.replace(
    /fetch\(\'\/api\/admin\/bilans\/campagnes\'\),/,
    "fetch('/api/admin/bilans/campagnes'),\n        fetch('/api/admin/bilans/actualites'),"
);

content = content.replace(
    /if \(campRes\.ok\) \{[\s\S]*?setCampagnes\(campData\.data \|\| \[\]\);\s*\}/,
    (match) => {
        return match + "\n\n      if (newsRes.ok) {\n        const newsData = await newsRes.json();\n        setActualites(newsData.data || []);\n      }";
    }
);

// 4. Update tab buttons
const tabButtonsPoint = `<button
          onClick={() => setActiveTab('campagnes')}`;

const newsTabButton = `
        <button
          onClick={() => setActiveTab('actualites')}
          className={\`px-6 py-3 font-medium transition-colors whitespace-nowrap \${
            activeTab === 'actualites'
              ? 'text-emerald-600 border-b-2 border-emerald-600'
              : 'text-gray-500 hover:text-gray-700'
          }\`}
        >
          <Megaphone className={\`w-4 h-4 inline \${isRTL ? 'ml-2' : 'mr-2'}\`} />
          {t('stats.actualites') || (isRTL ? 'الأخبار' : 'Actualités')} ({actualites.length})
        </button>`;

if (!content.includes("setActiveTab('actualites')")) {
    content = content.replace(tabButtonsPoint, newsTabButton + '\n        ' + tabButtonsPoint);
}

// 5. Add Content for Actualités
const campaignsContentPoint = `{activeTab === 'campagnes' && (`;

const newsContentBlock = `
      {/* Content - Actualités */}
      {activeTab === 'actualites' && (
        <div className="space-y-4">
          {actualites.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              <Megaphone className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-700">{isRTL ? 'لا توجد أخبار' : 'Aucune actualité'}</h3>
              <p className="text-gray-500">{t('bilans_page.empty.desc')}</p>
            </div>
          ) : (
            actualites.map((news) => (
                <div 
                  key={news.id} 
                  className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className={\`px-2 py-1 rounded-full text-xs font-medium \${SECTEUR_COLORS[news.etablissement.secteur] || 'bg-gray-100'}\`}>
                      {tSectors(news.etablissement.secteur.toLowerCase())}
                    </span>
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(news.createdAt).toLocaleDateString(locale)}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                    {news.titre}
                  </h3>
                  
                  <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-4">
                    <span className="flex items-center gap-1">
                      <Building2 className="w-4 h-4" />
                      {news.etablissement.nom}
                    </span>
                    {news.etablissement.commune && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {news.etablissement.commune.nom}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {news.nombreVues || 0} {isRTL ? 'مشاهدة' : 'vues'}
                    </span>
                  </div>

                  <div className="bg-slate-50 dark:bg-gray-700 rounded-lg p-4">
                    <p className="text-gray-700 dark:text-gray-300 text-sm line-clamp-3">
                      {news.description || news.contenu.substring(0, 200) + '...'}
                    </p>
                    <MediaGallery medias={news.medias} />
                  </div>
                </div>
            ))
          )}
        </div>
      )}
`;

if (!content.includes("activeTab === 'actualites'")) {
    content = content.replace(campaignsContentPoint, newsContentBlock + '\n      ' + campaignsContentPoint);
}

fs.writeFileSync(filePath, content);
console.log('Successfully patched bilans/page.tsx');
