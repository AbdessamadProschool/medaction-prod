'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import dynamicImport from 'next/dynamic';
import { useTranslations } from 'next-intl';

// Import dynamique de la carte pour éviter les erreurs SSR
const ContactMap = dynamicImport(() => import('@/components/contact/ContactMap'), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-gray-100 animate-pulse rounded-2xl" />
});

export default function ContactPage() {
  const t = useTranslations('contact_page');
  const [formData, setFormData] = useState({
    nom: '',
    email: '',
    sujet: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulation d'envoi
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setSuccess(true);
    setLoading(false);
    setFormData({ nom: '', email: '', sujet: '', message: '' });
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="bg-gradient-to-br from-[hsl(213,80%,20%)] to-[hsl(213,80%,30%)] py-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/images/pattern.svg')] opacity-10" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            {t('title')}
          </h1>
          <p className="text-xl text-[hsl(45,93%,70%)] max-w-2xl mx-auto">
            {t('subtitle')}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Formulaire */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('form_title')}</h2>
            
            {success ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
                  ✓
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{t('success_title')}</h3>
                <p className="text-gray-600 mb-6">{t('success_message')}</p>
                <button 
                  onClick={() => setSuccess(false)}
                  className="text-emerald-600 font-medium hover:underline"
                >
                  {t('send_another')}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('name_label')}</label>
                  <input
                    type="text"
                    required
                    value={formData.nom}
                    onChange={e => setFormData({...formData, nom: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                    placeholder={t('name_placeholder')}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('email_label')}</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                    placeholder={t('email_placeholder')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('subject_label')}</label>
                  <select
                    required
                    value={formData.sujet}
                    onChange={e => setFormData({...formData, sujet: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                  >
                    <option value="">{t('subject_placeholder')}</option>
                    <option value="info">{t('subjects.info')}</option>
                    <option value="tech">{t('subjects.tech')}</option>
                    <option value="partenariat">{t('subjects.partenariat')}</option>
                    <option value="autre">{t('subjects.autre')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('message_label')}</label>
                  <textarea
                    required
                    rows={5}
                    value={formData.message}
                    onChange={e => setFormData({...formData, message: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                    placeholder={t('message_placeholder')}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50 shadow-lg shadow-emerald-200"
                >
                  {loading ? t('sending') : t('submit_btn')}
                </button>
              </form>
            )}
          </div>

          {/* Infos & Carte */}
          <div className="space-y-8">
            {/* Coordonnées */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-6">{t('coords_title')}</h3>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center flex-shrink-0 text-xl">
                    📍
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{t('address_label')}</p>
                    <p className="text-gray-600">{t('address_value')}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0 text-xl">
                    📞
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{t('phone_label')}</p>
                    <p className="text-gray-600">{t('phone_value')}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center flex-shrink-0 text-xl">
                    ✉️
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{t('email_contact_label')}</p>
                    <p className="text-gray-600">{t('email_contact_value')}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Carte */}
            <div className="h-80 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative z-0">
              <ContactMap />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
