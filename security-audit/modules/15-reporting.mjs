/**
 * ═══════════════════════════════════════════════════════════════════
 * REPORTING MODULE - MÉDIOUNA ACTION
 * Generates: JSON, HTML, Markdown Reports
 * ═══════════════════════════════════════════════════════════════════
 */

import fs from 'fs/promises';
import path from 'path';

export class ReportingModule {
  constructor(config, stats) {
    this.config = config;
    this.stats = stats;
    this.reportDir = config.output?.reportDir || './reports';
  }

  async ensureReportDir() {
    try {
      await fs.mkdir(this.reportDir, { recursive: true });
    } catch (e) {}
  }

  async generateJSON() {
    await this.ensureReportDir();
    
    const report = {
      metadata: {
        title: 'MedAction Security Audit Report',
        target: this.config.target,
        date: new Date().toISOString(),
        duration: `${(this.stats.timeElapsed / 1000).toFixed(2)}s`,
        auditor: 'MedAction Security Audit Framework v2.0',
      },
      summary: {
        totalFindings: this.stats.findings.length,
        critical: this.stats.vulnerabilities.critical,
        high: this.stats.vulnerabilities.high,
        medium: this.stats.vulnerabilities.medium,
        low: this.stats.vulnerabilities.low,
        info: this.stats.vulnerabilities.info,
      },
      findings: this.stats.findings,
    };
    
    const filePath = path.join(this.reportDir, 'audit-report.json');
    await fs.writeFile(filePath, JSON.stringify(report, null, 2), 'utf8');
    
    return filePath;
  }

