import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { syncPermissions, getUserPermissions, getAllPermissions } from '@/lib/permissions';
import { withErrorHandler, successResponse } from '@/lib/api-handler';
import { UnauthorizedError, ForbiddenError, ValidationError, NotFoundError } from '@/lib/exceptions';
import { ActivityLogger } from '@/lib/activity-logger';

// Schéma de validation pour update permissions
const updatePermissionsSchema = z.object({
  permissions: z.array(z.string()),
});

// PATCH - Mettre à jour les permissions d'un admin
export const PATCH = withErrorHandler(async (
  request: NextRequest,
  { params: _p }: { params: Promise<{ id: string }> }
) => {
  const params = await _p;
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    throw new UnauthorizedError('Non authentifié');
  }

  // Seul SUPER_ADMIN peut modifier les permissions
  if (session.user.role !== 'SUPER_ADMIN') {
    throw new ForbiddenError('Seul un Super Admin peut modifier les permissions');
  }

  const adminId = parseInt(params.id);
  if (isNaN(adminId)) {
    throw new ValidationError('ID invalide');
  }

  // Vérifier que l'admin existe
  const admin = await prisma.user.findUnique({
    where: { id: adminId },
    select: { id: true, role: true, nom: true, prenom: true, email: true }
  });

  if (!admin) {
    throw new NotFoundError('Administrateur non trouvé');
  }

  // Ne pas permettre la modification des permissions d'un SUPER_ADMIN
  if (admin.role === 'SUPER_ADMIN') {
    throw new ForbiddenError('Impossible de modifier les permissions d\'un Super Admin');
  }

  // Vérifier que c'est un ADMIN
  if (admin.role !== 'ADMIN') {
    throw new ValidationError('Cet utilisateur n\'est pas un administrateur');
  }

  // Valider les données
  const body = await request.json();
  const validation = updatePermissionsSchema.safeParse(body);

  if (!validation.success) {
    throw new ValidationError('Données invalides');
  }

  const { permissions: requestedPermissions } = validation.data;

  // Vérifier que les permissions existent en base
  const validPermissions = await prisma.permission.findMany({
    take: 100,
    where: { code: { in: requestedPermissions }, isActive: true },
    select: { code: true }
  });
  
  const validCodes = validPermissions.map(p => p.code);
  const invalidPermissions = requestedPermissions.filter(p => !validCodes.includes(p));
  
  if (invalidPermissions.length > 0) {
    throw new ValidationError(`Permissions invalides: ${invalidPermissions.join(', ')}`);
  }

  // Synchroniser les permissions
  await syncPermissions(adminId, validCodes, parseInt(session.user.id));

  // Log de l'activité
  await ActivityLogger.custom({
    action: 'UPDATE_PERMISSIONS',
    entity: 'User',
    entityId: adminId,
    details: {
      targetUser: `${admin.prenom} ${admin.nom}`,
      previousPermissions: await getUserPermissions(adminId),
      newPermissions: validCodes,
    },
    userId: parseInt(session.user.id)
  });

  // Créer une notification à l'admin concerné
  await prisma.notification.create({
    data: {
      userId: adminId,
      type: 'PERMISSIONS_MODIFIEES',
      titre: 'Permissions mises à jour',
      message: `Vos permissions ont été modifiées par ${session.user.prenom || ''} ${session.user.nom || ''}. Vous avez maintenant ${validCodes.length} permissions.`,
      lien: '/admin/profil',
    }
  });

  return successResponse({
    adminId,
    admin: `${admin.prenom} ${admin.nom}`,
    permissions: validCodes,
    count: validCodes.length,
  }, 'Permissions mises à jour avec succès');
});

// GET - Récupérer les permissions d'un admin
export const GET = withErrorHandler(async (
  request: NextRequest,
  { params: _p }: { params: Promise<{ id: string }> }
) => {
  const params = await _p;
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    throw new UnauthorizedError('Non authentifié');
  }

  if (session.user.role !== 'SUPER_ADMIN') {
    throw new ForbiddenError('Accès non autorisé');
  }

  const adminId = parseInt(params.id);
  if (isNaN(adminId)) {
    throw new ValidationError('ID invalide');
  }

  const admin = await prisma.user.findUnique({
    where: { id: adminId },
    select: { 
      id: true, 
      email: true,
      nom: true, 
      prenom: true, 
      role: true,
      isActive: true,
      userPermissions: {
        where: { isActive: true },
        include: {
          permission: true
        }
      }
    }
  });

  if (!admin) {
    throw new NotFoundError('Administrateur non trouvé');
  }

  // Récupérer toutes les permissions disponibles
  const { grouped: allPermissions } = await getAllPermissions();

  return successResponse({
    id: admin.id,
    email: admin.email,
    nom: admin.nom,
    prenom: admin.prenom,
    role: admin.role,
    isActive: admin.isActive,
    permissions: admin.userPermissions.map(up => up.permission.code),
    permissionsDetails: admin.userPermissions.map(up => ({
      code: up.permission.code,
      nom: up.permission.nom,
      groupe: up.permission.groupe,
      groupeLabel: up.permission.groupeLabel,
      grantedAt: up.grantedAt,
      expiresAt: up.expiresAt,
    })),
    allPermissions, // Pour afficher dans l'interface
  });
});