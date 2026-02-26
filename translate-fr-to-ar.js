const fs = require('fs');

async function translateText(text) {
    if (!text) return "";
    try {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=fr&tl=ar&dt=t&q=${encodeURIComponent(text)}`;
        const res = await fetch(url);
        const data = await res.json();
        return data[0].map(x => x[0]).join('');
    } catch (e) {
        console.error("Translation error for:", text, e.message);
        return text; // fallback to original
    }
}

async function run() {
    const file = 'locales/ar/common.json';
    const content = JSON.parse(fs.readFileSync(file, 'utf8'));
    let translatedCount = 0;

    // Matches any Arabic character
    const hasArabicRegex = /[\u0600-\u06FF]/;

    // Variables patterns we want to preserve exactly
    const placeholders = ['{sector}', '{name}', '{count}', '{total}', '{percent}', '{days}', '{page}', '{date}', '{rating}', '{start}', '{end}', '{size}', '{max}', '{minutes}', '{current}', '{password}'];

    async function traverse(obj) {
        for (const key in obj) {
            if (typeof obj[key] === 'string') {
                const originalStr = obj[key];
                // If it is entirely missing or has no Arabic characters, it's likely French.
                // We skip empty strings. We skip values that are strictly placeholders.
                if (originalStr.trim() !== '' && !hasArabicRegex.test(originalStr) && !placeholders.includes(originalStr.trim())) {
                    console.log(`Translating: ${originalStr}`);

                    let arText = await translateText(originalStr);

                    // Fix potential spaces inside placeholders, e.g. { count } -> {count}
                    arText = arText.replace(/\{\s*([a-zA-Z]+)\s*\}/g, '{$1}');

                    obj[key] = arText;
                    translatedCount++;
                    // Add a small delay so we don't get banned
                    await new Promise(r => setTimeout(r, 100));
                }
            } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                await traverse(obj[key]);
            }
        }
    }

    console.log("Starting deep translation for non-Arabic texts...");

    // Focus specifically on the keys that might have been copied in French
    const targetKeys = ['delegation', 'super_admin', 'licence_page', 'admin_management', 'suggestions', 'admin_activity_create'];

    for (const key of targetKeys) {
        if (content[key]) {
            console.log(`Checking block: ${key}`);
            await traverse(content[key]);
        }
    }

    fs.writeFileSync(file, JSON.stringify(content, null, 2), 'utf8');
    console.log(`Successfully translated and saved ${translatedCount} items in AR file!`);
}

run();
