/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║          VÉRIFICATION DES VARIABLES D'ENVIRONNEMENT                          ║
 * ║                    Portail Mediouna Action                                   ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 * 
 * Ce module vérifie que toutes les variables d'environnement critiques
 * sont configurées correctement au démarrage de l'application.
 */

interface EnvValidation {
  name: string;
  required: boolean;
  minLength?: number;
  pattern?: RegExp;
  description: string;
  secret?: boolean;
}

const ENV_VALIDATIONS: EnvValidation[] = [
  // Base de données
  {
    name: 'DATABASE_URL',
    required: true,
    pattern: /^postgresql:\/\/.+:.+@.+:\d+\/.+$/,
    description: 'URL de connexion PostgreSQL',
  },
  
  // NextAuth
  {
    name: 'NEXTAUTH_URL',
    required: true,
    pattern: /^https?:\/\/.+/,
    description: 'URL de base de l\'application',
  },
  {
    name: 'NEXTAUTH_SECRET',
    required: true,
    minLength: 32,
    description: 'Secret pour signer les JWT',
    secret: true,
  },
  
  // API Mobile
  {
    name: 'MOBILE_API_KEY',
    required: process.env.NODE_ENV === 'production',
    minLength: 32,
    description: 'Clé API pour l\'authentification mobile',
    secret: true,
  },
  
  // hCaptcha (requis en production)
  {
    name: 'HCAPTCHA_SECRET',
    required: false,
    minLength: 10,
    description: 'Secret hCaptcha pour la protection anti-bot',
    secret: true,
  },
];

// Valeurs de placeholder à ne pas utiliser
const PLACEHOLDER_VALUES = [
  'GENERATE_WITH_openssl',
  'CHANGE_ME',
  'your-secret',
  'placeholder',
  'xxxxx',
  'example',
];

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Valide les variables d'environnement
 */
export function validateEnvironment(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const isProduction = process.env.NODE_ENV === 'production';

  for (const validation of ENV_VALIDATIONS) {
    const value = process.env[validation.name];
    const displayValue = validation.secret ? '***' : value?.substring(0, 20) + '...';

    // Vérifier si requis
    if (validation.required && !value) {
      errors.push(`❌ ${validation.name} est manquant (${validation.description})`);
      continue;
    }

    if (!value) continue;

    // Vérifier les placeholders
    const hasPlaceholder = PLACEHOLDER_VALUES.some(p => 
      value.toLowerCase().includes(p.toLowerCase())
    );
    if (hasPlaceholder) {
      if (isProduction) {
        errors.push(`❌ ${validation.name} contient une valeur de placeholder`);
      } else {
        warnings.push(`⚠️  ${validation.name} contient une valeur de placeholder`);
      }
    }

    // Vérifier la longueur minimale
    if (validation.minLength && value.length < validation.minLength) {
      const msg = `${validation.name} doit avoir au moins ${validation.minLength} caractères`;
      if (isProduction) {
        errors.push(`❌ ${msg}`);
      } else {
        warnings.push(`⚠️  ${msg}`);
      }
    }

    // Vérifier le pattern
    if (validation.pattern && !validation.pattern.test(value)) {
      errors.push(`❌ ${validation.name} a un format invalide`);
    }
  }

  // Avertissements supplémentaires pour la production
  if (isProduction) {
    if (!process.env.SENTRY_DSN) {
      warnings.push('⚠️  SENTRY_DSN non configuré (monitoring des erreurs désactivé)');
    }
    if (!process.env.REDIS_URL) {
      warnings.push('⚠️  REDIS_URL non configuré (rate limiting en mémoire uniquement)');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Affiche le résultat de la validation
 */
export function logValidationResult(result: ValidationResult): void {
  const isProduction = process.env.NODE_ENV === 'production';
  
  console.log('\n╔══════════════════════════════════════════════════════════════════╗');
  console.log('║          🔐 VÉRIFICATION SÉCURITÉ ENVIRONNEMENT                  ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝');
  console.log(`📍 Environnement: ${process.env.NODE_ENV || 'development'}\n`);

  if (result.errors.length > 0) {
    console.log('🚨 ERREURS:');
    result.errors.forEach(e => console.log(`   ${e}`));
    console.log('');
  }

  if (result.warnings.length > 0) {
    console.log('⚠️  AVERTISSEMENTS:');
    result.warnings.forEach(w => console.log(`   ${w}`));
    console.log('');
  }

  if (result.valid) {
    console.log('✅ Toutes les variables critiques sont correctement configurées\n');
  } else {
    console.log('❌ Variables d\'environnement invalides\n');
    if (isProduction) {
      console.log('🛑 L\'application ne peut pas démarrer en production avec ces erreurs');
      console.log('   Consultez .env.example pour la configuration correcte');
      console.log('   Exécutez: node scripts/generate-secrets.js pour générer les secrets\n');
    }
  }
}

/**
 * Vérifie et affiche les résultats au démarrage
 * Arrête l'application en production si la configuration est invalide
 */
export function checkEnvironmentOnStartup(): void {
  const result = validateEnvironment();
  logValidationResult(result);

  // En production, arrêter si configuration invalide
  if (!result.valid && process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
}

// Export default pour utilisation simple
export default { validateEnvironment, logValidationResult, checkEnvironmentOnStartup };
