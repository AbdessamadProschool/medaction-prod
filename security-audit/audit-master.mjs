#!/usr/bin/env node

/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  MÉDIOUNA ACTION - SECURITY AUDIT FRAMEWORK v2.0                    ║
 * ║  Professional Penetration Testing Suite                             ║
 * ║  Compliance: OWASP Top 10, PTES, OSSTMM, NIST 800-115              ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import util from 'util';
import chalk from 'chalk';
import ora from 'ora';
import Table from 'cli-table3';
import figlet from 'figlet';

// Modules d'audit
import { ReconnaissanceModule } from './modules/01-reconnaissance.mjs';
import { NetworkScanningModule } from './modules/02-network-scanning.mjs';
import { VulnerabilityScanningModule } from './modules/03-vulnerability-scanning.mjs';
import { WebAttacksModule } from './modules/04-web-attacks.mjs';
import { APISecurityModule } from './modules/05-api-security.mjs';
import { AuthenticationModule } from './modules/06-authentication.mjs';
import { AuthorizationModule } from './modules/07-authorization.mjs';
import { InjectionAttacksModule } from './modules/08-injection-attacks.mjs';
import { CryptoTestsModule } from './modules/09-crypto-tests.mjs';
import { SessionManagementModule } from './modules/10-session-management.mjs';
import { BusinessLogicModule } from './modules/11-business-logic.mjs';
import { DoSStressModule } from './modules/12-dos-stress.mjs';
import { DataExposureModule } from './modules/13-data-exposure.mjs';
import { SecurityMisconfigModule } from './modules/14-security-misconfig.mjs';
import { ReportingModule } from './modules/15-reporting.mjs';

const execAsync = util.promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ═══════════════════════════════════════════════════════════════════
// CONFIGURATION GLOBALE - MÉDIOUNA ACTION
// ═══════════════════════════════════════════════════════════════════

const CONFIG = {
  target: process.env.TARGET_URL || 'http://192.168.1.100:3000',
  apiBaseUrl: process.env.API_BASE_URL || 'http://192.168.1.100:3000/api',
  aggressive: process.env.AGGRESSIVE === 'true' || true,
  stealth: process.env.STEALTH === 'true' || false,
  threads: parseInt(process.env.THREADS || '10'),
  timeout: parseInt(process.env.TIMEOUT || '30000'),
  maxRetries: parseInt(process.env.MAX_RETRIES || '3'),
  rateLimit: parseInt(process.env.RATE_LIMIT || '100'),
  
  scope: {
    includePaths: ['/api/*', '/auth/*', '/dashboard/*', '/uploads/*', '/reclamations/*', '/etablissements/*', '/evenements/*'],
    excludePaths: ['/api/health', '/favicon.ico', '/_next/*'],
    testAuthentication: true,
    testAuthorization: true,
    testInjections: true,
    testBusinessLogic: true,
    testDoS: false, // Désactivé par défaut - dangereux en production
  },
  
  // Comptes de test MedAction - À CONFIGURER
  credentials: {
    citoyen: {
      email: process.env.TEST_CITOYEN_EMAIL || 'citoyen.test@medaction.ma',
      password: process.env.TEST_CITOYEN_PASSWORD || 'CitoyenTest2024!',
    },
    autorite: {
      email: process.env.TEST_AUTORITE_EMAIL || 'autorite.test@medaction.ma',
      password: process.env.TEST_AUTORITE_PASSWORD || 'AutoriteTest2024!',
    },
    delegation: {
      email: process.env.TEST_DELEGATION_EMAIL || 'delegation@medaction.ma',
      password: process.env.TEST_DELEGATION_PASSWORD || 'DelegationTest2024!',
    },
    gouverneur: {
      email: process.env.TEST_GOUVERNEUR_EMAIL || 'gouverneur@medaction.ma',
      password: process.env.TEST_GOUVERNEUR_PASSWORD || 'GouverneurTest2024!',
    },
    superadmin: {
      email: process.env.TEST_SUPERADMIN_EMAIL || 'superadmin@medaction.ma',
      password: process.env.TEST_SUPERADMIN_PASSWORD || 'SuperAdmin2024!',
    },
  },
  
  // Endpoints spécifiques MedAction
  medactionEndpoints: {
    auth: {
      login: '/api/auth/signin',
      register: '/api/auth/register',
      logout: '/api/auth/signout',
      forgotPassword: '/api/auth/forgot-password',
      resetPassword: '/api/auth/reset-password',
      me: '/api/users/me',
    },
    reclamations: {
      list: '/api/reclamations',
      create: '/api/reclamations',
      get: '/api/reclamations/:id',
      update: '/api/reclamations/:id',
      delete: '/api/reclamations/:id',
      decision: '/api/reclamations/:id/decision',
      affecter: '/api/reclamations/:id/affecter',
    },
    etablissements: {
      list: '/api/etablissements',
      get: '/api/etablissements/:id',
      evaluations: '/api/etablissements/:id/evaluations',
    },
    evenements: {
      list: '/api/evenements',
      create: '/api/evenements',
      valider: '/api/evenements/:id/valider',
    },
    users: {
      list: '/api/users',
      get: '/api/users/:id',
      update: '/api/users/:id',
      delete: '/api/users/:id',
      photo: '/api/users/me/photo',
    },
    upload: '/api/upload',
    stats: '/api/stats',
  },
  
  output: {
    format: ['json', 'html', 'markdown'],
    reportDir: path.join(__dirname, 'reports'),
    screenshots: true,
  },
  
  payloadsDir: path.join(__dirname, 'payloads'),
};

