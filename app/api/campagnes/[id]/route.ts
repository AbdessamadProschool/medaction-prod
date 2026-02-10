import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';

// GET - Détail d'une campagne
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Peut être un ID numérique ou un slug
    const isNumeric = /^\d+$/.test(id);
    
    const campagne = await prisma.campagne.findFirst({
      where: isNumeric 
        ? { id: parseInt(id) }
        : { slug: id },
      include: {
        _count: {
          select: { participations: true },
        },
        createdByUser: {
          select: {
            id: true,
            prenom: true,
            nom: true,
          },
        },
      },
    });

    if (!campagne) {
      return NextResponse.json({ error: 'Campagne non trouvée' }, { status: 404 });
    }

    // Récupérer les campagnes similaires
    const campagnesSimilaires = await prisma.campagne.findMany({
      where: {
        isActive: true,
        id: { not: campagne.id },
        type: campagne.type,
      },
      include: {
        _count: {
          select: { participations: true },
        },
      },
      take: 3,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...campagne,
        auteur: campagne.createdByUser,
        nombreParticipations: campagne._count.participations,
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      campagnesSimilaires: campagnesSimilaires.map((c: any) => ({
        id: c.id,
        titre: c.titre,
        slug: c.slug,
        description: c.description,
        type: c.type,
        imageCouverture: c.imageCouverture || c.imagePrincipale,
        nombreParticipations: c._count?.participations || 0,
        objectifParticipations: c.objectifParticipations,
      })),
    });

  } catch (error) {
    console.error('Erreur campagne:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST - Participer à une campagne
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Connexion requise' }, { status: 401 });
    }

    const { id } = await params;
    const userId = parseInt(session.user.id);
    const campagneId = parseInt(id);

    // Vérification stricte de la permission de participer
    const { checkPermission } = await import("@/lib/permissions");
    const hasPermission = await checkPermission(userId, 'campagnes.participate');

    if (!hasPermission) {
      return NextResponse.json({ error: "Vous n'avez pas la permission de participer aux campagnes" }, { status: 403 });
    }

    const body = await request.json();

    // Vérifier si la campagne existe
    const campagne = await prisma.campagne.findUnique({
      where: { id: campagneId },
    });

    if (!campagne) {
      return NextResponse.json({ error: 'Campagne non trouvée' }, { status: 404 });
    }

    if (!campagne.isActive) {
      return NextResponse.json({ error: 'Cette campagne n\'est plus active' }, { status: 400 });
    }

    // Vérifier si l'utilisateur a déjà participé
    const existingParticipation = await prisma.participationCampagne.findFirst({
      where: {
        campagneId,
        userId,
      },
    });

    if (existingParticipation) {
      return NextResponse.json({ error: 'Vous avez déjà participé à cette campagne' }, { status: 400 });
    }

    // Créer la participation
    const participation = await prisma.participationCampagne.create({
      data: {
        campagneId,
        userId,
        donneesParticipation: body.donnees || {},
        message: body.message,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Participation enregistrée avec succès',
      data: participation,
    }, { status: 201 });

  } catch (error) {
    console.error('Erreur participation:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// PATCH - Mettre à jour une campagne (Admin uniquement)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Connexion requise' }, { status: 401 });
    }

    const userId = parseInt(session.user.id);

    // Vérifier la permission
    const { checkPermission } = await import("@/lib/permissions");
    const hasPermission = await checkPermission(userId, 'campagnes.edit');

    if (!hasPermission) {
      return NextResponse.json({ error: 'Action non autorisée' }, { status: 403 });
    }

    const { id } = await params;
    const campagneId = parseInt(id);
    const body = await request.json();

    // Vérifier si la campagne existe
    const existingCampagne = await prisma.campagne.findUnique({
      where: { id: campagneId },
    });

    if (!existingCampagne) {
      return NextResponse.json({ error: 'Campagne non trouvée' }, { status: 404 });
    }

    // Construire les données de mise à jour
    const updateData: any = {};
    
    if (body.statut !== undefined) {
      updateData.statut = body.statut;
      // Synchronisation automatique de isActive avec le statut
      if (body.statut === 'ACTIVE') {
        updateData.isActive = true;
      } else {
        updateData.isActive = false;
      }
    }
    // Si isActive est envoyé explicitement, il a la priorité
    if (body.isActive !== undefined) updateData.isActive = body.isActive;

    if (body.isFeatured !== undefined) updateData.isFeatured = body.isFeatured;
    if (body.titre !== undefined) updateData.titre = body.titre;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.objectifParticipations !== undefined) updateData.objectifParticipations = body.objectifParticipations;
    if (body.dateDebut !== undefined) updateData.dateDebut = new Date(body.dateDebut);
    if (body.dateFin !== undefined) updateData.dateFin = body.dateFin ? new Date(body.dateFin) : null;

    const campagne = await prisma.campagne.update({
      where: { id: campagneId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: 'Campagne mise à jour',
      data: campagne,
    });

  } catch (error) {
    console.error('Erreur mise à jour campagne:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE - Supprimer une campagne (Admin uniquement)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Connexion requise' }, { status: 401 });
    }

    const userId = parseInt(session.user.id);

    // Vérifier la permission
    const { checkPermission } = await import("@/lib/permissions");
    const hasPermission = await checkPermission(userId, 'campagnes.delete');

    if (!hasPermission) {
      return NextResponse.json({ error: 'Action non autorisée' }, { status: 403 });
    }

    const { id } = await params;
    const campagneId = parseInt(id);

    // Vérifier si la campagne existe
    const existingCampagne = await prisma.campagne.findUnique({
      where: { id: campagneId },
    });

    if (!existingCampagne) {
      return NextResponse.json({ error: 'Campagne non trouvée' }, { status: 404 });
    }

    // Supprimer les participations associées d'abord
    await prisma.participationCampagne.deleteMany({
      where: { campagneId },
    });

    // Supprimer la campagne
    await prisma.campagne.delete({
      where: { id: campagneId },
    });

    return NextResponse.json({
      success: true,
      message: 'Campagne supprimée',
    });

  } catch (error) {
    console.error('Erreur suppression campagne:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
