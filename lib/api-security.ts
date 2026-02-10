/**
 * ════════════════════════════════════════════════════════════════════════════
 * UTILITAIRE DE SÉCURITÉ API - MEDACTION
 * ════════════════════════════════════════════════════════════════════════════
 * 
 * Fournit des fonctions pour sécuriser les routes API:
 * - Authentification obligatoire
 * - Contrôle d'accès basé sur les rôles (RBAC)
 * - Validation des tokens JWT
 * - Rate limiting
 * - Audit logging
 * 
 * Standards: OWASP API Security Top 10 2023
 * ════════════════════════════════════════════════════════════════════════════
 */

import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

export type Role = 
  | 'CITOYEN'
  | 'DELEGATION'
  | 'AUTORITE_LOCALE'
  | 'COORDINATEUR_ACTIVITES'
  | 'ADMIN'
  | 'SUPER_ADMIN'
  | 'GOUVERNEUR';

export interface AuthenticatedUser {
  id: number;
  email: string;
  role: Role;
  isActive: boolean;
  name?: string | null;
}

export interface ApiContext {
  user: AuthenticatedUser;
  requestId: string;
  clientIP: string;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    timestamp: string;
    requestId?: string;
  };
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: {
    requestId: string;
    timestamp: string;
  };
}

// ═══════════════════════════════════════════════════════════════════
// CONSTANTES
// ═══════════════════════════════════════════════════════════════════

const ERROR_CODES = {
  AUTHENTICATION_REQUIRED: 'AUTHENTICATION_REQUIRED',
  INVALID_TOKEN: 'INVALID_TOKEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  ACCESS_DENIED: 'ACCESS_DENIED',
  ACCOUNT_DEACTIVATED: 'ACCOUNT_DEACTIVATED',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  INVALID_REQUEST: 'INVALID_REQUEST',
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

// ═══════════════════════════════════════════════════════════════════
// FONCTIONS UTILITAIRES
// ═══════════════════════════════════════════════════════════════════

/**
 * Génère un ID de requête unique
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Extrait l'IP du client
 */
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  return 'unknown';
}

/**
 * Crée une réponse d'erreur standardisée
 */
export function createErrorResponse(
  status: number,
  code: string,
  message: string,
  requestId?: string
): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
        timestamp: new Date().toISOString(),
        requestId,
      },
    },
    { status }
  );
}

/**
 * Crée une réponse de succès standardisée
 */
export function createSuccessResponse<T>(
  data: T,
  requestId: string,
  status: number = 200
): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      meta: {
        requestId,
        timestamp: new Date().toISOString(),
      },
    },
    { status }
  );
}

// ═══════════════════════════════════════════════════════════════════
// MIDDLEWARE D'AUTHENTIFICATION
// ═══════════════════════════════════════════════════════════════════

/**
 * Vérifie l'authentification et retourne l'utilisateur
 */
export async function requireAuth(
  request: NextRequest
): Promise<{ user: AuthenticatedUser; requestId: string; clientIP: string } | NextResponse> {
  const requestId = generateRequestId();
  const clientIP = getClientIP(request);
  
  try {
    // Récupérer la session
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return createErrorResponse(
        401,
        ERROR_CODES.AUTHENTICATION_REQUIRED,
        'Authentication required. Please provide a valid access token.',
        requestId
      );
    }
    
    // Vérifier que l'utilisateur existe et est actif
    const sessionUserId = session.user.id;
    const userId: number = typeof sessionUserId === 'string' 
      ? parseInt(sessionUserId, 10) 
      : (sessionUserId as number);
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        nom: true,
        prenom: true,
      },
    });
    
    if (!user) {
      return createErrorResponse(
        401,
        ERROR_CODES.INVALID_TOKEN,
        'User not found. Token may be invalid.',
        requestId
      );
    }
    
    if (!user.isActive) {
      return createErrorResponse(
        403,
        ERROR_CODES.ACCOUNT_DEACTIVATED,
        'Your account has been deactivated. Please contact support.',
        requestId
      );
    }
    
    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role as Role,
        isActive: user.isActive,
        name: `${user.prenom} ${user.nom}`,
      },
      requestId,
      clientIP,
    };
  } catch (error) {
    console.error('[Security] Auth error:', error);
    return createErrorResponse(
      500,
      ERROR_CODES.INTERNAL_ERROR,
      'An error occurred during authentication.',
      requestId
    );
  }
}

// ═══════════════════════════════════════════════════════════════════
// CONTRÔLE D'ACCÈS BASÉ SUR LES RÔLES (RBAC)
// ═══════════════════════════════════════════════════════════════════

/**
 * Vérifie que l'utilisateur a l'un des rôles autorisés
 */
export async function requireRoles(
  request: NextRequest,
  allowedRoles: Role[]
): Promise<ApiContext | NextResponse> {
  const authResult = await requireAuth(request);
  
  // Si c'est une réponse d'erreur, la retourner directement
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  
  const { user, requestId, clientIP } = authResult;
  
  // Vérifier le rôle
  if (!allowedRoles.includes(user.role)) {
    return createErrorResponse(
      403,
      ERROR_CODES.ACCESS_DENIED,
      `Access denied. Required roles: ${allowedRoles.join(', ')}. Your role: ${user.role}`,
      requestId
    );
  }
  
  return { user, requestId, clientIP };
}

