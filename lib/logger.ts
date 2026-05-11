/**
 * Centralized Logging System for MedAction
 * 
 * Provides structured logging with levels, context, and export capabilities.
 * Can be extended to send logs to external services like:
 * - Datadog
 * - Logflare
 * - Logtail
 * - AWS CloudWatch
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: string;
  userId?: number;
  sessionId?: string;
  requestId?: string;
  metadata?: Record<string, unknown>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

interface LoggerOptions {
  context?: string;
  userId?: number;
  sessionId?: string;
  requestId?: string;
}

class Logger {
  private context?: string;
  private userId?: number;
  private sessionId?: string;
  private requestId?: string;
  private logLevel: LogLevel;
  
  private static readonly LOG_LEVELS: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
    fatal: 4,
  };

  constructor(options: LoggerOptions = {}) {
    this.context = options.context;
    this.userId = options.userId;
    this.sessionId = options.sessionId;
    this.requestId = options.requestId;
    this.logLevel = (process.env.LOG_LEVEL as LogLevel) || 'info';
  }

  private shouldLog(level: LogLevel): boolean {
    return Logger.LOG_LEVELS[level] >= Logger.LOG_LEVELS[this.logLevel];
  }

  private formatLog(level: LogLevel, message: string, metadata?: Record<string, unknown>, error?: Error): LogEntry {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context: this.context,
      userId: this.userId,
      sessionId: this.sessionId,
      requestId: this.requestId,
      metadata,
    };

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }

    return entry;
  }

  private output(entry: LogEntry) {
    const jsonLog = JSON.stringify(entry);
    
    // Development: Pretty print
    if (process.env.NODE_ENV === 'development') {
      const colors = {
        debug: '\x1b[36m', // Cyan
        info: '\x1b[32m',  // Green
        warn: '\x1b[33m',  // Yellow
        error: '\x1b[31m', // Red
        fatal: '\x1b[35m', // Magenta
      };
      const reset = '\x1b[0m';
      const color = colors[entry.level];
      
      console.log(`${color}[${entry.level.toUpperCase()}]${reset} ${entry.message}`, 
        entry.metadata ? entry.metadata : '',
        entry.error ? `\n${entry.error.stack}` : ''
      );
    } else {
      // Production: JSON structured logs
      console.log(jsonLog);
    }

    // Send to external service if configured
    this.sendToExternalService(entry);
  }

  private async sendToExternalService(entry: LogEntry) {
    // Logflare integration
    if (process.env.LOGFLARE_API_KEY && process.env.LOGFLARE_SOURCE_ID) {
      try {
        await fetch(`https://api.logflare.app/logs/json?source=${process.env.LOGFLARE_SOURCE_ID}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-KEY': process.env.LOGFLARE_API_KEY,
          },
          body: JSON.stringify({ batch: [entry] }),
        });
      } catch {
        // Silent fail for logging
      }
    }
  }

  debug(message: string, metadata?: Record<string, unknown>) {
    if (this.shouldLog('debug')) {
      this.output(this.formatLog('debug', message, metadata));
    }
  }

  info(message: string, metadata?: Record<string, unknown>) {
    if (this.shouldLog('info')) {
      this.output(this.formatLog('info', message, metadata));
    }
  }

  warn(message: string, metadata?: Record<string, unknown>) {
    if (this.shouldLog('warn')) {
      this.output(this.formatLog('warn', message, metadata));
    }
  }

  error(message: string, error?: Error, metadata?: Record<string, unknown>) {
    if (this.shouldLog('error')) {
      this.output(this.formatLog('error', message, metadata, error));
    }
  }

  fatal(message: string, error?: Error, metadata?: Record<string, unknown>) {
    if (this.shouldLog('fatal')) {
      this.output(this.formatLog('fatal', message, metadata, error));
    }
  }

  // Create a child logger with additional context
  child(options: LoggerOptions): Logger {
    return new Logger({
      context: options.context || this.context,
      userId: options.userId || this.userId,
      sessionId: options.sessionId || this.sessionId,
      requestId: options.requestId || this.requestId,
    });
  }
}

// Default logger instance
export const logger = new Logger({ context: 'app' });

// Factory for creating contextual loggers
export function createLogger(context: string, options?: Omit<LoggerOptions, 'context'>): Logger {
  return new Logger({ context, ...options });
}

/**
 * Prune old audit logs based on retention period
 * @param retentionMonths Number of months to keep logs
 */
