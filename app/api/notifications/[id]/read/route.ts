import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";

// PATCH /api/notifications/[id]/read - Marquer une notification comme lue
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const userId = parseInt(session.user.id as string);
    const notificationId = parseInt(params.id);

    if (isNaN(notificationId)) {
      return NextResponse.json({ error: "ID invalide" }, { status: 400 });
    }

    // Vérifier que la notification appartient à l'utilisateur
    const notification = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId,
      }
    });

    if (!notification) {
      return NextResponse.json({ error: "Notification non trouvée" }, { status: 404 });
    }

    // Déjà lu ?
    if (notification.isLue) {
      return NextResponse.json({
        success: true,
        message: "Notification déjà marquée comme lue",
        notification,
      });
    }

    // Marquer comme lue
    const updated = await prisma.notification.update({
      where: { id: notificationId },
      data: { isLue: true }
    });

    return NextResponse.json({
      success: true,
      message: "Notification marquée comme lue",
      notification: updated,
    });

  } catch (error) {
    console.error("Erreur PATCH /api/notifications/[id]/read:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
