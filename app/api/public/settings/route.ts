import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * GET /api/public/settings
 * Récupère les paramètres publics du site (pas de données sensibles)
 */
export async function GET() {
  try {
    const generalSetting = await prisma.systemSetting.findUnique({
      where: { key: 'general' }
    });

    const generalValues = (generalSetting?.value as Record<string, any>) || {};

    return NextResponse.json({
      siteName: generalValues.siteName || 'Portail Mediouna',
      siteDescription: generalValues.siteDescription || 'Plateforme citoyenne pour la province de Médiouna',
      registrationEnabled: generalValues.registrationEnabled !== false,
      maintenanceMode: generalValues.maintenanceMode || false,
    });
  } catch (error) {
    console.error('Erreur GET /api/public/settings:', error);
    // En cas d'erreur, retourner des valeurs par défaut
    return NextResponse.json({
      siteName: 'Portail Mediouna',
      siteDescription: 'Plateforme citoyenne pour la province de Médiouna',
      registrationEnabled: true,
      maintenanceMode: false,
    });
  }
}
