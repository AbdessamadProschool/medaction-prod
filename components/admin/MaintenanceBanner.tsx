'use client';

import { useMaintenanceMode } from '@/components/providers/MaintenanceProvider';
import { useSession } from 'next-auth/react';
import { AlertTriangle, X } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';

/**
 * Bandeau d'avertissement affiché aux admins quand le mode maintenance est actif
 * Reste visible en haut de page pour rappeler que le site est en maintenance
 */
export function MaintenanceBanner() {
  const { isMaintenanceMode, isLoading } = useMaintenanceMode();
  const { data: session } = useSession();
  const [dismissed, setDismissed] = useState(false);

  // Ne rien afficher si pas en maintenance, en chargement, ou si l'utilisateur l'a fermé
  if (isLoading || !isMaintenanceMode || dismissed) {
    return null;
  }

  // Seulement visible pour les admins
  const isAdmin = session?.user?.role && ['ADMIN', 'SUPER_ADMIN'].includes(session.user.role);
  if (!isAdmin) {
    return null;
  }

  return (
    <div className="sticky top-0 z-50 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 text-white px-4 py-2.5 shadow-lg">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 bg-white/20 rounded-full">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <span className="font-semibold">Mode Maintenance Actif</span>
            <span className="hidden sm:inline text-white/80 ml-2">
              — Les visiteurs voient la page de maintenance
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Link
            href="/super-admin/settings"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
          >
            Désactiver
          </Link>
          <button
            onClick={() => setDismissed(true)}
            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
            aria-label="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
