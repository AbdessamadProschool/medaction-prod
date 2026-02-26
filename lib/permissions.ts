// Configuration et utilitaires pour le système de permissions RBAC
import { prisma } from '@/lib/db';
import { 
  PermissionCode, 
  ROLE_DEFAULT_PERMISSIONS 
} from './permissions-types';

export * from './permissions-types';

// --- FONCTIONS UTILITAIRES ---

/**
 * Récupère les permissions explicites (DB) d'un utilisateur.
 */
export async function getUserPermissions(userId: number): Promise<PermissionCode[]> {
  const userPermissions = await prisma.userPermission.findMany({
    where: {
      userId,
      isActive: true,
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } }
      ]
    },
    include: {
      permission: {
        select: { code: true, isActive: true }
      }
    }
  });

  return userPermissions
    .filter(up => up.permission.isActive)
    .map(up => up.permission.code as PermissionCode);
}

/**
 * Récupère TOUTES les permissions effectives (DB + Defaults du rôle)
 * Utilisé par l'API pour le frontend.
 */
export async function getEffectiveUserPermissions(userId: number): Promise<PermissionCode[]> {
  // 1. Récupérer le rôle et les perms DB
  const [user, dbPermissions] = await Promise.all([
    prisma.user.findUnique({ 
      where: { id: userId }, 
      select: { role: true } 
    }),
    getUserPermissions(userId)
  ]);

  if (!user) return [];

  // 2. Permissions implicites du rôle
  const rolePermissions = ROLE_DEFAULT_PERMISSIONS[user.role] || [];

  // 3. Fusionner et dédupliquer
  return Array.from(new Set([...rolePermissions, ...dbPermissions]));
}

/**
 * Vérifie une permission en tenant compte :
 * 1. Super Admin (Bypass)
 * 2. Permissions explicites (DB)
 * 3. Rôles par défaut (Fallback si pas en DB)
 */
export async function checkPermission(userId: number, permissionCode: PermissionCode): Promise<boolean> {
  const user = await prisma.user.findUnique({ 
    where: { id: userId },
    select: { role: true }
  });

  if (!user) return false;

  // 1. Super Admin Bypass
  if (user.role === 'SUPER_ADMIN') return true;

  // 2. Check DB (UserPermission)
  const count = await prisma.userPermission.count({
    where: {
      userId,
      isActive: true,
      permission: {
        code: permissionCode,
        isActive: true
      },
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } }
      ]
    }
  });

  if (count > 0) return true;

  // 3. Check Role Default Permissions (Implicit)
  const rolePermissions = ROLE_DEFAULT_PERMISSIONS[user.role] || [];
  if (rolePermissions.includes(permissionCode)) return true;
  


  return false;
}

/**
 * Accorder des permissions à un utilisateur (DB)
 */
export async function grantPermissions(
  userId: number, 
  permissionCodes: string[], 
  grantedById?: number,
  expiresAt?: Date
): Promise<void> {
  const permissions = await prisma.permission.findMany({
    where: { code: { in: permissionCodes }, isActive: true },
    select: { id: true, code: true }
  });

  for (const permission of permissions) {
    await prisma.userPermission.upsert({
      where: {
        userId_permissionId: {
          userId,
          permissionId: permission.id
        }
      },
      update: {
        isActive: true,
        grantedById,
        grantedAt: new Date(),
        expiresAt,
      },
      create: {
        userId,
        permissionId: permission.id,
        grantedById,
        expiresAt,
        isActive: true,
      }
    });
  }
}

/**
 * Révoquer des permissions
 */
export async function revokePermissions(userId: number, permissionCodes: string[]): Promise<void> {
  const permissions = await prisma.permission.findMany({
    where: { code: { in: permissionCodes } },
    select: { id: true }
  });

  await prisma.userPermission.updateMany({
    where: {
      userId,
      permissionId: { in: permissions.map(p => p.id) }
    },
    data: { isActive: false }
  });
}

/**
 * Synchroniser (Remplacer)
 */
export async function syncPermissions(
  userId: number, 
  permissionCodes: string[], 
  grantedById?: number
): Promise<void> {
  await prisma.userPermission.updateMany({
    where: { userId },
    data: { isActive: false }
  });

  if (permissionCodes.length > 0) {
    await grantPermissions(userId, permissionCodes, grantedById);
  }
}

/**
 * Lister toutes les permissions (pour l'UI)
 */
export async function getAllPermissions() {
  const permissions = await prisma.permission.findMany({
    where: { isActive: true },
    orderBy: [
      { groupe: 'asc' },
      { ordre: 'asc' }
    ]
  });

  const grouped: Record<string, typeof permissions> = {};
  for (const perm of permissions) {
    if (!grouped[perm.groupeLabel]) {
      grouped[perm.groupeLabel] = [];
    }
    grouped[perm.groupeLabel].push(perm);
  }

  return { permissions, grouped };
}
