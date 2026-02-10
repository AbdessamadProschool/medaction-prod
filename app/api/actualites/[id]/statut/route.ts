import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';

const VALID_STATUTS = [
  'BROUILLON',
  'EN_ATTENTE_VALIDATION',
  'VALIDEE',
  'PUBLIEE',
  'DEPUBLIEE',
  'ARCHIVEE',
  'REJETEE'
];

// PATCH - Changer le statut d'une actualité (Admin uniquement)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Seuls les admins peuvent changer le statut
    if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ 
        error: 'Seuls les administrateurs peuvent modifier le statut' 
      }, { status: 403 });
    }

    const { id } = await params;
    const actualiteId = parseInt(id);
    
    if (isNaN(actualiteId)) {
      return NextResponse.json({ error: 'ID invalide' }, { status: 400 });
    }

    const body = await request.json();
    const { statut } = body;

    if (!statut || !VALID_STATUTS.includes(statut)) {
      return NextResponse.json({ 
        error: 'Statut invalide', 
        validStatuts: VALID_STATUTS 
      }, { status: 400 });
    }

    // Vérifier que l'actualité existe
    const actualite = await prisma.actualite.findUnique({
      where: { id: actualiteId },
      select: { id: true, titre: true, createdBy: true, statut: true }
    });

    if (!actualite) {
      return NextResponse.json({ error: 'Actualité non trouvée' }, { status: 404 });
    }

    // Préparer les données de mise à jour
    const updateData: any = { statut };

    // Logique spécifique selon le statut
    switch (statut) {
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
        break;
      case 'DEPUBLIEE':
        updateData.isPublie = false;
        break;
      case 'ARCHIVEE':
        updateData.isPublie = false;
        break;
      case 'BROUILLON':
        updateData.isValide = false;
        updateData.isPublie = false;
        break;
    }

    // Mettre à jour le statut
    const updatedActualite = await prisma.actualite.update({
      where: { id: actualiteId },
      data: updateData,
    });

    // Notifier le créateur (sauf si c'est l'admin lui-même)
    if (actualite.createdBy && actualite.createdBy !== parseInt(session.user.id)) {
      const notificationMessages: Record<string, string> = {
        'VALIDEE': `Votre actualité "${actualite.titre}" a été validée.`,
        'PUBLIEE': `Votre actualité "${actualite.titre}" a été publiée.`,
        'REJETEE': `Votre actualité "${actualite.titre}" a été rejetée.`,
        'DEPUBLIEE': `Votre actualité "${actualite.titre}" a été dépubliée.`,
        'ARCHIVEE': `Votre actualité "${actualite.titre}" a été archivée.`,
        'BROUILLON': `Votre actualité "${actualite.titre}" a été remise en brouillon.`,
        'EN_ATTENTE_VALIDATION': `Votre actualité "${actualite.titre}" est en attente de validation.`,
      };

      await prisma.notification.create({
        data: {
          userId: actualite.createdBy,
          type: 'ACTUALITE_STATUT_CHANGE',
          titre: 'Statut de votre actualité modifié',
          message: notificationMessages[statut] || `Le statut de votre actualité a été modifié.`,
          lien: `/actualites/${actualite.id}`,
        }
      });
    }

    return NextResponse.json({ 
      success: true,
      message: `Statut modifié: ${statut}`,
      data: updatedActualite 
    });

  } catch (error) {
    console.error('Erreur changement statut actualité:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
