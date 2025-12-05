import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

/**
 * Type Role défini localement pour le Edge Runtime
 * (Le middleware ne peut pas importer depuis lib/)
 */
type Role = 
  | 'CITOYEN'
  | 'DELEGATION'
  | 'AUTORITE_LOCALE'
  | 'ADMIN'
  | 'SUPER_ADMIN'
  | 'GOUVERNEUR';

/**
 * Configuration des routes et leurs rôles autorisés
 */
const PROTECTED_ROUTES: Record<string, Role[]> = {
  // Routes accessibles uniquement aux citoyens connectés
  '/mes-reclamations': ['CITOYEN', 'DELEGATION', 'AUTORITE_LOCALE', 'ADMIN', 'SUPER_ADMIN', 'GOUVERNEUR'],
  '/reclamations/nouvelle': ['CITOYEN', 'DELEGATION', 'AUTORITE_LOCALE', 'ADMIN', 'SUPER_ADMIN', 'GOUVERNEUR'],
  '/mes-suggestions': ['CITOYEN', 'DELEGATION', 'AUTORITE_LOCALE', 'ADMIN', 'SUPER_ADMIN', 'GOUVERNEUR'],
  '/mon-profil': ['CITOYEN', 'DELEGATION', 'AUTORITE_LOCALE', 'ADMIN', 'SUPER_ADMIN', 'GOUVERNEUR'],
  '/profil': ['CITOYEN', 'DELEGATION', 'AUTORITE_LOCALE', 'ADMIN', 'SUPER_ADMIN', 'GOUVERNEUR'],
  
  // Routes DELEGATION (Responsable secteur)
  '/delegation': ['DELEGATION', 'ADMIN', 'SUPER_ADMIN'],
  '/delegation/evenements': ['DELEGATION', 'ADMIN', 'SUPER_ADMIN'],
  '/delegation/actualites': ['DELEGATION', 'ADMIN', 'SUPER_ADMIN'],
  '/delegation/articles': ['DELEGATION', 'ADMIN', 'SUPER_ADMIN'],
  '/delegation/campagnes': ['DELEGATION', 'ADMIN', 'SUPER_ADMIN'],
  
  // Routes AUTORITE_LOCALE (Gestionnaire établissement)
  '/autorite': ['AUTORITE_LOCALE', 'ADMIN', 'SUPER_ADMIN'],
  '/autorite/reclamations': ['AUTORITE_LOCALE', 'ADMIN', 'SUPER_ADMIN'],
  '/autorite/etablissement': ['AUTORITE_LOCALE', 'ADMIN', 'SUPER_ADMIN'],
  
  // Routes ADMIN
  '/admin': ['ADMIN', 'SUPER_ADMIN'],
  '/admin/utilisateurs': ['ADMIN', 'SUPER_ADMIN'],
  '/admin/etablissements': ['ADMIN', 'SUPER_ADMIN'],
  '/admin/reclamations': ['ADMIN', 'SUPER_ADMIN'],
  '/admin/validation': ['ADMIN', 'SUPER_ADMIN'],
  '/admin/affectation': ['ADMIN', 'SUPER_ADMIN'],
  
  // Routes SUPER_ADMIN uniquement
  '/admin/gestion-admins': ['SUPER_ADMIN'],
  '/admin/parametres': ['SUPER_ADMIN'],
  
  // Routes GOUVERNEUR (lecture seule)
  '/gouverneur': ['GOUVERNEUR', 'SUPER_ADMIN'],
  '/gouverneur/tableau-de-bord': ['GOUVERNEUR', 'SUPER_ADMIN'],
  '/gouverneur/rapports': ['GOUVERNEUR', 'SUPER_ADMIN'],
};

/**
 * Routes publiques (pas de protection)
 */
const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/etablissements',
  '/evenements',
  '/actualites',
  '/articles',
  '/carte',
  '/a-propos',
  '/contact',
  '/acces-refuse',
  '/compte-desactive',
  '/api/auth',
];

/**
 * Vérifie si une route est publique
 */
function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

/**
 * Trouve les rôles autorisés pour une route
 */
function getAllowedRoles(pathname: string): Role[] | null {
  // Chercher une correspondance exacte d'abord
  if (PROTECTED_ROUTES[pathname]) {
    return PROTECTED_ROUTES[pathname];
  }

  // Chercher une correspondance par préfixe
  const matchingRoute = Object.keys(PROTECTED_ROUTES).find((route) =>
    pathname.startsWith(route)
  );

  return matchingRoute ? PROTECTED_ROUTES[matchingRoute] : null;
}

/**
 * Middleware d'authentification Next.js
 */
export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    // Routes publiques : pas de vérification
    if (isPublicRoute(pathname)) {
      return NextResponse.next();
    }

    // Si pas de token, rediriger vers login
    if (!token) {
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Vérifier si le compte est actif
    if (!token.isActive) {
      return NextResponse.redirect(new URL('/compte-desactive', req.url));
    }

    // Trouver les rôles autorisés pour cette route
    const allowedRoles = getAllowedRoles(pathname);

    // Si la route n'est pas dans la liste, autoriser si connecté
    if (!allowedRoles) {
      return NextResponse.next();
    }

    // Vérifier si le rôle de l'utilisateur est autorisé
    const userRole = token.role as Role;
    if (!allowedRoles.includes(userRole)) {
      return NextResponse.redirect(new URL('/acces-refuse', req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: () => {
        // On laisse passer toutes les requêtes pour gérer dans le middleware
        return true;
      },
    },
  }
);

/**
 * Configuration des routes à protéger
 */
export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public folder
     * - api/auth (NextAuth routes)
     */
    '/((?!_next/static|_next/image|favicon.ico|public|api/auth).*)',
  ],
};

