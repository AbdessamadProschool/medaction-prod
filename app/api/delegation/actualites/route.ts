import { safeParseInt } from '@/lib/utils/parse';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { withErrorHandler, successResponse } from '@/lib/api-handler';
import { UnauthorizedError, ForbiddenError, ValidationError, NotFoundError } from '@/lib/exceptions';
import { notifyAdmins } from '@/lib/notifications';
import { actualiteSchema } from '@/lib/validations/delegation';

// GET - Liste des actualités de la délégation
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
  
  const page = Math.max(1, safeParseInt(searchParams.get('page') || '1', 1));
  const limit = Math.max(1, Math.min(safeParseInt(searchParams.get('limit') || '12', 12), 100));
  const search = searchParams.get('search') || '';
  const statut = searchParams.get('statut') || '';

  const where: Record<string, unknown> = {
    createdBy: userId,
  };

  if (search) {
    where.OR = [
      { titre: { contains: search, mode: 'insensitive' } },
      { contenu: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (statut === 'PUBLIEE') {
    where.isPublie = true;
  } else if (statut === 'BROUILLON') {
    where.isPublie = false;
  }

  const [actualites, total] = await Promise.all([
    prisma.actualite.findMany({
      where,
      include: {
        etablissement: { select: { nom: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.actualite.count({ where }),
  ]);

  return successResponse({
    actualites,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

// POST - Créer une actualité
export const POST = withErrorHandler(async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    throw new UnauthorizedError('Vous devez être connecté pour créer une actualité');
  }

  if (session.user.role !== 'DELEGATION') {
    throw new ForbiddenError('Accès réservé aux délégations');
  }

  const userId = parseInt(session.user.id);
  const body = await request.json();

  // === VALIDATION DÉTAILLÉE VIA ZOD ===
  const validation = actualiteSchema.safeParse(body);
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

  // Vérifier que l'établissement existe
  const etablissement = await prisma.etablissement.findUnique({
    where: { id: validatedData.etablissementId }
  });
  if (!etablissement) {
    throw new NotFoundError("L'établissement sélectionné n'existe pas");
  }

  // === ISOLATION SECTORIELLE STRICTE ===
  if (etablissement.secteur !== session.user.secteurResponsable) {
    throw new ForbiddenError('Cet établissement appartient à un autre secteur');
  }

  const actualite = await prisma.actualite.create({
    data: {
      titre: validatedData.titre,
      contenu: validatedData.contenu,
      description: validatedData.resume || validatedData.description,
      categorie: validatedData.categorie,
      etablissementId: validatedData.etablissementId,
      isPublie: validatedData.isPublie,
      isValide: false, // Nécessite validation admin
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
        actualiteId: actualite.id,
        uploadePar: userId
      }
    });
  }

  // Notification aux admins (non bloquant)
  await notifyAdmins({
    type: 'ACTUALITE_CREATION',
    titre: 'Nouvelle actualité à valider',
    message: `L'actualité "${body.titre}" a été créée par la délégation et attend votre validation.`,
    lien: `/admin/actualites`,
  });

  return successResponse(
    actualite,
    'Actualité créée avec succès. Elle sera visible après validation par un administrateur.',
    201
  );
});
