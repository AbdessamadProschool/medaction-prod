import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { StatutSuggestion } from '@prisma/client';

// PATCH /api/suggestions/[id]/statut - Changer le statut (Admin uniquement)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Vérifier les permissions admin
    const role = session.user.role;
    if (!['ADMIN', 'SUPER_ADMIN'].includes(role)) {
      return NextResponse.json(
        { error: 'Accès réservé aux administrateurs' },
        { status: 403 }
      );
    }

    const id = parseInt(params.id);
    const body = await request.json();
    const { statut, reponseAdmin } = body;

    // Valider le statut
    const statutsValides: StatutSuggestion[] = [
      'SOUMISE',
      'EN_EXAMEN',
      'APPROUVEE',
      'REJETEE',
      'IMPLEMENTEE',
    ];

    if (!statut || !statutsValides.includes(statut)) {
      return NextResponse.json(
        { error: 'Statut invalide' },
        { status: 400 }
      );
    }

    // Vérifier que la suggestion existe
    const suggestionExistante = await prisma.suggestion.findUnique({
      where: { id },
      include: { user: { select: { id: true, nom: true, prenom: true } } },
    });

    if (!suggestionExistante) {
      return NextResponse.json(
        { error: 'Suggestion non trouvée' },
        { status: 404 }
      );
    }

    // Mettre à jour la suggestion
    const updateData: any = {
      statut,
      dateTraitement: new Date(),
    };

    if (reponseAdmin !== undefined) {
      updateData.reponseAdmin = reponseAdmin?.trim() || null;
    }

    const suggestion = await prisma.suggestion.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            nom: true,
            prenom: true,
          },
        },
      },
    });

    // Notifier l'utilisateur du changement de statut
    try {
      const statutLabels: Record<StatutSuggestion, string> = {
        SOUMISE: 'soumise',
        EN_EXAMEN: 'en cours d\'examen',
        APPROUVEE: 'approuvée',
        REJETEE: 'rejetée',
        IMPLEMENTEE: 'implémentée',
      };

      await prisma.notification.create({
        data: {
          userId: suggestionExistante.userId,
          type: 'SUGGESTION_STATUT',
          titre: `Suggestion ${statutLabels[statut as StatutSuggestion]}`,
          message: `Votre suggestion "${suggestionExistante.titre.substring(0, 50)}${suggestionExistante.titre.length > 50 ? '...' : ''}" a été ${statutLabels[statut as StatutSuggestion]}.${reponseAdmin ? ' Réponse : ' + reponseAdmin.substring(0, 100) + (reponseAdmin.length > 100 ? '...' : '') : ''}`,
          lien: `/suggestions`,
        },
      });
    } catch (notifError) {
      console.warn('Erreur notification suggestion statut:', notifError);
    }

    return NextResponse.json({
      data: suggestion,
      message: `Statut mis à jour : ${statut}`,
    });
  } catch (error) {
    console.error('Erreur PATCH /api/suggestions/[id]/statut:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
