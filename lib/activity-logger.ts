import { prisma } from '@/lib/db';
import { headers } from 'next/headers';

// Types d'actions courantes
export type ActivityAction = 
  | 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW' 
  | 'LOGIN' | 'LOGOUT' | 'LOGIN_FAILED'
  | 'VALIDATE' | 'REJECT' | 'ASSIGN'
  | 'EXPORT' | 'IMPORT' | 'EXPORT_LOGS'
  | 'UPDATE_PERMISSIONS' | 'CHANGE_ROLE'
  | 'UPLOAD' | 'DOWNLOAD'
  | 'SEND_EMAIL' | 'SEND_NOTIFICATION'
  | string;

// Types d'entités courantes
export type ActivityEntity = 
  | 'User' | 'Reclamation' | 'Evenement' | 'Actualite' 
  | 'Etablissement' | 'Commune' | 'Annexe' | 'Province'
  | 'Notification' | 'ActivityLog' | 'Permission' | 'UserPermission'
  | string;

interface LogActivityOptions {
  userId?: number | null;
  action: ActivityAction;
  entity: ActivityEntity;
  entityId?: number | null;
  details?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

/**
 * Enregistre une activité dans les logs
 * 
 * @example
 * await logActivity({
 *   userId: session.user.id,
 *   action: 'CREATE',
 *   entity: 'Reclamation',
 *   entityId: reclamation.id,
 *   details: { titre: reclamation.titre }
 * });
 */
export async function logActivity(options: LogActivityOptions): Promise<void> {
  try {
    // Essayer de récupérer l'IP et User-Agent depuis les headers
    let ipAddress = options.ipAddress;
    let userAgent = options.userAgent;
    
    try {
      const headersList = headers();
      if (!ipAddress) {
        ipAddress = headersList.get('x-forwarded-for')?.split(',')[0] 
          || headersList.get('x-real-ip') 
          || null;
      }
      if (!userAgent) {
        userAgent = headersList.get('user-agent') || null;
      }
    } catch (e) {
      // Headers non disponibles (contexte non-server)
    }

    await prisma.activityLog.create({
      data: {
        userId: options.userId || null,
        action: options.action,
        entity: options.entity,
        entityId: options.entityId || null,
        details: options.details as object || undefined,
        ipAddress,
        userAgent,
      }
    });
  } catch (error) {
    console.error('Erreur lors du logging:', error);
    // Ne pas faire échouer l'opération principale à cause d'une erreur de log
  }
}

/**
 * Helper pour logger les actions CRUD
 */
export const ActivityLogger = {
  async create(userId: number | null, entity: ActivityEntity, entityId: number, details?: Record<string, unknown>) {
    await logActivity({ userId, action: 'CREATE', entity, entityId, details });
  },

  async update(userId: number | null, entity: ActivityEntity, entityId: number, details?: Record<string, unknown>) {
    await logActivity({ userId, action: 'UPDATE', entity, entityId, details });
  },

  async delete(userId: number | null, entity: ActivityEntity, entityId: number, details?: Record<string, unknown>) {
    await logActivity({ userId, action: 'DELETE', entity, entityId, details });
  },

  async validate(userId: number | null, entity: ActivityEntity, entityId: number, details?: Record<string, unknown>) {
    await logActivity({ userId, action: 'VALIDATE', entity, entityId, details });
  },

  async reject(userId: number | null, entity: ActivityEntity, entityId: number, details?: Record<string, unknown>) {
    await logActivity({ userId, action: 'REJECT', entity, entityId, details });
  },

  async login(userId: number, details?: Record<string, unknown>) {
    await logActivity({ userId, action: 'LOGIN', entity: 'User', entityId: userId, details });
  },

  async logout(userId: number) {
    await logActivity({ userId, action: 'LOGOUT', entity: 'User', entityId: userId });
  },

  async loginFailed(email: string, ipAddress?: string) {
    await logActivity({ 
      action: 'LOGIN_FAILED', 
      entity: 'User', 
      details: { email },
      ipAddress 
    });
  },

  async export(userId: number | null, entity: ActivityEntity, count: number, format: string) {
    await logActivity({ 
      userId, 
      action: 'EXPORT', 
      entity, 
      details: { count, format } 
    });
  },

  async custom(options: LogActivityOptions) {
    await logActivity(options);
  }
};

/**
 * Nettoyage automatique des anciens logs
 * Configure pour garder uniquement les 30 derniers jours
 */
export async function cleanupOldActivityLogs(daysToKeep: number = 30): Promise<number> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await prisma.activityLog.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    if (result.count > 0) {
      console.log(`[ActivityCleanup] ${result.count} logs supprimés (> ${daysToKeep} jours)`);
    }
    return result.count;
  } catch (error) {
    console.error('Erreur cleanup activity logs:', error);
    return 0;
  }
}

/**
 * Nettoyer si la table dépasse un seuil (protection anti-surcharge)
 * Garde 80% du max quand le seuil est atteint
 */
export async function cleanupIfExceedsLimit(maxLogs: number = 10000): Promise<number> {
  try {
    const count = await prisma.activityLog.count();
    
    if (count > maxLogs) {
      // Supprimer les plus anciens pour revenir à 80% du max
      const targetCount = Math.floor(maxLogs * 0.8);
      const toDelete = count - targetCount;

      // Récupérer l'ID limite
      const oldestToKeep = await prisma.activityLog.findFirst({
        orderBy: { createdAt: 'desc' },
        skip: targetCount,
        select: { id: true },
      });

      if (oldestToKeep) {
        const result = await prisma.activityLog.deleteMany({
          where: {
            id: { lt: oldestToKeep.id },
          },
        });
        console.log(`[ActivityCleanup] ${result.count} logs supprimés (limite ${maxLogs} atteinte)`);
        return result.count;
      }
    }
    return 0;
  } catch (error) {
    console.error('Erreur cleanup limit activity logs:', error);
    return 0;
  }
}

/**
 * Obtenir le nombre total de logs
 */
export async function getActivityLogCount(): Promise<number> {
  try {
    return await prisma.activityLog.count();
  } catch (error) {
    console.error('Erreur count activity logs:', error);
    return 0;
  }
}

export default ActivityLogger;
