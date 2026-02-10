/**
 * ═══════════════════════════════════════════════════════════════════
 * AUTHORIZATION & RBAC MODULE - MÉDIOUNA ACTION
 * Tests: Privilege Escalation, RBAC Bypass, Function Level Access
 * ═══════════════════════════════════════════════════════════════════
 */

import axios from 'axios';

export class AuthorizationModule {
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

  async verticalEscalation() {
    console.log('  Testing Vertical Privilege Escalation...');
    const findings = [];
    
    const citoyenToken = await this.getToken('citoyen');
    if (!citoyenToken) return { findings };
    
    // Endpoints admin que CITOYEN ne devrait pas atteindre
    const adminEndpoints = [
      { url: '/api/reclamations/1/decision', method: 'PATCH', data: { decision: 'ACCEPTEE' } },
      { url: '/api/reclamations/1/affecter', method: 'POST', data: { autoriteId: 1 } },
      { url: '/api/evenements/1/valider', method: 'PATCH', data: { decision: 'PUBLIEE' } },
      { url: '/api/users', method: 'GET', data: null },
      { url: '/api/users/1', method: 'DELETE', data: null },
      { url: '/api/stats/global', method: 'GET', data: null },
    ];
    
    for (const ep of adminEndpoints) {
      try {
        const config = {
          method: ep.method.toLowerCase(),
          url: `${this.config.target}${ep.url}`,
          headers: { Authorization: `Bearer ${citoyenToken}` },
        };
        if (ep.data) config.data = ep.data;
        
        const res = await this.axiosInstance(config);
        
        if (res.status === 200 || res.status === 201) {
          findings.push({
            severity: 'CRITICAL',
            category: 'Vertical Privilege Escalation',
            title: `CITOYEN accède à ${ep.url}`,
            description: 'Utilisateur à faible privilège exécute des fonctions admin',
            endpoint: ep.url,
            method: ep.method,
            role: 'CITOYEN',
            expectedRole: 'ADMIN',
            remediation: 'Implémenter des vérifications RBAC strictes',
            cvss: 9.8,
            cwe: 'CWE-269',
            owasp: 'Privilege Escalation',
          });
        }
      } catch (e) {}
    }
    
    return { findings };
  }

  async horizontalEscalation() {
    console.log('  Testing Horizontal Privilege Escalation...');
    const findings = [];
    
    const citoyenToken = await this.getToken('citoyen');
    if (!citoyenToken) return { findings };
    
    // Accéder aux ressources d'autres utilisateurs
    for (let id = 1; id <= 10; id++) {
      try {
        const res = await this.axiosInstance.get(
          `${this.config.apiBaseUrl}/reclamations/${id}`,
          { headers: { Authorization: `Bearer ${citoyenToken}` } }
        );
        
        if (res.status === 200 && res.data) {
          const owner = res.data.user?.email || res.data.citoyen?.email;
          if (owner && owner !== this.config.credentials.citoyen.email) {
            findings.push({
              severity: 'HIGH',
              category: 'Horizontal Privilege Escalation',
              title: `Accès réclamation #${id} d'un autre utilisateur`,
              description: 'Utilisateur peut accéder aux données d\'autres utilisateurs',
              endpoint: `/reclamations/${id}`,
              method: 'GET',
              actualOwner: owner,
              remediation: 'Vérifier la propriété des ressources',
              cvss: 7.5,
              cwe: 'CWE-639',
              owasp: 'IDOR',
            });
            break;
          }
        }
      } catch (e) {}
    }
    
    // Modifier les ressources d'autres utilisateurs
    for (let id = 1; id <= 5; id++) {
      try {
        const res = await this.axiosInstance.patch(
          `${this.config.apiBaseUrl}/reclamations/${id}`,
          { titre: 'Modifié par attaquant' },
          { headers: { Authorization: `Bearer ${citoyenToken}` } }
        );
        
        if (res.status === 200) {
          findings.push({
            severity: 'CRITICAL',
            category: 'Horizontal Privilege Escalation',
            title: `Modification réclamation #${id} d'un autre utilisateur`,
            description: 'Utilisateur peut modifier les données d\'autres utilisateurs',
            endpoint: `/reclamations/${id}`,
            method: 'PATCH',
            remediation: 'Vérifier la propriété avant modification',
            cvss: 9.1,
            cwe: 'CWE-639',
            owasp: 'IDOR',
          });
          break;
        }
      } catch (e) {}
    }
    
    return { findings };
  }

