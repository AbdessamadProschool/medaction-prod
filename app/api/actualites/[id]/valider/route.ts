import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const validerSchema = z.object({
  decision: z.enum(['VALIDEE', 'PUBLIEE', 'REJETEE', 'DEPUBLIEE', 'ARCHIVEE']),
  motifRejet: z.string().min(10).optional(),
});

// PATCH - Valider ou rejeter une actualité (ADMIN uniquement)
export async function PATCH(
  request: NextRequest,
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
        error: 'Seuls les administrateurs peuvent valider les actualités' 
      }, { status: 403 });
    }

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'ID invalide' }, { status: 400 });
    }

    const body = await request.json();
    const validation = validerSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ 
        error: 'Données invalides', 
        details: validation.error.flatten() 
      }, { status: 400 });
    }

    const { decision, motifRejet } = validation.data;

    // Vérifier que l'actualité existe
    const actualite = await prisma.actualite.findUnique({
      where: { id },
      select: { id: true, statut: true, titre: true, createdBy: true }
    });

    if (!actualite) {
      return NextResponse.json({ error: 'Actualité non trouvée' }, { status: 404 });
    }

    // Validation des règles de transition
    if (decision === 'REJETEE' && !motifRejet) {
      return NextResponse.json({ 
        error: 'Un motif de rejet est requis' 
      }, { status: 400 });
    }

    // Préparer les données de mise à jour
    const updateData: any = {
      statut: decision,
    };

    switch (decision) {
      case 'VALIDEE':
        updateData.isValide = true;
        break;
      case 'PUBLIEE':
        updateData.isValide = true;
        updateData.isPublie = true;
        updateData.datePublication = new Date();
        break;
      case 'REJETEE':
        updateData.isValide = false;
        updateData.isPublie = false;
        // Stocker le motif dans un champ approprié si disponible
        break;
      case 'DEPUBLIEE':
        updateData.isPublie = false;
        break;
      case 'ARCHIVEE':
        updateData.isPublie = false;
        break;
    }

    // Mettre à jour le statut
    const updatedActualite = await prisma.actualite.update({
      where: { id },
      data: updateData,
      include: {
        etablissement: { select: { nom: true } },
      }
    });

    // Notifier le créateur
    const notificationMessages: Record<string, string> = {
      'VALIDEE': `Votre actualité "${actualite.titre}" a été validée. Elle peut maintenant être publiée.`,
      'PUBLIEE': `Votre actualité "${actualite.titre}" a été publiée.`,
      'REJETEE': `Votre actualité "${actualite.titre}" a été rejetée. Motif: ${motifRejet}`,
      'DEPUBLIEE': `Votre actualité "${actualite.titre}" a été dépubliée.`,
      'ARCHIVEE': `Votre actualité "${actualite.titre}" a été archivée.`,
    };

    const notificationTypes: Record<string, string> = {
      'VALIDEE': 'ACTUALITE_VALIDEE',
      'PUBLIEE': 'ACTUALITE_PUBLIEE',
      'REJETEE': 'ACTUALITE_REJETEE',
      'DEPUBLIEE': 'ACTUALITE_DEPUBLIEE',
      'ARCHIVEE': 'ACTUALITE_ARCHIVEE',
    };

    await prisma.notification.create({
      data: {
        userId: actualite.createdBy,
        type: notificationTypes[decision],
        titre: decision === 'PUBLIEE' ? 'Actualité publiée' : 
               decision === 'VALIDEE' ? 'Actualité validée' :
               decision === 'REJETEE' ? 'Actualité rejetée' : 'Actualité mise à jour',
        message: notificationMessages[decision],
        lien: `/actualites/${actualite.id}`,
      }
    });

    return NextResponse.json({ 
      message: `Actualité ${decision.toLowerCase()}`,
      data: updatedActualite 
    });

  } catch (error) {
    console.error('Erreur validation actualité:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
