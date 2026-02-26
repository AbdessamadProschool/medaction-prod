import { NextRequest, NextResponse } from 'next/server';
import { encode, decode } from 'next-auth/jwt';
import {
  validateMobileApiKey,
  unauthorizedResponse,
} from '@/lib/mobile/security';
import { prisma } from '@/lib/db';

/**
 * POST /api/auth/mobile/refresh
 * Refreshes a JWT token if it's still valid
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Validate Mobile API Key
    if (!validateMobileApiKey(request)) {
      return unauthorizedResponse();
    }

    // 2. Get token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: 'Token requis', error: 'TOKEN_MISSING' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const secret = process.env.NEXTAUTH_SECRET;
    
    if (!secret) {
      throw new Error('NEXTAUTH_SECRET not defined');
    }

    // 3. Decode current token
    let decoded;
    try {
      decoded = await decode({ token, secret });
    } catch (e) {
      return NextResponse.json(
        { success: false, message: 'Token invalide ou expiré', error: 'TOKEN_INVALID' },
        { status: 401 }
      );
    }

    if (!decoded || !decoded.id) {
      return NextResponse.json(
        { success: false, message: 'Token invalide', error: 'TOKEN_INVALID' },
        { status: 401 }
      );
    }

    // 4. Verify user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: parseInt(decoded.id as string) },
      select: {
        id: true,
        email: true,
        nom: true,
        prenom: true,
        role: true,
        photo: true,
        isActive: true,
        isEmailVerifie: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Utilisateur non trouvé', error: 'USER_NOT_FOUND' },
        { status: 401 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { success: false, message: 'Compte désactivé', error: 'ACCOUNT_DISABLED' },
        { status: 403 }
      );
    }

    // 5. Generate new token with fresh expiry
    const newToken = await encode({
      token: {
        id: String(user.id),
        email: user.email,
        nom: user.nom,
        prenom: user.prenom,
        role: user.role,
        isActive: user.isActive,
        isEmailVerifie: user.isEmailVerifie,
      },
      secret: secret,
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return NextResponse.json({
      success: true,
      token: newToken,
      user: {
        id: user.id,
        email: user.email,
        nom: user.nom,
        prenom: user.prenom,
        role: user.role,
        photo: user.photo,
        isEmailVerifie: user.isEmailVerifie,
      },
    });
  } catch (error) {
    console.error('[MOBILE_REFRESH_ERROR]', error);
    return NextResponse.json(
      { success: false, message: 'Erreur lors du rafraîchissement du token' },
      { status: 500 }
    );
  }
}
