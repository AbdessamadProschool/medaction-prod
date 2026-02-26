/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                    MODULE 10 - SESSION MANAGEMENT TESTS                      ║
 * ║                         AGGRESSIVE SECURITY AUDIT                            ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 * 
 * Tests comprehensive session security including:
 * - Session Fixation
 * - Session Hijacking
 * - Session Timeout
 * - Concurrent Sessions
 * - Session Invalidation on Logout
 * - Token Refresh Security
 * - Cross-Site Request Forgery (CSRF)
 */

import axios from 'axios';
import https from 'https';

export class SessionManagementModule {
  constructor(config) {
    this.config = config;
    this.findings = [];
    this.axiosInstance = axios.create({ 
      timeout: 15000, 
      validateStatus: () => true,
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
      maxRedirects: 0
    });
  }

  async checkSessionCookies() {
    console.log('\n  ╔══════════════════════════════════════════════════════════════╗');
    console.log('  ║           [10] SESSION MANAGEMENT TESTS                      ║');
    console.log('  ╚══════════════════════════════════════════════════════════════╝\n');

    const allFindings = [];

    try {
      // 1. Cookie Security Analysis
      const cookieFindings = await this.analyzeCookies();
      allFindings.push(...cookieFindings);

      // 2. Session Fixation Test
      const fixationFindings = await this.testSessionFixation();
      allFindings.push(...fixationFindings);

      // 3. Session Timeout Test
      const timeoutFindings = await this.testSessionTimeout();
      allFindings.push(...timeoutFindings);

      // 4. Concurrent Sessions Test
      const concurrentFindings = await this.testConcurrentSessions();
      allFindings.push(...concurrentFindings);

      // 5. Session Invalidation on Logout
      const logoutFindings = await this.testLogoutInvalidation();
      allFindings.push(...logoutFindings);

      // 6. CSRF Token Analysis
      const csrfFindings = await this.testCSRFProtection();
      allFindings.push(...csrfFindings);

      // 7. Token Refresh Security
      const refreshFindings = await this.testTokenRefresh();
      allFindings.push(...refreshFindings);

      // 8. Session ID in URL
      const urlFindings = await this.testSessionInURL();
      allFindings.push(...urlFindings);

      console.log(`    ✓ Session management tests completed: ${allFindings.length} findings`);

    } catch (error) {
      console.log(`    ✗ Session test error: ${error.message}`);
    }

    return { findings: allFindings };
  }

  async analyzeCookies() {
    const findings = [];
    console.log('    → Analyzing session cookies...');

    try {
      // Get initial cookies
      const response = await this.axiosInstance.get(this.config.target);
      const cookies = this.parseCookies(response.headers['set-cookie']);

      for (const cookie of cookies) {
        // Check for session-related cookies
        const isSessionCookie = ['session', 'token', 'auth', 'sid', 'jwt', 'access'].some(
          keyword => cookie.name.toLowerCase().includes(keyword)
        );

        if (isSessionCookie) {
          console.log(`      Found session cookie: ${cookie.name}`);

          // Check Secure flag
          if (!cookie.secure) {
            findings.push({
              severity: 'MEDIUM',
              category: 'Session Management',
              title: `Session Cookie Missing Secure Flag: ${cookie.name}`,
              description: `Session cookie ${cookie.name} can be transmitted over unencrypted HTTP.`,
              remediation: 'Add Secure flag to all session cookies.',
              cvss: 5.3,
              cwe: 'CWE-614'
            });
          }

          // Check HttpOnly flag
          if (!cookie.httpOnly) {
            findings.push({
              severity: 'MEDIUM',
              category: 'Session Management',
              title: `Session Cookie Missing HttpOnly: ${cookie.name}`,
              description: `Session cookie ${cookie.name} is accessible via JavaScript, enabling XSS-based session theft.`,
              remediation: 'Add HttpOnly flag to all session cookies.',
              cvss: 5.4,
              cwe: 'CWE-1004'
            });
          }

          // Check SameSite
          if (!cookie.sameSite || cookie.sameSite.toLowerCase() === 'none') {
            findings.push({
              severity: 'MEDIUM',
              category: 'Session Management',
              title: `Session Cookie Weak SameSite: ${cookie.name}`,
              description: `Session cookie ${cookie.name} has SameSite=${cookie.sameSite || 'None'}, enabling CSRF attacks.`,
              remediation: 'Set SameSite=Strict or SameSite=Lax for session cookies.',
              cvss: 6.1,
              cwe: 'CWE-1275'
            });
          }

          // Check expiration
          if (cookie.maxAge && cookie.maxAge > 86400 * 30) { // More than 30 days
            findings.push({
              severity: 'LOW',
              category: 'Session Management',
              title: `Long-lived Session Cookie: ${cookie.name}`,
              description: `Session cookie ${cookie.name} has max-age of ${Math.round(cookie.maxAge / 86400)} days.`,
              remediation: 'Use shorter session lifetimes (e.g., 24 hours for sensitive applications).',
              cvss: 3.1,
              cwe: 'CWE-613'
            });
          }

          // Check entropy (length)
          if (cookie.value.length < 32) {
            findings.push({
              severity: 'MEDIUM',
              category: 'Session Management',
              title: `Short Session Token: ${cookie.name}`,
              description: `Session token is only ${cookie.value.length} characters. May have insufficient entropy.`,
              remediation: 'Use session tokens of at least 128 bits (32 hex characters).',
              cvss: 5.3,
              cwe: 'CWE-330'
            });
          }
        }
      }

    } catch (error) {
      console.log(`      Cookie analysis error: ${error.message}`);
    }

    return findings;
  }

