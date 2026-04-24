import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { withErrorHandler, successResponse } from '@/lib/api-handler';
import { UnauthorizedError, ForbiddenError, NotFoundError, ValidationError, AppError } from '@/lib/exceptions';
import { getSafeId } from '@/lib/utils/parse';
import { StatutEvenement } from '@prisma/client';

const STATUT_LABELS: Record<string, string> = {
  'EN_ATTENTE_VALIDATION': 'En attente de validation',
  'VALIDEE': 'Validé',
  'PUBLIEE': 'Publié',
  'EN_ACTION': 'En cours',
  'CLOTUREE': 'Clôturé',
  'ANNULEE': 'Annulé',
};

// Transitions valides des statuts (étendu)
const VALID_TRANSITIONS: Record<string, string[]> = {
  'EN_ATTENTE_VALIDATION': ['VALIDEE', 'ANNULEE'],
  'VALIDEE': ['PUBLIEE', 'ANNULEE', 'EN_ATTENTE_VALIDATION'],
  'PUBLIEE': ['EN_ACTION', 'ANNULEE'],
  'EN_ACTION': ['CLOTUREE', 'ANNULEE'],
  'CLOTUREE': [],
  'ANNULEE': ['EN_ATTENTE_VALIDATION'],
};

// SECURITY FIX: Transitions réservées aux administrateurs
// Un créateur ne peut PAS auto-valider ni auto-publier son propre événement
const ADMIN_ONLY_TRANSITIONS: string[] = ['VALIDEE', 'PUBLIEE'];

// PATCH - Changer le statut d'un événement
export const PATCH = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    throw new UnauthorizedError('Vous devez être connecté');
  }

  const { id: idStr } = await params;
  const id = getSafeId(idStr);
  
  const userId = Number(session.user.id);
  const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(session.user.role || '');

  const body = await request.json();
  const nouveauStatut = body.statut;

  if (!nouveauStatut || !STATUT_LABELS[nouveauStatut]) {
    throw new ValidationError('Statut invalide', {
      fieldErrors: { statut: [`Valeurs acceptées: ${Object.keys(STATUT_LABELS).join(', ')}`] }
    });
  }

  // Vérifier que l'événement existe
  const evenement = await prisma.evenement.findUnique({
    where: { id },
    select: { 
      id: true, 
      statut: true, 
      titre: true, 
      createdBy: true,
      dateDebut: true,
      dateFin: true 
    }
  });

  if (!evenement) {
    throw new NotFoundError("L'événement n'existe pas");
  }

  // Vérifier les permissions
  const isCreator = evenement.createdBy === userId;
  if (!isAdmin && !isCreator) {
    throw new ForbiddenError("Vous n'avez pas les droits pour modifier cet événement");
  }

  // Vérifier la transition de statut
  const allowedTransitions = VALID_TRANSITIONS[evenement.statut] || [];
  if (!allowedTransitions.includes(nouveauStatut)) {
    throw new AppError(
      `Transition de "${STATUT_LABELS[evenement.statut]}" vers "${STATUT_LABELS[nouveauStatut]}" non autorisée`,
      'VALIDATION_ERROR',
      400
    );
  }

  // SECURITY FIX: Les transitions de validation/publication sont réservées aux admins
  // Un créateur ne peut PAS auto-valider ni auto-publier
  if (ADMIN_ONLY_TRANSITIONS.includes(nouveauStatut) && !isAdmin) {
    throw new ForbiddenError(
      'Cette transition requiert une validation par un administrateur'
    );
  }

  // Pour la clôture, utiliser l'endpoint dédié
  if (nouveauStatut === 'CLOTUREE') {
    throw new AppError(
      'Pour clôturer un événement, utilisez le formulaire de clôture avec rapport',
      'VALIDATION_ERROR',
      400
    );
  }

  // Vérification pour EN_ACTION: date de début atteinte
  if (nouveauStatut === 'EN_ACTION') {
    const now = new Date();
    if (evenement.dateDebut > now) {
      throw new AppError(
        "L'événement ne peut pas être mis en action avant sa date de début",
        'VALIDATION_ERROR',
        400
      );
    }
  }

  // Mise à jour
  const updateData: { statut: StatutEvenement; datePublication?: Date } = {
    statut: nouveauStatut as StatutEvenement,
  };

  if (nouveauStatut === 'PUBLIEE') {
    updateData.datePublication = new Date();
  }

  const updated = await prisma.evenement.update({
    where: { id },
    data: updateData,
    include: {
      etablissement: { select: { nom: true } },
    }
  });

  // Notification au créateur
  try {
    if (evenement.createdBy && evenement.createdBy !== userId) {
      let message = '';
      if (nouveauStatut === 'VALIDEE') {
        message = `Votre événement "${evenement.titre}" a été validé.`;
      } else if (nouveauStatut === 'PUBLIEE') {
        message = `Votre événement "${evenement.titre}" est maintenant publié.`;
      } else if (nouveauStatut === 'ANNULEE') {
        message = `Votre événement "${evenement.titre}" a été annulé.`;
      } else if (nouveauStatut === 'EN_ACTION') {
        message = `L'événement "${evenement.titre}" est maintenant en cours !`;
      }

      if (message) {
        await prisma.notification.create({
          data: {
            userId: evenement.createdBy,
            type: 'EVENEMENT_STATUT',
            titre: `Événement ${STATUT_LABELS[nouveauStatut]}`,
            message,
            lien: `/delegation/evenements`,
          }
        });
      }
    }
  } catch (notifError) {
    // Note: Log notification errors but don't fail the request
    console.error('Erreur notification (non bloquante):', notifError);
  }

  return successResponse(
    updated,
    `Événement "${evenement.titre}" marqué comme "${STATUT_LABELS[nouveauStatut]}"`
  );
});

// POST - Alias pour compatibilité
export const POST = PATCH;