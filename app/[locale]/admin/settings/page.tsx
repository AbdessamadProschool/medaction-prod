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
import { toast } from 'sonner';


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
};export default function AdminSettingsPage() {
  const { data: session, status } = useSession();
  const t = useTranslations('admin_settings');
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState<SettingsData>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const tabs = [
    { id: 'general', label: t('tabs.general'), icon: Settings, color: 'text-blue-600', bg: 'bg-blue-50' },
    { id: 'notifications', label: t('tabs.notifications'), icon: Bell, color: 'text-amber-600', bg: 'bg-amber-50' },
    { id: 'security', label: t('tabs.security'), icon: Shield, color: 'text-purple-600', bg: 'bg-purple-50' },
    { id: 'email', label: t('tabs.email'), icon: Mail, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ];

  // Vérifier l'authentification
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

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
  };

  // Sauvegarder les paramètres
  const handleSave = async () => {
    setSaving(true);
    
    const savePromise = new Promise(async (resolve, reject) => {
      try {
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
        resolve(true);
      } catch (err: any) {
        reject(new Error(err.message || 'Erreur lors de la sauvegarde'));
      } finally {
        setSaving(false);
      }
    });

    toast.promise(savePromise, {
      loading: t('saving'),
      success: t('saved'),
      error: (err: any) => err.message,
    });
  };

  const isSuperAdmin = session?.user?.role === 'SUPER_ADMIN';

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-[hsl(var(--gov-blue))] animate-spin" />
      </div>
    );
  }

  return (
    <PermissionGuard permission="system.settings.read">
      <div className="min-h-screen bg-background py-8 px-4 sm:px-6 relative overflow-hidden">
        {/* Decorative Background */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[hsl(var(--gov-blue)/0.02)] rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[hsl(var(--gov-gold)/0.02)] rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl pointer-events-none" />

        <div className="max-w-[1200px] mx-auto relative z-10">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 bg-gradient-to-br from-[hsl(var(--gov-blue))] to-[hsl(var(--gov-blue-dark))] rounded-2xl flex items-center justify-center text-white shadow-xl shadow-[hsl(var(--gov-blue)/0.25)] ring-4 ring-white dark:ring-gray-900 group">
                <Settings className="w-8 h-8 group-hover:rotate-90 transition-transform duration-700" />
              </div>
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-foreground mb-1">
                  {t('title')}
                </h1>
                <p className="text-muted-foreground text-sm font-medium">
                  {t('subtitle')}
                </p>
              </div>
            </div>
            
            <button
              onClick={handleSave}
              disabled={saving || !isSuperAdmin}
              className="gov-btn gov-btn-primary px-8 py-3 h-auto shadow-lg shadow-[hsl(var(--gov-blue)/0.2)] disabled:opacity-50 disabled:grayscale transition-all hover:scale-105 active:scale-95"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
              <span className="font-black uppercase tracking-widest text-xs">
                {saving ? t('saving') : t('save')}
              </span>
            </button>
          </div>

          {!isSuperAdmin && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl flex items-center gap-3 text-amber-700 dark:text-amber-400 mb-8 shadow-sm"
            >
              <AlertCircle size={20} className="shrink-0" />
              <p className="text-sm font-bold">{t('super_admin_only')}</p>
            </motion.div>
          )}

          <div className="grid lg:grid-cols-12 gap-8">
            {/* Tabs Sidebar */}
            <div className="lg:col-span-3 space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl text-sm font-black transition-all group ${
                      isActive
                        ? 'bg-[hsl(var(--gov-blue))] text-white shadow-lg shadow-[hsl(var(--gov-blue)/0.2)] scale-[1.02]'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${isActive ? 'bg-white/20' : 'bg-muted group-hover:bg-background'}`}>
                      <Icon size={18} className={isActive ? 'text-white' : tab.color} />
                    </div>
                    <span className="uppercase tracking-widest text-[11px]">{tab.label}</span>
                    {isActive && <motion.div layoutId="tab-indicator" className="ml-auto w-1.5 h-1.5 bg-white rounded-full" />}
                  </button>
                );
              })}
              
              <div className="mt-8 p-6 bg-blue-50 dark:bg-blue-500/5 rounded-3xl border border-blue-100 dark:border-blue-500/20 shadow-sm">
                <p className="text-[11px] font-bold text-blue-800/60 dark:text-blue-400/60 leading-relaxed italic text-center">
                  "{t('info')}"
                </p>
              </div>
            </div>

            {/* Content Area */}
            <div className="lg:col-span-9">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="gov-card p-8 bg-card/80 backdrop-blur-xl border-dashed min-h-[500px]"
                >
                  {activeTab === 'general' && (
                    <div className="space-y-8">
                      <div className="flex items-center gap-4 mb-2">
                        <div className="w-12 h-12 bg-blue-500/10 text-blue-600 rounded-xl flex items-center justify-center">
                          <Settings size={24} />
                        </div>
                        <h3 className="text-xl font-black text-foreground uppercase tracking-tight">{t('general.title')}</h3>
                      </div>
                      
                      <div className="grid gap-8 max-w-2xl">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">
                            {t('general.platform_name')}
                          </label>
                          <input
                            type="text"
                            dir="auto"
                            disabled={!isSuperAdmin}
                            value={settings.general.nomPlateforme}
                            onChange={(e) => updateSetting('general', 'nomPlateforme', e.target.value)}
                            className="gov-input w-full py-4 text-lg font-bold bg-muted/50 focus:bg-background transition-all"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">
                            {t('general.description')}
                          </label>
                          <textarea
                            rows={4}
                            dir="auto"
                            disabled={!isSuperAdmin}
                            value={settings.general.description}
                            onChange={(e) => updateSetting('general', 'description', e.target.value)}
                            className="gov-textarea w-full py-4 font-medium bg-muted/50 focus:bg-background transition-all resize-none"
                          />
                        </div>

                        <div className="p-6 bg-rose-500/5 rounded-2xl border border-rose-500/10 flex items-center justify-between group hover:bg-rose-500/10 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${settings.general.modeMaintenance ? 'bg-rose-500 text-white animate-pulse' : 'bg-muted text-muted-foreground'}`}>
                              <AlertCircle size={24} />
                            </div>
                            <div>
                              <p className="font-black text-xs uppercase tracking-widest mb-1">{t('general.maintenance_mode')}</p>
                              <p className="text-[11px] text-muted-foreground font-medium">{t('general.enable_maintenance')}</p>
                            </div>
                          </div>
                          <div 
                            onClick={() => isSuperAdmin && updateSetting('general', 'modeMaintenance', !settings.general.modeMaintenance)}
                            className={`w-14 h-8 rounded-full relative cursor-pointer transition-colors duration-300 ${settings.general.modeMaintenance ? 'bg-rose-500' : 'bg-muted'}`}
                          >
                            <motion.div 
                              animate={{ x: settings.general.modeMaintenance ? 24 : 4 }}
                              className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-md"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'notifications' && (
                    <div className="space-y-8">
                      <div className="flex items-center gap-4 mb-2">
                        <div className="w-12 h-12 bg-amber-500/10 text-amber-600 rounded-xl flex items-center justify-center">
                          <Bell size={24} />
                        </div>
                        <h3 className="text-xl font-black text-foreground uppercase tracking-tight">{t('notifications.title')}</h3>
                      </div>
                      
                      <div className="space-y-4 max-w-2xl">
                        {[
                          { id: 'nouvelleReclamation', label: t('notifications.new_reclamation'), desc: t('notifications.new_reclamation_desc') },
                          { id: 'nouvelUtilisateur', label: t('notifications.new_user'), desc: t('notifications.new_user_desc') },
                          { id: 'rapportQuotidien', label: t('notifications.daily_report'), desc: t('notifications.daily_report_desc') },
                        ].map((item) => (
                          <div key={item.id} className="p-6 bg-muted/30 rounded-2xl border border-transparent hover:border-border hover:bg-muted/50 transition-all flex items-center justify-between group">
                            <div className="space-y-1">
                              <p className="font-black text-xs uppercase tracking-widest text-foreground group-hover:text-[hsl(var(--gov-blue))] transition-colors">{item.label}</p>
                              <p className="text-[11px] font-medium text-muted-foreground">{item.desc}</p>
                            </div>
                            <div 
                              onClick={() => isSuperAdmin && updateSetting('notifications', item.id, !settings.notifications[item.id as keyof typeof settings.notifications])}
                              className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors duration-300 ${settings.notifications[item.id as keyof typeof settings.notifications] ? 'bg-emerald-500' : 'bg-muted-foreground/20'}`}
                            >
                              <motion.div 
                                animate={{ x: settings.notifications[item.id as keyof typeof settings.notifications] ? 26 : 2 }}
                                className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeTab === 'security' && (
                    <div className="space-y-8">
                      <div className="flex items-center gap-4 mb-2">
                        <div className="w-12 h-12 bg-purple-500/10 text-purple-600 rounded-xl flex items-center justify-center">
                          <Shield size={24} />
                        </div>
                        <h3 className="text-xl font-black text-foreground uppercase tracking-tight">{t('security.title')}</h3>
                      </div>
                      
                      <div className="grid gap-10 max-w-2xl">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                          <div className="space-y-3">
                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">
                              {t('security.session_duration')}
                            </label>
                            <div className="relative group">
                              <input
                                type="number"
                                dir="ltr"
                                disabled={!isSuperAdmin}
                                value={settings.security.dureeSession}
                                onChange={(e) => updateSetting('security', 'dureeSession', parseInt(e.target.value) || 24)}
                                min={1}
                                max={168}
                                className="gov-input w-full py-4 text-center text-xl font-black bg-muted/50 focus:bg-background transition-all pr-12"
                              />
                              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-muted-foreground uppercase">Hrs</span>
                            </div>
                            <p className="text-[10px] font-medium text-muted-foreground/60 px-1 italic">{t('security.session_desc')}</p>
                          </div>

                          <div className="space-y-3">
                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">
                              {t('security.max_attempts')}
                            </label>
                            <input
                              type="number"
                              dir="ltr"
                              disabled={!isSuperAdmin}
                              value={settings.security.tentativesConnexionMax}
                              onChange={(e) => updateSetting('security', 'tentativesConnexionMax', parseInt(e.target.value) || 5)}
                              min={3}
                              max={10}
                              className="gov-input w-full py-4 text-center text-xl font-black bg-muted/50 focus:bg-background transition-all"
                            />
                          </div>
                        </div>

                        <div className="p-6 bg-purple-500/5 rounded-2xl border border-purple-500/10 flex items-center justify-between hover:bg-purple-500/10 transition-colors group">
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${settings.security.doubleAuthentification ? 'bg-purple-600 text-white shadow-lg' : 'bg-muted text-muted-foreground'}`}>
                              <Shield size={22} className="stroke-[2.5]" />
                            </div>
                            <div>
                              <p className="font-black text-xs uppercase tracking-widest mb-1">{t('security.enable_2fa')}</p>
                              <p className="text-[11px] text-muted-foreground font-medium">Sécurité renforcée pour tous les comptes</p>
                            </div>
                          </div>
                          <div 
                            onClick={() => isSuperAdmin && updateSetting('security', 'doubleAuthentification', !settings.security.doubleAuthentification)}
                            className={`w-14 h-8 rounded-full relative cursor-pointer transition-colors duration-300 ${settings.security.doubleAuthentification ? 'bg-purple-600' : 'bg-muted'}`}
                          >
                            <motion.div 
                              animate={{ x: settings.security.doubleAuthentification ? 24 : 4 }}
                              className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-md"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'email' && (
                    <div className="space-y-8">
                      <div className="flex items-center gap-4 mb-2">
                        <div className="w-12 h-12 bg-emerald-500/10 text-emerald-600 rounded-xl flex items-center justify-center">
                          <Mail size={24} />
                        </div>
                        <h3 className="text-xl font-black text-foreground uppercase tracking-tight">{t('email.title')}</h3>
                      </div>
                      
                      <div className="grid gap-8 max-w-2xl">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">
                            {t('email.sender_email')}
                          </label>
                          <input
                            type="email"
                            dir="ltr"
                            disabled={!isSuperAdmin}
                            value={settings.email.emailEnvoi}
                            onChange={(e) => updateSetting('email', 'emailEnvoi', e.target.value)}
                            className="gov-input w-full py-4 font-bold bg-muted/50 focus:bg-background transition-all"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">
                            {t('email.contact_email')}
                          </label>
                          <input
                            type="email"
                            dir="ltr"
                            disabled={!isSuperAdmin}
                            value={settings.email.emailContact}
                            onChange={(e) => updateSetting('email', 'emailContact', e.target.value)}
                            className="gov-input w-full py-4 font-bold bg-muted/50 focus:bg-background transition-all"
                          />
                        </div>

                        <div className="p-6 bg-blue-500/5 rounded-3xl border border-blue-500/10 flex items-start gap-4">
                          <AlertCircle size={20} className="text-[hsl(var(--gov-blue))] mt-0.5" />
                          <p className="text-[11px] font-bold text-blue-900/60 leading-relaxed italic">
                            {t('email.smtp_note')}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </PermissionGuard>
  );
}
