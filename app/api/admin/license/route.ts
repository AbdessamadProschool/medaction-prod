import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { validateLicense } from '@/lib/license';

/**
 * GET /api/admin/license
 * Récupère les informations de licence (Super Admin uniquement)
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }
    
    if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
    }

    // Récupérer les infos de licence depuis les variables d'environnement
    const licenseKey = process.env.LICENSE_KEY || '';
    const licenseDomains = process.env.LICENSE_DOMAINS || '';
    const licenseExpiry = process.env.LICENSE_EXPIRY || '';

    // Valider la licence
    const validation = validateLicense();

    // Masquer partiellement la clé pour la sécurité
    const maskedKey = licenseKey 
      ? `${licenseKey.substring(0, 8)}****${licenseKey.substring(licenseKey.length - 4)}`
      : '';

    return NextResponse.json({
      valid: validation.valid,
      error: validation.error,
      daysRemaining: validation.details?.daysRemaining,
      key: maskedKey,
      domains: licenseDomains ? licenseDomains.split(',').map(d => d.trim()) : [],
      expiryDate: licenseExpiry || null,
    });
    
  } catch (error) {
    console.error('Erreur GET /api/admin/license:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
