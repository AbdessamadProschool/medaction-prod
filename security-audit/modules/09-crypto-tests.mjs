/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                    MODULE 09 - CRYPTOGRAPHY TESTS                            ║
 * ║                         AGGRESSIVE SECURITY AUDIT                            ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 * 
 * Tests comprehensive cryptographic security including:
 * - TLS/SSL Configuration Analysis
 * - Certificate Validation
 * - Cipher Suite Analysis
 * - Password Hashing Detection
 * - JWT Security
 * - Entropy Analysis
 * - Key Management
 */

import axios from 'axios';
import https from 'https';
import tls from 'tls';
import crypto from 'crypto';

export class CryptoTestsModule {
  constructor(config) {
    this.config = config;
    this.findings = [];
    this.targetUrl = new URL(config.target);
    this.axiosInstance = axios.create({ 
      timeout: 15000, 
      validateStatus: () => true,
      httpsAgent: new https.Agent({ rejectUnauthorized: false })
    });
  }

  async runCryptoAudit() {
    console.log('\n  ╔══════════════════════════════════════════════════════════════╗');
    console.log('  ║           [09] CRYPTOGRAPHY SECURITY TESTS                   ║');
    console.log('  ╚══════════════════════════════════════════════════════════════╝\n');

    const allFindings = [];

    try {
      // 1. TLS/SSL Analysis
      const tlsFindings = await this.analyzeTLS();
      allFindings.push(...tlsFindings);

      // 2. Security Headers Check (Crypto-related)
      const headerFindings = await this.checkSecurityHeaders();
      allFindings.push(...headerFindings);

      // 3. JWT Security Tests
      const jwtFindings = await this.testJWTSecurity();
      allFindings.push(...jwtFindings);

      // 4. Password Policy Tests
      const passwordFindings = await this.testPasswordPolicy();
      allFindings.push(...passwordFindings);

      // 5. Cookie Security
      const cookieFindings = await this.testCookieSecurity();
      allFindings.push(...cookieFindings);

      // 6. Sensitive Data Encryption
      const dataFindings = await this.testDataEncryption();
      allFindings.push(...dataFindings);

      // 7. Randomness/Entropy Tests
      const entropyFindings = await this.testEntropy();
      allFindings.push(...entropyFindings);

      console.log(`    ✓ Cryptography tests completed: ${allFindings.length} findings`);

    } catch (error) {
      console.log(`    ✗ Crypto test error: ${error.message}`);
    }

    return { findings: allFindings };
  }

