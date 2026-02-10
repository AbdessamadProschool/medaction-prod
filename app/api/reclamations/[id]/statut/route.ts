import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { validateId, sanitizeString } from '@/lib/security/validation';
import { 
  notifyReclamationAccepted, 
  notifyReclamationRejected,
  notifyReclamationAssigned,
} from '@/lib/notifications';

// PATCH - Changer le statut d'une réclamation (Admin)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Vérifier le rôle admin
    if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role || '')) {
      return NextResponse.json({ error: 'Accès réservé aux administrateurs' }, { status: 403 });
    }

    // SECURITY FIX: Validate ID to prevent integer overflow
    const reclamationId = validateId(params.id);
    if (reclamationId === null) {
      return NextResponse.json({ error: 'ID invalide' }, { status: 400 });
    }

    const body = await request.json();
    const { 
      statut, 
      motifRejet,
      affecteeAAutoriteId,
      secteurAffecte,
      serviceInterneProvince,
      commentaire,
    } = body;

    // Vérifier que la réclamation existe
    const reclamation = await prisma.reclamation.findUnique({
      where: { id: reclamationId },
      select: { 
        id: true, 
        userId: true, 
        titre: true, 
        statut: true,
        affectationReclamation: true,
      }
    });

    if (!reclamation) {
      return NextResponse.json({ error: 'Réclamation non trouvée' }, { status: 404 });
    }

    // Construire les données de mise à jour
    const updateData: any = {};
    let action = '';
    let notifyUser = false;

    // Changement de statut
    if (statut) {
      if (!['ACCEPTEE', 'REJETEE'].includes(statut)) {
        return NextResponse.json({ error: 'Statut invalide' }, { status: 400 });
      }
      
      updateData.statut = statut;
      action = statut === 'ACCEPTEE' ? 'ACCEPTATION' : 'REJET';

      if (statut === 'REJETEE') {
        if (!motifRejet || motifRejet.trim().length < 10) {
          return NextResponse.json({ 
            error: 'Le motif de rejet doit contenir au moins 10 caractères' 
          }, { status: 400 });
        }
        updateData.motifRejet = motifRejet.trim();
        // IMPORTANT: Clear affectation when rejecting so it's no longer visible to authority
        updateData.affecteeAAutoriteId = null;
        updateData.affectationReclamation = 'NON_AFFECTEE';
        updateData.secteurAffecte = null;
        updateData.serviceInterneProvince = null;
        updateData.dateAffectation = null;
      }
      
      notifyUser = true;
    }

    // Affectation à une autorité locale
    if (affecteeAAutoriteId) {
      // Vérifier que l'autorité existe et a le bon rôle
      const autorite = await prisma.user.findFirst({
        where: { 
          id: affecteeAAutoriteId, 
          role: 'AUTORITE_LOCALE',
          isActive: true,
        },
        select: { id: true, nom: true, prenom: true }
      });

      if (!autorite) {
        return NextResponse.json({ error: 'Autorité locale non trouvée' }, { status: 404 });
      }

      updateData.affecteeAAutoriteId = affecteeAAutoriteId;
      updateData.affecteeParAdminId = parseInt(session.user.id);
      updateData.affectationReclamation = 'AFFECTEE';
      updateData.dateAffectation = new Date();
      
      if (secteurAffecte) updateData.secteurAffecte = secteurAffecte;
      if (serviceInterneProvince) updateData.serviceInterneProvince = serviceInterneProvince;
      
      action = 'AFFECTATION';
    }

    // Mettre à jour la réclamation
    const updatedReclamation = await prisma.reclamation.update({
      where: { id: reclamationId },
      data: updateData,
      include: {
        user: { select: { id: true, nom: true, prenom: true, email: true } },
        commune: { select: { nom: true } },
      }
    });

    // Ajouter à l'historique
    if (action) {
      await prisma.historiqueReclamation.create({
        data: {
          reclamationId,
          action,
          details: {
            ...updateData,
            commentaire,
            effectueParId: parseInt(session.user.id),
            effectueParNom: `${session.user.prenom} ${session.user.nom}`,
          },
          effectuePar: parseInt(session.user.id),
        }
      });
    }

    // Envoyer les notifications
    if (notifyUser && statut === 'ACCEPTEE') {
      await notifyReclamationAccepted(reclamationId, reclamation.userId);
    } else if (notifyUser && statut === 'REJETEE') {
      await notifyReclamationRejected(reclamationId, reclamation.userId, motifRejet);
    }
    
    if (affecteeAAutoriteId) {
      await notifyReclamationAssigned(reclamationId, affecteeAAutoriteId);
    }

    return NextResponse.json({
      success: true,
      message: action === 'ACCEPTATION' 
        ? 'Réclamation acceptée'
        : action === 'REJET'
        ? 'Réclamation rejetée'
        : action === 'AFFECTATION'
        ? 'Réclamation affectée'
        : 'Réclamation mise à jour',
      data: updatedReclamation,
    });

  } catch (error) {
    console.error('Erreur changement statut réclamation:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
