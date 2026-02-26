#!/usr/bin/env node
/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║          GÉNÉRATEUR DE SECRETS SÉCURISÉS - PORTAIL MEDIOUNA                 ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 * 
 * Usage: node scripts/generate-secrets.js
 * 
 * Ce script génère des secrets cryptographiquement sécurisés pour:
 * - NEXTAUTH_SECRET
 * - MOBILE_API_KEY
 * - POSTGRES_PASSWORD
 */

const crypto = require('crypto');

console.log('\n╔══════════════════════════════════════════════════════════════════════════════╗');
console.log('║          🔐 GÉNÉRATEUR DE SECRETS SÉCURISÉS                                  ║');
console.log('║                    Portail Mediouna Action                                   ║');
console.log('╚══════════════════════════════════════════════════════════════════════════════╝\n');

// Génération des secrets
const secrets = {
  NEXTAUTH_SECRET: crypto.randomBytes(32).toString('base64'),
  MOBILE_API_KEY: crypto.randomBytes(32).toString('hex'),
  POSTGRES_PASSWORD: crypto.randomBytes(24).toString('base64').replace(/[+/=]/g, 'x'),
};

console.log('📋 Copiez ces valeurs dans votre fichier .env:\n');
console.log('─'.repeat(70));
console.log('');

// NEXTAUTH_SECRET
console.log('# 🔐 Secret NextAuth (pour les sessions JWT)');
console.log(`NEXTAUTH_SECRET="${secrets.NEXTAUTH_SECRET}"`);
console.log('');

// MOBILE_API_KEY
console.log('# 📱 Clé API Mobile');
console.log(`MOBILE_API_KEY="${secrets.MOBILE_API_KEY}"`);
console.log('');

// POSTGRES_PASSWORD
console.log('# 🗄️ Mot de passe PostgreSQL');
console.log(`POSTGRES_PASSWORD="${secrets.POSTGRES_PASSWORD}"`);
console.log('');

// DATABASE_URL complet
console.log('# 📌 URL de connexion complète (avec le mot de passe ci-dessus)');
console.log(`DATABASE_URL="postgresql://medaction:${secrets.POSTGRES_PASSWORD}@localhost:5432/medaction"`);
console.log('');

console.log('─'.repeat(70));
console.log('');
console.log('⚠️  IMPORTANT:');
console.log('   • Ne partagez JAMAIS ces secrets');
console.log('   • Ne les committez JAMAIS dans Git');
console.log('   • Régénérez-les si vous pensez qu\'ils ont été compromis');
console.log('   • Utilisez des secrets DIFFÉRENTS pour dev/staging/production');
console.log('');
console.log('✅ Secrets générés avec crypto.randomBytes() (cryptographiquement sécurisé)\n');
