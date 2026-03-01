const fs = require('fs');
const path = require('path');

// Paths relative to project root
const projectRoot = path.resolve(__dirname, '..');
const localesPath = path.join(projectRoot, 'locales');
const frDir = path.join(localesPath, 'fr');
const arDir = path.join(localesPath, 'ar');

/**
 * Flattens a nested JSON object into a single-level object with dot-separated keys.
 */
function flattenJSON(obj, prefix = '') {
  let keys = {};
  for (const key in obj) {
    const value = obj[key];
    const newKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      Object.assign(keys, flattenJSON(value, newKey));
    } else {
      keys[newKey] = value;
    }
  }
  return keys;
}

/**
 * Extracts interpolation variables from a string.
 * Supports simple {var} and complex {var, plural, ...}
 */
function getInterpolationVariables(str) {
  if (typeof str !== 'string') return [];
  // Regex to match anything inside {}
  const matches = str.match(/\{([^\}]+)\}/g) || [];
  const variables = new Set();
  
  matches.forEach(m => {
    const content = m.slice(1, -1);
    // For {count, plural, ...}, the first part is the variable
    const varName = content.split(',')[0].trim();
    if (!['plural', 'select', 'number', 'date', 'time'].includes(varName)) {
      variables.add(varName);
    }
    
    // Check for nested variables in pluralization (e.g. other {{count} items})
    const nested = content.match(/\{([^\}]+)\}/g);
    if (nested) {
      nested.forEach(n => {
        const nVar = n.slice(1, -1).split(',')[0].trim();
        if (!['plural', 'select', 'number', 'date', 'time'].includes(nVar)) {
          variables.add(nVar);
        }
      });
    }
  });
  
  return Array.from(variables).sort();
}

/**
 * Checks for French words in an Arabic string (heuristic).
 */
function containsFrenchWords(str) {
  if (typeof str !== 'string') return false;
  // Look for common French sequences or words > 4 chars with latin letters
  const latinWords = str.match(/[a-zA-Z]{5,}/g);
  if (!latinWords) return false;
  
  // Exclude some common variables or technical terms
  const excludeList = ['count', 'label', 'placeholder', 'total', 'status', 'email', 'phone', 'address', 'id', 'user'];
  return latinWords.some(w => !excludeList.includes(w.toLowerCase()));
}