// Statistiques globales
const STATS = {
  vulnerabilities: {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    info: 0,
  },
  requestsSent: 0,
  requestsFailed: 0,
  timeElapsed: 0,
  findings: [],
};

// ═══════════════════════════════════════════════════════════════════
// BANNER & INITIALIZATION
// ═══════════════════════════════════════════════════════════════════

function displayBanner() {
  console.clear();
  console.log(
    chalk.red(
      figlet.textSync('MEDACTION', {
        font: 'ANSI Shadow',
        horizontalLayout: 'default',
      })
    )
  );
  console.log(
    chalk.yellow(
      figlet.textSync('PENTEST', {
        font: 'Small',
        horizontalLayout: 'default',
      })
    )
  );
  
  console.log(chalk.cyan('═'.repeat(80)));
  console.log(chalk.yellow('  🛡️  Professional Security Audit Framework v2.0'));
  console.log(chalk.yellow('  📋 Compliance: OWASP Top 10 2021, OWASP API Top 10 2023, PTES, OSSTMM'));
  console.log(chalk.yellow('  🎯 Target: ') + chalk.white.bold(CONFIG.target));
  console.log(chalk.yellow('  ⚡ Mode: ') + (CONFIG.aggressive ? chalk.red.bold('AGGRESSIVE') : chalk.green('STANDARD')));
  console.log(chalk.cyan('═'.repeat(80)));
  console.log();
  
  console.log(chalk.red.bold('⚠️  AVERTISSEMENT LÉGAL:'));
  console.log(chalk.yellow('  Ce script effectue des ATTAQUES RÉELLES sur le système cible.'));
  console.log(chalk.yellow('  Utilisez-le UNIQUEMENT sur des systèmes dont vous êtes propriétaire'));
  console.log(chalk.yellow('  ou pour lesquels vous avez une autorisation écrite explicite.'));
  console.log(chalk.yellow('  Tout test non autorisé est ILLÉGAL et punissable par la loi.'));
  console.log();
}

