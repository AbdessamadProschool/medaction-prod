import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';

// GET /api/admin/validation - Récupérer les contenus en attente de validation
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Vérifier la permission de validation (au moins une)
    const userId = parseInt(session.user.id);
    const { checkPermission } = await import("@/lib/permissions");
    
    // On vérifie si l'utilisateur a le droit de valider des actualités ou des événements
    // C'est une vérification "générique" pour l'accès au tableau de bord de validation
    const canValidateEvents = await checkPermission(userId, 'evenements.validate');
    const canValidateNews = await checkPermission(userId, 'actualites.validate');
    const canValidateEtab = await checkPermission(userId, 'etablissements.validate');

    if (!canValidateEvents && !canValidateNews && !canValidateEtab) {
      return NextResponse.json({ error: 'Accès réservé aux validateurs' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all';

    // Récupérer les événements en attente
    const evenements = await prisma.evenement.findMany({
      where: { statut: 'EN_ATTENTE_VALIDATION' },
      select: {
        id: true,
        titre: true,
        description: true,
        dateDebut: true,
        lieu: true,
        secteur: true,
        createdAt: true,
        statut: true,
        etablissement: { select: { nom: true } },
        createdByUser: { select: { nom: true, prenom: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    // Récupérer les actualités en attente
    const actualites = await prisma.actualite.findMany({
      where: { statut: 'EN_ATTENTE_VALIDATION' },
      select: {
        id: true,
        titre: true,
        contenu: true,
        createdAt: true,
        statut: true,
        etablissement: { select: { nom: true, secteur: true } },
        createdByUser: { select: { nom: true, prenom: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    // Récupérer les articles en attente (si le modèle existe)
    let articles: any[] = [];
    try {
      articles = await prisma.article.findMany({
        where: { isPublie: false, isMisEnAvant: false }, // Articles non publiés (approx 'en attente')
        select: {
          id: true,
          titre: true,
          contenu: true,
          createdAt: true,
          isPublie: true,
          createdByUser: { select: { nom: true, prenom: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
    } catch {
      // Le modèle Article n'existe peut-être pas
    }

    // Formater les données
    const formattedEvenements = evenements.map(e => ({
      id: e.id,
      titre: e.titre,
      description: e.description?.substring(0, 200),
      type: 'evenement' as const,
      secteur: e.secteur,
      createdBy: e.createdByUser,
      etablissement: e.etablissement,
      createdAt: e.createdAt.toISOString(),
      statut: e.statut,
    }));

    const formattedActualites = actualites.map(a => ({
      id: a.id,
      titre: a.titre,
      description: a.contenu?.substring(0, 200),
      type: 'actualite' as const,
      secteur: a.etablissement.secteur,
      createdBy: a.createdByUser,
      etablissement: a.etablissement,
      createdAt: a.createdAt.toISOString(),
      statut: a.statut,
    }));

    const formattedArticles = articles.map(a => ({
      id: a.id,
      titre: a.titre,
      description: a.contenu?.substring(0, 200),
      type: 'article' as const,
      secteur: null,
      createdBy: a.createdByUser,
      etablissement: null,
      createdAt: a.createdAt.toISOString(),
      statut: a.isPublie ? 'PUBLIEE' : 'EN_ATTENTE',
    }));

    // Filtrer par type si demandé
    let items: any[] = [];
    if (type === 'evenements' || type === 'all') {
      items = [...items, ...formattedEvenements];
    }
    if (type === 'actualites' || type === 'all') {
      items = [...items, ...formattedActualites];
    }
    if (type === 'articles' || type === 'all') {
      items = [...items, ...formattedArticles];
    }

    // Trier par date
    items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({
      items,
      counts: {
        evenements: formattedEvenements.length,
        actualites: formattedActualites.length,
        articles: formattedArticles.length,
        total: formattedEvenements.length + formattedActualites.length + formattedArticles.length,
      },
    });

  } catch (error) {
    console.error('Erreur GET /api/admin/validation:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST /api/admin/validation - Approuver ou rejeter un contenu
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const { id, type, action, motifRejet } = body;

    // Vérifier la permission spécifique selon le type
    const userId = parseInt(session.user.id);
    const { checkPermission } = await import("@/lib/permissions");
    
    let hasPermission = false;
    if (type === 'evenement') {
       hasPermission = await checkPermission(userId, 'evenements.validate');
    } else if (type === 'actualite') {
       hasPermission = await checkPermission(userId, 'actualites.validate');
    } else if (type === 'article') {
       // Article = Actualité pour simplifier ou permission manquante?
       // Utilisons actualites.validate pour l'instant
       hasPermission = await checkPermission(userId, 'actualites.validate');
    }

    if (!hasPermission) {
       return NextResponse.json({ error: 'Action non autorisée pour ce type de contenu' }, { status: 403 });
    }

    if (!id || !type || !action) {
      return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 });
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Action invalide' }, { status: 400 });
    }

    const newStatut = action === 'approve' ? 'PUBLIEE' : 'REJETEE';

    // Mettre à jour selon le type
    if (type === 'evenement') {
      await prisma.evenement.update({
        where: { id },
        data: {
          statut: newStatut,
          motifRejet: action === 'reject' ? motifRejet : null,
          // dateValidation removed as it doesn't exist on schema
        },
      });
    } else if (type === 'actualite') {
      await prisma.actualite.update({
        where: { id },
        data: {
          statut: action === 'approve' ? 'PUBLIEE' : 'DEPUBLIEE',
          isValide: action === 'approve',
          isPublie: action === 'approve',
        },
      });
    } else if (type === 'article') {
      try {
        await prisma.article.update({
          where: { id },
          data: {
            isPublie: action === 'approve',
          },
        });
      } catch {
        // Le modèle Article n'existe peut-être pas
      }
    }

    return NextResponse.json({
      success: true,
      message: action === 'approve' ? 'Contenu approuvé' : 'Contenu rejeté',
    });

  } catch (error) {
    console.error('Erreur POST /api/admin/validation:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