  async rbacBypass() {
    console.log('  Testing RBAC Bypass (CITOYEN → ADMIN)...');
    const findings = [];
    
    const citoyenToken = await this.getToken('citoyen');
    if (!citoyenToken) return { findings };
    
    // Test 1: Modifier son propre rôle
    try {
      const res = await this.axiosInstance.patch(
        `${this.config.apiBaseUrl}/users/me`,
        { role: 'SUPER_ADMIN' },
        { headers: { Authorization: `Bearer ${citoyenToken}` } }
      );
      
      if (res.status === 200 && res.data?.role === 'SUPER_ADMIN') {
        findings.push({
          severity: 'CRITICAL',
          category: 'RBAC Bypass',
          title: 'Auto-attribution rôle ADMIN réussie',
          description: 'L\'utilisateur peut modifier son propre rôle',
          endpoint: '/users/me',
          method: 'PATCH',
          payload: { role: 'SUPER_ADMIN' },
          remediation: 'Protéger le champ "role" contre les modifications',
          cvss: 9.9,
          cwe: 'CWE-269',
          owasp: 'RBAC Bypass',
        });
      }
    } catch (e) {}
    
    // Test 2: Accéder à l'interface admin
    const adminPaths = ['/dashboard/admin', '/dashboard/gouverneur', '/admin', '/backoffice'];
    
    for (const path of adminPaths) {
      try {
        const res = await this.axiosInstance.get(`${this.config.target}${path}`, {
          headers: { Authorization: `Bearer ${citoyenToken}` },
        });
        
        if (res.status === 200 && !res.data.toString().includes('unauthorized') && !res.data.toString().includes('forbidden')) {
          findings.push({
            severity: 'HIGH',
            category: 'RBAC Bypass',
            title: `CITOYEN accède à ${path}`,
            description: 'Interface admin accessible avec rôle CITOYEN',
            endpoint: path,
            method: 'GET',
            remediation: 'Vérifier le rôle sur toutes les pages admin',
            cvss: 8.0,
            cwe: 'CWE-269',
            owasp: 'RBAC Bypass',
          });
        }
      } catch (e) {}
    }
    
    return { findings };
  }

  async functionLevelControl() {
    console.log('  Testing Function Level Access Control...');
    const findings = [];
    
    const citoyenToken = await this.getToken('citoyen');
    if (!citoyenToken) return { findings };
    
    // Fonctions sensibles
    const sensitiveEndpoints = [
      { url: '/api/system/backup', method: 'POST' },
      { url: '/api/system/restore', method: 'POST' },
      { url: '/api/system/settings', method: 'PATCH' },
      { url: '/api/logs/clear', method: 'DELETE' },
      { url: '/api/users/bulk-delete', method: 'DELETE' },
      { url: '/api/database/migrate', method: 'POST' },
    ];
    
    for (const ep of sensitiveEndpoints) {
      try {
        const res = await this.axiosInstance({
          method: ep.method.toLowerCase(),
          url: `${this.config.target}${ep.url}`,
          headers: { Authorization: `Bearer ${citoyenToken}` },
          data: {},
        });
        
        if (res.status === 200 || res.status === 201) {
          findings.push({
            severity: 'CRITICAL',
            category: 'Function Level Access Control',
            title: `Fonction sensible accessible: ${ep.url}`,
            description: 'CITOYEN peut exécuter des fonctions système',
            endpoint: ep.url,
            method: ep.method,
            remediation: 'Restreindre aux SUPER_ADMIN uniquement',
            cvss: 9.5,
            cwe: 'CWE-269',
            owasp: 'Function Level Access',
          });
        }
      } catch (e) {}
    }
    
    return { findings };
  }

