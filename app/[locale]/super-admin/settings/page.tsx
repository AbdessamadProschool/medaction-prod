'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import {
  Settings,
  ArrowLeft,
  Save,
  RefreshCw,
  Loader2,
  Globe,
  Mail,
  Bell,
  Shield,
  Database,
  Palette,
  Clock,
  Lock,
  Key,
  Users,
  FileText,
  Eye,
  EyeOff,
  Check,
  X,
  AlertTriangle,
  Info,
  Zap,
  Server,
  HardDrive,
  Wifi,
  MessageSquare,
} from 'lucide-react';

interface SystemSettings {
  general: {
    siteName: string;
    siteDescription: string;
    maintenanceMode: boolean;
    registrationEnabled: boolean;
    emailVerificationRequired: boolean;
  };
  security: {
    maxLoginAttempts: number;
    sessionTimeout: number;
    passwordMinLength: number;
    twoFactorEnabled: boolean;
    ipWhitelist: string[];
  };
  notifications: {
    emailEnabled: boolean;
    smsEnabled: boolean;
    pushEnabled: boolean;
    adminAlerts: boolean;
    reclamationAlerts: boolean;
  };
  reclamations: {
    autoAssignEnabled: boolean;
    maxFileSize: number;
    allowedFileTypes: string[];
    urgentThreshold: number;
    autoCloseAfterDays: number;
  };
}

const DEFAULT_SETTINGS: SystemSettings = {
  general: {
    siteName: 'Portail Mediouna',
    siteDescription: 'Plateforme citoyenne pour la province de Mediouna',
    maintenanceMode: false,
    registrationEnabled: true,
    emailVerificationRequired: true,
  },
  security: {
    maxLoginAttempts: 5,
    sessionTimeout: 30,
    passwordMinLength: 8,
    twoFactorEnabled: false,
    ipWhitelist: [],
  },
  notifications: {
    emailEnabled: true,
    smsEnabled: false,
    pushEnabled: true,
    adminAlerts: true,
    reclamationAlerts: true,
  },
  reclamations: {
    autoAssignEnabled: false,
    maxFileSize: 10,
    allowedFileTypes: ['jpg', 'png', 'pdf', 'doc'],
    urgentThreshold: 24,
    autoCloseAfterDays: 30,
  },
};

// Toggle Switch Component
function Toggle({
  enabled,
  onChange,
  disabled,
}: {
  enabled: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={() => !disabled && onChange(!enabled)}
      disabled={disabled}
      className={`relative w-12 h-6 rounded-full transition-colors ${
        enabled ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span
        className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
          enabled ? 'left-7' : 'left-1'
        }`}
      />
    </button>
  );
}

