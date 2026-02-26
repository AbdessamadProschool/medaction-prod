/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                    MODULE 11 - BUSINESS LOGIC TESTS                          ║
 * ║                         AGGRESSIVE SECURITY AUDIT                            ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 * 
 * Tests business logic vulnerabilities specific to MedAction:
 * - Privilege Escalation
 * - IDOR (Insecure Direct Object Reference)
 * - Rate Limiting Bypass
 * - Workflow Bypass
 * - Price/Value Manipulation
 * - Race Conditions
 * - Mass Assignment
 * - Data Validation Bypass
 */

import axios from 'axios';
import https from 'https';

export class BusinessLogicModule {
  constructor(config) {
    this.config = config;
    this.findings = [];
    this.axiosInstance = axios.create({ 
      timeout: 15000, 
      validateStatus: () => true,
      httpsAgent: new https.Agent({ rejectUnauthorized: false })
    });
  }

  async testLogicFlaws() {
    console.log('\n  ╔══════════════════════════════════════════════════════════════╗');
    console.log('  ║           [11] BUSINESS LOGIC VULNERABILITY TESTS            ║');
    console.log('  ╚══════════════════════════════════════════════════════════════╝\n');

    const allFindings = [];

    try {
      // 1. IDOR Tests
      const idorFindings = await this.testIDOR();
      allFindings.push(...idorFindings);

      // 2. Privilege Escalation
      const privEscFindings = await this.testPrivilegeEscalation();
      allFindings.push(...privEscFindings);

      // 3. Mass Assignment
      const massAssignFindings = await this.testMassAssignment();
      allFindings.push(...massAssignFindings);

      // 4. Workflow Bypass
      const workflowFindings = await this.testWorkflowBypass();
      allFindings.push(...workflowFindings);

      // 5. Rate Limiting
      const rateLimitFindings = await this.testRateLimiting();
      allFindings.push(...rateLimitFindings);

      // 6. Race Conditions
      const raceFindings = await this.testRaceConditions();
      allFindings.push(...raceFindings);

      // 7. Numeric Manipulation
      const numericFindings = await this.testNumericManipulation();
      allFindings.push(...numericFindings);

      // 8. File Upload Logic
      const uploadFindings = await this.testFileUploadLogic();
      allFindings.push(...uploadFindings);

      // 9. Enumeration
      const enumFindings = await this.testEnumeration();
      allFindings.push(...enumFindings);

      // 10. MedAction-specific tests
      const medactionFindings = await this.testMedActionSpecific();
      allFindings.push(...medactionFindings);

      console.log(`    ✓ Business logic tests completed: ${allFindings.length} findings`);

    } catch (error) {
      console.log(`    ✗ Business logic test error: ${error.message}`);
    }

    return { findings: allFindings };
  }

