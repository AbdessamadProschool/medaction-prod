/**
 * ═══════════════════════════════════════════════════════════════════
 * API SECURITY TESTING MODULE - MÉDIOUNA ACTION
 * Compliance: OWASP API Security Top 10 2023
 * ═══════════════════════════════════════════════════════════════════
 */

import axios from 'axios';
import crypto from 'crypto';

export class APISecurityModule {
  constructor(config) {
    this.config = config;
    this.findings = [];
    this.tokens = {};
    this.axiosInstance = axios.create({
      timeout: config.timeout || 30000,
      maxRedirects: 5,
      validateStatus: () => true,
      headers: {
        'User-Agent': 'MedAction-Security-Audit/2.0',
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
  }

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
      console.warn(`  ⚠️ Impossible d'obtenir le token pour ${role}`);
    }
    return null;
  }

  // ═══════════════════════════════════════════════════════════════════
  // API1:2023 – BROKEN OBJECT LEVEL AUTHORIZATION (BOLA)
  // ═══════════════════════════════════════════════════════════════════

  async brokenObjectAuth() {
    console.log('  [API1] Testing Broken Object Level Authorization...');
    const findings = [];
    
    const citoyenToken = await this.getToken('citoyen');
    if (!citoyenToken) return { findings };
    
    // Test 1: Accès aux réclamations d'autres utilisateurs
    for (let id = 1; id <= 20; id++) {
      try {
        const response = await this.axiosInstance.get(
          `${this.config.apiBaseUrl}/reclamations/${id}`,
          {
            headers: { Authorization: `Bearer ${citoyenToken}` },
          }
        );
        
        if (response.status === 200 && response.data) {
          const currentUserEmail = this.config.credentials.citoyen.email;
          const reclamationOwner = response.data.user?.email || response.data.citoyen?.email;
          
          if (reclamationOwner && reclamationOwner !== currentUserEmail) {
            findings.push({
              severity: 'CRITICAL',
              category: 'BOLA - Broken Object Level Authorization',
              title: `Accès non autorisé à la réclamation #${id}`,
              description: `L'utilisateur peut accéder aux réclamations d'autres utilisateurs`,
              endpoint: `/reclamations/${id}`,
              method: 'GET',
              resourceId: id,
              actualOwner: reclamationOwner,
              currentUser: currentUserEmail,
              response: { status: response.status, dataReturned: true },
              remediation: 'Vérifier la propriété de la ressource avant de la retourner',
              cvss: 9.1,
              cwe: 'CWE-639',
              owasp: 'API1:2023',
            });
            break;
          }
        }
      } catch (error) {
        // Continue
      }
    }
    
    // Test 2: Modification des ressources d'autres utilisateurs
    for (let id = 1; id <= 10; id++) {
      try {
        const response = await this.axiosInstance.patch(
          `${this.config.apiBaseUrl}/reclamations/${id}`,
          {
            titre: 'Modifié par attaquant',
            description: 'BOLA Test - Cette modification ne devrait pas être autorisée',
          },
          {
            headers: { Authorization: `Bearer ${citoyenToken}` },
          }
        );
        
        if (response.status === 200) {
          findings.push({
            severity: 'CRITICAL',
            category: 'BOLA - Object Modification',
            title: `Modification non autorisée de la réclamation #${id}`,
            description: 'L\'utilisateur peut modifier des ressources appartenant à d\'autres',
            endpoint: `/reclamations/${id}`,
            method: 'PATCH',
            resourceId: id,
            response: { status: response.status },
            remediation: 'Vérifier la propriété avant d\'autoriser les modifications',
            cvss: 9.8,
            cwe: 'CWE-639',
            owasp: 'API1:2023',
          });
          break;
        }
      } catch (error) {
        // Continue
      }
    }
    
    // Test 3: Suppression des ressources d'autres utilisateurs
    for (let id = 100; id <= 105; id++) {
      try {
        const response = await this.axiosInstance.delete(
          `${this.config.apiBaseUrl}/reclamations/${id}`,
          {
            headers: { Authorization: `Bearer ${citoyenToken}` },
          }
        );
        
        if (response.status === 200 || response.status === 204) {
          findings.push({
            severity: 'CRITICAL',
            category: 'BOLA - Object Deletion',
            title: `Suppression non autorisée de la réclamation #${id}`,
            description: 'L\'utilisateur peut supprimer des ressources appartenant à d\'autres',
            endpoint: `/reclamations/${id}`,
            method: 'DELETE',
            resourceId: id,
            response: { status: response.status },
            remediation: 'Vérifier la propriété avant d\'autoriser la suppression',
            cvss: 9.8,
            cwe: 'CWE-639',
            owasp: 'API1:2023',
          });
          break;
        }
      } catch (error) {
        // Continue
      }
    }
    
    // Test 4: Accès aux profils d'autres utilisateurs
    for (let id = 1; id <= 10; id++) {
      try {
        const response = await this.axiosInstance.get(
          `${this.config.apiBaseUrl}/users/${id}`,
          {
            headers: { Authorization: `Bearer ${citoyenToken}` },
          }
        );
        
        if (response.status === 200 && response.data) {
          if (response.data.email !== this.config.credentials.citoyen.email) {
            findings.push({
              severity: 'HIGH',
              category: 'BOLA - User Profile Access',
              title: `Accès au profil utilisateur #${id}`,
              description: 'L\'utilisateur peut accéder aux profils d\'autres utilisateurs',
              endpoint: `/users/${id}`,
              method: 'GET',
              resourceId: id,
              dataExposed: Object.keys(response.data),
              response: { status: response.status },
              remediation: 'Restreindre l\'accès aux informations personnelles',
              cvss: 7.5,
              cwe: 'CWE-639',
              owasp: 'API1:2023',
            });
            break;
          }
        }
      } catch (error) {
        // Continue
      }
    }
    
    return { findings };
  }

  // ═══════════════════════════════════════════════════════════════════
  // API2:2023 – BROKEN AUTHENTICATION
  // ═══════════════════════════════════════════════════════════════════

  async brokenAuthentication() {
    console.log('  [API2] Testing Broken Authentication...');
    const findings = [];
    
    // Test 1: JWT expiré
    const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.4Adcj0MhtYR7bXYxG2TtfO4bNFh9Vj4HYmg7kOpB2B8';
    
    try {
      const response = await this.axiosInstance.get(
        `${this.config.apiBaseUrl}/users/me`,
        {
          headers: { Authorization: `Bearer ${expiredToken}` },
        }
      );
      
      if (response.status === 200) {
        findings.push({
          severity: 'HIGH',
          category: 'Broken Authentication',
          title: 'JWT expiré accepté',
          description: 'L\'API accepte les tokens JWT expirés',
          endpoint: '/users/me',
          method: 'GET',
          token: expiredToken.substring(0, 30) + '...',
          response: { status: response.status },
          remediation: 'Valider le champ exp du JWT',
          cvss: 8.1,
          cwe: 'CWE-287',
          owasp: 'API2:2023',
        });
      }
    } catch (error) {
      // Attendu
    }
    
    // Test 2: Credentials par défaut
    const defaultCreds = [
      { email: 'admin@admin.com', password: 'admin' },
      { email: 'admin@example.com', password: 'password' },
      { email: 'test@test.com', password: 'test123' },
      { email: 'admin@medaction.ma', password: 'admin123' },
      { email: 'superadmin@medaction.ma', password: 'password' },
    ];
    
    for (const cred of defaultCreds) {
      try {
        const response = await this.axiosInstance.post(
          `${this.config.apiBaseUrl}/auth/signin`,
          cred
        );
        
        if (response.status === 200 && (response.data.token || response.data.accessToken)) {
          findings.push({
            severity: 'CRITICAL',
            category: 'Default Credentials',
            title: `Credentials par défaut acceptés: ${cred.email}`,
            description: 'Le système a des comptes avec des mots de passe par défaut',
            endpoint: '/auth/signin',
            method: 'POST',
            credentials: { email: cred.email, password: '***' },
            response: { status: response.status, tokenReceived: true },
            remediation: 'Forcer le changement de mot de passe et supprimer les comptes par défaut',
            cvss: 9.8,
            cwe: 'CWE-798',
            owasp: 'API2:2023',
          });
        }
      } catch (error) {
        // Continue
      }
    }
    
    // Test 3: Tokens sans signature vérifiée
    const token = await this.getToken('citoyen');
    if (token) {
      const parts = token.split('.');
      if (parts.length === 3) {
        // Token avec signature modifiée
        const tamperedToken = `${parts[0]}.${parts[1]}.tampered_signature`;
        
        try {
          const response = await this.axiosInstance.get(
            `${this.config.apiBaseUrl}/users/me`,
            {
              headers: { Authorization: `Bearer ${tamperedToken}` },
            }
          );
          
          if (response.status === 200) {
            findings.push({
              severity: 'CRITICAL',
              category: 'JWT Signature Bypass',
              title: 'Signature JWT non vérifiée',
              description: 'L\'API accepte des tokens avec signature invalide',
              endpoint: '/users/me',
              method: 'GET',
              remediation: 'Toujours vérifier la signature JWT',
              cvss: 9.8,
              cwe: 'CWE-347',
              owasp: 'API2:2023',
            });
          }
        } catch (error) {
          // Attendu
        }
      }
    }
    
    return { findings };
  }

  // ═══════════════════════════════════════════════════════════════════
  // API3:2023 – BROKEN OBJECT PROPERTY LEVEL AUTHORIZATION
  // ═══════════════════════════════════════════════════════════════════

  async brokenPropertyAuth() {
    console.log('  [API3] Testing Broken Object Property Level Authorization...');
    const findings = [];
    
    const citoyenToken = await this.getToken('citoyen');
    if (!citoyenToken) return { findings };
    
    // Test 1: Mass Assignment - Escalade de privilèges
    try {
      const response = await this.axiosInstance.patch(
        `${this.config.apiBaseUrl}/users/me`,
        {
          nom: 'Test',
          prenom: 'User',
          role: 'SUPER_ADMIN',
          isEmailVerifie: true,
          isActive: true,
        },
        {
          headers: { Authorization: `Bearer ${citoyenToken}` },
        }
      );
      
      if (response.status === 200 && response.data) {
        if (response.data.role === 'SUPER_ADMIN' || response.data.role === 'ADMIN') {
          findings.push({
            severity: 'CRITICAL',
            category: 'Mass Assignment - Privilege Escalation',
            title: 'L\'utilisateur peut s\'attribuer le rôle ADMIN',
            description: 'L\'API permet de modifier des champs sensibles comme "role"',
            endpoint: '/users/me',
            method: 'PATCH',
            payload: { role: 'SUPER_ADMIN' },
            response: { status: response.status, newRole: response.data.role },
            remediation: 'Mettre en place une whitelist des champs modifiables',
            cvss: 9.9,
            cwe: 'CWE-915',
            owasp: 'API3:2023',
          });
        }
      }
    } catch (error) {
      // Continue
    }
    
    // Test 2: Excessive Data Exposure
    try {
      const response = await this.axiosInstance.get(
        `${this.config.apiBaseUrl}/users/me`,
        {
          headers: { Authorization: `Bearer ${citoyenToken}` },
        }
      );
      
      if (response.status === 200 && response.data) {
        const sensitiveFields = [
          'motDePasse', 'password', 'passwordHash', 'hash',
          'resetToken', 'resetPasswordToken', 
          'twoFactorSecret', 'otpSecret',
          'apiKey', 'secretKey',
        ];
        
        for (const field of sensitiveFields) {
          if (response.data[field] !== undefined) {
            findings.push({
              severity: 'HIGH',
              category: 'Excessive Data Exposure',
              title: `Champ sensible "${field}" exposé dans la réponse API`,
              description: 'L\'API retourne des données sensibles qui ne devraient jamais être exposées',
              endpoint: '/users/me',
              method: 'GET',
              exposedField: field,
              value: '***REDACTED***',
              remediation: 'Utiliser des DTOs pour contrôler les champs exposés',
              cvss: 7.5,
              cwe: 'CWE-213',
              owasp: 'API3:2023',
            });
          }
        }
      }
    } catch (error) {
      // Continue
    }
    
    // Test 3: Modification de champs en lecture seule
    try {
      const response = await this.axiosInstance.patch(
        `${this.config.apiBaseUrl}/reclamations/1`,
        {
          statut: 'ACCEPTEE',
          affectationReclamation: 'AFFECTEE',
          createdAt: '2020-01-01T00:00:00.000Z',
          updatedAt: '2020-01-01T00:00:00.000Z',
        },
        {
          headers: { Authorization: `Bearer ${citoyenToken}` },
        }
      );
      
      if (response.status === 200 && response.data) {
        if (response.data.statut === 'ACCEPTEE') {
          findings.push({
            severity: 'HIGH',
            category: 'Mass Assignment - Read-Only Fields',
            title: 'Modification de champs en lecture seule autorisée',
            description: 'L\'utilisateur peut modifier des champs qui devraient être en lecture seule',
            endpoint: '/reclamations/1',
            method: 'PATCH',
            payload: { statut: 'ACCEPTEE' },
            response: { status: response.status },
            remediation: 'Protéger les champs sensibles contre la modification',
            cvss: 8.0,
            cwe: 'CWE-915',
            owasp: 'API3:2023',
          });
        }
      }
    } catch (error) {
      // Continue
    }
    
    return { findings };
  }

  // ═══════════════════════════════════════════════════════════════════
  // API4:2023 – UNRESTRICTED RESOURCE CONSUMPTION
  // ═══════════════════════════════════════════════════════════════════

  async resourceConsumption() {
    console.log('  [API4] Testing Unrestricted Resource Consumption...');
    const findings = [];
    
    // Test 1: Pas de limite de pagination
    try {
      const response = await this.axiosInstance.get(
        `${this.config.apiBaseUrl}/etablissements`,
        {
          params: { limit: 999999, page: 1 },
        }
      );
      
      if (response.status === 200 && Array.isArray(response.data)) {
        if (response.data.length > 1000) {
          findings.push({
            severity: 'MEDIUM',
            category: 'Unrestricted Resource Consumption',
            title: 'Pas de limite de pagination',
            description: `L'API a retourné ${response.data.length} enregistrements sans limite`,
            endpoint: '/etablissements',
            method: 'GET',
            recordsReturned: response.data.length,
            response: { status: response.status },
            remediation: 'Imposer une limite max de pagination (ex: 100 enregistrements)',
            cvss: 5.3,
            cwe: 'CWE-770',
            owasp: 'API4:2023',
          });
        }
      }
    } catch (error) {
      // Continue
    }
    
    // Test 2: Upload de fichiers volumineux
    try {
      const largePayload = 'A'.repeat(50 * 1024 * 1024); // 50MB
      
      const response = await this.axiosInstance.post(
        `${this.config.apiBaseUrl}/upload`,
        { data: largePayload },
        { timeout: 60000 }
      );
      
      if (response.status === 200 || response.status === 201) {
        findings.push({
          severity: 'HIGH',
          category: 'Large Payload Attack',
          title: 'L\'API accepte des payloads très volumineux',
          description: 'Upload de 50MB payload réussi',
          endpoint: '/upload',
          method: 'POST',
          payloadSize: '50MB',
          response: { status: response.status },
          remediation: 'Implémenter des limites sur la taille des requêtes',
          cvss: 6.5,
          cwe: 'CWE-770',
          owasp: 'API4:2023',
        });
      }
    } catch (error) {
      // Attendu - bonne sécurité
    }
    
    // Test 3: Requêtes longues (DoS)
    try {
      const startTime = Date.now();
      
      await this.axiosInstance.get(
        `${this.config.apiBaseUrl}/etablissements`,
        {
          params: {
            search: 'a'.repeat(10000), // Très longue recherche
          },
          timeout: 60000,
        }
      );
      
      const duration = Date.now() - startTime;
      
      if (duration > 10000) {
        findings.push({
          severity: 'MEDIUM',
          category: 'Long-Running Queries',
          title: 'L\'API autorise des requêtes très longues',
          description: `La requête a pris ${duration}ms`,
          endpoint: '/etablissements',
          method: 'GET',
          duration: `${duration}ms`,
          remediation: 'Implémenter des timeouts sur les requêtes (ex: 5 secondes)',
          cvss: 5.3,
          cwe: 'CWE-400',
          owasp: 'API4:2023',
        });
      }
    } catch (error) {
      // Continue
    }
    
    return { findings };
  }

  // ═══════════════════════════════════════════════════════════════════
  // API5:2023 – BROKEN FUNCTION LEVEL AUTHORIZATION
  // ═══════════════════════════════════════════════════════════════════

  async brokenFunctionAuth() {
    console.log('  [API5] Testing Broken Function Level Authorization...');
    const findings = [];
    
    const citoyenToken = await this.getToken('citoyen');
    if (!citoyenToken) return { findings };
    
    // Fonctions admin que CITOYEN ne devrait PAS pouvoir exécuter
    const adminFunctions = [
      { endpoint: '/api/reclamations/1/decision', method: 'PATCH', data: { decision: 'ACCEPTEE', motif: 'Test' } },
      { endpoint: '/api/reclamations/1/affecter', method: 'POST', data: { autoriteId: 1 } },
      { endpoint: '/api/evenements/1/valider', method: 'PATCH', data: { decision: 'PUBLIEE' } },
      { endpoint: '/api/users', method: 'GET', data: null },
      { endpoint: '/api/users/1', method: 'DELETE', data: null },
      { endpoint: '/api/stats/global', method: 'GET', data: null },
      { endpoint: '/api/system/settings', method: 'GET', data: null },
      { endpoint: '/api/system/settings', method: 'PATCH', data: { maintenance: true } },
      { endpoint: '/api/logs', method: 'GET', data: null },
      { endpoint: '/api/backup', method: 'POST', data: {} },
    ];
    
    for (const func of adminFunctions) {
      try {
        const config = {
          method: func.method.toLowerCase(),
          url: `${this.config.target}${func.endpoint}`,
          headers: { Authorization: `Bearer ${citoyenToken}` },
        };
        
        if (func.data) config.data = func.data;
        
        const response = await this.axiosInstance(config);
        
        if (response.status === 200 || response.status === 201) {
          findings.push({
            severity: 'CRITICAL',
            category: 'Broken Function Level Authorization',
            title: `CITOYEN peut exécuter la fonction admin: ${func.endpoint}`,
            description: 'L\'utilisateur à faible privilège peut exécuter des fonctions administratives',
            endpoint: func.endpoint,
            method: func.method,
            role: 'CITOYEN',
            expectedRole: 'ADMIN/GOUVERNEUR',
            response: { status: response.status },
            remediation: 'Implémenter des vérifications RBAC au niveau des fonctions',
            cvss: 9.8,
            cwe: 'CWE-269',
            owasp: 'API5:2023',
          });
        }
      } catch (error) {
        // Attendu - bonne sécurité
      }
    }
    
    return { findings };
  }

  // ═══════════════════════════════════════════════════════════════════
  // API6:2023 – UNRESTRICTED ACCESS TO SENSITIVE BUSINESS FLOWS
  // ═══════════════════════════════════════════════════════════════════

  async businessFlowAccess() {
    console.log('  [API6] Testing Business Flow Access...');
    const findings = [];
    
    const citoyenToken = await this.getToken('citoyen');
    if (!citoyenToken) return { findings };
    
    // Test 1: Opérations en masse sans rate limiting
    const bulkRequests = [];
    
    for (let i = 0; i < 50; i++) {
      bulkRequests.push(
        this.axiosInstance.post(
          `${this.config.apiBaseUrl}/evaluations`,
          {
            etablissementId: 1,
            noteGlobale: 5,
            commentaire: `Évaluation de test ${i}`,
          },
          {
            headers: { Authorization: `Bearer ${citoyenToken}` },
          }
        ).catch(() => ({ status: 0 }))
      );
    }
    
    const startTime = Date.now();
    const results = await Promise.all(bulkRequests);
    const endTime = Date.now();
    
    const successCount = results.filter(r => r.status === 201).length;
    
    if (successCount > 25) {
      findings.push({
        severity: 'HIGH',
        category: 'Bulk Operation Abuse',
        title: 'Pas de rate limiting sur création d\'évaluations',
        description: `${successCount} évaluations créées en ${endTime - startTime}ms`,
        endpoint: '/evaluations',
        method: 'POST',
        requestsSent: 50,
        successfulRequests: successCount,
        duration: `${endTime - startTime}ms`,
        remediation: 'Implémenter un rate limiting par utilisateur (ex: 10 évaluations/jour)',
        cvss: 6.5,
        cwe: 'CWE-799',
        owasp: 'API6:2023',
      });
    }
    
    // Test 2: Manipulation des votes - évaluations multiples
    try {
      const responses = await Promise.all([
        this.axiosInstance.post(
          `${this.config.apiBaseUrl}/evaluations`,
          { etablissementId: 1, noteGlobale: 5, commentaire: 'Vote 1' },
          { headers: { Authorization: `Bearer ${citoyenToken}` } }
        ),
        this.axiosInstance.post(
          `${this.config.apiBaseUrl}/evaluations`,
          { etablissementId: 1, noteGlobale: 5, commentaire: 'Vote 2' },
          { headers: { Authorization: `Bearer ${citoyenToken}` } }
        ),
      ]);
      
      if (responses.every(r => r.status === 201)) {
        findings.push({
          severity: 'HIGH',
          category: 'Vote Manipulation',
          title: 'L\'utilisateur peut évaluer le même établissement plusieurs fois',
          description: 'Pas de protection contre les évaluations en double',
          endpoint: '/evaluations',
          method: 'POST',
          etablissementId: 1,
          response: { bothRequestsSucceeded: true },
          remediation: 'Imposer une contrainte unique: une évaluation par utilisateur par établissement',
          cvss: 7.1,
          cwe: 'CWE-840',
          owasp: 'API6:2023',
        });
      }
    } catch (error) {
      // Continue
    }
    
    return { findings };
  }

  // ═══════════════════════════════════════════════════════════════════
  // API7:2023 – SERVER SIDE REQUEST FORGERY
  // ═══════════════════════════════════════════════════════════════════

  async ssrfAPI() {
    console.log('  [API7] Testing Server-Side Request Forgery...');
    const findings = [];
    
    const ssrfPayloads = [
      'http://169.254.169.254/latest/meta-data/',
      'http://localhost:5432',
      'http://127.0.0.1:6379',
      'file:///etc/passwd',
      'http://[::1]',
      'http://0.0.0.0:22',
    ];
    
    const ssrfEndpoints = [
      { endpoint: '/api/upload', field: 'url' },
      { endpoint: '/api/import', field: 'sourceUrl' },
      { endpoint: '/api/webhook', field: 'callbackUrl' },
    ];
    
    for (const { endpoint, field } of ssrfEndpoints) {
      for (const payload of ssrfPayloads) {
        try {
          const response = await this.axiosInstance.post(
            `${this.config.apiBaseUrl}${endpoint}`,
            { [field]: payload }
          );
          
          const responseText = JSON.stringify(response.data);
          const indicators = ['ami-id', 'postgres', 'root:', 'redis_version'];
          
          for (const indicator of indicators) {
            if (responseText.toLowerCase().includes(indicator.toLowerCase())) {
              findings.push({
                severity: 'CRITICAL',
                category: 'SSRF',
                title: `SSRF dans ${endpoint}`,
                description: `Le serveur a accédé à une ressource interne: ${payload}`,
                endpoint: endpoint,
                method: 'POST',
                field: field,
                payload: payload,
                response: { status: response.status, snippet: responseText.substring(0, 100) },
                remediation: 'Implémenter une whitelist d\'URLs et bloquer les IP privées',
                cvss: 9.9,
                cwe: 'CWE-918',
                owasp: 'API7:2023',
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
  // API8:2023 – SECURITY MISCONFIGURATION
  // ═══════════════════════════════════════════════════════════════════

  async apiMisconfig() {
    console.log('  [API8] Testing API Security Misconfiguration...');
    const findings = [];
    
    // Test 1: GraphQL introspection
    try {
      const response = await this.axiosInstance.post(
        `${this.config.apiBaseUrl}/graphql`,
        {
          query: `{ __schema { types { name } } }`,
        }
      );
      
      if (response.status === 200 && response.data?.__schema) {
        findings.push({
          severity: 'MEDIUM',
          category: 'GraphQL Introspection',
          title: 'Introspection GraphQL activée',
          description: 'Les attaquants peuvent découvrir tout le schéma API',
          endpoint: '/graphql',
          method: 'POST',
          response: { status: response.status, typesCount: response.data.__schema.types.length },
          remediation: 'Désactiver l\'introspection en production',
          cvss: 5.3,
          cwe: 'CWE-16',
          owasp: 'API8:2023',
        });
      }
    } catch (error) {
      // Continue
    }
    
    // Test 2: Endpoints de debug exposés
    const debugEndpoints = ['/api/debug', '/api/health', '/api/version', '/api/config', '/api/env', '/api/phpinfo'];
    
    for (const endpoint of debugEndpoints) {
      try {
        const response = await this.axiosInstance.get(`${this.config.apiBaseUrl}${endpoint}`);
        
        if (response.status === 200 && response.data) {
          const responseText = JSON.stringify(response.data);
          
          if (
            responseText.includes('DATABASE_URL') ||
            responseText.includes('JWT_SECRET') ||
            responseText.includes('API_KEY') ||
            responseText.includes('password')
          ) {
            findings.push({
              severity: 'CRITICAL',
              category: 'Debug Endpoint Exposed',
              title: `Endpoint debug ${endpoint} expose des secrets`,
              description: 'L\'endpoint révèle des informations de configuration sensibles',
              endpoint: endpoint,
              method: 'GET',
              response: { status: response.status, snippet: responseText.substring(0, 200) },
              remediation: 'Supprimer ou protéger les endpoints de debug en production',
              cvss: 9.1,
              cwe: 'CWE-215',
              owasp: 'API8:2023',
            });
          }
        }
      } catch (error) {
        // Continue
      }
    }
    
    return { findings };
  }

  // ═══════════════════════════════════════════════════════════════════
  // REST API FUZZING
  // ═══════════════════════════════════════════════════════════════════

  async apiFuzzing() {
    console.log('  Testing API Fuzzing...');
    const findings = [];
    
    const fuzzPayloads = [
      null, undefined, '', ' ', 'null', 'undefined', '{}', '[]',
      '<script>alert(1)</script>', '${7*7}', '{{7*7}}',
      '\x00', '%00', -1, 0, 999999999, 1.7976931348623157e+308,
      "'OR'1'='1", "'; DROP TABLE users;--",
      Array(10000).fill('A').join(''),
      { "__proto__": { "admin": true } },
    ];
    
    const endpoints = [
      { endpoint: '/api/etablissements', param: 'secteur' },
      { endpoint: '/api/reclamations', param: 'communeId' },
      { endpoint: '/api/users', param: 'role' },
    ];
    
    for (const { endpoint, param } of endpoints) {
      for (const payload of fuzzPayloads.slice(0, 10)) {
        try {
          const response = await this.axiosInstance.get(
            `${this.config.apiBaseUrl}${endpoint}`,
            { params: { [param]: payload } }
          );
          
          const responseText = JSON.stringify(response.data);
          
          if (
            response.status === 500 ||
            responseText.includes('Error:') ||
            responseText.includes('Exception') ||
            responseText.includes('stack')
          ) {
            findings.push({
              severity: 'MEDIUM',
              category: 'API Fuzzing - Error',
              title: `Payload a causé une erreur dans ${endpoint}`,
              description: `Payload: ${JSON.stringify(payload).substring(0, 50)}`,
              endpoint: endpoint,
              method: 'GET',
              param: param,
              payload: payload,
              response: { status: response.status, snippet: responseText.substring(0, 200) },
              remediation: 'Valider et sanitizer toutes les entrées',
              cvss: 5.0,
              cwe: 'CWE-20',
              owasp: 'API Fuzzing',
            });
            break;
          }
        } catch (error) {
          // Continue
        }
      }
    }
    
    return { findings };
  }

  // ═══════════════════════════════════════════════════════════════════
  // MASS ASSIGNMENT
  // ═══════════════════════════════════════════════════════════════════

  async massAssignment() {
    console.log('  Testing Mass Assignment...');
    const findings = [];
    
    const token = await this.getToken('citoyen');
    if (!token) return { findings };
    
    const massAssignmentPayloads = [
      { role: 'ADMIN' },
      { role: 'SUPER_ADMIN' },
      { isAdmin: true },
      { admin: true },
      { isEmailVerifie: true },
      { isActive: true },
      { permissions: ['*'] },
      { balance: 1000000 },
    ];
    
    for (const payload of massAssignmentPayloads) {
      try {
        const response = await this.axiosInstance.patch(
          `${this.config.apiBaseUrl}/users/me`,
          { nom: 'Test', ...payload },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        if (response.status === 200 && response.data) {
          for (const [key, value] of Object.entries(payload)) {
            if (response.data[key] === value) {
              findings.push({
                severity: 'CRITICAL',
                category: 'Mass Assignment',
                title: `Champ sensible "${key}" modifiable par l'utilisateur`,
                description: `L'utilisateur a pu modifier le champ "${key}" à "${value}"`,
                endpoint: '/users/me',
                method: 'PATCH',
                payload: payload,
                response: { status: response.status, modifiedField: key },
                remediation: 'Implémenter une whitelist des champs modifiables',
                cvss: 9.1,
                cwe: 'CWE-915',
                owasp: 'Mass Assignment',
              });
            }
          }
        }
      } catch (error) {
        // Continue
      }
    }
    
    return { findings };
  }

  // ═══════════════════════════════════════════════════════════════════
  // RATE LIMITING BYPASS
  // ═══════════════════════════════════════════════════════════════════

  async rateLimitBypass() {
    console.log('  Testing Rate Limiting Bypass...');
    const findings = [];
    
    // Techniques de bypass
    const bypassHeaders = [
      { 'X-Forwarded-For': '127.0.0.1' },
      { 'X-Real-IP': '127.0.0.1' },
      { 'X-Originating-IP': '127.0.0.1' },
      { 'X-Client-IP': '127.0.0.1' },
      { 'True-Client-IP': '127.0.0.1' },
      { 'X-Forwarded-Host': 'localhost' },
    ];
    
    for (const headers of bypassHeaders) {
      let successCount = 0;
      
      for (let i = 0; i < 20; i++) {
        try {
          const response = await this.axiosInstance.post(
            `${this.config.apiBaseUrl}/auth/signin`,
            { email: 'test@example.com', password: `wrong${i}` },
            { headers: { ...headers } }
          );
          
          if (response.status !== 429) {
            successCount++;
          }
        } catch (error) {
          // Continue
        }
      }
      
      if (successCount >= 18) {
        const headerName = Object.keys(headers)[0];
        findings.push({
          severity: 'HIGH',
          category: 'Rate Limiting Bypass',
          title: `Bypass rate limit via ${headerName}`,
          description: `L'en-tête ${headerName} permet de contourner le rate limiting`,
          endpoint: '/auth/signin',
          method: 'POST',
          bypassHeader: headers,
          requestsSent: 20,
          successfulRequests: successCount,
          remediation: 'Ne pas faire confiance aux en-têtes client pour l\'identification IP',
          cvss: 7.5,
          cwe: 'CWE-307',
          owasp: 'Rate Limiting Bypass',
        });
      }
    }
    
    return { findings };
  }
}
