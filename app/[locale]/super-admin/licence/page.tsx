'use client';

import { useState, useEffect } from 'react';
import { KeyRound, Shield, Calendar, Globe, AlertTriangle, Check, RefreshCw, Server, Info, Lock, Copy, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';

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
        // Fallback demo data si l'API n'est pas encore prête
        // setLicense({ valid: false, error: "API non disponible" });
        toast.error(t('licence_page.toasts.fetch_error') || "Erreur de chargement");
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error(t('licence_page.toasts.connection_error') || "Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLicenseInfo();
  }, []);

  const getStatusColor = () => {
    if (!license) return 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700';
    if (!license.valid) return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800';
    if (license.daysRemaining && license.daysRemaining <= 30) return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800';
    return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800';
  };

  const getStatusIcon = () => {
    if (!license) return <RefreshCw className="w-5 h-5 animate-spin" />;
    if (!license.valid) return <AlertTriangle className="w-6 h-6" />;
    if (license.daysRemaining && license.daysRemaining <= 30) return <Clock className="w-6 h-6" />;
    return <Check className="w-6 h-6" />;
  };
  
  const getStatusLabel = () => {
      if (!license) return "Chargement...";
      if (!license.valid) return t('licence_page.status.invalid') || "Invalide";
      if (license.daysRemaining && license.daysRemaining <= 30) return t('licence_page.status.expires_soon') || "Expire bientôt";
      return t('licence_page.status.active') || "Active";
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(t('toasts.copied'));
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header */}
        <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row md:items-center justify-between gap-4"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-600/20 text-white">
                <KeyRound className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {t('licence_page.title') || "Gestion de Licence"}
              </h1>
              <p className="text-gray-500 dark:text-gray-400">
                {t('licence_page.subtitle') || "Information sur la licence et l'état d'activation"}
              </p>
            </div>
          </div>
          
          <button
            onClick={fetchLicenseInfo}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-all shadow-sm active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {t('licence_page.refresh') || "Actualiser"}
          </button>
        </motion.div>

        {loading ? (
             <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-indigo-100 dark:border-indigo-900/30 rounded-full"></div>
                    <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
                </div>
                <p className="mt-4 text-gray-500 font-medium">{t('licence_page.verifying') || "Vérification de la licence..."}</p>
             </div>
        ) : !license ? (
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white dark:bg-gray-800 rounded-3xl p-10 text-center border border-gray-100 dark:border-gray-700 shadow-sm"
            >
                <Server className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{t('licence_page.error_fetching') || "Impossible de récupérer les infos"}</h3>
                <p className="text-gray-500 mb-6 max-w-md mx-auto">{t('licence_page.error_desc') || "Le serveur de licence ne répond pas ou la configuration est manquante."}</p>
                <button onClick={fetchLicenseInfo} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors">
                    {t('licence_page.retry') || "Réessayer"}
                </button>
            </motion.div>
        ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Main Status Column */}
                <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="lg:col-span-2 space-y-6"
                >
                    {/* Status Banner */}
                    <div className={`rounded-3xl p-8 border ${getStatusColor()} relative overflow-hidden transition-all duration-300`}>
                        <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 dark:bg-black/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                        
                        <div className="flex items-start justify-between relative z-10">
                            <div>
                                <h2 className="text-sm font-semibold uppercase tracking-wider opacity-80 mb-1">{t('licence_page.status.title') || "État de la licence"}</h2>
                                <div className="text-3xl font-bold flex items-center gap-3 mt-2">
                                    {getStatusIcon()}
                                    {getStatusLabel()}
                                </div>
                                {license.daysRemaining !== undefined && (
                                    <p className="mt-2 font-medium opacity-90">
                                        {t('licence_page.status.days_left', { days: license.daysRemaining }) || `Expire dans ${license.daysRemaining} jours`}
                                    </p>
                                )}
                            </div>
                        </div>
                        
                        {license.error && (
                             <div className="mt-6 p-4 bg-white/50 dark:bg-black/10 rounded-xl border border-white/20 dark:border-black/10 backdrop-blur-sm">
                                <div className="flex items-center gap-2 font-medium text-red-700 dark:text-red-300 mb-1">
                                    <AlertTriangle size={16} />
                                    {t('licence_page.error_detected') || "Erreur détectée"}
                                </div>
                                <p className="text-sm text-red-600 dark:text-red-400">{license.error}</p>
                             </div>
                        )}
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-lg">
                                    <Shield className="w-5 h-5" />
                                </div>
                                <span className="text-sm font-medium text-gray-500">{t('licence_page.license_key') || "Clé de Licence"}</span>
                            </div>
                            <div className="flex items-center justify-between group">
                                <code className="text-sm font-mono text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-900 px-2 py-1 rounded truncate max-w-[180px]">
                                    {license.key || t('licence_page.not_configured') || "Non configurée"}
                                </code>
                                {license.key && (
                                    <button onClick={() => copyToClipboard(license.key!)} className="text-gray-400 hover:text-indigo-600 transition-colors bg-gray-50 p-1.5 rounded-lg opacity-0 group-hover:opacity-100">
                                        <Copy size={14} />
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg">
                                    <Calendar className="w-5 h-5" />
                                </div>
                                <span className="text-sm font-medium text-gray-500">{t('licence_page.expiry_date') || "Date d'expiration"}</span>
                            </div>
                            <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                {license.expiryDate 
                                  ? new Date(license.expiryDate).toLocaleDateString(undefined, { 
                                      day: 'numeric', month: 'long', year: 'numeric' 
                                    })
                                  : (t('licence_page.not_defined') || 'Non définie')
                                }
                            </p>
                        </div>
                        
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm md:col-span-2">
                             <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-green-50 dark:bg-green-900/20 text-green-600 rounded-lg">
                                    <Globe className="w-5 h-5" />
                                </div>
                                <span className="text-sm font-medium text-gray-500">{t('licence_page.authorized_domains') || "Domaines Autorisés"}</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {license.domains && license.domains.length > 0 ? (
                                  license.domains.map((domain, index) => (
                                    <span 
                                      key={index}
                                      className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-gray-100 text-gray-700 border border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600"
                                    >
                                      {domain}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-gray-400 italic text-sm">{t('licence_page.none') || "Aucun domaine restreint ou information indisponible"}</span>
                                )}
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Configuration Help Column */}
                <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="lg:col-span-1"
                >
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-800/50 rounded-3xl p-6 border border-gray-200 dark:border-gray-700 sticky top-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-white dark:bg-gray-700 rounded-lg shadow-sm">
                                <Info className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                            </div>
                            <h3 className="font-bold text-gray-900 dark:text-white">{t('licence_page.help.title') || "Configuration"}</h3>
                        </div>
                        
                        <div className="space-y-4">
                            <div className="relative pl-6 border-l-2 border-gray-300 dark:border-gray-600 pb-2">
                                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-white border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-800"></div>
                                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">{t('licence_page.help.step1_title') || "1. Modifier .env"}</h4>
                                <p className="text-xs text-gray-500 leading-relaxed">
                                    {t('licence_page.help.step1_desc') || "Ajoutez votre clé de licence dans le fichier d'environnement."}
                                </p>
                                <div className="mt-2 bg-gray-900 rounded-lg p-3 overflow-x-auto">
                                    <code className="text-xs font-mono text-green-400">LICENSE_KEY=your-key-here</code>
                                </div>
                            </div>
                            
                            <div className="relative pl-6 border-l-2 border-gray-300 dark:border-gray-600 pb-2">
                                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-white border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-800"></div>
                                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">{t('licence_page.help.step2_title') || "2. Variables optionnelles"}</h4>
                                <p className="text-xs text-gray-500 leading-relaxed">
                                    {t('licence_page.help.step2_desc') || "Vous pouvez définir des domaines ou une date d'expiration pour les tests."}
                                </p>
                            </div>
                            
                            <div className="relative pl-6 border-l-2 border-transparent">
                                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-white border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-800"></div>
                                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">{t('licence_page.help.step3_title') || "3. Redémarrer"}</h4>
                                <p className="text-xs text-gray-500 leading-relaxed">
                                    {t('licence_page.help.step3_desc') || "Relancez l'application pour appliquer les changements"} : 
                                    <code className="bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded mx-1">npm run dev</code>
                                </p>
                            </div>
                        </div>
                        
                        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                            <a href="#" className="flex items-center justify-between group text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700">
                                {t('licence_page.help.support') || "Contacter le support"}
                                <span className="transform transition-transform group-hover:translate-x-1">→</span>
                            </a>
                        </div>
                    </div>
                </motion.div>
            </div>
        )}
      </div>
    </div>
  );
}
