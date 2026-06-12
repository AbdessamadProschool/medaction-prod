import { safeParseInt } from '@/lib/utils/parse';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { withErrorHandler, successResponse } from '@/lib/api-handler';
import { UnauthorizedError, ForbiddenError, ValidationError, NotFoundError } from '@/lib/exceptions';
import { notifyAdmins } from '@/lib/notifications';

const traiterSchema = z.object({
  solutionApportee: z.string().min(10, 'La solution doit contenir au moins 10 caractères'),
});

// PATCH - Traiter/Résoudre une réclamation (AUTORITE_LOCALE)
export const PATCH = withErrorHandler(async (
  request: Request,
  { params: _p }: { params: Promise<{ id: string }> }
) => {
  const params = await _p;
  const id = safeParseInt(params.id, 0);
  
  if (!id) {
    throw new ValidationError('ID invalide');
  }

  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    throw new UnauthorizedError('Non autorisé');
  }

  const userId = parseInt(session.user.id);
  const role = session.user.role;

  // Seuls les autorités locales et admins peuvent traiter
  if (!['AUTORITE_LOCALE', 'ADMIN', 'SUPER_ADMIN'].includes(role)) {
    throw new ForbiddenError('Vous n\'êtes pas autorisé à traiter cette réclamation');
  }

  const body = await request.json();
  const validation = traiterSchema.safeParse(body);

  if (!validation.success) {
    throw new ValidationError(validation.error.issues[0].message);
  }

  const { solutionApportee } = validation.data;

  // Vérifier que la réclamation existe
  const reclamation = await prisma.reclamation.findUnique({
    where: { id },
    include: { user: { select: { id: true } } }
  });

  if (!reclamation) {
    throw new NotFoundError('Réclamation non trouvée');
  }

  // Vérifier que la réclamation est bien affectée à cette autorité (si rôle AUTORITE_LOCALE)
  if (role === 'AUTORITE_LOCALE' && reclamation.affecteeAAutoriteId !== userId) {
    throw new ForbiddenError('Cette réclamation ne vous est pas affectée');
  }

  if (reclamation.statut !== 'ACCEPTEE') {
    throw new ValidationError('Seule une réclamation acceptée peut être traitée');
  }

  if (reclamation.affectationReclamation !== 'AFFECTEE') {
    throw new ValidationError('Cette réclamation n\'est pas encore affectée');
  }

  if (reclamation.dateResolution) {
    throw new ValidationError('Cette réclamation a déjà été traitée ou résolue');
  }

    // Mettre à jour la réclamation
    const updated = await prisma.reclamation.update({
      where: { id },
      data: {
        solutionApportee,
        dateResolution: new Date(),
      }
    });

    // Créer l'entrée d'historique
    await prisma.historiqueReclamation.create({
      data: {
        reclamationId: id,
        action: 'RESOLUTION',
        details: {
          solutionApportee,
          resoluPar: `${session.user.nom} ${session.user.prenom}`,
          dateResolution: new Date().toISOString(),
        },
        effectuePar: userId,
      }
    });

    // Notifier le citoyen
    await prisma.notification.create({
      data: {
        userId: reclamation.userId,
        type: 'RECLAMATION_RESOLUE',
        titre: 'Réclamation résolue',
        message: `Votre réclamation "${reclamation.titre}" a été traitée. Consultez la solution apportée.`,
        lien: `/mes-reclamations/${id}`,
      }
    });

    // Notifier les admins
    await notifyAdmins({
      type: 'RECLAMATION_RESOLUE',
      titre: 'Réclamation résolue',
      message: `La réclamation "${reclamation.titre}" a été résolue.`,
      lien: `/admin/reclamations/${id}`,
    });

    return successResponse(updated, 'Réclamation résolue avec succès');
});