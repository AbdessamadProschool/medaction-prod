/**
 * Logging Middleware - Capture automatiquement les requêtes API importantes
 * À intégrer dans les routes API critiques
 */

import { NextRequest, NextResponse } from 'next/server';
import { SystemLogger } from './system-logger';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';

/**
 * Log une requête API
 */
export async function logApiRequest(
  req: NextRequest, 
  action: string,
  entityType: string,
  entityId?: number | string
) {
  try {
    const session = await getServerSession(authOptions);
    const urlPath = new URL(req.url).pathname;
    
    const message = entityId 
      ? `${action} ${entityType} #${entityId}`
      : `${action} ${entityType}`;
    
    SystemLogger.info('api', message, {
      path: urlPath,
      method: req.method,
      user: session?.user?.email || 'anonymous',
      entityType,
      entityId,
    });
  } catch (error) {
    // Silencieux - ne pas bloquer l'opération
  }
}

/**
 * Log les connexions/déconnexions
 */
export function logAuth(action: 'login' | 'logout' | 'login_failed', email: string, details?: Record<string, unknown>) {
  const level = action === 'login_failed' ? 'warning' : 'info';
  const message = {
    login: `Connexion réussie: ${email}`,
    logout: `Déconnexion: ${email}`,
    login_failed: `Échec de connexion: ${email}`,
  }[action];
  
  SystemLogger[level]('auth', message, { email, ...details });
}

/**
 * Log les opérations de base de données importantes
 */
export function logDatabase(operation: string, details?: Record<string, unknown>) {
  SystemLogger.info('database', operation, details);
}

/**
 * Log les erreurs d'envoi d'email
 */
export function logEmail(success: boolean, to: string, subject: string, error?: string) {
  if (success) {
    SystemLogger.info('mail', `Email envoyé à ${to}: ${subject}`);
  } else {
    SystemLogger.error('mail', `Échec envoi email à ${to}: ${error}`, { to, subject, error });
  }
}

/**
 * Log les opérations de cache
 */
export function logCache(operation: 'hit' | 'miss' | 'invalidate', key: string) {
  SystemLogger.debug('cache', `Cache ${operation}: ${key}`, { operation, key });
}

/**
 * Log les validations importantes
 */
export function logValidation(entity: string, entityId: number, action: 'validate' | 'reject', by: string) {
  const message = action === 'validate' 
    ? `${entity} #${entityId} validé par ${by}`
    : `${entity} #${entityId} rejeté par ${by}`;
  
  SystemLogger.info('validation', message, { entity, entityId, action, by });
}
