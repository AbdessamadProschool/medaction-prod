import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { talentSchema } from '@/lib/validations/talent';
import { z } from 'zod';

// GET /api/talents/[id]
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'ID invalide' }, { status: 400 });
    }

    const talent = await prisma.talent.findUnique({
      where: { id },
    });

    if (!talent) {
      return NextResponse.json({ error: 'Talent non trouvé' }, { status: 404 });
    }

    // Incrémenter le nombre de vues
    // On ne bloque pas la réponse pour ça
    prisma.talent.update({
        where: { id },
        data: { nombreVues: { increment: 1 } }
    }).catch(console.error);

    return NextResponse.json(talent);
  } catch (error) {
    console.error('Erreur lors de la récupération du talent:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// PATCH /api/talents/[id] (Admin only)
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'ID invalide' }, { status: 400 });
    }

    const json = await request.json();
    // On utilise partial() pour permettre la mise à jour partielle
    const body = talentSchema.partial().parse(json);

    const talent = await prisma.talent.update({
      where: { id },
      data: {
        ...body,
        reseauxSociaux: body.reseauxSociaux ? (body.reseauxSociaux as any) : undefined,
      },
    });

    return NextResponse.json(talent);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: (error as any).errors || (error as any).issues }, { status: 400 });
    }
    console.error('Erreur lors de la mise à jour du talent:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de la mise à jour' },
      { status: 500 }
    );
  }
}

// DELETE /api/talents/[id] (Admin only)
export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
  ) {
    try {
      const session = await getServerSession(authOptions);
  
      if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
        return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
      }
  
      const id = parseInt(params.id);
      if (isNaN(id)) {
        return NextResponse.json({ error: 'ID invalide' }, { status: 400 });
      }
  
      await prisma.talent.delete({
        where: { id },
      });
  
      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Erreur lors de la suppression du talent:', error);
      return NextResponse.json(
        { error: 'Erreur serveur lors de la suppression' },
        { status: 500 }
      );
    }
  }
