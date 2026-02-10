/**
 * ═══════════════════════════════════════════════════════════════════
 * AUTHENTICATION SECURITY MODULE - MÉDIOUNA ACTION
 * Tests: JWT, Brute Force, Account Enumeration, Password Reset
 * ═══════════════════════════════════════════════════════════════════
 */

import axios from 'axios';

export class AuthenticationModule {
  constructor(config) {
    this.config = config;
    this.tokens = {};
    this.axiosInstance = axios.create({
      timeout: config.timeout || 30000,
      maxRedirects: 5,
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
      if (res.status === 200 && res.data) {
        this.tokens[role] = res.data.token || res.data.accessToken;
        return this.tokens[role];
      }
    } catch (e) {}
    return null;
  }

  async jwtSecurity() {
    console.log('  Testing JWT Token Security...');
    const findings = [];
    
    const token = await this.getToken('citoyen');
    if (!token) return { findings };
    
    const parts = token.split('.');
    if (parts.length !== 3) return { findings };
    
    // Test 1: Algorithme "none"
    try {
      const noneHeader = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64').replace(/=/g, '');
      const noneToken = `${noneHeader}.${parts[1]}.`;
      
      const res = await this.axiosInstance.get(`${this.config.apiBaseUrl}/users/me`, {
        headers: { Authorization: `Bearer ${noneToken}` },
      });
      
      if (res.status === 200) {
        findings.push({
          severity: 'CRITICAL',
          category: 'JWT None Algorithm',
          title: 'JWT avec alg:none accepté',
          description: 'Le serveur accepte les JWT sans signature',
          endpoint: '/users/me',
          remediation: 'Rejeter explicitement l\'algorithme "none"',
          cvss: 9.8,
          cwe: 'CWE-347',
          owasp: 'JWT Security',
        });
      }
    } catch (e) {}
    
    // Test 2: Token modifié
    try {
      const tamperedPayload = Buffer.from(JSON.stringify({ role: 'SUPER_ADMIN' })).toString('base64').replace(/=/g, '');
      const tamperedToken = `${parts[0]}.${tamperedPayload}.${parts[2]}`;
      
      const res = await this.axiosInstance.get(`${this.config.apiBaseUrl}/users/me`, {
        headers: { Authorization: `Bearer ${tamperedToken}` },
      });
      
      if (res.status === 200) {
        findings.push({
          severity: 'CRITICAL',
          category: 'JWT Tampering',
          title: 'Token JWT modifié accepté',
          description: 'Le serveur accepte des tokens avec payload modifié',
          endpoint: '/users/me',
          remediation: 'Toujours vérifier la signature JWT',
          cvss: 9.8,
          cwe: 'CWE-347',
          owasp: 'JWT Security',
        });
      }
    } catch (e) {}
    
    // Test 3: Analyse du payload
    try {
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      const sensitiveFields = ['password', 'passwordHash', 'secret'];
      
      for (const field of sensitiveFields) {
        if (payload[field] !== undefined) {
          findings.push({
            severity: 'HIGH',
            category: 'JWT Sensitive Data',
            title: `Données sensibles dans JWT: ${field}`,
            description: 'Le token contient des données sensibles',
            remediation: 'Ne jamais stocker de données sensibles dans le JWT',
            cvss: 7.5,
            cwe: 'CWE-312',
            owasp: 'JWT Security',
          });
        }
      }
    } catch (e) {}
    
    return { findings };
  }

  async passwordPolicy() {
    console.log('  Testing Password Policy...');
    const findings = [];
    
    const weakPasswords = ['123456', 'password', 'abc123', 'qwerty', 'admin', '12345678'];
    
    for (const pass of weakPasswords) {
      try {
        const res = await this.axiosInstance.post(`${this.config.apiBaseUrl}/auth/register`, {
          nom: 'Test',
          prenom: 'User',
          email: `test${Date.now()}${Math.random()}@example.com`,
          motDePasse: pass,
          confirmPassword: pass,
          telephone: '0600000000',
        });
        
        if (res.status === 200 || res.status === 201) {
          findings.push({
            severity: 'MEDIUM',
            category: 'Weak Password Policy',
            title: `Mot de passe faible accepté: ${pass}`,
            description: 'Le système accepte des mots de passe trop simples',
            endpoint: '/auth/register',
            remediation: 'Implémenter une politique de mot de passe forte',
            cvss: 5.0,
            cwe: 'CWE-521',
            owasp: 'Password Policy',
          });
          break;
        }
      } catch (e) {}
    }
    
    return { findings };
  }

  async bruteForceTest() {
    console.log('  Testing Brute Force Protection...');
    const findings = [];
    
    let attempts = 0;
    const maxAttempts = 20;
    
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const res = await this.axiosInstance.post(`${this.config.apiBaseUrl}/auth/signin`, {
          email: this.config.credentials.citoyen?.email || 'test@example.com',
          password: `WrongPassword${i}!`,
        });
        
        if (res.status !== 429) {
          attempts++;
        } else {
          break;
        }
        
        await new Promise(r => setTimeout(r, 50));
      } catch (e) {}
    }
    
    if (attempts >= maxAttempts - 2) {
      findings.push({
        severity: 'HIGH',
        category: 'Brute Force',
        title: 'Pas de protection brute force',
        description: `${attempts} tentatives échouées sans blocage`,
        endpoint: '/auth/signin',
        remediation: 'Implémenter rate limiting et verrouillage de compte',
        cvss: 7.5,
        cwe: 'CWE-307',
        owasp: 'Brute Force',
      });
    }
    
