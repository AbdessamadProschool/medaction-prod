import { NextRequest } from 'next/server';
import { withErrorHandler, successResponse } from '@/lib/api-handler';
import { ForbiddenError } from '@/lib/exceptions';
import { SecurityValidation } from '@/lib/security/validation';
import { withPermission } from '@/lib/auth/api-guard';
import * as fs from 'fs/promises';
import * as path from 'path';
import { z } from 'zod';

// Chemin du fichier de configuration
const SETTINGS_FILE = path.join(process.cwd(), 'data', 'settings.json');

// Paramètres par défaut
const DEFAULT_SETTINGS = {
  general: {
    nomPlateforme: 'Portail Mediouna - Province de Médiouna',
    description: 'Plateforme citoyenne de la Province de Médiouna',
    modeMaintenance: false,
  },
  notifications: {
    nouvelleReclamation: true,
    nouvelUtilisateur: true,
    rapportQuotidien: false,
  },
  security: {
    dureeSession: 24,
    tentativesConnexionMax: 5,
    doubleAuthentification: false,
  },
  email: {
    emailEnvoi: 'noreply@medaction.ma',
    emailContact: 'contact@provincemediouna.ma',
  },
};

// Schéma de validation pour la mise à jour des paramètres
const updateSettingsSchema = z.object({
  section: z.enum(['general', 'notifications', 'security', 'email']),
  data: z.record(z.string(), z.any()),
});

// Lire les paramètres
async function getSettings() {
  try {
    const data = await fs.readFile(SETTINGS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return DEFAULT_SETTINGS;
  }
}

// Sauvegarder les paramètres
async function saveSettings(settings: any) {
  const dir = path.dirname(SETTINGS_FILE);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf-8');
}

// GET /api/admin/settings - Récupérer les paramètres
export const GET = withPermission('system.settings.read', withErrorHandler(async (request: NextRequest) => {
  const settings = await getSettings();
  return successResponse(settings);
}));

// PUT /api/admin/settings - Mettre à jour les paramètres
export const PUT = withPermission('system.settings.edit', withErrorHandler(async (request: NextRequest, { session }) => {
  // Protection supplémentaire : seul le SUPER_ADMIN peut modifier les paramètres critiques
  if (session.user.role !== 'SUPER_ADMIN') {
    throw new ForbiddenError('Seul le Super Administrateur peut modifier les paramètres système');
  }

  const body = await request.json();
  const { section, data } = updateSettingsSchema.parse(body);

  const currentSettings = await getSettings();
  
  // Sanitisation basique
  const sanitizedData: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      sanitizedData[key] = SecurityValidation.sanitizeString(value);
    } else {
      sanitizedData[key] = value;
    }
  }

  currentSettings[section] = {
    ...currentSettings[section],
    ...sanitizedData,
  };

  await saveSettings(currentSettings);

  // Logging de sécurité
  SecurityValidation.logSecurityEvent('SUSPICIOUS_ACTIVITY', `System settings updated: section ${section} by ${session.user.email}`);

  return successResponse(currentSettings, 'Paramètres mis à jour avec succès');
}));
