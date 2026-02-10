import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db";
import { etablissementSchema, etablissementFilterSchema } from "@/lib/validations/etablissement";
import { Prisma } from "@prisma/client";
import { withErrorHandler } from "@/lib/api-handler";
import { UnauthorizedError, ForbiddenError, ValidationError, AppError } from "@/lib/exceptions";

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

  // Pour le public, seules les établissements publiés et validés
  // Admin et Délégation peuvent voir les non-publiés (pour gestion)
  // Coordinateur voit ses établissements (même non publiés ?) -> Oui, pour pouvoir gérer
  if (!isAdmin && !isDelegation && !isCoordinateur && !idsParam) {
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
      { code: { contains: search, mode: "insensitive" } },
      { adresseComplete: { contains: search, mode: "insensitive" } },
    ];
  }

  if (secteur) where.secteur = secteur;
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
        commune: { select: { id: true, nom: true } },
        annexe: { select: { id: true, nom: true } },
        _count: {
          select: {
            evaluations: true,
            reclamations: true,
            evenements: true,
          }
        }
      },
    }),
    prisma.etablissement.count({ where }),
  ]);

  return NextResponse.json(
    {
      data: etablissements,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    },
    {
      headers: {
        // Cache public requests for 5 minutes
        'Cache-Control': isAdmin ? 'no-store' : 'public, max-age=300, s-maxage=300',
      }
    }
  );
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
      commune: { select: { id: true, nom: true } },
      annexe: { select: { id: true, nom: true } },
    },
  });

  return NextResponse.json({
    message: "Établissement créé avec succès",
    data: etablissement
  }, { status: 201 });
});
