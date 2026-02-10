'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import {
  Settings,
  Bell,
  Shield,
  Mail,
  Save,
  CheckCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react';

interface SettingsData {
  general: {
    nomPlateforme: string;
    description: string;
    modeMaintenance: boolean;
  };
  notifications: {
    nouvelleReclamation: boolean;
    nouvelUtilisateur: boolean;
    rapportQuotidien: boolean;
  };
  security: {
    dureeSession: number;
    tentativesConnexionMax: number;
    doubleAuthentification: boolean;
  };
  email: {
    emailEnvoi: string;
    emailContact: string;
  };
}

const DEFAULT_SETTINGS: SettingsData = {
  general: {
    nomPlateforme: 'Portail Mediouna - Province de Médiouna',
    description: 'Plateforme citoyenne de la Province de Médiouna',
    modeMaintenance: false,
  },
  notifications: {
    nouvelleReclamation: true,
    nouvelUtilisateur: true,
    rapportQuotidien: false,
  },
  security: {
    dureeSession: 24,
    tentativesConnexionMax: 5,
    doubleAuthentification: false,
  },
  email: {
    emailEnvoi: 'noreply@medaction.ma',
    emailContact: 'contact@provincemediouna.ma',
  },
};

export default function AdminSettingsPage() {
  const { data: session, status } = useSession();
  const t = useTranslations();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState<SettingsData>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tabs = [
    { id: 'general', label: t('admin_settings.tabs.general'), icon: Settings },
    { id: 'notifications', label: t('admin_settings.tabs.notifications'), icon: Bell },
    { id: 'security', label: t('admin_settings.tabs.security'), icon: Shield },
    { id: 'email', label: t('admin_settings.tabs.email'), icon: Mail },
  ];

  // Vérifier l'authentification
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && !['ADMIN', 'SUPER_ADMIN'].includes(session?.user?.role || '')) {
      router.push('/');
    }
  }, [status, session, router]);

  // Charger les paramètres
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await fetch('/api/admin/settings');
        if (res.ok) {
          const data = await res.json();
          setSettings(data.data || DEFAULT_SETTINGS);
        }
      } catch (err) {
        console.error('Erreur chargement paramètres:', err);
      } finally {
        setLoading(false);
      }
    };

    if (session?.user) {
      loadSettings();
    }
  }, [session]);

  // Mettre à jour un paramètre local
  const updateSetting = (section: keyof SettingsData, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value,
      },
    }));
    setSaved(false);
  };

  // Sauvegarder les paramètres
  const handleSave = async () => {
    setSaving(true);
    setError(null);
    
    try {
      // Sauvegarder chaque section
      for (const section of Object.keys(settings) as (keyof SettingsData)[]) {
        const res = await fetch('/api/admin/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            section,
            data: settings[section],
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Erreur lors de la sauvegarde');
        }
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const isSuperAdmin = session?.user?.role === 'SUPER_ADMIN';

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('admin_settings.title')}</h1>
          <p className="text-gray-600 dark:text-gray-400">{t('admin_settings.subtitle')}</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || !isSuperAdmin}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : saved ? (
            <CheckCircle className="w-4 h-4" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {saving ? t('admin_settings.saving') : saved ? t('admin_settings.saved') : t('admin_settings.save')}
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {!isSuperAdmin && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2 text-amber-700">
          <AlertCircle size={18} />
          {t('admin_settings.super_admin_only')}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-emerald-600 text-emerald-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700"
      >
        {activeTab === 'general' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('admin_settings.general.title')}</h3>
            
            <div className="grid gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('admin_settings.general.platform_name')}
                </label>
                <input
                  type="text"
                  value={settings.general.nomPlateforme}
                  onChange={(e) => updateSetting('general', 'nomPlateforme', e.target.value)}
                  disabled={!isSuperAdmin}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('admin_settings.general.description')}
                </label>
                <textarea
                  rows={3}
                  value={settings.general.description}
                  onChange={(e) => updateSetting('general', 'description', e.target.value)}
                  disabled={!isSuperAdmin}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('admin_settings.general.maintenance_mode')}
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={settings.general.modeMaintenance}
                    onChange={(e) => updateSetting('general', 'modeMaintenance', e.target.checked)}
                    disabled={!isSuperAdmin}
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                  <label className="text-sm text-gray-600 dark:text-gray-400">
                    {t('admin_settings.general.enable_maintenance')}
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('admin_settings.notifications.title')}</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b dark:border-gray-700">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{t('admin_settings.notifications.new_reclamation')}</p>
                  <p className="text-sm text-gray-500">{t('admin_settings.notifications.new_reclamation_desc')}</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.notifications.nouvelleReclamation}
                  onChange={(e) => updateSetting('notifications', 'nouvelleReclamation', e.target.checked)}
                  disabled={!isSuperAdmin}
                  className="w-4 h-4 text-emerald-600 rounded"
                />
              </div>
              
              <div className="flex items-center justify-between py-3 border-b dark:border-gray-700">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{t('admin_settings.notifications.new_user')}</p>
                  <p className="text-sm text-gray-500">{t('admin_settings.notifications.new_user_desc')}</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.notifications.nouvelUtilisateur}
                  onChange={(e) => updateSetting('notifications', 'nouvelUtilisateur', e.target.checked)}
                  disabled={!isSuperAdmin}
                  className="w-4 h-4 text-emerald-600 rounded"
                />
              </div>
              
              <div className="flex items-center justify-between py-3 border-b dark:border-gray-700">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{t('admin_settings.notifications.daily_report')}</p>
                  <p className="text-sm text-gray-500">{t('admin_settings.notifications.daily_report_desc')}</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.notifications.rapportQuotidien}
                  onChange={(e) => updateSetting('notifications', 'rapportQuotidien', e.target.checked)}
                  disabled={!isSuperAdmin}
                  className="w-4 h-4 text-emerald-600 rounded"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('admin_settings.security.title')}</h3>
            
            <div className="grid gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('admin_settings.security.session_duration')}
                </label>
                <input
                  type="number"
                  value={settings.security.dureeSession}
                  onChange={(e) => updateSetting('security', 'dureeSession', parseInt(e.target.value) || 24)}
                  min={1}
                  max={168}
                  disabled={!isSuperAdmin}
                  className="w-32 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('admin_settings.security.max_attempts')}
                </label>
                <input
                  type="number"
                  value={settings.security.tentativesConnexionMax}
                  onChange={(e) => updateSetting('security', 'tentativesConnexionMax', parseInt(e.target.value) || 5)}
                  min={3}
                  max={10}
                  disabled={!isSuperAdmin}
                  className="w-32 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 disabled:bg-gray-100"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={settings.security.doubleAuthentification}
                  onChange={(e) => updateSetting('security', 'doubleAuthentification', e.target.checked)}
                  disabled={!isSuperAdmin}
                  className="w-4 h-4 text-emerald-600 rounded"
                />
                <label className="text-sm text-gray-600 dark:text-gray-400">
                  {t('admin_settings.security.enable_2fa')}
                </label>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'email' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('admin_settings.email.title')}</h3>
            
            <div className="grid gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('admin_settings.email.sender_email')}
                </label>
                <input
                  type="email"
                  value={settings.email.emailEnvoi}
                  onChange={(e) => updateSetting('email', 'emailEnvoi', e.target.value)}
                  disabled={!isSuperAdmin}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('admin_settings.email.contact_email')}
                </label>
                <input
                  type="email"
                  value={settings.email.emailContact}
                  onChange={(e) => updateSetting('email', 'emailContact', e.target.value)}
                  disabled={!isSuperAdmin}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 disabled:bg-gray-100"
                />
              </div>

              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> {t('admin_settings.email.smtp_note')}
                </p>
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Info */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <Settings className="w-5 h-5 text-blue-600" />
          <p className="text-sm text-blue-800 dark:text-blue-300">
            {t('admin_settings.info')}
          </p>
        </div>
      </div>
    </div>
  );
}