async function confirmScope() {
  console.log(chalk.cyan('\n📋 SCOPE DE L\'AUDIT'));
  console.log(chalk.white('  Cible: ') + chalk.yellow(CONFIG.target));
  console.log(chalk.white('  API Base: ') + chalk.yellow(CONFIG.apiBaseUrl));
  console.log(chalk.white('  Threads: ') + chalk.yellow(CONFIG.threads));
  console.log(chalk.white('  Timeout: ') + chalk.yellow(CONFIG.timeout + 'ms'));
  console.log(chalk.white('  Mode Agressif: ') + (CONFIG.aggressive ? chalk.red('OUI') : chalk.green('NON')));
  console.log();
  
  console.log(chalk.cyan('📌 Tests activés:'));
  console.log(chalk.white('  ✓ Authentification: ') + (CONFIG.scope.testAuthentication ? chalk.green('OUI') : chalk.red('NON')));
  console.log(chalk.white('  ✓ Autorisation (RBAC): ') + (CONFIG.scope.testAuthorization ? chalk.green('OUI') : chalk.red('NON')));
  console.log(chalk.white('  ✓ Injections: ') + (CONFIG.scope.testInjections ? chalk.green('OUI') : chalk.red('NON')));
  console.log(chalk.white('  ✓ Logique Métier: ') + (CONFIG.scope.testBusinessLogic ? chalk.green('OUI') : chalk.red('NON')));
  console.log(chalk.white('  ✓ DoS/Stress: ') + (CONFIG.scope.testDoS ? chalk.red('OUI (ATTENTION!)') : chalk.green('NON')));
  console.log();
  
  // Mode non-interactif pour l'exécution automatique
  console.log(chalk.green('🚀 Démarrage de l\'audit dans 3 secondes...'));
  await new Promise(resolve => setTimeout(resolve, 3000));
}

// ═══════════════════════════════════════════════════════════════════
// PHASES D'AUDIT
// ═══════════════════════════════════════════════════════════════════

async function phase4_WebAttacks() {
  console.log(chalk.cyan('\n\n╔════════════════════════════════════════════════════════╗'));
  console.log(chalk.cyan('║  PHASE 4: WEB APPLICATION ATTACKS (OWASP Top 10)      ║'));
  console.log(chalk.cyan('╚════════════════════════════════════════════════════════╝\n'));
  
  const webAttacker = new WebAttacksModule(CONFIG);
  
  const tasks = [
    { name: 'A01:2021 – Broken Access Control', fn: () => webAttacker.brokenAccessControl() },
    { name: 'A02:2021 – Cryptographic Failures', fn: () => webAttacker.cryptoFailures() },
    { name: 'A03:2021 – Injection (SQL, NoSQL, XSS)', fn: () => webAttacker.injectionTests() },
    { name: 'A05:2021 – Security Misconfiguration', fn: () => webAttacker.securityMisconfig() },
    { name: 'A07:2021 – Auth & Session Failures', fn: () => webAttacker.authFailures() },
    { name: 'A10:2021 – SSRF', fn: () => webAttacker.ssrfTests() },
    { name: 'CSRF (Cross-Site Request Forgery)', fn: () => webAttacker.csrfTests() },
    { name: 'IDOR (Insecure Direct Object Ref)', fn: () => webAttacker.idorTests() },
    { name: 'Path Traversal / LFI', fn: () => webAttacker.pathTraversal() },
    { name: 'Clickjacking', fn: () => webAttacker.clickjackingTest() },
  ];
  
  for (const task of tasks) {
    const spinner = ora(task.name).start();
    try {
      const result = await task.fn();
      if (result && result.findings) {
        STATS.findings.push(...result.findings);
        
        const criticalCount = result.findings.filter(f => f.severity === 'CRITICAL').length;
        const highCount = result.findings.filter(f => f.severity === 'HIGH').length;
        
        if (criticalCount > 0 || highCount > 0) {
          spinner.fail(chalk.red(`${task.name} - ${criticalCount} CRITICAL, ${highCount} HIGH`));
        } else if (result.findings.length > 0) {
          spinner.warn(chalk.yellow(`${task.name} - ${result.findings.length} issues`));
        } else {
          spinner.succeed(chalk.green(`${task.name} - OK`));
        }
      } else {
        spinner.succeed(chalk.green(`${task.name} - OK`));
      }
    } catch (error) {
      spinner.fail(chalk.red(`${task.name} - Erreur: ${error.message}`));
    }
  }
}

