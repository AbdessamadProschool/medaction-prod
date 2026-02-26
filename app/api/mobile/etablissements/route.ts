import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import {
  validateMobileApiKey,
  unauthorizedResponse,
} from '@/lib/mobile/security';

/**
 * GET /api/mobile/etablissements
 * Returns list of etablissements with optional filtering
 * Public endpoint (no auth required, but API key is required)
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Validate API Key
    if (!validateMobileApiKey(request)) {
      return unauthorizedResponse();
    }

    // 2. Parse query params
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const secteur = searchParams.get('secteur');
    const communeId = searchParams.get('communeId');
    const search = searchParams.get('search');

    // 3. Build query
    const where: any = {};
    
    if (secteur) {
      where.secteur = secteur;
    }
    
    if (communeId) {
      where.communeId = parseInt(communeId);
    }
    
    if (search) {
      where.OR = [
        { nom: { contains: search, mode: 'insensitive' } },
        { adresseComplete: { contains: search, mode: 'insensitive' } },
      ];
    }

    // 4. Get etablissements
    const [etablissements, total] = await Promise.all([
      prisma.etablissement.findMany({
        where,
        select: {
          id: true,
          nom: true,
          secteur: true,
          typeEtablissement: true,
          adresseComplete: true,
          quartierDouar: true,
          photoPrincipale: true,
          latitude: true,
          longitude: true,
          commune: {
            select: {
              id: true,
              nom: true,
            },
          },
          _count: {
            select: {
              evaluations: true,
              reclamations: true,
              evenements: true,
            },
          },
        },
        orderBy: { nom: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.etablissement.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: etablissements,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('[MOBILE_ETABLISSEMENTS_ERROR]', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
