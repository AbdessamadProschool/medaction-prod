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
  Tag,
  PenTool,
  Loader2,
  Eye,
  ArrowRight,
  Trash2,
  BookOpen,
  LayoutTemplate
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function EditArticlePage({ params }: { params: { id: string } }) {
  const t = useTranslations('delegation.dashboard.articles.edit_page');
  const tCreate = useTranslations('delegation.dashboard.articles.creation');
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  
  // Image state
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);

  const articleSchema = z.object({
    titre: z.string().min(5, tCreate('validation.title_min')).max(150),
    description: z.string().optional(),
    contenu: z.string().min(50, tCreate('validation.content_min')),
    categorie: z.string().optional(),
    tags: z.string().optional(),
    isPublie: z.boolean().optional(),
  });

  type ArticleForm = z.infer<typeof articleSchema>;

  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<ArticleForm>({
    resolver: zodResolver(articleSchema),
  });

  // Fetch Article Data
  useEffect(() => {
    const fetchArticle = async () => {
       try {
         const res = await fetch(`/api/delegation/articles/${params.id}`);
         if (res.ok) {
           const json = await res.json();
           const article = json.data;
           
           // Pre-fill form
           reset({
             titre: article.titre,
             description: article.description || '',
             contenu: article.contenu,
             categorie: article.categorie || '',
             tags: article.tags ? article.tags.join(', ') : '',
             isPublie: article.isPublie
           });
           
           if (article.imagePrincipale) {
             setCurrentImageUrl(article.imagePrincipale);
             setPreviewUrl(article.imagePrincipale);
           }
         } else {
           toast.error(t('errors.not_found'));
           router.push('/delegation/articles');
         }
       } catch (error) {
         console.error(error);
         toast.error(t('errors.update_failed'));
       } finally {
         setInitialLoading(false);
       }
    };
    
    fetchArticle();
  }, [params.id, reset, router, t]);

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

  const onSubmit = async (data: ArticleForm) => {
    setLoading(true);
    try {
      let imageUrl = currentImageUrl;

      if (selectedImage) {
        const formData = new FormData();
        formData.append('file', selectedImage);
        formData.append('type', 'articles');

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!uploadRes.ok) throw new Error(tCreate('errors.upload_failed'));
        const uploadData = await uploadRes.json();
        imageUrl = uploadData.url;
      }

      const tagsArray = data.tags ? data.tags.split(',').map(t => t.trim()).filter(Boolean) : [];

      const res = await fetch(`/api/delegation/articles/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          tags: tagsArray,
          imagePrincipale: imageUrl
        }),
      });

      if (res.ok) {
        toast.success(t('success.updated'));
        router.push('/delegation/articles');
        router.refresh();
      } else {
        const err = await res.json();
        toast.error(err.error || t('errors.update_failed'));
      }
    } catch (error) {
      console.error(error);
      toast.error(t('errors.update_failed'));
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
     return (
        <div className="min-h-screen flex items-center justify-center">
           <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
        </div>
     );
  }

  return (
    <div className="min-h-screen font-sans text-right" dir="rtl">
      <div className="max-w-5xl mx-auto px-4 py-8">
        
        {/* Header */}
        <div className="mb-10 relative">
          <Link 
            href="/delegation/articles"
            className="inline-flex items-center gap-2 text-gray-500 hover:text-blue-600 mb-6 transition-colors group font-bold"
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
                    {t('title')} #{params.id}
                </h1>
             </div>
             <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/30 transform -rotate-3">
                <BookOpen className="w-8 h-8 text-white" />
             </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          
          {/* Image de couverture */}
          <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden group hover:shadow-xl transition-all duration-300">
            <div className="p-8 border-b border-gray-50 bg-gradient-to-l from-blue-50/50 to-transparent">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                <div className="p-2.5 bg-blue-100 rounded-xl text-blue-600 shadow-sm">
                   <ImageIcon className="w-6 h-6" />
                </div>
                {tCreate('sections.cover.title')}
              </h2>
            </div>
            
            <div className="p-8">
              {previewUrl ? (
                <div className="relative w-full h-72 bg-gray-100 rounded-[1.5rem] overflow-hidden group shadow-inner border border-gray-100">
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
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
                      onClick={() => {
                        setSelectedImage(null);
                        setPreviewUrl(null);
                        setCurrentImageUrl(null);
                      }}
                      className="p-3 bg-red-500 text-white rounded-xl hover:bg-red-600 shadow-lg"
                    >
                      <Trash2 size={22} />
                    </button>
                  </div>
                </div>
              ) : (
                <label className="relative flex flex-col items-center justify-center h-72 border-3 border-dashed border-gray-200 rounded-[1.5rem] bg-gray-50/50 hover:bg-blue-50/50 hover:border-blue-300 transition-all cursor-pointer group overflow-hidden">
                  <div className="w-20 h-20 bg-white rounded-full shadow-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 ring-4 ring-gray-50 group-hover:ring-blue-50">
                    <ImageIcon className="w-10 h-10 text-gray-400 group-hover:text-blue-500 transition-colors" />
                  </div>
                  <p className="text-xl font-bold text-gray-700 mb-2 group-hover:text-blue-700 transition-colors">{tCreate('sections.cover.click_to_add')}</p>
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

          {/* Contenu principal */}
          <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300">
            <div className="p-8 border-b border-gray-50 bg-gradient-to-l from-indigo-50/50 to-transparent">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                 <div className="p-2.5 bg-indigo-100 rounded-xl text-indigo-600 shadow-sm">
                   <PenTool className="w-6 h-6" />
                 </div>
                 {tCreate('sections.content.title')}
              </h2>
            </div>
            
            <div className="p-8 space-y-8">
              {/* Titre */}
              <div className="space-y-4">
                <label className="block text-lg font-bold text-gray-900 text-right">
                  {tCreate('sections.content.article_title')} <span className="text-red-500 text-lg">*</span>
                </label>
                <div className="relative group">
                  <input
                    {...register('titre')}
                    type="text"
                    dir="rtl"
                    placeholder={tCreate('sections.content.article_title_placeholder')}
                    className="w-full px-6 py-5 pr-16 rounded-2xl border-2 border-gray-100 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all text-xl font-bold placeholder:text-gray-300 placeholder:font-normal bg-gray-50/50 focus:bg-white text-right"
                  />
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors pointer-events-none">
                    <LayoutTemplate size={26} />
                  </div>
                </div>
                {errors.titre && (
                  <p className="text-red-500 text-sm font-medium flex items-center gap-2 bg-red-50 p-2 rounded-lg max-w-fit px-4 text-right">
                    ⚠️ {errors.titre.message}
                  </p>
                )}
              </div>

              {/* Description courte */}
              <div className="space-y-4">
                <label className="block text-lg font-bold text-gray-900 text-right">
                  {tCreate('sections.content.summary')}
                </label>
                <textarea
                  {...register('description')}
                  rows={3}
                  dir="rtl"
                  placeholder={tCreate('sections.content.summary_placeholder')}
                  className="w-full px-6 py-5 rounded-2xl border-2 border-gray-100 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all text-lg font-medium placeholder:text-gray-300 bg-gray-50/50 focus:bg-white text-right"
                />
              </div>

              {/* Contenu */}
              <div className="space-y-4">
                <label className="block text-lg font-bold text-gray-900 text-right">
                  {tCreate('sections.content.full_content')} <span className="text-red-500 text-lg">*</span>
                </label>
                <textarea
                  {...register('contenu')}
                  rows={12}
                  dir="rtl"
                  placeholder={tCreate('sections.content.full_content_placeholder')}
                  className="w-full px-6 py-5 rounded-2xl border-2 border-gray-100 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all text-lg font-medium placeholder:text-gray-300 leading-relaxed bg-gray-50/50 focus:bg-white text-right"
                />
                {errors.contenu && (
                  <p className="text-red-500 text-sm font-medium flex items-center gap-2 bg-red-50 p-2 rounded-lg max-w-fit px-4">
                    ⚠️ {errors.contenu.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Métadonnées */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-8 hover:shadow-lg transition-all duration-300">
              <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-3 text-lg">
                <div className="p-2 bg-amber-100 rounded-xl text-amber-600">
                  <Tag className="w-5 h-5" />
                </div>
                {tCreate('sections.metadata.title')}
              </h3>
              
              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="block text-base font-bold text-gray-700">{tCreate('sections.metadata.category')}</label>
                  <select
                    {...register('categorie')}
                    className="w-full px-6 py-4 rounded-2xl border-2 border-gray-100 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none bg-white font-medium appearance-none cursor-pointer"
                  >
                    <option value="">{tCreate('sections.metadata.category_placeholder')}</option>
                    <option value="ACTUALITE">{tCreate('sections.metadata.categories.actualite')}</option>
                    <option value="DOSSIER">{tCreate('sections.metadata.categories.dossier')}</option>
                    <option value="INTERVIEW">{tCreate('sections.metadata.categories.interview')}</option>
                    <option value="REPORTAGE">{tCreate('sections.metadata.categories.reportage')}</option>
                    <option value="TRIBUNE">{tCreate('sections.metadata.categories.tribune')}</option>
                  </select>
                </div>

                <div className="space-y-3">
                  <label className="block text-base font-bold text-gray-700">
                    {tCreate('sections.metadata.tags')} <span className="text-gray-400 font-normal text-sm">{tCreate('sections.metadata.tags_hint')}</span>
                  </label>
                  <input
                    {...register('tags')}
                    type="text"
                    dir="rtl"
                    placeholder={tCreate('sections.metadata.tags_placeholder')}
                    className="w-full px-6 py-4 rounded-2xl border-2 border-gray-100 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none font-medium placeholder:text-gray-300"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-8 hover:shadow-lg transition-all duration-300">
              <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-3 text-lg">
                <div className="p-2 bg-purple-100 rounded-xl text-purple-600">
                  <Eye className="w-5 h-5" />
                </div>
                {tCreate('sections.publication.title')}
              </h3>
              
              <div className="space-y-4">
                <label className="flex items-start gap-4 p-5 rounded-2xl border-2 border-gray-100 hover:border-purple-400 hover:bg-purple-50/30 cursor-pointer transition-all shadow-sm hover:shadow-md">
                  <input
                    type="checkbox"
                    {...register('isPublie')}
                    className="w-6 h-6 rounded-md border-gray-300 text-purple-600 focus:ring-purple-500 mt-0.5"
                  />
                  <div>
                    <span className="font-bold text-gray-800 block text-lg">{tCreate('sections.publication.publish_now')}</span>
                    <span className="text-gray-500 text-sm font-medium">{tCreate('sections.publication.publish_now_desc')}</span>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-10 border-t border-gray-200">
            <Link
              href="/delegation/articles"
              className="px-10 py-5 text-gray-500 hover:text-gray-900 font-bold text-lg transition-colors hover:bg-gray-100 rounded-2xl"
            >
              {t('actions.cancel')}
            </Link>
            
            <button
              type="submit"
              disabled={loading}
              className="px-12 py-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl hover:shadow-xl hover:-translate-y-1 transition-all shadow-lg shadow-blue-500/30 font-bold text-lg flex items-center gap-4 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              {loading ? (
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
