import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { SECURITY_LIMITS, sanitizeString } from '@/lib/security/validation';
import { withErrorHandler } from '@/lib/api-handler';
import { UnauthorizedError, ForbiddenError, ValidationError } from '@/lib/exceptions';
import { withPermission } from '@/lib/auth/api-guard';

// Schéma de validation sécurisé pour la création (OWASP compliant)
const createReclamationSchema = z.object({
  etablissementId: z.number().int().positive().max(SECURITY_LIMITS.ID_MAX).optional(),
  communeId: z.number().int().positive().max(SECURITY_LIMITS.ID_MAX),
  quartierDouar: z.string().max(200).optional().transform(val => val ? sanitizeString(val) : undefined),
  adresseComplete: z.string().max(500).optional().transform(val => val ? sanitizeString(val) : undefined),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  categorie: z.string().min(1, 'La catégorie est requise').max(50),
  titre: z.string()
    .min(SECURITY_LIMITS.TITLE_MIN, `Le titre doit contenir au moins ${SECURITY_LIMITS.TITLE_MIN} caractères`)
    .max(SECURITY_LIMITS.TITLE_MAX, `Le titre ne doit pas dépasser ${SECURITY_LIMITS.TITLE_MAX} caractères`)
    .transform(sanitizeString),
  description: z.string()
    .min(20, 'La description doit contenir au moins 20 caractères')
    .max(SECURITY_LIMITS.DESCRIPTION_MAX, `La description ne doit pas dépasser ${SECURITY_LIMITS.DESCRIPTION_MAX} caractères`)
    .transform(sanitizeString),
});

// POST - Créer une réclamation
export const POST = withPermission('reclamations.create', withErrorHandler(async (request) => {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    throw new UnauthorizedError();
  }

  // NOTE: La restriction "Seuls les citoyens" est levée pour permettre à tout rôle ayant 'reclamations.create' de poster.
  // L'héritage des permissions fait que ADMIN peut aussi créer.

  const body = await request.json();
  const validation = createReclamationSchema.safeParse(body);

  if (!validation.success) {
    throw new ValidationError('Données invalides', validation.error.flatten());
  }

  const data = validation.data;

  // Créer la réclamation avec statut null (en attente de décision)
  const reclamation = await prisma.reclamation.create({
    data: {
      userId: parseInt(session.user.id),
      etablissementId: data.etablissementId,
      communeId: data.communeId,
      quartierDouar: data.quartierDouar,
      adresseComplete: data.adresseComplete,
      latitude: data.latitude,
      longitude: data.longitude,
      categorie: data.categorie,
      titre: data.titre,
      description: data.description,
      statut: null, // En attente de décision admin
      affectationReclamation: 'NON_AFFECTEE',
    },
    include: {
      commune: { select: { nom: true } },
      etablissement: { select: { nom: true } },
    }
  });

  // Créer l'entrée d'historique
  await prisma.historiqueReclamation.create({
    data: {
      reclamationId: reclamation.id,
      action: 'CREATION',
      details: {
        titre: reclamation.titre,
        categorie: reclamation.categorie,
      },
      effectuePar: parseInt(session.user.id),
    }
  });

  return NextResponse.json({ 
    message: 'Réclamation créée avec succès',
    data: reclamation 
  }, { status: 201 });
}));

