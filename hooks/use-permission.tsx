'use client';

import { useSession } from 'next-auth/react';
import { PermissionCode } from '@/lib/permissions';
import { ReactNode } from 'react';

/**
 * 🛡️ Hook pour vérifier les permissions côté client.
 * Note: Les permissions doivent être disponibles dans la session utilisateur.
 * Si elles ne le sont pas (car pas encore ajoutées au JWT), on peut faire un fetch.
 * 
 * Pour l'instant, comme nous n'avons pas modifié le callback JWT pour inclure 
 * 'permissions' (lourd), nous allons faire une vérification via une API ou 
 * assumer que le frontend a chargé les permissions au login.
 * 
 * SOLUTION ROBUSTE: Créer un Provider React qui charge les permissions au démarrage.
 */

// Interface pour le hook (à implémenter avec un Provider)
// Pour l'instant, version simplifiée qui utilise le rôle comme proxy ou un appel API.
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function usePermission() {
  const { data: session } = useSession();
  const userId = session?.user?.id;

  // Récupérer les permissions de l'utilisateur connecté via SWR (cache + revalidation)
  // On ne fetch que si on est connecté et pas SUPER_ADMIN (qui a tout)
  const shouldFetch = userId && session?.user?.role !== 'SUPER_ADMIN';
  
  const { data, error, isLoading } = useSWR(
    shouldFetch ? `/api/users/${userId}/permissions` : null,
    fetcher
  );

  const userPermissions: string[] = data?.permissions || [];
  const isSuperAdmin = session?.user?.role === 'SUPER_ADMIN';

  /**
   * Vérifie une seule permission
   */
  const can = (permission: PermissionCode): boolean => {
    if (!session) return false;
    if (isSuperAdmin) return true;
    return userPermissions.includes(permission);
  };

  /**
   * Vérifie si l'utilisateur a TOUTES les permissions
   */
  const canAll = (permissions: PermissionCode[]): boolean => {
    if (!session) return false;
    if (isSuperAdmin) return true;
    return permissions.every(p => userPermissions.includes(p));
  };

  /**
   * Vérifie si l'utilisateur a AU MOINS UNE des permissions
   */
  const canAny = (permissions: PermissionCode[]): boolean => {
    if (!session) return false;
    if (isSuperAdmin) return true;
    return permissions.some(p => userPermissions.includes(p));
  };

  return {
    can,
    canAll,
    canAny,
    isLoading: shouldFetch ? isLoading : false,
    isSuperAdmin
  };
}

/**
 * 🛡️ Composant Guard pour afficher/masquer du contenu selon les permissions
 */
interface PermissionGuardProps {
  permission: PermissionCode | PermissionCode[];
  requireAll?: boolean; // Si plusieurs perms, faut-il toutes les avoir ? (defaut: false -> OR)
  children: ReactNode;
  fallback?: ReactNode; // Contenu à afficher si refusé (ex: null ou message d'erreur)
}

export function PermissionGuard({ 
  permission, 
  requireAll = false, 
  children, 
  fallback = null 
}: PermissionGuardProps) {
  const { can, canAll, canAny, isLoading, isSuperAdmin } = usePermission();

  if (isLoading) return null; // Ou un skeleton ?

  if (isSuperAdmin) return <>{children}</>;

  const permissions = Array.isArray(permission) ? permission : [permission];
  const hasAccess = requireAll ? canAll(permissions) : canAny(permissions);

  if (hasAccess) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}
