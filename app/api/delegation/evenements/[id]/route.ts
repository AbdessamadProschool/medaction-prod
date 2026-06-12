import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { ActivityLogger } from '@/lib/activity-logger';
import { withErrorHandler, successResponse } from '@/lib/api-handler';
import { UnauthorizedError, ForbiddenError, NotFoundError, ValidationError } from '@/lib/exceptions';

// Next.js 15: params is now a Promise
interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

async function canAccessEvenement(session: any, evenement: any): Promise<boolean> {
  const role = session.user.role;
  const userId = Number(session.user.id);
  const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(role || '');
  const isCreator = Number(evenement.createdBy) === userId;

  if (isAdmin || isCreator) {
    return true;
  }

  if (role !== 'DELEGATION') {
    return false;
  }

  const delegationUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { secteurResponsable: true },
  });

  return Boolean(
    delegationUser?.secteurResponsable &&
    evenement.etablissement?.secteur === delegationUser.secteurResponsable
  );
}

// GET - Récupérer un événement
export const GET = withErrorHandler(async (request: NextRequest, segmentData: RouteParams) => {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    throw new UnauthorizedError('Non autorisé');
  }

    const { id: idStr } = await segmentData.params;
    const id = parseInt(idStr);

  if (isNaN(id)) {
    throw new ValidationError('ID invalide');
  }

    const evenement = await prisma.evenement.findUnique({
      where: { id },
      include: {
        etablissement: { select: { id: true, nom: true, secteur: true } },
        commune: { select: { id: true, nom: true } },
        medias: {
          orderBy: { createdAt: 'asc' },
        },
      }
    });

  if (!evenement) {
    throw new NotFoundError('Événement non trouvé');
  }

  const allowed = await canAccessEvenement(session, evenement);

  if (!allowed) {
    throw new ForbiddenError('Accès refusé');
  }

  return successResponse(evenement);
});

// DELETE - Supprimer un événement
export const DELETE = withErrorHandler(async (request: NextRequest, segmentData: RouteParams) => {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    throw new UnauthorizedError('Non autorisé');
  }

    const userId = parseInt(session.user.id);
    const { id: idStr } = await segmentData.params;
    const id = parseInt(idStr);

  if (isNaN(id)) {
    throw new ValidationError('ID invalide');
  }

    // Vérifier propriété
    const evenement = await prisma.evenement.findUnique({
      where: { id },
    });

  if (!evenement) {
    throw new NotFoundError('Introuvable');
  }

  if (evenement.createdBy !== userId && !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role || '')) {
    throw new ForbiddenError('Action non autorisée sur cet événement');
  }

    // Supprimer d'abord les médias associés (pas de cascade automatique)
    await prisma.media.deleteMany({
      where: { evenementId: id },
    });

    await prisma.evenement.delete({
      where: { id },
    });

  await ActivityLogger.custom({
    action: 'DELETE_EVENEMENT',
    entity: 'Evenement',
    entityId: id,
    userId: userId,
    details: { titre: evenement.titre }
  });

  return successResponse(null);
});

