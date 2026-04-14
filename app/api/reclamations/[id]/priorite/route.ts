import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";

export async function PATCH() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  return NextResponse.json({ 
    error: "Fonctionnalité non disponible - le champ priorité n'existe pas dans le modèle" 
  }, { status: 501 });
}
