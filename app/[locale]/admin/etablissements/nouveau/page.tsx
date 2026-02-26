'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  ChevronLeft, 
  Save, 
  Loader2,
  Trash2,
  Plus,
  Image as ImageIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';

export default function NouveauEtablissementPage() {
  const t = useTranslations('admin.establishments');
  const tSectors = useTranslations('admin.news.sectors'); 
  
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nom: '',
    code: '',
    secteur: 'EDUCATION',
    communeId: '',
    annexeId: '',
    adresse: '',
    telephone: '',
    email: '',
    siteWeb: '',
    latitude: '',
    longitude: '',
    description: '',
    capacite: '',
    isPublie: false,
    isValide: true
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/etablissements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          communeId: formData.communeId ? parseInt(formData.communeId) : null,
          capacite: formData.capacite ? parseInt(formData.capacite) : null,
          latitude: formData.latitude ? parseFloat(formData.latitude) : null,
          longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        }),
      });

      const data = await res.json();
      
      if (res.ok && data.success) {
        toast.success(t('actions.save') + ' : ' + (t('actions.success') || 'Succès'));
        router.push('/admin/etablissements');
      } else {
        const errorInfo = data.error || data;
        if (errorInfo.details && Array.isArray(errorInfo.details)) {
          errorInfo.details.forEach((detail: { field: string; message: string }) => {
            toast.error(detail.message);
          });
        } else {
          toast.error(errorInfo.message || 'Erreur');
        }
      }
    } catch (err) {
      console.error('Erreur:', err);
      toast.error('Erreur serveur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <Link 
        href="/admin/etablissements" 
        className="flex items-center gap-2 text-gray-500 hover:text-emerald-600 transition-colors mb-6"
      >
        <ChevronLeft size={20} />
        {t('back_list')}
      </Link>

      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-8 text-white">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
              <Building2 size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{t('create_title')}</h1>
              <p className="text-emerald-50 opacity-90">{t('create_subtitle')}</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          {/* Informations Générales */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <span className="w-1.5 h-6 bg-emerald-500 rounded-full" />
              {t('sections.general')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('form.name')} *</label>
                <input
                  required
                  type="text"
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-emerald-500 dark:text-white transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('form.code')} *</label>
                <input
                  required
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-emerald-500 dark:text-white transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('form.sector')} *</label>
                <select
                  value={formData.secteur}
                  onChange={(e) => setFormData({ ...formData, secteur: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-emerald-500 dark:text-white transition-all"
                >
                  <option value="EDUCATION">{tSectors('EDUCATION')}</option>
                  <option value="SANTE">{tSectors('SANTE')}</option>
                  <option value="SPORT">{tSectors('SPORT')}</option>
                  <option value="SOCIAL">{tSectors('SOCIAL')}</option>
                  <option value="CULTUREL">{tSectors('CULTUREL')}</option>
                  <option value="AUTRE">{tSectors('AUTRE')}</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('form.capacity')}</label>
                <input
                  type="number"
                  value={formData.capacite}
                  onChange={(e) => setFormData({ ...formData, capacite: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-emerald-500 dark:text-white transition-all"
                />
              </div>
            </div>
          </section>

          {/* Localisation */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <span className="w-1.5 h-6 bg-blue-500 rounded-full" />
              {t('sections.localization')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('form.commune')} *</label>
                <select
                  required
                  value={formData.communeId}
                  onChange={(e) => setFormData({ ...formData, communeId: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-emerald-500 dark:text-white transition-all"
                >
                  <option value="">{t('form.select_commune')}</option>
                  <option value="1">Médiouna</option>
                  <option value="2">Tit Mellil</option>
                  <option value="3">Lahraouyine</option>
                  <option value="4">Sidi Hajjaj Oued Hassar</option>
                  <option value="5">Mejatia Oulad Taleb</option>
                  <option value="6">Al Majat</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('form.address')}</label>
                <input
                  type="text"
                  value={formData.adresse}
                  onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-emerald-500 dark:text-white transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('form.latitude')}</label>
                <input
                  type="text"
                  value={formData.latitude}
                  onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-emerald-500 dark:text-white transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('form.longitude')}</label>
                <input
                  type="text"
                  value={formData.longitude}
                  onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-emerald-500 dark:text-white transition-all"
                />
              </div>
            </div>
          </section>

          {/* Contact */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <span className="w-1.5 h-6 bg-purple-500 rounded-full" />
              {t('sections.contact')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('form.email')}</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-emerald-500 dark:text-white transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('form.phone')}</label>
                <input
                  type="tel"
                  value={formData.telephone}
                  onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-emerald-500 dark:text-white transition-all"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('form.website')}</label>
                <input
                  type="url"
                  value={formData.siteWeb}
                  onChange={(e) => setFormData({ ...formData, siteWeb: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-emerald-500 dark:text-white transition-all"
                />
              </div>
            </div>
          </section>

          {/* Description */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <span className="w-1.5 h-6 bg-amber-500 rounded-full" />
              {t('sections.description')}
            </h2>
            <div className="space-y-2">
              <textarea
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-emerald-500 dark:text-white transition-all resize-none"
                placeholder={t('form.description_placeholder')}
              />
            </div>
          </section>

          {/* Options */}
          <section className="pt-6 border-t border-gray-100 dark:border-gray-700 flex flex-wrap items-center gap-6">
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={formData.isPublie}
                onChange={(e) => setFormData({ ...formData, isPublie: e.target.checked })}
                className="w-5 h-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-emerald-600 transition-colors">{t('form.publish_now')}</span>
            </label>
          </section>

          {/* Footer Actions */}
          <div className="pt-8 flex items-center justify-end gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 text-gray-600 dark:text-gray-400 font-medium hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all"
            >
              {t('actions.cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-200 dark:shadow-emerald-900/30 hover:shadow-xl hover:scale-[1.02] transition-all flex items-center gap-2 disabled:opacity-50 disabled:scale-100"
            >
              {loading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <Save size={20} />
              )}
              {t('actions.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