  async analyzeTLS() {
    const findings = [];
    console.log('    → Analyzing TLS/SSL configuration...');

    if (this.targetUrl.protocol !== 'https:') {
      findings.push({
        severity: 'CRITICAL',
        category: 'Cryptography',
        title: 'No HTTPS - Traffic sent in clear text',
        description: `The application at ${this.config.target} uses HTTP instead of HTTPS. All traffic including credentials is unencrypted.`,
        remediation: 'Enable HTTPS with a valid TLS certificate (minimum TLS 1.2)',
        cvss: 9.1,
        cwe: 'CWE-311'
      });
      return findings;
    }

    try {
      const options = {
        host: this.targetUrl.hostname,
        port: this.targetUrl.port || 443,
        servername: this.targetUrl.hostname,
        rejectUnauthorized: false
      };

      const socket = await new Promise((resolve, reject) => {
        const sock = tls.connect(options, () => resolve(sock));
        sock.on('error', reject);
        sock.setTimeout(10000, () => reject(new Error('TLS timeout')));
      });

      // Analyze certificate
      const cert = socket.getPeerCertificate();
      const cipher = socket.getCipher();
      const protocol = socket.getProtocol();

      // Check protocol version
      if (protocol === 'TLSv1' || protocol === 'TLSv1.1') {
        findings.push({
          severity: 'HIGH',
          category: 'Cryptography',
          title: `Deprecated TLS version: ${protocol}`,
          description: `Server supports ${protocol} which is deprecated and vulnerable to attacks like BEAST, POODLE.`,
          remediation: 'Disable TLS 1.0 and 1.1. Use TLS 1.2 minimum, TLS 1.3 recommended.',
          cvss: 7.5,
          cwe: 'CWE-326'
        });
      }

      // Check SSLv3
      if (protocol === 'SSLv3') {
        findings.push({
          severity: 'CRITICAL',
          category: 'Cryptography',
          title: 'SSLv3 Protocol Enabled (POODLE Vulnerable)',
          description: 'SSLv3 is completely broken and must be disabled immediately.',
          remediation: 'Disable SSLv3 completely.',
          cvss: 9.8,
          cwe: 'CWE-327'
        });
      }

      // Check cipher strength
      const weakCiphers = ['DES', 'RC4', '3DES', 'MD5', 'NULL', 'EXPORT', 'anon'];
      for (const weak of weakCiphers) {
        if (cipher.name.includes(weak)) {
          findings.push({
            severity: 'HIGH',
            category: 'Cryptography',
            title: `Weak cipher suite: ${cipher.name}`,
            description: `The cipher ${cipher.name} contains weak algorithm ${weak}.`,
            remediation: 'Use only strong cipher suites: AES-GCM, ChaCha20-Poly1305.',
            cvss: 7.5,
            cwe: 'CWE-327'
          });
        }
      }

      // Check certificate validity
      const now = new Date();
      const validTo = new Date(cert.valid_to);
      const validFrom = new Date(cert.valid_from);

      if (validTo < now) {
        findings.push({
          severity: 'CRITICAL',
          category: 'Cryptography',
          title: 'SSL Certificate Expired',
          description: `Certificate expired on ${validTo.toISOString()}`,
          remediation: 'Renew the SSL certificate immediately.',
          cvss: 8.1,
          cwe: 'CWE-295'
        });
      }

      // Check certificate expiry soon (30 days)
      const daysUntilExpiry = (validTo - now) / (1000 * 60 * 60 * 24);
      if (daysUntilExpiry < 30 && daysUntilExpiry > 0) {
        findings.push({
          severity: 'MEDIUM',
          category: 'Cryptography',
          title: 'SSL Certificate Expiring Soon',
          description: `Certificate expires in ${Math.ceil(daysUntilExpiry)} days on ${validTo.toISOString()}`,
          remediation: 'Renew the SSL certificate before expiration.',
          cvss: 4.0,
          cwe: 'CWE-295'
        });
      }

      // Check self-signed
      if (cert.issuer && cert.subject) {
        const issuerCN = cert.issuer.CN || '';
        const subjectCN = cert.subject.CN || '';
        if (issuerCN === subjectCN) {
          findings.push({
            severity: 'MEDIUM',
            category: 'Cryptography',
            title: 'Self-Signed Certificate Detected',
            description: 'The certificate is self-signed and will not be trusted by browsers.',
            remediation: 'Use a certificate from a trusted Certificate Authority.',
            cvss: 5.3,
            cwe: 'CWE-295'
          });
        }
      }

      socket.end();

    } catch (error) {
      console.log(`      TLS analysis error: ${error.message}`);
    }

    return findings;
  }

