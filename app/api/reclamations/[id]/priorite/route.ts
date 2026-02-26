// This route is disabled - priorite field does not exist in Reclamation model
import { NextResponse } from "next/server";

export async function PATCH() {
  return NextResponse.json({ 
    error: "Fonctionnalité non disponible - le champ priorité n'existe pas dans le modèle" 
  }, { status: 501 });
}
