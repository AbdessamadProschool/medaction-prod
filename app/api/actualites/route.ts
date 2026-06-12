import { safeParseInt } from '@/lib/utils/parse';
import { SecurityValidation } from '@/lib/security/validation';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { withErrorHandler, successResponse } from '@/lib/api-handler';
import { UnauthorizedError, ForbiddenError, NotFoundError } from '@/lib/exceptions';
import { z } from 'zod';
import { sanitizeString } from '@/lib/security/validation';
import { checkPermission } from '@/lib/permissions';
import { notifyAdmins } from '@/lib/notifications';
import { ActivityLogger } from '@/lib/activity-logger';

// Schéma de validation pour création d'actualité (compatible Zod v4)
const createActualiteSchema = z.object({
  etablissementId: z.number().int().positive(),
  titre: z.string()
    .min(5, "Le titre doit contenir au moins 5 caractères")
    .max(200, "Le titre ne doit pas dépasser 200 caractères")
    .transform(sanitizeString),
  description: z.string()
    .max(500, "La description ne doit pas dépasser 500 caractères")
    .optional()
    .transform(v => v ? sanitizeString(v) : undefined),
  contenu: z.string()
    .min(50, "Le contenu doit contenir au moins 50 caractères")
    .transform(v => v.trim()),
  categorie: z.string().optional().transform(v => v ? sanitizeString(v) : undefined),
  tags: z.array(z.string()).optional(),
  imagePrincipale: z.string().optional(),
});


// POST - Créer une actualité (DELEGATION uniquement)
export const POST = withErrorHandler(async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    throw new UnauthorizedError('Vous devez être connecté pour créer une actualité');
  }

  const userId = parseInt(session.user.id);
  
  // Vérifier la permission
  const hasPermission = await checkPermission(userId, 'actualites.create');

  if (!hasPermission) {
    throw new ForbiddenError("Vous n'avez pas la permission de créer des actualités");
  }

  const body = await request.json();
  
  // Validation avec Zod (les erreurs seront automatiquement formatées par le handler)
  const validation = createActualiteSchema.safeParse(body);

  if (!validation.success) {
    // withErrorHandler gère le formatage des ZodError — pas besoin de reshaping manuel
    throw validation.error;
  }

  const data = validation.data;

  // Vérifier que l'établissement existe
  const etablissement = await prisma.etablissement.findUnique({
    where: { id: data.etablissementId },
    select: { id: true, nom: true }
  });

  if (!etablissement) {
    throw new NotFoundError("L'établissement sélectionné n'existe pas");
  }

  // Créer l'actualité
  const actualite = await prisma.actualite.create({
    data: {
      etablissementId: data.etablissementId,
      titre: data.titre,
      description: data.description,
      contenu: data.contenu,
      categorie: data.categorie,
      tags: data.tags || [],
      statut: 'EN_ATTENTE_VALIDATION',
      isPublie: false,
      isValide: false,
      createdBy: userId,
    },
    include: {
      etablissement: { select: { nom: true, nomArabe: true } },
    }
  });

  // Notifier les admins (non-bloquant) — centralisé dans lib/notifications.ts
  await notifyAdmins({
    type: 'NOUVELLE_ACTUALITE',
    titre: 'Nouvelle actualité à valider',
    message: `L'actualité "${actualite.titre}" attend votre validation.`,
    lien: `/admin/actualites/${actualite.id}`,
  });

  // Journalisation de l'activité — centralisée dans lib/activity-logger.ts
  await ActivityLogger.create(userId, 'Actualite', actualite.id, {
    titre: actualite.titre,
    categorie: actualite.categorie,
  });

  return successResponse(
    actualite,
    'Actualité créée avec succès. Elle sera visible après validation par un administrateur.',
    201
  );
});

// GET - Liste des actualités
export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  
  const { page, limit } = SecurityValidation.validatePagination(
    searchParams.get('page'),
    searchParams.get('limit')
  );
  const categorie = searchParams.get('categorie');
  const etablissementId = searchParams.get('etablissementId');
  const search = searchParams.get('search');
  const statut = searchParams.get('statut');

  const session = await getServerSession(authOptions);
  const isAdmin = session?.user?.role && ['ADMIN', 'SUPER_ADMIN'].includes(session.user.role);
  const isDelegation = session?.user?.role === 'DELEGATION';

  // Construction du filtre sécurisé
  const andConditions: any[] = [];

  // Filtre de base selon le rôle
  if (!isAdmin && !isDelegation) {
    andConditions.push({ isPublie: true, isValide: true, statut: 'PUBLIEE' });
  } else if (isAdmin && statut) {
    andConditions.push({ statut });
  }

  // Permission spécifique Délégation
  if (isDelegation && session?.user?.id) {
    andConditions.push({
      OR: [
        { isPublie: true, isValide: true, statut: 'PUBLIEE' },
        { createdBy: parseInt(session.user.id) }
      ]
    });
  }

  // Filtres optionnels
  if (categorie) andConditions.push({ categorie });
  if (etablissementId) {
    const validId = SecurityValidation.validateId(etablissementId);
    if (validId) andConditions.push({ etablissementId: validId });
  }
  if (search) {
    andConditions.push({
      OR: [
        { titre: { contains: search, mode: 'insensitive' } },
        { contenu: { contains: search, mode: 'insensitive' } },
      ]
    });
  }

  const where = andConditions.length > 0 ? { AND: andConditions } : {};

  // Requête avec pagination
  const [actualites, total] = await Promise.all([
    prisma.actualite.findMany({
      where,
      include: {
        etablissement: { 
          select: { 
            id: true, 
            nom: true, 
            nomArabe: true, 
            secteur: true,
            commune: { select: { id: true, nom: true, nomArabe: true } }
          } 
        },
        medias: { take: 1, select: { urlPublique: true } },
        createdByUser: { select: { nom: true, prenom: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.actualite.count({ where })
  ]);

  const response = successResponse(
    {
      data: actualites,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    },
    undefined,
    200
  );
  response.headers.set('Cache-Control', isAdmin ? 'no-store' : 'public, max-age=60, s-maxage=60');
  return response;
});
