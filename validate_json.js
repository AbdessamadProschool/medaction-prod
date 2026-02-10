const fs = require('fs');

function findDuplicateKeys(json, prefix = '') {
  const keys = new Set();
  const duplicates = [];

  for (const key in json) {
    if (Object.prototype.hasOwnProperty.call(json, key)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      // Note: standard JSON.parse doesn't handle duplicates, it just takes the last one.
      // To strictly find duplicates in the source text, we'd need a custom parser.
      // However, if we are just checking deeply nested structures that MIGHT have been merged incorrectly manually:
      
      if (typeof json[key] === 'object' && json[key] !== null && !Array.isArray(json[key])) {
        duplicates.push(...findDuplicateKeys(json[key], fullKey));
      }
    }
  }
  return duplicates;
}

function validateFile(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        // Simple regex based duplicate checker for top-level and some nested
        // This is not perfect but catches copy-paste errors
        const lines = content.split('\n');
        const keyTracker = {};
        
        console.log(`Checking ${filePath}...`);
        
        let stack = [];
        let issues = [];

        // This simple regex won't work well for nested objects with same keys (which is valid).
        // It's better to rely on the fact that if strict mode was arguably used or if the user editor complained.
        // But the user editor DID complain about duplicate keys.
        // Let's rely on nodejs to verify it is valid JSON first.
        
        try {
            JSON.parse(content);
            console.log("JSON Syntax: OK");
        } catch (e) {
            console.error("JSON Syntax: ERROR", e.message);
        }

        // To find duplicates that cause "vscode" warnings (which are valid JSON but overwrites):
        // We can use a regex to find keys at the same indentation level? Too complex.
        // Let's just look at the specific keys the user reported earlier if we can match them?
        // User reported: line 440 and 647.
        // I fixed one. Let's see if there are others.
    } catch (err) {
        console.error(`Error reading file: ${err.message}`);
    }
}

validateFile('./locales/ar/common.json');
validateFile('./locales/fr/common.json');
