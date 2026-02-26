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
  LayoutTemplate,
  AlertCircle
} from 'lucide-react';
import { Link } from '@/i18n/navigation';
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
    <div className="min-h-screen font-cairo" dir="rtl">
      <div className="max-w-4xl mx-auto px-4 py-4">
        
        {/* Header with Premium Design */}
        <div className="mb-4 relative">
          <Link 
            href="/delegation/campagnes"
            className="inline-flex items-center gap-2 text-gray-500 hover:text-green-600 mb-2 transition-colors group font-bold text-sm"
          >
            <ArrowRight size={20} className="rtl:rotate-0 rotate-180 group-hover:translate-x-[-4px] rtl:group-hover:translate-x-[4px] transition-transform" />
            <span>{t('back_to_list')}</span>
          </Link>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-gray-100">
             <div className="space-y-1">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-amber-50 rounded-full border border-amber-100 animate-fade-in-up">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                    <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">{t('subtitle')}</span>
                </div>
                <h1 className="text-xl font-black text-gray-900 tracking-tight leading-tight">
                    {t('title')}
                </h1>
             </div>
             <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/30 transform -rotate-3 hover:rotate-0 transition-transform cursor-pointer">
                <Megaphone className="w-5 h-5 text-white" />
             </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 animate-fade-in-up animation-delay-100">
          
          {/* Image de couverture */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden group hover:shadow-md transition-all duration-300">
            <div className="px-5 py-3 border-b border-gray-50 bg-gradient-to-r rtl:bg-gradient-to-l from-green-50/50 to-transparent">
              <h2 className="text-sm font-black text-gray-900 flex items-center gap-2">
                <div className="p-1.5 bg-green-100 rounded-lg text-green-600 shadow-sm">
                   <ImageIcon className="w-4 h-4" />
                </div>
                {tCreate('sections.cover.title')}
              </h2>
            </div>
            
            <div className="p-4">
              {displayImage ? (
                <div className="relative w-full h-40 bg-gray-100 rounded-xl overflow-hidden group shadow-inner border border-gray-100">
                  <img src={displayImage} alt="Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 backdrop-blur-sm">
                    <label className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer text-xs font-bold shadow-lg flex items-center gap-2 transform hover:scale-105 transition-transform">
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
                      className="p-2.5 bg-red-500 text-white rounded-xl hover:bg-red-600 shadow-lg transform hover:scale-105 transition-transform"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                  <div className="absolute top-4 right-4 rtl:right-auto rtl:left-4 bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl text-white text-[10px] font-bold shadow-lg uppercase tracking-tight">
                    {tCreate('sections.cover.subtitle')}
                  </div>
                </div>
              ) : (
                <label className="relative flex flex-col items-center justify-center h-32 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50 hover:bg-green-50/50 hover:border-green-300 transition-all cursor-pointer group overflow-hidden">
                  <div className="w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center mb-2 group-hover:scale-110 transition-transform duration-300">
                    <ImageIcon className="w-5 h-5 text-gray-400 group-hover:text-green-500 transition-colors" />
                  </div>
                  <p className="text-xs font-bold text-gray-700 mb-0.5 group-hover:text-green-700 transition-colors">{tCreate('sections.cover.click_to_add')}</p>
                  <p className="text-[10px] text-gray-400">{tCreate('sections.cover.formats')}</p>
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
              <h2 className="text-sm font-black text-gray-900 flex items-center gap-2">
                 <div className="p-1.5 bg-indigo-100 rounded-lg text-indigo-600 shadow-sm">
                   <AlignLeft className="w-4 h-4" />
                 </div>
                 {tCreate('sections.general.title')}
              </h2>
            </div>
            
            <div className="p-4 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                {/* Type */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-700 text-start">
                    {tCreate('sections.general.type')} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative group">
                    <select
                      {...register('type')}
                      className="w-full px-4 py-2 pr-11 rtl:pr-11 rtl:pl-4 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none bg-gray-50/50 focus:bg-white font-bold text-gray-700 text-sm appearance-none cursor-pointer transition-all hover:bg-white text-start"
                    >
                      <option value="">{tCreate('sections.general.type_placeholder')}</option>
                      <option value="SANTE">{tTypes('sante')}</option>
                      <option value="ENVIRONNEMENT">{tTypes('environnement')}</option>
                      <option value="EDUCATION">{tTypes('education')}</option>
                      <option value="SOCIAL">{tTypes('social')}</option>
                      <option value="AUTRE">{tTypes('autre')}</option>
                    </select>
                    <div className="absolute right-4 rtl:right-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors pointer-events-none">
                       <LayoutTemplate size={18} />
                    </div>
                  </div>
                  {errors.type && <p className="text-red-500 text-[10px] font-bold mt-1 animate-pulse text-start">{errors.type.message}</p>}
                </div>

                {/* Nom court */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-700 text-start">
                    الاسم المختصر <span className="text-red-500">*</span>
                  </label>
                  <div className="relative group">
                    <input
                      {...register('nom')}
                      type="text"
                      placeholder="مثال: شتاء التضامن 2025"
                      className="w-full px-4 py-2 pr-11 rtl:pr-11 rtl:pl-4 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all text-sm font-bold placeholder:text-gray-300 placeholder:font-normal bg-gray-50/50 focus:bg-white text-start"
                    />
                    <div className="absolute right-4 rtl:right-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors pointer-events-none">
                      <LayoutTemplate size={18} />
                    </div>
                  </div>
                  {errors.nom && <p className="text-red-500 text-[10px] font-bold mt-1 animate-pulse text-start">{errors.nom.message}</p>}
                </div>
              </div>

              {/* Titre public */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-700 text-start">
                  {tCreate('sections.general.campaign_title')} <span className="text-red-500">*</span>
                </label>
                <div className="relative group">
                  <input
                    {...register('titre')}
                    type="text"
                    placeholder={tCreate('sections.general.campaign_title_placeholder')}
                    className="w-full px-4 py-2 pr-11 rtl:pr-11 rtl:pl-4 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all text-sm font-bold placeholder:text-gray-300 placeholder:font-normal bg-gray-50/50 focus:bg-white text-start"
                  />
                  <div className="absolute right-4 rtl:right-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors pointer-events-none">
                    <Megaphone size={18} />
                  </div>
                </div>
                {errors.titre && <p className="text-red-500 text-[10px] font-bold mt-1 animate-pulse text-start">{errors.titre.message}</p>}
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-700 text-start">
                  {tCreate('sections.general.description')}
                </label>
                <textarea
                  {...register('description')}
                  rows={2}
                  placeholder={tCreate('sections.general.description_placeholder')}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all text-sm font-medium placeholder:text-gray-300 bg-gray-50/50 focus:bg-white resize-none text-start"
                />
              </div>

              {/* Contenu détaillé */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-700 text-start">
                  المحتوى التفصيلي <span className="text-red-500">*</span>
                </label>
                <textarea
                  {...register('contenu')}
                  rows={4}
                  placeholder="شرح تفصيلي للحملة..."
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all text-sm font-medium placeholder:text-gray-300 leading-relaxed bg-gray-50/50 focus:bg-white resize-none text-start"
                />
                {errors.contenu && <p className="text-red-500 text-[10px] font-bold mt-1 animate-pulse text-start">{errors.contenu.message}</p>}
              </div>
            </div>
          </div>

          {/* Date et Lieu */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-300">
            <div className="px-5 py-3 border-b border-gray-50 bg-gradient-to-r rtl:bg-gradient-to-l from-amber-50/50 to-transparent">
              <h2 className="text-sm font-black text-gray-900 flex items-center gap-2">
                 <div className="p-1.5 bg-amber-100 rounded-lg text-amber-600 shadow-sm">
                   <Calendar className="w-4 h-4" />
                 </div>
                 {tCreate('sections.datetime.title')}
              </h2>
            </div>
            
            <div className="p-4 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-700 text-start">
                    {tCreate('sections.datetime.start_date')}
                  </label>
                  <input
                    {...register('dateDebut')}
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 outline-none font-bold text-gray-700 cursor-pointer text-sm bg-gray-50/50 focus:bg-white transition-all text-start"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-700 text-start">{tCreate('sections.datetime.end_date')}</label>
                  <input
                    {...register('dateFin')}
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 outline-none font-bold text-gray-700 cursor-pointer text-sm bg-gray-50/50 focus:bg-white transition-all text-start"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-700 text-start">
                  {tCreate('sections.datetime.location')}
                </label>
                <div className="relative group">
                  <input
                    {...register('lieu')}
                    type="text"
                    placeholder={tCreate('sections.datetime.location_placeholder')}
                    className="w-full px-4 py-2 pr-11 rtl:pr-11 rtl:pl-4 rounded-xl border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 outline-none font-bold bg-gray-50/50 focus:bg-white text-sm transition-all text-start"
                  />
                  <div className="absolute right-4 rtl:right-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-amber-500 transition-colors pointer-events-none">
                    <MapPin size={18} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Objectifs */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-300">
            <div className="px-5 py-3 border-b border-gray-50 bg-gradient-to-r rtl:bg-gradient-to-l from-purple-50/50 to-transparent">
              <h2 className="text-sm font-black text-gray-900 flex items-center gap-2">
                 <div className="p-1.5 bg-purple-100 rounded-lg text-purple-600 shadow-sm">
                   <Target className="w-4 h-4" />
                 </div>
                 {tCreate('sections.objectives.title')}
              </h2>
            </div>
            
            <div className="p-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-700 text-start">
                    {tCreate('sections.objectives.target_participants')}
                  </label>
                  <div className="relative group">
                    <input
                      {...register('objectifParticipations')}
                      type="number"
                      placeholder={tCreate('sections.objectives.target_placeholder')}
                      className="w-full px-4 py-2 pr-11 rtl:pr-11 rtl:pl-4 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 outline-none font-bold bg-gray-50/50 focus:bg-white transition-all text-sm text-start"
                    />
                    <div className="absolute right-4 rtl:right-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-purple-500 transition-colors pointer-events-none">
                      <Users size={18} />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-700 text-start">
                    لون الحملة
                  </label>
                  <div className="flex gap-2">
                    <input
                      {...register('couleurTheme')}
                      type="color"
                      className="h-9 w-12 rounded-lg border border-gray-200 cursor-pointer p-0.5 bg-white"
                    />
                    <div className="relative flex-1 group">
                       <input
                        {...register('couleurTheme')}
                        type="text"
                        className="w-full h-9 px-3 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 outline-none font-mono uppercase bg-gray-50/50 focus:bg-white text-xs font-bold transition-all text-start"
                        />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <Link
              href="/delegation/campagnes"
              className="px-6 py-2.5 text-gray-500 hover:text-gray-900 font-bold text-sm transition-colors hover:bg-gray-100 rounded-xl"
            >
              {t('actions.cancel')}
            </Link>
            
            <button
              type="submit"
              disabled={saving}
              className={`px-8 py-3 bg-gradient-to-r ${watchedType ? typeColors[watchedType] || 'from-green-600 to-emerald-600' : 'from-green-600 to-emerald-600'} text-white rounded-xl hover:shadow-xl hover:-translate-y-0.5 transition-all shadow-green-500/20 font-black text-sm flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {saving ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  {t('actions.saving')}
                </>
              ) : (
                <>
                  <Save size={20} className="shadow-sm" />
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
