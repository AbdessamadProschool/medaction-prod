import { NextRequest, NextResponse } from 'next/server';
import { decode } from 'next-auth/jwt';
import { prisma } from '@/lib/db';
import {
  validateMobileApiKey,
  unauthorizedResponse,
} from '@/lib/mobile/security';

/**
 * Helper to extract user from token
 */
async function getAuthenticatedUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.substring(7);
  
  try {
    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret) return null;
    
    const decoded = await decode({ token, secret });
    if (!decoded || !decoded.id) return null;
    
    return decoded;
  } catch (error) {
    return null;
  }
}

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/mobile/reclamations/[id]
 * Returns a specific reclamation details
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // 1. Validate API Key
    if (!validateMobileApiKey(request)) {
      return unauthorizedResponse();
    }

    // 2. Authenticate user
    const tokenData = await getAuthenticatedUser(request);
    if (!tokenData) {
      return NextResponse.json(
        { success: false, message: 'Non authentifié', error: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const userId = parseInt(tokenData.id as string);
    const { id } = await params;
    const reclamationId = parseInt(id);

    if (isNaN(reclamationId)) {
      return NextResponse.json(
        { success: false, message: 'ID invalide' },
        { status: 400 }
      );
    }

    // 3. Get reclamation
    const reclamation = await prisma.reclamation.findUnique({
      where: { id: reclamationId },
      include: {
        etablissement: {
          select: {
            id: true,
            nom: true,
            secteur: true,
            adresseComplete: true,
            photoPrincipale: true,
          },
        },
        commune: {
          select: {
            id: true,
            nom: true,
          },
        },
        historique: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!reclamation) {
      return NextResponse.json(
        { success: false, message: 'Réclamation non trouvée' },
        { status: 404 }
      );
    }

    // 4. Check ownership (user can only see their own reclamations)
    if (reclamation.userId !== userId) {
      // Check if user is admin
      const userRole = tokenData.role as string;
      const isAdmin = ['ADMIN', 'SUPER_ADMIN', 'AUTORITE_LOCALE', 'DELEGATION'].includes(userRole);
      
      if (!isAdmin) {
        return NextResponse.json(
          { success: false, message: 'Accès refusé' },
          { status: 403 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      data: reclamation,
    });
  } catch (error) {
    console.error('[MOBILE_RECLAMATION_GET_ERROR]', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