async function phase5_APISecurity() {
  console.log(chalk.cyan('\n\n╔════════════════════════════════════════════════════════╗'));
  console.log(chalk.cyan('║  PHASE 5: API SECURITY TESTING (OWASP API Top 10)     ║'));
  console.log(chalk.cyan('╚════════════════════════════════════════════════════════╝\n'));
  
  const apiTester = new APISecurityModule(CONFIG);
  
  const tasks = [
    { name: 'API1:2023 – Broken Object Level Authorization', fn: () => apiTester.brokenObjectAuth() },
    { name: 'API2:2023 – Broken Authentication', fn: () => apiTester.brokenAuthentication() },
    { name: 'API3:2023 – Broken Property Level Authorization', fn: () => apiTester.brokenPropertyAuth() },
    { name: 'API4:2023 – Unrestricted Resource Consumption', fn: () => apiTester.resourceConsumption() },
    { name: 'API5:2023 – Broken Function Level Authorization', fn: () => apiTester.brokenFunctionAuth() },
    { name: 'API6:2023 – Sensitive Business Flows', fn: () => apiTester.businessFlowAccess() },
    { name: 'API7:2023 – Server Side Request Forgery', fn: () => apiTester.ssrfAPI() },
    { name: 'API8:2023 – Security Misconfiguration', fn: () => apiTester.apiMisconfig() },
    { name: 'REST API Fuzzing', fn: () => apiTester.apiFuzzing() },
    { name: 'Mass Assignment', fn: () => apiTester.massAssignment() },
    { name: 'Rate Limiting Bypass', fn: () => apiTester.rateLimitBypass() },
  ];
  
  for (const task of tasks) {
    const spinner = ora(task.name).start();
    try {
      const result = await task.fn();
      if (result && result.findings) {
        STATS.findings.push(...result.findings);
        spinner.succeed(`${task.name} - ${result.findings.length} issues`);
      } else {
        spinner.succeed(`${task.name} - OK`);
      }
    } catch (error) {
      spinner.fail(`${task.name} - Erreur: ${error.message}`);
    }
  }
}

async function phase6_Authentication() {
  console.log(chalk.cyan('\n\n╔════════════════════════════════════════════════════════╗'));
  console.log(chalk.cyan('║  PHASE 6: AUTHENTICATION SECURITY                      ║'));
  console.log(chalk.cyan('╚════════════════════════════════════════════════════════╝\n'));
  
  const authTester = new AuthenticationModule(CONFIG);
  
  const tasks = [
    { name: 'JWT Token Security', fn: () => authTester.jwtSecurity() },
    { name: 'Password Policy Enforcement', fn: () => authTester.passwordPolicy() },
    { name: 'Brute Force Protection', fn: () => authTester.bruteForceTest() },
    { name: 'Account Enumeration', fn: () => authTester.accountEnumeration() },
    { name: 'Password Reset Flaws', fn: () => authTester.passwordResetFlaws() },
    { name: '2FA Bypass Attempts', fn: () => authTester.twoFactorBypass() },
    { name: 'Session Fixation', fn: () => authTester.sessionFixation() },
    { name: 'Weak Credential Storage', fn: () => authTester.credentialStorage() },
  ];
  
  for (const task of tasks) {
    const spinner = ora(task.name).start();
    try {
      const result = await task.fn();
      if (result && result.findings) {
        STATS.findings.push(...result.findings);
        spinner.succeed(`${task.name} - ${result.findings.length} issues`);
      } else {
        spinner.succeed(`${task.name} - OK`);
      }
    } catch (error) {
      spinner.fail(`${task.name} - Erreur: ${error.message}`);
    }
  }
}

async function phase7_Authorization() {
  console.log(chalk.cyan('\n\n╔════════════════════════════════════════════════════════╗'));
  console.log(chalk.cyan('║  PHASE 7: AUTHORIZATION & RBAC TESTING                 ║'));
  console.log(chalk.cyan('╚════════════════════════════════════════════════════════╝\n'));
  
  const authzTester = new AuthorizationModule(CONFIG);
  
  const tasks = [
    { name: 'Vertical Privilege Escalation', fn: () => authzTester.verticalEscalation() },
    { name: 'Horizontal Privilege Escalation', fn: () => authzTester.horizontalEscalation() },
    { name: 'RBAC Bypass (CITOYEN → ADMIN)', fn: () => authzTester.rbacBypass() },
    { name: 'Missing Function Level Access Control', fn: () => authzTester.functionLevelControl() },
    { name: 'Parameter Tampering', fn: () => authzTester.parameterTampering() },
    { name: 'Forced Browsing', fn: () => authzTester.forcedBrowsing() },
  ];
  
  for (const task of tasks) {
    const spinner = ora(task.name).start();
    try {
      const result = await task.fn();
      if (result && result.findings) {
        STATS.findings.push(...result.findings);
        spinner.succeed(`${task.name} - ${result.findings.length} issues`);
      } else {
        spinner.succeed(`${task.name} - OK`);
      }
    } catch (error) {
      spinner.fail(`${task.name} - Erreur: ${error.message}`);
    }
  }
}

