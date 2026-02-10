/**
 * ═══════════════════════════════════════════════════════════════════
 * DATA EXPOSURE MODULE - MÉDIOUNA ACTION
 * Tests: Sensitive Files, Error Disclosure, API Key Leakage
 * ═══════════════════════════════════════════════════════════════════
 */

import axios from 'axios';

export class DataExposureModule {
  constructor(config) {
    this.config = config;
    this.axiosInstance = axios.create({
      timeout: config.timeout || 30000,
      validateStatus: () => true,
    });
  }

  async sensitiveFiles() {
    console.log('  Testing Sensitive Files Exposure...');
    const findings = [];
    
    const sensitiveFiles = [
      '/.env',
      '/.env.local',
      '/.env.production',
      '/.env.development',
      '/config.json',
      '/config.yml',
      '/settings.json',
      '/database.json',
      '/credentials.json',
      '/secrets.json',
      '/package.json',
      '/package-lock.json',
      '/yarn.lock',
      '/composer.json',
      '/composer.lock',
      '/Gemfile',
      '/requirements.txt',
      '/Pipfile',
      '/next.config.js',
      '/nuxt.config.js',
      '/webpack.config.js',
      '/tsconfig.json',
      '/prisma/schema.prisma',
      '/docker-compose.yml',
      '/Dockerfile',
      '/.dockerignore',
      '/.gitignore',
      '/id_rsa',
      '/id_rsa.pub',
      '/authorized_keys',
      '/.ssh/id_rsa',
      '/backup.sql',
      '/database.sql',
      '/dump.sql',
      '/data.sql',
      '/backup.zip',
      '/backup.tar.gz',
      '/site.sql',
      '/db_backup.sql',
    ];
    
    for (const file of sensitiveFiles) {
      try {
        const res = await this.axiosInstance.get(`${this.config.target}${file}`);
        
        if (res.status === 200 && res.data) {
          const text = typeof res.data === 'string' ? res.data : JSON.stringify(res.data);
          const isCritical = 
            file.includes('.env') || 
            file.includes('secret') || 
            file.includes('credential') ||
            file.includes('.sql') ||
            file.includes('id_rsa');
          
          findings.push({
            severity: isCritical ? 'CRITICAL' : 'HIGH',
            category: 'Sensitive File Exposure',
            title: `Fichier sensible accessible: ${file}`,
            description: `Le fichier ${file} est accessible publiquement`,
            endpoint: file,
            method: 'GET',
            contentLength: text.length,
            contentSnippet: text.substring(0, 100),
            remediation: 'Bloquer l\'accès aux fichiers sensibles via le serveur web',
            cvss: isCritical ? 9.0 : 7.0,
            cwe: 'CWE-538',
            owasp: 'Data Exposure',
          });
        }
      } catch (e) {}
    }
    
    return { findings };
  }

