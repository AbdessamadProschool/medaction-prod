import { NextResponse } from 'next/server';
import * as fs from 'fs/promises';
import * as path from 'path';
import { performanceCache, CACHE_TTL, cacheKey } from '@/lib/cache/performance-cache';

// Revalidation toutes les 60 secondes (ISR) — le mode maintenance change rarement
export const revalidate = 60;

// GET /api/maintenance - Vérifier l'état du mode maintenance
export async function GET() {
  try {
    const data = await performanceCache.getOrFetch(
      cacheKey.maintenance(),
      async () => {
        const SETTINGS_FILE = path.join(process.cwd(), 'data', 'settings.json');
        const raw = await fs.readFile(SETTINGS_FILE, 'utf-8');
        const settings = JSON.parse(raw);
        const generalSettings = settings.general || {};
        return {
          maintenanceMode: generalSettings.modeMaintenance || false,
          siteName: generalSettings.nomPlateforme || 'Portail Mediouna',
          siteDescription: generalSettings.description || '',
        };
      },
      CACHE_TTL.MAINTENANCE
    );

    return NextResponse.json(
      {
        ...data,
        message: data.maintenanceMode
          ? 'Le site est actuellement en maintenance. Veuillez réessayer plus tard.'
          : null,
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=60, s-maxage=60, stale-while-revalidate=120',
        },
      }
    );
  } catch (error: any) {
    console.error('Erreur GET /api/maintenance:', error?.message || error);
    // En cas d'erreur, ne pas bloquer le site
    return NextResponse.json(
      {
        maintenanceMode: false,
        siteName: 'PORTAIL MEDIOUNA',
        siteDescription: '',
        message: null,
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=30, s-maxage=30',
        },
      }
    );
  }
}
