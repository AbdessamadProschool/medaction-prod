import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { z } from "zod";
import { SecurityValidation } from "@/lib/security/validation";
import { withErrorHandler, successResponse } from "@/lib/api-handler";
import { UnauthorizedError, ForbiddenError, NotFoundError, ValidationError } from "@/lib/exceptions";
import { withPermission } from "@/lib/auth/api-guard";

// Schéma de validation pour l'édition d'utilisateur par Admin
const updateUserSchema = z.object({
  nom: SecurityValidation.schemas.name.optional(),
  prenom: SecurityValidation.schemas.name.optional(),
  email: SecurityValidation.schemas.email.optional(),
  telephone: z.string()
    .regex(/^(\+212|0)[5-7]\d{8}$/, "Numéro de téléphone marocain invalide")
    .nullable()
    .optional(),
  photo: z.string().url().nullable().optional(),
  role: z.string().optional(),
  isActive: z.boolean().optional(),
  secteurResponsable: z.string().nullable().optional(),
  communeResponsableId: SecurityValidation.schemas.id.nullable().optional(),
  etablissementsGeres: z.array(z.number().int()).optional(),
});

// GET /api/users/[id] - Détails d'un utilisateur
export const GET = withErrorHandler(async (
  request: NextRequest,
  { params: _p }: { params: Promise<{ id: string }> }
) => {
  const params = await _p;
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    throw new UnauthorizedError("Non authentifié");
  }

  const userId = SecurityValidation.validateId(params.id);
  if (!userId) {
    throw new ValidationError("Identifiant d'utilisateur invalide");
  }

  // Permission Check
  const { checkPermission } = await import("@/lib/permissions");
  const hasReadPermission = await checkPermission(parseInt(session.user.id), 'users.read');
  const isSelf = parseInt(session.user.id) === userId;

  if (!hasReadPermission && !isSelf) {
    throw new ForbiddenError("Accès non autorisé");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
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
      isTelephoneVerifie: true,
      secteurResponsable: true,
      communeResponsableId: true,
      etablissementsGeres: true,
      derniereConnexion: true,
      dateInscription: true,
      createdAt: true,
      updatedAt: true,
      communeResponsable: {
        select: {
          id: true,
          nom: true,
          nomArabe: true,
        }
      },
      _count: {
        select: {
          evaluations: true,
          reclamationsCreees: true,
          evenementsCrees: true,
          actualiteCreees: true,
        }
      }
    }
  });

  if (!user) {
    throw new NotFoundError("Utilisateur non trouvé");
  }

  // IDOR Protection: Empêcher un ADMIN de voir un SUPER_ADMIN
  if (user.role === 'SUPER_ADMIN' && session.user.role !== 'SUPER_ADMIN') {
    throw new ForbiddenError("Accès non autorisé à un compte Super Admin");
  }

  return successResponse(user);
});

// PATCH /api/users/[id] - Modifier un utilisateur (Admin)
export const PATCH = withPermission('users.edit', withErrorHandler(async (
  request: NextRequest,
  { params: _p }: { params: Promise<{ id: string }> }
) => {
  const params = await _p;
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new UnauthorizedError();

  const userId = SecurityValidation.validateId(params.id);
  if (!userId) throw new ValidationError("ID invalide");

  // Vérifier que l'utilisateur cible existe
  const existingUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!existingUser) throw new NotFoundError("Utilisateur non trouvé");

  // IDOR / Permission Escalation Prevention: 
  // 1. Seul un SUPER_ADMIN peut modifier un SUPER_ADMIN
  if (existingUser.role === 'SUPER_ADMIN' && session.user.role !== 'SUPER_ADMIN') {
    throw new ForbiddenError("Seul un Super Admin peut modifier un Super Admin");
  }

  const body = await request.json();
  const validation = updateUserSchema.safeParse(body);

  if (!validation.success) {
    throw validation.error;
  }

  const data = validation.data;

  // 2. Empêcher un ADMIN de se promouvoir ou promouvoir quelqu'un en SUPER_ADMIN
  if (data.role === 'SUPER_ADMIN' && session.user.role !== 'SUPER_ADMIN') {
    throw new ForbiddenError("Vous ne pouvez pas assigner le rôle Super Admin");
  }

  // Vérifier unicité email/téléphone si modifiés
  if (data.email && data.email !== existingUser.email) {
    const emailExists = await prisma.user.findUnique({ where: { email: data.email } });
    if (emailExists) throw new ConflictError("Cet email est déjà utilisé");
  }

  if (data.telephone && data.telephone !== existingUser.telephone) {
    const phoneExists = await prisma.user.findUnique({ where: { telephone: data.telephone } });
    if (phoneExists) throw new ConflictError("Ce téléphone est déjà utilisé");
  }

  // Mise à jour
  const { etablissementsGeres, communeResponsableId, ...userData } = data;
  
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(userData.nom && { nom: userData.nom }),
      ...(userData.prenom && { prenom: userData.prenom }),
      ...(userData.email && { email: userData.email }),
      ...(userData.telephone !== undefined && { telephone: userData.telephone }),
      ...(userData.photo !== undefined && { photo: userData.photo }),
      ...(userData.isActive !== undefined && { isActive: userData.isActive }),
      ...(userData.role && { role: userData.role }),
      ...(userData.secteurResponsable !== undefined && { secteurResponsable: userData.secteurResponsable }),
      ...(communeResponsableId !== undefined && { 
        communeResponsable: communeResponsableId === null ? { disconnect: true } : { connect: { id: communeResponsableId } } 
      }),
      ...(etablissementsGeres !== undefined && { 
        etablissementsGeres: etablissementsGeres 
      }),
    } as any,
    select: {
      id: true,
      email: true,
      nom: true,
      prenom: true,
      role: true,
      isActive: true,
      updatedAt: true,
    }
  });

  return successResponse(updatedUser, "Utilisateur modifié avec succès");
}));

// DELETE /api/users/[id] - Supprimer un utilisateur
export const DELETE = withErrorHandler(async (
  request: NextRequest,
  { params: _p }: { params: Promise<{ id: string }> }
) => {
  const params = await _p;
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new UnauthorizedError();

  const userId = SecurityValidation.validateId(params.id);
  if (!userId) throw new ValidationError("ID invalide");

  // SUPER_ADMIN ou permission explicite
  if (session.user.role !== 'SUPER_ADMIN') {
    const { checkPermission } = await import("@/lib/permissions");
    const hasPermission = await checkPermission(parseInt(session.user.id), 'users.hard-delete');
    if (!hasPermission) {
      throw new ForbiddenError("Seul un Super Admin peut supprimer définitivement un utilisateur");
    }
  }

  const existingUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!existingUser) throw new NotFoundError("Utilisateur non trouvé");

  // Security Rules:
  // 1. Ne pas se supprimer soi-même ici (utiliser une route dédiée ou bloquer)
  if (existingUser.id === parseInt(session.user.id)) {
    throw new ForbiddenError("Vous ne pouvez pas supprimer votre propre compte via cet API");
  }

  // 2. Ne pas supprimer un autre SUPER_ADMIN
  if (existingUser.role === 'SUPER_ADMIN') {
    throw new ForbiddenError("Impossible de supprimer un compte Super Admin");
  }

  await prisma.user.delete({ where: { id: userId } });

  return successResponse(null, "Utilisateur supprimé avec succès");
});

// Helper ConflictError si pas importé
class ConflictError extends ValidationError {
  constructor(message: string) {
    super(message);
    this.name = 'ConflictError';
  }
}