async function phase8_InjectionAttacks() {
  console.log(chalk.cyan('\n\n╔════════════════════════════════════════════════════════╗'));
  console.log(chalk.cyan('║  PHASE 8: INJECTION ATTACKS (Comprehensive)            ║'));
  console.log(chalk.cyan('╚════════════════════════════════════════════════════════╝\n'));
  
  const injectionTester = new InjectionAttacksModule(CONFIG);
  
  const tasks = [
    { name: 'SQL Injection', fn: () => injectionTester.sqlInjection() },
    { name: 'NoSQL Injection (Prisma)', fn: () => injectionTester.nosqlInjection() },
    { name: 'XSS Reflected', fn: () => injectionTester.xssReflected() },
    { name: 'XSS Stored', fn: () => injectionTester.xssStored() },
    { name: 'XSS DOM-based', fn: () => injectionTester.xssDOM() },
    { name: 'Command Injection (OS)', fn: () => injectionTester.commandInjection() },
    { name: 'SSTI (Server-Side Template Injection)', fn: () => injectionTester.sstiTests() },
    { name: 'Header Injection', fn: () => injectionTester.headerInjection() },
  ];
  
  for (const task of tasks) {
    const spinner = ora(task.name).start();
    try {
      const result = await task.fn();
      if (result && result.findings) {
        STATS.findings.push(...result.findings);
        
        const criticalCount = result.findings.filter(f => f.severity === 'CRITICAL').length;
        if (criticalCount > 0) {
          spinner.fail(chalk.red.bold(`${task.name} - ${criticalCount} CRITICAL vulnerabilities!`));
        } else {
          spinner.succeed(`${task.name} - ${result.findings.length} issues`);
        }
      } else {
        spinner.succeed(`${task.name} - OK`);
      }
    } catch (error) {
      spinner.fail(`${task.name} - Erreur: ${error.message}`);
    }
  }
}

async function phase13_DataExposure() {
  console.log(chalk.cyan('\n\n╔════════════════════════════════════════════════════════╗'));
  console.log(chalk.cyan('║  PHASE 13: SENSITIVE DATA EXPOSURE                     ║'));
  console.log(chalk.cyan('╚════════════════════════════════════════════════════════╝\n'));
  
  const exposureTester = new DataExposureModule(CONFIG);
  
  const tasks = [
    { name: 'Sensitive Files Exposure', fn: () => exposureTester.sensitiveFiles() },
    { name: 'Error Message Disclosure', fn: () => exposureTester.errorDisclosure() },
    { name: 'API Key Leakage', fn: () => exposureTester.apiKeyLeakage() },
    { name: 'Source Code Disclosure', fn: () => exposureTester.sourceCodeDisclosure() },
    { name: 'Database Backups Accessible', fn: () => exposureTester.backupFiles() },
    { name: 'Git Repository Exposed', fn: () => exposureTester.gitExposure() },
    { name: 'Environment Variables Leakage', fn: () => exposureTester.envVarsLeakage() },
  ];
  
  for (const task of tasks) {
    const spinner = ora(task.name).start();
    try {
      const result = await task.fn();
      if (result && result.findings) {
        STATS.findings.push(...result.findings);
        spinner.succeed(`${task.name} - ${result.findings.length} issues`);
      } else {
        spinner.succeed(`${task.name} - OK`);
      }
    } catch (error) {
      spinner.fail(`${task.name} - Erreur: ${error.message}`);
    }
  }
}

