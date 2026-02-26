/**
 * Types d'authentification pour MedAction
 * Définis localement pour compatibilité avec Prisma v7
 */

// ============================================
// ENUMS (miroir du schema.prisma)
// ============================================

/**
 * Rôles utilisateur dans l'application
 */
export type Role = 
  | 'CITOYEN'
  | 'DELEGATION'
  | 'AUTORITE_LOCALE'
  | 'ADMIN'
  | 'SUPER_ADMIN'
  | 'GOUVERNEUR'
  | 'COORDINATEUR_ACTIVITES';

/**
 * Secteurs d'activité
 */
export type Secteur = 
  | 'EDUCATION'
  | 'SANTE'
  | 'SPORT'
  | 'SOCIAL'
  | 'CULTUREL'
  | 'AUTRE';

// ============================================
// INTERFACES UTILISATEUR
// ============================================

/**
 * Extension du type User de NextAuth pour inclure les champs personnalisés
 */
export interface AuthUser {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  role: Role;
  photo?: string | null;
  secteurResponsable?: Secteur | null;
  communeResponsableId?: number | null;  // Pour AUTORITE_LOCALE
  etablissementsGeres?: number[];        // Pour COORDINATEUR_ACTIVITES
  isActive: boolean;
  isEmailVerifie: boolean;
}

/**
 * Extension du type JWT de NextAuth
 */
export interface AuthToken {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  role: Role;
  photo?: string | null;
  secteurResponsable?: Secteur | null;
  communeResponsableId?: number | null;
  etablissementsGeres?: number[];
  isActive: boolean;
  isEmailVerifie: boolean;
  iat?: number;
  exp?: number;
  jti?: string;
}

/**
 * Extension du type Session de NextAuth
 */
export interface AuthSession {
  user: AuthUser;
  expires: string;
}

// ============================================
// CONSTANTES
// ============================================

/**
 * Rôles disponibles dans l'application
 */
export const ROLES = {
  CITOYEN: 'CITOYEN',
  DELEGATION: 'DELEGATION',
  AUTORITE_LOCALE: 'AUTORITE_LOCALE',
  ADMIN: 'ADMIN',
  SUPER_ADMIN: 'SUPER_ADMIN',
  GOUVERNEUR: 'GOUVERNEUR',
  COORDINATEUR_ACTIVITES: 'COORDINATEUR_ACTIVITES',
} as const;

/**
 * Hiérarchie des rôles (du plus bas au plus élevé)
 */
export const ROLE_HIERARCHY: Record<Role, number> = {
  CITOYEN: 1,
  DELEGATION: 2,
  COORDINATEUR_ACTIVITES: 3,
  AUTORITE_LOCALE: 4,
  ADMIN: 5,
  GOUVERNEUR: 6,
  SUPER_ADMIN: 7,
};

/**
 * Vérifie si un rôle a au moins le niveau requis
 */
export function hasMinimumRole(userRole: Role, requiredRole: Role): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}
