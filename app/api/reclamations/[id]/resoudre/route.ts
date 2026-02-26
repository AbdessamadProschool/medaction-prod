import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { notifyReclamationResolved } from '@/lib/notifications';

// POST - Résoudre une réclamation (Admin ou Autorité Locale)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Vérifier le rôle
    if (!['ADMIN', 'SUPER_ADMIN', 'AUTORITE_LOCALE'].includes(session.user.role || '')) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
    }

    const reclamationId = parseInt(params.id);
    const body = await request.json();
    const { solution, commentaire } = body;

    if (!solution || solution.trim().length < 10) {
      return NextResponse.json({ 
        error: 'La solution doit contenir au moins 10 caractères' 
      }, { status: 400 });
    }

    // Vérifier que la réclamation existe et peut être résolue
    const whereClause: any = { id: reclamationId, dateResolution: null };
    
    // Si autorité locale, vérifier que la réclamation lui est affectée
    if (session.user.role === 'AUTORITE_LOCALE') {
      whereClause.affecteeAAutoriteId = parseInt(session.user.id);
    }

    const reclamation = await prisma.reclamation.findFirst({
      where: whereClause,
      select: { id: true, userId: true, titre: true, statut: true }
    });

    if (!reclamation) {
      return NextResponse.json({ 
        error: 'Réclamation non trouvée, déjà résolue, ou non affectée à vous' 
      }, { status: 404 });
    }

    // Mettre à jour la réclamation
    const updatedReclamation = await prisma.reclamation.update({
      where: { id: reclamationId },
      data: {
        dateResolution: new Date(),
        solutionApportee: solution.trim(),
      },
      include: {
        user: { select: { id: true, nom: true, prenom: true } },
        commune: { select: { nom: true } },
      }
    });

    // Ajouter à l'historique
    await prisma.historiqueReclamation.create({
      data: {
        reclamationId,
        action: 'RESOLUTION',
        details: {
          solution: solution.trim(),
          commentaire,
          resolueParId: parseInt(session.user.id),
          resolueParNom: `${session.user.prenom} ${session.user.nom}`,
          resolueParRole: session.user.role,
        },
        effectuePar: parseInt(session.user.id),
      }
    });

    // Notifier le citoyen
    await notifyReclamationResolved(reclamationId, reclamation.userId);

    return NextResponse.json({
      success: true,
      message: 'Réclamation résolue avec succès',
      data: updatedReclamation,
    });

  } catch (error) {
    console.error('Erreur résolution réclamation:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
