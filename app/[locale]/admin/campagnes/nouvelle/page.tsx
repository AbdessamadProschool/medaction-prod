'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Megaphone, 
  Image as ImageIcon, 
  Save, 
  X, 
  Calendar,
  Target,
  Palette,
  Loader2,
  ArrowLeft,
  Send,
  Building2,
  Sparkles,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from '@/i18n/navigation';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { GovInput, GovSelect, GovTextarea, GovButton } from '@/components/ui';
import { cn } from '@/lib/utils';

const TYPES_LIST = ['SOLIDARITE', 'ECOLOGIE', 'CITOYENNETE', 'SANTE', 'EDUCATION', 'SPORT', 'CULTURE', 'AUTRE'] as const;
const STATUTS_LIST = ['BROUILLON', 'ACTIVE', 'TERMINEE'] as const;

export default function AdminNouvelleCampagnePage() {
  const router = useRouter();
  const t = useTranslations('admin_campaigns.new');
  const [loading, setLoading] = useState(false);
  
  // Image state
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const campagneSchema = useMemo(() => z.object({
    titre: z.string().min(5, t('validation.title_required')).max(150),
    nom: z.string().min(2, t('validation.name_required')),
    description: z.string().optional(),
    contenu: z.string().min(20, t('validation.content_required')),
    type: z.string().min(1, t('validation.type_required')),
    objectifParticipations: z.string().optional(),
    dateDebut: z.string().optional(),
    dateFin: z.string().optional(),
    couleurTheme: z.string().optional(),
    statut: z.string().min(1),
    isOrganiseParProvince: z.boolean().optional(),
    sousCouvertProvince: z.boolean().optional(),
  }), [t]);

  type CampagneForm = z.infer<typeof campagneSchema>;

  const { register, handleSubmit, formState: { errors }, watch } = useForm<CampagneForm>({
    resolver: zodResolver(campagneSchema),
    defaultValues: {
      couleurTheme: '#1e40af',
      statut: 'BROUILLON',
    }
  });

  const selectedStatut = watch('statut');

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        toast.error(t('validation.image_size'));
        return;
      }
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const onSubmit = async (data: CampagneForm) => {
    setLoading(true);
    const submitPromise = new Promise(async (resolve, reject) => {
      try {
        let imageUrl = null;

        // Upload image
        if (selectedImage) {
          const formData = new FormData();
          formData.append('file', selectedImage);
          formData.append('type', 'campagnes');

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

        const res = await fetch('/api/campagnes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...data,
            objectifParticipations: data.objectifParticipations ? parseInt(data.objectifParticipations) : null,
            isOrganiseParProvince: data.isOrganiseParProvince,
            sousCouvertProvince: data.sousCouvertProvince,
            imagePrincipale: imageUrl
          }),
        });

        if (res.ok) {
          resolve(true);
          router.push('/admin/campagnes');
          router.refresh();
        } else {
          const err = await res.json();
          reject(new Error(err.error || t('validation.error')));
        }
      } catch (error) {
        console.error(error);
        reject(new Error('Erreur: ' + (error instanceof Error ? error.message : t('validation.error'))));
      } finally {
        setLoading(false);
      }
    });

    toast.promise(submitPromise, {
      loading: 'Création en cours...',
      success: t('validation.success'),
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
            href="/admin/campagnes"
            className="group inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
          >
            <div className="w-8 h-8 rounded-full border border-border flex items-center justify-center group-hover:border-foreground/20 group-hover:bg-muted/50 transition-all">
              <ArrowLeft size={14} />
            </div>
            <span>{t('back_to_list')}</span>
          </Link>
          
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-emerald-500/20 ring-8 ring-emerald-500/5">
              <Megaphone className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-black tracking-tight text-foreground uppercase italic">
                {t('title')}
              </h1>
              <p className="text-muted-foreground font-bold uppercase tracking-widest text-[10px] opacity-70 mt-1">
                {t('subtitle')}
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
            {t('form.create')}
          </GovButton>
        </div>
      </motion.div>

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* Left Column: Info & Details */}
        <div className="lg:col-span-2 space-y-10">
          {/* Cover Image Section */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card/50 backdrop-blur-xl rounded-[2.5rem] border border-border overflow-hidden shadow-2xl shadow-emerald-500/05"
          >
            <div className="p-10 border-b border-border/50 bg-muted/5">
              <h2 className="text-[10px] font-black text-foreground uppercase tracking-widest flex items-center gap-3">
                <div className="w-2 h-5 bg-purple-500 rounded-full" />
                {t('visual_section')}
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
                    className="relative aspect-[21/9] bg-muted/20 rounded-[2rem] overflow-hidden group border border-border shadow-inner"
                  >
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col justify-end p-8">
                       <div className="flex justify-between items-center">
                          <p className="text-white text-[10px] font-black uppercase tracking-widest">{t('form.image_banner')}</p>
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
                            {t('form.cancel')}
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
                    className="block aspect-[21/9] border-4 border-dashed border-border rounded-[2.5rem] p-12 text-center bg-muted/5 hover:bg-muted/10 hover:border-purple-500/30 transition-all cursor-pointer group relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/02 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="w-20 h-20 bg-muted rounded-[2rem] flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform shadow-sm group-hover:bg-card">
                      <ImageIcon className="w-10 h-10 text-muted-foreground group-hover:text-purple-600 transition-colors" />
                    </div>
                    <p className="text-foreground font-black uppercase tracking-widest text-xs mb-2">{t('form.image_banner')}</p>
                    <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest opacity-60">{t('form.image_hint')}</p>
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

          {/* Main Info Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card/50 backdrop-blur-xl rounded-[2.5rem] border border-border overflow-hidden shadow-2xl shadow-emerald-500/05"
          >
            <div className="p-10 border-b border-border/50 bg-muted/5">
              <h2 className="text-[10px] font-black text-foreground uppercase tracking-widest flex items-center gap-3">
                <div className="w-2 h-5 bg-emerald-500 rounded-full" />
                {t('details_section')}
              </h2>
            </div>
            
            <div className="p-10 space-y-10">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <GovInput
                    label={t('form.short_name')}
                    placeholder="Ex: MED-CIT-2024"
                    error={errors.nom?.message}
                    {...register('nom')}
                  />
                  <GovSelect
                    label={t('form.type')}
                    options={[
                      { label: t('form.type_placeholder'), value: "" },
                      ...TYPES_LIST.map(val => ({ label: t(`types.${val}`), value: val }))
                    ]}
                    error={errors.type?.message}
                    {...register('type')}
                  />
               </div>

              <GovInput
                label={t('form.public_title')}
                placeholder="Ex: Grande Campagne de Citoyenneté Active"
                leftIcon={<Sparkles size={18} />}
                error={errors.titre?.message}
                {...register('titre')}
                className="text-xl font-bold"
              />

              <GovTextarea
                label={t('form.short_desc')}
                placeholder="Un résumé percutant pour le public..."
                rows={2}
                {...register('description')}
              />

              <GovTextarea
                label={t('form.content')}
                placeholder="Détaillez les objectifs et les modalités de la campagne..."
                rows={12}
                error={errors.contenu?.message}
                {...register('contenu')}
                className="leading-relaxed"
              />
            </div>
          </motion.div>
        </div>

        {/* Right Column: Settings & Goals */}
        <div className="space-y-10">
          {/* Section Objectifs & Dates */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card/50 backdrop-blur-xl rounded-[2.5rem] border border-border p-10 shadow-xl"
          >
            <h3 className="text-[10px] font-black text-foreground uppercase tracking-widest flex items-center gap-3 mb-8">
              <Target className="w-5 h-5 text-amber-500" />
              {t('goals_dates_section')}
            </h3>

            <div className="space-y-8">
              <GovInput
                label={t('form.participants_goal')}
                type="number"
                placeholder="Ex: 5000"
                {...register('objectifParticipations')}
              />

              <div className="grid grid-cols-1 gap-6">
                <GovInput
                  label={t('form.start_date')}
                  type="date"
                  leftIcon={<Calendar size={16} />}
                  {...register('dateDebut')}
                />
                <GovInput
                  label={t('form.end_date')}
                  type="date"
                  leftIcon={<Calendar size={16} />}
                  {...register('dateFin')}
                />
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-foreground uppercase tracking-widest">{t('form.theme_color')}</label>
                <div className="flex gap-4">
                   <div className="relative w-14 h-14 rounded-2xl border border-border overflow-hidden p-1 bg-muted/20">
                    <input
                      {...register('couleurTheme')}
                      type="color"
                      className="w-full h-full cursor-pointer bg-transparent border-none scale-150"
                    />
                   </div>
                  <GovInput
                    label=""
                    placeholder="#000000"
                    {...register('couleurTheme')}
                    className="uppercase flex-1"
                  />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Section Statut & Options */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-card/50 backdrop-blur-xl rounded-[2.5rem] border border-border p-10 shadow-xl"
          >
            <h3 className="text-[10px] font-black text-foreground uppercase tracking-widest flex items-center gap-3 mb-8">
              <Send className="w-5 h-5 text-emerald-500" />
              {t('status_section')}
            </h3>
            
            <div className="space-y-4">
              {STATUTS_LIST.map(statut => (
                <label 
                  key={statut}
                  className={cn(
                    "relative flex flex-col p-5 rounded-[1.5rem] border-2 cursor-pointer transition-all group shadow-sm",
                    selectedStatut === statut
                      ? "border-emerald-500 bg-emerald-500/5 shadow-emerald-500/10 shadow-lg scale-[1.02]"
                      : "border-border bg-muted/10 hover:border-border/80"
                  )}
                >
                  <input
                    type="radio"
                    {...register('statut')}
                    value={statut}
                    className="sr-only"
                  />
                  <div className="flex justify-between items-center mb-1">
                    <span className={cn(
                      "text-[10px] font-black uppercase tracking-widest transition-colors",
                      selectedStatut === statut ? "text-emerald-700" : "text-foreground"
                    )}>{t(`statuses.${statut}_label`)}</span>
                    {selectedStatut === statut && <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,1)]" />}
                  </div>
                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest opacity-60 leading-tight">{t(`statuses.${statut}_desc`)}</span>
                </label>
              ))}
            </div>

            <div className="mt-10 pt-10 border-t border-border/50 space-y-6">
               <h3 className="text-[10px] font-black text-foreground uppercase tracking-widest flex items-center gap-3 mb-2">
                <Building2 className="w-5 h-5 text-blue-500" />
                Options Structurelles
              </h3>
              
              <label className="flex items-start gap-4 p-4 rounded-2xl border border-border/50 hover:bg-muted/5 transition-colors cursor-pointer group">
                <input
                  type="checkbox"
                  {...register('isOrganiseParProvince')}
                  className="w-5 h-5 rounded-lg border-border text-emerald-600 focus:ring-emerald-500/20 mt-0.5"
                />
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest block group-hover:text-emerald-700 transition-colors">{t('form.organized_by_province')}</span>
                  <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest opacity-60 mt-0.5">{t('form.organized_by_province_desc')}</p>
                </div>
              </label>

              <label className="flex items-start gap-4 p-4 rounded-2xl border border-border/50 hover:bg-muted/5 transition-colors cursor-pointer group">
                <input
                  type="checkbox"
                  {...register('sousCouvertProvince')}
                  className="w-5 h-5 rounded-lg border-border text-emerald-600 focus:ring-emerald-500/20 mt-0.5"
                />
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest block group-hover:text-emerald-700 transition-colors">{t('form.under_cover_province')}</span>
                  <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest opacity-60 mt-0.5">{t('form.under_cover_province_desc')}</p>
                </div>
              </label>
            </div>
          </motion.div>
        </div>
      </form>
    </div>
  );
}

