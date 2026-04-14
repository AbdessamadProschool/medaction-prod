import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';

// GET - Liste des autorités locales (filtrage par commune)
// Utilisé par les admins pour affectation
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Vérifier permissions (Admin ou Super Admin)
    if (!session?.user || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    const searchParams = req.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const communeIdRaw = searchParams.get('communeId');
    const communeId = communeIdRaw ? parseInt(communeIdRaw) : undefined;
    
    if (communeIdRaw && isNaN(communeId as number)) {
      return NextResponse.json({ error: 'ID Commune invalide' }, { status: 400 });
    }

    // Construire le filtre
    const where: import('@prisma/client').Prisma.UserWhereInput = {
      role: 'AUTORITE_LOCALE',
      isActive: true,
    };

    // Si communeId spécifié, filtrer par commune
    if (communeId !== undefined) {
      where.communeResponsableId = communeId;
    }

    const autorites = await prisma.user.findMany({
      where,
      take: limit,
      select: {
        id: true,
        nom: true,
        prenom: true,
        email: true,
        photo: true,
        communeResponsableId: true,
        communeResponsable: {
          select: {
            id: true,
            nom: true,
            nomArabe: true,
            population: true,
          }
        }
      },
      orderBy: [
        { communeResponsable: { nom: 'asc' } },
        { nom: 'asc' }
      ]
    });

    return NextResponse.json({
      success: true,
      data: autorites,
      count: autorites.length,
    });

  } catch (error) {
    console.error('Error fetching autorites locales:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