/**
 * Raccourci pour les routes admin uniquement
 */
export async function requireAdmin(request: NextRequest): Promise<ApiContext | NextResponse> {
  return requireRoles(request, ['ADMIN', 'SUPER_ADMIN']);
}

/**
 * Raccourci pour les routes super admin uniquement
 */
export async function requireSuperAdmin(request: NextRequest): Promise<ApiContext | NextResponse> {
  return requireRoles(request, ['SUPER_ADMIN']);
}

/**
 * Raccourci pour les routes gouverneur
 */
export async function requireGouverneur(request: NextRequest): Promise<ApiContext | NextResponse> {
  return requireRoles(request, ['GOUVERNEUR', 'SUPER_ADMIN']);
}

// ═══════════════════════════════════════════════════════════════════
// VÉRIFICATION DE PROPRIÉTÉ DES RESSOURCES (IDOR Prevention)
// ═══════════════════════════════════════════════════════════════════

/**
 * Vérifie que l'utilisateur est propriétaire de la ressource ou admin
 */
export async function requireOwnershipOrAdmin(
  request: NextRequest,
  resourceOwnerId: string
): Promise<ApiContext | NextResponse> {
  const authResult = await requireAuth(request);
  
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  
  const { user, requestId, clientIP } = authResult;
  
  // Les admins peuvent accéder à toutes les ressources
  if (['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
    return { user, requestId, clientIP };
  }
  
  // Vérifier la propriété
  if (String(user.id) !== resourceOwnerId) {
    return createErrorResponse(
      403,
      ERROR_CODES.ACCESS_DENIED,
      'You do not have permission to access this resource.',
      requestId
    );
  }
  
  return { user, requestId, clientIP };
}

// ═══════════════════════════════════════════════════════════════════
// AUDIT LOGGING
// ═══════════════════════════════════════════════════════════════════

/**
 * Log une action de sécurité
 */
export async function logSecurityEvent(
  action: string,
  userId: number | null,
  details: Record<string, unknown>,
  clientIP: string,
  requestId: string
): Promise<void> {
  try {
    await prisma.activityLog.create({
      data: {
        action,
        userId,
        entity: 'SECURITY',
        details: {
          ...details,
          requestId,
          clientIP,
          timestamp: new Date().toISOString(),
        },
        ipAddress: clientIP,
      },
    });
  } catch (error) {
    // Ne pas bloquer la requête si le log échoue
    console.error('[Security] Audit log error:', error);
  }
}


// ═══════════════════════════════════════════════════════════════════
// VALIDATION DES ENTRÉES
// ═══════════════════════════════════════════════════════════════════

/**
 * Valide et sanitize un ID (prévient injection)
 */
export function validateId(id: unknown): string | null {
  if (typeof id !== 'string') return null;
  
  // UUID v4 pattern
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  
  // Integer pattern
  const intPattern = /^\d+$/;
  
  if (uuidPattern.test(id) || intPattern.test(id)) {
    return id;
  }
  
  return null;
}

/**
 * Valide une pagination
 */
export function validatePagination(
  page: unknown,
  limit: unknown
): { page: number; limit: number } {
  const parsedPage = typeof page === 'string' ? parseInt(page, 10) : 1;
  const parsedLimit = typeof limit === 'string' ? parseInt(limit, 10) : 10;
  
  return {
    page: isNaN(parsedPage) || parsedPage < 1 ? 1 : parsedPage,
    limit: isNaN(parsedLimit) || parsedLimit < 1 ? 10 : Math.min(parsedLimit, 100),
  };
}

// ═══════════════════════════════════════════════════════════════════
// HELPER POUR LES ROUTES API
// ═══════════════════════════════════════════════════════════════════

/**
 * Wrapper pour les routes API avec gestion d'erreurs
 */
export function withApiSecurity<T>(
  handler: (context: ApiContext, request: NextRequest) => Promise<NextResponse<T>>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const authResult = await requireAuth(request);
    
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    
    try {
      return await handler(authResult, request);
    } catch (error) {
      console.error('[API Error]:', error);
      return createErrorResponse(
        500,
        ERROR_CODES.INTERNAL_ERROR,
        'An unexpected error occurred.',
        authResult.requestId
      );
    }
  };
}

/**
 * Wrapper pour les routes API avec RBAC
 */
export function withRoles<T>(
  allowedRoles: Role[],
  handler: (context: ApiContext, request: NextRequest) => Promise<NextResponse<T>>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const authResult = await requireRoles(request, allowedRoles);
    
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    
    try {
      return await handler(authResult, request);
    } catch (error) {
      console.error('[API Error]:', error);
      return createErrorResponse(
        500,
        ERROR_CODES.INTERNAL_ERROR,
        'An unexpected error occurred.',
        authResult.requestId
      );
    }
  };
}
