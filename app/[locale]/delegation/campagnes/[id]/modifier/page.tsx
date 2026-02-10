'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
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
  Loader2,
  ArrowRight,
  Trash2,
  AlignLeft,
  MapPin,
  Users,
  LayoutTemplate
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function ModifierCampagnePage() {
  const t = useTranslations('delegation.dashboard.campaigns.edit_page');
  const tCreate = useTranslations('delegation.dashboard.campaigns.creation');
  const tTypes = useTranslations('delegation.dashboard.campaigns.types');
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Image state
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);

  const campagneSchema = z.object({
    titre: z.string().min(5, tCreate('validation.title_min')).max(100),
    nom: z.string().min(2, tCreate('validation.title_min')),
    description: z.string().optional(),
    contenu: z.string().min(20, tCreate('validation.description_min')),
    type: z.string().min(1, tCreate('validation.type_required')),
    objectifParticipations: z.string().optional(),
    dateDebut: z.string().optional(),
    dateFin: z.string().optional(),
    lieu: z.string().optional(),
    couleurTheme: z.string().optional(),
  });

  type CampagneForm = z.infer<typeof campagneSchema>;

  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm<CampagneForm>({
    resolver: zodResolver(campagneSchema),
  });

  const watchedType = watch('type');

  // Charger la campagne existante
  useEffect(() => {
    if (!id) return;
    
    fetch(`/api/delegation/campagnes/${id}`)
      .then(res => res.json())
      .then(data => {
        if (data.data) {
          const camp = data.data;
          
          // Pré-remplir le formulaire
          reset({
            nom: camp.nom,
            titre: camp.titre,
            description: camp.description || '',
            contenu: camp.contenu,
            type: camp.type,
            objectifParticipations: camp.objectifParticipations?.toString() || '',
            dateDebut: camp.dateDebut ? new Date(camp.dateDebut).toISOString().split('T')[0] : '',
            dateFin: camp.dateFin ? new Date(camp.dateFin).toISOString().split('T')[0] : '',
            lieu: camp.lieu || '',
            couleurTheme: camp.couleurTheme || '#10b981',
          });
          
          // Image actuelle
          if (camp.imagePrincipale) {
            setCurrentImageUrl(camp.imagePrincipale);
          }
        } else {
          setError(t('errors.not_found'));
        }
      })
      .catch(err => {
        console.error(err);
        setError(t('errors.update_failed'));
      })
      .finally(() => setLoading(false));
  }, [id, reset, t]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        toast.error(tCreate('errors.upload_failed'));
        return;
      }
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setPreviewUrl(null);
    setCurrentImageUrl(null);
  };

  const onSubmit = async (data: CampagneForm) => {
    setSaving(true);
    try {
      let imageUrl = currentImageUrl;

      // Upload nouvelle image si sélectionnée
      if (selectedImage) {
        const formData = new FormData();
        formData.append('file', selectedImage);
        formData.append('type', 'CAMPAGNE');

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!uploadRes.ok) throw new Error(tCreate('errors.upload_failed'));
        const uploadData = await uploadRes.json();
        imageUrl = uploadData.url;
      }

      const res = await fetch(`/api/delegation/campagnes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          objectifParticipations: data.objectifParticipations ? parseInt(data.objectifParticipations) : null,
          imagePrincipale: imageUrl
        }),
      });

      if (res.ok) {
        toast.success(t('success.updated'));
        router.push('/delegation/campagnes');
        router.refresh();
      } else {
        const err = await res.json();
        toast.error(err.error || t('errors.update_failed'));
      }
    } catch (error) {
      console.error(error);
      toast.error(t('errors.update_failed'));
    } finally {
      setSaving(false);
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-green-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6" dir="rtl">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
          <X className="w-10 h-10 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-700">{error}</h1>
        <Link 
          href="/delegation/campagnes" 
          className="px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-700 font-bold transition-colors"
        >
          {t('back_to_list')}
        </Link>
      </div>
    );
  }

  const displayImage = previewUrl || currentImageUrl;

  return (
    <div className="min-h-screen font-sans text-right" dir="rtl">
      <div className="max-w-5xl mx-auto px-4 py-8">
        
        {/* Header */}
        <div className="mb-10 relative">
          <Link 
            href="/delegation/campagnes"
            className="inline-flex items-center gap-2 text-gray-500 hover:text-green-600 mb-6 transition-colors group font-bold"
          >
            <ArrowRight size={20} className="group-hover:-translate-x-1 transition-transform" />
            <span>{t('back_to_list')}</span>
          </Link>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-gray-100">
             <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 rounded-full border border-amber-100">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                    <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">{t('subtitle')}</span>
                </div>
                <h1 className="text-4xl font-black text-gray-900 tracking-tight leading-tight">
                    {t('title')}
                </h1>
             </div>
             <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/30 transform -rotate-3">
                <Megaphone className="w-8 h-8 text-white" />
             </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          
          {/* Image de couverture */}
          <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden group hover:shadow-xl transition-all duration-300">
            <div className="p-8 border-b border-gray-50 bg-gradient-to-l from-green-50/50 to-transparent">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                <div className="p-2.5 bg-green-100 rounded-xl text-green-600 shadow-sm">
                   <ImageIcon className="w-6 h-6" />
                </div>
                {tCreate('sections.cover.title')}
              </h2>
            </div>
            
            <div className="p-8">
              {displayImage ? (
                <div className="relative w-full h-72 bg-gray-100 rounded-[1.5rem] overflow-hidden group shadow-inner border border-gray-100">
                  <img src={displayImage} alt="Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 backdrop-blur-sm">
                    <label className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 cursor-pointer font-bold shadow-lg flex items-center gap-2">
                      تغيير
                      <input 
                        type="file" 
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageChange}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={removeImage}
                      className="p-3 bg-red-500 text-white rounded-xl hover:bg-red-600 shadow-lg"
                    >
                      <Trash2 size={22} />
                    </button>
                  </div>
                </div>
              ) : (
                <label className="relative flex flex-col items-center justify-center h-72 border-3 border-dashed border-gray-200 rounded-[1.5rem] bg-gray-50/50 hover:bg-green-50/50 hover:border-green-300 transition-all cursor-pointer group overflow-hidden">
                  <div className="w-20 h-20 bg-white rounded-full shadow-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 ring-4 ring-gray-50 group-hover:ring-green-50">
                    <ImageIcon className="w-10 h-10 text-gray-400 group-hover:text-green-500 transition-colors" />
                  </div>
                  <p className="text-xl font-bold text-gray-700 mb-2 group-hover:text-green-700 transition-colors">{tCreate('sections.cover.click_to_add')}</p>
                  <p className="text-gray-400 font-medium">{tCreate('sections.cover.formats')}</p>
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
          <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300">
            <div className="p-8 border-b border-gray-50 bg-gradient-to-l from-indigo-50/50 to-transparent">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                 <div className="p-2.5 bg-indigo-100 rounded-xl text-indigo-600 shadow-sm">
                   <AlignLeft className="w-6 h-6" />
                 </div>
                 {tCreate('sections.general.title')}
              </h2>
            </div>
            
            <div className="p-8 space-y-8">
              <div className="grid md:grid-cols-2 gap-8">
                {/* Type */}
                <div className="space-y-4">
                  <label className="block text-lg font-bold text-gray-900 text-right" style={{ textAlign: 'right' }}>
                    {tCreate('sections.general.type')} <span className="text-red-500 text-lg">*</span>
                  </label>
                  <select
                    {...register('type')}
                    className="w-full px-6 py-5 rounded-2xl border-2 border-gray-100 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none bg-white font-bold text-gray-800 text-lg appearance-none cursor-pointer transition-all"
                  >
                    <option value="">{tCreate('sections.general.type_placeholder')}</option>
                    <option value="SANTE">🏥 {tTypes('sante')}</option>
                    <option value="ENVIRONNEMENT">🌿 {tTypes('environnement')}</option>
                    <option value="EDUCATION">📚 {tTypes('education')}</option>
                    <option value="SOCIAL">🤝 {tTypes('social')}</option>
                    <option value="AUTRE">📌 {tTypes('autre')}</option>
                  </select>
                  {errors.type && <p className="text-red-500 text-sm font-medium mt-2 text-right">⚠️ {errors.type.message}</p>}
                </div>

                {/* Nom court */}
                <div className="space-y-4">
                  <label className="block text-lg font-bold text-gray-900 text-right" style={{ textAlign: 'right' }}>
                    الاسم المختصر <span className="text-red-500 text-lg">*</span>
                  </label>
                  <div className="relative group">
                    <input
                      {...register('nom')}
                      type="text"
                      dir="rtl"
                      placeholder="مثال: شتاء التضامن 2025"
                      className="w-full px-6 py-5 pr-16 rounded-2xl border-2 border-gray-100 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all text-xl font-bold placeholder:text-gray-300 placeholder:font-normal bg-gray-50/50 focus:bg-white text-right"
                    />
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors pointer-events-none">
                      <LayoutTemplate size={26} />
                    </div>
                  </div>
                  {errors.nom && <p className="text-red-500 text-sm font-medium bg-red-50 p-2 rounded-lg max-w-fit px-4 text-right">⚠️ {errors.nom.message}</p>}
                </div>
              </div>

              {/* Titre public */}
              <div className="space-y-4">
                <label className="block text-lg font-bold text-gray-900 text-right" style={{ textAlign: 'right' }}>
                  {tCreate('sections.general.campaign_title')} <span className="text-red-500 text-lg">*</span>
                </label>
                <div className="relative group">
                  <input
                    {...register('titre')}
                    type="text"
                    dir="rtl"
                    placeholder={tCreate('sections.general.campaign_title_placeholder')}
                    className="w-full px-6 py-5 pr-16 rounded-2xl border-2 border-gray-100 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all text-xl font-bold placeholder:text-gray-300 placeholder:font-normal bg-gray-50/50 focus:bg-white text-right"
                  />
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors pointer-events-none">
                    <Megaphone size={26} />
                  </div>
                </div>
                {errors.titre && <p className="text-red-500 text-sm font-medium bg-red-50 p-2 rounded-lg max-w-fit px-4 text-right">⚠️ {errors.titre.message}</p>}
              </div>

              {/* Description */}
              <div className="space-y-4">
                <label className="block text-lg font-bold text-gray-900 text-right" style={{ textAlign: 'right' }}>
                  {tCreate('sections.general.description')}
                </label>
                <textarea
                  {...register('description')}
                  rows={3}
                  dir="rtl"
                  placeholder={tCreate('sections.general.description_placeholder')}
                  className="w-full px-6 py-5 rounded-2xl border-2 border-gray-100 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all text-lg font-medium placeholder:text-gray-300 bg-gray-50/50 focus:bg-white text-right"
                />
              </div>

              {/* Contenu détaillé */}
              <div className="space-y-4">
                <label className="block text-lg font-bold text-gray-900 text-right" style={{ textAlign: 'right' }}>
                  المحتوى التفصيلي <span className="text-red-500 text-lg">*</span>
                </label>
                <textarea
                  {...register('contenu')}
                  rows={6}
                  dir="rtl"
                  placeholder="شرح تفصيلي للحملة..."
                  className="w-full px-6 py-5 rounded-2xl border-2 border-gray-100 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all text-lg font-medium placeholder:text-gray-300 leading-relaxed bg-gray-50/50 focus:bg-white text-right"
                />
                {errors.contenu && <p className="text-red-500 text-sm font-medium bg-red-50 p-2 rounded-lg max-w-fit px-4">⚠️ {errors.contenu.message}</p>}
              </div>
            </div>
          </div>

          {/* Date et Lieu */}
          <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300">
            <div className="p-8 border-b border-gray-50 bg-gradient-to-l from-amber-50/50 to-transparent">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                 <div className="p-2.5 bg-amber-100 rounded-xl text-amber-600 shadow-sm">
                   <Calendar className="w-6 h-6" />
                 </div>
                 {tCreate('sections.datetime.title')}
              </h2>
            </div>
            
            <div className="p-8 space-y-8">
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="block text-base font-bold text-gray-800 text-right" style={{ textAlign: 'right' }}>
                    {tCreate('sections.datetime.start_date')}
                  </label>
                  <input
                    {...register('dateDebut')}
                    type="date"
                    className="w-full px-6 py-4 rounded-2xl border-2 border-gray-100 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none font-bold text-gray-700 shadow-sm cursor-pointer"
                  />
                </div>
                <div className="space-y-3">
                  <label className="block text-base font-bold text-gray-800 text-right" style={{ textAlign: 'right' }}>{tCreate('sections.datetime.end_date')}</label>
                  <input
                    {...register('dateFin')}
                    type="date"
                    className="w-full px-6 py-4 rounded-2xl border-2 border-gray-100 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none font-bold text-gray-700 shadow-sm cursor-pointer"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-base font-bold text-gray-800 text-right" style={{ textAlign: 'right' }}>
                  {tCreate('sections.datetime.location')}
                </label>
                <div className="relative">
                  <input
                    {...register('lieu')}
                    type="text"
                    dir="rtl"
                    placeholder={tCreate('sections.datetime.location_placeholder')}
                    className="w-full px-6 py-4 rounded-2xl border-2 border-gray-100 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none font-medium bg-gray-50/30 focus:bg-white"
                  />
                  <div className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                    <MapPin size={20} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Objectifs */}
          <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300">
            <div className="p-8 border-b border-gray-50 bg-gradient-to-l from-purple-50/50 to-transparent">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                 <div className="p-2.5 bg-purple-100 rounded-xl text-purple-600 shadow-sm">
                   <Target className="w-6 h-6" />
                 </div>
                 {tCreate('sections.objectives.title')}
              </h2>
            </div>
            
            <div className="p-8">
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="block text-base font-bold text-gray-800 text-right" style={{ textAlign: 'right' }}>
                    {tCreate('sections.objectives.target_participants')}
                  </label>
                  <div className="relative group">
                    <input
                      {...register('objectifParticipations')}
                      type="number"
                      placeholder={tCreate('sections.objectives.target_placeholder')}
                      className="w-full px-6 py-4 pr-14 rounded-2xl border-2 border-gray-100 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none font-medium transition-all"
                    />
                    <div className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-purple-500 transition-colors pointer-events-none">
                      <Users size={22} />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="block text-base font-bold text-gray-800 text-right" style={{ textAlign: 'right' }}>
                    لون الحملة
                  </label>
                  <div className="flex gap-4">
                    <input
                      {...register('couleurTheme')}
                      type="color"
                      className="h-14 w-20 rounded-xl border-2 border-gray-100 cursor-pointer"
                    />
                    <input
                      {...register('couleurTheme')}
                      type="text"
                      className="flex-1 px-6 py-4 rounded-2xl border-2 border-gray-100 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none font-mono uppercase"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-10 border-t border-gray-200">
            <Link
              href="/delegation/campagnes"
              className="px-10 py-5 text-gray-500 hover:text-gray-900 font-bold text-lg transition-colors hover:bg-gray-100 rounded-2xl"
            >
              {t('actions.cancel')}
            </Link>
            
            <button
              type="submit"
              disabled={saving}
              className={`px-12 py-5 bg-gradient-to-r ${watchedType ? typeColors[watchedType] || 'from-green-600 to-emerald-600' : 'from-green-600 to-emerald-600'} text-white rounded-2xl hover:shadow-xl hover:-translate-y-1 transition-all shadow-lg shadow-green-500/30 font-bold text-lg flex items-center gap-4 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0`}
            >
              {saving ? (
                <>
                  <Loader2 size={24} className="animate-spin" />
                  {t('actions.saving')}
                </>
              ) : (
                <>
                  <Save size={24} />
                  {t('actions.save')}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
