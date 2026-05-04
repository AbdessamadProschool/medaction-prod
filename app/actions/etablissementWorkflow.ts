'use server';

import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { checkPermission } from '@/lib/permissions';
import { UnauthorizedError, ForbiddenError, AppError } from '@/lib/exceptions';
import { logger, auditLog } from '@/lib/logger';
import { Role } from '@prisma/client';

const SystemLogger = {
  info: (context: string, message: string, meta: any) => logger.info(message, { context, ...meta }),
  error: (context: string, message: string, meta: any) => logger.error(message, meta?.error instanceof Error ? meta.error : undefined, { context, ...meta }),
  audit: (context: string, message: string, meta: any) => auditLog(message, context, meta?.demandeId || meta?.etablissementId || 0, meta?.adminId || meta?.userId || 0, meta)
};

/**
 * Soumet une demande de modification ou de création d'un établissement.
 * Accessible par DELEGATION et COORDINATEUR_ACTIVITES.
 */
export async function soumettreDemandeEtablissement(params: {
  type: 'CREATION' | 'MODIFICATION';
  etablissementId?: number;
  donneesModifiees: any;
  champsComplementaires?: any;
  justification?: string;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new UnauthorizedError();

  const userId = parseInt(session.user.id);
  const permission = params.type === 'CREATION' 
    ? 'etablissements.request.create' 
    : 'etablissements.request.edit';

  const hasPermission = await checkPermission(userId, permission);
  if (!hasPermission) throw new ForbiddenError("Permission de soumettre une demande insuffisante");

  // Sécurité Secteur pour DELEGATION
  const isDelegation = session.user.role === 'DELEGATION';
  const userSecteur = session.user.secteurResponsable;

  if (isDelegation && userSecteur) {
    // Force le secteur pour les créations
    if (params.type === 'CREATION') {
      params.donneesModifiees.secteur = userSecteur;
    }
  }

  // Si c'est une modification, on vérifie que l'établissement existe
  if (params.type === 'MODIFICATION') {
    if (!params.etablissementId) throw new AppError("ID d'établissement requis pour une modification", 'VALIDATION_ERROR', 400);
    const exists = await prisma.etablissement.findUnique({ where: { id: params.etablissementId } });
    if (!exists) throw new AppError("Établissement non trouvé", 'NOT_FOUND', 404);

    // Sécurité supplémentaire pour modification : le délégué ne peut pas changer le secteur
    // et ne peut modifier que les établissements de son propre secteur
    if (isDelegation && userSecteur) {
      if (exists.secteur !== userSecteur) {
        throw new ForbiddenError("Vous ne pouvez modifier que les établissements de votre secteur");
      }
      // On s'assure que le secteur n'est pas changé dans la demande
      params.donneesModifiees.secteur = userSecteur;
    }
  }

  try {
    const demande = await prisma.demandeModificationEtablissement.create({
      data: {
        type: params.type,
        etablissementId: params.etablissementId,
        donneesModifiees: params.donneesModifiees,
        champsComplementaires: params.champsComplementaires || {},
        justification: params.justification,
        soumisParId: userId,
        statut: 'EN_ATTENTE_VALIDATION',
      }
    });

    SystemLogger.info('establishment_workflow', `Nouvelle demande de ${params.type} soumise`, {
      demandeId: demande.id,
      userId,
      etablissementId: params.etablissementId
    });

    // Optionnel: Notification pour les admins
    // await createNotificationForAdmin(...) 

    revalidatePath('/admin/etablissements/demandes');
    return { success: true, demandeId: demande.id };
  } catch (error: any) {
    SystemLogger.error('establishment_workflow', "Échec de soumission de la demande", { error, params });
    
    let errorMessage = "Une erreur est survenue lors de la soumission de la demande";
    if (error.code === 'P2002') {
      errorMessage = "Une demande similaire est déjà en cours de traitement.";
    } else if (error.message) {
      errorMessage = error.message;
    }

    return { success: false, error: errorMessage };
  }
}

/**
 * Approuve ou rejette une demande (ADMIN uniquement).
 */
export async function traiterDemandeEtablissement(params: {
  demandeId: number;
  action: 'APPROUVER' | 'REJETER';
  motifRejet?: string;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new UnauthorizedError();

  const userId = parseInt(session.user.id);
  const isAdmin = await checkPermission(userId, 'etablissements.validate');
  if (!isAdmin) throw new ForbiddenError("Permission de validation insuffisante");

  const demande = await prisma.demandeModificationEtablissement.findUnique({
    where: { id: params.demandeId },
    include: { soumisPar: true }
  });

  if (!demande) throw new AppError("Demande non trouvée", 'NOT_FOUND', 404);
  if (demande.statut !== 'EN_ATTENTE_VALIDATION') throw new AppError("La demande a déjà été traitée", 'CONFLICT', 400);

  try {
    if (params.action === 'APPROUVER') {
      const dataToApply = demande.donneesModifiees as any;
      const extraFields = demande.champsComplementaires as any;

      if (demande.type === 'CREATION') {
        // Appliquer la création
        await prisma.etablissement.create({
          data: {
            ...dataToApply,
            champsComplementaires: extraFields || {},
            donneesSpecifiques: dataToApply.donneesSpecifiques ?? {},
            isValide: true, // Automatiquement validé puisqu'approuvé
          }
        });
      } else {
        // Appliquer la modification
        if (!demande.etablissementId) throw new Error("ID établissement manquant");
        
        await prisma.etablissement.update({
          where: { id: demande.etablissementId },
          data: {
            ...dataToApply,
            champsComplementaires: extraFields,
            isValide: true,
          }
        });
      }

      await prisma.demandeModificationEtablissement.update({
        where: { id: params.demandeId },
        data: {
          statut: 'APPROUVEE',
          valideParId: userId,
          dateValidation: new Date()
        }
      });

      SystemLogger.audit('establishment_workflow', `Demande ${demande.id} approuvée`, {
        adminId: userId,
        type: demande.type,
        etablissementId: demande.etablissementId
      });

    } else {
      // Rejet
      await prisma.demandeModificationEtablissement.update({
        where: { id: params.demandeId },
        data: {
          statut: 'REJETEE',
          motifRejet: params.motifRejet,
          valideParId: userId,
          dateValidation: new Date()
        }
      });

      SystemLogger.audit('establishment_workflow', `Demande ${demande.id} rejetée`, {
        adminId: userId,
        motif: params.motifRejet
      });
    }

    revalidatePath('/admin/etablissements/demandes');
    revalidatePath('/etablissements');
    return { success: true };
  } catch (error: any) {
    SystemLogger.error('establishment_workflow', "Échec du traitement de la demande", { error, params });
    
    // Gestion professionnelle des erreurs
    let errorMessage = "Une erreur est survenue lors du traitement de la demande";
    
    if (error.code === 'P2002') {
      errorMessage = "Un établissement avec ce code ou ce nom existe déjà.";
    } else if (error.name === 'PrismaClientValidationError') {
      errorMessage = "Données invalides ou manquantes. Veuillez vérifier le formulaire.";
    } else if (error.message) {
      errorMessage = error.message;
    }

    return { success: false, error: errorMessage };
  }
}

/**
 * Récupère les demandes pour les admins ou les propres demandes de l'utilisateur.
 */
export async function getDemandesEtablissement(filters: {
  userId?: number;
  statut?: string;
} = {}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new UnauthorizedError();

  const isAdmin = await checkPermission(parseInt(session.user.id), 'etablissements.validate');
  const userId = parseInt(session.user.id);

  // Si pas admin, on force le filtre sur l'utilisateur courant
  const where: any = {};
  if (!isAdmin) {
    where.soumisParId = userId;
  } else if (filters.userId) {
    where.soumisParId = filters.userId;
  }

  if (filters.statut) {
    where.statut = filters.statut;
  }

  return await prisma.demandeModificationEtablissement.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      soumisPar: { select: { nom: true, prenom: true, photo: true } },
      validePar: { select: { nom: true, prenom: true } },
      etablissement: { select: { nom: true, code: true } }
    }
  });
}