// PUT - Modifier un événement (ou Clôturer)
export const PUT = withErrorHandler(async (request: NextRequest, segmentData: RouteParams) => {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    throw new UnauthorizedError('Non autorisé');
  }
  
      const userId = parseInt(session.user.id);
      const { id: idStr } = await segmentData.params;
      const id = parseInt(idStr);
      const body = await request.json();

  if (isNaN(id)) {
    throw new ValidationError('ID invalide');
  }
  
      // Vérifier propriété
      const evenement = await prisma.evenement.findUnique({
        where: { id },
      });
  
  if (!evenement) {
    throw new NotFoundError('Introuvable');
  }
  
  if (evenement.createdBy !== userId && !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role || '')) {
    throw new ForbiddenError('Action non autorisée');
  }
  
      // Préparation des données update
      const updateData: any = {};
  
      // Cas de Clôture
      if (body.action === 'CLOTURE') {
          updateData.statut = 'CLOTUREE';
          updateData.bilanDescription = body.bilanDescription;
          updateData.bilanNbParticipants = parseInt(body.bilanNbParticipants);
          updateData.bilanDatePublication = new Date();

          // === GESTION DES IMAGES DU BILAN ===
          if (Array.isArray(body.images) && body.images.length > 0) {
              await prisma.media.createMany({
                  data: body.images.map((url: string) => ({
                      nomFichier: 'Image Bilan',
                      cheminFichier: url,
                      urlPublique: url,
                      type: 'IMAGE',
                      mimeType: 'image/jpeg',
                      evenementId: id,
                      uploadePar: userId
                  }))
              });
          }

          // === GESTION DU COMPTE RENDU ===
          if (body.compteRenduUrl) {
              await prisma.media.create({
                  data: {
                      nomFichier: 'Compte Rendu Bilan',
                      cheminFichier: body.compteRenduUrl,
                      urlPublique: body.compteRenduUrl,
                      type: 'DOCUMENT',
                      mimeType: 'application/pdf', 
                      evenementId: id,
                      uploadePar: userId
                  }
              });
          }
      } else {
          // Cas modification normale - tous les champs
          if (body.titre) updateData.titre = body.titre.trim();
          if (body.description) updateData.description = body.description.trim();
          if (body.typeCategorique) updateData.typeCategorique = body.typeCategorique;
          if (body.dateDebut) updateData.dateDebut = new Date(body.dateDebut);
          if (body.dateFin) updateData.dateFin = new Date(body.dateFin);
          if (body.heureDebut !== undefined) updateData.heureDebut = body.heureDebut || null;
          if (body.heureFin !== undefined) updateData.heureFin = body.heureFin || null;
          if (body.lieu !== undefined) updateData.lieu = body.lieu?.trim() || null;
          if (body.adresse !== undefined) updateData.adresse = body.adresse?.trim() || null;
          if (body.quartierDouar !== undefined) updateData.quartierDouar = body.quartierDouar?.trim() || null;
          if (body.capaciteMax !== undefined) updateData.capaciteMax = body.capaciteMax ? parseInt(body.capaciteMax) : null;
          if (body.organisateur !== undefined) updateData.organisateur = body.organisateur?.trim() || null;
          if (body.contactOrganisateur !== undefined) updateData.contactOrganisateur = body.contactOrganisateur?.trim() || null;
          if (body.emailContact !== undefined) updateData.emailContact = body.emailContact?.trim() || null;
          if (body.inscriptionsOuvertes !== undefined) updateData.inscriptionsOuvertes = body.inscriptionsOuvertes;
          if (body.lienInscription !== undefined) updateData.lienInscription = body.lienInscription?.trim() || null;
          if (body.tags !== undefined) updateData.tags = Array.isArray(body.tags) ? body.tags : [];
          if (body.isOrganiseParProvince !== undefined) updateData.isOrganiseParProvince = body.isOrganiseParProvince;
          if (body.sousCouvertProvince !== undefined) updateData.sousCouvertProvince = body.sousCouvertProvince;

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
      }
  
      const updatedEvenement = await prisma.evenement.update({
        where: { id },
        data: updateData,
        include: {
          medias: {
            where: { type: 'IMAGE', nomFichier: 'Image Principale' },
            take: 1,
            select: { urlPublique: true }
          }
        }
      });
  
  const actionName = body.action === 'CLOTURE' ? 'CLOTURE_EVENEMENT' : 'UPDATE_EVENEMENT';

  await ActivityLogger.custom({
    action: actionName,
    entity: 'Evenement',
    entityId: id,
    userId: userId,
    details: { 
      titre: updatedEvenement.titre, 
      fields: Object.keys(updateData),
      previousValue: evenement,
      newValue: updatedEvenement
    }
  });

  return successResponse(updatedEvenement);
});
