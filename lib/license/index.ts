/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║          SYSTÈME DE LICENCE - PORTAIL MEDIOUNA                              ║
 * ║                    Protection contre la réutilisation                        ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 * 
 * Ce module vérifie la validité de la licence de l'application.
 * Configuration requise dans .env:
 *   LICENSE_KEY=MED-XXXX-XXXX-XXXX
 *   LICENSE_DOMAINS=localhost,mediouna.gov.ma
 *   LICENSE_EXPIRY=2026-12-31
 */

import crypto from 'crypto';

// ============================================
// CONFIGURATION
// ============================================

interface LicenseConfig {
  key: string;
  domains: string[];
  expiryDate: Date | null;
}

interface LicenseValidation {
  valid: boolean;
  error?: string;
  details?: {
    licensee?: string;
    expiresAt?: Date;
    daysRemaining?: number;
  };
}

// Secret pour la génération des clés (à garder confidentiel)
const LICENSE_SECRET = 'MEDIOUNA_PROVINCE_2025_SECRET_KEY';

// ============================================
// GÉNÉRATION DE CLÉ DE LICENCE
// ============================================

/**
 * Génère une clé de licence pour un client
 * Format: MED-XXXX-XXXX-XXXX-XXXX
 */
export function generateLicenseKey(
  clientName: string,
  domains: string[],
  expiryDate: Date
): string {
  const data = `${clientName}|${domains.join(',')}|${expiryDate.toISOString()}|${LICENSE_SECRET}`;
  const hash = crypto.createHash('sha256').update(data).digest('hex');
  
  // Formater en MED-XXXX-XXXX-XXXX-XXXX
  const parts = [
    'MED',
    hash.substring(0, 4).toUpperCase(),
    hash.substring(4, 8).toUpperCase(),
    hash.substring(8, 12).toUpperCase(),
    hash.substring(12, 16).toUpperCase(),
  ];
  
  return parts.join('-');
}

// ============================================
// VALIDATION DE LICENCE
// ============================================

/**
 * Récupère la configuration de licence depuis les variables d'environnement
 */
function getLicenseConfig(): LicenseConfig {
  const key = process.env.LICENSE_KEY || '';
  const domainsStr = process.env.LICENSE_DOMAINS || 'localhost';
  const expiryStr = process.env.LICENSE_EXPIRY || '';
  
  return {
    key,
    domains: domainsStr.split(',').map(d => d.trim().toLowerCase()),
    expiryDate: expiryStr ? new Date(expiryStr) : null,
  };
}

/**
 * Vérifie si on est en mode développement
 */
function isDevelopmentMode(): boolean {
  return process.env.NODE_ENV === 'development' || 
         process.env.LICENSE_DEV_BYPASS === 'true';
}

/**
 * Vérifie si la licence est valide
 */
