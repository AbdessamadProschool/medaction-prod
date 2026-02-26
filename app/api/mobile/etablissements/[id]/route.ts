import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import {
  validateMobileApiKey,
  unauthorizedResponse,
} from '@/lib/mobile/security';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/mobile/etablissements/[id]
 * Returns etablissement details
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // 1. Validate API Key
    if (!validateMobileApiKey(request)) {
      return unauthorizedResponse();
    }

    const { id } = await params;
    const etablissementId = parseInt(id);

    if (isNaN(etablissementId)) {
      return NextResponse.json(
        { success: false, message: 'ID invalide' },
        { status: 400 }
      );
    }

    // 2. Get etablissement
    const etablissement = await prisma.etablissement.findUnique({
      where: { id: etablissementId },
      include: {
        commune: {
          select: {
            id: true,
            nom: true,
          },
        },
        annexe: {
          select: {
            id: true,
            nom: true,
          },
        },
        evenements: {
          where: {
            statut: 'PUBLIEE',
            dateDebut: { gte: new Date() },
          },
          select: {
            id: true,
            titre: true,
            dateDebut: true,
            dateFin: true,
            lieu: true,
          },
          orderBy: { dateDebut: 'asc' },
          take: 5,
        },
        _count: {
          select: {
            evaluations: true,
            reclamations: true,
            evenements: true,
          },
        },
      },
    });

    if (!etablissement) {
      return NextResponse.json(
        { success: false, message: 'Établissement non trouvé' },
        { status: 404 }
      );
    }

    // 3. Get average rating
    const evaluations = await prisma.evaluation.aggregate({
      where: { etablissementId },
      _avg: { noteGlobale: true },
      _count: true,
    });

    return NextResponse.json({
      success: true,
      data: {
        ...etablissement,
        avgRating: evaluations._avg?.noteGlobale ?? 0,
        reviewCount: evaluations._count,
      },
    });
  } catch (error) {
    console.error('[MOBILE_ETABLISSEMENT_DETAIL_ERROR]', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