async function run() {
  const reports = [];
  const frFiles = fs.readdirSync(frDir).filter(f => f.endsWith('.json'));
  const arFiles = fs.readdirSync(arDir).filter(f => f.endsWith('.json'));

  const allFiles = Array.from(new Set([...frFiles, ...arFiles]));

  for (const filename of allFiles) {
    const frPath = path.join(frDir, filename);
    const arPath = path.join(arDir, filename);

    if (!fs.existsSync(frPath)) {
      reports.push({ filename, error: 'Missing in French' });
      continue;
    }
    if (!fs.existsSync(arPath)) {
      reports.push({ filename, error: 'Missing in Arabic' });
      continue;
    }

    const frData = JSON.parse(fs.readFileSync(frPath, 'utf8'));
    const arData = JSON.parse(fs.readFileSync(arPath, 'utf8'));

    const frKeys = flattenJSON(frData);
    const arKeys = flattenJSON(arData);

    const frKeySet = new Set(Object.keys(frKeys));
    const arKeySet = new Set(Object.keys(arKeys));

    const missingInAr = [...frKeySet].filter(k => !arKeySet.has(k)).sort();
    const missingInFr = [...arKeySet].filter(k => !frKeySet.has(k)).sort();
    
    const commonKeys = [...frKeySet].filter(k => arKeySet.has(k));
    const mismatches = [];
    const emptyAr = [];
    const identicalFRAR = [];
    const potentialFrenchInAr = [];

    commonKeys.forEach(k => {
      const frVal = frKeys[k];
      const arVal = arKeys[k];

      const frVars = getInterpolationVariables(frVal);
      const arVars = getInterpolationVariables(arVal);
      
      if (frVars.join(',') !== arVars.join(',')) {
        mismatches.push({
          key: k,
          fr: { vars: frVars, value: frVal },
          ar: { vars: arVars, value: arVal }
        });
      }

      if (typeof arVal === 'string' && arVal.trim() === '') {
        emptyAr.push(k);
      }

      // If value is identical and long enough, might be untranslated
      if (frVal === arVal && frVal.length > 5 && !/^\d+$/.test(frVal) && !frVal.startsWith('http') && !frVal.includes('{')) {
        identicalFRAR.push({ key: k, value: frVal });
      }

      if (containsFrenchWords(arVal)) {
        potentialFrenchInAr.push({ key: k, value: arVal });
      }
    });

    reports.push({
      filename,
      stats: {
        frKeysCount: frKeySet.size,
        arKeysCount: arKeySet.size,
        missingInAr: missingInAr.length,
        missingInFr: missingInFr.length,
        mismatches: mismatches.length,
        emptyAr: emptyAr.length,
        identicalFRAR: identicalFRAR.length,
        potentialFrenchInAr: potentialFrenchInAr.length
      },
      missingInAr,
      missingInFr,
      mismatches,
      emptyAr,
      identicalFRAR,
      potentialFrenchInAr
    });
  }

  // Generate Markdown report
  let md = `# Advanced Translation Audit Report\n\n`;
  md += `**Date:** ${new Date().toLocaleString()}\n\n`;

  for (const report of reports) {
    md += `## File: \`${report.filename}\`\n\n`;
    if (report.error) {
      md += `❌ **ERROR:** ${report.error}\n\n`;
      continue;
    }

    md += `### Summary\n\n`;
    md += `| Metric | Count |\n`;
    md += `| :--- | :--- |\n`;
    md += `| French Keys | ${report.stats.frKeysCount} |\n`;
    md += `| Arabic Keys | ${report.stats.arKeysCount} |\n`;
    md += `| Missing in Arabic | ${report.stats.missingInAr} |\n`;
    md += `| Missing in French | ${report.stats.missingInFr} |\n`;
    md += `| Interpolation Mismatches | ${report.stats.mismatches} |\n`;
    md += `| Empty Arabic Values | ${report.stats.emptyAr} |\n`;
    md += `| Identical FR/AR (Untranslated?) | ${report.stats.identicalFRAR} |\n`;
    md += `| Potential French in Arabic | ${report.stats.potentialFrenchInAr} |\n\n`;

    if (report.missingInAr.length > 0) {
      md += `<details><summary><b>❌ Missing in Arabic (${report.missingInAr.length})</b></summary>\n\n`;
      report.missingInAr.forEach(k => md += `- \`${k}\`\n`);
      md += `</details>\n\n`;
    }

    if (report.mismatches.length > 0) {
      md += `### ⚠️ Interpolation Mismatches (${report.mismatches.length})\n\n`;
      md += `| Key | French Vars | Arabic Vars |\n`;
      md += `| :--- | :--- | :--- |\n`;
      report.mismatches.forEach(m => {
        md += `| \`${m.key}\` | \`${m.fr.vars.join(', ') || 'none'}\` | \`${m.ar.vars.join(', ') || 'none'}\` |\n`;
      });
      md += `\n`;
    }

    if (report.identicalFRAR.length > 0) {
      md += `<details><summary><b>🔍 Identical Values FR/AR (${report.identicalFRAR.length})</b></summary>\n\n`;
      report.identicalFRAR.slice(0, 50).forEach(m => md += `- \`${m.key}\`: "${m.value}"\n`);
      if (report.identicalFRAR.length > 50) md += `- ... and ${report.identicalFRAR.length - 50} more\n`;
      md += `</details>\n\n`;
    }

    if (report.potentialFrenchInAr.length > 0) {
      md += `<details><summary><b>🌐 Potential French Words in Arabic (${report.potentialFrenchInAr.length})</b></summary>\n\n`;
      report.potentialFrenchInAr.slice(0, 50).forEach(m => md += `- \`${m.key}\`: "${m.value}"\n`);
      if (report.potentialFrenchInAr.length > 50) md += `- ... and ${report.potentialFrenchInAr.length - 50} more\n`;
      md += `</details>\n\n`;
    }
  }

  const reportPath = path.join(localesPath, 'audit_report_advanced.md');
  const jsonReportPath = path.join(localesPath, 'audit_report_advanced.json');
  
  fs.writeFileSync(reportPath, md);
  fs.writeFileSync(jsonReportPath, JSON.stringify(reports, null, 2));
  
  console.log(`\nAudit completed!`);
  console.log(`- Advanced Markdown report: ${reportPath}`);
}

run().catch(console.error);
