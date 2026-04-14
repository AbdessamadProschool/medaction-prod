import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { SecurityValidation } from '@/lib/security/validation';
import { withErrorHandler, successResponse } from '@/lib/api-handler';
import { UnauthorizedError, ForbiddenError } from '@/lib/exceptions';
import { withPermission } from '@/lib/auth/api-guard';
import { Prisma, StatutReclamation, AffectationReclamation } from '@prisma/client';

// Whitelist des catégories autorisées ALIGNÉES SUR L'UI
const VALID_CATEGORIES = [
  'infrastructure', 'proprete', 'eclairage', 'eau', 'securite', 
  'education', 'sante', 'sport', 'social', 'autre'
] as const;

// Schéma de validation sécurisé pour la création (OWASP compliant)
const createReclamationSchema = z.object({
  etablissementId: SecurityValidation.schemas.id.optional(),
  communeId: SecurityValidation.schemas.id,
  quartierDouar: z.string().max(200).optional().transform(v => v ? SecurityValidation.sanitizeString(v) : undefined),
  adresseComplete: z.string().max(500).optional().transform(v => v ? SecurityValidation.sanitizeString(v) : undefined),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  categorie: z.enum(VALID_CATEGORIES),
  titre: SecurityValidation.schemas.title,
  description: SecurityValidation.schemas.description,
});

// POST - Créer une réclamation
export const POST = withPermission('reclamations.create', withErrorHandler(async (request, { session }) => {
  const userId = SecurityValidation.validateId(session?.user?.id);
  if (!userId) throw new UnauthorizedError('Session utilisateur invalide');

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Rate Limiting métier : 5 réclamations par mois
  const count = await prisma.reclamation.count({
    where: {
      userId,
      createdAt: { gte: startOfMonth }
    }
  });

  if (count >= 5) {
     const nextReset = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();
     return NextResponse.json(
       { 
         success: false, 
         error: 'LIMIT_EXCEEDED', 
         resetDate: nextReset, 
         message: 'Limite mensuelle de réclamations atteinte (5).' 
       }, 
       { status: 429 }
     );
  }

  const body = await request.json();
  const validation = createReclamationSchema.safeParse(body);

  if (!validation.success) {
    throw validation.error;
  }

  const data = validation.data;

  // Utiliser une transaction pour l'atomicité
  const result = await prisma.$transaction(async (tx) => {
    // Créer la réclamation
    const reclamation = await tx.reclamation.create({
      data: {
        userId,
        etablissementId: data.etablissementId,
        communeId: data.communeId,
        quartierDouar: data.quartierDouar,
        adresseComplete: data.adresseComplete,
        latitude: data.latitude,
        longitude: data.longitude,
        categorie: data.categorie,
        titre: data.titre,
        description: data.description,
        statut: null,
        affectationReclamation: 'NON_AFFECTEE',
      },
      include: {
        commune: { select: { nom: true, nomArabe: true } },
        etablissement: { select: { nom: true, nomArabe: true } },
      }
    });

    // Créer l'entrée d'historique
    await tx.historiqueReclamation.create({
      data: {
        reclamationId: reclamation.id,
        action: 'CREATION',
        details: {
          titre: reclamation.titre,
          categorie: reclamation.categorie,
        },
        effectuePar: userId,
      }
    });

    return reclamation;
  });

  return successResponse(result, 'Réclamation créée avec succès', 201);
}));

