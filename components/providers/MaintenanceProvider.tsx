'use client';

import { useEffect, useState, createContext, useContext, ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';
import LoadingScreen from '@/components/ui/LoadingScreen';

interface MaintenanceContextType {
  isMaintenanceMode: boolean;
  isLoading: boolean;
  siteName: string;
}

const MaintenanceContext = createContext<MaintenanceContextType>({
  isMaintenanceMode: false,
  isLoading: true,
  siteName: 'Portail Mediouna',
});

export function useMaintenanceMode() {
  return useContext(MaintenanceContext);
}

// Routes qui ne sont pas affectées par le mode maintenance
const EXCLUDED_PATHS = [
  '/maintenance',
  '/login',
  '/api',
  '/admin',
  '/super-admin',
  '/_next',
  '/favicon.ico',
];

// Rôles qui peuvent accéder au site en mode maintenance
const ADMIN_ROLES = ['ADMIN', 'SUPER_ADMIN'];

interface Props {
  children: ReactNode;
}

export function MaintenanceProvider({ children }: Props) {
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [siteName, setSiteName] = useState('Portail Mediouna');
  
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  // Vérifier si le chemin est exclu
  const isExcludedPath = EXCLUDED_PATHS.some(path => pathname?.startsWith(path));

  // L'utilisateur est-il admin ?
  const isAdmin = session?.user?.role && ADMIN_ROLES.includes(session.user.role);

  useEffect(() => {
    const checkMaintenance = async () => {
      try {
        const res = await fetch('/api/maintenance');
        if (res.ok) {
          const data = await res.json();
          setIsMaintenanceMode(data.maintenanceMode);
          setSiteName(data.siteName || 'Portail Mediouna');
        }
      } catch (error) {
        console.error('Erreur vérification maintenance:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkMaintenance();
    
    // Revérifier périodiquement (toutes les 5 minutes)
    const interval = setInterval(checkMaintenance, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Rediriger vers la page de maintenance si nécessaire
    if (!isLoading && isMaintenanceMode && !isExcludedPath && !isAdmin && status !== 'loading') {
      router.push('/maintenance');
    }
  }, [isMaintenanceMode, isLoading, isExcludedPath, isAdmin, status, router, pathname]);

  // Si en mode maintenance et pas admin, ne pas afficher le contenu
  if (!isLoading && isMaintenanceMode && !isExcludedPath && !isAdmin) {
    return null; // Le useEffect redirigera
  }

  // Éviter le flash de contenu : ne rien afficher tant qu'on charge (sauf sur les pages exclues/login)
  // On permet l'affichage immédiat seulement pour les pages purement publiques ou login pour la perf
  if (isLoading && !isExcludedPath) {
    return <LoadingScreen message="Vérification du système..." />;
  }

  return (
    <MaintenanceContext.Provider value={{ isMaintenanceMode, isLoading, siteName }}>
      {children}
    </MaintenanceContext.Provider>
  );
}
