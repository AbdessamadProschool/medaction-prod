import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';

interface RouteParams {
  params: {
    id: string;
  };
}

// GET - Récupérer une campagne
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const id = parseInt(params.id);
    const campagne = await prisma.campagne.findUnique({
      where: { id },
      include: {
        medias: { take: 1, select: { urlPublique: true } },
        _count: { select: { participations: true } }
      }
    });

    if (!campagne) {
      return NextResponse.json({ error: 'Campagne non trouvée' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      data: {
        ...campagne,
        imagePrincipale: campagne.imagePrincipale || campagne.medias?.[0]?.urlPublique || null
      }
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// PUT - Modifier une campagne
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const userId = parseInt(session.user.id);
    const id = parseInt(params.id);
    const body = await request.json();

    // Vérifier propriété
    const campagne = await prisma.campagne.findUnique({
      where: { id },
    });

    if (!campagne) {
      return NextResponse.json({ error: 'Campagne introuvable' }, { status: 404 });
    }

    if (campagne.createdBy !== userId && session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Action non autorisée' }, { status: 403 });
    }

    // Préparation des données update
    const updateData: any = {};

    if (body.nom) updateData.nom = body.nom.trim();
    if (body.titre) updateData.titre = body.titre.trim();
    if (body.description !== undefined) updateData.description = body.description?.trim() || null;
    if (body.contenu) updateData.contenu = body.contenu.trim();
    if (body.type) updateData.type = body.type;
    if (body.objectifParticipations !== undefined) {
      updateData.objectifParticipations = body.objectifParticipations ? parseInt(body.objectifParticipations) : null;
    }
    if (body.dateDebut !== undefined) {
      updateData.dateDebut = body.dateDebut ? new Date(body.dateDebut) : null;
    }
    if (body.dateFin !== undefined) {
      updateData.dateFin = body.dateFin ? new Date(body.dateFin) : null;
    }
    if (body.couleurTheme !== undefined) updateData.couleurTheme = body.couleurTheme;
    if (body.imagePrincipale !== undefined) updateData.imagePrincipale = body.imagePrincipale;

    const updatedCampagne = await prisma.campagne.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, data: updatedCampagne });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE - Supprimer une campagne
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const userId = parseInt(session.user.id);
    const id = parseInt(params.id);

    // Vérifier propriété
    const campagne = await prisma.campagne.findUnique({
      where: { id },
    });

    if (!campagne) {
      return NextResponse.json({ error: 'Campagne introuvable' }, { status: 404 });
    }

    if (campagne.createdBy !== userId && session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Action non autorisée' }, { status: 403 });
    }

    await prisma.campagne.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
