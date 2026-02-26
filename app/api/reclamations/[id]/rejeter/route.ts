import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { notifyReclamationRejected } from '@/lib/notifications';

// POST - Rejeter une réclamation (Admin uniquement)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Vérifier le rôle admin
    if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role || '')) {
      return NextResponse.json({ error: 'Accès réservé aux administrateurs' }, { status: 403 });
    }

    const reclamationId = parseInt(params.id);
    const body = await request.json();
    const { motif, commentaireInterne } = body;

    if (!motif || motif.trim().length < 10) {
      return NextResponse.json({ 
        error: 'Le motif de rejet doit contenir au moins 10 caractères' 
      }, { status: 400 });
    }

    // Vérifier que la réclamation existe et peut être rejetée
    const reclamation = await prisma.reclamation.findFirst({
      where: { 
        id: reclamationId,
        statut: null, // Seulement les réclamations en attente
      },
      select: { id: true, userId: true, titre: true }
    });

    if (!reclamation) {
      return NextResponse.json({ 
        error: 'Réclamation non trouvée ou déjà traitée' 
      }, { status: 404 });
    }

    // Mettre à jour la réclamation
    const updatedReclamation = await prisma.reclamation.update({
      where: { id: reclamationId },
      data: {
        statut: 'REJETEE',
        motifRejet: motif.trim(),
      },
      include: {
        user: { select: { id: true, nom: true, prenom: true, email: true } },
        commune: { select: { nom: true } },
      }
    });

    // Ajouter à l'historique
    await prisma.historiqueReclamation.create({
      data: {
        reclamationId,
        action: 'REJET',
        details: {
          motif: motif.trim(),
          commentaireInterne,
          rejeteeParId: parseInt(session.user.id),
          rejeteeParNom: `${session.user.prenom} ${session.user.nom}`,
        },
        effectuePar: parseInt(session.user.id),
      }
    });

    // Notifier le citoyen
    await notifyReclamationRejected(reclamationId, reclamation.userId, motif.trim());

    return NextResponse.json({
      success: true,
      message: 'Réclamation rejetée',
      data: updatedReclamation,
    });

  } catch (error) {
    console.error('Erreur rejet réclamation:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
