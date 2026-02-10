import { prisma } from "@/lib/db";

// Types de notifications disponibles
export const NotificationType = {
  // Réclamations
  NOUVELLE_RECLAMATION: 'NOUVELLE_RECLAMATION',
  RECLAMATION_ACCEPTEE: 'RECLAMATION_ACCEPTEE',
  RECLAMATION_REJETEE: 'RECLAMATION_REJETEE',
  RECLAMATION_AFFECTEE: 'RECLAMATION_AFFECTEE',
  RECLAMATION_RESOLUE: 'RECLAMATION_RESOLUE',
  
  // Événements
  EVENEMENT_VALIDE: 'EVENEMENT_VALIDE',
  EVENEMENT_REJETE: 'EVENEMENT_REJETE',
  NOUVEL_EVENEMENT: 'NOUVEL_EVENEMENT',
  
  // Actualités
  ACTUALITE_VALIDEE: 'ACTUALITE_VALIDEE',
  NOUVELLE_ACTUALITE: 'NOUVELLE_ACTUALITE',
  
  // Abonnements
  NOUVEL_ABONNEMENT: 'NOUVEL_ABONNEMENT',
  
  // Évaluations
  NOUVELLE_EVALUATION: 'NOUVELLE_EVALUATION',
  
  // Compte
  ACCOUNT_ACTIVATED: 'ACCOUNT_ACTIVATED',
  ACCOUNT_DEACTIVATED: 'ACCOUNT_DEACTIVATED',
  ROLE_CHANGED: 'ROLE_CHANGED',
  
  // Système
  SYSTEM: 'SYSTEM',
} as const;

export type NotificationTypeValue = typeof NotificationType[keyof typeof NotificationType];

interface CreateNotificationParams {
  userId: number;
  type: NotificationTypeValue;
  titre: string;
  message: string;
  lien?: string;
}

interface BulkNotificationParams {
  userIds: number[];
  type: NotificationTypeValue;
  titre: string;
  message: string;
  lien?: string;
}

/**
 * Créer une notification pour un utilisateur
 */
export async function createNotification(params: CreateNotificationParams) {
  try {
    return await prisma.notification.create({
      data: {
        userId: params.userId,
        type: params.type,
        titre: params.titre,
        message: params.message,
        lien: params.lien || null,
      }
    });
  } catch (error) {
    console.error('[NotificationService] Erreur création:', error);
    throw error;
  }
}

/**
 * Créer des notifications pour plusieurs utilisateurs
 */
export async function createBulkNotifications(params: BulkNotificationParams) {
  try {
    return await prisma.notification.createMany({
      data: params.userIds.map(userId => ({
        userId,
        type: params.type,
        titre: params.titre,
        message: params.message,
        lien: params.lien || null,
      }))
    });
  } catch (error) {
    console.error('[NotificationService] Erreur création bulk:', error);
    throw error;
  }
}

/**
 * Notifier les admins d'une nouvelle réclamation
 */
export async function notifyNewReclamation(reclamationId: number, titre: string) {
  try {
    // Récupérer tous les admins
    const admins = await prisma.user.findMany({
      where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] }, isActive: true },
      select: { id: true }
    });

    if (admins.length === 0) return;

    await createBulkNotifications({
      userIds: admins.map(a => a.id),
      type: NotificationType.NOUVELLE_RECLAMATION,
      titre: 'Nouvelle réclamation',
      message: `Une nouvelle réclamation a été soumise: "${titre}"`,
      lien: `/admin/reclamations/${reclamationId}`,
    });

    console.log(`[NotificationService] ${admins.length} admin(s) notifié(s) pour réclamation #${reclamationId}`);
  } catch (error) {
    console.error('[NotificationService] Erreur notifyNewReclamation:', error);
  }
}

/**
 * Notifier un citoyen que sa réclamation a été acceptée
 */
export async function notifyReclamationAccepted(reclamationId: number, userId: number) {
  try {
    await createNotification({
      userId,
      type: NotificationType.RECLAMATION_ACCEPTEE,
      titre: 'Réclamation acceptée',
      message: 'Votre réclamation a été acceptée et sera traitée prochainement.',
      lien: `/mes-reclamations/${reclamationId}`,
    });
  } catch (error) {
    console.error('[NotificationService] Erreur notifyReclamationAccepted:', error);
  }
}

/**
 * Notifier un citoyen que sa réclamation a été rejetée
 */
export async function notifyReclamationRejected(reclamationId: number, userId: number, motif?: string) {
  try {
    await createNotification({
      userId,
      type: NotificationType.RECLAMATION_REJETEE,
      titre: 'Réclamation rejetée',
      message: motif 
        ? `Votre réclamation a été rejetée. Motif: ${motif}`
        : 'Votre réclamation a été rejetée.',
      lien: `/mes-reclamations/${reclamationId}`,
    });
  } catch (error) {
    console.error('[NotificationService] Erreur notifyReclamationRejected:', error);
  }
}

/**
 * Notifier une autorité locale qu'une réclamation lui a été affectée
 */
