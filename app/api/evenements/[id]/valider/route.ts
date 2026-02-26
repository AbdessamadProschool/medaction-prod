import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const validerSchema = z.object({
  decision: z.enum(['PUBLIEE', 'REJETEE']),
  motifRejet: z.string().min(10).optional(),
});

// PATCH - Valider ou rejeter un événement (ADMIN uniquement)
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Seuls les admins peuvent valider
    if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ 
        error: 'Seuls les administrateurs peuvent valider les événements' 
      }, { status: 403 });
    }

    const id = parseInt(params.id);
    const body = await request.json();
    const validation = validerSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ 
        error: 'Données invalides', 
        details: validation.error.flatten() 
      }, { status: 400 });
    }

    const { decision, motifRejet } = validation.data;

    // Vérifier que l'événement existe et est en attente
    const evenement = await prisma.evenement.findUnique({
      where: { id },
      select: { id: true, statut: true, titre: true, createdBy: true }
    });

    if (!evenement) {
      return NextResponse.json({ error: 'Événement non trouvé' }, { status: 404 });
    }

    if (evenement.statut !== 'EN_ATTENTE_VALIDATION') {
      return NextResponse.json({ 
        error: 'Seuls les événements en attente peuvent être validés' 
      }, { status: 400 });
    }

    // Validation du motif si rejet
    if (decision === 'REJETEE' && !motifRejet) {
      return NextResponse.json({ 
        error: 'Un motif de rejet est requis' 
      }, { status: 400 });
    }

    // Mettre à jour le statut
    const updatedEvenement = await prisma.evenement.update({
      where: { id },
      data: {
        statut: decision,
        motifRejet: decision === 'REJETEE' ? motifRejet : null,
      },
      include: {
        etablissement: { select: { nom: true } },
      }
    });

    // Notifier le créateur
    const notificationMessage = decision === 'PUBLIEE'
      ? `Votre événement "${evenement.titre}" a été approuvé et publié.`
      : `Votre événement "${evenement.titre}" a été rejeté. Motif: ${motifRejet}`;

    await prisma.notification.create({
      data: {
        userId: evenement.createdBy,
        type: decision === 'PUBLIEE' ? 'EVENEMENT_VALIDE' : 'EVENEMENT_REJETE',
        titre: decision === 'PUBLIEE' ? 'Événement approuvé' : 'Événement rejeté',
        message: notificationMessage,
        lien: `/evenements/${evenement.id}`,
      }
    });

    return NextResponse.json({ 
      message: decision === 'PUBLIEE' 
        ? 'Événement validé et publié' 
        : 'Événement rejeté',
      data: updatedEvenement 
    });

  } catch (error) {
    console.error('Erreur validation événement:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
