'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { useTranslations, useLocale } from 'next-intl';
import { 
  Calendar, 
  MapPin, 
  Clock,
  AlignLeft, 
  Image as ImageIcon, 
  Save, 
  X, 
  Building2,
  Tag,
  Loader2,
  Users,
  ArrowLeft,
  Sparkles,
  Phone,
  Mail,
  User,
  Link as LinkIcon,
  Globe
} from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { GovInput, GovSelect, GovTextarea, GovButton } from '@/components/ui';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';


export default function NouveauEventPage() {
  const t = useTranslations('admin.events_page.create_modal');
  const tForm = useTranslations('admin.events_page.create_modal.form');
  const router = useRouter();
  const { data: session } = useSession();

  const eventSchema = z.object({
    titre: z.string().min(5, t('errors.create_error')).max(100),
    description: z.string().min(20, t('errors.create_error')).max(2000),
    etablissementId: z.string().min(1, t('form.select_establishment')),
    typeCategorique: z.string().min(1, t('form.select_type')),
    dateDebut: z.string().min(1, t('form.date_start')),
    dateFin: z.string().optional(),
    heureDebut: z.string().optional(),
    heureFin: z.string().optional(),
    lieu: z.string().optional(),
    adresse: z.string().optional(),
    quartierDouar: z.string().optional(),
    capaciteMax: z.string().optional(),
    organisateur: z.string().optional(),
    contactOrganisateur: z.string().optional(),
    emailContact: z.string().email('Email invalide').optional().or(z.literal('')),
    inscriptionsOuvertes: z.boolean().optional(),
    lienInscription: z.string().url('Lien invalide').optional().or(z.literal('')),
    tags: z.string().optional(),
  });
  type EventForm = z.infer<typeof eventSchema>;
  const [loading, setLoading] = useState(false);
  const [etablissements, setEtablissements] = useState<{id: number, nom: string, nomArabe?: string, secteur?: string}[]>([]);
  
  // Image state
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors }, watch } = useForm<EventForm>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      inscriptionsOuvertes: false
    }
  });

  const watchedType = watch('typeCategorique');
  const watchedInscriptions = watch('inscriptionsOuvertes');

  useEffect(() => {
    const fetchEtablissements = async () => {
      try {
        let url = '/api/etablissements?limit=100';
        
        if (session?.user?.secteurResponsable) {
          url += `&secteur=${session.user.secteurResponsable}`;
        }

        const res = await fetch(url);
        const data = await res.json();
        if (data.data) {
          setEtablissements(data.data);
        }
      } catch (error) {
        console.error("Erreur chargement établissements", error);
      }
    };

    if (session?.user) {
      fetchEtablissements();
    }
  }, [session]);
  const locale = useLocale();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        toast.error(t('errors.image_size'));
        return;
      }
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const onSubmit = async (data: EventForm) => {
    setLoading(true);
    const submitPromise = new Promise(async (resolve, reject) => {
      try {
        let imageUrl = null;

        if (selectedImage) {
          const formData = new FormData();
          formData.append('file', selectedImage);
          formData.append('type', 'evenements');

          const uploadRes = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          });

          if (!uploadRes.ok) {
            const errData = await uploadRes.json();
            reject(new Error(errData.error || t('errors.upload_error')));
            return;
          }

          const uploadData = await uploadRes.json();
          imageUrl = uploadData.url;
        }

        // Parse tags
        const tagsArray = data.tags ? data.tags.split(',').map(t => t.trim()).filter(Boolean) : [];

        const res = await fetch('/api/evenements', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
              ...data,
              etablissementId: parseInt(data.etablissementId),
              capaciteMax: data.capaciteMax ? parseInt(data.capaciteMax) : null,
              tags: tagsArray,
              imagePrincipale: imageUrl
          }),
        });

        if (res.ok) {
          resolve(true);
          router.push('/admin/evenements');
          router.refresh();
        } else {
          const errorData = await res.json();
          reject(new Error(errorData.error || t('errors.create_error')));
        }
      } catch (error) {
        reject(error instanceof Error ? error : new Error(t('errors.create_error')));
      } finally {
        setLoading(false);
      }
    });

    toast.promise(submitPromise, {
      loading: 'Création en cours...',
      success: 'Événement créé avec succès',
      error: (err: any) => err.message,
    });
  };

  const typeColors: Record<string, string> = {
    CULTUREL: 'from-purple-500 to-pink-500',
    SPORTIF: 'from-green-500 to-emerald-500',
    SOCIAL: 'from-orange-500 to-amber-500',
    EDUCATIF: 'from-blue-500 to-cyan-500',
    SANTE: 'from-red-500 to-red-600',
    AUTRE: 'from-gray-500 to-gray-600',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      <div className="max-w-5xl mx-auto px-4 py-8">
        
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <Link 
            href="/admin/evenements"
            className="inline-flex items-center gap-2 text-[10px] font-black text-muted-foreground hover:text-[hsl(var(--gov-blue))] mb-6 transition-all uppercase tracking-widest group"
          >
            <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center group-hover:bg-[hsl(var(--gov-blue)/0.1)] transition-colors">
              <ArrowLeft size={12} />
            </div>
            <span>{t('back_list')}</span>
          </Link>
          
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-gradient-to-br from-[hsl(var(--gov-blue))] to-[hsl(var(--gov-blue-dark))] rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-[hsl(var(--gov-blue)/0.3)] ring-4 ring-white dark:ring-slate-900">
              <Sparkles className="w-10 h-10" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-foreground uppercase tracking-tight leading-none mb-2">
                {t('title_new')}
              </h1>
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest opacity-70">
                {t('subtitle_new')}
              </p>
            </div>
          </div>
        </motion.div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          
          {/* Section 1: Image de couverture */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card/50 backdrop-blur-xl rounded-[2.5rem] shadow-xl border border-border overflow-hidden"
          >
            <div className="p-8 border-b border-border bg-gradient-to-br from-muted/50 to-transparent">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                  <ImageIcon size={20} />
                </div>
                <div>
                  <h2 className="text-sm font-black text-foreground uppercase tracking-widest">
                    {t('sections.visual')}
                  </h2>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">{t('sections.visual_hint')}</p>
                </div>
              </div>
            </div>
            
            <div className="p-8">
              {previewUrl ? (
                <div className="relative w-full h-80 bg-muted/30 rounded-[2rem] overflow-hidden group shadow-inner border border-border">
                  <img src={previewUrl} alt="Prévisualisation" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-end p-8">
                    <div className="w-full flex justify-between items-center">
                      <span className="text-[10px] font-black text-white uppercase tracking-widest">{tForm('image_selected')}</span>
                      <GovButton
                        type="button"
                        onClick={() => {
                          setSelectedImage(null);
                          setPreviewUrl(null);
                        }}
                        variant="danger"
                        size="sm"
                        className="rounded-full px-6"
                      >
                        {tForm('image_delete')}
                      </GovButton>
                    </div>
                  </div>
                </div>
              ) : (
                <label className="block border-4 border-dashed border-border/50 rounded-[2.5rem] p-16 text-center bg-muted/10 hover:bg-muted/20 hover:border-[hsl(var(--gov-blue)/0.3)] transition-all cursor-pointer group relative overflow-hidden">
                  <div className="relative z-10">
                    <div className="w-20 h-20 bg-gradient-to-br from-[hsl(var(--gov-blue)/0.1)] to-emerald-500/10 rounded-[2rem] flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-500 shadow-sm">
                      <ImageIcon className="w-10 h-10 text-[hsl(var(--gov-blue))]" />
                    </div>
                    <p className="text-sm font-black text-foreground uppercase tracking-tight mb-2">{tForm('upload_text')}</p>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">{tForm('upload_hint')}</p>
                  </div>
                  <input 
                    type="file" 
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                </label>
              )}
            </div>
          </motion.div>

          {/* Section 2: Informations Principales */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card/50 backdrop-blur-xl rounded-[2.5rem] shadow-xl border border-border overflow-hidden"
          >
            <div className="p-8 border-b border-border bg-gradient-to-br from-muted/50 to-transparent">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-[hsl(var(--gov-blue)/0.1)] flex items-center justify-center text-[hsl(var(--gov-blue))]">
                  <AlignLeft size={20} />
                </div>
                <div>
                  <h2 className="text-sm font-black text-foreground uppercase tracking-widest">
                    {t('sections.info')}
                  </h2>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">Informations essentielles de l'événement</p>
                </div>
              </div>
            </div>
            
            <div className="p-8 space-y-8">
              {/* Titre */}
              <GovInput
                label={tForm('title_label') + " *"}
                placeholder={tForm('title_placeholder')}
                error={errors.titre?.message}
                className="text-lg font-black uppercase tracking-tight"
                {...register('titre')}
              />

              {/* Description */}
              <GovTextarea
                label={tForm('desc_label') + " *"}
                placeholder={tForm('desc_placeholder')}
                error={errors.description?.message}
                className="leading-relaxed"
                {...register('description')}
              />

              <div className="grid md:grid-cols-2 gap-8">
                {/* Établissement */}
                <GovSelect
                  label={tForm('establishment_label') + " *"}
                  error={errors.etablissementId?.message}
                  leftIcon={<Building2 size={18} />}
                  options={[
                    { label: tForm('select_placeholder'), value: "" },
                    ...etablissements.map(e => ({
                      label: locale === 'ar' ? (e.nomArabe || e.nom) : e.nom,
                      value: e.id
                    }))
                  ]}
                  {...register('etablissementId')}
                />

                {/* Type */}
                <GovSelect
                  label={tForm('type_label') + " *"}
                  error={errors.typeCategorique?.message}
                  leftIcon={<Tag size={18} />}
                  options={[
                    { label: tForm('select_placeholder'), value: "" },
                    { label: "🎭 Culturel", value: "CULTUREL" },
                    { label: "⚽ Sportif", value: "SPORTIF" },
                    { label: "🤝 Social", value: "SOCIAL" },
                    { label: "📚 Éducatif", value: "EDUCATIF" },
                    { label: "🏥 Santé", value: "SANTE" },
                    { label: "📌 Autre", value: "AUTRE" }
                  ]}
                  {...register('typeCategorique')}
                />
              </div>

              {/* Tags */}
              <GovInput
                label={tForm('tags')}
                placeholder={tForm('tags_placeholder')}
                leftIcon={<Sparkles size={18} />}
                {...register('tags')}
              />
            </div>
          </motion.div>

          {/* Section 3: Date, Heure et Lieu */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-card/50 backdrop-blur-xl rounded-[2.5rem] shadow-xl border border-border overflow-hidden"
          >
            <div className="p-8 border-b border-border bg-gradient-to-br from-muted/50 to-transparent">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600">
                  <Calendar size={20} />
                </div>
                <div>
                  <h2 className="text-sm font-black text-foreground uppercase tracking-widest">
                    {t('sections.date_location')}
                  </h2>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">Planification temporelle et spatiale</p>
                </div>
              </div>
            </div>
            
            <div className="p-8 space-y-8">
              {/* Dates */}
              <div className="grid md:grid-cols-2 gap-8">
                <GovInput
                  label={tForm('start_date') + " *"}
                  type="date"
                  error={errors.dateDebut?.message}
                  leftIcon={<Calendar size={18} />}
                  {...register('dateDebut')}
                />
                <GovInput
                  label={tForm('end_date')}
                  type="date"
                  leftIcon={<Calendar size={18} />}
                  {...register('dateFin')}
                />
              </div>

              {/* Heures */}
              <div className="grid md:grid-cols-2 gap-8">
                <GovInput
                  label={tForm('start_time')}
                  type="time"
                  leftIcon={<Clock size={18} />}
                  {...register('heureDebut')}
                />
                <GovInput
                  label={tForm('end_time')}
                  type="time"
                  leftIcon={<Clock size={18} />}
                  {...register('heureFin')}
                />
              </div>

              {/* Lieu */}
              <div className="grid md:grid-cols-2 gap-8">
                <GovInput
                  label={tForm('location_label')}
                  placeholder={tForm('location_placeholder')}
                  leftIcon={<MapPin size={18} />}
                  {...register('lieu')}
                />
                <GovInput
                  label={tForm('address')}
                  placeholder={tForm('address_placeholder')}
                  leftIcon={<MapPin size={18} />}
                  {...register('adresse')}
                />
              </div>

              <GovInput
                label={tForm('neighborhood')}
                placeholder={tForm('neighborhood_placeholder')}
                leftIcon={<Globe size={18} />}
                {...register('quartierDouar')}
              />
            </div>
          </motion.div>

          {/* Section 4: Organisateur & Contact */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-card/50 backdrop-blur-xl rounded-[2.5rem] shadow-xl border border-border overflow-hidden"
          >
            <div className="p-8 border-b border-border bg-gradient-to-br from-muted/50 to-transparent">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-600">
                  <User size={20} />
                </div>
                <div>
                  <h2 className="text-sm font-black text-foreground uppercase tracking-widest">
                    {t('sections.organizer')}
                  </h2>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">{t('sections.organizer_hint')}</p>
                </div>
              </div>
            </div>
            
            <div className="p-8">
              <div className="grid md:grid-cols-3 gap-8">
                <GovInput
                  label={tForm('organizer_name')}
                  placeholder={tForm('organizer_name_placeholder')}
                  leftIcon={<User size={18} />}
                  {...register('organisateur')}
                />
                <GovInput
                  label={tForm('organizer_phone')}
                  type="tel"
                  placeholder={tForm('organizer_phone_placeholder')}
                  leftIcon={<Phone size={18} />}
                  {...register('contactOrganisateur')}
                />
                <GovInput
                  label={tForm('organizer_email')}
                  type="email"
                  placeholder={tForm('organizer_email_placeholder')}
                  error={errors.emailContact?.message}
                  leftIcon={<Mail size={18} />}
                  {...register('emailContact')}
                />
              </div>
            </div>
          </motion.div>

          {/* Section 5: Participation & Inscription */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-card/50 backdrop-blur-xl rounded-[2.5rem] shadow-xl border border-border overflow-hidden"
          >
            <div className="p-8 border-b border-border bg-gradient-to-br from-muted/50 to-transparent">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                  <Users size={20} />
                </div>
                <div>
                  <h2 className="text-sm font-black text-foreground uppercase tracking-widest">
                    {t('sections.participation')}
                  </h2>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">Gestion de la capacité et des inscriptions</p>
                </div>
              </div>
            </div>
            
            <div className="p-8 space-y-8">
              <div className="grid md:grid-cols-2 gap-8">
                <GovInput
                  label={tForm('max_capacity')}
                  type="number"
                  placeholder={tForm('capacity_placeholder')}
                  leftIcon={<Users size={18} />}
                  {...register('capaciteMax')}
                />

                <div className="flex items-end">
                  <label className={cn(
                    "flex items-start gap-4 p-5 rounded-[1.5rem] border-2 cursor-pointer transition-all w-full group shadow-sm",
                    watchedInscriptions 
                      ? "border-emerald-500 bg-emerald-500/5 shadow-emerald-500/10 shadow-lg" 
                      : "border-border bg-muted/10 hover:border-border/80"
                  )}>
                    <input
                      type="checkbox"
                      {...register('inscriptionsOuvertes')}
                      className="w-6 h-6 rounded-lg border-border text-emerald-600 mt-1 focus:ring-emerald-500/20 transition-all cursor-pointer"
                    />
                    <div>
                      <span className={cn(
                        "text-xs font-black uppercase tracking-widest block transition-colors",
                        watchedInscriptions ? "text-emerald-700" : "text-foreground"
                      )}>
                        {tForm('open_registrations')}
                      </span>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">
                        {tForm('open_registrations_hint')}
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              <AnimatePresence>
                {watchedInscriptions && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <GovInput
                      label={tForm('registration_link')}
                      placeholder="Ex: https://forms.google.com/..."
                      error={errors.lienInscription?.message}
                      leftIcon={<LinkIcon size={18} />}
                      {...register('lienInscription')}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Actions */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex items-center justify-between pt-10 border-t border-border"
          >
            <GovButton
              asChild
              variant="outline"
              className="h-14 px-10 rounded-2xl"
            >
              <Link href="/admin/evenements">
                {t('buttons.cancel')}
              </Link>
            </GovButton>
            
            <GovButton
              type="submit"
              loading={loading}
              variant="primary"
              className={cn(
                "h-14 px-12 rounded-2xl text-lg shadow-2xl transition-all duration-500",
                watchedType ? typeColors[watchedType] : "bg-[hsl(var(--gov-blue))] hover:bg-[hsl(var(--gov-blue-dark))]"
              )}
              leftIcon={!loading && <Save size={22} />}
            >
              {t('buttons.create')}
            </GovButton>
          </motion.div>
        </form>
      </div>
    </div>
  );
}

