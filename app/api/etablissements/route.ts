import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db";
import { etablissementSchema, etablissementFilterSchema } from "@/lib/validations/etablissement";
import { Prisma } from "@prisma/client";
import { withErrorHandler, successResponse } from "@/lib/api-handler";
import { UnauthorizedError, ForbiddenError, ValidationError, AppError } from "@/lib/exceptions";
import { ActivityLogger } from "@/lib/activity-logger";

// GET - Liste des établissements (Public avec filtres)
export const GET = withErrorHandler(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const queryParams = Object.fromEntries(searchParams.entries());

  // Validate filters
  const result = etablissementFilterSchema.safeParse(queryParams);

  if (!result.success) {
    throw new ValidationError("Filtres invalides", result.error.flatten());
  }

  const { page, limit, search, secteur, communeId, isPublie, isValide } = result.data;
  const annexeId = searchParams.get('annexeId');
  const noteMin = searchParams.get('noteMin');
  const nature = searchParams.get('nature');
  const idsParam = searchParams.get('ids'); // Pour filtrer par IDs spécifiques
  const skip = (page - 1) * limit;

  // Session pour permissions
  const session = await getServerSession(authOptions);
  const isAdmin = session?.user?.role && ['ADMIN', 'SUPER_ADMIN'].includes(session.user.role);
  const isDelegation = session?.user?.role === 'DELEGATION';

  // Build where clause
  const where: Prisma.EtablissementWhereInput = {};

  // Si des IDs spécifiques sont demandés (ex: pour coordinateurs)
  if (idsParam) {
    const ids = idsParam.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
    if (ids.length > 0) {
      where.id = { in: ids };
    }
  }

  // === LOGIQUE COORDINATEUR ===
  // Force le filtrage sur les établissements gérés par le coordinateur (source DB fraîche)
  const isCoordinateur = session?.user?.role === 'COORDINATEUR_ACTIVITES';
  if (isCoordinateur && session?.user?.id) {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(session.user.id as string) },
      select: { etablissementsGeres: true }
    });
    
    const managedIds = user?.etablissementsGeres || [];
    
    // Si le coordinateur ne gère aucun établissement, on renvoie vide
    if (managedIds.length === 0) {
      return NextResponse.json({
        data: [],
        pagination: { total: 0, page, limit, totalPages: 0 }
      });
    }

    // Intersection avec les IDs demandés ou restriction totale
    if (where.id && typeof where.id === 'object' && 'in' in where.id && Array.isArray(where.id.in)) {
      const requestedIds = where.id.in as number[];
      const allowedIds = requestedIds.filter(id => managedIds.includes(id));
      where.id = { in: allowedIds.length > 0 ? allowedIds : [-1] }; // -1 pour ne rien trouver
    } else {
      where.id = { in: managedIds };
    }
  }

  // === LOGIQUE DÉLÉGATION ===
  // Force le filtrage sur le secteur de responsabilité de la délégation
  if (isDelegation && session?.user?.secteurResponsable) {
    where.secteur = session.user.secteurResponsable as any;
  }

  // SECURITY FIX: Le filtre de visibilité doit TOUJOURS s'appliquer aux non-admins
  // Retrait de la condition `!idsParam` qui permettait de contourner le filtre
  if (!isAdmin && !isDelegation && !isCoordinateur) {
    where.isPublie = true;
    where.isValide = true;
  } else if (isAdmin) {
    // Admin peut filtrer spécifiquement si demandé
    if (isPublie !== undefined) where.isPublie = isPublie;
    if (isValide !== undefined) where.isValide = isValide;
  }

  // Filtres de recherche
  if (search) {
    where.OR = [
      { nom: { contains: search, mode: "insensitive" } },
      { nomArabe: { contains: search, mode: "insensitive" } },
      { code: { contains: search, mode: "insensitive" } },
      { adresseComplete: { contains: search, mode: "insensitive" } },
    ];
  }

  if (secteur) {
    if (isDelegation && session?.user?.secteurResponsable) {
      // La délégation reste restreinte à son secteur
      where.secteur = session.user.secteurResponsable as any;
    } else {
      where.secteur = secteur;
    }
  }
  if (communeId) where.communeId = communeId;
  if (annexeId) where.annexeId = parseInt(annexeId);
  if (nature) where.nature = nature;
  if (noteMin) where.noteMoyenne = { gte: parseFloat(noteMin) };

  // Execute query
  const [etablissements, total] = await Promise.all([
    prisma.etablissement.findMany({
      where,
      skip,
      take: limit,
      orderBy: [
        { isMisEnAvant: 'desc' },
        { noteMoyenne: 'desc' },
        { nom: 'asc' }
      ],
      include: {
        commune: { select: { id: true, nom: true, nomArabe: true } },
        annexe: { select: { id: true, nom: true, nomArabe: true } },
        _count: {
          select: {
            evaluations: true,
            reclamations: true,
            evenementsOrganises: true,
          }
        }
      },
    }),
    prisma.etablissement.count({ where }),
  ]);

  const response = successResponse(
    {
      data: etablissements,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    },
    undefined,
    200
  );
  response.headers.set('Cache-Control', isAdmin ? 'no-store' : 'public, max-age=300, s-maxage=300');
  return response;
});

