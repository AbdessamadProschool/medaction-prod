import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { notifyReclamationResolved } from '@/lib/notifications';

// POST - Résoudre une réclamation
export async function POST(
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
    const body = await request.json();
    const { solution } = body;

    if (!solution || solution.trim().length < 10) {
      return NextResponse.json({ 
        error: 'La solution doit contenir au moins 10 caractères' 
      }, { status: 400 });
    }

    // Vérifier que la réclamation est bien affectée à cette autorité
    const reclamation = await prisma.reclamation.findFirst({
      where: {
        id: reclamationId,
        affecteeAAutoriteId: autoriteId,
        dateResolution: null, // Pas encore résolue
      },
      select: { id: true, userId: true, titre: true }
    });

    if (!reclamation) {
      return NextResponse.json({ error: 'Réclamation non trouvée ou déjà résolue' }, { status: 404 });
    }

    // Mettre à jour la réclamation
    const updatedReclamation = await prisma.reclamation.update({
      where: { id: reclamationId },
      data: {
        dateResolution: new Date(),
        solutionApportee: solution.trim(),
      },
    });

    // Ajouter à l'historique
    await prisma.historiqueReclamation.create({
      data: {
        reclamationId,
        action: 'RESOLUTION',
        details: {
          solution: solution.trim(),
          resolueParId: autoriteId,
          resolueParNom: `${session.user.prenom} ${session.user.nom}`,
        },
        effectuePar: autoriteId,
      }
    });

    // Notifier le citoyen
    await notifyReclamationResolved(reclamationId, reclamation.userId);

    return NextResponse.json({
      success: true,
      message: 'Réclamation marquée comme résolue',
      data: updatedReclamation,
    });

  } catch (error) {
    console.error('Erreur résolution réclamation:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
