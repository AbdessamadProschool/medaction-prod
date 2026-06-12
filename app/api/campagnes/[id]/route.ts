import { safeParseInt } from '@/lib/utils/parse';
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { ActivityLogger } from '@/lib/activity-logger';
import { withErrorHandler, successResponse } from '@/lib/api-handler';
import { UnauthorizedError, ForbiddenError, NotFoundError, ConflictError } from '@/lib/exceptions';

// GET - Détail d'une campagne
export const GET = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
    
    // Peut être un ID numérique ou un slug
    const isNumeric = /^\d+$/.test(id);
    
    const campagne = await prisma.campagne.findFirst({
      where: isNumeric 
        ? { id: safeParseInt(id, 0) }
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
        lieuEtablissement: {
          select: {
            id: true,
            nom: true,
            nomArabe: true,
            secteur: true,
            adresseComplete: true,
            quartierDouar: true,
            commune: {
              select: {
                id: true,
                nom: true,
                nomArabe: true,
              },
            },
          },
        },
      },
    });

  if (!campagne) {
    throw new NotFoundError('Campagne non trouvée');
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

  return successResponse({
    ...campagne,
    auteur: campagne.createdByUser,
    nombreParticipations: campagne._count.participations,
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
});

// POST - Participer à une campagne
export const POST = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    throw new UnauthorizedError('Connexion requise');
  }

    const { id } = await params;
    const userId = parseInt(session.user.id);
    const campagneId = safeParseInt(id, 0);

  // Vérification stricte de la permission de participer
  const { checkPermission } = await import("@/lib/permissions");
  const hasPermission = await checkPermission(userId, 'campagnes.participate');

  if (!hasPermission) {
    throw new ForbiddenError("Vous n'avez pas la permission de participer aux campagnes");
  }

    const body = await request.json();

    // Vérifier si la campagne existe
    const campagne = await prisma.campagne.findUnique({
      where: { id: campagneId },
    });

  if (!campagne) {
    throw new NotFoundError('Campagne non trouvée');
  }

  if (!campagne.isActive) {
    throw new ConflictError('Cette campagne n\'est plus active');
  }

    // Vérifier si l'utilisateur a déjà participé
    const existingParticipation = await prisma.participationCampagne.findFirst({
      where: {
        campagneId,
        userId,
      },
    });

  if (existingParticipation) {
    throw new ConflictError('Vous avez déjà participé à cette campagne');
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

  return successResponse(participation, 'Participation enregistrée avec succès', 201);
});

// PATCH - Mettre à jour une campagne (Admin uniquement)
export const PATCH = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    throw new UnauthorizedError('Connexion requise');
  }

    const userId = parseInt(session.user.id);

  // Vérifier la permission
  const { checkPermission } = await import("@/lib/permissions");
  const hasPermission = await checkPermission(userId, 'campagnes.edit');

  if (!hasPermission) {
    throw new ForbiddenError('Action non autorisée');
  }

    const { id } = await params;
    const campagneId = safeParseInt(id, 0);
    const body = await request.json();

    // Vérifier si la campagne existe
    const existingCampagne = await prisma.campagne.findUnique({
      where: { id: campagneId },
    });

  if (!existingCampagne) {
    throw new NotFoundError('Campagne non trouvée');
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

  // Audit logging
  await ActivityLogger.custom({
    action: 'UPDATE_CAMPAGNE',
    entity: 'Campagne',
    entityId: campagneId,
    userId: userId,
    details: {
      titre: campagne.titre,
      statut: updateData.statut,
      updatedFields: Object.keys(updateData)
    }
  });

  return successResponse(campagne, 'Campagne mise à jour');
});

// DELETE - Supprimer une campagne (Admin uniquement)
export const DELETE = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    throw new UnauthorizedError('Connexion requise');
  }

    const userId = parseInt(session.user.id);

  // Vérifier la permission
  const { checkPermission } = await import("@/lib/permissions");
  const hasPermission = await checkPermission(userId, 'campagnes.delete');

  if (!hasPermission) {
    throw new ForbiddenError('Action non autorisée');
  }

    const { id } = await params;
    const campagneId = safeParseInt(id, 0);

    // Vérifier si la campagne existe
    const existingCampagne = await prisma.campagne.findUnique({
      where: { id: campagneId },
    });

  if (!existingCampagne) {
    throw new NotFoundError('Campagne non trouvée');
  }

    // Supprimer les participations associées d'abord
    await prisma.participationCampagne.deleteMany({
      where: { campagneId },
    });

    // Supprimer la campagne
    await prisma.campagne.delete({
      where: { id: campagneId },
    });

  // Audit logging
  await ActivityLogger.custom({
    action: 'DELETE_CAMPAGNE',
    entity: 'Campagne',
    entityId: campagneId,
    userId: userId,
    details: {
      titre: existingCampagne.titre
    }
  });

  return successResponse(null, 'Campagne supprimée');
});