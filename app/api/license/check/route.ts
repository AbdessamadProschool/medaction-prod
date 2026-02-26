import { NextRequest, NextResponse } from 'next/server';
import { validateLicense } from '@/lib/license';

/**
 * GET /api/license/check
 * Vérifie la validité de la licence pour le domaine actuel
 */
export async function GET(request: NextRequest) {
  try {
    const host = request.headers.get('host') || 'localhost';
    const result = validateLicense(host);
    
    return NextResponse.json({
      valid: result.valid,
      error: result.error,
      daysRemaining: result.details?.daysRemaining,
    });
  } catch (error) {
    console.error('Erreur vérification licence:', error);
    // En cas d'erreur, autoriser pour ne pas bloquer l'application
    return NextResponse.json({ valid: true });
  }
}
