import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { withErrorHandler } from '@/lib/api-handler';
import { UnauthorizedError, ForbiddenError, NotFoundError, ValidationError, AppError } from '@/lib/exceptions';

// POST - Clôturer un événement avec rapport
export const POST = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    throw new UnauthorizedError('Vous devez être connecté pour clôturer un événement');
  }

  const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(session.user.role || '');
  if (!isAdmin) {
    throw new ForbiddenError('Seuls les administrateurs peuvent clôturer les événements');
  }

  const { id: idStr } = await params;
  const id = parseInt(idStr);
  
  if (isNaN(id)) {
    throw new ValidationError("L'identifiant de l'événement n'est pas valide");
  }

  const evenement = await prisma.evenement.findUnique({
    where: { id },
    select: { 
      id: true, 
      titre: true, 
      statut: true, 
      dateFin: true,
      nombreInscrits: true
    }
  });

  if (!evenement) {
    throw new NotFoundError("L'événement n'existe pas");
  }

  // Vérifier que l'événement peut être clôturé
  if (evenement.statut === 'CLOTUREE') {
    throw new AppError('Cet événement est déjà clôturé', 'ALREADY_CLOSED', 400);
  }

  if (evenement.statut === 'ANNULEE') {
    throw new AppError('Un événement annulé ne peut pas être clôturé', 'INVALID_STATUS', 400);
  }

  const body = await request.json();
  
  // Validation
  if (!body.rapportCloture || body.rapportCloture.trim().length < 20) {
    throw new ValidationError('Le rapport de clôture est obligatoire (minimum 20 caractères)', {
      fieldErrors: { rapportCloture: ['Le rapport doit contenir au moins 20 caractères'] }
    });
  }

  // Mise à jour de l'événement avec la clôture
  const updated = await prisma.evenement.update({
    where: { id },
    data: {
      statut: 'CLOTUREE',
      bilanDescription: body.rapportCloture.trim(),
      bilanNbParticipants: body.bilanParticipation ? parseInt(body.bilanParticipation) : evenement.nombreInscrits,
      bilanDatePublication: new Date(),
    },
    include: {
      etablissement: { select: { nom: true } },
      commune: { select: { nom: true } },
    }
  });

  // Créer un log d'audit
  try {
    await prisma.audit.create({
      data: {
        action: 'CLOTURE_EVENEMENT',
        entite: 'Evenement',
        entiteId: id,
        userId: parseInt(session.user.id),
        details: {
          titre: evenement.titre,
          rapportCloture: body.rapportCloture.substring(0, 100) + '...',
          bilanParticipation: body.bilanParticipation,
        }
      }
    });
  } catch (auditError) {
    console.error('Erreur audit (non bloquante):', auditError);
  }

  // Notification au créateur de l'événement
  try {
    if (updated.createdBy) {
      await prisma.notification.create({
        data: {
          userId: updated.createdBy,
          type: 'EVENEMENT_CLOTURE',
          titre: 'Événement clôturé',
          message: `L'événement "${updated.titre}" a été clôturé par l'administration.`,
          lien: `/delegation/evenements`,
        }
      });
    }
  } catch (notifError) {
    console.error('Erreur notification (non bloquante):', notifError);
  }

  return NextResponse.json({
    success: true,
    message: `L'événement "${evenement.titre}" a été clôturé avec succès`,
    data: updated
  });
});
