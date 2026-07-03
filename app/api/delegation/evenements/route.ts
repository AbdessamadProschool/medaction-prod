import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { withErrorHandler, successResponse } from '@/lib/api-handler';
import { UnauthorizedError, ForbiddenError, ValidationError, AppError } from '@/lib/exceptions';
import { notifyAdmins } from '@/lib/notifications';
import { evenementSchema } from '@/lib/validations/delegation';

// GET - Liste des événements de la délégation
export const GET = withErrorHandler(async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    throw new UnauthorizedError('Vous devez être connecté');
  }

  if (session.user.role !== 'DELEGATION') {
    throw new ForbiddenError('Accès réservé aux délégations');
  }

  const userId = parseInt(session.user.id);
  const { searchParams } = new URL(request.url);
  
  const page = Math.max(1, parseInt(searchParams.get('page') || '1') || 1);
  const limit = Math.max(1, Math.min(parseInt(searchParams.get('limit') || '12') || 12, 100));
  const search = searchParams.get('search') || '';
  const statut = searchParams.get('statut') || '';

  const where: Record<string, unknown> = {
    createdBy: userId,
  };

  if (search) {
    where.OR = [
      { titre: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (statut) {
    where.statut = statut;
  }

  const [evenements, total] = await Promise.all([
    prisma.evenement.findMany({
      where,
      include: {
        etablissement: { select: { nom: true } },
        commune: { select: { nom: true } },
        medias: { where: { type: 'IMAGE' }, take: 1, select: { urlPublique: true, type: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.evenement.count({ where }),
  ]);

  return successResponse({
    evenements,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

// POST - Créer un événement
export const POST = withErrorHandler(async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    throw new UnauthorizedError('Vous devez être connecté pour créer un événement');
  }

  if (session.user.role !== 'DELEGATION') {
    throw new ForbiddenError('Accès réservé aux délégations');
  }

  const userId = parseInt(session.user.id);
  const body = await request.json();

  // === VALIDATION DÉTAILLÉE VIA ZOD ===
  const validation = evenementSchema.safeParse(body);
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

  // Récupérer l'établissement et valider le secteur
  const etablissement = await prisma.etablissement.findUnique({
    where: { id: validatedData.etablissementId },
    include: { commune: true }
  });
  
  if (!etablissement) {
    throw new AppError('L\'établissement sélectionné n\'existe pas', 'NOT_FOUND', 400);
  }

  // === ISOLATION SECTORIELLE STRICTE ===
  if (etablissement.secteur !== session.user.secteurResponsable) {
    throw new ForbiddenError('Cet établissement appartient à un autre secteur');
  }

  const evenement = await prisma.evenement.create({
    data: {
      titre: validatedData.titre,
      description: validatedData.description,
      typeCategorique: validatedData.typeCategorique,
      secteur: etablissement.secteur,
      dateDebut: validatedData.dateDebut,
      dateFin: validatedData.dateFin || undefined,
      heureDebut: validatedData.heureDebut,
      heureFin: validatedData.heureFin,
      lieu: validatedData.lieu,
      adresse: validatedData.adresse,
      quartierDouar: validatedData.quartierDouar,
      tags: validatedData.tags,
      organisateur: validatedData.organisateur,
      contactOrganisateur: validatedData.contactOrganisateur,
      emailContact: validatedData.emailContact,
      capaciteMax: validatedData.capaciteMax || undefined,
      inscriptionsOuvertes: validatedData.inscriptionsOuvertes,
      lienInscription: validatedData.lienInscription,
      etablissementId: validatedData.etablissementId,
      communeId: etablissement.communeId,
      isOrganiseParProvince: validatedData.isOrganiseParProvince,
      sousCouvertProvince: validatedData.sousCouvertProvince,
      statut: 'EN_ATTENTE_VALIDATION',
      createdBy: userId,
    },
  });

  // Création du média si image fournie
  if (validatedData.imagePrincipale) {
    await prisma.media.create({
      data: {
        nomFichier: 'Image Principale',
        cheminFichier: validatedData.imagePrincipale,
        urlPublique: validatedData.imagePrincipale,
        type: 'IMAGE',
        mimeType: 'image/jpeg',
        evenementId: evenement.id,
        uploadePar: userId
      }
    });
  }

  // Notification aux admins
  await notifyAdmins({
    type: 'EVENT_CREATION',
    titre: 'Nouvel événement à valider',
    message: `L'événement "${validatedData.titre}" a été créé par la délégation (Secteur: ${etablissement.secteur}) et attend votre validation.`,
    lien: `/admin/evenements`,
  });

  return successResponse(
    evenement,
    'Événement créé avec succès. Il sera visible après validation par un administrateur.',
    201
  );
});
