'use client';

import { useState, useEffect } from 'react';
import { KeyRound, Shield, Calendar, Globe, AlertTriangle, Check, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

interface LicenseInfo {
  valid: boolean;
  error?: string;
  daysRemaining?: number;
  key?: string;
  domains?: string[];
  expiryDate?: string;
}

export default function LicensePage() {
  const [license, setLicense] = useState<LicenseInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const t = useTranslations();

  const fetchLicenseInfo = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/license');
      if (res.ok) {
        const data = await res.json();
        setLicense(data);
      } else {
        toast.error(t('licence_page.toasts.fetch_error'));
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error(t('licence_page.toasts.connection_error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLicenseInfo();
  }, []);

  const getStatusColor = () => {
    if (!license) return 'bg-gray-100 text-gray-600';
    if (!license.valid) return 'bg-red-100 text-red-700';
    if (license.daysRemaining && license.daysRemaining <= 30) return 'bg-orange-100 text-orange-700';
    return 'bg-green-100 text-green-700';
  };

  const getStatusText = () => {
    if (!license) return t('licence_page.status.loading');
    if (!license.valid) return t('licence_page.status.invalid');
    if (license.daysRemaining && license.daysRemaining <= 30) return t('licence_page.status.expires_soon');
    return t('licence_page.status.active');
  };

  const getStatusIcon = () => {
    if (!license) return <RefreshCw className="w-5 h-5 animate-spin" />;
    if (!license.valid) return <AlertTriangle className="w-5 h-5" />;
    return <Check className="w-5 h-5" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <KeyRound className="w-8 h-8 text-[hsl(213,80%,28%)]" />
            {t('licence_page.title')}
          </h1>
          <p className="text-gray-500 mt-1">{t('licence_page.subtitle')}</p>
        </div>
        <button
          onClick={fetchLicenseInfo}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {t('licence_page.refresh')}
        </button>
      </div>

      {/* Status Card */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('licence_page.status.title')}</h2>
          <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${getStatusColor()}`}>
            {getStatusIcon()}
            {getStatusText()}
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[hsl(213,80%,28%)]"></div>
          </div>
        ) : license ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Clé de licence */}
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-gray-500 mb-2">
                <Shield className="w-4 h-4" />
                <span className="text-sm font-medium">{t('licence_page.license_key')}</span>
              </div>
              <p className="text-lg font-mono text-gray-900 dark:text-white">
                {license.key || t('licence_page.not_configured')}
              </p>
            </div>

            {/* Date d'expiration */}
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-gray-500 mb-2">
                <Calendar className="w-4 h-4" />
                <span className="text-sm font-medium">{t('licence_page.expiry_date')}</span>
              </div>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {license.expiryDate 
                  ? new Date(license.expiryDate).toLocaleDateString('fr-FR', { 
                      day: 'numeric', 
                      month: 'long', 
                      year: 'numeric' 
                    })
                  : 'Non définie'
                }
              </p>
              {license.daysRemaining && (
                <p className={`text-sm mt-1 ${license.daysRemaining <= 30 ? 'text-orange-600' : 'text-green-600'}`}>
                  {license.daysRemaining} jours restants
                </p>
              )}
            </div>

            {/* Domaines autorisés */}
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 md:col-span-2">
              <div className="flex items-center gap-2 text-gray-500 mb-3">
                <Globe className="w-4 h-4" />
                <span className="text-sm font-medium">{t('licence_page.authorized_domains')}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {license.domains && license.domains.length > 0 ? (
                  license.domains.map((domain, index) => (
                    <span 
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                    >
                      {domain}
                    </span>
                  ))
                ) : (
                  <span className="text-gray-500">{t('licence_page.no_domains')}</span>
                )}
              </div>
            </div>

            {/* Message d'erreur */}
            {license.error && (
              <div className="md:col-span-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
                <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                  <AlertTriangle className="w-5 h-5" />
                  <span className="font-medium">{t('licence_page.license_error')}</span>
                </div>
                <p className="mt-2 text-red-600 dark:text-red-300">{license.error}</p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-gray-500">{t('licence_page.load_error')}</p>
        )}
      </div>

      {/* Help Section */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-800">
        <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-3">{t('licence_page.help.title')}</h3>
        <ol className="list-decimal list-inside space-y-2 text-blue-800 dark:text-blue-200 text-sm">
          <li>{t('licence_page.help.step1')} <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">.env</code></li>
          <li>{t('licence_page.help.step2')}</li>
          <li>{t('licence_page.help.step3')}</li>
        </ol>
      </div>
    </div>
  );
}
