import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { invalidateSettingsCache } from '@/lib/settings/service';
import { ActivityLogger } from '@/lib/activity-logger';
import { withErrorHandler, successResponse } from '@/lib/api-handler';
import { UnauthorizedError, ForbiddenError, ValidationError } from '@/lib/exceptions';

// Paramètres par défaut
const DEFAULT_SETTINGS = {
  general: {
    siteName: 'Portail Mediouna',
    siteDescription: 'Plateforme citoyenne pour la province de Mediouna',
    maintenanceMode: false,
    registrationEnabled: true,
    emailVerificationRequired: true,
  },
  security: {
    maxLoginAttempts: 5,
    lockoutDuration: 15, // en minutes
    sessionTimeout: 30,
    passwordMinLength: 8,
    require2FA: false,
    ipWhitelist: [],
  },
  notifications: {
    emailEnabled: true,
    smsEnabled: false,
    pushEnabled: true,
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


// GET /api/settings - Récupérer tous les paramètres
// GET /api/settings - Récupérer tous les paramètres
export const GET = withErrorHandler(async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    throw new UnauthorizedError('Non authentifié');
  }

  // Seul SUPER_ADMIN peut voir les paramètres
  if (session.user.role !== 'SUPER_ADMIN') {
    throw new ForbiddenError('Accès non autorisé');
  }

    // Récupérer tous les paramètres de la base de données
    const dbSettings = await prisma.systemSetting.findMany();
    
    // Construire l'objet des paramètres
    const settings: Record<string, any> = { ...DEFAULT_SETTINGS };
    
    for (const setting of dbSettings) {
      if (settings[setting.category]) {
        settings[setting.category] = {
          ...settings[setting.category],
          ...(setting.value as Record<string, any>),
        };
      } else {
        settings[setting.category] = setting.value;
      }
    }

  return successResponse(settings);
});

// PUT /api/settings - Mettre à jour les paramètres
// PUT /api/settings - Mettre à jour les paramètres
export const PUT = withErrorHandler(async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    throw new UnauthorizedError('Non authentifié');
  }

  // Seul SUPER_ADMIN peut modifier les paramètres
  if (session.user.role !== 'SUPER_ADMIN') {
    throw new ForbiddenError('Accès non autorisé');
  }

    const body = await request.json();
    const { general, security, notifications, reclamations } = body;

    // Upsert pour chaque catégorie
    const categories = [
      { key: 'general', category: 'general', value: general },
      { key: 'security', category: 'security', value: security },
      { key: 'notifications', category: 'notifications', value: notifications },
      { key: 'reclamations', category: 'reclamations', value: reclamations },
    ];

    for (const cat of categories) {
      if (cat.value) {
        await prisma.systemSetting.upsert({
          where: { key: cat.key },
          update: {
            value: cat.value,
            updatedById: parseInt(session.user.id),
          },
          create: {
            key: cat.key,
            category: cat.category,
            value: cat.value,
            description: `Paramètres ${cat.category}`,
            updatedById: parseInt(session.user.id),
          },
        });
      }
    }

    // Invalider le cache des settings
    invalidateSettingsCache();

  // Audit log
  await ActivityLogger.custom({
    action: 'UPDATE_SETTINGS',
    entity: 'System',
    entityId: 0,
    userId: parseInt(session.user.id),
    details: {
      categories: categories.filter(c => c.value).map(c => c.key)
    }
  });

    // Récupérer les paramètres mis à jour
    const updatedSettings = await prisma.systemSetting.findMany();
    
    // Construire la réponse
    const settings: Record<string, any> = { ...DEFAULT_SETTINGS };
    for (const setting of updatedSettings) {
      if (settings[setting.category]) {
        settings[setting.category] = {
          ...settings[setting.category],
          ...(setting.value as Record<string, any>),
        };
      }
    }

  return successResponse({
    settings,
  }, 'Paramètres mis à jour avec succès');
});

// PATCH /api/settings - Mettre à jour un paramètre spécifique
// PATCH /api/settings - Mettre à jour un paramètre spécifique
export const PATCH = withErrorHandler(async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    throw new UnauthorizedError('Non authentifié');
  }

  if (session.user.role !== 'SUPER_ADMIN') {
    throw new ForbiddenError('Accès non autorisé');
  }

    const body = await request.json();
    const { category, key, value } = body;

  if (!category || !key) {
    throw new ValidationError('Catégorie et clé requises');
  }

    // Récupérer le paramètre existant
    const existing = await prisma.systemSetting.findUnique({
      where: { key: category },
    });

    const currentValue = (existing?.value as Record<string, any>) || {};
    const newValue = { ...currentValue, [key]: value };

    // Mettre à jour
    const setting = await prisma.systemSetting.upsert({
      where: { key: category },
      update: {
        value: newValue,
        updatedById: parseInt(session.user.id),
      },
      create: {
        key: category,
        category,
        value: newValue,
        updatedById: parseInt(session.user.id),
      },
    });

  // Audit log
  await ActivityLogger.custom({
    action: 'PATCH_SETTING',
    entity: 'System',
    entityId: 0,
    userId: parseInt(session.user.id),
    details: {
      category,
      key,
      value
    }
  });

  return successResponse({
    setting,
  }, `Paramètre ${category}.${key} mis à jour`);
});
