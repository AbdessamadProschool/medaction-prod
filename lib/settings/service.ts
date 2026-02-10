import { prisma } from '@/lib/db';

// Types des settings système
export interface GeneralSettings {
  siteName: string;
  siteDescription: string;
  maintenanceMode: boolean;
  registrationEnabled: boolean;
  emailVerificationRequired: boolean;
}

export interface SecuritySettings {
  maxLoginAttempts: number;
  lockoutDuration: number; // en minutes
  sessionTimeout: number; // en minutes
  require2FA: boolean;
  passwordMinLength: number;
}

export interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  adminAlerts: boolean;
  reclamationAlerts: boolean;
}

export interface ReclamationSettings {
  autoAssignEnabled: boolean;
  maxFileSize: number;
  allowedFileTypes: string[];
  urgentThreshold: number;
  autoCloseAfterDays: number;
}

export interface AllSettings {
  general: GeneralSettings;
  security: SecuritySettings;
  notifications: NotificationSettings;
  reclamations: ReclamationSettings;
}

// Valeurs par défaut
const DEFAULT_SETTINGS: AllSettings = {
  general: {
    siteName: 'Portail Mediouna',
    siteDescription: 'Plateforme citoyenne pour la province de Médiouna',
    maintenanceMode: false,
    registrationEnabled: true,
    emailVerificationRequired: true,
  },
  security: {
    maxLoginAttempts: 5,
    lockoutDuration: 15, // 15 minutes
    sessionTimeout: 30, // 30 minutes
    require2FA: false,
    passwordMinLength: 8,
  },
  notifications: {
    emailNotifications: true,
    pushNotifications: true,
    adminAlerts: true,
    reclamationAlerts: true,
  },
  reclamations: {
    autoAssignEnabled: false,
    maxFileSize: 10,
    allowedFileTypes: ['jpg', 'png', 'pdf', 'doc'],
    urgentThreshold: 24,
    autoCloseAfterDays: 30,
  },
};

// Cache des settings (pour éviter de requêter la DB à chaque appel)
let settingsCache: AllSettings | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 60 * 1000; // 1 minute

/**
 * Récupère tous les paramètres système depuis la base de données
 * Utilise un cache pour limiter les requêtes DB
 */
export async function getSystemSettings(): Promise<AllSettings> {
  const now = Date.now();
  
  // Retourner le cache s'il est encore valide
  if (settingsCache && (now - cacheTimestamp) < CACHE_DURATION) {
    return settingsCache;
  }

  try {
    const dbSettings = await prisma.systemSetting.findMany();
    
    // Merger les settings de la DB avec les valeurs par défaut
    const settings: AllSettings = { ...DEFAULT_SETTINGS };
    
    for (const setting of dbSettings) {
      const value = setting.value as Record<string, any>;
      
      switch (setting.key) {
        case 'general':
          settings.general = { ...DEFAULT_SETTINGS.general, ...value };
          break;
        case 'security':
          settings.security = { ...DEFAULT_SETTINGS.security, ...value };
          break;
        case 'notifications':
          settings.notifications = { ...DEFAULT_SETTINGS.notifications, ...value };
          break;
        case 'reclamations':
          settings.reclamations = { ...DEFAULT_SETTINGS.reclamations, ...value };
          break;
      }
    }

    // Mettre en cache
    settingsCache = settings;
    cacheTimestamp = now;
    
    return settings;
  } catch (error) {
    console.error('Erreur chargement settings:', error);
    return DEFAULT_SETTINGS;
  }
}

/**
 * Récupère les paramètres de sécurité seulement
 */
export async function getSecuritySettings(): Promise<SecuritySettings> {
  const settings = await getSystemSettings();
  return settings.security;
}

/**
 * Récupère les paramètres généraux seulement
 */
export async function getGeneralSettings(): Promise<GeneralSettings> {
  const settings = await getSystemSettings();
  return settings.general;
}

/**
 * Invalide le cache (à appeler après une mise à jour des settings)
 */
export function invalidateSettingsCache(): void {
  settingsCache = null;
  cacheTimestamp = 0;
}

/**
 * Vérifie si le mode maintenance est actif
 */
export async function isMaintenanceModeActive(): Promise<boolean> {
  const settings = await getGeneralSettings();
  return settings.maintenanceMode;
}

/**
 * Vérifie si l'inscription est activée
 */
export async function isRegistrationEnabled(): Promise<boolean> {
  const settings = await getGeneralSettings();
  return settings.registrationEnabled;
}
