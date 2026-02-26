/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║          LOGGER DE SÉCURITÉ STRUCTURÉ                                       ║
 * ║                    Portail Mediouna Action                                   ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 * 
 * Logger centralisé pour les événements de sécurité.
 * Génère des logs structurés en JSON pour faciliter l'analyse.
 */

import { prisma } from '@/lib/db';

// ============================================
// TYPES
// ============================================

export type SecurityEventLevel = 'info' | 'warn' | 'error' | 'critical';

export type SecurityEventType = 
  // Authentification
  | 'AUTH_LOGIN_SUCCESS'
  | 'AUTH_LOGIN_FAILED'
  | 'AUTH_LOGIN_BLOCKED'
  | 'AUTH_LOGOUT'
  | 'AUTH_REGISTER_SUCCESS'
  | 'AUTH_REGISTER_FAILED'
  | 'AUTH_PASSWORD_RESET_REQUEST'
  | 'AUTH_PASSWORD_RESET_SUCCESS'
  | 'AUTH_2FA_ENABLED'
  | 'AUTH_2FA_VERIFIED'
  | 'AUTH_2FA_FAILED'
  // API
  | 'API_INVALID_KEY'
  | 'API_RATE_LIMIT'
  | 'API_UNAUTHORIZED'
  | 'API_FORBIDDEN'
  // CAPTCHA
  | 'CAPTCHA_REQUIRED'
  | 'CAPTCHA_FAILED'
  | 'CAPTCHA_VERIFIED'
  // Données
  | 'DATA_EXPORT'
  | 'DATA_IMPORT'
  | 'DATA_DELETE'
  | 'DATA_MODIFICATION'
  // Admin
  | 'ADMIN_ACTION'
  | 'ADMIN_USER_CREATED'
  | 'ADMIN_USER_DELETED'
  | 'ADMIN_ROLE_CHANGED'
  | 'ADMIN_SETTINGS_CHANGED'
  // Système
  | 'SYSTEM_ERROR'
  | 'SYSTEM_STARTUP'
  | 'SYSTEM_MAINTENANCE';

export interface SecurityLogEntry {
  type: SecurityEventType;
  level?: SecurityEventLevel;
  ip?: string;
  userId?: number;
  email?: string;
  userAgent?: string;
  action?: string;
  resource?: string;
  resourceId?: string | number;
  details?: Record<string, unknown>;
  success?: boolean;
  message?: string;
}

interface StructuredLog {
  timestamp: string;
  level: SecurityEventLevel;
  type: SecurityEventType;
  ip: string;
  userId: number | null;
  email: string | null;
  userAgent: string | null;
  action: string | null;
  resource: string | null;
  resourceId: string | null;
  success: boolean;
  message: string;
  details: Record<string, unknown>;
  environment: string;
  version: string;
}

// ============================================
// CONFIGURATION
// ============================================

const LOG_LEVEL_PRIORITY: Record<SecurityEventLevel, number> = {
  info: 0,
  warn: 1,
  error: 2,
  critical: 3,
};

const LOG_TYPE_LEVELS: Partial<Record<SecurityEventType, SecurityEventLevel>> = {
  AUTH_LOGIN_BLOCKED: 'warn',
  AUTH_LOGIN_FAILED: 'warn',
  API_INVALID_KEY: 'warn',
  API_RATE_LIMIT: 'warn',
  CAPTCHA_FAILED: 'warn',
  API_UNAUTHORIZED: 'warn',
  API_FORBIDDEN: 'error',
  AUTH_REGISTER_FAILED: 'warn',
  SYSTEM_ERROR: 'error',
  ADMIN_USER_DELETED: 'warn',
  DATA_DELETE: 'warn',
};

// Niveau de log minimum à afficher (basé sur LOG_LEVEL env var)
const minLogLevel = (process.env.LOG_LEVEL || 'info') as SecurityEventLevel;

// ============================================
// FONCTIONS UTILITAIRES
// ============================================

