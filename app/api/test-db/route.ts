import { NextResponse } from 'next/server';

// Route de test supprimée pour des raisons de sécurité
export async function GET() {
  return NextResponse.json({ error: 'Ressource introuvable' }, { status: 404 });
}

export async function POST() {
  return NextResponse.json({ error: 'Ressource introuvable' }, { status: 404 });
}
