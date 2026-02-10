'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { Save, Eye, Layout, AlertCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface Config {
  isActive: boolean;
  title: string;
  message: string;
  showOncePerSession: boolean;
}

export default function AnnouncementSettingsPage() {
  const t = useTranslations();
  const [config, setConfig] = useState<Config>({
    isActive: false,
    title: '',
    message: '',
    showOncePerSession: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/settings/announcement')
      .then(res => res.json())
      .then(data => {
        setConfig(data);
        setLoading(false);
      })
      .catch(() => {
        toast.error(t('admin_announcement.toasts.load_error'));
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/settings/announcement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      
      if (res.ok) {
        toast.success(t('admin_announcement.toasts.success'));
      } else {
        const error = await res.json();
        toast.error(error.error || t('admin_announcement.toasts.save_error'));
      }
    } catch (e) {
      toast.error(t('admin_announcement.toasts.server_error'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Layout className="w-8 h-8 text-blue-600" />
            {t('admin_announcement.title')}
          </h1>
          <p className="text-gray-500 mt-1">
            {t('admin_announcement.description')}
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 transition-all shadow-lg shadow-blue-600/20"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {t('admin_announcement.save')}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Colonne Gauche : Formulaire */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold mb-6">{t('admin_announcement.general_settings')}</h3>
            
            {/* Toggle Active */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl mb-6">
              <div>
                <label className="font-medium text-gray-900">{t('admin_announcement.activate')}</label>
                <p className="text-sm text-gray-500">{t('admin_announcement.activate_desc')}</p>
              </div>
              <button
                onClick={() => setConfig({ ...config, isActive: !config.isActive })}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                  config.isActive ? 'bg-green-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                    config.isActive ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Titre */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('admin_announcement.message_title')}
              </label>
              <input
                type="text"
                value={config.title}
                onChange={(e) => setConfig({ ...config, title: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold text-gray-800"
                placeholder={t('admin_announcement.title_placeholder')}
              />
            </div>

            {/* Message */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('admin_announcement.message_content')}
              </label>
              <textarea
                value={config.message}
                onChange={(e) => setConfig({ ...config, message: e.target.value })}
                rows={6}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                placeholder={t('admin_announcement.content_placeholder')}
              />
              <p className="text-xs text-gray-400 mt-2 text-right">
                {t('admin_announcement.line_breaks_info')}
              </p>
            </div>

            {/* Option Show Once */}
            <div className="flex items-center gap-3 mt-4">
              <input
                type="checkbox"
                id="showOnce"
                checked={config.showOncePerSession}
                onChange={(e) => setConfig({ ...config, showOncePerSession: e.target.checked })}
                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
              />
              <label htmlFor="showOnce" className="text-sm text-gray-700 select-none cursor-pointer">
                {t('admin_announcement.show_once')}
              </label>
            </div>
          </div>
        </div>

        {/* Colonne Droite : Prévisualisation */}
        <div className="lg:col-span-1">
          <div className="sticky top-6">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">
              {t('admin_announcement.preview')}
            </h3>
            
            <div className="bg-gray-900 rounded-[2rem] p-4 shadow-xl border-4 border-gray-800 relative aspect-[9/16] lg:aspect-auto lg:h-[600px] overflow-hidden">
               {/* Simulation écran tel */}
               <div className="absolute top-0 left-0 right-0 h-6 bg-black z-20 flex justify-center">
                 <div className="w-20 h-4 bg-black rounded-b-xl"></div>
               </div>
               
               {/* Contenu fake du site */}
               <div className="absolute inset-0 bg-gray-100 pt-8 px-4 opacity-50 overflow-hidden">
                  <div className="h-12 bg-blue-900 rounded-lg mb-4 w-full"></div>
                  <div className="h-40 bg-gray-300 rounded-lg mb-4 w-full"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
               </div>

               {/* La Modale (Simulée) */}
               {config.isActive && (
                 <div className="absolute inset-0 z-10 flex items-center justify-center p-4 bg-black/60 backdrop-blur-[2px]">
                    <div className="bg-white rounded-2xl w-full p-4 shadow-2xl scale-90 origin-center">
                       <div className="w-12 h-12 bg-gray-100 rounded-xl mx-auto mb-3 flex items-center justify-center">
                         <div className="text-[10px]">LOGO</div>
                       </div>
                       <div className="text-center">
                          <h4 className="font-bold text-gray-900 text-lg mb-1">{config.title || t('admin_announcement.message_title')}</h4>
                          <p className="text-xs text-gray-600 line-clamp-6 whitespace-pre-wrap">
                            {config.message || t('admin_announcement.content_placeholder')}
                          </p>
                          <div className="mt-4">
                             <div className="bg-blue-900 text-white text-xs py-2 rounded-lg font-bold">
                               {t('admin_announcement.preview_btn')}
                             </div>
                          </div>
                       </div>
                    </div>
                 </div>
               )}

               {!config.isActive && (
                 <div className="absolute inset-0 z-10 flex items-center justify-center">
                    <div className="bg-black/50 text-white px-4 py-2 rounded-lg backdrop-blur text-sm">
                      {t('admin_announcement.popup_inactive')}
                    </div>
                 </div>
               )}
            </div>
            
            <p className="text-xs text-gray-500 mt-4 text-center">
              {t('admin_announcement.preview_note')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