/**
 * Masque les données sensibles pour l'affichage dans les logs
 */
function maskSensitiveData(data: Record<string, unknown>): Record<string, unknown> {
  const sensitiveKeys = ['password', 'token', 'secret', 'apiKey', 'authorization'];
  const masked = { ...data };
  
  for (const key of Object.keys(masked)) {
    if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk.toLowerCase()))) {
      masked[key] = '***MASKED***';
    }
  }
  
  return masked;
}

/**
 * Masque partiellement un email
 */
function maskEmail(email: string | undefined): string | null {
  if (!email) return null;
  const [local, domain] = email.split('@');
  if (!domain) return email;
  return `${local.substring(0, 2)}***@${domain}`;
}

/**
 * Masque partiellement une IP
 */
function maskIP(ip: string | undefined): string {
  if (!ip) return 'unknown';
  const parts = ip.split('.');
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.***.***`;
  }
  return ip.substring(0, Math.min(8, ip.length)) + '***';
}

// ============================================
// LOGGER PRINCIPAL
// ============================================

class SecurityLogger {
  private static instance: SecurityLogger;
  
  private constructor() {}
  
  public static getInstance(): SecurityLogger {
    if (!SecurityLogger.instance) {
      SecurityLogger.instance = new SecurityLogger();
    }
    return SecurityLogger.instance;
  }
  
  /**
   * Log un événement de sécurité
   */
  async log(entry: SecurityLogEntry): Promise<void> {
    const level = entry.level || LOG_TYPE_LEVELS[entry.type] || 'info';
    
    // Vérifier le niveau de log minimum
    if (LOG_LEVEL_PRIORITY[level] < LOG_LEVEL_PRIORITY[minLogLevel]) {
      return;
    }
    
    const structuredLog: StructuredLog = {
      timestamp: new Date().toISOString(),
      level,
      type: entry.type,
      ip: maskIP(entry.ip),
      userId: entry.userId || null,
      email: maskEmail(entry.email),
      userAgent: entry.userAgent?.substring(0, 100) || null,
      action: entry.action || null,
      resource: entry.resource || null,
      resourceId: entry.resourceId?.toString() || null,
      success: entry.success ?? true,
      message: entry.message || this.getDefaultMessage(entry.type),
      details: maskSensitiveData(entry.details || {}),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
    };
    
    // Log vers la console (JSON structuré)
    this.logToConsole(structuredLog);
    
    // Log vers la base de données (async, ne bloque pas)
    this.logToDatabase(entry, structuredLog).catch(err => {
      console.error('[SECURITY_LOGGER] Erreur sauvegarde DB:', err);
    });
    
    // Alertes pour les événements critiques
    if (level === 'critical') {
      this.sendCriticalAlert(structuredLog);
    }
  }
  
  /**
   * Log vers la console
   */
  private logToConsole(log: StructuredLog): void {
    const prefix = this.getLevelPrefix(log.level);
    const shortLog = `${prefix} [${log.type}] ${log.message} | IP: ${log.ip}${log.email ? ` | User: ${log.email}` : ''}`;
    
    switch (log.level) {
      case 'critical':
      case 'error':
        console.error(shortLog);
        if (process.env.NODE_ENV === 'development') {
          console.error(JSON.stringify(log, null, 2));
        }
        break;
      case 'warn':
        console.warn(shortLog);
        break;
      default:
        console.log(shortLog);
    }
  }
  
  /**
   * Log vers la base de données
   */
  private async logToDatabase(entry: SecurityLogEntry, log: StructuredLog): Promise<void> {
    try {
      await prisma.activityLog.create({
        data: {
          userId: entry.userId || null,
          action: entry.type,
          entity: entry.resource || 'Security',
          entityId: entry.resourceId ? parseInt(String(entry.resourceId)) : 0,
          details: {
            ...log.details,
            ip: log.ip,
            userAgent: log.userAgent,
            level: log.level,
            success: log.success,
            message: log.message,
          },
        },
      });
    } catch (error) {
      // Ne pas propager l'erreur pour ne pas bloquer l'application
      console.error('[SECURITY_LOGGER] DB Error:', error);
    }
  }
  
  /**
   * Envoie une alerte pour les événements critiques
   */
  private sendCriticalAlert(log: StructuredLog): void {
    // TODO: Implémenter l'envoi d'alertes (email, Slack, etc.)
    console.error('🚨 ALERTE CRITIQUE:', JSON.stringify(log, null, 2));
  }
  
  /**
   * Retourne le préfixe du niveau de log
   */
  private getLevelPrefix(level: SecurityEventLevel): string {
    switch (level) {
      case 'critical': return '🚨';
      case 'error': return '❌';
      case 'warn': return '⚠️';
      default: return 'ℹ️';
    }
  }
  
  /**
   * Retourne un message par défaut pour chaque type d'événement
   */
  private getDefaultMessage(type: SecurityEventType): string {
    const messages: Record<SecurityEventType, string> = {
      AUTH_LOGIN_SUCCESS: 'Connexion réussie',
      AUTH_LOGIN_FAILED: 'Échec de connexion',
      AUTH_LOGIN_BLOCKED: 'Connexion bloquée - trop de tentatives',
      AUTH_LOGOUT: 'Déconnexion',
      AUTH_REGISTER_SUCCESS: 'Inscription réussie',
      AUTH_REGISTER_FAILED: 'Échec d\'inscription',
      AUTH_PASSWORD_RESET_REQUEST: 'Demande de réinitialisation de mot de passe',
      AUTH_PASSWORD_RESET_SUCCESS: 'Mot de passe réinitialisé',
      AUTH_2FA_ENABLED: '2FA activé',
      AUTH_2FA_VERIFIED: '2FA vérifié',
      AUTH_2FA_FAILED: 'Échec de vérification 2FA',
      API_INVALID_KEY: 'Clé API invalide',
      API_RATE_LIMIT: 'Limite de requêtes atteinte',
      API_UNAUTHORIZED: 'Accès non autorisé',
      API_FORBIDDEN: 'Accès interdit',
      CAPTCHA_REQUIRED: 'CAPTCHA requis',
      CAPTCHA_FAILED: 'Échec de vérification CAPTCHA',
      CAPTCHA_VERIFIED: 'CAPTCHA vérifié',
      DATA_EXPORT: 'Export de données',
      DATA_IMPORT: 'Import de données',
      DATA_DELETE: 'Suppression de données',
      DATA_MODIFICATION: 'Modification de données',
      ADMIN_ACTION: 'Action administrative',
      ADMIN_USER_CREATED: 'Utilisateur créé par admin',
      ADMIN_USER_DELETED: 'Utilisateur supprimé',
      ADMIN_ROLE_CHANGED: 'Rôle utilisateur modifié',
      ADMIN_SETTINGS_CHANGED: 'Paramètres système modifiés',
      SYSTEM_ERROR: 'Erreur système',
      SYSTEM_STARTUP: 'Démarrage de l\'application',
      SYSTEM_MAINTENANCE: 'Mode maintenance',
    };
    
    return messages[type] || type;
  }
  
  // ============================================
  // MÉTHODES RACCOURCIES
  // ============================================
  
  info(entry: Omit<SecurityLogEntry, 'level'>): Promise<void> {
    return this.log({ ...entry, level: 'info' });
  }
  
  warn(entry: Omit<SecurityLogEntry, 'level'>): Promise<void> {
    return this.log({ ...entry, level: 'warn' });
  }
  
  error(entry: Omit<SecurityLogEntry, 'level'>): Promise<void> {
    return this.log({ ...entry, level: 'error' });
  }
  
  critical(entry: Omit<SecurityLogEntry, 'level'>): Promise<void> {
    return this.log({ ...entry, level: 'critical' });
  }
}

// Export singleton
export const securityLogger = SecurityLogger.getInstance();

export default securityLogger;
