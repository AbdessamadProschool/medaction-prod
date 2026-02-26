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

    async function traverse(obj) {
        for (const key in obj) {
            if (typeof obj[key] === 'string' && obj[key].startsWith('[MISSING] ')) {
                const originalFr = obj[key].replace('[MISSING] ', '');
                console.log(`Translating: ${originalFr}`);
                const arText = await translateText(originalFr);
                obj[key] = arText;
                translatedCount++;
                // Add a small delay so we don't get banned
                await new Promise(r => setTimeout(r, 100));
            } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                await traverse(obj[key]);
            }
        }
    }

    console.log("Starting translation...");
    await traverse(content);

    fs.writeFileSync(file, JSON.stringify(content, null, 2), 'utf8');
    console.log(`Successfully translated and saved ${translatedCount} items!`);
}

run();
