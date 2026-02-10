'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Bell,
  Mail,
  Smartphone,
  MessageSquare,
  Calendar,
  Newspaper,
  AlertTriangle,
  Megaphone,
  Save,
  Loader2,
  Check,
  ArrowLeft,
  Info,
  Shield,
} from 'lucide-react';
import Link from 'next/link';

interface NotificationPreferences {
  email: {
    evenements: boolean;
    actualites: boolean;
    reclamations: boolean;
    campagnes: boolean;
    newsletter: boolean;
  };
  push: {
    evenements: boolean;
    actualites: boolean;
    reclamations: boolean;
    campagnes: boolean;
  };
  sms: {
    reclamations: boolean;
    urgences: boolean;
  };
}

interface Preferences {
  notifications: NotificationPreferences;
  theme: string;
  langue: string;
}

const DEFAULT_PREFERENCES: Preferences = {
  notifications: {
    email: {
      evenements: true,
      actualites: true,
      reclamations: true,
      campagnes: true,
      newsletter: false,
    },
    push: {
      evenements: true,
      actualites: false,
      reclamations: true,
      campagnes: true,
    },
    sms: {
      reclamations: false,
      urgences: true,
    },
  },
  theme: 'system',
  langue: 'fr',
};

export default function NotificationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [preferences, setPreferences] = useState<Preferences>(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?redirect=/profil/notifications');
    }
  }, [status, router]);

  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        const res = await fetch('/api/users/me/preferences');
        if (res.ok) {
          const json = await res.json();
          setPreferences(json.data || DEFAULT_PREFERENCES);
        }
      } catch (err) {
        console.error('Erreur:', err);
      } finally {
        setLoading(false);
      }
    };

    if (session?.user) {
      fetchPreferences();
    }
  }, [session]);

  const handleToggle = (
    channel: 'email' | 'push' | 'sms',
    type: string,
    value: boolean
  ) => {
    setPreferences((prev) => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [channel]: {
          ...prev.notifications[channel],
          [type]: value,
        },
      },
    }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');

    try {
      const res = await fetch('/api/users/me/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notifications: preferences.notifications }),
      });

      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        const data = await res.json();
        setError(data.error || 'Erreur lors de la sauvegarde');
      }
    } catch (err) {
      setError('Erreur de connexion');
    } finally {
      setSaving(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[hsl(213,80%,28%)] animate-spin" />
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return null;
  }

  const notificationCategories = [
    {
      id: 'evenements',
      label: 'Événements',
      description: 'Nouveaux événements et rappels',
      icon: Calendar,
      color: 'purple',
    },
    {
      id: 'actualites',
      label: 'Actualités',
      description: 'Nouvelles actualités publiées',
      icon: Newspaper,
      color: 'orange',
    },
    {
      id: 'reclamations',
      label: 'Réclamations',
      description: 'Mises à jour de vos réclamations',
      icon: AlertTriangle,
      color: 'red',
    },
    {
      id: 'campagnes',
      label: 'Campagnes',
      description: 'Nouvelles campagnes citoyennes',
      icon: Megaphone,
      color: 'green',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/profil"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft size={18} />
            Retour au profil
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Bell className="text-[hsl(213,80%,28%)]" />
            Préférences de notifications
          </h1>
          <p className="text-gray-500 mt-1">
            Choisissez comment vous souhaitez être notifié
          </p>
        </div>

        {/* Info banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex items-start gap-3"
        >
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-blue-900 font-medium">
              Restez informé des actualités de votre province
            </p>
            <p className="text-sm text-blue-700 mt-1">
              Activez les notifications pour ne manquer aucune information importante
            </p>
          </div>
        </motion.div>

        {/* Email Notifications */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="gov-card mb-6"
        >
          <div className="p-4 border-b border-gray-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Mail className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Notifications par email</h2>
              <p className="text-sm text-gray-500">Recevez des emails sur {session?.user?.email}</p>
            </div>
          </div>

          <div className="divide-y divide-gray-100">
            {notificationCategories.map((cat) => {
              const Icon = cat.icon;
              const isEnabled = preferences.notifications.email[cat.id as keyof typeof preferences.notifications.email];
              
              return (
                <div key={cat.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Icon size={18} className="text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">{cat.label}</p>
                      <p className="text-xs text-gray-500">{cat.description}</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isEnabled}
                      onChange={(e) => handleToggle('email', cat.id, e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[hsl(213,80%,28%)]"></div>
                  </label>
                </div>
              );
            })}

            {/* Newsletter */}
            <div className="p-4 flex items-center justify-between bg-gray-50">
              <div className="flex items-center gap-3">
                <Mail size={18} className="text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900">Newsletter hebdomadaire</p>
                  <p className="text-xs text-gray-500">Résumé hebdomadaire des actualités</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.notifications.email.newsletter}
                  onChange={(e) => handleToggle('email', 'newsletter', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[hsl(213,80%,28%)]"></div>
              </label>
            </div>
          </div>
        </motion.section>

        {/* Push Notifications */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="gov-card mb-6"
        >
          <div className="p-4 border-b border-gray-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <Bell className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Notifications push</h2>
              <p className="text-sm text-gray-500">Notifications dans votre navigateur</p>
            </div>
          </div>

          <div className="divide-y divide-gray-100">
            {notificationCategories.map((cat) => {
              const Icon = cat.icon;
              const isEnabled = preferences.notifications.push[cat.id as keyof typeof preferences.notifications.push];
              
              return (
                <div key={cat.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Icon size={18} className="text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">{cat.label}</p>
                      <p className="text-xs text-gray-500">{cat.description}</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isEnabled}
                      onChange={(e) => handleToggle('push', cat.id, e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>
              );
            })}
          </div>
        </motion.section>

        {/* SMS Notifications */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="gov-card mb-6"
        >
          <div className="p-4 border-b border-gray-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Notifications SMS</h2>
              <p className="text-sm text-gray-500">
                Ajoutez votre numéro dans votre profil
              </p>
            </div>
          </div>

          <div className="divide-y divide-gray-100">
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle size={18} className="text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900">Réclamations</p>
                  <p className="text-xs text-gray-500">Statut de vos réclamations</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.notifications.sms.reclamations}
                  onChange={(e) => handleToggle('sms', 'reclamations', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
              </label>
            </div>

            <div className="p-4 flex items-center justify-between bg-red-50/50">
              <div className="flex items-center gap-3">
                <Shield size={18} className="text-red-500" />
                <div>
                  <p className="font-medium text-gray-900">Alertes urgentes</p>
                  <p className="text-xs text-gray-500">Alertes importantes de la province</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.notifications.sms.urgences}
                  onChange={(e) => handleToggle('sms', 'urgences', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
              </label>
            </div>
          </div>
        </motion.section>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Save button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex items-center justify-between"
        >
          <p className="text-sm text-gray-500">
            Les modifications sont enregistrées automatiquement
          </p>
          <button
            onClick={handleSave}
            disabled={saving}
            className={`gov-btn ${
              saved 
                ? 'bg-green-600 hover:bg-green-700' 
                : 'gov-btn-primary'
            } flex items-center gap-2`}
          >
            {saving ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Enregistrement...
              </>
            ) : saved ? (
              <>
                <Check size={18} />
                Enregistré !
              </>
            ) : (
              <>
                <Save size={18} />
                Enregistrer
              </>
            )}
          </button>
        </motion.div>
      </div>
    </div>
  );
}
