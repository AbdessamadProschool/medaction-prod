import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { StatutSuggestion } from '@prisma/client';

// GET /api/suggestions/[id] - Détail d'une suggestion
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    const suggestion = await prisma.suggestion.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true,
          },
        },
      },
    });

    if (!suggestion) {
      return NextResponse.json(
        { error: 'Suggestion non trouvée' },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: suggestion });
  } catch (error) {
    console.error('Erreur GET /api/suggestions/[id]:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE /api/suggestions/[id] - Supprimer sa propre suggestion
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const id = parseInt(params.id);
    const userId = parseInt(session.user.id);
    const role = session.user.role;

    const suggestion = await prisma.suggestion.findUnique({
      where: { id },
    });

    if (!suggestion) {
      return NextResponse.json(
        { error: 'Suggestion non trouvée' },
        { status: 404 }
      );
    }

    // Vérifier les permissions (propriétaire ou admin)
    const canDelete =
      suggestion.userId === userId ||
      role === 'ADMIN' ||
      role === 'SUPER_ADMIN';

    if (!canDelete) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    // Ne pas permettre la suppression des suggestions approuvées ou implémentées (sauf pour les admins)
    if (
      role !== 'SUPER_ADMIN' && 
      role !== 'ADMIN' && 
      ['APPROUVEE', 'IMPLEMENTEE'].includes(suggestion.statut)
    ) {
      return NextResponse.json(
        { error: 'Cette suggestion ne peut plus être supprimée car elle a été traitée' },
        { status: 400 }
      );
    }

    await prisma.suggestion.delete({ where: { id } });

    return NextResponse.json({ message: 'Suggestion supprimée' });
  } catch (error) {
    console.error('Erreur DELETE /api/suggestions/[id]:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
