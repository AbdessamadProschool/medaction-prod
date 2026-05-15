'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useSession } from 'next-auth/react';
import { 
  FileText, 
  Image as ImageIcon, 
  Save, 
  X, 
  Tag,
  PenTool,
  Loader2,
  Eye,
  ArrowLeft,
  Trash2,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { GovInput, GovSelect, GovTextarea, GovButton } from '@/components/ui';
import { cn } from '@/lib/utils';

const articleSchema = z.object({
  titre: z.string().min(5, 'Le titre doit faire au moins 5 caractères').max(150),
  description: z.string().optional(),
  contenu: z.string().min(50, 'Le contenu doit faire au moins 50 caractères'),
  categorie: z.string().optional(),
  tags: z.string().optional(),
  isPublie: z.boolean().optional(),
});

type ArticleForm = z.infer<typeof articleSchema>;

export default function NouvelArticlePage() {
  const t = useTranslations('admin.articles_page');
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  
  // Image state
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors }, watch } = useForm<ArticleForm>({
    resolver: zodResolver(articleSchema),
    defaultValues: {
      isPublie: false
    }
  });

  const isPublie = watch('isPublie');

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        toast.error("L'image ne doit pas dépasser 5MB");
        return;
      }
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const onSubmit = async (data: ArticleForm) => {
    setLoading(true);
    const submitPromise = new Promise(async (resolve, reject) => {
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

          if (!uploadRes.ok) {
            reject(new Error("Erreur upload image"));
            return;
          }
          const uploadData = await uploadRes.json();
          imageUrl = uploadData.url;
        }

        const tagsArray = data.tags ? data.tags.split(',').map(t => t.trim()).filter(Boolean) : [];

        const res = await fetch('/api/admin/articles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...data,
            tags: tagsArray,
            imagePrincipale: imageUrl
          }),
        });

        if (res.ok) {
          resolve(true);
          router.push('/admin/articles');
          router.refresh();
        } else {
          const err = await res.json();
          reject(new Error(err.error || 'Erreur lors de la création'));
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
      success: 'Article créé avec succès',
      error: (err: any) => err.message,
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-24">
      {/* Header Institutional */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-6"
      >
        <div className="space-y-4">
          <Link 
            href="/admin/articles"
            className="group inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
          >
            <div className="w-8 h-8 rounded-full border border-border flex items-center justify-center group-hover:border-foreground/20 group-hover:bg-muted/50 transition-all">
              <ArrowLeft size={14} />
            </div>
            <span>{t('back_list')}</span>
          </Link>
          
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-emerald-500/20 ring-8 ring-emerald-500/5">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-black tracking-tight text-foreground uppercase italic">
                {t('create_title')}
              </h1>
              <p className="text-muted-foreground font-bold uppercase tracking-widest text-[10px] opacity-70 mt-1">
                {t('create_subtitle')}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
           <GovButton
            onClick={handleSubmit(onSubmit)}
            loading={loading}
            variant="primary"
            leftIcon={!loading && <Save size={18} />}
            className="rounded-full px-10 shadow-xl shadow-emerald-500/20 bg-emerald-600 hover:bg-emerald-700 border-none"
          >
            {t('actions.save')}
          </GovButton>
        </div>
      </motion.div>

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* Left Column: Editor */}
        <div className="lg:col-span-2 space-y-10">
          {/* Cover Image Section */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card/50 backdrop-blur-xl rounded-[2.5rem] border border-border overflow-hidden shadow-2xl shadow-emerald-500/05"
          >
            <div className="p-10 border-b border-border/50 bg-muted/5">
              <h2 className="text-[10px] font-black text-foreground uppercase tracking-widest flex items-center gap-3">
                <div className="w-2 h-5 bg-emerald-500 rounded-full" />
                {t('sections.image')}
              </h2>
            </div>
            
            <div className="p-10">
              <AnimatePresence mode="wait">
                {previewUrl ? (
                  <motion.div 
                    key="preview"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="relative aspect-[21/9] bg-muted/20 rounded-[2rem] overflow-hidden group border border-border"
                  >
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col justify-end p-8">
                       <div className="flex justify-between items-center">
                          <p className="text-white text-[10px] font-black uppercase tracking-widest">Image de couverture</p>
                          <GovButton
                            onClick={() => {
                              setSelectedImage(null);
                              setPreviewUrl(null);
                            }}
                            variant="danger"
                            size="sm"
                            leftIcon={<Trash2 size={16} />}
                            className="rounded-full"
                          >
                            Supprimer
                          </GovButton>
                       </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.label 
                    key="upload"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="block aspect-[21/9] border-4 border-dashed border-border rounded-[2.5rem] p-12 text-center bg-muted/5 hover:bg-muted/10 hover:border-emerald-500/30 transition-all cursor-pointer group relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/02 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="w-20 h-20 bg-muted rounded-[2rem] flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform shadow-sm group-hover:bg-card">
                      <ImageIcon className="w-10 h-10 text-muted-foreground group-hover:text-emerald-500 transition-colors" />
                    </div>
                    <p className="text-foreground font-black uppercase tracking-widest text-xs mb-2">{t('form.select_image')}</p>
                    <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest opacity-60">{t('form.image_help')}</p>
                    <input 
                      type="file" 
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                  </motion.label>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Main Content Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card/50 backdrop-blur-xl rounded-[2.5rem] border border-border overflow-hidden shadow-2xl shadow-emerald-500/05"
          >
            <div className="p-10 border-b border-border/50 bg-muted/5">
              <h2 className="text-[10px] font-black text-foreground uppercase tracking-widest flex items-center gap-3">
                <div className="w-2 h-5 bg-emerald-500 rounded-full" />
                {t('sections.content')}
              </h2>
            </div>
            
            <div className="p-10 space-y-10">
              <GovInput
                label={t('form.title')}
                placeholder="Ex: Les avancées de la transition énergétique..."
                leftIcon={<Sparkles size={18} />}
                error={errors.titre?.message}
                {...register('titre')}
                className="text-xl font-bold"
              />

              <GovTextarea
                label={t('form.summary')}
                placeholder="Un court résumé pour accrocher le lecteur..."
                rows={3}
                {...register('description')}
              />

              <GovTextarea
                label={t('form.content')}
                placeholder="Rédigez votre article ici..."
                rows={20}
                error={errors.contenu?.message}
                {...register('contenu')}
                className="leading-relaxed font-serif text-lg"
              />
            </div>
          </motion.div>
        </div>

        {/* Right Column: Taxonomy & Publishing */}
        <div className="space-y-10">
          {/* Section Classification */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card/50 backdrop-blur-xl rounded-[2.5rem] border border-border p-10 shadow-xl"
          >
            <div className="space-y-8">
              <div className="space-y-4">
                <h3 className="text-[10px] font-black text-foreground uppercase tracking-widest flex items-center gap-3">
                  <Tag className="w-5 h-5 text-amber-500" />
                  {t('sections.category')}
                </h3>
                <GovSelect
                  label={t('form.category')}
                  options={[
                    { label: t('form.select_category'), value: "" },
                    { label: "Actualité", value: "ACTUALITE" },
                    { label: "Dossier", value: "DOSSIER" },
                    { label: "Interview", value: "INTERVIEW" },
                    { label: "Reportage", value: "REPORTAGE" },
                    { label: "Tribune", value: "TRIBUNE" }
                  ]}
                  {...register('categorie')}
                />
              </div>

              <GovInput
                label={t('form.tags')}
                placeholder="Ex: écologie, santé, innovation..."
                leftIcon={<ChevronRight size={16} />}
                {...register('tags')}
              />
            </div>
          </motion.div>

          {/* Section Publication */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-card/50 backdrop-blur-xl rounded-[2.5rem] border border-border p-10 shadow-xl"
          >
            <h3 className="text-[10px] font-black text-foreground uppercase tracking-widest flex items-center gap-3 mb-8">
              <Eye className="w-5 h-5 text-purple-500" />
              {t('sections.publication')}
            </h3>
            
            <label className={cn(
              "relative flex flex-col p-6 rounded-[1.5rem] border-2 cursor-pointer transition-all group shadow-sm",
              isPublie 
                ? "border-emerald-500 bg-emerald-500/5 shadow-emerald-500/10 shadow-lg" 
                : "border-border bg-muted/10 hover:border-border/80"
            )}>
              <div className="flex items-start gap-4">
                <input
                  type="checkbox"
                  {...register('isPublie')}
                  className="w-6 h-6 rounded-lg border-border text-emerald-600 mt-0.5 focus:ring-emerald-500/20 cursor-pointer"
                />
                <div>
                  <span className={cn(
                    "text-[10px] font-black uppercase tracking-widest block transition-colors",
                    isPublie ? "text-emerald-700" : "text-foreground"
                  )}>{t('form.publish_now')}</span>
                  <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest opacity-60 mt-1 leading-tight">
                    L'article sera visible immédiatement par les citoyens
                  </p>
                </div>
              </div>
            </label>
          </motion.div>

          {/* Tips Card */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="p-8 bg-gradient-to-br from-emerald-600 to-teal-800 rounded-[2.5rem] text-white shadow-2xl shadow-emerald-500/20 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16" />
            <Sparkles className="w-8 h-8 mb-4 text-emerald-200" />
            <h4 className="text-xs font-black uppercase tracking-widest mb-2">Qualité Éditoriale</h4>
            <p className="text-[10px] font-bold uppercase tracking-widest leading-relaxed opacity-80">
              Un article avec une image de haute qualité et des tags pertinents obtient 3x plus de lectures.
            </p>
          </motion.div>
        </div>
      </form>
    </div>
  );
}


