import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { authenticator } from 'otplib';

// Configuration TOTP
authenticator.options = {
  window: 1, // Fenêtre de tolérance (±30s)
  step: 30,  // Durée de validité d'un code (30s)
};

// POST - Vérifier le code 2FA et activer si non activé
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const body = await request.json();
    const { code } = body;

    if (!code || typeof code !== 'string' || code.length !== 6) {
      return NextResponse.json({ error: 'Code invalide' }, { status: 400 });
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
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    if (!user.twoFactorSecret) {
      return NextResponse.json({ 
        error: 'Aucun secret 2FA configuré. Veuillez d\'abord activer le 2FA.' 
      }, { status: 400 });
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
        
        const codeIndex = backupCodes.findIndex(bc => 
          bc.replace('-', '').toUpperCase() === formattedCode
        );
        
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
      // Log tentative échouée
      await prisma.activityLog.create({
        data: {
          userId,
          action: 'VERIFY_2FA_FAILED',
          entity: 'User',
          entityId: userId,
        }
      });

      return NextResponse.json({ error: 'Code invalide' }, { status: 400 });
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
      await prisma.activityLog.create({
        data: {
          userId,
          action: 'ENABLE_2FA',
          entity: 'User',
          entityId: userId,
        }
      });

      return NextResponse.json({
        message: 'Authentification à deux facteurs activée avec succès',
        verified: true,
        activated: true,
      });
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
      await prisma.activityLog.create({
        data: {
          userId,
          action: 'USE_BACKUP_CODE',
          entity: 'User',
          entityId: userId,
          details: { remainingCodes: updatedBackupCodes.length }
        }
      });
    }

    return NextResponse.json({
      message: 'Code vérifié avec succès',
      verified: true,
      usedBackupCode: isBackupCode,
      remainingBackupCodes: updatedBackupCodes?.length,
    });

  } catch (error) {
    console.error('Erreur vérification 2FA:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
