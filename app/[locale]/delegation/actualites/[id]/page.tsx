'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { 
  FileText, 
  Image as ImageIcon, 
  Save, 
  X, 
  Building2,
  Tag,
  PenTool,
  Loader2,
  ArrowRight,
  Newspaper,
  LayoutTemplate
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function EditActualitePage({ params }: { params: { id: string } }) {
  const t = useTranslations('delegation.dashboard.news_creation');
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [etablissements, setEtablissements] = useState<{id: number, nom: string}[]>([]);
  
  // Image state
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);

  const actualiteSchema = z.object({
    titre: z.string().min(5, t('validation.titre_min')).max(100),
    description: z.string().optional(),
    contenu: z.string().min(20, t('validation.content_min')),
    etablissementId: z.string().min(1, t('validation.establishment_required')),
    categorie: z.string().optional(),
  });

  type ActualiteForm = z.infer<typeof actualiteSchema>;

  const { register, handleSubmit, formState: { errors }, reset } = useForm<ActualiteForm>({
    resolver: zodResolver(actualiteSchema)
  });

  useEffect(() => {
    // 1. Fetch Etablissements
    const fetchEtablissements = async () => {
      try {
        let url = '/api/etablissements?limit=100';
        if (session?.user?.secteurResponsable) {
          url += `&secteur=${session.user.secteurResponsable}`;
        }
        const res = await fetch(url);
        const data = await res.json();
        if(data.data) setEtablissements(data.data);
      } catch (error) {
        console.error(error);
      }
    };

    // 2. Fetch Actualite
    const fetchActualite = async () => {
       try {
         const res = await fetch(`/api/delegation/actualites/${params.id}`);
         if (res.ok) {
            const json = await res.json();
            const actu = json.data;
            
            // Pre-fill
            reset({
               titre: actu.titre,
               description: actu.description || '',
               contenu: actu.contenu,
               etablissementId: actu.etablissementId?.toString() || '',
               categorie: actu.categorie || ''
            });

            if (actu.imagePrincipale) {
               setCurrentImageUrl(actu.imagePrincipale);
               setPreviewUrl(actu.imagePrincipale);
            }
         } else {
            toast.error(t('errors.not_found'));
            router.push('/delegation/actualites');
         }
       } catch(e) {
         console.error(e);
       } finally {
         setInitialLoading(false);
       }
    };

    if (session?.user) {
      fetchEtablissements();
      fetchActualite();
    }
  }, [session, params.id, reset, router, t]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        toast.error(t('sections.media.size_error'));
        return;
      }
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const onSubmit = async (data: ActualiteForm) => {
    setLoading(true);
    try {
      let imageUrl = currentImageUrl;

      if (selectedImage) {
        const formData = new FormData();
        formData.append('file', selectedImage);
        formData.append('type', 'actualites');

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!uploadRes.ok) throw new Error("Erreur upload image");
        const uploadData = await uploadRes.json();
        imageUrl = uploadData.url;
      }

      const res = await fetch(`/api/delegation/actualites/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            ...data,
            etablissementId: parseInt(data.etablissementId),
            imagePrincipale: imageUrl
        }),
      });

      if (res.ok) {
        toast.success(t('success.updated'));
        router.push('/delegation/actualites');
        router.refresh();
      } else {
        const err = await res.json();
        toast.error(err.error || t('errors.update_failed'));
      }
    } catch (error) {
      console.error(error);
      toast.error(t('errors.server_error'));
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
     return (
        <div className="min-h-screen flex items-center justify-center">
           <Loader2 className="w-12 h-12 text-orange-600 animate-spin" />
        </div>
     );
  }

  return (
    <div className="min-h-screen font-sans text-right" dir="rtl">
      <div className="max-w-5xl mx-auto px-4 py-8">
        
        {/* Header with Premium Design */}
        <div className="mb-10 relative">
          <Link 
            href="/delegation/actualites"
            className="inline-flex items-center gap-2 text-gray-500 hover:text-orange-600 mb-6 transition-colors group font-bold"
          >
            <ArrowRight size={20} className="group-hover:-translate-x-1 transition-transform" />
            <span>{t('back_to_list')}</span>
          </Link>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-gray-100">
             <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 rounded-full border border-amber-100 animate-fade-in-up">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                    <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">{t('subtitle')}</span>
                </div>
                <h1 className="text-4xl font-black text-gray-900 tracking-tight leading-tight">
                    {t('edit_title', { id: params.id })}
                </h1>
             </div>
             <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/30 transform -rotate-3">
                <Newspaper className="w-8 h-8 text-white" />
             </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 animate-fade-in-up animation-delay-100">
          
          {/* Section Image */}
          <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden group hover:shadow-xl transition-all duration-300">
            <div className="p-8 border-b border-gray-50 bg-gradient-to-l from-orange-50/50 to-transparent">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                <div className="p-2.5 bg-orange-100 rounded-xl text-orange-600 shadow-sm">
                   <ImageIcon className="w-6 h-6" />
                </div>
                {t('sections.media.title')}
              </h2>
            </div>
            
            <div className="p-8">
              {previewUrl ? (
                <div className="relative w-full h-80 bg-gray-100 rounded-[1.5rem] overflow-hidden group shadow-inner border border-gray-100">
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedImage(null);
                          setPreviewUrl(null);
                          setCurrentImageUrl(null);
                        }}
                        className="px-6 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors text-base font-bold shadow-lg transform hover:scale-105 flex items-center gap-2"
                      >
                        <X size={20} />
                        {t('sections.media.remove_btn')}
                      </button>
                  </div>
                  <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl text-white text-sm font-bold shadow-lg">
                     {t('sections.media.selected_label')}
                  </div>
                </div>
              ) : (
                <label className="relative flex flex-col items-center justify-center h-80 border-3 border-dashed border-gray-200 rounded-[1.5rem] bg-gray-50/50 hover:bg-orange-50/50 hover:border-orange-300 transition-all cursor-pointer group overflow-hidden">
                  <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10"></div>
                  
                  <div className="w-24 h-24 bg-white rounded-full shadow-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 group-hover:shadow-2xl ring-4 ring-gray-50 group-hover:ring-orange-50">
                    <ImageIcon className="w-10 h-10 text-gray-400 group-hover:text-orange-500 transition-colors" />
                  </div>
                  <p className="text-xl font-bold text-gray-700 mb-2 group-hover:text-orange-700 transition-colors">{t('sections.media.placeholder')}</p>
                  <p className="text-gray-400 font-medium">{t('sections.media.hint')}</p>
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

          {/* Section Contenu */}
          <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300">
            <div className="p-8 border-b border-gray-50 bg-gradient-to-l from-blue-50/50 to-transparent">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                <div className="p-2.5 bg-blue-100 rounded-xl text-blue-600 shadow-sm">
                   <PenTool className="w-6 h-6" />
                </div>
                {t('sections.content.title')}
              </h2>
            </div>
            
            <div className="p-8 space-y-8">
              {/* Titre */}
              <div className="space-y-3">
                <label className="block text-base font-bold text-gray-800 text-right" style={{ textAlign: 'right' }}>
                  {t('sections.content.titre_label')} <span className="text-red-500 text-lg">*</span>
                </label>
                <div className="relative group">
                    <input
                      {...register('titre')}
                      type="text"
                      dir="rtl"
                      placeholder={t('sections.content.titre_placeholder')}
                      className="w-full px-6 py-4 pr-14 rounded-2xl border-2 border-gray-100 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-xl font-bold placeholder:text-gray-300 placeholder:font-normal bg-gray-50/50 focus:bg-white"
                    />
                     <div className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors pointer-events-none">
                        <LayoutTemplate size={24} />
                     </div>
                </div>
                {errors.titre && <p className="text-red-500 text-sm font-bold flex items-center gap-2 bg-red-50 p-2.5 rounded-xl max-w-fit px-4"><X size={16}/> {errors.titre.message}</p>}
              </div>

              {/* Description Courte */}
              <div className="space-y-3">
                <label className="block text-base font-bold text-gray-800 text-right" style={{ textAlign: 'right' }}>
                   {t('sections.content.description_label')}
                </label>
                <textarea
                  {...register('description')}
                  rows={2}
                  dir="rtl"
                  placeholder={t('sections.content.description_placeholder')}
                  className="w-full px-6 py-4 rounded-2xl border-2 border-gray-100 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all placeholder:text-gray-300 bg-gray-50/50 focus:bg-white text-lg font-medium resize-none"
                />
              </div>

              {/* Contenu Riche */}
              <div className="space-y-3">
                <label className="block text-base font-bold text-gray-800 text-right" style={{ textAlign: 'right' }}>
                   {t('sections.content.body_label')} <span className="text-red-500 text-lg">*</span>
                </label>
                <div className="relative rounded-2xl border-2 border-gray-100 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all bg-gray-50/50 focus-within:bg-white overflow-hidden">
                    <textarea
                    {...register('contenu')}
                    rows={12}
                    dir="rtl"
                    placeholder={t('sections.content.body_placeholder')}
                    className="w-full px-8 py-6 outline-none bg-transparent placeholder:text-gray-300 leading-relaxed text-lg font-medium resize-y"
                    />
                </div>
                {errors.contenu && <p className="text-red-500 text-sm font-bold flex items-center gap-2 bg-red-50 p-2.5 rounded-xl max-w-fit px-4"><X size={16}/> {errors.contenu.message}</p>}
              </div>
            </div>
          </div>

          {/* Section Contexte */}
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-8 hover:shadow-xl transition-all duration-300 relative overflow-hidden group">
             <div className="absolute top-0 right-0 w-32 h-32 bg-purple-50 rounded-bl-[4rem] -mr-8 -mt-8 opacity-50 pointer-events-none group-hover:scale-110 transition-transform"></div>
              <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-3">
                 <div className="p-2.5 bg-purple-100 rounded-xl text-purple-600 shadow-sm">
                    <Tag className="w-5 h-5" />
                 </div>
                 {t('sections.context.category_title')}
              </h3>
              
              <div className="relative group">
                 <select
                    {...register('categorie')}
                    className="w-full px-6 py-5 pr-6 pl-12 rounded-2xl border-2 border-gray-100 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none bg-white font-bold text-gray-700 appearance-none cursor-pointer transition-all hover:bg-gray-50"
                 >
                    <option value="">{t('sections.context.category_options.general')}</option>
                    <option value="TRAVAUX">🔧 {t('sections.context.category_options.works')}</option>
                    <option value="ANNONCE">📢 {t('sections.context.category_options.announcement')}</option>
                    <option value="PARTENARIAT">🤝 {t('sections.context.category_options.partnership')}</option>
                    <option value="SUCCESS_STORY">🏆 {t('sections.context.category_options.success_story')}</option>
                 </select>
                 <div className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none group-hover:text-purple-600 transition-colors">
                    <ArrowRight className="rotate-90" size={20} />
                 </div>
              </div>
            </div>

            <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-8 hover:shadow-xl transition-all duration-300 relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-[4rem] -mr-8 -mt-8 opacity-50 pointer-events-none group-hover:scale-110 transition-transform"></div>
              <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-3">
                 <div className="p-2.5 bg-indigo-100 rounded-xl text-indigo-600 shadow-sm">
                    <Building2 className="w-5 h-5" />
                 </div>
                 {t('sections.context.establishment_title')} <span className="text-red-500">*</span>
              </h3>
              
              <div className="relative group">
                 <select
                    {...register('etablissementId')}
                    className="w-full px-6 py-5 pr-6 pl-12 rounded-2xl border-2 border-gray-100 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none bg-white font-bold text-gray-700 appearance-none cursor-pointer transition-all hover:bg-gray-50"
                 >
                    <option value="">{t('sections.context.establishment_placeholder')}</option>
                    {etablissements.map(e => (
                    <option key={e.id} value={e.id}>{e.nom}</option>
                    ))}
                 </select>
                 <div className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none group-hover:text-indigo-600 transition-colors">
                    <ArrowRight className="rotate-90" size={20} />
                 </div>
              </div>

              {errors.etablissementId && <p className="text-red-500 text-sm font-bold mt-3 flex items-center gap-2"><X size={16}/> {errors.etablissementId.message}</p>}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-10 border-t border-gray-200">
            <Link
              href="/delegation/actualites"
              className="px-10 py-5 text-gray-500 hover:text-gray-900 font-bold transition-all hover:bg-gray-100 rounded-2xl text-lg"
            >
              {t('actions.cancel')}
            </Link>
            
            <button
              type="submit"
              disabled={loading}
              className="px-12 py-5 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-2xl hover:shadow-xl hover:-translate-y-1 transition-all shadow-orange-500/30 font-bold text-lg flex items-center gap-4 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                <>
                  <Loader2 size={24} className="animate-spin" />
                  {t('actions.updating')}
                </>
              ) : (
                <>
                  <Save size={24} />
                  {t('actions.update')}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
