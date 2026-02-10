'use client';

import { useEffect, useState, ReactNode } from 'react';
import { useTranslations } from 'next-intl';

interface LicenseProviderProps {
  children: ReactNode;
}

interface LicenseStatus {
  valid: boolean;
  error?: string;
  daysRemaining?: number;
}

export function LicenseProvider({ children }: LicenseProviderProps) {
  const t = useTranslations('license');
  const [licenseStatus, setLicenseStatus] = useState<LicenseStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkLicense = async () => {
      try {
        const res = await fetch('/api/license/check');
        const data = await res.json();
        setLicenseStatus(data);
      } catch (error) {
        console.error('Erreur vérification licence:', error);
        // En cas d'erreur de connexion, on autorise (pour ne pas bloquer en dev)
        setLicenseStatus({ valid: true });
      } finally {
        setLoading(false);
      }
    };

    checkLicense();
  }, []);

  // Chargement
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[hsl(213,80%,28%)] mx-auto mb-4"></div>
          <p className="text-gray-500">{t('checking')}</p>
        </div>
      </div>
    );
  }

  // Licence invalide
  if (licenseStatus && !licenseStatus.valid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 p-8">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-lg w-full text-center border border-red-100">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('invalid_title')}</h1>
          <p className="text-gray-600 mb-6">
            {licenseStatus.error || t('default_error')}
          </p>
          <div className="bg-gray-50 rounded-lg p-4 text-left">
            <p className="text-sm text-gray-500 mb-2">{t('help_intro')}</p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• {t('help_contact')}</li>
              <li>• {t('help_env')}</li>
              <li>• {t('help_domain')}</li>
            </ul>
          </div>
          <p className="text-xs text-gray-400 mt-6">
            {t('copyright')}
          </p>
        </div>
      </div>
    );
  }

  // Avertissement si licence expire bientôt (moins de 30 jours)
  if (licenseStatus?.daysRemaining && licenseStatus.daysRemaining <= 30) {
    // Afficher un bandeau d'avertissement mais laisser l'accès
    return (
      <>
        <div className="bg-orange-500 text-white text-center py-2 px-4 text-sm">
          {t('warning_expiry', { days: licenseStatus.daysRemaining })}
        </div>
        {children}
      </>
    );
  }

  // Licence valide
  return <>{children}</>;
}

export default LicenseProvider;
