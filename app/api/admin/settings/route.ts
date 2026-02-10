import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { withErrorHandler } from '@/lib/api-handler';
import { UnauthorizedError, ForbiddenError, ValidationError } from '@/lib/exceptions';
import * as fs from 'fs/promises';
import * as path from 'path';

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

// Sections valides
const VALID_SECTIONS = ['general', 'notifications', 'security', 'email'] as const;

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
async function saveSettings(settings: typeof DEFAULT_SETTINGS) {
  const dir = path.dirname(SETTINGS_FILE);
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch {
    // Le dossier existe peut-être déjà
  }
  await fs.writeFile(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf-8');
}

// GET /api/admin/settings - Récupérer les paramètres
export const GET = withErrorHandler(async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    throw new UnauthorizedError('Vous devez être connecté pour accéder aux paramètres');
  }

  // Seuls les admins peuvent accéder aux paramètres
  if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role || '')) {
    throw new ForbiddenError('Accès réservé aux administrateurs');
  }

  const settings = await getSettings();

  return NextResponse.json({
    success: true,
    data: settings,
  });
});

// PUT /api/admin/settings - Mettre à jour les paramètres
export const PUT = withErrorHandler(async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    throw new UnauthorizedError('Vous devez être connecté pour modifier les paramètres');
  }

  // Seuls les SUPER_ADMIN peuvent modifier les paramètres
  if (session.user.role !== 'SUPER_ADMIN') {
    throw new ForbiddenError('Seul le Super Administrateur peut modifier les paramètres système');
  }

  const body = await request.json();
  const { section, data } = body;

  // Validation
  const errors: Array<{ field: string; message: string }> = [];

  if (!section) {
    errors.push({ field: 'section', message: 'La section à modifier est obligatoire' });
  } else if (!VALID_SECTIONS.includes(section)) {
    errors.push({ 
      field: 'section', 
      message: `Section invalide. Sections acceptées: ${VALID_SECTIONS.join(', ')}` 
    });
  }

  if (!data || typeof data !== 'object') {
    errors.push({ field: 'data', message: 'Les données de mise à jour sont obligatoires' });
  }

  if (errors.length > 0) {
    throw new ValidationError(
      errors.length === 1 ? errors[0].message : `${errors.length} erreurs de validation`,
      { fieldErrors: errors.reduce((acc, e) => ({ ...acc, [e.field]: [e.message] }), {}) }
    );
  }

  // Récupérer les paramètres actuels
  const currentSettings = await getSettings();

  // Mettre à jour la section spécifiée
  currentSettings[section as keyof typeof DEFAULT_SETTINGS] = {
    ...currentSettings[section as keyof typeof DEFAULT_SETTINGS],
    ...data,
  };

  // Sauvegarder
  await saveSettings(currentSettings);

  return NextResponse.json({
    success: true,
    message: 'Paramètres mis à jour avec succès',
    data: currentSettings,
  });
});