  async parameterTampering() {
    console.log('  Testing Parameter Tampering...');
    const findings = [];
    
    const citoyenToken = await this.getToken('citoyen');
    if (!citoyenToken) return { findings };
    
    // Test 1: Modifier userId dans les requêtes
    try {
      const res = await this.axiosInstance.get(
        `${this.config.apiBaseUrl}/reclamations`,
        {
          params: { userId: 1 }, // Forcer l'accès aux réclamations d'un autre user
          headers: { Authorization: `Bearer ${citoyenToken}` },
        }
      );
      
      if (res.status === 200 && Array.isArray(res.data) && res.data.length > 0) {
        const hasOtherUserData = res.data.some(r => r.user?.email !== this.config.credentials.citoyen.email);
        
        if (hasOtherUserData) {
          findings.push({
            severity: 'HIGH',
            category: 'Parameter Tampering',
            title: 'Paramètre userId permet d\'accéder aux données d\'autres utilisateurs',
            description: 'Le serveur fait confiance au paramètre userId client',
            endpoint: '/reclamations',
            method: 'GET',
            remediation: 'Ignorer les paramètres userId et utiliser le token',
            cvss: 7.5,
            cwe: 'CWE-639',
            owasp: 'Parameter Tampering',
          });
        }
      }
    } catch (e) {}
    
    // Test 2: Modifier le rôle dans le body
    try {
      const res = await this.axiosInstance.post(
        `${this.config.apiBaseUrl}/reclamations`,
        {
          titre: 'Test',
          description: 'Test',
          role: 'ADMIN', // Tentative de manipulation
          statut: 'ACCEPTEE', // Forcer le statut
        },
        { headers: { Authorization: `Bearer ${citoyenToken}` } }
      );
      
      if (res.status === 201 && res.data?.statut === 'ACCEPTEE') {
        findings.push({
          severity: 'HIGH',
          category: 'Parameter Tampering',
          title: 'Statut réclamation manipulable',
          description: 'Le client peut forcer le statut de la réclamation',
          endpoint: '/reclamations',
          method: 'POST',
          remediation: 'Ignorer les champs sensibles dans les créations',
          cvss: 7.0,
          cwe: 'CWE-915',
          owasp: 'Parameter Tampering',
        });
      }
    } catch (e) {}
    
    return { findings };
  }

  async forcedBrowsing() {
    console.log('  Testing Forced Browsing...');
    const findings = [];
    
    const hiddenPaths = [
      '/api/admin',
      '/api/internal',
      '/api/debug',
      '/api/test',
      '/api/backup',
      '/admin',
      '/administrator',
      '/manager',
      '/.git/config',
      '/.env',
      '/backup.sql',
    ];
    
    for (const path of hiddenPaths) {
      try {
        const res = await this.axiosInstance.get(`${this.config.target}${path}`);
        
        if (res.status === 200) {
          const isCritical = path.includes('.git') || path.includes('.env') || path.includes('.sql');
          
          findings.push({
            severity: isCritical ? 'CRITICAL' : 'MEDIUM',
            category: 'Forced Browsing',
            title: `Chemin caché accessible: ${path}`,
            description: 'Ressource cachée accessible publiquement',
            endpoint: path,
            method: 'GET',
            remediation: 'Bloquer l\'accès aux ressources sensibles',
            cvss: isCritical ? 8.5 : 5.0,
            cwe: 'CWE-425',
            owasp: 'Forced Browsing',
          });
        }
      } catch (e) {}
    }
    
    return { findings };
  }
}
