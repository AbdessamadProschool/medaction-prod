import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';

// GET - Statistiques pour l'autorité locale (toute la commune)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Vérifier le rôle
    if (session.user.role !== 'AUTORITE_LOCALE') {
      return NextResponse.json({ error: 'Accès réservé aux autorités locales' }, { status: 403 });
    }

    const autoriteId = parseInt(session.user.id);

    // Récupérer l'utilisateur avec sa commune responsable
    const autorite = await prisma.user.findUnique({
      where: { id: autoriteId },
      select: {
        communeResponsableId: true,
        communeResponsable: {
          select: {
            id: true,
            nom: true,
            nomArabe: true,
            population: true,
            superficieKm2: true,
          }
        }
      }
    });

    if (!autorite?.communeResponsableId) {
      return NextResponse.json({ 
        error: 'Aucune commune assignée',
        message: 'Contactez un administrateur pour lier votre compte à une commune.'
      }, { status: 400 });
    }

    const communeId = autorite.communeResponsableId;

    // Récupérer les statistiques de TOUTE la commune
    const [
      totalReclamations,
      reclamationsEnAttente,
      reclamationsResolues,
      reclamationsAffecteesAujourdHui,
      etablissementsCommune,
      totalEtablissements,
    ] = await Promise.all([
      // Total des réclamations de la commune (affectées)
      prisma.reclamation.count({
        where: { 
          communeId,
          affectationReclamation: 'AFFECTEE',
        }
      }),
      
      // Réclamations en attente de traitement (affectées mais pas résolues)
      prisma.reclamation.count({
        where: {
          communeId,
          affectationReclamation: 'AFFECTEE',
          dateResolution: null,
        }
      }),
      
      // Réclamations résolues
      prisma.reclamation.count({
        where: {
          communeId,
          affectationReclamation: 'AFFECTEE',
          dateResolution: { not: null },
        }
      }),
      
      // Réclamations affectées aujourd'hui
      prisma.reclamation.count({
        where: {
          communeId,
          affectationReclamation: 'AFFECTEE',
          dateAffectation: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          }
        }
      }),
      
      // Liste des établissements de la commune
      prisma.etablissement.findMany({
        where: { 
          communeId,
          isPublie: true,
        },
        select: {
          id: true,
          nom: true,
          secteur: true,
          noteMoyenne: true,
          nombreEvaluations: true,
          _count: {
            select: {
              reclamations: true,
              evaluations: true,
              evenements: true,
            }
          }
        },
        orderBy: { nom: 'asc' }
      }),

      // Nombre total d'établissements
      prisma.etablissement.count({
        where: { communeId }
      }),
    ]);

    // Calculer le taux de résolution
    const tauxResolution = totalReclamations > 0 
      ? Math.round((reclamationsResolues / totalReclamations) * 100) 
      : 0;

    // Stats par catégorie
    const parCategorie = await prisma.reclamation.groupBy({
      by: ['categorie'],
      where: { 
        communeId,
        affectationReclamation: 'AFFECTEE',
      },
      _count: true,
      orderBy: { _count: { categorie: 'desc' } },
      take: 5,
    });

    // Stats par secteur d'établissement
    const parSecteur = await prisma.etablissement.groupBy({
      by: ['secteur'],
      where: { communeId },
      _count: true,
    });

    // Note moyenne globale de la commune
    const noteMoyenneCommune = etablissementsCommune.length > 0
      ? etablissementsCommune.reduce((acc, e) => acc + e.noteMoyenne, 0) / etablissementsCommune.length
      : 0;

    return NextResponse.json({
      success: true,
      data: {
        commune: autorite.communeResponsable,
        reclamations: {
          total: totalReclamations,
          enAttente: reclamationsEnAttente,
          resolues: reclamationsResolues,
          aujourdHui: reclamationsAffecteesAujourdHui,
          tauxResolution,
        },
        etablissements: {
          total: totalEtablissements,
          liste: etablissementsCommune,
          noteMoyenne: Math.round(noteMoyenneCommune * 10) / 10,
        },
        parCategorie: parCategorie.map(c => ({
          categorie: c.categorie,
          count: c._count,
        })),
        parSecteur: parSecteur.map(s => ({
          secteur: s.secteur,
          count: s._count,
        })),
      }
    });

  } catch (error) {
    console.error('Erreur stats autorité:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
