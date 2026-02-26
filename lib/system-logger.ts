/**
 * Système de Logging Dynamique - MedAction
 * 
 * Stratégie:
 * - Logs système: Ring buffer en mémoire (pas de BD)
 * - Logs activité: Table ActivityLog avec nettoyage automatique
 * - Limite: 500 logs système en mémoire, 30 jours d'historique pour activités
 */

type LogLevel = 'info' | 'warning' | 'error' | 'debug';

interface SystemLogEntry {
  id: string;
  timestamp: Date;
  level: LogLevel;
  message: string;
  source: string;
  details?: Record<string, unknown>;
}

// Ring Buffer pour les logs système (max 500 entrées en mémoire)
class SystemLogBuffer {
  private logs: SystemLogEntry[] = [];
  private maxSize: number = 500;
  private idCounter: number = 0;

  add(entry: Omit<SystemLogEntry, 'id' | 'timestamp'>): SystemLogEntry {
    const logEntry: SystemLogEntry = {
      id: `SYS_${Date.now()}_${++this.idCounter}`,
      timestamp: new Date(),
      ...entry,
    };

    this.logs.push(logEntry);
    
    // Remove oldest if exceeds max size (ring buffer)
    if (this.logs.length > this.maxSize) {
      this.logs.shift();
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      const prefix = {
        info: '📘',
        warning: '⚠️',
        error: '❌',
        debug: '🔍',
      }[entry.level];
      console.log(`${prefix} [${entry.source}] ${entry.message}`);
    }

    return logEntry;
  }

  getAll(): SystemLogEntry[] {
    return [...this.logs].reverse(); // Most recent first
  }

  getFiltered(options: {
    level?: LogLevel;
    source?: string;
    limit?: number;
    page?: number;
  }): { logs: SystemLogEntry[]; total: number } {
    let filtered = [...this.logs].reverse();

    if (options.level) {
      filtered = filtered.filter(l => l.level === options.level);
    }

    if (options.source) {
      filtered = filtered.filter(l => 
        l.source.toLowerCase().includes(options.source!.toLowerCase())
      );
    }

    const total = filtered.length;
    const page = options.page || 1;
    const limit = options.limit || 50;
    const start = (page - 1) * limit;
    
    return {
      logs: filtered.slice(start, start + limit),
      total,
    };
  }

  getStats() {
    return {
      total: this.logs.length,
      info: this.logs.filter(l => l.level === 'info').length,
      warning: this.logs.filter(l => l.level === 'warning').length,
      error: this.logs.filter(l => l.level === 'error').length,
      debug: this.logs.filter(l => l.level === 'debug').length,
    };
  }

  clear() {
    this.logs = [];
    this.idCounter = 0;
  }
}

// Singleton instance
const systemLogBuffer = new SystemLogBuffer();

// Public API
export const SystemLogger = {
  /**
   * Log an info message
   */
  info(source: string, message: string, details?: Record<string, unknown>) {
    return systemLogBuffer.add({ level: 'info', source, message, details });
  },

  /**
   * Log a warning message
   */
  warning(source: string, message: string, details?: Record<string, unknown>) {
    return systemLogBuffer.add({ level: 'warning', source, message, details });
  },

  /**
   * Log an error message
   */
  error(source: string, message: string, details?: Record<string, unknown>) {
    return systemLogBuffer.add({ level: 'error', source, message, details });
  },

  /**
   * Log a debug message
   */
  debug(source: string, message: string, details?: Record<string, unknown>) {
    return systemLogBuffer.add({ level: 'debug', source, message, details });
  },

  /**
   * Get all logs (most recent first)
   */
  getAll() {
    return systemLogBuffer.getAll();
  },

  /**
   * Get filtered logs with pagination
   */
  getFiltered(options: {
    level?: LogLevel;
    source?: string;
    limit?: number;
    page?: number;
  }) {
    return systemLogBuffer.getFiltered(options);
  },

  /**
   * Get statistics
   */
  getStats() {
    return systemLogBuffer.getStats();
  },

  /**
   * Clear all logs
   */
  clear() {
    systemLogBuffer.clear();
  },
};

// Initialize with startup log
if (typeof window === 'undefined') {
  // Server-side only
  SystemLogger.info('system', 'Application démarrée avec succès');
}

export type { LogLevel, SystemLogEntry };