export async function cleanupAuditLogs(retentionMonths: number = 12) {
  if (typeof window !== 'undefined') return { success: false, error: 'Server-side only' };

  try {
    const { prisma } = await import('@/lib/db');
    const cutOffDate = new Date();
    cutOffDate.setMonth(cutOffDate.getMonth() - retentionMonths);

    const result = await prisma.auditLog.deleteMany({
      where: {
        createdAt: {
          lt: cutOffDate
        }
      }
    });

    // Log the cleanup action itself
    await auditLog({
      action: 'SYSTEM_CLEANUP',
      resource: 'AUDIT_LOG',
      resourceId: 'all',
      userId: 0, // System action
      details: {
        retentionMonths,
        deletedCount: result.count,
        cutOffDate: cutOffDate.toISOString()
      },
      status: 'SUCCESS'
    });

    return { success: true, deletedCount: result.count };
  } catch (error) {
    console.error('Failed to cleanup audit logs:', error);
    return { success: false, error };
  }
}

// API Request logger middleware helper
export function logApiRequest(
  method: string,
  path: string,
  statusCode: number,
  duration: number,
  userId?: number
) {
  const log = createLogger('api');
  
  if (statusCode >= 500) {
    log.error(`${method} ${path} - ${statusCode}`, undefined, { duration, userId });
  } else if (statusCode >= 400) {
    log.warn(`${method} ${path} - ${statusCode}`, { duration, userId });
  } else {
    log.info(`${method} ${path} - ${statusCode}`, { duration, userId });
  }
}

// Audit log for sensitive operations
export async function auditLog(
  arg1: any,
  arg2?: string,
  arg3?: string | number,
  arg4?: string | number,
  arg5?: any
) {
  let action: string;
  let resource: string;
  let resourceId: string;
  let userId: string | number;
  let details: any = null;
  let status: 'SUCCESS' | 'FAILURE' = 'SUCCESS';
  let ipAddress: string | null = null;
  let userAgent: string | null = null;
  let previousValue: any = null;
  let newValue: any = null;

  if (typeof arg1 === 'object' && arg1 !== null && !Array.isArray(arg1)) {
    // New signature: auditLog({ action, resource, ... })
    const options = arg1;
    action = options.action;
    resource = options.resource;
    resourceId = String(options.resourceId);
    userId = options.userId;
    details = options.details;
    status = options.status || 'SUCCESS';
    ipAddress = options.ipAddress || null;
    userAgent = options.userAgent || null;
    previousValue = options.previousValue;
    newValue = options.newValue;
  } else {
    // Old signature: auditLog(action, entityType, entityId, userId, details)
    action = arg1;
    resource = arg2 || 'UNKNOWN';
    resourceId = String(arg3 || '0');
    userId = arg4 || 0;
    details = arg5 || null;
  }

  const log = createLogger('audit');
  log.info(`${action} - ${resource}:${resourceId}`, {
    action,
    resource,
    resourceId,
    userId,
    status,
    ...details,
  });

  // Persist to database if running on server
  if (typeof window === 'undefined') {
    try {
      const { prisma } = await import('@/lib/db');
      
      const parsedUserId = typeof userId === 'string' ? parseInt(userId) : userId;

      await prisma.auditLog.create({
        data: {
          action,
          resourceType: resource,
          resourceId: String(resourceId),
          userId: isNaN(parsedUserId) ? 0 : parsedUserId,
          details: details ? (typeof details === 'string' ? details : JSON.stringify(details)) : null,
          success: status === 'SUCCESS',
          ipAddress,
          userAgent,
          previousValue: previousValue ? (typeof previousValue === 'string' ? previousValue : JSON.stringify(previousValue)) : null,
          newValue: newValue ? (typeof newValue === 'string' ? newValue : JSON.stringify(newValue)) : null,
        },
      });
    } catch (error) {
      console.error('Failed to persist audit log:', error);
    }
  }
}

export default Logger;