// GET - Lister les réclamations (selon le rôle)
export const GET = withPermission('reclamations.read', withErrorHandler(async (request) => {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    throw new UnauthorizedError();
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const skip = (page - 1) * limit;
  const statut = searchParams.get('statut');
  const affectation = searchParams.get('affectation');
  const urgentes = searchParams.get('urgentes');
  const communeId = searchParams.get('communeId');
  const sortBy = searchParams.get('sortBy') || 'createdAt';
  const search = searchParams.get('search');

  let where: any = {};
  const andConditions: any[] = [];
  const userId = parseInt(session.user.id);
  const role = session.user.role;

  // Filtres selon le rôle
  switch (role) {
    case 'CITOYEN':
      // Un citoyen ne voit que SES réclamations
      andConditions.push({ userId });
      break;

    case 'AUTORITE_LOCALE':
      // Une autorité locale voit les réclamations qui lui sont affectées
      andConditions.push({ affecteeAAutoriteId: userId });
      break;

    case 'DELEGATION':
      // Une délégation voit les réclamations de son secteur
      const delegation = await prisma.user.findUnique({
        where: { id: userId },
        select: { secteurResponsable: true }
      });
      if (delegation?.secteurResponsable) {
        andConditions.push({ secteurAffecte: delegation.secteurResponsable });
      } else {
        // Si pas de secteur, on ne montre rien par sécurité
        andConditions.push({ id: -1 });
      }
      break;

    case 'ADMIN':
    case 'SUPER_ADMIN':
    case 'GOUVERNEUR':
      // Voient tout
      break;

    default:
      throw new ForbiddenError();
  }

  // Filtres additionnels
  if (statut) {
    const s = statut.toUpperCase();
    if (s === 'EN_ATTENTE') {
      andConditions.push({ statut: null });
    } else if (s === 'ACCEPTEE' || s === 'REJETEE') {
      andConditions.push({ statut: s });
    }
  }

  if (affectation) {
    andConditions.push({ affectationReclamation: affectation });
  }

  // Filtre urgentes: réclamations en attente (statut null) ou non résolues
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

  // Filtre par commune
  if (communeId) {
    andConditions.push({ communeId: parseInt(communeId) });
  }

  // Filtre par recherche
  if (search) {
    andConditions.push({
      OR: [
        { titre: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ]
    });
  }

  // Assembler le where
  if (andConditions.length > 0) {
    where.AND = andConditions;
  }

  // Ordre de tri
  let orderBy: any = { createdAt: 'desc' };
  if (sortBy === 'dateAffectation') {
    orderBy = { dateAffectation: 'desc' };
  }

  const [reclamations, total] = await Promise.all([
    prisma.reclamation.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: {
        user: { select: { nom: true, prenom: true, email: true } },
        commune: { select: { id: true, nom: true } },
        etablissement: { select: { id: true, nom: true, secteur: true } },
        medias: true,
      }
    }),
    prisma.reclamation.count({ where })
  ]);

  // Récupérer les agents affectés manuellement (la relation n'existe pas dans le schéma)
  const affecteeIds = reclamations
    .filter(r => r.affecteeAAutoriteId)
    .map(r => r.affecteeAAutoriteId as number);
  
  let affecteesMap: Map<number, { id: number; nom: string; prenom: string; role: string }> = new Map();
  
  if (affecteeIds.length > 0) {
    const affectees = await prisma.user.findMany({
      where: { id: { in: affecteeIds } },
      select: { id: true, nom: true, prenom: true, role: true }
    });
    affecteesMap = new Map(affectees.map(a => [a.id, a]));
  }

  // Calculer les stats globales pour le dashboard (base sur les filtres de rôle mais sans les filtres de statut/recherche)
  // On crée un 'whereBase' pour avoir les stats pertinentes pour l'utilisateur sans les filtres appliqués à la liste
  let whereBase: any = {};
  if (andConditions.length > 0) {
    // On ne garde que les filtres de rôle (les premiers ajoutés)
    const roleFilters = andConditions.filter(c => c.userId || c.affecteeAAutoriteId || c.secteurAffecte || c.id === -1);
    if (roleFilters.length > 0) whereBase.AND = roleFilters;
  }

  const [countEnAttente, countAccepted, countToAssign, countProcessing] = await Promise.all([
    prisma.reclamation.count({ where: { ...whereBase, statut: null } }),
    prisma.reclamation.count({ where: { ...whereBase, statut: 'ACCEPTEE' } }),
    prisma.reclamation.count({ where: { ...whereBase, statut: 'ACCEPTEE', affectationReclamation: 'NON_AFFECTEE' } }),
    prisma.reclamation.count({ where: { ...whereBase, statut: 'ACCEPTEE', affectationReclamation: 'AFFECTEE' } }),
  ]);

  // Enrichir les réclamations avec les agents affectés
  const enrichedReclamations = reclamations.map(r => ({
    ...r,
    affecteeAAutorite: r.affecteeAAutoriteId ? affecteesMap.get(r.affecteeAAutoriteId) || null : null,
  }));

  return NextResponse.json({
    data: enrichedReclamations,
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