// GET - Lister les réclamations (selon le rôle)
export const GET = withPermission('reclamations.read', withErrorHandler(async (request, { session }) => {
  const userId = SecurityValidation.validateId(session?.user?.id);
  if (!userId) throw new UnauthorizedError();

  const { searchParams } = new URL(request.url);
  
  // Pagination bornée et sécurisée
  const { page, limit } = SecurityValidation.validatePagination(
    searchParams.get('page'), 
    searchParams.get('limit')
  );
  const skip = (page - 1) * limit;

  const statutRaw = searchParams.get('statut');
  const affectationRaw = searchParams.get('affectation');
  const urgentes = searchParams.get('urgentes');
  const communeIdRaw = searchParams.get('communeId');
  const sortByRaw = searchParams.get('sortBy');
  const searchRaw = searchParams.get('search');

  let where: Prisma.ReclamationWhereInput = {};
  const andConditions: Prisma.ReclamationWhereInput[] = [];
  const role = session.user.role;

  // Filtres selon le rôle
  const roleFilters: Prisma.ReclamationWhereInput[] = [];

  switch (role) {
    case 'CITOYEN':
      roleFilters.push({ userId });
      break;
    case 'AUTORITE_LOCALE':
      roleFilters.push({ affecteeAAutoriteId: userId });
      break;
    case 'DELEGATION': {
      const delegation = await prisma.user.findUnique({
        where: { id: userId },
        select: { secteurResponsable: true }
      });
      if (delegation?.secteurResponsable) {
        roleFilters.push({ secteurAffecte: delegation.secteurResponsable });
      } else {
        roleFilters.push({ id: -1 });
      }
      break;
    }
    case 'ADMIN':
    case 'SUPER_ADMIN':
    case 'GOUVERNEUR':
      break;
    default:
      throw new ForbiddenError("Rôle non reconnu");
  }

  if (roleFilters.length > 0) {
    andConditions.push(...roleFilters);
  }

  // Filtres additionnels sanitisés
  if (statutRaw) {
    const s = statutRaw.toUpperCase();
    if (s === 'EN_ATTENTE') {
      andConditions.push({ statut: null });
    } else if (Object.values(StatutReclamation).includes(s as StatutReclamation)) {
      andConditions.push({ statut: s as StatutReclamation });
    }
  }

  if (affectationRaw && Object.values(AffectationReclamation).includes(affectationRaw.toUpperCase() as AffectationReclamation)) {
    andConditions.push({ affectationReclamation: affectationRaw.toUpperCase() as AffectationReclamation });
  }

  if (urgentes === 'true') {
    andConditions.push({
      OR: [
        { statut: null },
        { 
          statut: 'ACCEPTEE',
          affectationReclamation: { in: ['NON_AFFECTEE', 'AFFECTEE'] },
          dateResolution: null
        }
      ],
      isArchivee: false
    });
  }

  const validCommuneId = SecurityValidation.validateId(communeIdRaw);
  if (validCommuneId) {
    andConditions.push({ communeId: validCommuneId });
  }

  if (searchRaw) {
    const sanitizedSearch = SecurityValidation.sanitizeString(searchRaw).slice(0, 100);
    if (sanitizedSearch) {
      andConditions.push({
        OR: [
          { titre: { contains: sanitizedSearch, mode: 'insensitive' } },
          { description: { contains: sanitizedSearch, mode: 'insensitive' } },
        ]
      });
    }
  }

  if (andConditions.length > 0) {
    where.AND = andConditions;
  }

  // Whitelist pour le tri
  const ALLOWED_SORT_FIELDS = ['createdAt', 'dateAffectation'];
  let orderBy: Prisma.ReclamationOrderByWithRelationInput = { createdAt: 'desc' };
  if (sortByRaw && ALLOWED_SORT_FIELDS.includes(sortByRaw)) {
    orderBy = { [sortByRaw]: 'desc' };
  }

  const baseConditions = roleFilters.length > 0 ? roleFilters : [];

  const [reclamations, total, countEnAttente, countAccepted, countToAssign, countProcessing] = await Promise.all([
    prisma.reclamation.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: {
        user: { select: { nom: true, prenom: true, email: true } },
        commune: { select: { id: true, nom: true, nomArabe: true } },
        etablissement: { select: { id: true, nom: true, nomArabe: true, secteur: true } },
        medias: true,
      }
    }),
    prisma.reclamation.count({ where }),
    prisma.reclamation.count({ where: { AND: [...baseConditions, { statut: null }] } }),
    prisma.reclamation.count({ where: { AND: [...baseConditions, { statut: 'ACCEPTEE' }] } }),
    prisma.reclamation.count({ where: { AND: [...baseConditions, { statut: 'ACCEPTEE', affectationReclamation: 'NON_AFFECTEE' }] } }),
    prisma.reclamation.count({ where: { AND: [...baseConditions, { statut: 'ACCEPTEE', affectationReclamation: 'AFFECTEE' }] } }),
  ]);

  const affecteeIds = Array.from(new Set(
    reclamations
      .filter(r => r.affecteeAAutoriteId)
      .map(r => r.affecteeAAutoriteId as number)
  ));
  
  let affecteesMap = new Map<number, { id: number; nom: string; prenom: string; role: string }>();
  if (affecteeIds.length > 0) {
    const affectees = await prisma.user.findMany({
      where: { id: { in: affecteeIds } },
      select: { id: true, nom: true, prenom: true, role: true }
    });
    affecteesMap = new Map(affectees.map(a => [a.id, a]));
  }

  return NextResponse.json({
    success: true,
    data: reclamations.map(r => ({
      ...r,
      affecteeAAutorite: r.affecteeAAutoriteId ? affecteesMap.get(r.affecteeAAutoriteId) : null
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    },
    stats: {
      enAttente: countEnAttente,
      acceptees: countAccepted,
      aDispatcher: countToAssign,
      enCours: countProcessing,
    }
  });
}));