async function phase14_SecurityMisconfig() {
  console.log(chalk.cyan('\n\n╔════════════════════════════════════════════════════════╗'));
  console.log(chalk.cyan('║  PHASE 14: SECURITY MISCONFIGURATION                   ║'));
  console.log(chalk.cyan('╚════════════════════════════════════════════════════════╝\n'));
  
  const misconfigTester = new SecurityMisconfigModule(CONFIG);
  
  const tasks = [
    { name: 'Default Credentials', fn: () => misconfigTester.defaultCredentials() },
    { name: 'Unnecessary HTTP Methods', fn: () => misconfigTester.httpMethods() },
    { name: 'Directory Listing', fn: () => misconfigTester.directoryListing() },
    { name: 'Missing Security Headers', fn: () => misconfigTester.securityHeaders() },
    { name: 'CORS Misconfiguration', fn: () => misconfigTester.corsMisconfig() },
    { name: 'Clickjacking Protection', fn: () => misconfigTester.clickjackingProtection() },
  ];
  
  for (const task of tasks) {
    const spinner = ora(task.name).start();
    try {
      const result = await task.fn();
      if (result && result.findings) {
        STATS.findings.push(...result.findings);
        spinner.succeed(`${task.name} - ${result.findings.length} issues`);
      } else {
        spinner.succeed(`${task.name} - OK`);
      }
    } catch (error) {
      spinner.fail(`${task.name} - Erreur: ${error.message}`);
    }
  }
}

// ═══════════════════════════════════════════════════════════════════
// REPORTING
// ═══════════════════════════════════════════════════════════════════

async function generateReport() {
  console.log(chalk.cyan('\n\n╔════════════════════════════════════════════════════════╗'));
  console.log(chalk.cyan('║  GÉNÉRATION DU RAPPORT FINAL                           ║'));
  console.log(chalk.cyan('╚════════════════════════════════════════════════════════╝\n'));
  
  // Calculer les statistiques
  STATS.findings.forEach(finding => {
    switch (finding.severity) {
      case 'CRITICAL': STATS.vulnerabilities.critical++; break;
      case 'HIGH': STATS.vulnerabilities.high++; break;
      case 'MEDIUM': STATS.vulnerabilities.medium++; break;
      case 'LOW': STATS.vulnerabilities.low++; break;
      case 'INFO': STATS.vulnerabilities.info++; break;
    }
  });
  
  // Afficher le tableau récapitulatif
  const table = new Table({
    head: [
      chalk.white.bold('Sévérité'),
      chalk.white.bold('Nombre'),
      chalk.white.bold('Pourcentage'),
    ],
    colWidths: [20, 12, 15],
  });
  
  const total = STATS.findings.length || 1;
  
  table.push(
    [chalk.red.bold('🔴 CRITICAL'), chalk.red.bold(STATS.vulnerabilities.critical), chalk.red.bold(`${((STATS.vulnerabilities.critical / total) * 100).toFixed(1)}%`)],
    [chalk.red('🟠 HIGH'), STATS.vulnerabilities.high, `${((STATS.vulnerabilities.high / total) * 100).toFixed(1)}%`],
    [chalk.yellow('🟡 MEDIUM'), STATS.vulnerabilities.medium, `${((STATS.vulnerabilities.medium / total) * 100).toFixed(1)}%`],
    [chalk.blue('🔵 LOW'), STATS.vulnerabilities.low, `${((STATS.vulnerabilities.low / total) * 100).toFixed(1)}%`],
    [chalk.gray('⚪ INFO'), STATS.vulnerabilities.info, `${((STATS.vulnerabilities.info / total) * 100).toFixed(1)}%`],
    [chalk.white.bold('TOTAL'), chalk.white.bold(STATS.findings.length), chalk.white.bold('100%')],
  );
  
  console.log(table.toString());
  
  // Générer les rapports
  const spinner = ora('Génération des rapports...').start();
  
  try {
    const reporter = new ReportingModule(CONFIG, STATS);
    await reporter.generateJSON();
    await reporter.generateHTML();
    await reporter.generateMarkdown();
    
    spinner.succeed('Rapports générés avec succès');
    
    console.log(chalk.green('\n📄 Rapports sauvegardés dans:'));
    console.log(chalk.white(`  ${CONFIG.output.reportDir}/audit-report.json`));
    console.log(chalk.white(`  ${CONFIG.output.reportDir}/audit-report.html`));
    console.log(chalk.white(`  ${CONFIG.output.reportDir}/audit-report.md`));
  } catch (error) {
    spinner.fail(`Erreur génération rapport: ${error.message}`);
  }
}

