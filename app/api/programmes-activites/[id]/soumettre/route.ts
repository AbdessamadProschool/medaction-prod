import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';

// POST - Soumettre une activité pour validation
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { id } = await params;
    const activiteId = parseInt(id);
    const userId = parseInt(session.user.id);

    if (isNaN(activiteId)) {
      return NextResponse.json({ error: 'ID invalide' }, { status: 400 });
    }

    // Récupérer l'activité
    const activite = await prisma.programmeActivite.findUnique({
      where: { id: activiteId },
      include: {
        etablissement: { select: { id: true, nom: true } }
      }
    });

    if (!activite) {
      return NextResponse.json({ error: 'Activité non trouvée' }, { status: 404 });
    }

    // Vérifier que c'est bien le créateur ou un admin
    if (activite.createdBy !== userId && !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      // Vérifier si coordinateur de cet établissement
      if (session.user.role === 'COORDINATEUR_ACTIVITES') {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { etablissementsGeres: true }
        });
        if (!user?.etablissementsGeres.includes(activite.etablissementId)) {
          return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
        }
      } else {
        return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
      }
    }

    // Vérifier que l'activité est en brouillon
    if (activite.statut !== 'BROUILLON') {
      return NextResponse.json({ 
        error: 'Cette activité ne peut pas être soumise',
        message: `Statut actuel: ${activite.statut}. Seules les activités en brouillon peuvent être soumises.`
      }, { status: 400 });
    }

    // Mettre à jour le statut
    const updated = await prisma.programmeActivite.update({
      where: { id: activiteId },
      data: {
        statut: 'EN_ATTENTE_VALIDATION' as any,
      },
      include: {
        etablissement: { select: { id: true, nom: true, secteur: true } },
        createdByUser: { select: { id: true, nom: true, prenom: true } }
      }
    });

    // Créer une notification pour les admins
    const admins = await prisma.user.findMany({
      where: { 
        role: { in: ['ADMIN', 'SUPER_ADMIN'] },
        isActive: true
      },
      select: { id: true }
    });

    if (admins.length > 0) {
      await prisma.notification.createMany({
        data: admins.map(admin => ({
          userId: admin.id,
          type: 'ACTIVITE_A_VALIDER',
          titre: 'Nouvelle activité à valider',
          message: `L'activité "${activite.titre}" à ${activite.etablissement.nom} a été soumise pour validation.`,
          lien: `/admin/programmes-activites`,
          isRead: false,
        }))
      });
    }

    // Logger l'action
    await prisma.activityLog.create({
      data: {
        userId,
        action: 'SUBMIT_FOR_VALIDATION',
        entity: 'ProgrammeActivite',
        entityId: activiteId,
        details: {
          titre: activite.titre,
          etablissement: activite.etablissement.nom,
        },
      }
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Activité soumise pour validation avec succès'
    });

  } catch (error) {
    console.error('Erreur soumission activité:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
