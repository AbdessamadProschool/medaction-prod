import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { checkPermission, PermissionCode } from '@/lib/permissions';
import { Role } from '@/lib/auth/types';

import { SystemLogger } from '@/lib/system-logger';
import { validateId } from '@/lib/security/validation';
import { ApiContext } from '@/lib/api-handler'; // MAJ-01: Unifié

type ApiHandler = (request: NextRequest, context: ApiContext) => Promise<Response> | Response;

/**
 * 🛡️ HOC (Higher-Order Component) pour protéger une Route API par une permission.
 */
export function withPermission(permission: PermissionCode, handler: ApiHandler) {
  return async (request: NextRequest, context: any = {}) => {
    try {
      // 1. Authentification
      const session = await getServerSession(authOptions);
      if (!session?.user) {
        return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
      }

      // 1.5 CSRF Validation for mutating requests
      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
        const origin = request.headers.get('origin');
        const host = request.headers.get('host') || request.headers.get('x-forwarded-host');
        if (origin) {
          const originHost = new URL(origin).host;
          if (originHost !== host) {
            return NextResponse.json({ error: 'CSRF Validation Failed' }, { status: 403 });
          }
        } else {
          const referer = request.headers.get('referer');
          if (referer) {
            const refererHost = new URL(referer).host;
            if (refererHost !== host) {
              return NextResponse.json({ error: 'CSRF Validation Failed' }, { status: 403 });
            }
          } else {
             // If both are missing, reject state-changing requests relying on cookies
             return NextResponse.json({ error: 'CSRF Validation Failed: Missing Origin and Referer' }, { status: 403 });
          }
        }
      }

      // 2. Validation de l'ID utilisateur (MAJ-02)
      const userId = validateId(session.user.id);
      if (!userId) {
        return NextResponse.json({ error: 'Session invalide' }, { status: 401 });
      }

      // 3. Bypass pour SUPER_ADMIN (a tous les droits)
      if (session.user.role === 'SUPER_ADMIN') {
        return handler(request, { ...context, session });
      }

      // 4. Vérification de la permission en base (CRIT-01: Protection contre NaN)
      const hasAccess = await checkPermission(userId, permission);

      if (!hasAccess) {
        return NextResponse.json(
          { 
            error: 'Permission refusée', 
            details: `La permission '${permission}' est requise pour cette action.` 
          }, 
          { status: 403 }
        );
      }

      // 5. Exécution du handler original avec la session injectée
      return handler(request, { ...context, session });

    } catch (error) {
      // MIN-01: Logging explicite sans interpolation de l'objet complet
      SystemLogger.error('api-guard', 'Erreur vérification permission', { 
        error: error instanceof Error ? error.message : String(error) 
      });
      return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
    }
  };
}

/**
 * 🛡️ HOC pour protéger une Route API par Rôle uniquement (moins granulaire).
 */
export function withRole(allowedRoles: Role[], handler: ApiHandler) {
  return async (request: NextRequest, context: any = {}) => {
    try {
      const session = await getServerSession(authOptions);
      if (!session?.user) {
        return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
      }

      // CSRF Validation for mutating requests
      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
        const origin = request.headers.get('origin');
        const host = request.headers.get('host') || request.headers.get('x-forwarded-host');
        if (origin) {
          const originHost = new URL(origin).host;
          if (originHost !== host) {
            return NextResponse.json({ error: 'CSRF Validation Failed' }, { status: 403 });
          }
        } else {
          const referer = request.headers.get('referer');
          if (referer) {
            const refererHost = new URL(referer).host;
            if (refererHost !== host) {
              return NextResponse.json({ error: 'CSRF Validation Failed' }, { status: 403 });
            }
          } else {
             return NextResponse.json({ error: 'CSRF Validation Failed: Missing Origin and Referer' }, { status: 403 });
          }
        }
      }

      if (!allowedRoles.includes(session.user.role as Role)) {
        return NextResponse.json({ error: 'Rôle insuffisant' }, { status: 403 });
      }

      // MAJ-01: Injection de la session pour la cohérence
      return handler(request, { ...context, session });
    } catch (error) {
       // MIN-02: Ajout try/catch symétrique
       SystemLogger.error('api-guard', 'Erreur withRole', {
         error: error instanceof Error ? error.message : String(error)
       });
       return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
    }
  };
}
