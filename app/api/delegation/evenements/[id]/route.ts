import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { ActivityLogger } from '@/lib/activity-logger';
import { withErrorHandler, successResponse } from '@/lib/api-handler';
import { UnauthorizedError, ForbiddenError, NotFoundError, ValidationError, AppError } from '@/lib/exceptions';
import { evenementSchema } from '@/lib/validations/delegation';

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
          // === VALIDATION DÉTAILLÉE VIA ZOD ===
          const validation = evenementSchema.partial().safeParse(body);
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
              throw new AppError('L\'établissement sélectionné n\'existe pas', 'NOT_FOUND', 400);
            }
            if (session.user.role === 'DELEGATION' && etablissement.secteur !== session.user.secteurResponsable) {
              throw new ForbiddenError('Cet établissement appartient à un autre secteur');
            }
            updateData.etablissementId = validatedData.etablissementId;
            updateData.communeId = etablissement.communeId;
            updateData.secteur = etablissement.secteur;
          } else if (validatedData.secteur && session.user.role === 'DELEGATION' && validatedData.secteur !== session.user.secteurResponsable) {
            throw new ForbiddenError('Secteur non autorisé pour cette délégation');
          } else if (validatedData.secteur) {
            updateData.secteur = validatedData.secteur;
          }

          // Cas modification normale - tous les champs
          if (validatedData.titre) updateData.titre = validatedData.titre.trim();
          if (validatedData.description) updateData.description = validatedData.description.trim();
          if (validatedData.typeCategorique) updateData.typeCategorique = validatedData.typeCategorique;
          if (validatedData.dateDebut) updateData.dateDebut = validatedData.dateDebut;
          if (validatedData.dateFin) updateData.dateFin = validatedData.dateFin;
          if (validatedData.heureDebut !== undefined) updateData.heureDebut = validatedData.heureDebut;
          if (validatedData.heureFin !== undefined) updateData.heureFin = validatedData.heureFin;
          if (validatedData.lieu !== undefined) updateData.lieu = validatedData.lieu;
          if (validatedData.adresse !== undefined) updateData.adresse = validatedData.adresse;
          if (validatedData.quartierDouar !== undefined) updateData.quartierDouar = validatedData.quartierDouar;
          if (validatedData.capaciteMax !== undefined) updateData.capaciteMax = validatedData.capaciteMax;
          if (validatedData.organisateur !== undefined) updateData.organisateur = validatedData.organisateur;
          if (validatedData.contactOrganisateur !== undefined) updateData.contactOrganisateur = validatedData.contactOrganisateur;
          if (validatedData.emailContact !== undefined) updateData.emailContact = validatedData.emailContact;
          if (validatedData.inscriptionsOuvertes !== undefined) updateData.inscriptionsOuvertes = validatedData.inscriptionsOuvertes;
          if (validatedData.lienInscription !== undefined) updateData.lienInscription = validatedData.lienInscription;
          if (validatedData.tags !== undefined) updateData.tags = validatedData.tags;
          if (validatedData.isOrganiseParProvince !== undefined) updateData.isOrganiseParProvince = validatedData.isOrganiseParProvince;
          if (validatedData.sousCouvertProvince !== undefined) updateData.sousCouvertProvince = validatedData.sousCouvertProvince;

          // === GESTION DE L'IMAGE PRINCIPALE ===
          if (validatedData.imagePrincipale !== undefined) {
            // Supprimer l'ancienne image principale si elle existe
            await prisma.media.deleteMany({
              where: {
                evenementId: id,
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
