const fs = require('fs');

function mergeJsonCleanly(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // This is a naive parser for this specific file format
    // It assumes root keys start with "  "Name": {" or "  "Name": "Value","
    const lines = content.split('\n');
    const rootObjects = {};
    let currentKey = null;
    let currentContent = [];
    let braceCount = 0;

    for (let i = 1; i < lines.length - 1; i++) {
        const line = lines[i];
        
        if (braceCount === 0) {
            const match = line.match(/^  "([^"]+)": (\{|"[^"]*",?)/);
            if (match) {
                currentKey = match[1];
                if (match[2] === '{') {
                    braceCount = 1;
                    currentContent = ['{'];
                } else {
                    // Simple value
                    if (!rootObjects[currentKey]) rootObjects[currentKey] = [];
                    rootObjects[currentKey].push(match[2]);
                    currentKey = null;
                }
            }
        } else {
            currentContent.push(line.substring(2)); // Strip root indentation
            if (line.includes('{')) braceCount++;
            if (line.includes('}')) braceCount--;
            
            if (braceCount === 0) {
                // Object closed
                if (!rootObjects[currentKey]) rootObjects[currentKey] = [];
                rootObjects[currentKey].push(currentContent.join('\n'));
                currentKey = null;
                currentContent = [];
            }
        }
    }

    // Now merge
    const finalObj = {};
    for (const key in rootObjects) {
        const occurrences = rootObjects[key];
        if (occurrences.length === 1) {
            const val = occurrences[0];
            if (val.startsWith('{')) {
                finalObj[key] = JSON.parse(val);
            } else {
                finalObj[key] = val.replace(/,$/, '').replace(/^"/, '').replace(/"$/, '');
            }
        } else {
            console.log(`Merging duplicate key: ${key}`);
            let merged = {};
            for (const occ of occurrences) {
                if (occ.startsWith('{')) {
                    try {
                        const parsed = JSON.parse(occ);
                        merged = { ...merged, ...parsed };
                    } catch (e) {
                        console.error(`Error parsing duplicate ${key}:`, e);
                    }
                } else {
                    // Last value wins for simple keys
                    merged = occ.replace(/,$/, '').replace(/^"/, '').replace(/"$/, '');
                }
            }
            finalObj[key] = merged;
        }
    }

    // Restore special keys that might be missed by naive parser if any
    // But the script seems okay for this file structure
    
    fs.writeFileSync(filePath, JSON.stringify(finalObj, null, 2), 'utf8');
}

const target = process.argv[2];
if (target) {
    mergeJsonCleanly(target);
} else {
    mergeJsonCleanly('locales/ar/common.json');
    mergeJsonCleanly('locales/fr/common.json');
}
