import { safeParseInt } from '@/lib/utils/parse';
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { withErrorHandler, successResponse } from "@/lib/api-handler";
import { UnauthorizedError, ForbiddenError, ValidationError } from "@/lib/exceptions";

// Types de notifications
const NOTIFICATION_TYPES = [
  'NOUVELLE_RECLAMATION',
  'RECLAMATION_ACCEPTEE',
  'RECLAMATION_REJETEE',
  'RECLAMATION_AFFECTEE',
  'RECLAMATION_RESOLUE',
  'EVENEMENT_VALIDE',
  'EVENEMENT_REJETE',
  'ACTUALITE_VALIDEE',
  'NOUVEL_ABONNEMENT',
  'NOUVELLE_EVALUATION',
  'NOUVEAU_MESSAGE',
  'ACCOUNT_ACTIVATED',
  'ACCOUNT_DEACTIVATED',
  'ROLE_CHANGED',
  'SYSTEM',
];

// GET /api/notifications - Liste des notifications de l'utilisateur connecté
export const GET = withErrorHandler(async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    throw new UnauthorizedError("Non authentifié");
  }

    const userId = parseInt(session.user.id as string);
    const { searchParams } = new URL(request.url);
    
    const page = safeParseInt(searchParams.get('page') || '1', 0);
    const limit = safeParseInt(searchParams.get('limit') || '20', 0);
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const type = searchParams.get('type') || '';

    // Construction du filtre
    const where: any = { userId };
    if (unreadOnly) {
      where.isLue = false;
    }
    if (type && NOTIFICATION_TYPES.includes(type)) {
      where.type = type;
    }

    // Compter les non lues
    const unreadCount = await prisma.notification.count({
      where: { userId, isLue: false }
    });

    // Total avec filtres
    const total = await prisma.notification.count({ where });

    // Récupérer les notifications
    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

  return successResponse({
    notifications,
    unreadCount,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    }
  });
});

// POST /api/notifications - Créer une notification (admin/système)
export const POST = withErrorHandler(async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    throw new UnauthorizedError("Non authentifié");
  }

  // Seuls ADMIN et SUPER_ADMIN peuvent créer des notifications manuellement
  if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role || '')) {
    throw new ForbiddenError("Accès non autorisé");
  }

    const body = await request.json();
    const { userId, userIds, type, titre, message, lien } = body;

  // Validation
  if (!type || !titre || !message) {
    throw new ValidationError("type, titre et message sont requis");
  }

  if (!NOTIFICATION_TYPES.includes(type)) {
    throw new ValidationError(`Type invalide. Types autorisés: ${NOTIFICATION_TYPES.join(', ')}`);
  }

    // Créer pour un utilisateur ou plusieurs
    const targetUserIds = userIds || (userId ? [userId] : []);

  if (targetUserIds.length === 0) {
    throw new ValidationError("userId ou userIds requis");
  }

    // Créer les notifications en masse
    const notifications = await prisma.notification.createMany({
      data: targetUserIds.map((uid: number) => ({
        userId: uid,
        type,
        titre,
        message,
        lien: lien || null,
      }))
    });

  return successResponse({
    count: notifications.count,
  }, `${notifications.count} notification(s) créée(s)`, 201);
});

// DELETE /api/notifications - Supprimer toutes les notifications lues
export const DELETE = withErrorHandler(async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    throw new UnauthorizedError("Non authentifié");
  }

    const userId = parseInt(session.user.id as string);

    const deleted = await prisma.notification.deleteMany({
      where: { userId, isLue: true }
    });

  return successResponse({
    count: deleted.count,
  }, `${deleted.count} notification(s) supprimée(s)`);
});
