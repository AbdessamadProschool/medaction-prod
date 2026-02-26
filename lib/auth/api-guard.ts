import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { checkPermission, PermissionCode } from '@/lib/permissions';
import { Role } from '@/lib/auth/types';

// Types pour les gestionnaires d'API
type ApiHandler = (request: NextRequest, context?: any) => Promise<NextResponse> | NextResponse;

/**
 * 🛡️ HOC (Higher-Order Component) pour protéger une Route API par une permission.
 * Vérifie d'abord que l'utilisateur est authentifié, puis qu'il a la permission requise.
 * Les SUPER_ADMIN ont toujours accès.
 */
export function withPermission(permission: PermissionCode, handler: ApiHandler) {
  return async (request: NextRequest, context?: any) => {
    try {
      // 1. Authentification
      const session = await getServerSession(authOptions);
      if (!session?.user) {
        return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
      }

      // 2. Bypass pour SUPER_ADMIN (a tous les droits)
      if (session.user.role === 'SUPER_ADMIN') {
        return handler(request, context);
      }

      // 3. Vérification de la permission en base
      const hasAccess = await checkPermission(parseInt(session.user.id), permission);

      if (!hasAccess) {
        return NextResponse.json(
          { 
            error: 'Permission refusée', 
            details: `La permission '${permission}' est requise pour cette action.` 
          }, 
          { status: 403 }
        );
      }

      // 4. Exécution du handler original
      return handler(request, context);

    } catch (error) {
      console.error('Erreur API Guard:', error);
      return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
    }
  };
}

/**
 * 🛡️ HOC pour protéger une Route API par Rôle uniquement (moins granulaire).
 */
export function withRole(allowedRoles: Role[], handler: ApiHandler) {
  return async (request: NextRequest, context?: any) => {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    if (!allowedRoles.includes(session.user.role as Role)) {
      return NextResponse.json({ error: 'Rôle insuffisant' }, { status: 403 });
    }

    return handler(request, context);
  };
}
