import { safeParseInt } from '@/lib/utils/parse';
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { ActivityLogger } from '@/lib/activity-logger';
import { withErrorHandler, successResponse } from '@/lib/api-handler';
import { UnauthorizedError, ForbiddenError, NotFoundError, ValidationError } from '@/lib/exceptions';
import { campagneSchema } from '@/lib/validations/delegation';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET - Récupérer une campagne
export const GET = withErrorHandler(async (request: NextRequest, { params }: RouteParams) => {
  const { id: idParam } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    throw new UnauthorizedError('Non autorisé');
  }

    const userId = parseInt(session.user.id);
    const id = safeParseInt(idParam, 0);
    const campagne = await prisma.campagne.findUnique({
      where: { id },
      include: {
        medias: {
          select: { id: true, urlPublique: true, type: true, nomFichier: true }
        },
        _count: { select: { participations: true } }
      }
    });

  if (!campagne) {
    throw new NotFoundError('Campagne non trouvée');
  }

    // SECURITY FIX: Vérification ownership (alignement avec PUT/DELETE)
    const isOwner = campagne.createdBy === userId;
    const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(session.user.role);
    const isGouverneur = session.user.role === 'GOUVERNEUR';

  if (!isOwner && !isAdmin && !isGouverneur) {
    throw new ForbiddenError('Accès refusé');
  }

  return successResponse({
    ...campagne,
    imagePrincipale: campagne.imagePrincipale || campagne.medias?.find(m => m.nomFichier === 'Bannière campagne')?.urlPublique || null
  });
});

// PUT - Modifier une campagne
export const PUT = withErrorHandler(async (request: NextRequest, { params }: RouteParams) => {
  const { id: idParam } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    throw new UnauthorizedError('Non autorisé');
  }

    const userId = parseInt(session.user.id);
    const id = safeParseInt(idParam, 0);
    const body = await request.json();

    // === VALIDATION DÉTAILLÉE VIA ZOD ===
    const validation = campagneSchema.partial().safeParse(body);
    if (!validation.success) {
      const formattedErrors = validation.error.format();
      throw new ValidationError(
        'Erreur de validation',
        { 
          fieldErrors: Object.keys(formattedErrors).reduce((acc, key) => {
            if (key !== '_errors') {
              acc[key] = (formattedErrors as any)[key]?._errors || [];
            }
            return acc;
          }, {} as Record<string, string[]>)
        }
      );
    }

    const validatedData = validation.data;

    // Vérifier propriété
    const campagne = await prisma.campagne.findUnique({
      where: { id },
    });

    if (!campagne) {
      throw new NotFoundError('Campagne introuvable');
    }

    if (campagne.createdBy !== userId && session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      throw new ForbiddenError('Action non autorisée');
    }

    // Préparation des données update
    const updateData: any = {};

    if (validatedData.nom) updateData.nom = validatedData.nom.trim();
    if (validatedData.titre) updateData.titre = validatedData.titre.trim();
    if (validatedData.description !== undefined) updateData.description = validatedData.description;
    if (validatedData.contenu) updateData.contenu = validatedData.contenu.trim();
    if (validatedData.type) updateData.type = validatedData.type;
    if (validatedData.objectifParticipations !== undefined) {
      updateData.objectifParticipations = validatedData.objectifParticipations;
    }
    if (validatedData.dateDebut !== undefined) {
      updateData.dateDebut = validatedData.dateDebut;
    }
    if (validatedData.dateFin !== undefined) {
      updateData.dateFin = validatedData.dateFin;
    }
    if (validatedData.couleurTheme !== undefined) updateData.couleurTheme = validatedData.couleurTheme;
    if (validatedData.imagePrincipale !== undefined) updateData.imagePrincipale = validatedData.imagePrincipale;
    
    // Champs de clôture
    if (body.statut) updateData.statut = body.statut;
    if (body.rapportClotureUrl !== undefined) updateData.rapportClotureUrl = body.rapportClotureUrl;
    if (body.bilanDescription !== undefined) updateData.bilanDescription = body.bilanDescription;
    if (body.bilanChiffresCles !== undefined) updateData.bilanChiffresCles = body.bilanChiffresCles;

    const updatedCampagne = await prisma.campagne.update({
      where: { id },
      data: updateData,
    });

    // === GESTION DES MÉDIAS DE CLÔTURE (RAPPORT ET GALERIE) ===
    // Supprimer les anciens fichiers de clôture/bilan (ceux qui ne sont pas la bannière principale)
    await prisma.media.deleteMany({
      where: {
        campagneId: id,
        nomFichier: { not: 'Bannière campagne' }
      }
    });

    // Créer l'entrée Media pour le rapport PDF de clôture
    if (body.rapportClotureUrl) {
      await prisma.media.create({
        data: {
          nomFichier: 'Compte Rendu Bilan',
          cheminFichier: body.rapportClotureUrl,
          urlPublique: body.rapportClotureUrl,
          type: 'DOCUMENT',
          mimeType: 'application/pdf',
          campagneId: id,
          uploadePar: userId
        }
      });
    }

    // Créer les entrées Media pour la galerie d'images de clôture
    if (body.images && Array.isArray(body.images)) {
      for (const imgUrl of body.images) {
        if (imgUrl) {
          const ext = imgUrl.split('.').pop() || 'png';
          await prisma.media.create({
            data: {
              nomFichier: 'Bilan Image',
              cheminFichier: imgUrl,
              urlPublique: imgUrl,
              type: 'IMAGE',
              mimeType: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
              campagneId: id,
              uploadePar: userId
            }
          });
        }
      }
    }

    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] || request.headers.get('x-real-ip') || null;
    const userAgent = request.headers.get('user-agent') || null;
  const actionName = (body.statut === 'CLOTUREE') ? 'CLOTURE_CAMPAGNE' : 'UPDATE_CAMPAGNE';

  await ActivityLogger.custom({
    action: actionName,
    entity: 'Campagne',
    entityId: id,
    userId: userId,
    details: { 
      titre: updatedCampagne.titre, 
      fields: Object.keys(updateData),
      previousValue: campagne,
      newValue: updatedCampagne
    }
  });

  return successResponse(updatedCampagne);
});

// DELETE - Supprimer une campagne
export const DELETE = withErrorHandler(async (request: NextRequest, { params }: RouteParams) => {
  const { id: idParam } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    throw new UnauthorizedError('Non autorisé');
  }

    const userId = parseInt(session.user.id);
    const id = safeParseInt(idParam, 0);

    // Vérifier propriété
    const campagne = await prisma.campagne.findUnique({
      where: { id },
    });

  if (!campagne) {
    throw new NotFoundError('Campagne introuvable');
  }

  if (campagne.createdBy !== userId && session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
    throw new ForbiddenError('Action non autorisée');
  }

    await prisma.campagne.delete({
      where: { id },
    });

  await ActivityLogger.custom({
    action: 'DELETE_CAMPAGNE',
    entity: 'Campagne',
    entityId: id,
    userId: userId,
    details: { titre: campagne.titre }
  });

  return successResponse(null);
});