  async testIDOR() {
    const findings = [];
    console.log('    → Testing IDOR vulnerabilities...');

    const idorEndpoints = [
      // User data endpoints
      { path: '/api/users/{id}', type: 'user', ids: [1, 2, 3, 999] },
      { path: '/api/user/{id}/profile', type: 'user', ids: [1, 2, 3] },
      
      // Reclamations
      { path: '/api/reclamations/{id}', type: 'reclamation', ids: [1, 2, 3, 10, 100] },
      { path: '/mes-reclamations/{id}', type: 'page', ids: [1, 2, 3] },
      
      // Etablissements
      { path: '/api/etablissements/{id}', type: 'etablissement', ids: [1, 2, 3, 185] },
      
      // Evaluations
      { path: '/api/evaluations/{id}', type: 'evaluation', ids: [1, 2, 3] },
      
      // Notifications (sensitive)
      { path: '/api/notifications/{id}', type: 'notification', ids: [1, 2, 3, 100] },
      { path: '/api/user/{id}/notifications', type: 'user_notifications', ids: [1, 2, 3] },
      
      // Documents/Files
      { path: '/api/documents/{id}', type: 'document', ids: [1, 2, 3] },
      { path: '/api/media/{id}', type: 'media', ids: [1, 2, 3, 50] },
      
      // Admin endpoints
      { path: '/api/admin/users/{id}', type: 'admin', ids: [1, 2, 3] },
      { path: '/api/audit/{id}', type: 'audit', ids: [1, 2, 3] }
    ];

    for (const endpoint of idorEndpoints) {
      for (const id of endpoint.ids) {
        const url = `${this.config.target}${endpoint.path.replace('{id}', id)}`;
        
        try {
          const response = await this.axiosInstance.get(url);
          
          // If we can access other users' data without auth
          if (response.status === 200 && response.data) {
            const data = response.data;
            
            // Check if it's returning sensitive data
            if (endpoint.type === 'user' || endpoint.type === 'admin') {
              if (data.email || data.motDePasse || data.telephone) {
                findings.push({
                  severity: 'CRITICAL',
                  category: 'Business Logic',
                  title: `IDOR - User Data Exposure: ${endpoint.path}`,
                  description: `Endpoint ${url} exposes user data without proper authorization. Found: ${Object.keys(data).join(', ')}`,
                  remediation: 'Implement authorization checks to ensure users can only access their own data.',
                  cvss: 8.6,
                  cwe: 'CWE-639'
                });
              }
            }
            
            // Check notification access
            if (endpoint.type === 'notification' || endpoint.type === 'user_notifications') {
              findings.push({
                severity: 'HIGH',
                category: 'Business Logic',
                title: `IDOR - Notification Access: ${endpoint.path}`,
                description: `Endpoint ${url} allows access to other users' notifications.`,
                remediation: 'Verify user ownership before returning notifications.',
                cvss: 6.5,
                cwe: 'CWE-639'
              });
            }
          }
        } catch (e) { /* continue */ }
      }
    }

    // Test horizontal IDOR with ID manipulation
    const sequentialIds = [1, 2, 3, 4, 5];
    for (const endpoint of ['/api/reclamations/', '/api/evaluations/']) {
      const accessibleIds = [];
      
      for (const id of sequentialIds) {
        try {
          const response = await this.axiosInstance.get(`${this.config.target}${endpoint}${id}`);
          if (response.status === 200) {
            accessibleIds.push(id);
          }
        } catch (e) { /* continue */ }
      }
      
      if (accessibleIds.length === sequentialIds.length) {
        findings.push({
          severity: 'HIGH',
          category: 'Business Logic',
          title: `Sequential ID Enumeration: ${endpoint}`,
          description: `All sequential IDs ${accessibleIds.join(', ')} are accessible, indicating predictable IDs and potential IDOR.`,
          remediation: 'Use UUIDs instead of sequential IDs, and always verify authorization.',
          cvss: 6.5,
          cwe: 'CWE-639'
        });
      }
    }

    return findings;
  }

  async testPrivilegeEscalation() {
    const findings = [];
    console.log('    → Testing privilege escalation...');

    // Test role manipulation in registration
    const roleEscalationPayloads = [
      { email: `test${Date.now()}@test.com`, password: 'Test123!', role: 'SUPER_ADMIN' },
      { email: `test${Date.now()}@test.com`, password: 'Test123!', role: 'ADMIN' },
      { email: `test${Date.now()}@test.com`, password: 'Test123!', isAdmin: true },
      { email: `test${Date.now()}@test.com`, password: 'Test123!', permissions: ['*'] }
    ];

    for (const payload of roleEscalationPayloads) {
      try {
        const response = await this.axiosInstance.post(
          `${this.config.target}/api/auth/register`,
          payload,
          { headers: { 'Content-Type': 'application/json' } }
        );

        if (response.status === 200 || response.status === 201) {
          const userData = response.data;
          if (userData.role === 'SUPER_ADMIN' || userData.role === 'ADMIN' || userData.isAdmin) {
            findings.push({
              severity: 'CRITICAL',
              category: 'Business Logic',
              title: 'Privilege Escalation via Registration',
              description: `User registration accepts role parameter: ${JSON.stringify(payload)}`,
              remediation: 'Never accept role/permission parameters from client. Set defaults server-side.',
              cvss: 9.8,
              cwe: 'CWE-269'
            });
            break;
          }
        }
      } catch (e) { /* continue */ }
    }

    // Test role change in profile update
    const profileUpdatePayloads = [
      { role: 'SUPER_ADMIN' },
      { role: 'ADMIN' },
      { isAdmin: true },
      { permissions: ['admin:*'] }
    ];

    for (const payload of profileUpdatePayloads) {
      try {
        const response = await this.axiosInstance.put(
          `${this.config.target}/api/user/profile`,
          payload,
          { headers: { 'Content-Type': 'application/json' } }
        );

        // If the update is accepted (even without valid session)
        if (response.status === 200 && response.data) {
          findings.push({
            severity: 'CRITICAL',
            category: 'Business Logic',
            title: 'Privilege Escalation via Profile Update',
            description: `Profile update endpoint accepts privilege-related fields: ${JSON.stringify(payload)}`,
            remediation: 'Filter out sensitive fields (role, permissions) from user-controllable input.',
            cvss: 9.8,
            cwe: 'CWE-269'
          });
          break;
        }
      } catch (e) { /* continue */ }
    }

    // Test admin endpoint access
    const adminEndpoints = [
      '/api/admin/users',
      '/api/admin/settings',
      '/api/super-admin',
      '/super-admin',
      '/admin',
      '/api/admin/backups',
      '/api/admin/audit',
      '/gouverneur',
      '/delegation'
    ];

    for (const endpoint of adminEndpoints) {
      try {
        const response = await this.axiosInstance.get(`${this.config.target}${endpoint}`);
        
        if (response.status === 200 && !response.data?.error) {
          // Check if it's returning actual admin data
          const isRealData = response.data && (
            Array.isArray(response.data) ||
            response.data.users ||
            response.data.settings ||
            typeof response.data === 'object'
          );

          if (isRealData) {
            findings.push({
              severity: 'CRITICAL',
              category: 'Business Logic',
              title: `Unauthenticated Admin Access: ${endpoint}`,
              description: `Admin endpoint ${endpoint} accessible without authentication.`,
              remediation: 'Implement proper authentication and authorization for all admin endpoints.',
              cvss: 9.1,
              cwe: 'CWE-306'
            });
          }
        }
      } catch (e) { /* continue */ }
    }

    return findings;
  }