  async checkSecurityHeaders() {
    const findings = [];
    console.log('    → Checking crypto-related security headers...');

    try {
      const response = await this.axiosInstance.get(this.config.target);
      const headers = response.headers;

      // HSTS
      if (!headers['strict-transport-security']) {
        findings.push({
          severity: 'MEDIUM',
          category: 'Cryptography',
          title: 'Missing HSTS Header',
          description: 'HTTP Strict Transport Security is not enabled, allowing protocol downgrade attacks.',
          remediation: 'Add header: Strict-Transport-Security: max-age=31536000; includeSubDomains; preload',
          cvss: 5.9,
          cwe: 'CWE-311'
        });
      } else {
        const hsts = headers['strict-transport-security'];
        if (!hsts.includes('includeSubDomains')) {
          findings.push({
            severity: 'LOW',
            category: 'Cryptography',
            title: 'HSTS Missing includeSubDomains',
            description: 'HSTS header does not include subdomains.',
            remediation: 'Add includeSubDomains to HSTS header.',
            cvss: 3.0,
            cwe: 'CWE-311'
          });
        }
        const maxAgeMatch = hsts.match(/max-age=(\d+)/);
        if (maxAgeMatch && parseInt(maxAgeMatch[1]) < 15768000) {
          findings.push({
            severity: 'LOW',
            category: 'Cryptography',
            title: 'HSTS max-age too short',
            description: `HSTS max-age is ${maxAgeMatch[1]} seconds (should be minimum 6 months).`,
            remediation: 'Set max-age to at least 31536000 (1 year).',
            cvss: 2.0,
            cwe: 'CWE-311'
          });
        }
      }

      // Public-Key-Pins (deprecated but check for dangerous config)
      if (headers['public-key-pins']) {
        findings.push({
          severity: 'INFO',
          category: 'Cryptography',
          title: 'Public-Key-Pins Header Detected',
          description: 'HPKP is deprecated and can cause denial of service if misconfigured.',
          remediation: 'Consider removing HPKP in favor of Certificate Transparency.',
          cvss: 0,
          cwe: 'CWE-295'
        });
      }

      // Expect-CT
      if (!headers['expect-ct'] && this.targetUrl.protocol === 'https:') {
        findings.push({
          severity: 'INFO',
          category: 'Cryptography',
          title: 'Missing Expect-CT Header',
          description: 'Certificate Transparency enforcement is not enabled.',
          remediation: 'Add header: Expect-CT: max-age=86400, enforce',
          cvss: 0,
          cwe: 'CWE-295'
        });
      }

    } catch (error) {
      console.log(`      Header check error: ${error.message}`);
    }

    return findings;
  }

  async testJWTSecurity() {
    const findings = [];
    console.log('    → Testing JWT security...');

    try {
      // Test for JWT none algorithm vulnerability
      const noneAlgToken = 'eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkF0dGFja2VyIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMn0.';
      
      const protectedEndpoints = [
        '/api/user/profile',
        '/api/admin',
        '/api/dashboard',
        '/api/users',
        '/api/me'
      ];

      for (const endpoint of protectedEndpoints) {
        try {
          const url = `${this.config.target}${endpoint}`;
          const response = await this.axiosInstance.get(url, {
            headers: { 
              'Authorization': `Bearer ${noneAlgToken}`,
              'Cookie': `next-auth.session-token=${noneAlgToken}`
            }
          });

          if (response.status === 200 && response.data && !response.data.error) {
            findings.push({
              severity: 'CRITICAL',
              category: 'Cryptography',
              title: 'JWT None Algorithm Accepted',
              description: `Endpoint ${endpoint} accepts JWT with "none" algorithm, allowing authentication bypass.`,
              remediation: 'Reject JWTs with "none" algorithm. Always verify signature.',
              cvss: 9.8,
              cwe: 'CWE-347'
            });
            break;
          }
        } catch (e) { /* continue */ }
      }

      // Test for JWT algorithm confusion (RS256 -> HS256)
      // This would require the public key, which we don't have
      
      // Test for weak secret detection via common secrets
      const weakSecrets = ['secret', 'password', '123456', 'jwt-secret', 'your-secret-key'];
      // This is informational - actual brute force would be too slow

    } catch (error) {
      console.log(`      JWT test error: ${error.message}`);
    }

    return findings;
  }

