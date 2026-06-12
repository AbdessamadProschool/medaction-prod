import { safeParseInt } from '@/lib/utils/parse';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { withErrorHandler, successResponse } from '@/lib/api-handler';
import { UnauthorizedError } from '@/lib/exceptions';
import { notifyAdmins } from '@/lib/notifications';
import { ActivityLogger } from '@/lib/activity-logger';

// POST - Soumettre TOUTES les activités en brouillon pour validation
export const POST = withErrorHandler(async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    throw new UnauthorizedError('Vous devez être connecté');
  }

    // Vérifier le rôle
    if (!['COORDINATEUR_ACTIVITES', 'ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
    }

    const userId = parseInt(session.user.id);
    const body = await request.json().catch(() => ({}));
    const { etablissementId } = body;

    // Construire le filtre
    const where: any = {
      statut: 'BROUILLON',
      createdBy: userId,
    };

    // Si coordinateur, filtrer par ses établissements
    if (session.user.role === 'COORDINATEUR_ACTIVITES') {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { etablissementsGeres: true }
      });
      
      if (!user?.etablissementsGeres.length) {
        return NextResponse.json({
          success: true,
          count: 0,
          message: 'Aucun établissement assigné'
        });
      }
      
      where.etablissementId = { in: user.etablissementsGeres };
      
      // Filtre optionnel par établissement spécifique
      if (etablissementId && user.etablissementsGeres.includes(safeParseInt(etablissementId, 0))) {
        where.etablissementId = safeParseInt(etablissementId, 0);
      }
    }

    // Compter les activités à soumettre
    const count = await prisma.programmeActivite.count({ where });

    if (count === 0) {
      return NextResponse.json({
        success: true,
        count: 0,
        message: 'Aucune activité en brouillon à soumettre'
      });
    }

    // Récupérer les activités pour les notifications
    const activites = await prisma.programmeActivite.findMany({
      where,
      include: {
        etablissement: { select: { nom: true } }
      },
      take: 50 // Limiter pour la notification
    });

    // Mettre à jour toutes les activités
    const result = await prisma.programmeActivite.updateMany({
      where,
      data: {
        statut: 'EN_ATTENTE_VALIDATION' as any,
      }
    });

    // Extraire les noms uniques des établissements
    const etablissementsNomsArray = activites.map(a => a.etablissement ? a.etablissement.nom : 'Province');
    const etablissementsNoms = Array.from(new Set(etablissementsNomsArray)).join(', ');
    
    // Créer une notification pour les admins
    await notifyAdmins({
      type: 'ACTIVITES_A_VALIDER',
      titre: `${result.count} activités à valider`,
      message: `Le coordinateur a soumis ${result.count} activités pour validation (${etablissementsNoms})`,
      lien: `/admin/programmes-activites`,
    });

    // Logger l'action
    await ActivityLogger.custom({
      action: 'Soumission en masse d\'activités',
      entity: 'Activite',
      details: {
        message: `Soumission de ${result.count} activités pour validation`,
        count: result.count,
        etablissements: Array.from(new Set(etablissementsNomsArray)),
      },
      userId
    });

    return successResponse(
      { count: result.count }, 
      `${result.count} activités soumises pour validation`
    );
});
