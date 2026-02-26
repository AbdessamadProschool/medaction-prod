/**
 * ═══════════════════════════════════════════════════════════════════
 * SECURITY MISCONFIGURATION MODULE - MÉDIOUNA ACTION
 * Tests: Headers, CORS, Default Credentials, HTTP Methods
 * ═══════════════════════════════════════════════════════════════════
 */

import axios from 'axios';

export class SecurityMisconfigModule {
  constructor(config) {
    this.config = config;
    this.axiosInstance = axios.create({
      timeout: config.timeout || 30000,
      validateStatus: () => true,
    });
  }

  async defaultCredentials() {
    console.log('  Testing Default Credentials...');
    const findings = [];
    
    const defaultCreds = [
      { email: 'admin@admin.com', password: 'admin' },
      { email: 'admin@example.com', password: 'password' },
      { email: 'admin@localhost', password: 'admin' },
      { email: 'root@localhost', password: 'root' },
      { email: 'test@test.com', password: 'test' },
      { email: 'user@user.com', password: 'user' },
      { email: 'admin@medaction.ma', password: 'admin123' },
      { email: 'super@medaction.ma', password: 'super123' },
      { email: 'demo@demo.com', password: 'demo' },
    ];
    
    for (const cred of defaultCreds) {
      try {
        const res = await this.axiosInstance.post(`${this.config.apiBaseUrl}/auth/signin`, cred);
        
        if (res.status === 200 && (res.data.token || res.data.accessToken)) {
          findings.push({
            severity: 'CRITICAL',
            category: 'Default Credentials',
            title: `Credentials par défaut: ${cred.email}`,
            description: 'Compte avec mot de passe par défaut accessible',
            endpoint: '/auth/signin',
            credentials: { email: cred.email, password: '***' },
            remediation: 'Supprimer les comptes par défaut ou forcer le changement de mot de passe',
            cvss: 9.8,
            cwe: 'CWE-798',
            owasp: 'A07:2021',
          });
        }
      } catch (e) {}
    }
    
    return { findings };
  }

  async httpMethods() {
    console.log('  Testing HTTP Methods...');
    const findings = [];
    
    const dangerousMethods = ['TRACE', 'TRACK', 'PUT', 'DELETE', 'CONNECT', 'OPTIONS'];
    
    try {
      const res = await this.axiosInstance.options(this.config.target);
      const allow = res.headers['allow'] || res.headers['access-control-allow-methods'] || '';
      
      for (const method of dangerousMethods) {
        if (allow.toUpperCase().includes(method)) {
          if (method === 'TRACE' || method === 'TRACK') {
            findings.push({
              severity: 'MEDIUM',
              category: 'Dangerous HTTP Method',
              title: `Méthode HTTP ${method} activée`,
              description: `La méthode ${method} peut être utilisée pour des attaques XST`,
              endpoint: this.config.target,
              method: 'OPTIONS',
              allowedMethods: allow,
              remediation: 'Désactiver les méthodes HTTP non nécessaires',
              cvss: 5.3,
              cwe: 'CWE-650',
              owasp: 'A05:2021',
            });
          }
        }
      }
      
      // Test TRACE spécifique
      const traceRes = await this.axiosInstance({ method: 'TRACE', url: this.config.target });
      
      if (traceRes.status === 200) {
        findings.push({
          severity: 'HIGH',
          category: 'TRACE Method Enabled',
          title: 'Méthode TRACE activée',
          description: 'Vulnérable aux attaques Cross-Site Tracing (XST)',
          endpoint: this.config.target,
          method: 'TRACE',
          remediation: 'Désactiver TRACE au niveau du serveur web',
          cvss: 6.5,
          cwe: 'CWE-650',
          owasp: 'A05:2021',
        });
      }
    } catch (e) {}
    
    return { findings };
  }

  async directoryListing() {
    console.log('  Testing Directory Listing...');
    const findings = [];
    
    const directoriestoCheck = [
      '/uploads/',
      '/images/',
      '/static/',
      '/public/',
      '/assets/',
      '/files/',
      '/documents/',
      '/backup/',
      '/data/',
      '/logs/',
      '/temp/',
      '/tmp/',
    ];
    
    for (const dir of directoriestoCheck) {
      try {
        const res = await this.axiosInstance.get(`${this.config.target}${dir}`);
        const text = typeof res.data === 'string' ? res.data : '';
        
        if (
          res.status === 200 &&
          (text.includes('Index of') ||
           text.includes('Directory listing') ||
           text.includes('<title>Index') ||
           text.includes('Parent Directory') ||
           text.includes('[DIR]') ||
           text.includes('[TXT]'))
        ) {
          findings.push({
            severity: 'MEDIUM',
            category: 'Directory Listing',
            title: `Listing de répertoire activé: ${dir}`,
            description: 'Le contenu du répertoire est visible',
            endpoint: dir,
            method: 'GET',
            remediation: 'Désactiver le directory listing',
            cvss: 5.3,
            cwe: 'CWE-548',
            owasp: 'A05:2021',
          });
        }
      } catch (e) {}
    }
    
    return { findings };
  }