// POST - Créer un établissement (ADMIN uniquement)
export const POST = withErrorHandler(async (req: NextRequest) => {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    throw new UnauthorizedError();
  }

  // Vérifier les permissions
  const { checkPermission } = await import("@/lib/permissions");
  const hasPermission = await checkPermission(parseInt(session.user.id), 'etablissements.create');

  if (!hasPermission) {
    throw new ForbiddenError("Vous n'avez pas la permission de créer des établissements");
  }

  const body = await req.json();
  const result = etablissementSchema.safeParse(body);

  if (!result.success) {
    throw new ValidationError("Données invalides", result.error.flatten());
  }

  // Vérifier si le code existe déjà
  const existingCode = await prisma.etablissement.findUnique({
    where: { code: result.data.code }
  });

  if (existingCode) {
    throw new AppError("Ce code d'établissement existe déjà", 'CONFLICT', 409);
  }

  // Vérifier s'il y a un doublon par nom ou coordonnées (ignorant le signe moins de la longitude)
  const duplicate = await checkDuplicateEtablissement({
    nom: result.data.nom,
    nomArabe: result.data.nomArabe,
    latitude: result.data.latitude,
    longitude: result.data.longitude,
  });

  if (duplicate) {
    throw new AppError(duplicate.message, 'CONFLICT', 409);
  }

  // Vérifier que la commune existe
  const commune = await prisma.commune.findUnique({
    where: { id: result.data.communeId }
  });

  if (!commune) {
    throw new AppError("Commune non trouvée", 'NOT_FOUND', 400);
  }

  // Créer l'établissement
  const etablissement = await prisma.etablissement.create({
    data: {
      ...result.data,
      donneesSpecifiques: result.data.donneesSpecifiques || {},
      services: result.data.services || [],
      programmes: result.data.programmes || [],
    },
    include: {
      commune: { select: { id: true, nom: true, nomArabe: true } },
      annexe: { select: { id: true, nom: true, nomArabe: true } },
    },
  });

  await ActivityLogger.custom({
    action: 'Création d\'un établissement',
    entity: 'Etablissement',
    entityId: etablissement.id,
    details: {
      message: `L'utilisateur a ajouté l'établissement "${etablissement.nom}" (${etablissement.code})`,
      nom: etablissement.nom,
      code: etablissement.code,
      secteur: etablissement.secteur
    },
    userId: parseInt(session.user.id)
  });

  return successResponse(etablissement, "Établissement créé avec succès", 201);
});

async function checkDuplicateEtablissement(params: {
  nom: string;
  nomArabe?: string | null;
  latitude: number;
  longitude: number;
  excludeId?: number;
}) {
  const { nom, nomArabe, latitude, longitude, excludeId } = params;
  
  // 1. Chercher par nom identique (insensible à la casse)
  const nameWhere: any = {
    OR: [
      { nom: { equals: nom.trim(), mode: 'insensitive' } }
    ]
  };
  if (nomArabe && nomArabe.trim() !== '') {
    nameWhere.OR.push({ nomArabe: { equals: nomArabe.trim(), mode: 'insensitive' } });
  }
  if (excludeId) {
    nameWhere.id = { not: excludeId };
  }

  const byName = await prisma.etablissement.findFirst({
    where: nameWhere,
    select: { id: true, nom: true, code: true }
  });

  if (byName) {
    return {
      type: 'NAME',
      message: `Un établissement nommé "${byName.nom}" (Code: ${byName.code}) existe déjà.`,
    };
  }

  // 2. Chercher par proximité géographique (latitude proche)
  const geoWhere: any = {
    latitude: {
      gte: latitude - 0.0001,
      lte: latitude + 0.0001
    }
  };
  if (excludeId) {
    geoWhere.id = { not: excludeId };
  }

  const nearbyEtablissements = await prisma.etablissement.findMany({
    where: geoWhere,
    select: { id: true, nom: true, code: true, latitude: true, longitude: true }
  });

  for (const e of nearbyEtablissements) {
    const latDiff = Math.abs(e.latitude - latitude);
    const longDiff = Math.abs(Math.abs(e.longitude) - Math.abs(longitude));
    
    if (latDiff < 0.0001 && longDiff < 0.0001) {
      return {
        type: 'COORDINATES',
        message: `Un établissement existe déjà aux mêmes coordonnées : "${e.nom}" (Code: ${e.code}).`,
      };
    }
  }

  return null;
}