  async testMassAssignment() {
    const findings = [];
    console.log('    → Testing mass assignment vulnerabilities...');

    // Test user creation with extra fields
    const massAssignmentPayloads = [
      {
        email: `mass${Date.now()}@test.com`,
        password: 'Test123!',
        nom: 'Test',
        prenom: 'User',
        // Malicious fields
        id: 1,
        createdAt: '2020-01-01',
        isActive: true,
        isEmailVerifie: true,
        isSuperAdmin: true,
        balance: 999999,
        credits: 999999
      }
    ];

    for (const payload of massAssignmentPayloads) {
      try {
        const response = await this.axiosInstance.post(
          `${this.config.target}/api/auth/register`,
          payload,
          { headers: { 'Content-Type': 'application/json' } }
        );

        if (response.status === 200 || response.status === 201) {
          const user = response.data;
          
          // Check if any malicious field was accepted
          if (user.id === 1 || user.isEmailVerifie === true || user.balance || user.credits) {
            findings.push({
              severity: 'HIGH',
              category: 'Business Logic',
              title: 'Mass Assignment Vulnerability',
              description: `Registration accepts unauthorized fields: ${JSON.stringify(user)}`,
              remediation: 'Use allowlist for accepted fields. Never bind request body directly to model.',
              cvss: 7.5,
              cwe: 'CWE-915'
            });
          }
        }
      } catch (e) { /* continue */ }
    }

    // Test reclamation creation with manipulation
    const reclamationPayload = {
      titre: 'Test Reclamation',
      description: 'Test',
      // Trying to set status
      statut: 'RESOLU',
      priorite: 'CRITIQUE',
      userId: 1,
      assignedToId: 1,
      resolutionDate: new Date().toISOString()
    };

    try {
      const response = await this.axiosInstance.post(
        `${this.config.target}/api/reclamations`,
        reclamationPayload,
        { headers: { 'Content-Type': 'application/json' } }
      );

      if (response.status === 200 || response.status === 201) {
        const reclamation = response.data;
        if (reclamation.statut === 'RESOLU' || reclamation.priorite === 'CRITIQUE') {
          findings.push({
            severity: 'MEDIUM',
            category: 'Business Logic',
            title: 'Mass Assignment in Reclamation Creation',
            description: 'Reclamation creation accepts status/priority fields that should be set by admins.',
            remediation: 'Server should set initial status. User cannot set privileged fields.',
            cvss: 5.4,
            cwe: 'CWE-915'
          });
        }
      }
    } catch (e) { /* continue */ }

    return findings;
  }

