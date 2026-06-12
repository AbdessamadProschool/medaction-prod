import { prisma } from '@/lib/db';

interface AdminNotificationPayload {
  type: string;
  titre: string;
  message: string;
  lien: string;
}

/**
 * Envoie une notification à tous les admins et super-admins actifs.
 * Non-bloquant : les erreurs sont loggées en warn mais ne propagent pas.
 *
 * Centralise le pattern répété dans evenements, actualites, suggestions, etc.
 */
export async function notifyAdmins(payload: AdminNotificationPayload): Promise<void> {
  try {
    const admins = await prisma.user.findMany({
      where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] }, isActive: true },
      select: { id: true },
    });

    if (admins.length === 0) return;

    await prisma.notification.createMany({
      data: admins.map(admin => ({
        userId: admin.id,
        ...payload,
      })),
    });
  } catch (err) {
    console.warn('[Notification] Admin notification failed (non-blocking):', err);
  }
}

/**
 * Notifie le déposant que sa réclamation a été acceptée.
 * Non-bloquant : les erreurs ne propagent pas.
 */
export async function notifyReclamationAccepted(
  reclamationId: number,
  userId: number
): Promise<void> {
  try {
    await prisma.notification.create({
      data: {
        userId,
        type: 'RECLAMATION_ACCEPTEE',
        titre: 'Réclamation acceptée',
        message: 'Votre réclamation a été acceptée et sera traitée prochainement.',
        lien: `/mes-reclamations/${reclamationId}`,
      },
    });
  } catch (err) {
    console.warn('[Notification] notifyReclamationAccepted failed (non-blocking):', err);
  }
}

/**
 * Notifie le déposant que sa réclamation a été rejetée.
 * Non-bloquant : les erreurs ne propagent pas.
 */
export async function notifyReclamationRejected(
  reclamationId: number,
  userId: number,
  motifRejet: string
): Promise<void> {
  try {
    await prisma.notification.create({
      data: {
        userId,
        type: 'RECLAMATION_REJETEE',
        titre: 'Réclamation rejetée',
        message: `Votre réclamation a été rejetée. Motif : ${motifRejet}`,
        lien: `/mes-reclamations/${reclamationId}`,
      },
    });
  } catch (err) {
    console.warn('[Notification] notifyReclamationRejected failed (non-blocking):', err);
  }
}

/**
 * Notifie l'autorité locale qu'une réclamation lui a été affectée.
 * Non-bloquant : les erreurs ne propagent pas.
 */
export async function notifyReclamationAssigned(
  reclamationId: number,
  autoriteId: number
): Promise<void> {
  try {
    await prisma.notification.create({
      data: {
        userId: autoriteId,
        type: 'RECLAMATION_AFFECTEE',
        titre: 'Nouvelle réclamation affectée',
        message: 'Une réclamation vous a été affectée pour traitement.',
        lien: `/autorite/reclamations/${reclamationId}`,
      },
    });
  } catch (err) {
    console.warn('[Notification] notifyReclamationAssigned failed (non-blocking):', err);
  }
}

/**
 * Notifie le déposant que sa réclamation a été résolue.
 * Non-bloquant : les erreurs ne propagent pas.
 */
export async function notifyReclamationResolved(
  reclamationId: number,
  userId: number
): Promise<void> {
  try {
    await prisma.notification.create({
      data: {
        userId,
        type: 'RECLAMATION_RESOLUE',
        titre: 'Réclamation résolue',
        message: 'Votre réclamation a été résolue avec succès.',
        lien: `/mes-reclamations/${reclamationId}`,
      },
    });
  } catch (err) {
    console.warn('[Notification] notifyReclamationResolved failed (non-blocking):', err);
  }
}
