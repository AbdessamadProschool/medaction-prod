import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { withErrorHandler, successResponse } from '@/lib/api-handler';
import { UnauthorizedError, ForbiddenError, ValidationError, NotFoundError, AppError } from '@/lib/exceptions';
import { actualiteSchema } from '@/lib/validations/delegation';

async function getActualiteWithOwnershipCheck(actualiteId: number, session: any) {
  const actualite = await prisma.actualite.findUnique({
    where: { id: actualiteId },
    include: {
      createdByUser: { select: { id: true, nom: true, prenom: true } },
      etablissement: { select: { id: true, nom: true } },
      medias: { take: 1, select: { urlPublique: true } },
    }
  });

  if (!actualite) {
    throw new NotFoundError('Actualité non trouvée');
  }

  const isOwner = Number(actualite.createdBy) === Number(session.user.id);
  const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(session.user.role || '');
  if (!isOwner && !isAdmin) {
    throw new ForbiddenError('Accès refusé');
  }

  return actualite;
}

// GET - Récupérer une actualité par ID
export const GET = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    throw new UnauthorizedError('Non autorisé');
  }

  const actualiteId = parseInt(id);
  if (isNaN(actualiteId)) {
    throw new ValidationError('ID invalide');
  }

  const actualite = await getActualiteWithOwnershipCheck(actualiteId, session);

  // Ajouter imagePrincipale depuis medias
  const data = {
    ...actualite,
    imagePrincipale: actualite.medias?.[0]?.urlPublique || null
  };

  return successResponse(data);
});

// PATCH - Modifier une actualité
export const PATCH = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    throw new UnauthorizedError('Non autorisé');
  }

  if (!['DELEGATION', 'ADMIN', 'SUPER_ADMIN'].includes(session.user.role || '')) {
    throw new ForbiddenError('Accès non autorisé');
  }

  const actualiteId = parseInt(id);
  const userId = parseInt(session.user.id);
  if (isNaN(actualiteId)) {
    throw new ValidationError('ID invalide');
  }

  await getActualiteWithOwnershipCheck(actualiteId, session);

  const body = await request.json();

  // === VALIDATION DÉTAILLÉE VIA ZOD ===
  const validation = actualiteSchema.partial().safeParse(body);
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

  // Si l'établissement est modifié, valider le secteur
  if (validatedData.etablissementId) {
    const etablissement = await prisma.etablissement.findUnique({
      where: { id: validatedData.etablissementId }
    });
    if (!etablissement) {
      throw new NotFoundError("L'établissement sélectionné n'existe pas");
    }
    if (session.user.role === 'DELEGATION' && etablissement.secteur !== session.user.secteurResponsable) {
      throw new ForbiddenError('Cet établissement appartient à un autre secteur');
    }
  }

  // Mise à jour de l'actualité (sans imagePrincipale qui n'existe pas dans le modèle)
  const actualite = await prisma.actualite.update({
    where: { id: actualiteId },
    data: {
      titre: validatedData.titre,
      description: validatedData.resume || validatedData.description,
      contenu: validatedData.contenu,
      categorie: validatedData.categorie,
      etablissementId: validatedData.etablissementId,
      updatedAt: new Date(),
    }
  });

  // Gérer l'image via la table Media
  if (validatedData.imagePrincipale !== undefined) {
    // Supprimer l'ancienne image principale si elle existe
    await prisma.media.deleteMany({
      where: {
        actualiteId: actualiteId,
        nomFichier: 'Image Principale',
      }
    });

    // Créer la nouvelle image si fournie
    if (validatedData.imagePrincipale) {
      await prisma.media.create({
        data: {
          nomFichier: 'Image Principale',
          cheminFichier: validatedData.imagePrincipale,
          urlPublique: validatedData.imagePrincipale,
          type: 'IMAGE',
          mimeType: 'image/jpeg',
          actualiteId: actualiteId,
          uploadePar: userId
        }
      });
    }
  }

  return successResponse(actualite);
});

// DELETE - Supprimer une actualité
export const DELETE = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    throw new UnauthorizedError('Non autorisé');
  }

  if (!['DELEGATION', 'ADMIN', 'SUPER_ADMIN'].includes(session.user.role || '')) {
    throw new ForbiddenError('Accès non autorisé');
  }

  const actualiteId = parseInt(id);
  if (isNaN(actualiteId)) {
    throw new ValidationError('ID invalide');
  }

  await getActualiteWithOwnershipCheck(actualiteId, session);

  await prisma.actualite.delete({
    where: { id: actualiteId }
  });

  return successResponse(null, 'Actualité supprimée');
});