import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';

// POST - Soumettre TOUTES les activités en brouillon pour validation
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
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
      if (etablissementId && user.etablissementsGeres.includes(parseInt(etablissementId))) {
        where.etablissementId = parseInt(etablissementId);
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

    // Créer une notification pour les admins
    const admins = await prisma.user.findMany({
      where: { 
        role: { in: ['ADMIN', 'SUPER_ADMIN'] },
        isActive: true
      },
      select: { id: true }
    });

    if (admins.length > 0) {
      // Extraire les noms uniques des établissements
      const etablissementsNomsArray = activites.map(a => a.etablissement.nom);
      const etablissementsNoms = Array.from(new Set(etablissementsNomsArray)).join(', ');
      
      await prisma.notification.createMany({
        data: admins.map(admin => ({
          userId: admin.id,
          type: 'ACTIVITES_A_VALIDER',
          titre: `${result.count} activités à valider`,
          message: `Le coordinateur a soumis ${result.count} activités pour validation (${etablissementsNoms})`,
          lien: `/admin/programmes-activites`,
          isRead: false,
        }))
      });
    }

    // Logger l'action
    const etablissementsForLog = activites.map(a => a.etablissement.nom);
    await prisma.activityLog.create({
      data: {
        userId,
        action: 'BULK_SUBMIT_FOR_VALIDATION',
        entity: 'ProgrammeActivite',
        entityId: null, // Bulk operation - no single entity
        details: {
          count: result.count,
          etablissements: Array.from(new Set(etablissementsForLog)),
        },
      }
    });

    return NextResponse.json({
      success: true,
      count: result.count,
      message: `${result.count} activités soumises pour validation`
    });

  } catch (error) {
    console.error('Erreur soumission en masse:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
