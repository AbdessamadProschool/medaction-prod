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

/**
 * GET /api/mobile/reclamations
 * Returns user's reclamations with pagination
 */
export async function GET(request: NextRequest) {
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

    // 3. Parse query params
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50);
    const status = searchParams.get('status');

    // 4. Build query
    const where: any = { userId };
    if (status) {
      where.statut = status;
    }

    // 5. Get reclamations
    const [reclamations, total] = await Promise.all([
      prisma.reclamation.findMany({
        where,
        select: {
          id: true,
          titre: true,
          description: true,
          statut: true,
          categorie: true,
          medias: {
            select: {
              id: true,
              urlPublique: true,
              type: true,
            },
          },
          latitude: true,
          longitude: true,
          createdAt: true,
          updatedAt: true,
          etablissement: {
            select: {
              id: true,
              nom: true,
              secteur: true,
            },
          },
          commune: {
            select: {
              id: true,
              nom: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.reclamation.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: reclamations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('[MOBILE_RECLAMATIONS_GET_ERROR]', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/mobile/reclamations
 * Creates a new reclamation
 */
export async function POST(request: NextRequest) {
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

    const { titre, description, categorie, etablissementId, communeId, latitude, longitude, photos } = body;

    // 4. Validate required fields
    if (!titre || !description) {
      return NextResponse.json(
        { success: false, message: 'Titre et description requis' },
        { status: 400 }
      );
    }

    if (!etablissementId && !communeId) {
      return NextResponse.json(
        { success: false, message: 'Établissement ou commune requis' },
        { status: 400 }
      );
    }

    // 5. Create reclamation
    const reclamation = await prisma.reclamation.create({
      data: {
        titre,
        description,
        categorie: categorie || 'AUTRE',
        userId,
        etablissementId: etablissementId ? parseInt(etablissementId) : undefined,
        communeId: communeId ? parseInt(communeId) : 1, // Default commune
        latitude: latitude ? parseFloat(latitude) : undefined,
        longitude: longitude ? parseFloat(longitude) : undefined,
        // Note: Les photos sont gérées via l'endpoint /api/upload et la relation medias
        // statut null = en attente de décision admin
      },
      select: {
        id: true,
        titre: true,
        description: true,
        statut: true,
        categorie: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Réclamation créée avec succès',
        data: reclamation,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[MOBILE_RECLAMATIONS_CREATE_ERROR]', error);
    return NextResponse.json(
      { success: false, message: 'Erreur lors de la création de la réclamation' },
      { status: 500 }
    );
  }
}
