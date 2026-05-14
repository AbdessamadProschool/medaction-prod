'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useSession } from 'next-auth/react';
import { 
  Image as ImageIcon, 
  Save, 
  PenTool,
  Loader2,
  ArrowLeft,
  Newspaper,
  Globe,
  Tag,
  Send
} from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

const actualiteSchema = z.object({
  titre: z.string().min(5).max(150),
  resume: z.string().optional(),
  contenu: z.string().min(20),
  secteur: z.string().min(1),
  categorie: z.string().optional(),
  statut: z.string(),
});

type ActualiteForm = z.infer<typeof actualiteSchema>;

export default function AdminNouvelleActualitePage() {
  const t = useTranslations('admin.news');
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  
  // Image state
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors }, watch } = useForm<ActualiteForm>({
    resolver: zodResolver(actualiteSchema),
    defaultValues: {
      statut: 'BROUILLON',
    }
  });

  const selectedStatut = watch('statut');

  const SECTEURS = [
    { value: 'EDUCATION', label: t('sectors.EDUCATION') },
    { value: 'SANTE', label: t('sectors.SANTE') },
    { value: 'SPORT', label: t('sectors.SPORT') },
    { value: 'SOCIAL', label: t('sectors.SOCIAL') },
    { value: 'CULTUREL', label: t('sectors.CULTUREL') },
    { value: 'AUTRE', label: t('sectors.AUTRE') },
  ];

  const STATUTS = [
    { value: 'BROUILLON', label: t('status.BROUILLON'), description: t('status.BROUILLON_DESC') },
    { value: 'EN_ATTENTE_VALIDATION', label: t('status.EN_ATTENTE_VALIDATION'), description: t('status.EN_ATTENTE_VALIDATION_DESC') },
    { value: 'PUBLIEE', label: t('status.PUBLIEE'), description: t('status.PUBLIEE_DESC') },
  ];

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        toast.error(t('form.image_help'));
        return;
      }
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const onSubmit = async (data: ActualiteForm) => {
    setLoading(true);
    const submitPromise = new Promise(async (resolve, reject) => {
      try {
        let imageUrl = null;

        if (selectedImage) {
          const formData = new FormData();
          formData.append('file', selectedImage);
          formData.append('type', 'actualites');

          try {
              const uploadRes = await fetch('/api/upload', {
              method: 'POST',
              body: formData,
              });

              if (!uploadRes.ok) {
                  const text = await uploadRes.text();
                  reject(new Error(`Upload Failed: ${uploadRes.status}`));
                  return;
              }
              const uploadData = await uploadRes.json();
              imageUrl = uploadData.url;
          } catch (e) {
               console.error("Upload error:", e);
               reject(new Error("Erreur téléchargement image"));
               return;
          }
        }

        const res = await fetch('/api/actualites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...data,
            imageUrl: imageUrl,
          }),
        });

        if (res.ok) {
          resolve(true);
          router.push('/admin/actualites');
          router.refresh();
        } else {
          const text = await res.text();
          try {
              const err = JSON.parse(text);
              reject(new Error(err.error || 'Erreur'));
          } catch {
               reject(new Error(`Erreur serveur (${res.status})`));
          }
        }
      } catch (error) {
        console.error(error);
        reject(new Error('Erreur: ' + (error instanceof Error ? error.message : 'Erreur serveur')));
      } finally {
        setLoading(false);
      }
    });

    toast.promise(submitPromise, {
      loading: 'Création en cours...',
      success: t('actions.create') || 'Succès',
      error: (err: any) => err.message,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <Link 
          href="/admin/actualites"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mb-4 transition-colors"
        >
          <ArrowLeft size={18} />
          <span>{t('back_list')}</span>
        </Link>
        
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Newspaper className="w-6 h-6 text-white" />
              </div>
              {t('create_title')}
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              {t('create_subtitle')}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        
        {/* Section Image */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="p-5 border-b border-gray-100 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-emerald-600" />
              {t('sections.image')}
            </h2>
          </div>
          
          <div className="p-5">
            {previewUrl ? (
              <div className="relative w-full h-64 bg-gray-100 dark:bg-gray-700 rounded-xl overflow-hidden group">
                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                    <span className="text-white text-sm font-medium">{t('form.selected_image')}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedImage(null);
                        setPreviewUrl(null);
                      }}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
                    >
                      {t('form.delete_image')}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <label className="block border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-xl p-12 text-center bg-gray-50/50 dark:bg-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-blue-300 transition-all cursor-pointer group">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <ImageIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <p className="text-gray-700 dark:text-gray-300 font-medium mb-1">{t('form.select_image')}</p>
                <p className="text-gray-400 text-sm">{t('form.image_help')}</p>
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
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="p-5 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-blue-50/50 dark:from-blue-900/20 to-transparent">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
              <PenTool className="w-5 h-5 text-blue-600" />
              {t('sections.content')}
            </h2>
          </div>
          
          <div className="p-5 space-y-5">
            {/* Titre */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                {t('form.title')} <span className="text-red-500">*</span>
              </label>
              <input
                {...register('titre')}
                type="text"
                className="gov-input text-lg font-medium"
              />
              {errors.titre && <p className="text-red-500 text-sm mt-2">{errors.titre.message}</p>}
            </div>

            {/* Résumé */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                {t('form.summary')}
              </label>
              <textarea
                {...register('resume')}
                rows={2}
                className="gov-textarea"
              />
            </div>

            {/* Contenu */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                {t('form.content')} <span className="text-red-500">*</span>
              </label>
              <textarea
                {...register('contenu')}
                rows={12}
                className="gov-textarea leading-relaxed"
              />
              {errors.contenu && <p className="text-red-500 text-sm mt-2">{errors.contenu.message}</p>}
            </div>
          </div>
        </div>

        {/* Section Contexte */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
            <h3 className="font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-500" />
              {t('sections.sector')}
            </h3>
            
            <select
              {...register('secteur')}
              className="gov-select"
            >
              <option value="">{t('form.select_sector')}</option>
              {SECTEURS.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            {errors.secteur && <p className="text-red-500 text-sm mt-2">{errors.secteur.message}</p>}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
            <h3 className="font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
              <Tag className="w-4 h-4 text-purple-500" />
              {t('sections.category')}
            </h3>
            
            <select
              {...register('categorie')}
              className="gov-select"
            >
              <option value="">{t('form.general_category')}</option>
              <option value="TRAVAUX">{t('categories.TRAVAUX')}</option>
              <option value="ANNONCE">{t('categories.ANNONCE')}</option>
              <option value="PARTENARIAT">{t('categories.PARTENARIAT')}</option>
              <option value="SUCCESS_STORY">{t('categories.SUCCESS_STORY')}</option>
              <option value="EVENEMENT">{t('categories.EVENEMENT')}</option>
            </select>
          </div>
        </div>

        {/* Section Statut */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
          <h3 className="font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <Send className="w-4 h-4 text-green-500" />
            {t('sections.status')}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {STATUTS.map(statut => (
              <label 
                key={statut.value}
                className={`relative flex flex-col p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  selectedStatut === statut.value
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
              >
                <input
                  type="radio"
                  {...register('statut')}
                  value={statut.value}
                  className="sr-only"
                />
                <span className="font-medium text-gray-900 dark:text-white">{statut.label}</span>
                <span className="text-sm text-gray-500 dark:text-gray-400 mt-1">{statut.description}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
          <Link
            href="/admin/actualites"
            className="gov-btn gov-btn-secondary"
          >
            {t('actions.cancel')}
          </Link>
          
          <button
            type="submit"
            disabled={loading}
            className="gov-btn gov-btn-primary px-8 py-4 text-lg"
          >
            {loading ? (
              <>
                <Loader2 size={22} className="animate-spin" />
                {t('actions.creating')}
              </>
            ) : (
              <>
                <Save size={22} />
                {t('actions.create')}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
