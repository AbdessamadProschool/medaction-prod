'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTranslations } from 'next-intl';
import { 
  Megaphone, 
  Image as ImageIcon, 
  Save, 
  X, 
  Calendar,
  Target,
  Palette,
  Loader2,
  ArrowRight,
  AlignLeft,
  MapPin,
  Users,
  LayoutTemplate,
  AlertCircle
} from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { toast } from 'sonner';

export default function NouvelleCampagnePage() {
  const t = useTranslations('delegation.dashboard.campaigns.creation');
  const tTypes = useTranslations('delegation.dashboard.campaigns.types');
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  // Image state
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const campagneSchema = z.object({
    titre: z.string().min(5, t('validation.title_min')).max(100),
    nom: z.string().min(2, t('validation.title_min')),
    description: z.string().min(20, t('validation.description_min')).optional(),
    contenu: z.string().min(20, t('validation.description_min')),
    type: z.string().min(1, t('validation.type_required')),
    objectifParticipations: z.string().optional(),
    dateDebut: z.string().min(1, t('validation.start_date_required')),
    dateFin: z.string().optional(),
    lieu: z.string().optional(),
    couleurTheme: z.string().optional(),
  });

  type CampagneForm = z.infer<typeof campagneSchema>;

  const { register, handleSubmit, formState: { errors }, watch } = useForm<CampagneForm>({
    resolver: zodResolver(campagneSchema),
    defaultValues: {
      couleurTheme: '#10b981'
    }
  });

  const watchedType = watch('type');

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        toast.error(t('errors.upload_failed'));
        return;
      }
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const onSubmit = async (data: CampagneForm) => {
    setLoading(true);
    try {
      let imageUrl = null;

      // Upload image
      if (selectedImage) {
        const formData = new FormData();
        formData.append('file', selectedImage);
        formData.append('type', 'CAMPAGNE');

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!uploadRes.ok) throw new Error(t('errors.upload_failed'));
        const uploadData = await uploadRes.json();
        imageUrl = uploadData.url;
      }

      const res = await fetch('/api/delegation/campagnes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            ...data,
            objectifParticipations: data.objectifParticipations ? parseInt(data.objectifParticipations) : null,
            imagePrincipale: imageUrl
        }),
      });

      if (res.ok) {
        toast.success(t('success.created'));
        router.push('/delegation/campagnes');
        router.refresh();
      } else {
        const err = await res.json();
        toast.error(err.error || t('errors.create_failed'));
      }
    } catch (error) {
      console.error(error);
      toast.error(t('errors.create_failed'));
    } finally {
      setLoading(false);
    }
  };

  const typeColors: Record<string, string> = {
    SANTE: 'from-red-500 to-rose-500',
    ENVIRONNEMENT: 'from-green-500 to-emerald-500',
    EDUCATION: 'from-blue-500 to-indigo-500',
    SOCIAL: 'from-orange-500 to-amber-500',
    SOLIDARITE: 'from-purple-500 to-violet-500',
    ECOLOGIE: 'from-lime-500 to-green-500',
    CITOYENNETE: 'from-cyan-500 to-teal-500',
    AUTRE: 'from-gray-500 to-gray-600',
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-4">
        
        {/* Header */}
        <div className="mb-5 relative">
          <Link 
            href="/delegation/campagnes"
            className="inline-flex items-center gap-2 text-gray-500 hover:text-green-600 mb-3 transition-colors group font-bold text-sm"
          >
            <ArrowRight size={20} className="rtl:rotate-0 rotate-180 group-hover:translate-x-[-4px] rtl:group-hover:translate-x-[4px] transition-transform" />
            <span>{t('back_to_list')}</span>
          </Link>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-gray-100">
             <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-50 rounded-full border border-green-100">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    <span className="text-xs font-bold text-green-700 uppercase tracking-wider">{t('subtitle')}</span>
                </div>
                <h1 className="text-2xl font-black text-gray-900 tracking-tight leading-tight">
                    {t('title')}
                </h1>
             </div>
             <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/30 transform -rotate-3">
                <Megaphone className="w-5 h-5 text-white" />
             </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          
          {/* Image de couverture */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden group hover:shadow-md transition-all duration-300">
            <div className="px-5 py-3 border-b border-gray-50 bg-gradient-to-r rtl:bg-gradient-to-l from-green-50/50 to-transparent">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                {t('sections.cover.title')}
              </h2>
            </div>
            
            <div className="p-4">
              {previewUrl ? (
                <div className="relative w-full h-48 bg-gray-100 rounded-xl overflow-hidden group shadow-inner border border-gray-100">
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedImage(null);
                        setPreviewUrl(null);
                      }}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-bold shadow-lg flex items-center gap-2 text-sm"
                    >
                      <X size={20} />
                      حذف
                    </button>
                  </div>
                  <div className="absolute bottom-4 right-4 rtl:right-auto rtl:left-4 bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl text-white text-sm font-bold shadow-lg">
                      {t('sections.cover.selected')}
                  </div>
                </div>
              ) : (
                <label className="relative flex flex-col items-center justify-center h-40 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50 hover:bg-green-50/50 hover:border-green-300 transition-all cursor-pointer group overflow-hidden">
                  <div className="w-14 h-14 bg-white rounded-full shadow-md flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                    <ImageIcon className="w-6 h-6 text-gray-400 group-hover:text-green-500 transition-colors" />
                  </div>
                  <p className="text-sm font-bold text-gray-700 mb-1 group-hover:text-green-700 transition-colors">{t('sections.cover.click_to_add')}</p>
                  <p className="text-xs text-gray-400">{t('sections.cover.formats')}</p>
                  <input 
                    type="file" 
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                </label>
              )}
            </div>
          </div>

          {/* Informations générales */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-300">
            <div className="px-5 py-3 border-b border-gray-50 bg-gradient-to-r rtl:bg-gradient-to-l from-indigo-50/50 to-transparent">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                {t('sections.general.title')}
              </h2>
            </div>
            
            <div className="p-5 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                {/* Type */}
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-gray-700 text-start">
                    {t('sections.general.type')} <span className="text-red-500">*</span>
                  </label>
                  <select
                    {...register('type')}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none bg-white font-bold text-gray-800 text-sm appearance-none cursor-pointer transition-all text-start"
                  >
                    <option value="">{t('sections.general.type_placeholder')}</option>
                    <option value="SANTE">{tTypes('sante')}</option>
                    <option value="ENVIRONNEMENT">{tTypes('environnement')}</option>
                    <option value="EDUCATION">{tTypes('education')}</option>
                    <option value="SOCIAL">{tTypes('social')}</option>
                    <option value="AUTRE">{tTypes('autre')}</option>
                  </select>
                  {errors.type && <p className="text-red-500 text-sm font-medium mt-2 text-start">⚠️ {errors.type.message}</p>}
                </div>

                {/* Nom court */}
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-gray-700 text-start">
                    الاسم المختصر <span className="text-red-500">*</span>
                  </label>
                  <div className="relative group">
                    <input
                      {...register('nom')}
                      type="text"
                      placeholder="مثال: شتاء التضامن 2025"
                      className="w-full px-4 py-3 pr-12 rtl:pr-12 rtl:pl-4 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all text-sm font-bold placeholder:text-gray-300 placeholder:font-normal bg-gray-50/50 focus:bg-white text-start"
                    />
                    <div className="absolute right-5 rtl:right-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors pointer-events-none">
                      <LayoutTemplate size={20} />
                    </div>
                  </div>
                  {errors.nom && <p className="text-red-500 text-sm font-medium bg-red-50 p-2 rounded-lg max-w-fit px-4 text-start">⚠️ {errors.nom.message}</p>}
                </div>
              </div>

              {/* Titre public */}
              <div className="space-y-2">
                  <label className="block text-sm font-bold text-gray-700 text-start">
                    {t('sections.general.campaign_title')} <span className="text-red-500">*</span>
                  </label>
                <div className="relative group">
                  <input
                    {...register('titre')}
                    type="text"
                    placeholder={t('sections.general.campaign_title_placeholder')}
                    className="w-full px-4 py-3 pr-12 rtl:pr-12 rtl:pl-4 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all text-sm font-bold placeholder:text-gray-300 placeholder:font-normal bg-gray-50/50 focus:bg-white text-start"
                  />
                    <div className="absolute right-5 rtl:right-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors pointer-events-none">
                      <Megaphone size={20} />
                    </div>
                </div>
                {errors.titre && <p className="text-red-500 text-sm font-medium bg-red-50 p-2 rounded-lg max-w-fit px-4 text-start">⚠️ {errors.titre.message}</p>}
              </div>

              {/* Description */}
              <div className="space-y-2">
                  <label className="block text-sm font-bold text-gray-700 text-start">
                    {t('sections.general.description')}
                  </label>
                <textarea
                  {...register('description')}
                  rows={2}
                  placeholder={t('sections.general.description_placeholder')}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all text-sm font-bold placeholder:text-gray-300 bg-gray-50/50 focus:bg-white text-start resize-none"
                />
              </div>

              {/* Contenu détaillé */}
              <div className="space-y-2">
                  <label className="block text-sm font-bold text-gray-700 text-start">
                    المحتوى التفصيلي <span className="text-red-500">*</span>
                  </label>
                <textarea
                  {...register('contenu')}
                  rows={4}
                  placeholder="شرح تفصيلي للحملة..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all text-sm font-bold placeholder:text-gray-300 leading-relaxed bg-gray-50/50 focus:bg-white text-start"
                />
                {errors.contenu && <p className="text-red-500 text-sm font-medium bg-red-50 p-2 rounded-lg max-w-fit px-4 text-start">⚠️ {errors.contenu.message}</p>}
              </div>
            </div>
          </div>

          {/* Date et Lieu */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-300">
            <div className="px-5 py-3 border-b border-gray-50 bg-gradient-to-r rtl:bg-gradient-to-l from-amber-50/50 to-transparent">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                {t('sections.datetime.title')}
              </h2>
            </div>
            
            <div className="p-5 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <label className="block text-sm font-bold text-gray-700 text-start">
                    {t('sections.datetime.start_date')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('dateDebut')}
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 outline-none font-bold text-gray-700 cursor-pointer bg-gray-50/50 focus:bg-white text-sm text-start"
                  />
                  {errors.dateDebut && <p className="text-red-500 text-sm mt-2 font-medium flex items-center gap-2 ltr:flex-row-reverse text-start"><AlertCircle className="w-4 h-4" /> {errors.dateDebut.message}</p>}
                </div>
                <div className="space-y-3">
                  <label className="block text-sm font-bold text-gray-700 text-start">{t('sections.datetime.end_date')}</label>
                  <input
                    {...register('dateFin')}
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 outline-none font-bold text-gray-700 cursor-pointer bg-gray-50/50 focus:bg-white text-sm text-start"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-bold text-gray-700 text-start">
                  {t('sections.datetime.location')}
                </label>
                <div className="relative">
                  <input
                    {...register('lieu')}
                    type="text"
                    placeholder={t('sections.datetime.location_placeholder')}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 outline-none font-bold bg-gray-50/50 focus:bg-white text-sm text-start"
                  />
                  <div className="absolute left-6 rtl:left-auto rtl:right-6 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                    <MapPin size={20} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Objectifs */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-300">
            <div className="px-5 py-3 border-b border-gray-50 bg-gradient-to-r rtl:bg-gradient-to-l from-purple-50/50 to-transparent">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                {t('sections.objectives.title')}
              </h2>
            </div>
            
            <div className="p-5">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <label className="block text-sm font-bold text-gray-700 text-start">
                    {t('sections.objectives.target_participants')}
                  </label>
                  <div className="relative group">
                    <input
                      {...register('objectifParticipations')}
                      type="number"
                      placeholder={t('sections.objectives.target_placeholder')}
                      className="w-full px-4 py-3 pr-12 rtl:pr-12 rtl:pl-4 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 outline-none font-bold transition-all text-sm bg-gray-50/50 focus:bg-white text-start"
                    />
                    <div className="absolute right-4 rtl:right-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-purple-500 transition-colors pointer-events-none">
                      <Users size={18} />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-bold text-gray-700 text-start">
                    لون الحملة
                  </label>
                  <div className="flex gap-4">
                    <input
                      {...register('couleurTheme')}
                      type="color"
                      className="h-10 w-14 rounded-lg border border-gray-200 cursor-pointer"
                    />
                    <input
                      {...register('couleurTheme')}
                      type="text"
                      className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 outline-none font-mono uppercase text-sm font-bold bg-gray-50/50 focus:bg-white text-start"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-5 border-t border-gray-200">
            <Link
              href="/delegation/campagnes"
              className="px-6 py-3 text-gray-500 hover:text-gray-900 font-bold text-sm transition-colors hover:bg-gray-100 rounded-xl"
            >
              {t('actions.cancel')}
            </Link>
            
            <button
              type="submit"
              disabled={loading}
              className={`px-8 py-3 bg-gradient-to-r ${watchedType ? typeColors[watchedType] || 'from-green-600 to-emerald-600' : 'from-green-600 to-emerald-600'} text-white rounded-xl hover:shadow-lg hover:-translate-y-0.5 transition-all shadow-lg shadow-green-500/30 font-bold text-sm flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0`}
            >
              {loading ? (
                <>
                  <Loader2 size={24} className="animate-spin" />
                  {t('actions.creating')}
                </>
              ) : (
                <>
                  <Save size={24} />
                  {t('actions.create')}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