export function validateLicense(currentDomain?: string): LicenseValidation {
  const config = getLicenseConfig();
  
  // En mode développement sans clé configurée, on autorise
  if (isDevelopmentMode() && !config.key) {
    console.warn('[LICENSE] Mode développement - Licence non requise');
    return {
      valid: true,
      details: {
        licensee: 'Mode Développement',
      },
    };
  }
  
  // Si pas de clé configurée, autoriser mais avertir
  if (!config.key) {
    console.warn('[LICENSE] ⚠️ Aucune clé de licence configurée');
    // En production sans clé, on bloque
    if (process.env.NODE_ENV === 'production') {
      return {
        valid: false,
        error: 'Clé de licence manquante. Configurez LICENSE_KEY dans .env',
      };
    }
    // En dev, on autorise
    return {
      valid: true,
      details: { licensee: 'Non configuré (dev)' },
    };
  }
  
  // 2. Vérifier le format de la clé
  if (!config.key.match(/^MED-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/)) {
    return {
      valid: false,
      error: 'Format de clé de licence invalide',
    };
  }
  
  // 3. Vérifier le domaine si fourni
  if (currentDomain) {
    const domain = currentDomain.toLowerCase().replace(/:\d+$/, ''); // Enlever le port
    const isAllowedDomain = config.domains.some(d => 
      domain === d || 
      domain.endsWith(`.${d}`) ||
      d === 'localhost' && (domain === 'localhost' || domain === '127.0.0.1')
    );
    
    if (!isAllowedDomain) {
      return {
        valid: false,
        error: `Domaine non autorisé: ${domain}. Domaines autorisés: ${config.domains.join(', ')}`,
      };
    }
  }
  
  // 4. Vérifier la date d'expiration
  if (config.expiryDate) {
    const now = new Date();
    const daysRemaining = Math.ceil((config.expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (now > config.expiryDate) {
      return {
        valid: false,
        error: `Licence expirée le ${config.expiryDate.toLocaleDateString('fr-FR')}`,
      };
    }
    
    // Avertissement si proche de l'expiration (30 jours)
    if (daysRemaining <= 30) {
      console.warn(`[LICENSE] ⚠️ Attention: La licence expire dans ${daysRemaining} jours`);
    }
    
    return {
      valid: true,
      details: {
        expiresAt: config.expiryDate,
        daysRemaining,
      },
    };
  }
  
  // Licence valide sans date d'expiration
  return {
    valid: true,
    details: {
      licensee: 'Province de Médiouna',
    },
  };
}

/**
 * Vérifie la licence au démarrage de l'application (côté serveur)
 */
export function checkLicenseOnStartup(): void {
  const result = validateLicense();
  
  if (!result.valid) {
    console.error('╔══════════════════════════════════════════════════════════════╗');
    console.error('║                    ⛔ ERREUR DE LICENCE                       ║');
    console.error('╠══════════════════════════════════════════════════════════════╣');
    console.error(`║ ${result.error?.padEnd(62)}║`);
    console.error('╠══════════════════════════════════════════════════════════════╣');
    console.error('║ Contactez le développeur pour obtenir une licence valide.   ║');
    console.error('╚══════════════════════════════════════════════════════════════╝');
    
    // En production, on pourrait arrêter l'application
    // process.exit(1);
  } else {
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║                    ✅ LICENCE VALIDE                          ║');
    console.log('╚══════════════════════════════════════════════════════════════╝');
    
    if (result.details?.daysRemaining) {
      console.log(`   📅 Expire dans ${result.details.daysRemaining} jours`);
    }
  }
}

// ============================================
// MIDDLEWARE POUR NEXT.JS
// ============================================

/**
 * Vérification de licence pour les API routes
 * Utilisation: 
 *   const licenseCheck = verifyLicenseMiddleware(request);
 *   if (!licenseCheck.valid) return NextResponse.json({ error: licenseCheck.error }, { status: 403 });
 */
export function verifyLicenseMiddleware(request: Request): LicenseValidation {
  const url = new URL(request.url);
  return validateLicense(url.hostname);
}

// ============================================
// UTILITAIRES
// ============================================

/**
 * Génère les variables d'environnement pour une nouvelle licence
 */
export function generateLicenseEnvVars(
  clientName: string,
  domains: string[],
  expiryDays: number = 365
): string {
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + expiryDays);
  
  const key = generateLicenseKey(clientName, domains, expiryDate);
  
  return `
# ============================================
# LICENCE - Générée le ${new Date().toLocaleDateString('fr-FR')}
# Client: ${clientName}
# ============================================
LICENSE_KEY="${key}"
LICENSE_DOMAINS="${domains.join(',')}"
LICENSE_EXPIRY="${expiryDate.toISOString().split('T')[0]}"
`;
}

export default {
  validateLicense,
  generateLicenseKey,
  checkLicenseOnStartup,
  verifyLicenseMiddleware,
  generateLicenseEnvVars,
};
