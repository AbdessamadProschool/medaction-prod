import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { decode } from 'next-auth/jwt';
import {
  validateMobileApiKey,
  unauthorizedResponse,
} from '@/lib/mobile/security';

/**
 * Extracts and validates the JWT token from Authorization header
 */
async function getAuthenticatedUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.substring(7); // Remove 'Bearer ' prefix
  
  try {
    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret) {
      throw new Error('NEXTAUTH_SECRET not defined');
    }
    
    const decoded = await decode({ token, secret });
    if (!decoded || !decoded.id) {
      return null;
    }
    
    return decoded;
  } catch (error) {
    console.error('[TOKEN_DECODE_ERROR]', error);
    return null;
  }
}

/**
 * GET /api/auth/mobile/profile
 * Returns the authenticated user's profile
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Validate Mobile API Key
    if (!validateMobileApiKey(request)) {
      return unauthorizedResponse();
    }

    // 2. Get authenticated user from token
    const tokenData = await getAuthenticatedUser(request);
    if (!tokenData) {
      return NextResponse.json(
        { success: false, message: 'Non authentifié', error: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // 3. Fetch full user profile from database
    const user = await prisma.user.findUnique({
      where: { id: parseInt(tokenData.id as string) },
      select: {
        id: true,
        email: true,
        nom: true,
        prenom: true,
        telephone: true,
        photo: true,
        role: true,
        isActive: true,
        isEmailVerifie: true,
        isTelephoneVerifie: true,
        secteurResponsable: true,
        communeResponsableId: true,
        dateInscription: true,
        derniereConnexion: true,
        createdAt: true,
        updatedAt: true,
        communeResponsable: {
          select: {
            id: true,
            nom: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { success: false, message: 'Compte désactivé', error: 'ACCOUNT_DISABLED' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('[MOBILE_PROFILE_GET_ERROR]', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/auth/mobile/profile
 * Updates the authenticated user's profile
 */
export async function PATCH(request: NextRequest) {
  try {
    // 1. Validate Mobile API Key
    if (!validateMobileApiKey(request)) {
      return unauthorizedResponse();
    }

    // 2. Get authenticated user from token
    const tokenData = await getAuthenticatedUser(request);
    if (!tokenData) {
      return NextResponse.json(
        { success: false, message: 'Non authentifié', error: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // 3. Parse body
    const rawBody = await request.text();
    let body;
    try {
      body = JSON.parse(rawBody);
    } catch (e) {
      return NextResponse.json(
        { success: false, message: 'Format JSON invalide' },
        { status: 400 }
      );
    }

    const { nom, prenom, telephone } = body;

    // 4. Check if phone is already used by another user
    if (telephone) {
      const existingPhone = await prisma.user.findFirst({
        where: {
          telephone,
          id: { not: parseInt(tokenData.id as string) },
        },
      });

      if (existingPhone) {
        return NextResponse.json(
          { success: false, message: 'Ce numéro de téléphone est déjà utilisé' },
          { status: 409 }
        );
      }
    }

    // 5. Update user
    const updatedUser = await prisma.user.update({
      where: { id: parseInt(tokenData.id as string) },
      data: {
        ...(nom && { nom }),
        ...(prenom && { prenom }),
        ...(telephone !== undefined && { telephone }),
      },
      select: {
        id: true,
        email: true,
        nom: true,
        prenom: true,
        telephone: true,
        photo: true,
        role: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Profil mis à jour avec succès',
      data: updatedUser,
    });
  } catch (error) {
    console.error('[MOBILE_PROFILE_UPDATE_ERROR]', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
