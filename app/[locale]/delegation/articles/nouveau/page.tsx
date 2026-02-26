'use client';

import { useState } from 'react';
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
  BookOpen,
  LayoutTemplate,
  Megaphone,
  AlertCircle,
  Trash2
} from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { toast } from 'sonner';

export default function NouvelArticlePage() {
  const t = useTranslations('delegation.dashboard.articles.creation');
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  
  // Image state
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const articleSchema = z.object({
    titre: z.string().min(5, t('validation.title_min')).max(150),
    description: z.string().optional(),
    contenu: z.string().min(50, t('validation.content_min')),
    categorie: z.string().optional(),
    tags: z.string().optional(),
    isPublie: z.boolean().optional(),
  });

  type ArticleForm = z.infer<typeof articleSchema>;

  const { register, handleSubmit, formState: { errors } } = useForm<ArticleForm>({
    resolver: zodResolver(articleSchema),
    defaultValues: {
      isPublie: false
    }
  });

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

  const onSubmit = async (data: ArticleForm) => {
    setLoading(true);
    try {
      let imageUrl = null;

      if (selectedImage) {
        const formData = new FormData();
        formData.append('file', selectedImage);
        formData.append('type', 'articles');

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!uploadRes.ok) throw new Error(t('errors.upload_failed'));
        const uploadData = await uploadRes.json();
        imageUrl = uploadData.url;
      }

      const tagsArray = data.tags ? data.tags.split(',').map(t => t.trim()).filter(Boolean) : [];

      const res = await fetch('/api/delegation/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          tags: tagsArray,
          imagePrincipale: imageUrl
        }),
      });

      if (res.ok) {
        toast.success(t('success.created'));
        router.push('/delegation/articles');
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

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-10 font-cairo text-start">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-[#0f172a] pt-10 pb-16 md:pt-14 md:pb-24 text-start">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-blue-600 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-indigo-600 rounded-full blur-[100px] translate-x-1/2 translate-y-1/2" />
        </div>
        
        <div className="max-w-5xl mx-auto px-6 relative z-10">
          <Link 
            href="/delegation/articles"
            className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 mb-6 transition-all group font-black text-xs uppercase tracking-widest no-underline"
          >
            <ArrowRight size={18} className="rtl:rotate-0 rotate-180 group-hover:-translate-x-1 rtl:group-hover:translate-x-1 transition-transform" />
            <span>{t('back_to_list')}</span>
          </Link>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-4 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-xl backdrop-blur-xl">
                <span className="w-2 w-2 rounded-full bg-blue-400 animate-pulse"></span>
                <span className="text-[10px] font-black text-blue-200 uppercase tracking-[0.2em]">{t('subtitle')}</span>
              </div>
              <h1 className="text-3xl md:text-5xl font-black text-white leading-tight">
                {t('title')}
              </h1>
            </div>
            <div className="hidden md:flex w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl items-center justify-center shadow-xl transform rotate-3 border border-white/10">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-5xl mx-auto px-6 -mt-12 relative z-20">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          
          {/* 1. Cover Image Card */}
          <div className="bg-white rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
              <h2 className="text-lg font-black text-gray-900 flex items-center gap-3">
                <div className="p-2.5 bg-blue-500/10 rounded-xl text-blue-600 shadow-sm">
                   <ImageIcon className="w-5 h-5" />
                </div>
                {t('sections.cover.title')}
              </h2>
            </div>
            
            <div className="p-6">
              {previewUrl ? (
                <div className="relative w-full h-[320px] bg-slate-50 rounded-2xl overflow-hidden group shadow-md border border-gray-100 text-start">
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-6 backdrop-blur-sm">
                    <label className="px-6 py-3 bg-white text-blue-600 rounded-xl hover:bg-blue-50 cursor-pointer text-sm font-black shadow-lg flex items-center gap-2 transform hover:-translate-y-1 transition-all">
                      <ImageIcon size={18} />
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
                      }}
                      className="p-4 bg-red-500 text-white rounded-xl hover:bg-red-600 shadow-lg transform hover:-translate-y-1 transition-all"
                    >
                      <Trash2 size={22} className="text-white" />
                    </button>
                  </div>
                  <div className="absolute top-6 right-6 rtl:right-auto rtl:left-6 bg-blue-600/90 backdrop-blur-xl px-5 py-2 rounded-xl text-white text-[10px] font-black uppercase tracking-wider">
                    {t('sections.cover.selected')}
                  </div>
                </div>
              ) : (
                <label className="relative flex flex-col items-center justify-center h-52 border-4 border-dashed border-gray-100 rounded-[2rem] bg-gray-50/50 hover:bg-blue-50/30 hover:border-blue-200 transition-all cursor-pointer group overflow-hidden">
                  <div className="w-16 h-16 bg-white rounded-2xl shadow-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-all duration-500">
                    <ImageIcon className="w-8 h-8 text-gray-200 group-hover:text-blue-500 transition-colors" />
                  </div>
                  <p className="text-base font-black text-gray-700 mb-1">{t('sections.cover.click_to_add')}</p>
                  <p className="text-xs text-gray-400 font-black uppercase tracking-wider">{t('sections.cover.formats')}</p>
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

          {/* 2. Content Card */}
          <div className="bg-white rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/30">
              <h2 className="text-lg font-black text-gray-900 flex items-center gap-3">
                 <div className="p-2.5 bg-indigo-500/10 rounded-xl text-indigo-600 shadow-sm">
                   <PenTool className="w-5 h-5" />
                 </div>
                 {t('sections.content.title')}
              </h2>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="space-y-3">
                <label className="block text-xs font-black text-gray-400 uppercase tracking-wider">
                  {t('sections.content.article_title')} <span className="text-red-500">*</span>
                </label>
                <div className="relative group">
                  <input
                    {...register('titre')}
                    type="text"
                    placeholder={t('sections.content.article_title_placeholder')}
                    className="w-full px-6 py-4 pr-12 rtl:pr-12 rtl:pl-6 rounded-2xl border-2 border-gray-100 focus:border-indigo-500 focus:ring-8 focus:ring-indigo-500/5 outline-none transition-all text-lg font-black placeholder:text-gray-200 bg-gray-50/30 focus:bg-white"
                  />
                  <div className="absolute right-6 rtl:right-auto rtl:left-6 top-1/2 -translate-y-1/2 text-gray-200 group-focus-within:text-indigo-500 transition-colors pointer-events-none">
                    <Megaphone size={24} />
                  </div>
                </div>
                {errors.titre && (
                  <div className="flex items-center gap-3 text-red-600 bg-red-50 px-4 py-2 rounded-xl border border-red-100">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-xs font-black">{errors.titre.message}</span>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-black text-gray-400 uppercase tracking-wider">
                  {t('sections.content.summary')}
                </label>
                <textarea
                  {...register('description')}
                  rows={2}
                  placeholder={t('sections.content.summary_placeholder')}
                  className="w-full px-6 py-4 rounded-2xl border-2 border-gray-100 focus:border-indigo-500 focus:ring-8 focus:ring-indigo-500/5 outline-none transition-all text-base font-bold placeholder:text-gray-200 bg-gray-50/30 focus:bg-white leading-relaxed"
                />
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-black text-gray-400 uppercase tracking-wider">
                  {t('sections.content.full_content')} <span className="text-red-500">*</span>
                </label>
                <textarea
                  {...register('contenu')}
                  rows={10}
                  placeholder={t('sections.content.full_content_placeholder')}
                  className="w-full px-6 py-5 rounded-2xl border-2 border-gray-100 focus:border-indigo-500 focus:ring-8 focus:ring-indigo-500/5 outline-none transition-all text-base font-medium placeholder:text-gray-200 leading-relaxed bg-gray-50/30 focus:bg-white shadow-inner"
                />
                {errors.contenu && (
                  <div className="flex items-center gap-3 text-red-600 bg-red-50 px-4 py-2 rounded-xl border border-red-100">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-xs font-black">{errors.contenu.message}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Category & Tags Card */}
            <div className="bg-white rounded-[2rem] shadow-xl border border-gray-100 p-6">
              <h3 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-3">
                <div className="p-2.5 bg-amber-500/10 rounded-xl text-amber-600 shadow-sm">
                  <Tag className="w-5 h-5" />
                </div>
                {t('sections.metadata.title')}
              </h3>
              
              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('sections.metadata.category')}</label>
                  <div className="relative group">
                    <select
                      {...register('categorie')}
                      className="w-full px-5 py-3.5 rounded-xl border-2 border-gray-100 focus:border-amber-500 focus:ring-8 focus:ring-amber-500/5 outline-none bg-gray-50/30 hover:bg-white font-black appearance-none cursor-pointer text-sm transition-all"
                    >
                      <option value="">{t('sections.metadata.category_placeholder')}</option>
                      <option value="ACTUALITE">{t('sections.metadata.categories.actualite')}</option>
                      <option value="DOSSIER">{t('sections.metadata.categories.dossier')}</option>
                      <option value="INTERVIEW">{t('sections.metadata.categories.interview')}</option>
                      <option value="REPORTAGE">{t('sections.metadata.categories.reportage')}</option>
                      <option value="TRIBUNE">{t('sections.metadata.categories.tribune')}</option>
                    </select>
                    <div className="absolute right-5 rtl:right-auto rtl:left-5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-300 group-focus-within:text-amber-500">
                      <ArrowRight size={18} className="rotate-90" />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    {t('sections.metadata.tags')} <span className="text-gray-300 font-medium normal-case tracking-normal">{t('sections.metadata.tags_hint')}</span>
                  </label>
                  <input
                    {...register('tags')}
                    type="text"
                    placeholder={t('sections.metadata.tags_placeholder')}
                    className="w-full px-5 py-3.5 rounded-xl border-2 border-gray-100 focus:border-amber-500 focus:ring-8 focus:ring-amber-500/5 outline-none font-black placeholder:text-gray-200 text-sm bg-gray-50/30 hover:bg-white transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Visibility Card */}
            <div className="bg-white rounded-[2rem] shadow-xl border border-gray-100 p-6">
              <h3 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-3">
                <div className="p-2.5 bg-purple-500/10 rounded-xl text-purple-600 shadow-sm">
                  <Eye className="w-5 h-5" />
                </div>
                {t('sections.publication.title')}
              </h3>
              
              <div className="space-y-6">
                <label className="flex items-start gap-5 p-6 rounded-2xl border-2 border-gray-50 bg-gray-50/30 hover:border-purple-200 hover:bg-purple-50/50 cursor-pointer transition-all group overflow-hidden relative shadow-inner">
                  <div className="absolute top-0 right-0 p-2 opacity-[0.05] group-hover:scale-110 transition-transform duration-700">
                    <Eye size={100} />
                  </div>
                  <input
                    type="checkbox"
                    {...register('isPublie')}
                    className="w-7 h-7 rounded-lg border-gray-200 text-purple-600 focus:ring-4 focus:ring-purple-500/10 mt-0.5 cursor-pointer transition-all"
                  />
                  <div className="relative z-10 flex-1">
                    <span className="font-black text-gray-900 block text-lg mb-1 tracking-tight">{t('sections.publication.publish_now')}</span>
                    <span className="text-gray-400 text-xs font-bold leading-relaxed block">{t('sections.publication.publish_now_desc')}</span>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Form Actions Footbar */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-10 border-t border-gray-100">
            <Link
              href="/delegation/articles"
              className="w-full md:w-auto px-10 py-4 text-gray-400 hover:text-gray-900 font-black text-xs uppercase tracking-widest transition-all hover:bg-gray-100 rounded-xl flex items-center justify-center no-underline"
            >
              {t('actions.cancel')}
            </Link>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full md:w-auto px-14 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg hover:-translate-y-1 active:translate-y-0 transition-all font-black text-sm uppercase tracking-[0.2em] flex items-center justify-center gap-4 disabled:opacity-50 disabled:cursor-not-allowed shadow-blue-500/20 shadow-xl"
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
