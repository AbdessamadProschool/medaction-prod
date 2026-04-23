import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { withErrorHandler } from '@/lib/api-handler';
import { UnauthorizedError, ForbiddenError, NotFoundError, ValidationError } from '@/lib/exceptions';
import { z } from 'zod';

const VALID_TRANSITIONS: Record<string, string[]> = {
  EN_ATTENTE_VALIDATION: ['VALIDEE', 'ANNULEE'],
  VALIDEE: ['PUBLIEE', 'ANNULEE'],
  PUBLIEE: ['EN_ACTION', 'ANNULEE'],
  EN_ACTION: ['CLOTUREE', 'ANNULEE'],
  CLOTUREE: [],
  ANNULEE: [],
};

function isValidTransition(from: string, to: string): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

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
  
  // Schéma de validation pour la mise à jour (partiel)
  const updateSchema = z.object({
    titre: z.string().min(5).max(200).optional(),
    description: z.string().min(20).max(5000).optional(),
    typeCategorique: z.string().optional(),
    lieu: z.string().max(200).optional().nullable(),
    adresse: z.string().max(300).optional().nullable(),
    dateDebut: z.string().optional(),
    dateFin: z.string().optional().nullable(),
    heureDebut: z.string().optional().nullable(),
    heureFin: z.string().optional().nullable(),
    capaciteMax: z.number().min(0).optional().nullable(),
    inscriptionsOuvertes: z.boolean().optional(),
    isOrganiseParProvince: z.boolean().optional(),
    sousCouvertProvince: z.boolean().optional(),
    bilanDescription: z.string().max(5000).optional().nullable(),
    bilanNbParticipants: z.number().int().min(0).optional().nullable(),
    statut: z.string().optional(),
    imagePrincipale: z.string().optional().nullable(),
  });

  const validation = updateSchema.safeParse(body);
  if (!validation.success) {
    throw new ValidationError("Données de mise à jour invalides", { fieldErrors: validation.error.flatten().fieldErrors });
  }

  const data = validation.data;
  const updateData: any = {};
  
  if (data.titre) updateData.titre = data.titre.trim();
  if (data.description) updateData.description = data.description.trim();
  if (data.typeCategorique) updateData.typeCategorique = data.typeCategorique;
  if (data.lieu !== undefined) updateData.lieu = data.lieu?.trim() || null;
  if (data.adresse !== undefined) updateData.adresse = data.adresse?.trim() || null;
  if (data.dateDebut) updateData.dateDebut = new Date(data.dateDebut);
  if (data.dateFin !== undefined) updateData.dateFin = data.dateFin ? new Date(data.dateFin) : null;
  if (data.heureDebut !== undefined) updateData.heureDebut = data.heureDebut;
  if (data.heureFin !== undefined) updateData.heureFin = data.heureFin;
  if (data.capaciteMax !== undefined) updateData.capaciteMax = data.capaciteMax;
  if (data.inscriptionsOuvertes !== undefined) updateData.inscriptionsOuvertes = data.inscriptionsOuvertes;
  
  // Champs de bilan (autorisés pour créateur/admin)
  if (data.bilanDescription !== undefined) updateData.bilanDescription = data.bilanDescription;
  if (data.bilanNbParticipants !== undefined) updateData.bilanNbParticipants = data.bilanNbParticipants;
  
  // SECURITY FIX: Champs réservés uniquement aux administrateurs
  if (isAdmin) {
    if (data.isOrganiseParProvince !== undefined) updateData.isOrganiseParProvince = data.isOrganiseParProvince;
    if (data.sousCouvertProvince !== undefined) updateData.sousCouvertProvince = data.sousCouvertProvince;
    if (data.statut) {
      if (!isValidTransition(evenement.statut, data.statut)) {
        throw new ValidationError(`Transition invalide : ${evenement.statut} -> ${data.statut}`);
      }
      updateData.statut = data.statut;
    }
  } else if (data.isOrganiseParProvince !== undefined || data.sousCouvertProvince !== undefined || data.statut !== undefined) {
    // Si un non-admin essaie de modifier ces champs, on les ignore silencieusement ou on pourrait lever une erreur.
    // Pour une UX fluide, on ignore généralement, mais ici on va s'assurer de ne pas les injecter.
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
  if (data.imagePrincipale !== undefined) {
    // Supprimer l'ancienne image principale si elle existe
    await prisma.media.deleteMany({
      where: {
        evenementId: id,
        nomFichier: 'Image Principale',
      }
    });

    // Créer la nouvelle image si fournie
    if (data.imagePrincipale) {
      await prisma.media.create({
        data: {
          nomFichier: 'Image Principale',
          cheminFichier: data.imagePrincipale,
          urlPublique: data.imagePrincipale,
          type: 'IMAGE',
          mimeType: 'image/jpeg', // Devrait idéalement être détecté dynamiquement
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