  async generateHTML() {
    await this.ensureReportDir();
    
    const getSeverityColor = (severity) => {
      switch (severity) {
        case 'CRITICAL': return '#dc2626';
        case 'HIGH': return '#ea580c';
        case 'MEDIUM': return '#ca8a04';
        case 'LOW': return '#2563eb';
        case 'INFO': return '#6b7280';
        default: return '#374151';
      }
    };
    
    const getSeverityBadge = (severity) => {
      const color = getSeverityColor(severity);
      return `<span style="background:${color};color:white;padding:2px 8px;border-radius:4px;font-size:12px;font-weight:bold;">${severity}</span>`;
    };
    
    const findingsHtml = this.stats.findings.map((f, i) => `
      <div style="border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin-bottom:16px;border-left:4px solid ${getSeverityColor(f.severity)};">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
          <h3 style="margin:0;font-size:16px;">${f.title}</h3>
          ${getSeverityBadge(f.severity)}
        </div>
        <p style="color:#6b7280;margin:8px 0;">${f.description}</p>
        <table style="width:100%;font-size:14px;">
          <tr><th style="text-align:left;padding:4px 0;color:#6b7280;width:150px;">Endpoint</th><td><code>${f.endpoint || 'N/A'}</code></td></tr>
          <tr><th style="text-align:left;padding:4px 0;color:#6b7280;">Method</th><td><code>${f.method || 'N/A'}</code></td></tr>
          <tr><th style="text-align:left;padding:4px 0;color:#6b7280;">Category</th><td>${f.category}</td></tr>
          <tr><th style="text-align:left;padding:4px 0;color:#6b7280;">OWASP</th><td>${f.owasp || 'N/A'}</td></tr>
          <tr><th style="text-align:left;padding:4px 0;color:#6b7280;">CWE</th><td>${f.cwe || 'N/A'}</td></tr>
          <tr><th style="text-align:left;padding:4px 0;color:#6b7280;">CVSS</th><td>${f.cvss || 'N/A'}</td></tr>
        </table>
        <div style="background:#f3f4f6;padding:12px;border-radius:4px;margin-top:12px;">
          <strong style="color:#059669;">Remédiation:</strong>
          <p style="margin:4px 0 0 0;">${f.remediation}</p>
        </div>
      </div>
    `).join('');
    
    const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MedAction - Security Audit Report</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f9fafb; }
    .container { max-width: 1200px; margin: 0 auto; }
    .header { background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); color: white; padding: 40px; border-radius: 12px; margin-bottom: 24px; }
    .header h1 { margin: 0 0 8px 0; font-size: 28px; }
    .header p { margin: 0; opacity: 0.9; }
    .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 16px; margin-bottom: 24px; }
    .stat-card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); text-align: center; }
    .stat-value { font-size: 36px; font-weight: bold; }
    .stat-label { color: #6b7280; font-size: 14px; }
    .findings { background: white; padding: 24px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    code { background: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-family: monospace; }
    .footer { text-align: center; color: #6b7280; margin-top: 24px; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🛡️ MedAction Security Audit Report</h1>
      <p>Cible: ${this.config.target} | Date: ${new Date().toLocaleString('fr-FR')} | Durée: ${(this.stats.timeElapsed / 1000).toFixed(2)}s</p>
    </div>
    
    <div class="stats">
      <div class="stat-card">
        <div class="stat-value" style="color:#dc2626;">${this.stats.vulnerabilities.critical}</div>
        <div class="stat-label">CRITICAL</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" style="color:#ea580c;">${this.stats.vulnerabilities.high}</div>
        <div class="stat-label">HIGH</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" style="color:#ca8a04;">${this.stats.vulnerabilities.medium}</div>
        <div class="stat-label">MEDIUM</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" style="color:#2563eb;">${this.stats.vulnerabilities.low}</div>
        <div class="stat-label">LOW</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" style="color:#6b7280;">${this.stats.vulnerabilities.info}</div>
        <div class="stat-label">INFO</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${this.stats.findings.length}</div>
        <div class="stat-label">TOTAL</div>
      </div>
    </div>
    
    <div class="findings">
      <h2>📋 Détail des Vulnérabilités</h2>
      ${findingsHtml || '<p>Aucune vulnérabilité détectée.</p>'}
    </div>
    
    <div class="footer">
      <p>Généré par MedAction Security Audit Framework v2.0 | Compliance: OWASP Top 10, OWASP API Top 10</p>
    </div>
  </div>
</body>
</html>
    `;
    
    const filePath = path.join(this.reportDir, 'audit-report.html');
    await fs.writeFile(filePath, html, 'utf8');
    
    return filePath;
  }

  async generateMarkdown() {
    await this.ensureReportDir();
    
    const getSeverityEmoji = (severity) => {
      switch (severity) {
        case 'CRITICAL': return '🔴';
        case 'HIGH': return '🟠';
        case 'MEDIUM': return '🟡';
        case 'LOW': return '🔵';
        case 'INFO': return '⚪';
        default: return '⚫';
      }
    };
    
    const findingsMd = this.stats.findings.map((f, i) => `
### ${getSeverityEmoji(f.severity)} ${f.title}

| Propriété | Valeur |
|-----------|--------|
| **Sévérité** | ${f.severity} |
| **Catégorie** | ${f.category} |
| **Endpoint** | \`${f.endpoint || 'N/A'}\` |
| **Méthode** | ${f.method || 'N/A'} |
| **OWASP** | ${f.owasp || 'N/A'} |
| **CWE** | ${f.cwe || 'N/A'} |
| **CVSS** | ${f.cvss || 'N/A'} |

**Description:** ${f.description}

**Remédiation:** ${f.remediation}

---
`).join('\n');
    
    const md = `# 🛡️ MedAction Security Audit Report

## Métadonnées

| Propriété | Valeur |
|-----------|--------|
| **Cible** | ${this.config.target} |
| **Date** | ${new Date().toLocaleString('fr-FR')} |
| **Durée** | ${(this.stats.timeElapsed / 1000).toFixed(2)}s |
| **Framework** | MedAction Security Audit v2.0 |

## Résumé

| Sévérité | Nombre |
|----------|--------|
| 🔴 CRITICAL | ${this.stats.vulnerabilities.critical} |
| 🟠 HIGH | ${this.stats.vulnerabilities.high} |
| 🟡 MEDIUM | ${this.stats.vulnerabilities.medium} |
| 🔵 LOW | ${this.stats.vulnerabilities.low} |
| ⚪ INFO | ${this.stats.vulnerabilities.info} |
| **TOTAL** | **${this.stats.findings.length}** |

## Vulnérabilités Détectées

${findingsMd || 'Aucune vulnérabilité détectée.'}

---

*Rapport généré automatiquement par MedAction Security Audit Framework v2.0*
*Compliance: OWASP Top 10 2021, OWASP API Top 10 2023, PTES, OSSTMM*
`;
    
    const filePath = path.join(this.reportDir, 'audit-report.md');
    await fs.writeFile(filePath, md, 'utf8');
    
    return filePath;
  }
}
