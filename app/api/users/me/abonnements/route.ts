import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';

// GET - Obtenir les abonnements de l'utilisateur connecté
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const skip = (page - 1) * limit;

    const [abonnements, total] = await Promise.all([
      prisma.abonnementEtablissement.findMany({
        where: { userId: parseInt(session.user.id) },
        include: {
          etablissement: {
            select: {
              id: true,
              nom: true,
              adresseComplete: true,
              secteur: true,
              photoPrincipale: true,
              commune: { select: { nom: true } },
              _count: {
                select: {
                  evenements: true,
                  actualites: true,
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.abonnementEtablissement.count({
        where: { userId: parseInt(session.user.id) }
      })
    ]);

    // Récupérer les IDs des établissements pour un accès rapide
    const etablissementIds = abonnements.map(a => a.etablissementId);

    return NextResponse.json({
      data: abonnements,
      etablissementIds, // Pour vérification rapide côté client
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      }
    });
  } catch (error) {
    console.error('Erreur récupération abonnements utilisateur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