// ═══════════════════════════════════════════════════════════════════
// MAIN EXECUTION
// ═══════════════════════════════════════════════════════════════════


async function phase1_Reconnaissance() {
  console.log(chalk.cyan('\n\n╔════════════════════════════════════════════════════════╗'));
  console.log(chalk.cyan('║  PHASE 1: RECONNAISSANCE                               ║'));
  console.log(chalk.cyan('╚════════════════════════════════════════════════════════╝\n'));
  const module = new ReconnaissanceModule(CONFIG);
  const spinner = ora('Reconnaissance').start();
  try { const res = await module.runRecon(); if(res?.findings) STATS.findings.push(...res.findings); spinner.succeed(`Reconnaissance - ${res?.findings?.length||0} issues`); } catch(e) { spinner.fail(`Error: ${e.message}`); }
}

async function phase2_NetworkScanning() {
  console.log(chalk.cyan('\n\n╔════════════════════════════════════════════════════════╗'));
  console.log(chalk.cyan('║  PHASE 2: NETWORK SCANNING                             ║'));
  console.log(chalk.cyan('╚════════════════════════════════════════════════════════╝\n'));
  const module = new NetworkScanningModule(CONFIG);
  const spinner = ora('Port Scanning').start();
  try { const res = await module.scanCommonPorts(); if(res?.findings) STATS.findings.push(...res.findings); spinner.succeed(`Network - ${res?.findings?.length||0} issues`); } catch(e) { spinner.fail(`Error: ${e.message}`); }
}

async function phase3_VulnScanning() {
  console.log(chalk.cyan('\n\n╔════════════════════════════════════════════════════════╗'));
  console.log(chalk.cyan('║  PHASE 3: VULNERABILITY SCANNING                       ║'));
  console.log(chalk.cyan('╚════════════════════════════════════════════════════════╝\n'));
  const module = new VulnerabilityScanningModule(CONFIG);
  const spinner = ora('Fingerprinting').start();
  try { const res = await module.checkKnownVulns(); if(res?.findings) STATS.findings.push(...res.findings); spinner.succeed(`VulnScan - ${res?.findings?.length||0} issues`); } catch(e) { spinner.fail(`Error: ${e.message}`); }
}

async function phase9_CryptoTests() {
  console.log(chalk.cyan('\n\n╔════════════════════════════════════════════════════════╗'));
  console.log(chalk.cyan('║  PHASE 9: CRYPTOGRAPHIC TESTS                          ║'));
  console.log(chalk.cyan('╚════════════════════════════════════════════════════════╝\n'));
  const module = new CryptoTestsModule(CONFIG);
  const spinner = ora('Crypto Analysis').start();
  try { const res = await module.runCryptoAudit(); if(res?.findings) STATS.findings.push(...res.findings); spinner.succeed(`Crypto - ${res?.findings?.length||0} issues`); } catch(e) { spinner.fail(`Error: ${e.message}`); }
}

async function phase10_SessionManagement() {
  console.log(chalk.cyan('\n\n╔════════════════════════════════════════════════════════╗'));
  console.log(chalk.cyan('║  PHASE 10: SESSION MANAGEMENT                          ║'));
  console.log(chalk.cyan('╚════════════════════════════════════════════════════════╝\n'));
  const module = new SessionManagementModule(CONFIG);
  const spinner = ora('Session Analysis').start();
  try { const res = await module.checkSessionCookies(); if(res?.findings) STATS.findings.push(...res.findings); spinner.succeed(`Session - ${res?.findings?.length||0} issues`); } catch(e) { spinner.fail(`Error: ${e.message}`); }
}

