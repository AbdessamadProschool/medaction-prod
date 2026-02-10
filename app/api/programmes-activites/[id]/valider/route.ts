import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';

// POST - Valider une activité (Admin/Super Admin seulement)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Seuls admins peuvent valider
    if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ 
        error: 'Non autorisé',
        message: 'Seuls les administrateurs peuvent valider les activités'
      }, { status: 403 });
    }

    const { id } = await params;
    const activityId = parseInt(id);

    if (isNaN(activityId)) {
      return NextResponse.json({ error: 'ID invalide' }, { status: 400 });
    }

    const body = await request.json();
    const { action } = body; // 'validate' | 'reject'

    const activite = await prisma.programmeActivite.findUnique({
      where: { id: activityId },
      include: {
        etablissement: { select: { nom: true } },
        createdByUser: { select: { id: true, nom: true, prenom: true } }
      }
    });

    if (!activite) {
      return NextResponse.json({ error: 'Activité introuvable' }, { status: 404 });
    }

    if (action === 'validate') {
      // Valider l'activité: changer statut et rendre visible
      await prisma.programmeActivite.update({
        where: { id: activityId },
        data: { 
          statut: 'PLANIFIEE',           // Passe de EN_ATTENTE_VALIDATION à PLANIFIEE
          isValideParAdmin: true,         // Marquée comme validée
          isVisiblePublic: true           // Visible publiquement maintenant
        }
      });

      // Notifier le coordinateur
      if (activite.createdByUser) {
        await prisma.notification.create({
          data: {
            userId: activite.createdByUser.id,
            type: 'ACTIVITE_VALIDEE',
            titre: 'Activité validée ✓',
            message: `Votre activité "${activite.titre}" a été validée par l'administration et est maintenant visible publiquement.`,
            lien: `/coordinateur/calendrier`,
          }
        });
      }

      // Logger l'action
      await prisma.activityLog.create({
        data: {
          userId: parseInt(session.user.id),
          action: 'VALIDATE_ACTIVITY',
          entity: 'ProgrammeActivite',
          entityId: activityId,
          details: {
            titre: activite.titre,
            etablissement: activite.etablissement.nom,
          },
        }
      });

      return NextResponse.json({
        success: true,
        message: 'Activité validée et publiée'
      });
    } else if (action === 'reject') {
      const { motif } = body;
      
      // Rejeter: remettre en brouillon pour modification
      await prisma.programmeActivite.update({
        where: { id: activityId },
        data: { 
          statut: 'BROUILLON',            // Redevient brouillon pour correction
          isVisiblePublic: false,
          isValideParAdmin: false 
        }
      });

      // Notifier le coordinateur du refus
      if (activite.createdByUser) {
        await prisma.notification.create({
          data: {
            userId: activite.createdByUser.id,
            type: 'ACTIVITE_REJETEE',
            titre: 'Activité à corriger',
            message: `Votre activité "${activite.titre}" nécessite des modifications. ${motif ? `Motif: ${motif}` : 'Veuillez vérifier les informations.'}`,
            lien: `/coordinateur/calendrier`,
          }
        });
      }

      // Logger l'action
      await prisma.activityLog.create({
        data: {
          userId: parseInt(session.user.id),
          action: 'REJECT_ACTIVITY',
          entity: 'ProgrammeActivite',
          entityId: activityId,
          details: {
            titre: activite.titre,
            motif: motif || 'Non spécifié',
          },
        }
      });

      return NextResponse.json({
        success: true,
        message: 'Activité rejetée et renvoyée en brouillon'
      });
    }

    return NextResponse.json({ error: 'Action non reconnue' }, { status: 400 });

  } catch (error) {
    console.error('Erreur validation activité:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
