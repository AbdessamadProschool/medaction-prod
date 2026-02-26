import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";

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
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const userId = parseInt(session.user.id as string);
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
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

    return NextResponse.json({
      notifications,
      unreadCount,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      }
    });

  } catch (error) {
    console.error("Erreur GET /api/notifications:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST /api/notifications - Créer une notification (admin/système)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Seuls ADMIN et SUPER_ADMIN peuvent créer des notifications manuellement
    if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
    }

    const body = await request.json();
    const { userId, userIds, type, titre, message, lien } = body;

    // Validation
    if (!type || !titre || !message) {
      return NextResponse.json(
        { error: "type, titre et message sont requis" },
        { status: 400 }
      );
    }

    if (!NOTIFICATION_TYPES.includes(type)) {
      return NextResponse.json(
        { error: `Type invalide. Types autorisés: ${NOTIFICATION_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    // Créer pour un utilisateur ou plusieurs
    const targetUserIds = userIds || (userId ? [userId] : []);

    if (targetUserIds.length === 0) {
      return NextResponse.json(
        { error: "userId ou userIds requis" },
        { status: 400 }
      );
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

    return NextResponse.json({
      success: true,
      message: `${notifications.count} notification(s) créée(s)`,
      count: notifications.count,
    }, { status: 201 });

  } catch (error) {
    console.error("Erreur POST /api/notifications:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// DELETE /api/notifications - Supprimer toutes les notifications lues
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const userId = parseInt(session.user.id as string);

    const deleted = await prisma.notification.deleteMany({
      where: { userId, isLue: true }
    });

    return NextResponse.json({
      success: true,
      message: `${deleted.count} notification(s) supprimée(s)`,
      count: deleted.count,
    });

  } catch (error) {
    console.error("Erreur DELETE /api/notifications:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
