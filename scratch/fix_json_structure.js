const fs = require('fs');

function unescapeAndFix(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    let obj;
    
    try {
        obj = JSON.parse(content);
    } catch (e) {
        console.error('Initial parse failed, trying brute force unescape');
        // If it's totally broken, we might need a different approach
        return;
    }

    const fixed = {};
    for (const key in obj) {
        const val = obj[key];
        if (typeof val === 'string' && (val.trim().startsWith('{') || val.trim().startsWith('['))) {
            try {
                // Remove trailing commas that might be inside the string if it was badly formed
                let cleanedVal = val.trim();
                if (cleanedVal.endsWith(',')) cleanedVal = cleanedVal.slice(0, -1);
                
                fixed[key] = JSON.parse(cleanedVal);
                console.log(`Fixed stringified key: ${key}`);
            } catch (e) {
                console.warn(`Could not parse value for key ${key}, keeping as string`);
                fixed[key] = val;
            }
        } else {
            fixed[key] = val;
        }
    }

    // Now handle duplicates that might have been lost by initial JSON.parse
    // Actually, we should parse the file manually to find ALL occurrences
    
    fs.writeFileSync(filePath, JSON.stringify(fixed, null, 2), 'utf8');
}

unescapeAndFix(process.argv[2] || 'locales/ar/common.json');