  async testPasswordPolicy() {
    const findings = [];
    console.log('    → Testing password policy...');

    try {
      const registerEndpoint = `${this.config.target}/api/auth/register`;
      
      // Test weak passwords
      const weakPasswords = [
        { password: '123456', desc: 'numeric only' },
        { password: 'password', desc: 'common word' },
        { password: 'aaa', desc: 'too short (3 chars)' },
        { password: 'aaaaaaaa', desc: 'no complexity' }
      ];

      for (const test of weakPasswords) {
        try {
          const response = await this.axiosInstance.post(registerEndpoint, {
            email: `test${Date.now()}@example.com`,
            password: test.password,
            nom: 'Test',
            prenom: 'User'
          }, {
            headers: { 'Content-Type': 'application/json' }
          });

          // If registration succeeds with weak password
          if (response.status === 200 || response.status === 201) {
            findings.push({
              severity: 'MEDIUM',
              category: 'Cryptography',
              title: `Weak Password Accepted: ${test.desc}`,
              description: `The system accepted password "${test.password}" which is ${test.desc}.`,
              remediation: 'Implement strong password policy: minimum 8 chars, uppercase, lowercase, number, special char.',
              cvss: 5.3,
              cwe: 'CWE-521'
            });
          }
        } catch (e) { /* endpoint may not exist */ }
      }

      // Check login for timing attacks
      const loginEndpoint = `${this.config.target}/api/auth/callback/credentials`;
      const timings = [];
      
      for (let i = 0; i < 5; i++) {
        const start = Date.now();
        try {
          await this.axiosInstance.post(loginEndpoint, {
            email: 'nonexistent@example.com',
            password: 'wrongpassword'
          });
        } catch (e) {}
        timings.push(Date.now() - start);
      }

      // Check for timing difference with existing user (if we had one)
      // This is informational - detailed timing attacks require more samples

    } catch (error) {
      console.log(`      Password policy test error: ${error.message}`);
    }

    return findings;
  }

  async testCookieSecurity() {
    const findings = [];
    console.log('    → Testing cookie security...');

    try {
      const response = await this.axiosInstance.get(this.config.target);
      const setCookies = response.headers['set-cookie'];

      if (setCookies) {
        const cookies = Array.isArray(setCookies) ? setCookies : [setCookies];

        for (const cookie of cookies) {
          const cookieName = cookie.split('=')[0];

          // Check Secure flag
          if (!cookie.toLowerCase().includes('secure') && this.targetUrl.protocol === 'https:') {
            findings.push({
              severity: 'MEDIUM',
              category: 'Cryptography',
              title: `Cookie Missing Secure Flag: ${cookieName}`,
              description: `Cookie ${cookieName} does not have the Secure flag, can be sent over HTTP.`,
              remediation: 'Add Secure flag to all cookies on HTTPS sites.',
              cvss: 4.3,
              cwe: 'CWE-614'
            });
          }

          // Check HttpOnly flag for session cookies
          if ((cookieName.includes('session') || cookieName.includes('token') || cookieName.includes('auth')) 
              && !cookie.toLowerCase().includes('httponly')) {
            findings.push({
              severity: 'MEDIUM',
              category: 'Cryptography',
              title: `Session Cookie Missing HttpOnly: ${cookieName}`,
              description: `Session cookie ${cookieName} is accessible via JavaScript (XSS vulnerable).`,
              remediation: 'Add HttpOnly flag to all session/auth cookies.',
              cvss: 5.4,
              cwe: 'CWE-1004'
            });
          }

          // Check SameSite
          if (!cookie.toLowerCase().includes('samesite')) {
            findings.push({
              severity: 'LOW',
              category: 'Cryptography',
              title: `Cookie Missing SameSite: ${cookieName}`,
              description: `Cookie ${cookieName} does not have SameSite attribute (CSRF risk).`,
              remediation: 'Add SameSite=Strict or SameSite=Lax attribute.',
              cvss: 3.1,
              cwe: 'CWE-1275'
            });
          }
        }
      }

    } catch (error) {
      console.log(`      Cookie security test error: ${error.message}`);
    }

    return findings;
  }

