import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { authenticator } from 'otplib';
import * as QRCode from 'qrcode';
import { randomBytes } from 'crypto';
import bcrypt from 'bcryptjs';

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
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
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
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    if (user.twoFactorEnabled) {
      return NextResponse.json({ 
        error: 'L\'authentification à deux facteurs est déjà activée' 
      }, { status: 400 });
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

    return NextResponse.json({
      message: 'Secret 2FA généré avec succès',
      data: {
        secret,
        qrCode: qrCodeDataUrl,
        // Retourner les codes EN CLAIR à l'utilisateur (une seule fois!)
        backupCodes: plainBackupCodes,
        otpauthUrl,
      }
    });

  } catch (error) {
    console.error('Erreur activation 2FA:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE - Désactiver le 2FA
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const userId = parseInt(session.user.id);
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
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    if (!user.twoFactorEnabled) {
      return NextResponse.json({ 
        error: 'L\'authentification à deux facteurs n\'est pas activée' 
      }, { status: 400 });
    }

    // Vérifier le code 2FA
    if (user.twoFactorSecret) {
      const isValid = authenticator.verify({
        token: code,
        secret: user.twoFactorSecret,
      });

      if (!isValid) {
        return NextResponse.json({ error: 'Code 2FA invalide' }, { status: 400 });
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
    await prisma.activityLog.create({
      data: {
        userId,
        action: 'DISABLE_2FA',
        entity: 'User',
        entityId: userId,
      }
    });

    return NextResponse.json({
      message: 'Authentification à deux facteurs désactivée'
    });

  } catch (error) {
    console.error('Erreur désactivation 2FA:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// GET - Statut 2FA de l'utilisateur
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
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
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    return NextResponse.json({
      enabled: user.twoFactorEnabled,
      pending: !user.twoFactorEnabled && !!user.twoFactorSecret,
    });

  } catch (error) {
    console.error('Erreur statut 2FA:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
