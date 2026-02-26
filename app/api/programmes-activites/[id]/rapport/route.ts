import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';

// POST /api/programmes-activites/[id]/rapport - Enregistrer le rapport d'activité
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const activityId = parseInt(params.id);
    if (isNaN(activityId)) {
      return NextResponse.json({ error: 'ID invalide' }, { status: 400 });
    }

    // Vérifier que l'activité existe
    const activite = await prisma.programmeActivite.findUnique({
      where: { id: activityId },
      include: { etablissement: true },
    });

    if (!activite) {
      return NextResponse.json({ error: 'Activité non trouvée' }, { status: 404 });
    }

    // Vérifier les permissions (coordinateur de l'établissement)
    const userRole = session.user.role;
    const etablissementsGeres = session.user.etablissementsGeres || [];
    
    const canEdit = 
      ['ADMIN', 'SUPER_ADMIN'].includes(userRole) ||
      (userRole === 'COORDINATEUR_ACTIVITES' && etablissementsGeres.includes(activite.etablissementId));

    if (!canEdit) {
      return NextResponse.json({ error: 'Non autorisé à modifier cette activité' }, { status: 403 });
    }

    // Vérifier que l'activité est terminée ou planifiée (passée)
    const activityDate = new Date(activite.date);
    activityDate.setHours(parseInt(activite.heureFin.split(':')[0]) || 22);
    
    const now = new Date();
    
    if (activityDate > now && activite.statut !== 'TERMINEE' && activite.statut !== 'RAPPORT_COMPLETE') {
      return NextResponse.json({ 
        error: 'Le rapport ne peut être rempli qu\'après la fin de l\'activité' 
      }, { status: 400 });
    }

    // Récupérer les données du rapport
    const body = await request.json();
    const {
      presenceEffective,
      commentaireDeroulement,
      difficultes,
      pointsPositifs,
      noteQualite,
      recommandations,
    } = body;

    // Valider les données
    if (presenceEffective === undefined || presenceEffective < 0) {
      return NextResponse.json({ error: 'Le nombre de participants est requis' }, { status: 400 });
    }

    // Calculer le taux de présence
    const tauxPresence = activite.participantsAttendus 
      ? Math.round((presenceEffective / activite.participantsAttendus) * 100)
      : null;

    // Mettre à jour l'activité avec le rapport
    const updatedActivite = await prisma.programmeActivite.update({
      where: { id: activityId },
      data: {
        presenceEffective: parseInt(presenceEffective),
        tauxPresence,
        commentaireDeroulement: commentaireDeroulement || null,
        difficultes: difficultes || null,
        pointsPositifs: pointsPositifs || null,
        noteQualite: noteQualite ? parseInt(noteQualite) : null,
        recommandations: recommandations || null,
        rapportComplete: true,
        dateRapport: new Date(),
        statut: 'RAPPORT_COMPLETE' as any,
      },
    });

    // Créer un log d'activité
    try {
      await prisma.activityLog.create({
        data: {
          action: 'RAPPORT_ACTIVITE',
          entity: 'ProgrammeActivite',
          entityId: activityId,
          userId: parseInt(session.user.id),
          details: {
            message: `Rapport complété pour l'activité "${activite.titre}"`,
            presenceEffective,
            tauxPresence,
            noteQualite,
          },
        },
      });
    } catch (e) {
      // Log non critique
    }

    return NextResponse.json({
      success: true,
      message: 'Rapport enregistré avec succès',
      data: updatedActivite,
    });

  } catch (error) {
    console.error('Erreur POST rapport:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// GET /api/programmes-activites/[id]/rapport - Récupérer le rapport
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const activityId = parseInt(params.id);
    if (isNaN(activityId)) {
      return NextResponse.json({ error: 'ID invalide' }, { status: 400 });
    }

    const activite = await prisma.programmeActivite.findUnique({
      where: { id: activityId },
      select: {
        id: true,
        titre: true,
        date: true,
        heureDebut: true,
        heureFin: true,
        lieu: true,
        participantsAttendus: true,
        presenceEffective: true,
        tauxPresence: true,
        commentaireDeroulement: true,
        difficultes: true,
        pointsPositifs: true,
        noteQualite: true,
        recommandations: true,
        rapportComplete: true,
        dateRapport: true,
        etablissement: {
          select: { id: true, nom: true, secteur: true },
        },
      },
    });

    if (!activite) {
      return NextResponse.json({ error: 'Activité non trouvée' }, { status: 404 });
    }

    return NextResponse.json({ data: activite });

  } catch (error) {
    console.error('Erreur GET rapport:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
