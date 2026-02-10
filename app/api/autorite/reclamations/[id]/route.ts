import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';

// GET - Détail d'une réclamation affectée
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    if (session.user.role !== 'AUTORITE_LOCALE') {
      return NextResponse.json({ error: 'Accès réservé aux autorités locales' }, { status: 403 });
    }

    const reclamationId = parseInt(params.id);
    const autoriteId = parseInt(session.user.id);

    const reclamation = await prisma.reclamation.findFirst({
      where: {
        id: reclamationId,
        affecteeAAutoriteId: autoriteId,
      },
      include: {
        user: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            telephone: true,
            email: true,
          }
        },
        commune: {
          select: { id: true, nom: true }
        },
        etablissement: {
          select: { id: true, nom: true, secteur: true }
        },
        medias: {
          select: { id: true, urlPublique: true, type: true }
        },
        historique: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      }
    });

    if (!reclamation) {
      return NextResponse.json({ error: 'Réclamation non trouvée' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: reclamation,
    });

  } catch (error) {
    console.error('Erreur détail réclamation:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
