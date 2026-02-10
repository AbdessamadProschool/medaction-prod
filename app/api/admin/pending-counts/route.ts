import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';

// GET - Obtenir les compteurs d'éléments en attente pour les badges admin
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Vérifier la permission de voir les statistiques globales (Admin, Gouverneur, etc.)
    const userId = parseInt(session.user.id);
    const { checkPermission } = await import("@/lib/permissions"); // Lazy import to avoid circular dep if any
    const hasPermission = await checkPermission(userId, 'stats.view.global');

    if (!hasPermission) {
      // Fallback: check validation permissions if they don't have global stats but have specific duties
      const canValidate = await checkPermission(userId, 'evenements.validate') || 
                          await checkPermission(userId, 'actualites.validate');
      
      if (!canValidate) {
         return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
      }
    }

    // Récupérer les compteurs en parallèle
    const [
      reclamationsNonAffectees,
      suggestionsEnAttente,
      activitesEnAttente,
      evenementsEnAttente,
      actualitesEnAttente,
      articlesEnAttente,
    ] = await Promise.all([
      // Réclamations non affectées (pas encore traitées)
      prisma.reclamation.count({
        where: { affecteeAAutoriteId: null, isArchivee: false }
      }).catch(() => 0),
      
      // Suggestions en attente (SOUMISE = nouveau, EN_EXAMEN = en cours)
      prisma.suggestion.count({
        where: { statut: { in: ['SOUMISE', 'EN_EXAMEN'] } }
      }).catch(() => 0),
      
      // Activités en attente de validation (EN_ATTENTE_VALIDATION)
      prisma.programmeActivite.count({
        where: { statut: 'EN_ATTENTE_VALIDATION' as any }
      }).catch(() => 0),
      
      // Événements en attente de validation (même critère que /api/admin/validation)
      prisma.evenement.count({
        where: { statut: 'EN_ATTENTE_VALIDATION' }
      }).catch(() => 0),

      // Actualités en attente de validation
      prisma.actualite.count({
        where: { statut: 'EN_ATTENTE_VALIDATION' }
      }).catch(() => 0),

      // Articles non publiés
      prisma.article.count({
        where: { isPublie: false, isMisEnAvant: false }
      }).catch(() => 0),
    ]);

    // Le badge "validation" = événements + actualités + articles en attente
    const validationTotal = evenementsEnAttente + actualitesEnAttente + articlesEnAttente;

    return NextResponse.json({
      reclamations: reclamationsNonAffectees,
      suggestions: suggestionsEnAttente,
      activites: activitesEnAttente,
      validation: validationTotal,
      evenements: evenementsEnAttente,
      utilisateurs: 0, // Pas besoin pour utilisateurs
    });

  } catch (error) {
    console.error('Erreur compteurs admin:', error);
    return NextResponse.json({ 
      reclamations: 0,
      suggestions: 0,
      activites: 0,
      validation: 0,
      evenements: 0,
      utilisateurs: 0,
    });
  }
}