  async testWorkflowBypass() {
    const findings = [];
    console.log('    → Testing workflow bypass...');

    // Test email verification bypass
    try {
      // Try to access protected endpoint without email verification
      const response = await this.axiosInstance.post(
        `${this.config.target}/api/reclamations`,
        { titre: 'Test', description: 'Test bypass' },
        { headers: { 'Content-Type': 'application/json' } }
      );

      // If unverified user can create reclamation
      if (response.status === 201) {
        findings.push({
          severity: 'MEDIUM',
          category: 'Business Logic',
          title: 'Email Verification Bypass',
          description: 'Users can perform actions without verifying their email.',
          remediation: 'Enforce email verification before allowing sensitive operations.',
          cvss: 4.3,
          cwe: 'CWE-287'
        });
      }
    } catch (e) { /* continue */ }

    // Test reclamation status manipulation
    const statusBypassPayloads = [
      { statut: 'RESOLU' },
      { statut: 'REJETE' },
      { statut: 'EN_COURS' }
    ];

    for (const payload of statusBypassPayloads) {
      try {
        const response = await this.axiosInstance.put(
          `${this.config.target}/api/reclamations/1`,
          payload,
          { headers: { 'Content-Type': 'application/json' } }
        );

        if (response.status === 200) {
          findings.push({
            severity: 'HIGH',
            category: 'Business Logic',
            title: 'Reclamation Status Manipulation',
            description: `Regular user can change reclamation status to ${payload.statut}.`,
            remediation: 'Only admins should be able to modify reclamation status.',
            cvss: 6.5,
            cwe: 'CWE-639'
          });
          break;
        }
      } catch (e) { /* continue */ }
    }

    // Test event registration after deadline
    const pastEvent = {
      dateDebut: new Date(Date.now() - 86400000).toISOString(), // Yesterday
      titre: 'Past Event Test'
    };

    try {
      const response = await this.axiosInstance.post(
        `${this.config.target}/api/evenements/1/register`,
        {},
        { headers: { 'Content-Type': 'application/json' } }
      );

      // Note: This would need context about event dates
    } catch (e) { /* continue */ }

    return findings;
  }

  async testRateLimiting() {
    const findings = [];
    console.log('    → Testing rate limiting...');

    const rateLimitEndpoints = [
      { path: '/api/auth/callback/credentials', method: 'POST', body: { email: 'test@test.com', password: 'wrong' } },
      { path: '/api/auth/forgot-password', method: 'POST', body: { email: 'test@test.com' } },
      { path: '/api/search', method: 'GET', body: null },
      { path: '/api/reclamations', method: 'GET', body: null }
    ];

    for (const endpoint of rateLimitEndpoints) {
      const requests = 50;
      let successCount = 0;
      let rateLimited = false;

      console.log(`      Testing ${endpoint.path} (${requests} requests)...`);

      const startTime = Date.now();

      for (let i = 0; i < requests; i++) {
        try {
          let response;
          if (endpoint.method === 'POST') {
            response = await this.axiosInstance.post(
              `${this.config.target}${endpoint.path}`,
              endpoint.body,
              { headers: { 'Content-Type': 'application/json' } }
            );
          } else {
            response = await this.axiosInstance.get(`${this.config.target}${endpoint.path}`);
          }

          if (response.status === 429) {
            rateLimited = true;
            console.log(`        Rate limited after ${i + 1} requests`);
            break;
          }

          if (response.status !== 429) {
            successCount++;
          }
        } catch (e) { 
          if (e.response?.status === 429) {
            rateLimited = true;
            break;
          }
        }
      }

      const duration = Date.now() - startTime;

      if (!rateLimited && successCount >= requests * 0.9) {
        const severity = endpoint.path.includes('auth') ? 'HIGH' : 'MEDIUM';
        findings.push({
          severity,
          category: 'Business Logic',
          title: `No Rate Limiting: ${endpoint.path}`,
          description: `Endpoint accepted ${successCount}/${requests} requests in ${duration}ms without rate limiting.`,
          remediation: 'Implement rate limiting (e.g., 5 login attempts per minute per IP).',
          cvss: endpoint.path.includes('auth') ? 7.5 : 5.3,
          cwe: 'CWE-307'
        });
      }
    }

    return findings;
  }

