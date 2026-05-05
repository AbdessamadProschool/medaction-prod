import { NextResponse } from 'next/server';
import * as fs from 'fs/promises';
import * as path from 'path';

// GET /api/maintenance - Vérifier l'état du mode maintenance
export async function GET() {
  try {
    const SETTINGS_FILE = path.join(process.cwd(), 'data', 'settings.json');
    const data = await fs.readFile(SETTINGS_FILE, 'utf-8');
    const settings = JSON.parse(data);
    
    const generalSettings = settings.general || {};
    const maintenanceMode = generalSettings.modeMaintenance || false;
    const siteName = generalSettings.nomPlateforme || 'Portail Mediouna';
    const siteDescription = generalSettings.description || '';

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

