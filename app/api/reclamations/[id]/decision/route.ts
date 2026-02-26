import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const decisionSchema = z.object({
  decision: z.enum(['ACCEPTEE', 'REJETEE']),
  motifRejet: z.string().optional(),
});

// PATCH - Décision admin (ACCEPTEE/REJETEE)
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Seuls les admins peuvent prendre une décision
    if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ 
        error: 'Seuls les administrateurs peuvent prendre une décision' 
      }, { status: 403 });
    }

    const id = parseInt(params.id);
    const body = await request.json();
    const validation = decisionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ 
        error: 'Données invalides', 
        details: validation.error.flatten() 
      }, { status: 400 });
    }

    const { decision, motifRejet } = validation.data;

    // Vérifier que la réclamation existe et est en attente
    const reclamation = await prisma.reclamation.findUnique({
      where: { id },
      include: { user: { select: { id: true, nom: true } } }
    });

    if (!reclamation) {
      return NextResponse.json({ error: 'Réclamation non trouvée' }, { status: 404 });
    }

    if (reclamation.statut !== null) {
      return NextResponse.json({ 
        error: 'Cette réclamation a déjà fait l\'objet d\'une décision' 
      }, { status: 400 });
    }

    // Si rejet, le motif est obligatoire
    if (decision === 'REJETEE' && !motifRejet) {
      return NextResponse.json({ 
        error: 'Le motif de rejet est obligatoire' 
      }, { status: 400 });
    }

    // Mettre à jour la réclamation
    const updated = await prisma.reclamation.update({
      where: { id },
      data: {
        statut: decision,
        motifRejet: decision === 'REJETEE' ? motifRejet : null,
      }
    });

    // Créer l'entrée d'historique
    await prisma.historiqueReclamation.create({
      data: {
        reclamationId: id,
        action: decision === 'ACCEPTEE' ? 'ACCEPTATION' : 'REJET',
        details: {
          decision,
          motifRejet: motifRejet || null,
          decidePar: `${session.user.nom} ${session.user.prenom}`,
        },
        effectuePar: parseInt(session.user.id),
      }
    });

    // Notifier le citoyen
    await prisma.notification.create({
      data: {
        userId: reclamation.userId,
        type: decision === 'ACCEPTEE' ? 'RECLAMATION_ACCEPTEE' : 'RECLAMATION_REJETEE',
        titre: decision === 'ACCEPTEE' ? 'Réclamation acceptée' : 'Réclamation rejetée',
        message: decision === 'ACCEPTEE' 
          ? `Votre réclamation "${reclamation.titre}" a été acceptée et sera traitée.`
          : `Votre réclamation "${reclamation.titre}" a été rejetée. Motif: ${motifRejet}`,
        lien: `/mes-reclamations/${id}`,
      }
    });

    return NextResponse.json({ 
      message: `Réclamation ${decision.toLowerCase()}`,
      data: updated 
    });

  } catch (error) {
    console.error('Erreur décision réclamation:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
