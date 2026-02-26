'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { Building2 } from 'lucide-react';

/**
 * Cette page redirige vers la liste des établissements
 * filtrée par la commune de l'utilisateur autorité locale
 */
export default function EtablissementRedirectPage() {
  const router = useRouter();
  const locale = useLocale();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Récupérer les informations de la commune de l'utilisateur
    const fetchAndRedirect = async () => {
      try {
        const res = await fetch('/api/autorite/mon-etablissement');
        const data = await res.json();
        
        if (data.data && data.data.id) {
          // Rediriger vers la page des établissements avec le filtre commune
          router.replace(`/${locale}/etablissements?communeId=${data.data.id}`);
        } else {
          // Si pas de commune associée, rediriger vers la liste générale
          router.replace(`/${locale}/etablissements`);
        }
      } catch (err) {
        console.error('Erreur lors de la récupération de la commune:', err);
        setError('Erreur lors de la récupération des données');
        // Fallback: rediriger vers la liste générale après 2 secondes
        setTimeout(() => {
          router.replace(`/${locale}/etablissements`);
        }, 2000);
      } finally {
        setLoading(false);
      }
    };

    fetchAndRedirect();
  }, [router, locale]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
          <Building2 className="w-8 h-8 text-red-500" />
        </div>
        <p className="text-red-600 font-medium mb-2">{error}</p>
        <p className="text-gray-500 text-sm">Redirection en cours...</p>
      </div>
    );
  }

  // Afficher un loader pendant la redirection
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px]">
      <div className="relative">
        <div className="w-14 h-14 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Building2 className="w-6 h-6 text-blue-600" />
        </div>
      </div>
      <p className="mt-4 text-gray-500 text-sm font-medium">
        {locale === 'ar' ? 'جاري التحميل...' : 'Chargement...'}
      </p>
    </div>
  );
}
