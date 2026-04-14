import { NextRequest } from 'next/server';
import { validateLicense } from '@/lib/license';
import { withErrorHandler, successResponse } from '@/lib/api-handler';
import { withPermission } from '@/lib/auth/api-guard';
import { ForbiddenError } from '@/lib/exceptions';

/**
 * GET /api/admin/license
 * Récupère les informations de licence (Super Admin uniquement)
 */
export const GET = withPermission('system.license.read', withErrorHandler(async (req: NextRequest, { session }) => {
  // Sécurité renforcée : Seul le super admin peut voir les détails de licence
  if (session.role !== 'SUPER_ADMIN') {
    throw new ForbiddenError('Accès réservé au Super Administrateur');
  }

  // Récupérer les infos de licence
  const licenseKey = process.env.LICENSE_KEY || '';
  const licenseDomains = process.env.LICENSE_DOMAINS || '';
  const licenseExpiry = process.env.LICENSE_EXPIRY || '';

  // Valider la licence
  const validation = validateLicense();

  // Masquer partiellement la clé
  const maskedKey = licenseKey 
    ? `${licenseKey.substring(0, 8)}****${licenseKey.substring(licenseKey.length - 4)}`
    : '';

  return successResponse({
    valid: validation.valid,
    error: validation.error,
    daysRemaining: validation.details?.daysRemaining,
    key: maskedKey,
    domains: licenseDomains ? licenseDomains.split(',').map(d => d.trim()) : [],
    expiryDate: licenseExpiry || null,
  }, 'Informations de licence récupérées');
}));
