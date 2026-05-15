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
  Send,
  Trash2,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from '@/i18n/navigation';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { GovInput, GovSelect, GovTextarea, GovButton } from '@/components/ui';
import { cn } from '@/lib/utils';

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
    <div className="max-w-6xl mx-auto space-y-12 pb-24">
      {/* Header Premium */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-6"
      >
        <div className="space-y-4">
          <Link 
            href="/admin/actualites"
            className="group inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
          >
            <div className="w-8 h-8 rounded-full border border-border flex items-center justify-center group-hover:border-foreground/20 group-hover:bg-muted/50 transition-all">
              <ArrowLeft size={14} />
            </div>
            <span>{t('back_list')}</span>
          </Link>
          
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-gradient-to-br from-[hsl(var(--gov-blue))] to-indigo-600 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-[hsl(var(--gov-blue))/0.3] ring-8 ring-[hsl(var(--gov-blue))/0.1]">
              <Newspaper className="w-8 h-8 text-white" />
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
            leftIcon={!loading && <Send size={18} />}
            className="rounded-full px-10 shadow-xl shadow-[hsl(var(--gov-blue))/0.2]"
          >
            {t('actions.create')}
          </GovButton>
        </div>
      </motion.div>

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* Left Column: Content */}
        <div className="lg:col-span-2 space-y-10">
          {/* Section Image */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card/50 backdrop-blur-xl rounded-[2.5rem] border border-border overflow-hidden shadow-2xl shadow-[hsl(var(--gov-blue))/0.03]"
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
                    className="relative aspect-video bg-muted/20 rounded-[2rem] overflow-hidden group border border-border shadow-inner"
                  >
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col justify-end p-8">
                       <div className="flex justify-between items-center">
                          <p className="text-white text-[10px] font-black uppercase tracking-widest">{t('form.selected_image')}</p>
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
                            {t('form.delete_image')}
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
                    className="block aspect-video border-4 border-dashed border-border rounded-[2.5rem] p-12 text-center bg-muted/5 hover:bg-muted/10 hover:border-[hsl(var(--gov-blue))/0.3] transition-all cursor-pointer group relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--gov-blue))/0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="w-20 h-20 bg-muted rounded-[2rem] flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform shadow-sm group-hover:bg-card">
                      <ImageIcon className="w-10 h-10 text-muted-foreground group-hover:text-[hsl(var(--gov-blue))] transition-colors" />
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

          {/* Section Contenu */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card/50 backdrop-blur-xl rounded-[2.5rem] border border-border overflow-hidden shadow-2xl shadow-[hsl(var(--gov-blue))/0.03]"
          >
            <div className="p-10 border-b border-border/50 bg-muted/5">
              <h2 className="text-[10px] font-black text-foreground uppercase tracking-widest flex items-center gap-3">
                <div className="w-2 h-5 bg-[hsl(var(--gov-blue))] rounded-full" />
                {t('sections.content')}
              </h2>
            </div>
            
            <div className="p-10 space-y-10">
              <GovInput
                label={t('form.title')}
                placeholder="Ex: Inauguration du nouveau complexe sportif..."
                leftIcon={<Sparkles size={18} />}
                error={errors.titre?.message}
                {...register('titre')}
                className="text-xl font-bold"
              />

              <GovTextarea
                label={t('form.summary')}
                placeholder={t('form.summary_placeholder') || "Un court résumé pour les cartes..."}
                rows={3}
                {...register('resume')}
              />

              <GovTextarea
                label={t('form.content')}
                placeholder="Développement de l'actualité..."
                rows={15}
                error={errors.contenu?.message}
                {...register('contenu')}
                className="leading-relaxed"
              />
            </div>
          </motion.div>
        </div>

        {/* Right Column: Settings */}
        <div className="space-y-10">
          {/* Section Contexte */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card/50 backdrop-blur-xl rounded-[2.5rem] border border-border p-10 shadow-xl"
          >
            <div className="space-y-8">
              <div className="space-y-4">
                <h3 className="text-[10px] font-black text-foreground uppercase tracking-widest flex items-center gap-3">
                  <Globe className="w-5 h-5 text-[hsl(var(--gov-blue))]" />
                  {t('sections.sector')}
                </h3>
                <GovSelect
                  label=""
                  options={[
                    { label: t('form.select_sector'), value: "" },
                    ...SECTEURS.map(s => ({ label: s.label, value: s.value }))
                  ]}
                  error={errors.secteur?.message}
                  {...register('secteur')}
                />
              </div>

              <div className="space-y-4">
                <h3 className="text-[10px] font-black text-foreground uppercase tracking-widest flex items-center gap-3">
                  <Tag className="w-5 h-5 text-purple-500" />
                  {t('sections.category')}
                </h3>
                <GovSelect
                  label=""
                  options={[
                    { label: t('form.general_category'), value: "" },
                    { label: t('categories.TRAVAUX'), value: "TRAVAUX" },
                    { label: t('categories.ANNONCE'), value: "ANNONCE" },
                    { label: t('categories.PARTENARIAT'), value: "PARTENARIAT" },
                    { label: t('categories.SUCCESS_STORY'), value: "SUCCESS_STORY" },
                    { label: t('categories.EVENEMENT'), value: "EVENEMENT" }
                  ]}
                  {...register('categorie')}
                />
              </div>
            </div>
          </motion.div>

          {/* Section Statut */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-card/50 backdrop-blur-xl rounded-[2.5rem] border border-border p-10 shadow-xl"
          >
            <h3 className="text-[10px] font-black text-foreground uppercase tracking-widest flex items-center gap-3 mb-8">
              <Send className="w-5 h-5 text-emerald-500" />
              {t('sections.status')}
            </h3>
            
            <div className="space-y-4">
              {STATUTS.map(statut => (
                <label 
                  key={statut.value}
                  className={cn(
                    "relative flex flex-col p-5 rounded-[1.5rem] border-2 cursor-pointer transition-all group shadow-sm",
                    selectedStatut === statut.value
                      ? "border-[hsl(var(--gov-blue))] bg-[hsl(var(--gov-blue))/0.05] shadow-[hsl(var(--gov-blue))/0.1] shadow-lg scale-[1.02]"
                      : "border-border bg-muted/10 hover:border-border/80"
                  )}
                >
                  <input
                    type="radio"
                    {...register('statut')}
                    value={statut.value}
                    className="sr-only"
                  />
                  <div className="flex justify-between items-center mb-1">
                    <span className={cn(
                      "text-[10px] font-black uppercase tracking-widest transition-colors",
                      selectedStatut === statut.value ? "text-[hsl(var(--gov-blue))]" : "text-foreground"
                    )}>{statut.label}</span>
                    {selectedStatut === statut.value && <div className="w-2 h-2 rounded-full bg-[hsl(var(--gov-blue))] shadow-[0_0_8px_hsl(var(--gov-blue))]" />}
                  </div>
                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest opacity-60 leading-tight">{statut.description}</span>
                </label>
              ))}
            </div>
          </motion.div>

          {/* Tips Card */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="p-8 bg-gradient-to-br from-[hsl(var(--gov-blue))] to-indigo-800 rounded-[2.5rem] text-white shadow-2xl shadow-[hsl(var(--gov-blue))/0.2] relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16" />
            <Sparkles className="w-8 h-8 mb-4 text-blue-200" />
            <h4 className="text-xs font-black uppercase tracking-widest mb-2">Conseil Editorial</h4>
            <p className="text-[10px] font-bold uppercase tracking-widest leading-relaxed opacity-80">
              Utilisez des titres percutants et un résumé clair pour maximiser l'impact sur le portail citoyen.
            </p>
          </motion.div>
        </div>
      </form>
    </div>
  );
}

