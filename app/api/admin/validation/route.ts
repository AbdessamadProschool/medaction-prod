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
    
    const canValidateEvents = await checkPermission(userId, 'evenements.validate');
    const canValidateNews = await checkPermission(userId, 'actualites.validate');
    const canValidateEtab = await checkPermission(userId, 'etablissements.validate');
    const canValidateProgs = await checkPermission(userId, 'programmes.validate');
    const canValidateEvals = await checkPermission(userId, 'evaluations.validate');

    if (!canValidateEvents && !canValidateNews && !canValidateEtab && !canValidateProgs && !canValidateEvals) {
      return NextResponse.json({ error: 'Accès réservé aux validateurs' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all';

    // 1. Récupérer les événements en attente
    const evenements = await prisma.evenement.findMany({
      where: { statut: 'EN_ATTENTE_VALIDATION' },
      select: {
        id: true,
        titre: true,
        description: true,
        dateDebut: true,
        dateFin: true,
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

    // 2. Récupérer les actualités en attente
    const actualites = await prisma.actualite.findMany({
      where: { statut: 'EN_ATTENTE_VALIDATION' },
      select: {
        id: true,
        titre: true,
        description: true,
        contenu: true,
        categorie: true,
        createdAt: true,
        statut: true,
        etablissement: { select: { nom: true, secteur: true } },
        createdByUser: { select: { nom: true, prenom: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    // 3. Récupérer les articles en attente
    let articles: any[] = [];
    try {
      articles = await prisma.article.findMany({
        where: { isPublie: false, isMisEnAvant: false },
        select: {
          id: true,
          titre: true,
          description: true,
          contenu: true,
          imagePrincipale: true,
          categorie: true,
          createdAt: true,
          isPublie: true,
          createdByUser: { select: { nom: true, prenom: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
    } catch (e) {
      // Ignorer si le modèle n'existe pas encore
    }

    // 4. Récupérer les campagnes en attente
    const campagnes = await prisma.campagne.findMany({
      where: { statut: 'EN_ATTENTE' },
      select: {
        id: true,
        titre: true,
        description: true,
        contenu: true,
        imagePrincipale: true,
        dateDebut: true,
        dateFin: true,
        objectifParticipations: true,
        createdAt: true,
        statut: true,
        createdByUser: { select: { nom: true, prenom: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    // 5. Récupérer les demandes d'établissements en attente
    const etablissementRequests = await prisma.demandeModificationEtablissement.findMany({
      where: { statut: 'EN_ATTENTE_VALIDATION' },
      select: {
        id: true,
        type: true,
        justification: true,
        createdAt: true,
        statut: true,
        etablissement: { select: { nom: true } },
        soumisPar: { select: { nom: true, prenom: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    // 6. Récupérer les programmes d'activités en attente
    const programmes = await prisma.programmeActivite.findMany({
      where: { statut: 'EN_ATTENTE_VALIDATION' },
      select: {
        id: true,
        titre: true,
        description: true,
        date: true,
        heureDebut: true,
        heureFin: true,
        createdAt: true,
        statut: true,
        etablissement: { select: { nom: true } },
        createdByUser: { select: { nom: true, prenom: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    // 7. Récupérer les évaluations à modérer
    const evaluations = await prisma.evaluation.findMany({
      where: { 
        OR: [
          { isValidee: false },
          { isSignalee: true }
        ]
      },
      select: {
        id: true,
        noteGlobale: true,
        commentaire: true,
        isSignalee: true,
        motifSignalement: true,
        createdAt: true,
        etablissement: { select: { nom: true } },
        user: { select: { nom: true, prenom: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    // Formater toutes les données pour l'interface unifiée
    const formattedEvenements = evenements.map(e => ({
      id: e.id,
      titre: e.titre,
      description: e.description,
      contenu: e.description,
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
      description: a.description,
      contenu: a.contenu,
      type: 'actualite' as const,
      secteur: a.etablissement?.secteur,
      createdBy: a.createdByUser,
      etablissement: a.etablissement,
      createdAt: a.createdAt.toISOString(),
      statut: a.statut,
    }));

    const formattedArticles = articles.map((a: any) => ({
      id: a.id,
      titre: a.titre,
      description: a.description,
      contenu: a.contenu,
      type: 'article' as const,
      createdBy: a.createdByUser,
      createdAt: a.createdAt.toISOString(),
      statut: a.isPublie ? 'PUBLIEE' : 'EN_ATTENTE',
    }));

    const formattedCampagnes = campagnes.map(c => ({
      id: c.id,
      titre: c.titre,
      description: c.description || undefined,
      contenu: c.contenu,
      type: 'campagne' as const,
      createdBy: c.createdByUser,
      createdAt: c.createdAt.toISOString(),
      statut: c.statut,
    }));

    const formattedEtablissementRequests = etablissementRequests.map(r => ({
      id: r.id,
      titre: `${r.type === 'CREATION' ? 'Création' : 'Modification'} : ${r.etablissement?.nom || 'Nouvel établissement'}`,
      description: r.justification || undefined,
      contenu: `Demande de ${r.type.toLowerCase()} soumise par ${r.soumisPar.prenom} ${r.soumisPar.nom}`,
      type: 'etablissement_request' as const,
      createdBy: r.soumisPar,
      etablissement: r.etablissement,
      createdAt: r.createdAt.toISOString(),
      statut: r.statut,
    }));

    const formattedProgrammes = programmes.map(p => ({
      id: p.id,
      titre: p.titre,
      description: p.description || undefined,
      contenu: `Activité du ${new Date(p.date).toLocaleDateString()} de ${p.heureDebut} à ${p.heureFin}`,
      type: 'programme' as const,
      createdBy: p.createdByUser,
      etablissement: p.etablissement,
      createdAt: p.createdAt.toISOString(),
      statut: p.statut,
    }));

    const formattedEvaluations = evaluations.map(ev => ({
      id: ev.id,
      titre: `Avis ${ev.noteGlobale}/5 - ${ev.etablissement.nom}`,
      description: ev.commentaire || undefined,
      contenu: ev.isSignalee ? `SIGNALÉ: ${ev.motifSignalement}` : `Avis de ${ev.user.prenom} ${ev.user.nom}`,
      type: 'evaluation' as const,
      createdBy: ev.user,
      etablissement: ev.etablissement,
      createdAt: ev.createdAt.toISOString(),
      statut: ev.isSignalee ? 'SIGNALEE' : 'EN_ATTENTE',
    }));

    // Fusionner et filtrer par type
    let items: any[] = [];
    if (type === 'evenements' || type === 'all') items = [...items, ...formattedEvenements];
    if (type === 'actualites' || type === 'all') items = [...items, ...formattedActualites];
    if (type === 'articles' || type === 'all') items = [...items, ...formattedArticles];
    if (type === 'campagnes' || type === 'all') items = [...items, ...formattedCampagnes];
    if (type === 'etablissement_requests' || type === 'all') items = [...items, ...formattedEtablissementRequests];
    if (type === 'programmes' || type === 'all') items = [...items, ...formattedProgrammes];
    if (type === 'evaluations' || type === 'all') items = [...items, ...formattedEvaluations];

    // Trier par date décroissante
    items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({
      items,
      counts: {
        evenements: formattedEvenements.length,
        actualites: formattedActualites.length,
        articles: formattedArticles.length,
        campagnes: formattedCampagnes.length,
        etablissementRequests: formattedEtablissementRequests.length,
        programmes: formattedProgrammes.length,
        evaluations: formattedEvaluations.length,
        total: items.length,
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
    const userId = parseInt(session.user.id);
    const { checkPermission } = await import("@/lib/permissions");
    
    // Vérifier la permission spécifique
    let hasPermission = false;
    if (type === 'evenement') hasPermission = await checkPermission(userId, 'evenements.validate');
    else if (type === 'actualite') hasPermission = await checkPermission(userId, 'actualites.validate');
    else if (type === 'article' || type === 'campagne') hasPermission = await checkPermission(userId, 'actualites.validate');
    else if (type === 'etablissement_request') hasPermission = await checkPermission(userId, 'etablissements.validate');
    else if (type === 'programme') hasPermission = await checkPermission(userId, 'programmes.validate');
    else if (type === 'evaluation') hasPermission = await checkPermission(userId, 'evaluations.validate');

    if (!hasPermission) {
       return NextResponse.json({ error: 'Action non autorisée pour ce type de contenu' }, { status: 403 });
    }

    if (!id || !type || !action) {
      return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 });
    }

    // --- LOGIQUE DE VALIDATION PAR TYPE ---
    
    if (type === 'evenement') {
      await prisma.evenement.update({
        where: { id },
        data: {
          statut: action === 'approve' ? 'PUBLIEE' : 'REJETEE',
          motifRejet: action === 'reject' ? motifRejet : null,
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
      await prisma.article.update({
        where: { id },
        data: { isPublie: action === 'approve' },
      });
    } else if (type === 'campagne') {
      await prisma.campagne.update({
        where: { id },
        data: {
          statut: action === 'approve' ? 'ACTIVE' : 'ANNULEE',
          isActive: action === 'approve',
        },
      });
    } else if (type === 'programme') {
      await prisma.programmeActivite.update({
        where: { id },
        data: {
          statut: action === 'approve' ? 'PLANIFIEE' : 'ANNULEE',
          isValideParAdmin: action === 'approve',
        },
      });
    } else if (type === 'evaluation') {
      if (action === 'reject') {
        await prisma.evaluation.delete({ where: { id } });
      } else {
        await prisma.evaluation.update({
          where: { id },
          data: { isValidee: true, isSignalee: false },
        });
      }
    } else if (type === 'etablissement_request') {
      const requestData = await prisma.demandeModificationEtablissement.findUnique({
        where: { id },
      });

      if (!requestData) {
        return NextResponse.json({ error: 'Demande non trouvée' }, { status: 404 });
      }

      if (action === 'approve') {
        const data = requestData.donneesModifiees as any;
        if (requestData.type === 'CREATION') {
          await prisma.etablissement.create({
            data: { ...data, isValide: true, isPublie: true }
          });
        } else if (requestData.type === 'MODIFICATION' && requestData.etablissementId) {
          await prisma.etablissement.update({
            where: { id: requestData.etablissementId },
            data: { ...data, isValide: true }
          });
        }
      }

      await prisma.demandeModificationEtablissement.update({
        where: { id },
        data: {
          statut: action === 'approve' ? 'APPROUVEE' : 'REJETEE',
          motifRejet: action === 'reject' ? motifRejet : null,
          valideParId: userId,
          dateValidation: new Date(),
        }
      });
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