  async testRaceConditions() {
    const findings = [];
    console.log('    → Testing race conditions...');

    // Test concurrent operations
    const concurrentEndpoints = [
      '/api/user/notifications/markAllRead',
      '/api/evaluations'
    ];

    for (const endpoint of concurrentEndpoints) {
      try {
        // Send 10 concurrent requests
        const promises = [];
        for (let i = 0; i < 10; i++) {
          promises.push(
            this.axiosInstance.post(
              `${this.config.target}${endpoint}`,
              {},
              { headers: { 'Content-Type': 'application/json' } }
            )
          );
        }

        const responses = await Promise.allSettled(promises);
        const successCount = responses.filter(r => r.status === 'fulfilled' && r.value.status < 400).length;

        // If all succeed, there might be a race condition issue
        if (successCount === 10) {
          findings.push({
            severity: 'INFO',
            category: 'Business Logic',
            title: `Potential Race Condition: ${endpoint}`,
            description: 'Endpoint accepts concurrent requests. Verify proper locking mechanism.',
            remediation: 'Implement optimistic/pessimistic locking for critical operations.',
            cvss: 0,
            cwe: 'CWE-362'
          });
        }
      } catch (e) { /* continue */ }
    }

    return findings;
  }

  async testNumericManipulation() {
    const findings = [];
    console.log('    → Testing numeric/value manipulation...');

    // Test negative values
    const negativePayloads = [
      { path: '/api/evaluations', body: { note: -5 } },
      { path: '/api/evaluations', body: { note: 100 } },
      { path: '/api/etablissements', body: { capacite: -100 } }
    ];

    for (const test of negativePayloads) {
      try {
        const response = await this.axiosInstance.post(
          `${this.config.target}${test.path}`,
          test.body,
          { headers: { 'Content-Type': 'application/json' } }
        );

        if (response.status === 200 || response.status === 201) {
          findings.push({
            severity: 'MEDIUM',
            category: 'Business Logic',
            title: `Invalid Numeric Value Accepted: ${test.path}`,
            description: `Endpoint accepts invalid value: ${JSON.stringify(test.body)}`,
            remediation: 'Validate numeric ranges server-side.',
            cvss: 4.3,
            cwe: 'CWE-20'
          });
        }
      } catch (e) { /* continue */ }
    }

    // Test integer overflow
    const overflowPayloads = [
      { note: 2147483648 }, // Max int + 1
      { note: Number.MAX_SAFE_INTEGER + 1 },
      { id: 99999999999999999999 }
    ];

    for (const payload of overflowPayloads) {
      try {
        const response = await this.axiosInstance.post(
          `${this.config.target}/api/evaluations`,
          payload,
          { headers: { 'Content-Type': 'application/json' } }
        );

        // Check for unexpected behavior
      } catch (e) { /* continue */ }
    }

    return findings;
  }

  async testFileUploadLogic() {
    const findings = [];
    console.log('    → Testing file upload logic...');

    // This would need actual file upload tests
    // For now, check upload endpoint existence and configuration

    const uploadEndpoints = [
      '/api/upload',
      '/api/media/upload',
      '/api/reclamations/upload'
    ];

    for (const endpoint of uploadEndpoints) {
      try {
        // Test without file
        const response = await this.axiosInstance.post(
          `${this.config.target}${endpoint}`,
          {},
          { headers: { 'Content-Type': 'multipart/form-data' } }
        );

        if (response.status !== 404) {
          console.log(`      Found upload endpoint: ${endpoint}`);
          
          // Check for file type validation
          // This is informational - actual bypass would need file crafting
          findings.push({
            severity: 'INFO',
            category: 'Business Logic',
            title: `File Upload Endpoint Found: ${endpoint}`,
            description: 'Verify file type validation, size limits, and content scanning.',
            remediation: 'Implement strict file validation: type, size, content, and store outside webroot.',
            cvss: 0,
            cwe: 'CWE-434'
          });
        }
      } catch (e) { /* continue */ }
    }

    return findings;
  }