    return { findings };
  }

  async accountEnumeration() {
    console.log('  Testing Account Enumeration...');
    const findings = [];
    
    try {
      const res1 = await this.axiosInstance.post(`${this.config.apiBaseUrl}/auth/signin`, {
        email: 'nonexistent_user_12345@example.com',
        password: 'WrongPassword123!',
      });
      
      const res2 = await this.axiosInstance.post(`${this.config.apiBaseUrl}/auth/signin`, {
        email: this.config.credentials.citoyen?.email,
        password: 'WrongPassword123!',
      });
      
      const error1 = JSON.stringify(res1.data);
      const error2 = JSON.stringify(res2.data);
      
      if (error1 !== error2) {
        findings.push({
          severity: 'LOW',
          category: 'Account Enumeration',
          title: 'Énumération de comptes via login',
          description: 'Messages d\'erreur différents pour utilisateurs existants vs inexistants',
          endpoint: '/auth/signin',
          remediation: 'Utiliser le même message d\'erreur générique',
          cvss: 3.7,
          cwe: 'CWE-203',
          owasp: 'Account Enumeration',
        });
      }
    } catch (e) {}
    
    return { findings };
  }

  async passwordResetFlaws() {
    console.log('  Testing Password Reset Flaws...');
    const findings = [];
    
    // Test: Reset sans rate limiting
    let attempts = 0;
    
    for (let i = 0; i < 10; i++) {
      try {
        const res = await this.axiosInstance.post(`${this.config.apiBaseUrl}/auth/forgot-password`, {
          email: this.config.credentials.citoyen?.email || 'test@example.com',
        });
        
        if (res.status !== 429) {
          attempts++;
        } else {
          break;
        }
      } catch (e) {}
    }
    
    if (attempts >= 8) {
      findings.push({
        severity: 'MEDIUM',
        category: 'Password Reset Flood',
        title: 'Pas de rate limiting sur reset password',
        description: `${attempts} requêtes de reset acceptées sans blocage`,
        endpoint: '/auth/forgot-password',
        remediation: 'Limiter les demandes de reset (ex: 3/heure)',
        cvss: 5.0,
        cwe: 'CWE-770',
        owasp: 'Password Reset',
      });
    }
    
    return { findings };
  }

  async twoFactorBypass() {
    console.log('  Testing 2FA Bypass...');
    const findings = [];
    
    // Test: Bypass 2FA via endpoints alternatifs
    const bypassEndpoints = [
      '/auth/signin-legacy',
      '/auth/mobile-login',
      '/api/v1/auth/signin',
      '/auth/sso/callback',
    ];
    
    for (const endpoint of bypassEndpoints) {
      try {
        const res = await this.axiosInstance.post(`${this.config.target}${endpoint}`, {
          email: this.config.credentials.citoyen?.email,
          password: this.config.credentials.citoyen?.password,
        });
        
        if (res.status === 200 && (res.data.token || res.data.accessToken)) {
          findings.push({
            severity: 'CRITICAL',
            category: '2FA Bypass',
            title: `Bypass 2FA via ${endpoint}`,
            description: 'Endpoint alternatif permet de contourner le 2FA',
            endpoint: endpoint,
            remediation: 'Exiger 2FA sur tous les endpoints d\'authentification',
            cvss: 8.5,
            cwe: 'CWE-287',
            owasp: '2FA Bypass',
          });
        }
      } catch (e) {}
    }
    
    return { findings };
  }

  async sessionFixation() {
    console.log('  Testing Session Fixation...');
    const findings = [];
    
    try {
      const res1 = await this.axiosInstance.get(this.config.target);
      const initialCookie = res1.headers['set-cookie'];
      
      if (initialCookie) {
        const loginRes = await this.axiosInstance.post(
          `${this.config.apiBaseUrl}/auth/signin`,
          {
            email: this.config.credentials.citoyen?.email,
            password: this.config.credentials.citoyen?.password,
          },
          { headers: { Cookie: initialCookie.join('; ') } }
        );
        
        const afterCookie = loginRes.headers['set-cookie'];
        
        const getSessionId = (cookies) => {
          if (!cookies) return null;
          const session = cookies.find(c => c.includes('session') || c.includes('next-auth'));
          return session ? session.split(';')[0] : null;
        };
        
        if (getSessionId(initialCookie) === getSessionId(afterCookie) && getSessionId(initialCookie)) {
          findings.push({
            severity: 'MEDIUM',
            category: 'Session Fixation',
            title: 'Session non régénérée après login',
            description: 'L\'ID de session reste identique avant et après authentification',
            endpoint: '/auth/signin',
            remediation: 'Régénérer l\'ID de session après authentification',
            cvss: 6.5,
            cwe: 'CWE-384',
            owasp: 'Session Fixation',
          });
        }
      }
    } catch (e) {}
    
    return { findings };
  }

  async credentialStorage() {
    console.log('  Testing Credential Storage...');
    const findings = [];
    
    const token = await this.getToken('citoyen');
    if (!token) return { findings };
    
    try {
      const res = await this.axiosInstance.get(`${this.config.apiBaseUrl}/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (res.status === 200 && res.data) {
        const sensitiveFields = ['password', 'motDePasse', 'passwordHash', 'hash'];
        
        for (const field of sensitiveFields) {
          if (res.data[field] !== undefined) {
            findings.push({
              severity: 'CRITICAL',
              category: 'Credential Exposure',
              title: `Credential exposé: ${field}`,
              description: 'Le mot de passe/hash est exposé dans la réponse API',
              endpoint: '/users/me',
              remediation: 'Ne jamais exposer les mots de passe ou hashes',
              cvss: 9.0,
              cwe: 'CWE-312',
              owasp: 'Credential Storage',
            });
          }
        }
      }
    } catch (e) {}
    
    return { findings };
  }
}