export async function notifyReclamationAssigned(reclamationId: number, autoriteId: number) {
  try {
    await createNotification({
      userId: autoriteId,
      type: NotificationType.RECLAMATION_AFFECTEE,
      titre: 'Nouvelle réclamation affectée',
      message: 'Une réclamation vous a été affectée pour traitement.',
      lien: `/autorite/reclamations/${reclamationId}`,
    });
  } catch (error) {
    console.error('[NotificationService] Erreur notifyReclamationAssigned:', error);
  }
}

/**
 * Notifier un citoyen que sa réclamation a été résolue
 */
export async function notifyReclamationResolved(reclamationId: number, userId: number) {
  try {
    await createNotification({
      userId,
      type: NotificationType.RECLAMATION_RESOLUE,
      titre: 'Réclamation résolue',
      message: 'Votre réclamation a été résolue. Merci pour votre patience.',
      lien: `/mes-reclamations/${reclamationId}`,
    });
  } catch (error) {
    console.error('[NotificationService] Erreur notifyReclamationResolved:', error);
  }
}

/**
 * Notifier une délégation que son événement a été validé
 */
export async function notifyEventValidated(evenementId: number, creatorId: number, titre: string) {
  try {
    await createNotification({
      userId: creatorId,
      type: NotificationType.EVENEMENT_VALIDE,
      titre: 'Événement validé',
      message: `Votre événement "${titre}" a été validé et publié.`,
      lien: `/evenements/${evenementId}`,
    });
  } catch (error) {
    console.error('[NotificationService] Erreur notifyEventValidated:', error);
  }
}

/**
 * Notifier une délégation que son événement a été rejeté
 */
export async function notifyEventRejected(evenementId: number, creatorId: number, titre: string, motif?: string) {
  try {
    await createNotification({
      userId: creatorId,
      type: NotificationType.EVENEMENT_REJETE,
      titre: 'Événement rejeté',
      message: motif 
        ? `Votre événement "${titre}" a été rejeté. Motif: ${motif}`
        : `Votre événement "${titre}" a été rejeté.`,
    });
  } catch (error) {
    console.error('[NotificationService] Erreur notifyEventRejected:', error);
  }
}

/**
 * Notifier les abonnés d'un nouvel événement (établissement)
 */
export async function notifySubscribersNewEvent(etablissementId: number, evenementId: number, titre: string) {
  try {
    const subscribers = await prisma.abonnementEtablissement.findMany({
      where: { etablissementId, notificationsActives: true },
      select: { userId: true }
    });

    if (subscribers.length === 0) return;

    await createBulkNotifications({
      userIds: subscribers.map(s => s.userId),
      type: NotificationType.NOUVEL_EVENEMENT,
      titre: 'Nouvel événement',
      message: `Un nouvel événement a été publié: "${titre}"`,
      lien: `/evenements/${evenementId}`,
    });

    console.log(`[NotificationService] ${subscribers.length} abonné(s) notifié(s) pour événement #${evenementId}`);
  } catch (error) {
    console.error('[NotificationService] Erreur notifySubscribersNewEvent:', error);
  }
}

/**
 * Notifier les abonnés d'une nouvelle actualité (établissement)
 */
export async function notifySubscribersNewActualite(etablissementId: number, actualiteId: number, titre: string) {
  try {
    // Récupérer le nom de l'établissement
    const etablissement = await prisma.etablissement.findUnique({
      where: { id: etablissementId },
      select: { nom: true }
    });

    const subscribers = await prisma.abonnementEtablissement.findMany({
      where: { etablissementId, notificationsActives: true },
      select: { userId: true }
    });

    if (subscribers.length === 0) return;

    await createBulkNotifications({
      userIds: subscribers.map(s => s.userId),
      type: NotificationType.NOUVELLE_ACTUALITE,
      titre: 'Nouvelle actualité',
      message: etablissement 
        ? `${etablissement.nom} a publié une nouvelle actualité: "${titre}"`
        : `Une nouvelle actualité a été publiée: "${titre}"`,
      lien: `/actualites/${actualiteId}`,
    });

    console.log(`[NotificationService] ${subscribers.length} abonné(s) notifié(s) pour actualité #${actualiteId}`);
  } catch (error) {
    console.error('[NotificationService] Erreur notifySubscribersNewActualite:', error);
  }
}

/**
 * Notifier un utilisateur d'un changement de rôle
 */
export async function notifyRoleChanged(userId: number, oldRole: string, newRole: string) {
  try {
    await createNotification({
      userId,
      type: NotificationType.ROLE_CHANGED,
      titre: 'Rôle modifié',
      message: `Votre rôle a été modifié de "${oldRole}" à "${newRole}".`,
    });
  } catch (error) {
    console.error('[NotificationService] Erreur notifyRoleChanged:', error);
  }
}

/**
 * Compter les notifications non lues d'un utilisateur
 */
export async function getUnreadCount(userId: number): Promise<number> {
  return prisma.notification.count({
    where: { userId, isLue: false }
  });
}

/**
 * Obtenir les dernières notifications non lues (pour dropdown)
 */
export async function getRecentUnread(userId: number, limit: number = 5) {
  return prisma.notification.findMany({
    where: { userId, isLue: false },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}
