import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";

// PATCH /api/notifications/read-all - Marquer toutes les notifications comme lues
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const userId = parseInt(session.user.id as string);

    const result = await prisma.notification.updateMany({
      where: { userId, isLue: false },
      data: { isLue: true }
    });

    return NextResponse.json({
      success: true,
      message: `${result.count} notification(s) marquée(s) comme lue(s)`,
      count: result.count,
    });

  } catch (error) {
    console.error("Erreur PATCH /api/notifications/read-all:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