  async securityHeaders() {
    console.log('  Testing Security Headers...');
    const findings = [];
    
    try {
      const res = await this.axiosInstance.get(this.config.target);
      const headers = res.headers;
      
      const requiredHeaders = {
        'strict-transport-security': {
          severity: 'HIGH',
          name: 'HSTS',
          recommendation: 'max-age=31536000; includeSubDomains',
        },
        'x-frame-options': {
          severity: 'MEDIUM',
          name: 'X-Frame-Options',
          recommendation: 'DENY ou SAMEORIGIN',
        },
        'x-content-type-options': {
          severity: 'MEDIUM',
          name: 'X-Content-Type-Options',
          recommendation: 'nosniff',
        },
        'content-security-policy': {
          severity: 'HIGH',
          name: 'CSP',
          recommendation: "default-src 'self'",
        },
        'x-xss-protection': {
          severity: 'LOW',
          name: 'X-XSS-Protection',
          recommendation: '1; mode=block',
        },
        'referrer-policy': {
          severity: 'LOW',
          name: 'Referrer-Policy',
          recommendation: 'strict-origin-when-cross-origin',
        },
        'permissions-policy': {
          severity: 'LOW',
          name: 'Permissions-Policy',
          recommendation: 'geolocation=(), microphone=()',
        },
      };
      
      for (const [header, config] of Object.entries(requiredHeaders)) {
        if (!headers[header]) {
          findings.push({
            severity: config.severity,
            category: 'Missing Security Header',
            title: `Header manquant: ${config.name}`,
            description: `Le header ${header} n'est pas configuré`,
            endpoint: this.config.target,
            method: 'GET',
            missingHeader: header,
            recommendation: config.recommendation,
            remediation: `Ajouter le header dans next.config.js`,
            cvss: config.severity === 'HIGH' ? 6.5 : config.severity === 'MEDIUM' ? 4.0 : 2.0,
            cwe: 'CWE-16',
            owasp: 'A05:2021',
          });
        }
      }
      
      // Headers d'information à supprimer
      const infoHeaders = ['x-powered-by', 'server', 'x-aspnet-version', 'x-aspnetmvc-version'];
      
      for (const header of infoHeaders) {
        if (headers[header]) {
          findings.push({
            severity: 'LOW',
            category: 'Information Disclosure Header',
            title: `Header informatif: ${header}`,
            description: `Le header ${header} révèle la technologie: ${headers[header]}`,
            endpoint: this.config.target,
            method: 'GET',
            header: header,
            value: headers[header],
            remediation: 'Supprimer ou masquer ce header',
            cvss: 3.1,
            cwe: 'CWE-200',
            owasp: 'A05:2021',
          });
        }
      }
    } catch (e) {}
    
    return { findings };
  }

  async corsMisconfig() {
    console.log('  Testing CORS Misconfiguration...');
    const findings = [];
    
    const maliciousOrigins = [
      'https://evil.com',
      'https://attacker.com',
      'https://malicious-site.com',
      'null',
    ];
    
    for (const origin of maliciousOrigins) {
      try {
        const res = await this.axiosInstance.get(this.config.apiBaseUrl, {
          headers: { Origin: origin },
        });
        
        const corsHeader = res.headers['access-control-allow-origin'];
        const corsCredentials = res.headers['access-control-allow-credentials'];
        
        if (corsHeader === '*') {
          findings.push({
            severity: 'HIGH',
            category: 'CORS Misconfiguration',
            title: 'CORS wildcard (*)',
            description: 'L\'API accepte les requêtes de toutes les origines',
            endpoint: this.config.apiBaseUrl,
            method: 'GET',
            corsHeader: corsHeader,
            remediation: 'Restreindre CORS aux domaines autorisés',
            cvss: 7.5,
            cwe: 'CWE-942',
            owasp: 'A05:2021',
          });
          break;
        }
        
        if (corsHeader === origin && origin !== 'null') {
          findings.push({
            severity: 'CRITICAL',
            category: 'CORS Origin Reflection',
            title: 'CORS reflète l\'origine attaquante',
            description: `L'API reflète l'origine ${origin} sans validation`,
            endpoint: this.config.apiBaseUrl,
            method: 'GET',
            corsHeader: corsHeader,
            attackOrigin: origin,
            remediation: 'Valider l\'origine contre une whitelist',
            cvss: 8.8,
            cwe: 'CWE-942',
            owasp: 'A05:2021',
          });
          break;
        }
        
        if (corsHeader && corsCredentials === 'true') {
          findings.push({
            severity: 'HIGH',
            category: 'CORS with Credentials',
            title: 'CORS avec credentials activé',
            description: 'Combinaison dangereuse de CORS permissif et credentials',
            endpoint: this.config.apiBaseUrl,
            method: 'GET',
            corsHeader: corsHeader,
            corsCredentials: corsCredentials,
            remediation: 'Ne pas combiner Access-Control-Allow-Credentials avec origine non restrictive',
            cvss: 7.0,
            cwe: 'CWE-942',
            owasp: 'A05:2021',
          });
          break;
        }
      } catch (e) {}
    }
    
    return { findings };
  }

  async clickjackingProtection() {
    console.log('  Testing Clickjacking Protection...');
    const findings = [];
    
    try {
      const res = await this.axiosInstance.get(this.config.target);
      const xFrameOptions = res.headers['x-frame-options'];
      const csp = res.headers['content-security-policy'];
      
      let hasProtection = false;
      
      if (xFrameOptions && ['DENY', 'SAMEORIGIN'].includes(xFrameOptions.toUpperCase())) {
        hasProtection = true;
      }
      
      if (csp && csp.includes('frame-ancestors')) {
        hasProtection = true;
      }
      
      if (!hasProtection) {
        findings.push({
          severity: 'MEDIUM',
          category: 'Clickjacking',
          title: 'Pas de protection clickjacking',
          description: 'L\'application peut être intégrée dans des iframes malveillantes',
          endpoint: this.config.target,
          method: 'GET',
          remediation: 'Ajouter X-Frame-Options: DENY ou CSP frame-ancestors',
          cvss: 6.1,
          cwe: 'CWE-1021',
          owasp: 'Clickjacking',
        });
      }
    } catch (e) {}
    
    return { findings };
  }
}
