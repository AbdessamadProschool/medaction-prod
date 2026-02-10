import dns from 'dns';
import http from 'http';
import https from 'https';
import { exec } from 'child_process';
import util from 'util';

const execAsync = util.promisify(exec);

const TARGET_URL = process.env.TARGET_URL || 'http://192.168.1.18:3000';
const IS_LOCAL = TARGET_URL.includes('localhost') || TARGET_URL.includes('127.0.0.1');

console.log('\n🛡️  DÉMARRAGE DE L\'AUDIT DE SÉCURITÉ MEDACTION');
console.log(`🎯 Cible : ${TARGET_URL}\n`);

async function checkSecHeaders() {
  console.log('🔍 [1/5] Vérification des En-têtes de Sécurité (HTTP Security Headers)...');
  
  try {
    const protocol = TARGET_URL.startsWith('https') ? https : http;
    
    return new Promise<void>((resolve) => {
      protocol.get(TARGET_URL, (res) => {
        const headers = res.headers;
        const criticalHeaders = [
          'x-frame-options',
          'x-content-type-options',
          'strict-transport-security',
          'content-security-policy',
          'x-xss-protection',
          'referrer-policy'
        ];

        let score = 0;
        criticalHeaders.forEach(header => {
          if (headers[header]) {
            console.log(`  ✅ ${header}: PRÉSENT`);
            score++;
          } else {
            console.log(`  ❌ ${header}: MANQUANT`);
          }
        });

        if (headers['x-powered-by']) {
          console.log(`  ⚠️  Informations divulguées (x-powered-by): ${headers['x-powered-by']}`);
          console.log('      -> CONSEIL: Désactivez "poweredByHeader" dans next.config.js');
        }

        console.log(`  > Score Headers: ${score}/${criticalHeaders.length}`);
        resolve();
      }).on('error', (e) => {
        console.error(`  ❌ Erreur de connexion: ${e.message}`);
        resolve();
      });
    });
  } catch (error) {
    console.error('Erreur:', error);
  }
}

async function checkOpenPorts() {
  console.log('\n🔍 [2/5] Scan des Ports Critiques (Simulation)...');
  console.log('  (Nécessite nmap pour un vrai scan, vérification logicielle ici)');
  
  // Cette section est indicative. Sur un vrai audit, on utiliserait nmap.
  const portsToCheck = [22, 80, 443, 3000, 5432, 8080];
  console.log(`  Ports ciblés : ${portsToCheck.join(', ')}`);
  console.log('  ⚠️  Assurez-vous que seul le port 80/443 (et 3000 en interne) est exposé publiquement.');
  console.log('  ⚠️  Le port 5432 (PostgreSQL) NE DOIT PAS être accessible depuis internet.');
}

async function checkDependencies() {
  console.log('\n🔍 [3/5] Audit des Dépendances (npm audit)...');
  try {
    const { stdout, stderr } = await execAsync('npm audit --json');
    const audit = JSON.parse(stdout);
    
    const vulns = audit.metadata.vulnerabilities;
    console.log(`  Total vulnérabilités : ${vulns.total}`);
    console.log(`  🔴 Hautes/Critiques : ${vulns.high + vulns.critical}`);
    
    if (vulns.high + vulns.critical > 0) {
      console.log('  -> ACTION REQUISE : Lancez "npm audit fix" rapidement.');
    } else {
      console.log('  ✅ Dépendances saines.');
    }
  } catch (error: any) {
    // npm audit retourne un code erreur s'il y a des failles, on gère ça
    try {
        const output = error.stdout ? JSON.parse(error.stdout) : null;
        if (output && output.metadata) {
            const vulns = output.metadata.vulnerabilities;
            console.log(`  Total vulnérabilités : ${vulns.total}`);
            console.log(`  🔴 Hautes/Critiques : ${vulns.high + vulns.critical}`);
            console.log('  ⚠️  Certaines dépendances nécessitent une mise à jour.');
        } else {
            console.log('  ⚠️  Impossible d\'exécuter l\'audit npm complet.');
        }
    } catch (e) {
        console.log('  ⚠️  Erreur lors de l\'analyse npm audit.');
    }
  }
}

async function checkSensitiveFiles() {
  console.log('\n🔍 [4/5] Vérification des Fichiers Sensibles exposés...');
  const riskyPaths = [
    '/.env',
    '/.git/config',
    '/docker-compose.yml',
    '/package.json'
  ];

  for (const path of riskyPaths) {
    const url = `${TARGET_URL}${path}`;
    // Simple check (fetch not available in basic node without flags/imports sometimes, using http)
    // Ici on simule le check
    console.log(`  Test accès ${path}... (Simulation)`);
  }
  console.log('  -> Vérifiez que votre serveur web (Nginx/Next.js) renvoie 404 pour ces fichiers.');
}

async function runAudit() {
  await checkSecHeaders();
  await checkOpenPorts();
  await checkDependencies();
  await checkSensitiveFiles();
  
  console.log('\n🏁 FIN DE L\'AUDIT AUTOMATISÉ');
  console.log('👉 Consultez le guide GUIDE_AUDIT_SECURITE_TESTS.md pour les tests manuels approfondis.');
}

runAudit();
