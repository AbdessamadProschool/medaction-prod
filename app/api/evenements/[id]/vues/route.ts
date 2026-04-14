import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id, 10);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'ID invalide' }, { status: 400 });
    }
    
    await prisma.evenement.update({
      where: { id },
      data: { nombreVues: { increment: 1 } }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur incrément vue:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
