import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { withErrorHandler } from '@/lib/api-handler';
import { UnauthorizedError, ForbiddenError, NotFoundError, ValidationError } from '@/lib/exceptions';

// GET - Détails d'un événement
export const GET = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id: idStr } = await params;
  const id = parseInt(idStr);
  
  if (isNaN(id)) {
    throw new ValidationError("L'identifiant de l'événement n'est pas valide");
  }
  
  const session = await getServerSession(authOptions);
  const isAdmin = session?.user?.role && ['ADMIN', 'SUPER_ADMIN'].includes(session.user.role);

  const evenement = await prisma.evenement.findUnique({
    where: { id },
    include: {
      etablissement: { select: { id: true, nom: true, secteur: true } },
      commune: { select: { id: true, nom: true } },
      medias: true,
      createdByUser: { select: { id: true, nom: true, prenom: true } },
    }
  });

  if (!evenement) {
    throw new NotFoundError("L'événement demandé n'existe pas");
  }

  // Vérification des permissions pour les événements non publiés
  const publicStatuts = ['PUBLIEE', 'EN_ACTION', 'CLOTUREE'];
  const isCreator = session?.user?.id && evenement.createdBy === parseInt(session.user.id);

  if (!publicStatuts.includes(evenement.statut) && !isAdmin && !isCreator) {
    throw new ForbiddenError("Vous n'avez pas accès à cet événement");
  }

  // NOTE: L'incrément des vues est géré uniquement par POST /api/evenements/[id]/vues
  // avec vérification côté client via sessionStorage pour éviter les doublons

  return NextResponse.json({ success: true, data: evenement });
});

// PUT - Modifier un événement
export const PUT = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    throw new UnauthorizedError('Vous devez être connecté pour modifier un événement');
  }

  const { id: idStr } = await params;
  const id = parseInt(idStr);
  
  if (isNaN(id)) {
    throw new ValidationError("L'identifiant de l'événement n'est pas valide");
  }

  const userId = parseInt(session.user.id);
  const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(session.user.role || '');

  const evenement = await prisma.evenement.findUnique({
    where: { id },
    select: { id: true, createdBy: true, statut: true, titre: true }
  });

  if (!evenement) {
    throw new NotFoundError("L'événement n'existe pas");
  }

  const isCreator = evenement.createdBy === userId;
  if (!isAdmin && !isCreator) {
    throw new ForbiddenError("Vous n'êtes pas autorisé à modifier cet événement");
  }

  const body = await request.json();
  
  // Validation
  const errors: Array<{ field: string; message: string }> = [];
  
  if (body.titre && body.titre.length < 5) {
    errors.push({ field: 'titre', message: 'Le titre doit contenir au moins 5 caractères' });
  }
  if (body.description && body.description.length < 20) {
    errors.push({ field: 'description', message: 'La description doit contenir au moins 20 caractères' });
  }

  if (errors.length > 0) {
    throw new ValidationError(
      errors.length === 1 ? errors[0].message : `${errors.length} erreurs de validation`,
      { fieldErrors: errors.reduce((acc, e) => ({ ...acc, [e.field]: [e.message] }), {}) }
    );
  }

  // Construire les données de mise à jour
  const updateData: any = {};
  
  if (body.titre) updateData.titre = body.titre.trim();
  if (body.description) updateData.description = body.description.trim();
  if (body.typeCategorique) updateData.typeCategorique = body.typeCategorique;
  if (body.lieu !== undefined) updateData.lieu = body.lieu?.trim();
  if (body.adresse !== undefined) updateData.adresse = body.adresse?.trim();
  if (body.dateDebut) updateData.dateDebut = new Date(body.dateDebut);
  if (body.dateFin) updateData.dateFin = new Date(body.dateFin);
  if (body.heureDebut !== undefined) updateData.heureDebut = body.heureDebut;
  if (body.heureFin !== undefined) updateData.heureFin = body.heureFin;
  if (body.capaciteMax !== undefined) updateData.capaciteMax = body.capaciteMax;
  if (body.inscriptionsOuvertes !== undefined) updateData.inscriptionsOuvertes = body.inscriptionsOuvertes;
  
  // Les admins peuvent modifier le statut
  if (isAdmin && body.statut) {
    updateData.statut = body.statut;
  }

  const updated = await prisma.evenement.update({
    where: { id },
    data: updateData,
    include: {
      etablissement: { select: { nom: true } },
      commune: { select: { nom: true } },
    }
  });

  // === GESTION DE L'IMAGE PRINCIPALE ===
  if (body.imagePrincipale !== undefined) {
    // Supprimer l'ancienne image principale si elle existe
    await prisma.media.deleteMany({
      where: {
        evenementId: id,
        nomFichier: 'Image Principale',
      }
    });

    // Créer la nouvelle image si fournie
    if (body.imagePrincipale) {
      await prisma.media.create({
        data: {
          nomFichier: 'Image Principale',
          cheminFichier: body.imagePrincipale,
          urlPublique: body.imagePrincipale,
          type: 'IMAGE',
          mimeType: 'image/jpeg',
          evenementId: id,
          uploadePar: userId
        }
      });
    }
  }

  return NextResponse.json({
    success: true,
    message: 'Événement mis à jour avec succès',
    data: updated
  });
});

// DELETE - Supprimer un événement
export const DELETE = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    throw new UnauthorizedError('Vous devez être connecté pour supprimer un événement');
  }

  const { id: idStr } = await params;
  const id = parseInt(idStr);
  
  if (isNaN(id)) {
    throw new ValidationError("L'identifiant de l'événement n'est pas valide");
  }

  const userId = parseInt(session.user.id);
  const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(session.user.role || '');

  const evenement = await prisma.evenement.findUnique({
    where: { id },
    select: { createdBy: true, statut: true, titre: true }
  });

  if (!evenement) {
    throw new NotFoundError("L'événement n'existe pas");
  }

  // Permissions: Admin ou créateur (seulement si EN_ATTENTE)
  const isCreator = evenement.createdBy === userId;
  const canDelete = isAdmin || (isCreator && evenement.statut === 'EN_ATTENTE_VALIDATION');

  if (!canDelete) {
    throw new ForbiddenError(
      isCreator 
        ? "Vous ne pouvez supprimer que les événements en attente de validation" 
        : "Vous n'êtes pas autorisé à supprimer cet événement"
    );
  }

  // Supprimer les médias associés
  await prisma.media.deleteMany({ where: { evenementId: id } });
  
  // Supprimer l'événement
  await prisma.evenement.delete({ where: { id } });

  return NextResponse.json({
    success: true,
    message: `L'événement "${evenement.titre}" a été supprimé`
  });
});
