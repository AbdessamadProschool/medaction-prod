import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { authenticator } from 'otplib';
import { ActivityLogger } from '@/lib/activity-logger';
import bcrypt from 'bcryptjs';
import { withErrorHandler, successResponse } from '@/lib/api-handler';
import { UnauthorizedError, ValidationError, NotFoundError } from '@/lib/exceptions';

// Configuration TOTP
authenticator.options = {
  window: 1, // Fenêtre de tolérance (±30s)
  step: 30,  // Durée de validité d'un code (30s)
};

// POST - Vérifier le code 2FA et activer si non activé
export const POST = withErrorHandler(async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    throw new UnauthorizedError('Non authentifié');
  }

  if (!request.headers.get('content-type')?.includes('application/json')) {
    throw new ValidationError('Content-Type must be application/json');
  }

  const body = await request.json();
  const { code } = body;

  // Si c'est un code de secours, il peut avoir des tirets et faire 9 chars (ex: XXXX-XXXX)
  // ou sans tiret (8 chars). Si TOTP, c'est 6 chiffres.
  if (!code || typeof code !== 'string') {
    throw new ValidationError('Code invalide');
  }

    const userId = parseInt(session.user.id);

    // Récupérer l'utilisateur
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        id: true, 
        email: true,
        twoFactorEnabled: true,
        twoFactorSecret: true,
        twoFactorBackupCodes: true,
      }
    });

  if (!user) {
    throw new NotFoundError('Utilisateur non trouvé');
  }

  if (!user.twoFactorSecret) {
    throw new ValidationError('Aucun secret 2FA configuré. Veuillez d\'abord activer le 2FA.');
  }

    // Vérifier le code TOTP
    const isValidTotp = authenticator.verify({
      token: code,
      secret: user.twoFactorSecret,
    });

  // Vérifier si c'est un code de secours
  let isBackupCode = false;
  let updatedBackupCodes: string[] | null = null;

  if (!isValidTotp && user.twoFactorBackupCodes) {
    try {
      const backupCodes: string[] = JSON.parse(user.twoFactorBackupCodes);
      const formattedCode = code.toUpperCase().replace(/[^A-Z0-9]/g, '');
      
      let codeIndex = -1;
      for (let i = 0; i < backupCodes.length; i++) {
        // SECURITY FIX: Compare string using bcrypt since they are hashed
        // Le code de secours en base de données peut être en clair (anciens comptes) ou hashé
        const isMatch = backupCodes[i].startsWith('$2') 
          ? await bcrypt.compare(formattedCode, backupCodes[i])
          : backupCodes[i].replace('-', '').toUpperCase() === formattedCode;

        if (isMatch) {
          codeIndex = i;
          break;
        }
      }
      
      if (codeIndex !== -1) {
        isBackupCode = true;
        // Retirer le code utilisé
        updatedBackupCodes = [...backupCodes];
        updatedBackupCodes.splice(codeIndex, 1);
      }
    } catch (e) {
      // Erreur parsing backup codes
    }
  }

  if (!isValidTotp && !isBackupCode) {
    // Log échec
    await ActivityLogger.custom({
      action: 'VERIFY_2FA_FAILED',
      entity: 'User',
      entityId: userId,
      userId
    });

    throw new ValidationError('Code invalide');
  }

    // Si 2FA non encore activé, l'activer maintenant
    if (!user.twoFactorEnabled) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          twoFactorEnabled: true,
          ...(updatedBackupCodes ? { twoFactorBackupCodes: JSON.stringify(updatedBackupCodes) } : {}),
        }
      });

      // Log activation
      await ActivityLogger.custom({
        action: 'ENABLE_2FA',
        entity: 'User',
        entityId: userId,
        userId
      });

    return successResponse({
      verified: true,
      activated: true,
    }, 'Authentification à deux facteurs activée avec succès');
  }

    // Si code de secours utilisé, mettre à jour la liste
    if (isBackupCode && updatedBackupCodes) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          twoFactorBackupCodes: JSON.stringify(updatedBackupCodes),
        }
      });

      // Log utilisation code de secours
      await ActivityLogger.custom({
        action: 'USE_BACKUP_CODE',
        entity: 'User',
        entityId: userId,
        details: { remainingCodes: updatedBackupCodes.length },
        userId
      });
    }

  return successResponse({
    verified: true,
    usedBackupCode: isBackupCode,
    remainingBackupCodes: updatedBackupCodes?.length,
  }, 'Code vérifié avec succès');
});
