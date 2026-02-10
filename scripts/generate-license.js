/**
 * Script de génération de licence
 * Usage: node scripts/generate-license.js
 */

const crypto = require('crypto');

// Configuration de la licence
const CLIENT_NAME = 'Portail Médiouna';
const DOMAINS = ['localhost', '127.0.0.1', 'mediouna.gov.ma', '192.168.1.18'];
const EXPIRY_DAYS = 365; // 1 an

// Secret pour la génération (doit correspondre à celui dans lib/license/index.ts)
const LICENSE_SECRET = 'MEDIOUNA_PROVINCE_2025_SECRET_KEY';

function generateLicenseKey(clientName, domains, expiryDate) {
  const data = `${clientName}|${domains.join(',')}|${expiryDate.toISOString()}|${LICENSE_SECRET}`;
  const hash = crypto.createHash('sha256').update(data).digest('hex');
  
  const parts = [
    'MED',
    hash.substring(0, 4).toUpperCase(),
    hash.substring(4, 8).toUpperCase(),
    hash.substring(8, 12).toUpperCase(),
    hash.substring(12, 16).toUpperCase(),
  ];
  
  return parts.join('-');
}

// Calculer la date d'expiration
const expiryDate = new Date();
expiryDate.setDate(expiryDate.getDate() + EXPIRY_DAYS);

// Générer la clé
const licenseKey = generateLicenseKey(CLIENT_NAME, DOMAINS, expiryDate);

console.log('\n╔══════════════════════════════════════════════════════════════════════════════╗');
console.log('║          🔑 GÉNÉRATEUR DE LICENCE - PORTAIL MEDIOUNA                        ║');
console.log('╚══════════════════════════════════════════════════════════════════════════════╝\n');

console.log('📋 Informations de la licence:');
console.log('   Client:', CLIENT_NAME);
console.log('   Domaines autorisés:', DOMAINS.join(', '));
console.log('   Date d\'expiration:', expiryDate.toLocaleDateString('fr-FR'));
console.log('   Jours de validité:', EXPIRY_DAYS);

console.log('\n📝 Ajoutez ces lignes à votre fichier .env:\n');
console.log('────────────────────────────────────────────────────────────────────────────────');
console.log(`# LICENCE - Générée le ${new Date().toLocaleDateString('fr-FR')}`);
console.log(`LICENSE_KEY="${licenseKey}"`);
console.log(`LICENSE_DOMAINS="${DOMAINS.join(',')}"`);
console.log(`LICENSE_EXPIRY="${expiryDate.toISOString().split('T')[0]}"`);
console.log('────────────────────────────────────────────────────────────────────────────────\n');

console.log('✅ Copiez ces valeurs dans votre fichier .env et redémarrez l\'application.\n');
