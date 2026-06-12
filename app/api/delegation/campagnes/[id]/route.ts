import { safeParseInt } from '@/lib/utils/parse';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { auditLog } from '@/lib/logger';
import { logActivity } from '@/lib/activity-logger';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET - Récupérer une campagne
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id: idParam } = await params;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const userId = parseInt(session.user.id);
    const id = safeParseInt(idParam, 0);
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

    // SECURITY FIX: Vérification ownership (alignement avec PUT/DELETE)
    const isOwner = campagne.createdBy === userId;
    const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(session.user.role);
    const isGouverneur = session.user.role === 'GOUVERNEUR';

    if (!isOwner && !isAdmin && !isGouverneur) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
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
  const { id: idParam } = await params;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const userId = parseInt(session.user.id);
    const id = safeParseInt(idParam, 0);
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
    
    // Champs de clôture
    if (body.statut) updateData.statut = body.statut;
    if (body.rapportClotureUrl !== undefined) updateData.rapportClotureUrl = body.rapportClotureUrl;
    if (body.bilanDescription !== undefined) updateData.bilanDescription = body.bilanDescription;
    if (body.bilanChiffresCles !== undefined) updateData.bilanChiffresCles = body.bilanChiffresCles;

    const updatedCampagne = await prisma.campagne.update({
      where: { id },
      data: updateData,
    });

    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] || request.headers.get('x-real-ip') || null;
    const userAgent = request.headers.get('user-agent') || null;
    const actionName = (body.statut === 'CLOTUREE') ? 'CLOTURE_CAMPAGNE' : 'UPDATE_CAMPAGNE';

    await auditLog({
      action: actionName,
      resource: 'Campagne',
      resourceId: id,
      userId: userId,
      details: { titre: updatedCampagne.titre, fields: Object.keys(updateData) },
      previousValue: campagne,
      newValue: updatedCampagne,
      ipAddress,
      userAgent,
      status: 'SUCCESS'
    });

    await logActivity({
      userId: userId,
      action: actionName,
      entity: 'Campagne',
      entityId: id,
      details: { titre: updatedCampagne.titre },
      ipAddress,
      userAgent
    });

    return NextResponse.json({ success: true, data: updatedCampagne });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE - Supprimer une campagne
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id: idParam } = await params;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const userId = parseInt(session.user.id);
    const id = safeParseInt(idParam, 0);

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

    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] || request.headers.get('x-real-ip') || null;
    const userAgent = request.headers.get('user-agent') || null;

    await auditLog({
      action: 'DELETE_CAMPAGNE',
      resource: 'Campagne',
      resourceId: id,
      userId: userId,
      details: { titre: campagne.titre },
      previousValue: campagne,
      ipAddress,
      userAgent,
      status: 'SUCCESS'
    });

    await logActivity({
      userId: userId,
      action: 'DELETE_CAMPAGNE',
      entity: 'Campagne',
      entityId: id,
      details: { titre: campagne.titre },
      ipAddress,
      userAgent
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
