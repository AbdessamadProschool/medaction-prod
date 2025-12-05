'use client';

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';

interface SessionProviderProps {
  children: ReactNode;
}

/**
 * Provider de session NextAuth pour les composants client
 * Wrap l'application pour accéder à useSession() dans les composants
 */
export function SessionProvider({ children }: SessionProviderProps) {
  return (
    <NextAuthSessionProvider
      // Rafraîchir la session toutes les 5 minutes
      refetchInterval={5 * 60}
      // Rafraîchir quand la fenêtre redevient active
      refetchOnWindowFocus={true}
    >
      {children}
    </NextAuthSessionProvider>
  );
}
