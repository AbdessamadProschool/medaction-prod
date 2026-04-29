const fs = require('fs');

function cleanAndMerge(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Use a regex that finds top-level keys
    // It looks for "Key": { ... } or "Key": "Value"
    // Since it's a huge file, we use a loop with search
    
    const lines = content.split('\n');
    const rootObjects = {};
    let braceLevel = 0;
    let currentKey = null;
    let currentBuffer = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();
        
        if (i === 0 || i === lines.length - 1) continue; // Skip { and }

        if (braceLevel === 0) {
            // Check for new root key
            const match = line.match(/^  "([^"]+)":\s*(\{)?/);
            if (match) {
                currentKey = match[1];
                if (match[2] === '{') {
                    braceLevel = 1;
                    currentBuffer = ['{'];
                } else {
                    // Simple value
                    let val = line.substring(line.indexOf(':') + 1).trim();
                    if (val.endsWith(',')) val = val.slice(0, -1);
                    if (!rootObjects[currentKey]) rootObjects[currentKey] = [];
                    rootObjects[currentKey].push(val);
                    currentKey = null;
                }
            }
        } else {
            // Inside an object
            currentBuffer.push(line.substring(2)); // Maintain relative indentation
            if (trimmed.endsWith('{') || trimmed.includes('{ ')) braceLevel += (trimmed.match(/\{/g) || []).length;
            
            // This is tricky because a line could be "key": { "inner": "val" }
            // Better check for braces correctly
            const opens = (line.match(/\{/g) || []).length;
            const closes = (line.match(/\}/g) || []).length;
            
            // Wait, if braceLevel was 1 and we find a close brace at root-level indent
            if (line.startsWith('  }') || (braceLevel === 1 && line.trim() === '}')) {
                 // Object closed
                 let objStr = currentBuffer.join('\n');
                 if (objStr.endsWith(',')) objStr = objStr.slice(0, -1);
                 
                 if (!rootObjects[currentKey]) rootObjects[currentKey] = [];
                 rootObjects[currentKey].push(objStr);
                 
                 currentKey = null;
                 currentBuffer = [];
                 braceLevel = 0;
            } else {
                braceLevel += (opens - closes);
                if (braceLevel === 0) {
                     // Object closed on same line or similar
                     let objStr = currentBuffer.join('\n');
                     if (objStr.endsWith(',')) objStr = objStr.slice(0, -1);
                     
                     if (!rootObjects[currentKey]) rootObjects[currentKey] = [];
                     rootObjects[currentKey].push(objStr);
                     
                     currentKey = null;
                     currentBuffer = [];
                }
            }
        }
    }

    const final = {};
    for (const key in rootObjects) {
        const items = rootObjects[key];
        if (items.length === 1) {
            const item = items[0];
            if (item.startsWith('{')) {
                try {
                    final[key] = JSON.parse(item);
                } catch (e) {
                    console.error(`Error parsing ${key}:`, e);
                    // Fallback to raw string if it's not valid JSON (shouldn't happen)
                    final[key] = item;
                }
            } else {
                final[key] = item.replace(/^"/, '').replace(/"$/, '');
            }
        } else {
            console.log(`Merging ${key} (${items.length} occurrences)`);
            let merged = {};
            for (const item of items) {
                if (item.startsWith('{')) {
                    try {
                        const parsed = JSON.parse(item);
                        merged = { ...merged, ...parsed };
                    } catch (e) {
                        console.error(`Error parsing duplicate ${key}:`, e);
                    }
                } else {
                    merged = item.replace(/^"/, '').replace(/"$/, '');
                }
            }
            final[key] = merged;
        }
    }

    fs.writeFileSync(filePath, JSON.stringify(final, null, 2), 'utf8');
}

cleanAndMerge(process.argv[2] || 'locales/ar/common.json');
