import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { hashPassword } from "@/lib/auth/password";
import { SecurityValidation } from "@/lib/security/validation";
import { withErrorHandler, successResponse } from "@/lib/api-handler";
import { UnauthorizedError, ForbiddenError, ValidationError, ConflictError } from "@/lib/exceptions";
import { withPermission } from "@/lib/auth/api-guard";
import { z } from "zod";

// Schéma de validation pour la création d'utilisateur par Admin
const createUserSchema = z.object({
  email: SecurityValidation.schemas.email,
  telephone: z.string()
    .regex(/^(\+212|0)[5-7]\d{8}$/, "Numéro de téléphone marocain invalide")
    .optional()
    .nullable(),
  motDePasse: SecurityValidation.schemas.password,
  nom: SecurityValidation.schemas.name,
  prenom: SecurityValidation.schemas.name,
  photo: z.string().url().optional(),
  role: z.string().default('CITOYEN'),
  isActive: z.boolean().default(true),
  secteurResponsable: z.string().optional(),
  communeResponsableId: SecurityValidation.schemas.id.optional().nullable(),
  etablissementsGeres: z.array(z.number().int()).optional(),
});

// GET /api/users - Liste des utilisateurs (ADMIN, SUPER_ADMIN)
export const GET = withPermission('users.read', withErrorHandler(async (request: NextRequest, { session }) => {
  const { searchParams } = new URL(request.url);
  
  // Paramètres de filtrage avec validation sécurisée
  const { page, limit } = SecurityValidation.validatePagination(
    searchParams.get('page'),
    searchParams.get('limit')
  );
  
  const searchRaw = searchParams.get('search') || '';
  const role = searchParams.get('role') || '';
  const isActiveRaw = searchParams.get('isActive');
  const secteur = searchParams.get('secteur') || '';
  const sortByRaw = searchParams.get('sortBy') || 'createdAt';
  const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';

  // Whitelist pour le tri
  const ALLOWED_SORT_FIELDS = ['createdAt', 'nom', 'prenom', 'email', 'role', 'derniereConnexion'];
  const sortBy = ALLOWED_SORT_FIELDS.includes(sortByRaw) ? sortByRaw : 'createdAt';

  // Construction des filtres
  const where: any = {};

  // Recherche sanitisée
  if (searchRaw) {
    const search = SecurityValidation.sanitizeString(searchRaw);
    where.OR = [
      { nom: { contains: search, mode: 'insensitive' } },
      { prenom: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { telephone: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (role) where.role = role;
  if (isActiveRaw !== null && isActiveRaw !== '') where.isActive = isActiveRaw === 'true';
  if (secteur) where.secteurResponsable = secteur;

  // Sécurité supplémentaire : Exclure les SUPER_ADMIN si l'utilisateur n'est pas SUPER_ADMIN
  if (session.user.role !== 'SUPER_ADMIN') {
    where.role = { not: 'SUPER_ADMIN' };
  }

  // Requêtes DB
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        telephone: true,
        nom: true,
        prenom: true,
        photo: true,
        role: true,
        isActive: true,
        isEmailVerifie: true,
        derniereConnexion: true,
        dateInscription: true,
        createdAt: true,
        communeResponsable: { select: { id: true, nom: true } },
        _count: {
          select: {
            evaluations: true,
            reclamationsCreees: true,
            evenementsCrees: true,
            actualiteCreees: true,
          }
        }
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  // Statistiques de répartition par rôle
  const stats = await prisma.user.groupBy({
    by: ['role'],
    _count: { id: true },
  });

  const roleStats = stats.reduce((acc, item) => {
    acc[item.role] = item._count.id;
    return acc;
  }, {} as Record<string, number>);

  return NextResponse.json({
    success: true,
    data: users,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    stats: {
      total,
      byRole: roleStats,
    }
  });
}));

// POST /api/users - Créer un utilisateur (ADMIN, SUPER_ADMIN)
export const POST = withPermission('users.create', withErrorHandler(async (request: NextRequest, { session }) => {
  const body = await request.json();
  const validation = createUserSchema.safeParse(body);

  if (!validation.success) {
    throw validation.error;
  }

  const data = validation.data;

  // Restriction : seul SUPER_ADMIN peut créer des ADMIN ou SUPER_ADMIN
  if (['ADMIN', 'SUPER_ADMIN'].includes(data.role) && session.user.role !== 'SUPER_ADMIN') {
    throw new ForbiddenError("Seul un Super Admin peut créer des comptes administratifs");
  }

  // Vérifier unicité email
  const existingEmail = await prisma.user.findUnique({ where: { email: data.email } });
  if (existingEmail) {
    throw new ConflictError("Cet email est déjà utilisé");
  }

  // Vérifier unicité téléphone
  if (data.telephone) {
    const existingPhone = await prisma.user.findUnique({ where: { telephone: data.telephone } });
    if (existingPhone) {
      throw new ConflictError("Ce numéro de téléphone est déjà utilisé");
    }
  }

  // Hasher le mot de passe
  const hashedPassword = await hashPassword(data.motDePasse);

  const { etablissementsGeres, communeResponsableId, ...userData } = data;

  // Créer l'utilisateur
  const newUser = await prisma.user.create({
    data: {
      ...userData,
      motDePasse: hashedPassword,
      isEmailVerifie: true, // Créé par admin = vérifié par défaut
      ...(communeResponsableId && {
        communeResponsable: { connect: { id: communeResponsableId } }
      }),
      ...(etablissementsGeres && {
        etablissementsGeres: etablissementsGeres
      })
    } as any,
    select: {
      id: true,
      email: true,
      nom: true,
      prenom: true,
      role: true,
      isActive: true,
      createdAt: true,
    }
  });

  return successResponse(newUser, "Utilisateur créé avec succès", 201);
}));