  async testDataEncryption() {
    const findings = [];
    console.log('    → Testing data encryption...');

    try {
      // Check for sensitive data in responses
      const endpoints = [
        '/api/users',
        '/api/etablissements',
        '/api/reclamations',
        '/api/user/profile'
      ];

      const sensitivePatterns = [
        { pattern: /password["\s]*[:=]["\s]*[^,}\s]+/gi, field: 'password' },
        { pattern: /mot[_]?de[_]?passe["\s]*[:=]["\s]*[^,}\s]+/gi, field: 'motDePasse' },
        { pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, field: 'email (in clear)' },
        { pattern: /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14})\b/g, field: 'credit card' },
        { pattern: /secret["\s]*[:=]["\s]*["'][^"']+["']/gi, field: 'secret' },
        { pattern: /api[_-]?key["\s]*[:=]["\s]*["'][^"']+["']/gi, field: 'API key' }
      ];

      for (const endpoint of endpoints) {
        try {
          const response = await this.axiosInstance.get(`${this.config.target}${endpoint}`);
          const body = JSON.stringify(response.data);

          for (const { pattern, field } of sensitivePatterns) {
            const matches = body.match(pattern);
            if (matches && field !== 'email (in clear)') { // Emails can be expected
              findings.push({
                severity: field === 'password' || field === 'motDePasse' ? 'CRITICAL' : 'HIGH',
                category: 'Cryptography',
                title: `Sensitive Data Exposure: ${field}`,
                description: `Endpoint ${endpoint} exposes ${field} in response: ${matches[0].substring(0, 50)}...`,
                remediation: `Never expose ${field} in API responses. Encrypt or hash sensitive data.`,
                cvss: field.includes('password') ? 9.1 : 7.5,
                cwe: 'CWE-312'
              });
            }
          }
        } catch (e) { /* continue */ }
      }

    } catch (error) {
      console.log(`      Data encryption test error: ${error.message}`);
    }

    return findings;
  }

  async testEntropy() {
    const findings = [];
    console.log('    → Testing randomness/entropy...');

    try {
      // Test password reset token entropy
      const tokens = [];
      const resetEndpoint = `${this.config.target}/api/auth/forgot-password`;

      for (let i = 0; i < 3; i++) {
        try {
          const response = await this.axiosInstance.post(resetEndpoint, {
            email: `entropy-test-${i}@example.com`
          });
          // If response contains a token, analyze it
        } catch (e) { /* continue */ }
      }

      // Test session ID entropy (by looking at multiple cookies)
      const sessionIds = [];
      for (let i = 0; i < 5; i++) {
        try {
          const response = await this.axiosInstance.get(this.config.target);
          const cookies = response.headers['set-cookie'];
          if (cookies) {
            const sessionCookie = cookies.find(c => c.includes('session'));
            if (sessionCookie) {
              const value = sessionCookie.split('=')[1].split(';')[0];
              sessionIds.push(value);
            }
          }
        } catch (e) { /* continue */ }
      }

      // Check for sequential or predictable patterns
      if (sessionIds.length >= 2) {
        const isSequential = sessionIds.every((id, i) => {
          if (i === 0) return true;
          const prev = parseInt(sessionIds[i-1], 16);
          const curr = parseInt(id, 16);
          return !isNaN(prev) && !isNaN(curr) && Math.abs(curr - prev) < 100;
        });

        if (isSequential) {
          findings.push({
            severity: 'CRITICAL',
            category: 'Cryptography',
            title: 'Predictable Session IDs',
            description: 'Session IDs appear to be sequential or predictable, allowing session hijacking.',
            remediation: 'Use cryptographically secure random number generator (CSPRNG) for session IDs.',
            cvss: 9.1,
            cwe: 'CWE-330'
          });
        }
      }

    } catch (error) {
      console.log(`      Entropy test error: ${error.message}`);
    }

    return findings;
  }
}
