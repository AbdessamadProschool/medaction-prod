import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from './config';
import { Role, ROLE_HIERARCHY } from './types';

/**
 * Récupère la session côté serveur
 */
export async function getSession() {
  return getServerSession(authOptions);
}

/**
 * Vérifie si l'utilisateur est authentifié
 */
export async function isAuthenticated() {
  const session = await getSession();
  return !!session?.user;
}

/**
 * Récupère l'utilisateur courant ou null
 */
export async function getCurrentUser() {
  const session = await getSession();
  return session?.user ?? null;
}

/**
 * Vérifie si l'utilisateur a un rôle spécifique
 */
export async function hasRole(role: Role) {
  const session = await getSession();
  return session?.user?.role === role;
}

/**
 * Vérifie si l'utilisateur a au moins un des rôles spécifiés
 */
export async function hasAnyRole(roles: Role[]) {
  const session = await getSession();
  if (!session?.user?.role) return false;
  return roles.includes(session.user.role);
}

/**
 * Vérifie si l'utilisateur a un rôle supérieur ou égal
 */
export async function hasMinRole(minRole: Role) {
  const session = await getSession();
  if (!session?.user?.role) return false;
  const userRole = session.user.role as Role;
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[minRole];
}

/**
 * Guard qui retourne une erreur 401 si non authentifié
 */
export async function requireAuth() {
  const session = await getSession();

  if (!session?.user) {
    return {
      authorized: false,
      response: NextResponse.json(
        { success: false, message: 'Non authentifié' },
        { status: 401 }
      ),
    };
  }

  return {
    authorized: true,
    user: session.user,
  };
}

/**
 * Guard qui retourne une erreur 403 si le rôle n'est pas autorisé
 */
export async function requireRole(allowedRoles: Role[]) {
  const authResult = await requireAuth();

  if (!authResult.authorized) {
    return authResult;
  }

  if (!allowedRoles.includes(authResult.user!.role)) {
    return {
      authorized: false,
      response: NextResponse.json(
        { success: false, message: 'Accès non autorisé' },
        { status: 403 }
      ),
    };
  }

  return {
    authorized: true,
    user: authResult.user,
  };
}

/**
 * Guard qui vérifie le rôle minimum requis
 */
export async function requireMinRole(minRole: Role) {
  const authResult = await requireAuth();

  if (!authResult.authorized) {
    return authResult;
  }

  const userRole = authResult.user!.role as Role;
  if (ROLE_HIERARCHY[userRole] < ROLE_HIERARCHY[minRole]) {
    return {
      authorized: false,
      response: NextResponse.json(
        { success: false, message: 'Niveau d\'accès insuffisant' },
        { status: 403 }
      ),
    };
  }

  return {
    authorized: true,
    user: authResult.user,
  };
}

// =============================================
// GUARDS SPÉCIFIQUES PAR RÔLE
// =============================================

/**
 * Guard pour les citoyens (tous les utilisateurs connectés)
 */
export async function requireCitoyen() {
  return requireAuth();
}

/**
 * Guard pour les délégations (responsables secteur)
 */
export async function requireDelegation() {
  return requireRole(['DELEGATION', 'ADMIN', 'SUPER_ADMIN']);
}

/**
 * Guard pour les autorités locales (gestionnaires établissement)
 */
export async function requireAutoriteLocale() {
  return requireRole(['AUTORITE_LOCALE', 'ADMIN', 'SUPER_ADMIN']);
}

/**
 * Guard pour les administrateurs
 */
export async function requireAdmin() {
  return requireRole(['ADMIN', 'SUPER_ADMIN']);
}

/**
 * Guard pour le gouverneur
 */
export async function requireGouverneur() {
  return requireRole(['GOUVERNEUR', 'SUPER_ADMIN']);
}

/**
 * Guard pour les super administrateurs uniquement
 */
export async function requireSuperAdmin() {
  return requireRole(['SUPER_ADMIN']);
}