  async errorDisclosure() {
    console.log('  Testing Error Message Disclosure...');
    const findings = [];
    
    const triggerEndpoints = [
      '/api/undefined-endpoint-12345',
      '/api/users/not-a-number',
      '/api/reclamations/99999999',
      '/api/test?id[]=1',
      '/api/users?email[$ne]=',
    ];
    
    const sensitivePatterns = [
      { pattern: /at .+ \([^)]+:\d+:\d+\)/gi, name: 'Stack trace' },
      { pattern: /Error: /gi, name: 'Error message' },
      { pattern: /\/Users\/[^\/]+\//gi, name: 'MacOS path' },
      { pattern: /C:\\Users\\[^\\]+\\/gi, name: 'Windows path' },
      { pattern: /\/home\/[^\/]+\//gi, name: 'Linux path' },
      { pattern: /prisma/gi, name: 'Prisma ORM' },
      { pattern: /postgres/gi, name: 'PostgreSQL' },
      { pattern: /mongodb/gi, name: 'MongoDB' },
      { pattern: /node_modules/gi, name: 'Node modules path' },
      { pattern: /Cannot read propert/gi, name: 'JavaScript error' },
      { pattern: /undefined is not/gi, name: 'JavaScript error' },
      { pattern: /ENOENT/gi, name: 'File system error' },
      { pattern: /ECONNREFUSED/gi, name: 'Connection error' },
    ];
    
    for (const endpoint of triggerEndpoints) {
      try {
        const res = await this.axiosInstance.get(`${this.config.target}${endpoint}`);
        const text = typeof res.data === 'string' ? res.data : JSON.stringify(res.data);
        
        for (const { pattern, name } of sensitivePatterns) {
          if (pattern.test(text)) {
            findings.push({
              severity: 'MEDIUM',
              category: 'Error Disclosure',
              title: `Information sensible dans erreur: ${name}`,
              description: `Le message d'erreur révèle des informations internes`,
              endpoint: endpoint,
              method: 'GET',
              patternMatched: name,
              snippet: text.substring(0, 200),
              remediation: 'Implémenter un gestionnaire d\'erreurs personnalisé',
              cvss: 5.3,
              cwe: 'CWE-209',
              owasp: 'Data Exposure',
            });
            break;
          }
        }
      } catch (e) {}
    }
    
    return { findings };
  }

  async apiKeyLeakage() {
    console.log('  Testing API Key Leakage...');
    const findings = [];
    
    // Vérifier les pages HTML/JS pour des clés API
    const pagesToCheck = ['/', '/login', '/dashboard'];
    
    const apiKeyPatterns = [
      { pattern: /AIza[0-9A-Za-z\-_]{35}/g, name: 'Google API Key' },
      { pattern: /AKIA[0-9A-Z]{16}/g, name: 'AWS Access Key' },
      { pattern: /sk_live_[0-9a-zA-Z]{24}/g, name: 'Stripe Secret Key' },
      { pattern: /pk_live_[0-9a-zA-Z]{24}/g, name: 'Stripe Public Key' },
      { pattern: /ghp_[a-zA-Z0-9]{36}/g, name: 'GitHub Token' },
      { pattern: /xox[baprs]-[0-9]{10,13}-[0-9a-zA-Z]{10,}/g, name: 'Slack Token' },
      { pattern: /ya29\.[0-9A-Za-z\-_]+/g, name: 'Google OAuth Token' },
      { pattern: /eyJ[a-zA-Z0-9_-]*\.eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*/g, name: 'JWT Token' },
    ];
    
    for (const page of pagesToCheck) {
      try {
        const res = await this.axiosInstance.get(`${this.config.target}${page}`);
        const text = typeof res.data === 'string' ? res.data : JSON.stringify(res.data);
        
        for (const { pattern, name } of apiKeyPatterns) {
          const matches = text.match(pattern);
          
          if (matches && matches.length > 0) {
            findings.push({
              severity: 'CRITICAL',
              category: 'API Key Leakage',
              title: `${name} trouvée dans ${page}`,
              description: `Clé API exposée dans le code source`,
              endpoint: page,
              method: 'GET',
              keyType: name,
              keysFound: matches.length,
              remediation: 'Stocker les clés API côté serveur, utiliser des variables d\'environnement',
              cvss: 8.5,
              cwe: 'CWE-312',
              owasp: 'Data Exposure',
            });
          }
        }
      } catch (e) {}
    }
    
    return { findings };
  }

  async sourceCodeDisclosure() {
    console.log('  Testing Source Code Disclosure...');
    const findings = [];
    
    const sourceFiles = [
      '/api/auth/signin.js',
      '/api/auth/signin.ts',
      '/pages/api/auth/signin.js',
      '/app/api/auth/route.js',
      '/server.js',
      '/app.js',
      '/index.js',
      '/lib/prisma.js',
      '/lib/db.js',
    ];
    
    for (const file of sourceFiles) {
      try {
        const res = await this.axiosInstance.get(`${this.config.target}${file}`);
        const text = typeof res.data === 'string' ? res.data : '';
        
        // Vérifier si c'est du code source (pas du HTML)
        if (
          res.status === 200 &&
          (text.includes('export ') ||
           text.includes('import ') ||
           text.includes('require(') ||
           text.includes('function ') ||
           text.includes('const '))
        ) {
          findings.push({
            severity: 'HIGH',
            category: 'Source Code Disclosure',
            title: `Code source exposé: ${file}`,
            description: 'Le code source du serveur est accessible',
            endpoint: file,
            method: 'GET',
            snippet: text.substring(0, 200),
            remediation: 'Ne jamais exposer les fichiers source',
            cvss: 7.5,
            cwe: 'CWE-540',
            owasp: 'Data Exposure',
          });
        }
      } catch (e) {}
    }
    
    return { findings };
  }

  async backupFiles() {
    console.log('  Testing Backup Files Exposure...');
    const findings = [];
    
    const backupFiles = [
      '/backup.sql',
      '/backup.zip',
      '/backup.tar.gz',
      '/backup.tar',
      '/database.sql',
      '/db.sql',
      '/dump.sql',
      '/data.sql',
      '/mysql.sql',
      '/postgres.sql',
      '/site.zip',
      '/www.zip',
      '/html.zip',
      '/old.zip',
      '/archive.zip',
      '/.backup',
      '/backup/',
      '/backups/',
      '/old/',
      '/archive/',
    ];
    
    for (const file of backupFiles) {
      try {
        const res = await this.axiosInstance.get(`${this.config.target}${file}`);
        
        if (res.status === 200 && res.data) {
          findings.push({
            severity: 'CRITICAL',
            category: 'Backup File Exposure',
            title: `Fichier de backup accessible: ${file}`,
            description: 'Les fichiers de sauvegarde sont accessibles publiquement',
            endpoint: file,
            method: 'GET',
            remediation: 'Supprimer ou protéger les fichiers de backup',
            cvss: 9.0,
            cwe: 'CWE-530',
            owasp: 'Data Exposure',
          });
        }
      } catch (e) {}
    }
    
    return { findings };
  }

  async gitExposure() {
    console.log('  Testing Git Repository Exposure...');
    const findings = [];
    
    const gitFiles = [
      '/.git/config',
      '/.git/HEAD',
      '/.git/index',
      '/.git/logs/HEAD',
      '/.git/refs/heads/main',
      '/.git/refs/heads/master',
      '/.git/objects/',
      '/.gitignore',
      '/.gitattributes',
    ];
    
    for (const file of gitFiles) {
      try {
        const res = await this.axiosInstance.get(`${this.config.target}${file}`);
        
        if (res.status === 200 && res.data) {
          const text = typeof res.data === 'string' ? res.data : JSON.stringify(res.data);
          
          if (
            text.includes('[core]') ||
            text.includes('ref:') ||
            text.includes('repositoryformatversion')
          ) {
            findings.push({
              severity: 'CRITICAL',
              category: 'Git Repository Exposure',
              title: `Dépôt Git exposé: ${file}`,
              description: 'Le dépôt Git est accessible, permet de télécharger le code source',
              endpoint: file,
              method: 'GET',
              snippet: text.substring(0, 100),
              remediation: 'Bloquer l\'accès au dossier .git',
              cvss: 9.0,
              cwe: 'CWE-527',
              owasp: 'Data Exposure',
            });
          }
        }
      } catch (e) {}
    }
    
    return { findings };
  }

  async envVarsLeakage() {
    console.log('  Testing Environment Variables Leakage...');
    const findings = [];
    
    const envEndpoints = [
      '/api/env',
      '/api/config',
      '/api/debug',
      '/api/info',
      '/api/system/info',
      '/api/health',
      '/__env__',
      '/phpinfo.php',
    ];
    
    const sensitiveVars = [
      'DATABASE_URL',
      'DB_PASSWORD',
      'JWT_SECRET',
      'NEXTAUTH_SECRET',
      'API_KEY',
      'SECRET_KEY',
      'AWS_ACCESS_KEY',
      'AWS_SECRET',
      'STRIPE_SECRET',
      'SMTP_PASSWORD',
      'REDIS_URL',
      'MONGODB_URI',
    ];
    
    for (const endpoint of envEndpoints) {
      try {
        const res = await this.axiosInstance.get(`${this.config.target}${endpoint}`);
        
        if (res.status === 200 && res.data) {
          const text = typeof res.data === 'string' ? res.data : JSON.stringify(res.data);
          
          for (const envVar of sensitiveVars) {
            if (text.includes(envVar)) {
              findings.push({
                severity: 'CRITICAL',
                category: 'Environment Variables Leakage',
                title: `Variable d'environnement exposée: ${envVar}`,
                description: `L'endpoint ${endpoint} expose des variables sensibles`,
                endpoint: endpoint,
                method: 'GET',
                exposedVar: envVar,
                remediation: 'Désactiver les endpoints de debug en production',
                cvss: 9.5,
                cwe: 'CWE-215',
                owasp: 'Data Exposure',
              });
            }
          }
        }
      } catch (e) {}
    }
    
    return { findings };
  }
}