// Setting Card Component
function SettingCard({
  title,
  description,
  icon: Icon,
  color,
  children,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700"
    >
      <div className="flex items-start gap-4 mb-6">
        <div className={`p-3 rounded-xl bg-gradient-to-br ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="font-bold text-gray-900 dark:text-white">{title}</h3>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </motion.div>
  );
}

// Setting Row Component
function SettingRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
      <div>
        <p className="font-medium text-gray-900 dark:text-white">{label}</p>
        {description && <p className="text-sm text-gray-500">{description}</p>}
      </div>
      <div>{children}</div>
    </div>
  );
}

export default function SuperAdminSettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const t = useTranslations();
  const [settings, setSettings] = useState<SystemSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Redirect if not SUPER_ADMIN
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && session?.user?.role !== 'SUPER_ADMIN') {
      router.push('/admin');
      toast.error('Accès réservé aux Super Administrateurs');
    }
  }, [status, session, router]);

  // Fetch settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/settings');
        if (res.ok) {
          const data = await res.json();
          setSettings({ ...DEFAULT_SETTINGS, ...data });
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
      } finally {
        setLoading(false);
      }
    };

    if (session?.user?.role === 'SUPER_ADMIN') {
      fetchSettings();
    }
  }, [session]);

  // Update a setting
  const updateSetting = <K extends keyof SystemSettings>(
    category: K,
    key: keyof SystemSettings[K],
    value: any
  ) => {
    setSettings((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value,
      },
    }));
    setHasChanges(true);
  };

  // Save settings
  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        toast.success(t('system_settings.toasts.save_success'));
        setHasChanges(false);
      } else {
        toast.error(t('system_settings.toasts.save_error'));
      }
    } catch (error) {
      toast.error('Erreur de connexion');
    } finally {
      setSaving(false);
    }
  };

  // Reset settings
  const handleReset = () => {
    if (confirm('Réinitialiser tous les paramètres par défaut ?')) {
      setSettings(DEFAULT_SETTINGS);
      setHasChanges(true);
      toast.info('Paramètres réinitialisés');
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader2 className="w-8 h-8 text-gray-500 animate-spin" />
      </div>
    );
  }

  if (session?.user?.role !== 'SUPER_ADMIN') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-800 via-gray-900 to-gray-800 text-white">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/super-admin"
                className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
              >
                <ArrowLeft size={20} />
              </Link>
              <div className="p-2 bg-white/10 rounded-xl backdrop-blur">
                <Settings className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{t('system_settings.title')}</h1>
                <p className="text-gray-300 text-sm">{t('system_settings.subtitle')}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {hasChanges && (
                <span className="flex items-center gap-2 px-3 py-1 bg-amber-500/20 text-amber-300 rounded-full text-sm">
                  <AlertTriangle size={14} />
                  Modifications non sauvegardées
                </span>
              )}
              <button
                onClick={handleReset}
                className="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors text-sm"
              >
                {t('system_settings.reset')}
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !hasChanges}
                className="flex items-center gap-2 px-5 py-2 bg-white text-gray-900 rounded-lg font-medium hover:bg-gray-100 disabled:opacity-50 transition-colors"
              >
                {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                {t('system_settings.save')}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {/* General Settings */}
        <SettingCard
          title={t('system_settings.general.title')}
          description={t('system_settings.general.description')}
          icon={Globe}
          color="from-blue-500 to-indigo-600"
        >
          <SettingRow label={t('system_settings.general.site_name')}>
            <input
              type="text"
              value={settings.general.siteName}
              onChange={(e) => updateSetting('general', 'siteName', e.target.value)}
              className="px-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-sm w-48"
            />
          </SettingRow>
          <SettingRow
            label={t('system_settings.general.maintenance_mode')}
            description={t('system_settings.general.maintenance_desc')}
          >
            <Toggle
              enabled={settings.general.maintenanceMode}
              onChange={(v) => updateSetting('general', 'maintenanceMode', v)}
            />
          </SettingRow>
          <SettingRow
            label={t('system_settings.general.registration')}
            description={t('system_settings.general.registration_desc')}
          >
            <Toggle
              enabled={settings.general.registrationEnabled}
              onChange={(v) => updateSetting('general', 'registrationEnabled', v)}
            />
          </SettingRow>
          <SettingRow
            label={t('system_settings.general.email_verification')}
            description={t('system_settings.general.email_verification_desc')}
          >
            <Toggle
              enabled={settings.general.emailVerificationRequired}
              onChange={(v) => updateSetting('general', 'emailVerificationRequired', v)}
            />
          </SettingRow>
        </SettingCard>

        {/* Security Settings */}
        <SettingCard
          title={t('system_settings.security.title')}
          description={t('system_settings.security.description')}
          icon={Shield}
          color="from-red-500 to-rose-600"
        >
          <SettingRow
            label={t('system_settings.security.max_login_attempts')}
            description={t('system_settings.security.max_login_attempts_desc')}
          >
            <input
              type="number"
              value={settings.security.maxLoginAttempts}
              onChange={(e) => updateSetting('security', 'maxLoginAttempts', parseInt(e.target.value))}
              className="px-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-sm w-20 text-center"
              min={1}
              max={10}
            />
          </SettingRow>
          <SettingRow
            label={t('system_settings.security.session_timeout')}
            description={t('system_settings.security.session_timeout_desc')}
          >
            <input
              type="number"
              value={settings.security.sessionTimeout}
              onChange={(e) => updateSetting('security', 'sessionTimeout', parseInt(e.target.value))}
              className="px-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-sm w-20 text-center"
              min={5}
              max={120}
            />
          </SettingRow>
          <SettingRow
            label={t('system_settings.security.password_min_length')}
            description={t('system_settings.security.password_min_length_desc')}
          >
            <input
              type="number"
              value={settings.security.passwordMinLength}
              onChange={(e) => updateSetting('security', 'passwordMinLength', parseInt(e.target.value))}
              className="px-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-sm w-20 text-center"
              min={6}
              max={24}
            />
          </SettingRow>
          <SettingRow
            label={t('system_settings.security.two_factor')}
            description={t('system_settings.security.two_factor_desc')}
          >
            <Toggle
              enabled={settings.security.twoFactorEnabled}
              onChange={(v) => updateSetting('security', 'twoFactorEnabled', v)}
            />
          </SettingRow>
        </SettingCard>

        {/* Notifications Settings */}
        <SettingCard
          title={t('system_settings.notifications.title')}
          description={t('system_settings.notifications.description')}
          icon={Bell}
          color="from-amber-500 to-orange-600"
        >
          <SettingRow
            label={t('system_settings.notifications.email_notifications')}
            description={t('system_settings.notifications.email_notifications_desc')}
          >
            <Toggle
              enabled={settings.notifications.emailEnabled}
              onChange={(v) => updateSetting('notifications', 'emailEnabled', v)}
            />
          </SettingRow>
          <SettingRow
            label={t('system_settings.notifications.sms_notifications')}
            description={t('system_settings.notifications.sms_notifications_desc')}
          >
            <Toggle
              enabled={settings.notifications.smsEnabled}
              onChange={(v) => updateSetting('notifications', 'smsEnabled', v)}
            />
          </SettingRow>
          <SettingRow
            label={t('system_settings.notifications.push_notifications')}
            description={t('system_settings.notifications.push_notifications_desc')}
          >
            <Toggle
              enabled={settings.notifications.pushEnabled}
              onChange={(v) => updateSetting('notifications', 'pushEnabled', v)}
            />
          </SettingRow>
          <SettingRow
            label={t('system_settings.notifications.admin_alerts')}
            description={t('system_settings.notifications.admin_alerts_desc')}
          >
            <Toggle
              enabled={settings.notifications.adminAlerts}
              onChange={(v) => updateSetting('notifications', 'adminAlerts', v)}
            />
          </SettingRow>
        </SettingCard>

        {/* Reclamations Settings */}
        <SettingCard
          title={t('system_settings.reclamations.title')}
          description={t('system_settings.reclamations.description')}
          icon={MessageSquare}
          color="from-purple-500 to-violet-600"
        >
          <SettingRow
            label={t('system_settings.reclamations.auto_assign')}
            description={t('system_settings.reclamations.auto_assign_desc')}
          >
            <Toggle
              enabled={settings.reclamations.autoAssignEnabled}
              onChange={(v) => updateSetting('reclamations', 'autoAssignEnabled', v)}
            />
          </SettingRow>
          <SettingRow
            label={t('system_settings.reclamations.max_file_size')}
            description={t('system_settings.reclamations.max_file_size_desc')}
          >
            <input
              type="number"
              value={settings.reclamations.maxFileSize}
              onChange={(e) => updateSetting('reclamations', 'maxFileSize', parseInt(e.target.value))}
              className="px-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-sm w-20 text-center"
              min={1}
              max={50}
            />
          </SettingRow>
          <SettingRow
            label={t('system_settings.reclamations.urgent_threshold')}
            description={t('system_settings.reclamations.urgent_threshold_desc')}
          >
            <input
              type="number"
              value={settings.reclamations.urgentThreshold}
              onChange={(e) => updateSetting('reclamations', 'urgentThreshold', parseInt(e.target.value))}
              className="px-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-sm w-20 text-center"
              min={1}
              max={168}
            />
          </SettingRow>
          <SettingRow
            label={t('system_settings.reclamations.auto_close')}
            description={t('system_settings.reclamations.auto_close_desc')}
          >
            <input
              type="number"
              value={settings.reclamations.autoCloseAfterDays}
              onChange={(e) => updateSetting('reclamations', 'autoCloseAfterDays', parseInt(e.target.value))}
              className="px-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-sm w-20 text-center"
              min={7}
              max={90}
            />
          </SettingRow>
        </SettingCard>

        {/* Info Box */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-6 border border-blue-100 dark:border-blue-800">
          <div className="flex items-start gap-4">
            <Info className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-blue-900 dark:text-blue-100">
                À propos des paramètres système
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                Ces paramètres affectent le comportement global de la plateforme. Certaines modifications
                peuvent nécessiter un redémarrage du serveur. En cas de problème, utilisez le bouton
                "Réinitialiser" pour revenir aux valeurs par défaut.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
