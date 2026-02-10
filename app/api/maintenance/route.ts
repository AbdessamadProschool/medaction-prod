import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET /api/maintenance - Vérifier l'état du mode maintenance
export async function GET() {
  try {
    // Récupérer le paramètre de maintenance
    const setting = await prisma.systemSetting.findUnique({
      where: { key: 'general' },
    });

    const generalSettings = (setting?.value as Record<string, any>) || {};
    const maintenanceMode = generalSettings.maintenanceMode || false;
    const siteName = generalSettings.siteName || 'Portail Mediouna';
    const siteDescription = generalSettings.siteDescription || '';

    return NextResponse.json({
      maintenanceMode,
      siteName,
      siteDescription,
      message: maintenanceMode 
        ? 'Le site est actuellement en maintenance. Veuillez réessayer plus tard.' 
        : null,
    });

  } catch (error: any) {
    console.error('Erreur GET /api/maintenance:', error?.message || error);
    // En cas d'erreur, ne pas bloquer le site
    return NextResponse.json({
      maintenanceMode: false,
      siteName: 'PORTAIL MEDIOUNA',
      siteDescription: '',
      message: null,
    });
  }
}