  async testEnumeration() {
    const findings = [];
    console.log('    → Testing user/resource enumeration...');

    // Test user enumeration via login
    const users = [
      { email: 'admin@medaction.ma', exists: null },
      { email: 'superadmin@medaction.ma', exists: null },
      { email: 'nonexistent999@example.com', exists: null }
    ];

    for (const user of users) {
      try {
        const response = await this.axiosInstance.post(
          `${this.config.target}/api/auth/callback/credentials`,
          { email: user.email, password: 'wrongpassword' },
          { headers: { 'Content-Type': 'application/json' } }
        );

        user.response = response.data?.error || response.statusText;
        user.status = response.status;
      } catch (e) {
        user.response = e.message;
      }
    }

    // Check if responses differ (indicating user enumeration)
    const responses = users.map(u => JSON.stringify({ status: u.status, response: u.response }));
    const uniqueResponses = [...new Set(responses)];

    if (uniqueResponses.length > 1) {
      findings.push({
        severity: 'MEDIUM',
        category: 'Business Logic',
        title: 'User Enumeration via Login',
        description: 'Different error responses for existing vs non-existing users enable enumeration.',
        remediation: 'Use generic error message: "Invalid email or password" for all cases.',
        cvss: 5.3,
        cwe: 'CWE-204'
      });
    }

    // Test user enumeration via password reset
    for (const user of users) {
      try {
        const response = await this.axiosInstance.post(
          `${this.config.target}/api/auth/forgot-password`,
          { email: user.email },
          { headers: { 'Content-Type': 'application/json' } }
        );

        user.resetResponse = response.data?.message || response.statusText;
        user.resetStatus = response.status;
      } catch (e) {
        user.resetResponse = e.message;
      }
    }

    const resetResponses = users.map(u => JSON.stringify({ status: u.resetStatus, response: u.resetResponse }));
    const uniqueResetResponses = [...new Set(resetResponses)];

    if (uniqueResetResponses.length > 1) {
      findings.push({
        severity: 'MEDIUM',
        category: 'Business Logic',
        title: 'User Enumeration via Password Reset',
        description: 'Password reset reveals whether email exists in system.',
        remediation: 'Always return "If email exists, reset link sent" regardless of email existence.',
        cvss: 5.3,
        cwe: 'CWE-204'
      });
    }

    return findings;
  }

  async testMedActionSpecific() {
    const findings = [];
    console.log('    → Testing MedAction-specific business logic...');

    // Test: Can citizen see other users' reclamations?
    try {
      const response = await this.axiosInstance.get(`${this.config.target}/api/reclamations?all=true`);
      if (response.status === 200 && Array.isArray(response.data) && response.data.length > 0) {
        const hasOtherUsers = response.data.some(r => r.userId && r.userId !== 'current');
        if (hasOtherUsers) {
          findings.push({
            severity: 'HIGH',
            category: 'Business Logic',
            title: 'Cross-User Reclamation Access',
            description: 'API returns reclamations from other users.',
            remediation: 'Filter reclamations by authenticated user ID.',
            cvss: 6.5,
            cwe: 'CWE-639'
          });
        }
      }
    } catch (e) { /* continue */ }

    // Test: Can user modify etablissement data?
    try {
      const response = await this.axiosInstance.put(
        `${this.config.target}/api/etablissements/1`,
        { nom: 'Hacked Etablissement' },
        { headers: { 'Content-Type': 'application/json' } }
      );

      if (response.status === 200) {
        findings.push({
          severity: 'CRITICAL',
          category: 'Business Logic',
          title: 'Unauthorized Etablissement Modification',
          description: 'Regular user can modify etablissement data.',
          remediation: 'Only admins should be able to modify etablissements.',
          cvss: 8.1,
          cwe: 'CWE-639'
        });
      }
    } catch (e) { /* continue */ }

    // Test: Can user create events for any etablissement?
    try {
      const response = await this.axiosInstance.post(
        `${this.config.target}/api/evenements`,
        {
          titre: 'Fake Event',
          etablissementId: 1,
          dateDebut: new Date().toISOString()
        },
        { headers: { 'Content-Type': 'application/json' } }
      );

      if (response.status === 201) {
        findings.push({
          severity: 'HIGH',
          category: 'Business Logic',
          title: 'Unauthorized Event Creation',
          description: 'User can create events for any etablissement.',
          remediation: 'Verify user has permission for the specified etablissement.',
          cvss: 6.5,
          cwe: 'CWE-639'
        });
      }
    } catch (e) { /* continue */ }

    // Test: License bypass
    try {
      const response = await this.axiosInstance.get(`${this.config.target}/api/license/status`);
      if (response.data && response.data.valid === false) {
        // Try to access protected features anyway
        const protectedResponse = await this.axiosInstance.get(`${this.config.target}/dashboard`);
        if (protectedResponse.status === 200) {
          findings.push({
            severity: 'MEDIUM',
            category: 'Business Logic',
            title: 'License Enforcement Bypass',
            description: 'Application accessible despite invalid license.',
            remediation: 'Enforce license validation on all protected routes.',
            cvss: 5.3,
            cwe: 'CWE-284'
          });
        }
      }
    } catch (e) { /* continue */ }

    return findings;
  }
}