  async testSessionFixation() {
    const findings = [];
    console.log('    → Testing session fixation vulnerability...');

    try {
      // Step 1: Get a session cookie as unauthenticated user
      const preAuthResponse = await this.axiosInstance.get(this.config.target);
      const preAuthCookies = this.parseCookies(preAuthResponse.headers['set-cookie']);
      const preAuthSession = preAuthCookies.find(c => 
        ['session', 'token', 'sid'].some(k => c.name.toLowerCase().includes(k))
      );

      if (!preAuthSession) {
        console.log('      No pre-auth session cookie found');
        return findings;
      }

      console.log(`      Pre-auth session: ${preAuthSession.value.substring(0, 16)}...`);

      // Step 2: Attempt login with the pre-existing session
      const loginResponse = await this.axiosInstance.post(
        `${this.config.target}/api/auth/callback/credentials`,
        { email: 'test@test.com', password: 'test123' },
        { 
          headers: { 
            'Cookie': `${preAuthSession.name}=${preAuthSession.value}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const postAuthCookies = this.parseCookies(loginResponse.headers['set-cookie']);
      const postAuthSession = postAuthCookies.find(c => c.name === preAuthSession.name);

      // If the same session ID is used after login, session fixation is possible
      if (postAuthSession && postAuthSession.value === preAuthSession.value) {
        findings.push({
          severity: 'HIGH',
          category: 'Session Management',
          title: 'Session Fixation Vulnerability',
          description: 'The session ID is not regenerated after authentication, allowing an attacker to fix the session.',
          remediation: 'Regenerate session ID after successful authentication.',
          cvss: 7.5,
          cwe: 'CWE-384'
        });
      }

    } catch (error) {
      console.log(`      Session fixation test error: ${error.message}`);
    }

    return findings;
  }

  async testSessionTimeout() {
    const findings = [];
    console.log('    → Testing session timeout...');

    try {
      // Check if session timeout is documented or inferrable
      const response = await this.axiosInstance.get(`${this.config.target}/api/auth/session`);
      
      if (response.data && response.data.expires) {
        const expiresAt = new Date(response.data.expires);
        const now = new Date();
        const sessionLifetime = (expiresAt - now) / (1000 * 60 * 60); // in hours

        if (sessionLifetime > 24) {
          findings.push({
            severity: 'MEDIUM',
            category: 'Session Management',
            title: 'Long Session Lifetime',
            description: `Session expires in ${Math.round(sessionLifetime)} hours.`,
            remediation: 'Implement shorter session timeouts for sensitive applications (e.g., 2-8 hours).',
            cvss: 4.3,
            cwe: 'CWE-613'
          });
        }

        if (sessionLifetime > 168) { // 1 week
          findings.push({
            severity: 'HIGH',
            category: 'Session Management',
            title: 'Excessive Session Lifetime',
            description: `Session expires in ${Math.round(sessionLifetime/24)} days. This increases risk of session hijacking.`,
            remediation: 'Reduce session lifetime and implement sliding expiration.',
            cvss: 6.5,
            cwe: 'CWE-613'
          });
        }
      }

      // Check for idle timeout
      // This would require waiting, so we just check for headers/config

    } catch (error) {
      console.log(`      Session timeout test error: ${error.message}`);
    }

    return findings;
  }

  async testConcurrentSessions() {
    const findings = [];
    console.log('    → Testing concurrent session handling...');

    try {
      // This test would require actual authentication
      // We check if there's any mechanism to list/manage sessions
      const sessionEndpoints = [
        '/api/user/sessions',
        '/api/auth/sessions',
        '/api/me/sessions',
        '/profil/securite'
      ];

      for (const endpoint of sessionEndpoints) {
        const response = await this.axiosInstance.get(`${this.config.target}${endpoint}`);
        
        if (response.status === 200 && response.data) {
          console.log(`      Found session management endpoint: ${endpoint}`);
          // Session management exists - good
          break;
        }
      }

      // Check if multiple sessions are allowed without limits
      // This is informational as we can't actually test without valid credentials
      findings.push({
        severity: 'INFO',
        category: 'Session Management',
        title: 'Concurrent Session Policy',
        description: 'Verify that concurrent session limits are enforced for sensitive accounts.',
        remediation: 'Implement concurrent session limits (e.g., max 3 active sessions per user) and session management UI.',
        cvss: 0,
        cwe: 'CWE-613'
      });

    } catch (error) {
      console.log(`      Concurrent session test error: ${error.message}`);
    }

    return findings;
  }

  async testLogoutInvalidation() {
    const findings = [];
    console.log('    → Testing session invalidation on logout...');

    try {
      // Get a session
      let sessionCookie = null;
      const initialResponse = await this.axiosInstance.get(this.config.target);
      const cookies = this.parseCookies(initialResponse.headers['set-cookie']);
      sessionCookie = cookies.find(c => c.name.toLowerCase().includes('session'));

      if (!sessionCookie) {
        console.log('      No session cookie to test');
        return findings;
      }

      // Attempt to call logout
      const logoutResponse = await this.axiosInstance.post(
        `${this.config.target}/api/auth/signout`,
        {},
        { headers: { 'Cookie': `${sessionCookie.name}=${sessionCookie.value}` } }
      );

      // Try to use the old session after logout
      const afterLogoutResponse = await this.axiosInstance.get(
        `${this.config.target}/api/auth/session`,
        { headers: { 'Cookie': `${sessionCookie.name}=${sessionCookie.value}` } }
      );

      // If session is still valid after logout
      if (afterLogoutResponse.status === 200 && 
          afterLogoutResponse.data && 
          afterLogoutResponse.data.user) {
        findings.push({
          severity: 'HIGH',
          category: 'Session Management',
          title: 'Session Not Invalidated on Logout',
          description: 'The session token remains valid after user logs out.',
          remediation: 'Invalidate session on server-side upon logout. Clear session from database.',
          cvss: 6.5,
          cwe: 'CWE-613'
        });
      }

    } catch (error) {
      console.log(`      Logout invalidation test error: ${error.message}`);
    }

    return findings;
  }

  async testCSRFProtection() {
    const findings = [];
    console.log('    → Testing CSRF protection...');

    try {
      // Get initial page to check for CSRF tokens
      const response = await this.axiosInstance.get(this.config.target);
      const body = response.data;

      // Check for CSRF token in HTML
      const csrfPatterns = [
        /csrf[_-]?token/i,
        /_token/i,
        /authenticity[_-]?token/i,
        /x-csrf-token/i
      ];

      const hasCSRFToken = csrfPatterns.some(pattern => 
        pattern.test(JSON.stringify(response.headers)) || 
        (typeof body === 'string' && pattern.test(body))
      );

      if (!hasCSRFToken) {
        findings.push({
          severity: 'MEDIUM',
          category: 'Session Management',
          title: 'No CSRF Token Detected',
          description: 'No CSRF token found in response headers or HTML forms.',
          remediation: 'Implement CSRF tokens for all state-changing operations.',
          cvss: 5.4,
          cwe: 'CWE-352'
        });
      }

      // Test state-changing endpoints without CSRF token
      const stateChangingEndpoints = [
        { method: 'POST', path: '/api/reclamations', body: { titre: 'Test' } },
        { method: 'DELETE', path: '/api/user/notifications/1', body: {} },
        { method: 'PUT', path: '/api/user/profile', body: { nom: 'Test' } }
      ];

      for (const endpoint of stateChangingEndpoints) {
        try {
          let testResponse;
          if (endpoint.method === 'POST') {
            testResponse = await this.axiosInstance.post(
              `${this.config.target}${endpoint.path}`,
              endpoint.body,
              { headers: { 'Content-Type': 'application/json', 'Origin': 'https://evil.com' } }
            );
          } else if (endpoint.method === 'DELETE') {
            testResponse = await this.axiosInstance.delete(
              `${this.config.target}${endpoint.path}`,
              { headers: { 'Origin': 'https://evil.com' } }
            );
          } else if (endpoint.method === 'PUT') {
            testResponse = await this.axiosInstance.put(
              `${this.config.target}${endpoint.path}`,
              endpoint.body,
              { headers: { 'Content-Type': 'application/json', 'Origin': 'https://evil.com' } }
            );
          }

          // If request succeeds without CSRF token from different origin
          if (testResponse.status === 200 || testResponse.status === 201) {
            findings.push({
              severity: 'HIGH',
              category: 'Session Management',
              title: `CSRF Vulnerable Endpoint: ${endpoint.method} ${endpoint.path}`,
              description: `Endpoint accepts ${endpoint.method} request from different origin without CSRF validation.`,
              remediation: 'Validate CSRF tokens and Origin header for all state-changing requests.',
              cvss: 6.5,
              cwe: 'CWE-352'
            });
          }
        } catch (e) { /* continue */ }
      }

    } catch (error) {
      console.log(`      CSRF test error: ${error.message}`);
    }

    return findings;
  }

  async testTokenRefresh() {
    const findings = [];
    console.log('    → Testing token refresh security...');

    try {
      // Check for token refresh endpoint
      const refreshEndpoints = [
        '/api/auth/refresh',
        '/api/auth/token/refresh',
        '/api/auth/mobile/refresh'
      ];

      for (const endpoint of refreshEndpoints) {
        const response = await this.axiosInstance.post(
          `${this.config.target}${endpoint}`,
          { refreshToken: 'invalid_token_test' },
          { headers: { 'Content-Type': 'application/json' } }
        );

        if (response.status !== 404) {
          console.log(`      Found refresh endpoint: ${endpoint}`);

          // Test if old refresh tokens are invalidated after use
          // This would require valid tokens, so we note it as a check item

          // Test for refresh token rotation
          if (response.data && response.data.accessToken && !response.data.refreshToken) {
            findings.push({
              severity: 'MEDIUM',
              category: 'Session Management',
              title: 'No Refresh Token Rotation',
              description: `Endpoint ${endpoint} does not rotate refresh tokens, making them vulnerable to theft.`,
              remediation: 'Implement refresh token rotation: issue new refresh token with each refresh.',
              cvss: 5.3,
              cwe: 'CWE-613'
            });
          }
        }
      }

    } catch (error) {
      console.log(`      Token refresh test error: ${error.message}`);
    }

    return findings;
  }

  async testSessionInURL() {
    const findings = [];
    console.log('    → Testing for session ID in URL...');

    try {
      const response = await this.axiosInstance.get(this.config.target, { maxRedirects: 5 });
      const url = response.request?.path || response.config?.url || '';

      // Check for session ID in URL
      const sessionPatterns = [
        /[?&]session[_-]?id=/i,
        /[?&]sid=/i,
        /[?&]token=/i,
        /[?&]jsessionid=/i,
        /[?&]phpsessid=/i,
        /;jsessionid=/i
      ];

      for (const pattern of sessionPatterns) {
        if (pattern.test(url)) {
          findings.push({
            severity: 'HIGH',
            category: 'Session Management',
            title: 'Session ID Exposed in URL',
            description: 'Session identifier found in URL, visible in browser history, logs, and referrer headers.',
            remediation: 'Never pass session IDs in URLs. Use cookies only.',
            cvss: 7.5,
            cwe: 'CWE-598'
          });
          break;
        }
      }

    } catch (error) {
      console.log(`      Session in URL test error: ${error.message}`);
    }

    return findings;
  }

  // Utility function to parse cookies
  parseCookies(setCookieHeaders) {
    if (!setCookieHeaders) return [];
    
    const cookies = Array.isArray(setCookieHeaders) ? setCookieHeaders : [setCookieHeaders];
    
    return cookies.map(cookieStr => {
      const parts = cookieStr.split(';').map(p => p.trim());
      const [nameValue, ...attributes] = parts;
      const [name, value] = nameValue.split('=');
      
      const cookie = {
        name,
        value: value || '',
        secure: false,
        httpOnly: false,
        sameSite: null,
        maxAge: null,
        expires: null,
        path: '/',
        domain: null
      };

      for (const attr of attributes) {
        const [attrName, attrValue] = attr.split('=').map(s => s.trim());
        const lowerAttr = attrName.toLowerCase();
        
        if (lowerAttr === 'secure') cookie.secure = true;
        else if (lowerAttr === 'httponly') cookie.httpOnly = true;
        else if (lowerAttr === 'samesite') cookie.sameSite = attrValue;
        else if (lowerAttr === 'max-age') cookie.maxAge = parseInt(attrValue);
        else if (lowerAttr === 'expires') cookie.expires = new Date(attrValue);
        else if (lowerAttr === 'path') cookie.path = attrValue;
        else if (lowerAttr === 'domain') cookie.domain = attrValue;
      }
      
      return cookie;
    });
  }
}
