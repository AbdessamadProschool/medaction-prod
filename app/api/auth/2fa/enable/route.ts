import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { authenticator } from 'otplib';
import * as QRCode from 'qrcode';
import { ActivityLogger } from '@/lib/activity-logger';
import { randomBytes } from 'crypto';
import bcrypt from 'bcryptjs';
import { withErrorHandler, successResponse } from '@/lib/api-handler';
import { UnauthorizedError, ValidationError, NotFoundError } from '@/lib/exceptions';

// Configuration TOTP
authenticator.options = {
  window: 1, // Fenêtre de tolérance (±30s)
  step: 30,  // Durée de validité d'un code (30s)
};

// SECURITY FIX: Générer des codes de secours et les hasher
async function generateBackupCodes(count: number = 8): Promise<{ plain: string[], hashed: string[] }> {
  const plainCodes: string[] = [];
  const hashedCodes: string[] = [];
  
  for (let i = 0; i < count; i++) {
    const code = randomBytes(4).toString('hex').toUpperCase();
    const plainCode = `${code.slice(0, 4)}-${code.slice(4)}`;
    plainCodes.push(plainCode);
    
    // Hash le code pour le stockage sécurisé
    const hashedCode = await bcrypt.hash(plainCode.replace('-', '').toUpperCase(), 10);
    hashedCodes.push(hashedCode);
  }
  
  return { plain: plainCodes, hashed: hashedCodes };
}

// POST - Activer le 2FA (génère le secret et le QR code)
export const POST = withErrorHandler(async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    throw new UnauthorizedError('Non authentifié');
  }

    if (!request.headers.get('content-type')?.includes('application/json') && request.headers.get('content-type') !== null) {
      // Allow empty body or application/json, wait, POST 2FA enable doesn't require a body actually, it just generates a secret.
      // But standard CSRF prevention should still be applied if we want.
      // Actually `request.json()` might fail if there's no body.
    }
    
  // Oh wait, if POST does not use request.json(), it still shouldn't accept form submissions.
  if (request.headers.get('content-type') === 'application/x-www-form-urlencoded' || request.headers.get('content-type')?.startsWith('multipart/form-data') || request.headers.get('content-type') === 'text/plain') {
      throw new ValidationError('Unsupported Media Type');
  }

    const userId = parseInt(session.user.id);

    // Vérifier si 2FA n'est pas déjà activé
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        id: true, 
        email: true, 
        twoFactorEnabled: true,
        twoFactorSecret: true 
      }
    });

  if (!user) {
    throw new NotFoundError('Utilisateur non trouvé');
  }

  if (user.twoFactorEnabled) {
    throw new ValidationError('L\'authentification à deux facteurs est déjà activée');
  }

    // Générer un nouveau secret TOTP
    const secret = authenticator.generateSecret();
    
    // SECURITY FIX: Générer les codes de secours (hashés pour stockage)
    const { plain: plainBackupCodes, hashed: hashedBackupCodes } = await generateBackupCodes(8);

    // Sauvegarder le secret et les codes HASHÉS (temporairement, en attente de vérification)
    await prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorSecret: secret,
        // SECURITY: Stocker les codes HASHÉS, pas les codes en clair
        twoFactorBackupCodes: JSON.stringify(hashedBackupCodes),
      }
    });

    // Générer l'URL TOTP pour l'app d'authentification
    const appName = 'Portail Mediouna';
    const otpauthUrl = authenticator.keyuri(user.email, appName, secret);

    // Générer le QR code en base64
    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl, {
      width: 256,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    });

  return successResponse({
    secret,
    qrCode: qrCodeDataUrl,
    // Retourner les codes EN CLAIR à l'utilisateur (une seule fois!)
    backupCodes: plainBackupCodes,
    otpauthUrl,
  }, 'Secret 2FA généré avec succès');
});

// DELETE - Désactiver le 2FA
export const DELETE = withErrorHandler(async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    throw new UnauthorizedError('Non authentifié');
  }

  const userId = parseInt(session.user.id);
  
  if (!request.headers.get('content-type')?.includes('application/json')) {
    throw new ValidationError('Content-Type must be application/json');
  }

    const body = await request.json();
    const { code, password } = body;

    // Récupérer l'utilisateur
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        id: true, 
        motDePasse: true,
        twoFactorEnabled: true,
        twoFactorSecret: true,
      }
    });

  if (!user) {
    throw new NotFoundError('Utilisateur non trouvé');
  }

  if (!user.twoFactorEnabled) {
    throw new ValidationError('L\'authentification à deux facteurs n\'est pas activée');
  }

    // Vérifier le code 2FA
    if (user.twoFactorSecret) {
      const isValid = authenticator.verify({
        token: code,
        secret: user.twoFactorSecret,
      });

    if (!isValid) {
      throw new ValidationError('Code 2FA invalide');
    }
  }

    // Désactiver le 2FA
    await prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorBackupCodes: null,
      }
    });

    // Log l'activité
    await ActivityLogger.custom({
      action: 'DISABLE_2FA',
      entity: 'User',
      entityId: userId,
      userId
    });

  return successResponse(null, 'Authentification à deux facteurs désactivée');
});

// GET - Statut 2FA de l'utilisateur
export const GET = withErrorHandler(async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    throw new UnauthorizedError('Non authentifié');
  }

    const userId = parseInt(session.user.id);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        twoFactorEnabled: true,
        twoFactorSecret: true,
      }
    });

  if (!user) {
    throw new NotFoundError('Utilisateur non trouvé');
  }

  return successResponse({
    enabled: user.twoFactorEnabled,
    pending: !user.twoFactorEnabled && !!user.twoFactorSecret,
  });
});