async function phase11_BusinessLogic() {
  console.log(chalk.cyan('\n\n╔════════════════════════════════════════════════════════╗'));
  console.log(chalk.cyan('║  PHASE 11: BUSINESS LOGIC                              ║'));
  console.log(chalk.cyan('╚════════════════════════════════════════════════════════╝\n'));
  const module = new BusinessLogicModule(CONFIG);
  const spinner = ora('Logic Flaws').start();
  try { const res = await module.testLogicFlaws(); if(res?.findings) STATS.findings.push(...res.findings); spinner.succeed(`Logic - ${res?.findings?.length||0} issues`); } catch(e) { spinner.fail(`Error: ${e.message}`); }
}

async function phase12_DoSStress() {
  console.log(chalk.cyan('\n\n╔════════════════════════════════════════════════════════╗'));
  console.log(chalk.cyan('║  PHASE 12: DOS & STRESS TESTING                        ║'));
  console.log(chalk.cyan('╚════════════════════════════════════════════════════════╝\n'));
  const module = new DoSStressModule(CONFIG);
  const spinner = ora('DoS Simulation').start();
  try { const res = await module.runStressTest(); if(res?.findings) STATS.findings.push(...res.findings); spinner.succeed(`DoS - ${res?.findings?.length||0} issues`); } catch(e) { spinner.fail(`Error: ${e.message}`); }
}

async function main() {
  const startTime = Date.now();
  
  try {
    // Initialisation
    displayBanner();
    await confirmScope();
    
    console.log(chalk.green('\n🚀 Démarrage de l\'audit de sécurité complet...\n'));
    
    // Exécuter toutes les phases
    await phase1_Reconnaissance();
    await phase2_NetworkScanning();
    await phase3_VulnScanning();
    await phase4_WebAttacks();
    await phase5_APISecurity();
    await phase6_Authentication();
    await phase7_Authorization();
    await phase8_InjectionAttacks();
    await phase9_CryptoTests();
    await phase10_SessionManagement();
    await phase11_BusinessLogic();
    await phase12_DoSStress();
    await phase13_DataExposure();
    await phase14_SecurityMisconfig();
    
    // Calculer le temps écoulé
    STATS.timeElapsed = Date.now() - startTime;
    
    // Générer les rapports
    await generateReport();
    
    // Résumé final
    console.log(chalk.cyan('\n\n╔════════════════════════════════════════════════════════╗'));
    console.log(chalk.cyan('║  AUDIT TERMINÉ                                         ║'));
    console.log(chalk.cyan('╚════════════════════════════════════════════════════════╝\n'));
    
    console.log(chalk.white(`⏱️  Temps écoulé: ${(STATS.timeElapsed / 1000).toFixed(2)}s`));
    console.log(chalk.white(`📨 Requêtes envoyées: ${STATS.requestsSent}`));
    console.log(chalk.white(`❌ Requêtes échouées: ${STATS.requestsFailed}`));
    console.log(chalk.white(`🔍 Vulnérabilités trouvées: ${STATS.findings.length}`));
    console.log();
    
    if (STATS.vulnerabilities.critical > 0) {
      console.log(chalk.red.bold(`⚠️  ${STATS.vulnerabilities.critical} vulnérabilités CRITIQUES détectées!`));
      console.log(chalk.red.bold('    ACTION IMMÉDIATE REQUISE!\n'));
    } else if (STATS.vulnerabilities.high > 0) {
      console.log(chalk.red(`⚠️  ${STATS.vulnerabilities.high} vulnérabilités HIGH détectées.`));
      console.log(chalk.red('    Remédiation recommandée.\n'));
    } else {
      console.log(chalk.green('✅ Aucune vulnérabilité critique détectée.\n'));
    }
    
    console.log(chalk.cyan('📄 Consultez les rapports détaillés dans ./reports/'));
    console.log(chalk.cyan('🔧 Suivez les recommandations pour chaque vulnérabilité.\n'));
    
  } catch (error) {
    console.error(chalk.red(`\n❌ Erreur fatale: ${error.message}`));
    console.error(error.stack);
    process.exit(1);
  }
}

// Exécution
main();
