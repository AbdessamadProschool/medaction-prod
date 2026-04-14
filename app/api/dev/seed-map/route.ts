import { NextResponse } from 'next/server';

// Route de seed désactivée pour des raisons de sécurité en production
export async function GET() {
  return NextResponse.json({ error: 'Ressource introuvable' }, { status: 404 });
}

export async function POST() {
  return NextResponse.json({ error: 'Ressource introuvable' }, { status: 404 });
}
