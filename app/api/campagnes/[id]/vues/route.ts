import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    
    // Check if campaign exists
    const existing = await prisma.campagne.findUnique({ where: { id } });
    if (!existing) {
        return NextResponse.json({ error: 'Campagne introuvable' }, { status: 404 });
    }

    await prisma.campagne.update({
      where: { id },
      data: { nombreVues: { increment: 1 } }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur incrément vue:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
