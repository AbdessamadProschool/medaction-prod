'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useSession } from 'next-auth/react';
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
  ArrowRight,
  Phone,
  Mail,
  User,
  Link as LinkIcon,
  LayoutTemplate,
  AlertCircle
} from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { toast } from 'sonner';

export default function ModifierEvenementPage() {
  const t = useTranslations('delegation.dashboard.event_creation');
  const tEdit = useTranslations('delegation.dashboard.event_edit');
  const locale = useLocale();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { data: session } = useSession();
  const [etablissements, setEtablissements] = useState<{id: number, nom: string, secteur?: string}[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [evenement, setEvenement] = useState<any>(null);
  
  // Image state
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);

  const eventSchema = z.object({
    titre: z.string().min(5, t('validation.title_min')).max(100),
    description: z.string().min(20, t('validation.description_min')).max(2000),
    etablissementId: z.string().min(1, t('validation.establishment_required')),
    typeCategorique: z.string().min(1, t('validation.type_required')),
    dateDebut: z.string().min(1, t('validation.start_date_required')),
    dateFin: z.string().optional(),
    heureDebut: z.string().optional(),
    heureFin: z.string().optional(),
    lieu: z.string().optional(),
    adresse: z.string().optional(),
    quartierDouar: z.string().optional(),
    capaciteMax: z.string().optional(),
    organisateur: z.string().optional(),
    contactOrganisateur: z.string().optional(),
    emailContact: z.string().email(t('validation.email_invalid')).optional().or(z.literal('')),
    inscriptionsOuvertes: z.boolean().optional(),
    lienInscription: z.string().url(t('validation.url_invalid')).optional().or(z.literal('')),
    tags: z.string().optional(),
  });

  type EventForm = z.infer<typeof eventSchema>;

  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm<EventForm>({
    resolver: zodResolver(eventSchema),
  });

  const watchedInscriptions = watch('inscriptionsOuvertes');
  const watchedType = watch('typeCategorique');

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

  // Charger l'événement existant
  useEffect(() => {
    if (!id) return;
    
    fetch(`/api/delegation/evenements/${id}`)
      .then(res => res.json())
      .then(data => {
        if (data.data) {
          const evt = data.data;
          setEvenement(evt);
          
          // Pré-remplir le formulaire
          reset({
            titre: evt.titre,
            description: evt.description,
            etablissementId: evt.etablissementId?.toString(),
            typeCategorique: evt.typeCategorique,
            dateDebut: evt.dateDebut ? new Date(evt.dateDebut).toISOString().split('T')[0] : '',
            dateFin: evt.dateFin ? new Date(evt.dateFin).toISOString().split('T')[0] : '',
            heureDebut: evt.heureDebut || '',
            heureFin: evt.heureFin || '',
            lieu: evt.lieu || '',
            adresse: evt.adresse || '',
            quartierDouar: evt.quartierDouar || '',
            capaciteMax: evt.capaciteMax?.toString() || '',
            organisateur: evt.organisateur || '',
            contactOrganisateur: evt.contactOrganisateur || '',
            emailContact: evt.emailContact || '',
            inscriptionsOuvertes: evt.inscriptionsOuvertes || false,
            lienInscription: evt.lienInscription || '',
            tags: evt.tags?.join(', ') || '',
          });
          
          // Image actuelle - chercher l'Image Principale en priorité
          if (evt.medias && evt.medias.length > 0) {
            const mainImage = evt.medias.find((m: any) => m.nomFichier === 'Image Principale' && m.type === 'IMAGE')
              || evt.medias.find((m: any) => m.type === 'IMAGE');
            if (mainImage) {
              setCurrentImageUrl(mainImage.urlPublique);
            }
          }
        } else {
          toast.error(tEdit('errors.not_found'));
        }
      })
      .catch(err => {
        console.error(err);
        toast.error(tEdit('errors.update_failed')); // Generic error
      })
      .finally(() => setLoading(false));
  }, [id, reset, tEdit]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        toast.error(t('sections.visual.error_size'));
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

  const onSubmit = async (data: EventForm) => {
    setSaving(true);
    try {
      let imageUrl = currentImageUrl;
      
      // === UPLOAD DE LA NOUVELLE IMAGE SI SÉLECTIONNÉE ===
      if (selectedImage) {
        const formData = new FormData();
        formData.append('file', selectedImage);
        formData.append('type', 'evenements');

        try {
          const uploadRes = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          });

          if (!uploadRes.ok) {
            throw new Error(tEdit('errors.image_upload_failed'));
          }

          const uploadData = await uploadRes.json();
          imageUrl = uploadData.url;

        } catch (uploadError) {
            console.error(uploadError);
            toast.error(tEdit('errors.image_upload_failed'));
            // Ask user if they want to continue without image update? 
            // For now, let's just stop or continue with old image if we want robust UX. 
            // Simpler: Just rely on error toast and let user decide to try again or remove image.
            setSaving(false);
            return; 
        }
      }

      // Parse tags
      const tagsArray = data.tags ? data.tags.split(',').map(t => t.trim()).filter(Boolean) : [];

      // === MISE À JOUR DE L'ÉVÉNEMENT ===
      const res = await fetch(`/api/delegation/evenements/${id}`, {
        method: 'PUT',
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
        toast.success(tEdit('success.updated'));
        router.push('/delegation/evenements?updated=true');
        router.refresh();
      } else {
        const errorData = await res.json();
        toast.error(errorData.error || tEdit('errors.update_failed'));
      }
    } catch (error) {
      console.error(error);
      toast.error(tEdit('errors.update_failed'));
    } finally {
      setSaving(false);
    }
  };
  
    const typeColors: Record<string, string> = {
    CULTUREL: 'from-purple-500 to-pink-500',
    SPORTIF: 'from-green-500 to-emerald-500',
    SOCIAL: 'from-orange-500 to-amber-500',
    EDUCATIF: 'from-blue-500 to-cyan-500',
    SANTE: 'from-red-500 to-red-600',
    AUTRE: 'from-gray-500 to-gray-600',
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!evenement) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <X className="w-16 h-16 text-red-400" />
        <h1 className="text-xl font-semibold text-gray-700">{tEdit('errors.not_found')}</h1>
        <Link href="/delegation/evenements" className="text-blue-600 hover:underline">
           {t('back_to_list')}
        </Link>
      </div>
    );
  }

  const displayImage = previewUrl || currentImageUrl;

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-4">
        
        {/* Header with Premium Design */}
        <div className="mb-4 relative">
          <Link 
            href="/delegation/evenements"
            className="inline-flex items-center gap-2 text-gray-500 hover:text-blue-600 mb-2 transition-colors group font-bold text-sm"
          >
            <ArrowRight size={20} className="rtl:rotate-0 rotate-180 group-hover:translate-x-[-4px] rtl:group-hover:translate-x-[4px] transition-transform" />
            <span>{t('back_to_list')}</span>
          </Link>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-gray-100">
             <div className="space-y-1">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-blue-50 rounded-full border border-blue-100 animate-fade-in-up">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                    <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">{tEdit('subtitle')}</span>
                </div>
                <h1 className="text-xl font-black text-gray-900 tracking-tight leading-tight">
                    {tEdit('title')}
                </h1>
             </div>
             <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30 transform -rotate-3 hover:rotate-0 transition-transform cursor-pointer">
                <Calendar className="w-5 h-5 text-white" />
             </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 animate-fade-in-up animation-delay-100">
          
          {/* Section 1: Image de couverture */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden group hover:shadow-md transition-all duration-300">
            <div className={`px-5 py-2.5 border-b border-gray-50 bg-gradient-to-r rtl:bg-gradient-to-l from-blue-50/50 to-transparent ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
              <h2 className="text-sm font-black text-gray-900 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-blue-100 rounded-lg text-blue-600">
                     <ImageIcon className="w-4 h-4 shadow-sm" />
                  </div>
                  {t('sections.visual.title')}
                </div>
              </h2>
            </div>
            
            <div className="p-4">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Image Actuelle */}
                {currentImageUrl ? (
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider text-start">{t('sections.visual.current_image')}</p>
                    <div className="relative aspect-video rounded-xl overflow-hidden border border-gray-100 shadow-sm group">
                      <img src={currentImageUrl} alt="Event" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="px-4 py-2 bg-white/20 backdrop-blur-md rounded-lg text-white text-xs font-bold border border-white/30">
                          {t('sections.visual.image_id')}: {evenement?.id?.toString().slice(-6)}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}

                {/* Nouvelle Image / Preview */}
                <div className="space-y-2">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider text-start">{previewUrl ? t('sections.visual.new_preview') : t('sections.visual.change_image')}</p>
                  {previewUrl ? (
                    <div className="relative aspect-video rounded-xl overflow-hidden border-2 border-indigo-200 shadow-md group">
                      <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedImage(null);
                          setPreviewUrl(null);
                        }}
                        className="absolute top-2 right-2 rtl:right-auto rtl:left-2 p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors shadow-lg"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <label className="relative flex flex-col items-center justify-center aspect-video border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50 hover:bg-indigo-50/50 hover:border-indigo-300 transition-all cursor-pointer group overflow-hidden">
                      <div className="w-10 h-10 bg-white rounded-full shadow-sm flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                        <ImageIcon className="w-5 h-5 text-gray-400 group-hover:text-indigo-500 transition-colors" />
                      </div>
                      <p className="text-xs font-bold text-gray-600">{t('sections.visual.click_to_add')}</p>
                      <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                    </label>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Section Informations */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-300">
            <div className={`px-5 py-2.5 border-b border-gray-50 bg-gradient-to-r rtl:bg-gradient-to-l from-indigo-50/50 to-transparent ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
              <h2 className="text-sm font-black text-gray-900 flex items-center gap-2">
                 <div className="p-1.5 bg-indigo-100 rounded-lg text-indigo-600 shadow-sm">
                   <AlignLeft className="w-4 h-4" />
                 </div>
                 {t('sections.general.title')}
              </h2>
            </div>
            
            <div className="p-4 space-y-4">
              {/* Titre */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-700 text-start">
                  {t('sections.general.event_title')} <span className="text-red-500">*</span>
                </label>
                <div className="relative group">
                    <input
                      {...register('titre')}
                      type="text"
                      placeholder={t('sections.general.event_title_placeholder')}
                      className="w-full px-4 py-2 pr-11 rtl:pr-11 rtl:pl-4 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all font-bold placeholder:text-gray-300 bg-gray-50/50 focus:bg-white text-sm text-start"
                    />
                     <div className="absolute right-4 rtl:right-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors pointer-events-none">
                        <LayoutTemplate size={20} />
                     </div>
                </div>
                {errors.titre && <p className="text-red-500 text-[10px] font-bold mt-1 animate-pulse">{errors.titre.message}</p>}
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-700 text-start">
                   {t('sections.general.description')} <span className="text-red-500">*</span>
                </label>
                <textarea
                {...register('description')}
                rows={4}
                placeholder={t('sections.general.description_placeholder')}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all font-medium placeholder:text-gray-300 bg-gray-50/50 focus:bg-white text-sm leading-relaxed resize-none text-start"
                />
                {errors.description && <p className="text-red-500 text-[10px] font-bold mt-1 animate-pulse">{errors.description.message}</p>}
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {/* Type */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-700 text-start">
                    {t('sections.general.event_type')} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative group">
                    <select
                      {...register('typeCategorique')}
                      className="w-full px-4 py-2 pr-11 pl-10 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none bg-gray-50/50 focus:bg-white font-bold text-gray-700 appearance-none cursor-pointer transition-all hover:bg-white text-sm text-start"
                    >
                      <option value="">{t('sections.general.select_type')}</option>
                      <option value="CULTUREL">{t('types.culturel')}</option>
                      <option value="SPORTIF">{t('types.sportif')}</option>
                      <option value="SOCIAL">{t('types.social')}</option>
                      <option value="EDUCATIF">{t('types.educatif')}</option>
                      <option value="SANTE">{t('types.sante')}</option>
                      <option value="AUTRE">{t('types.autre')}</option>
                    </select>
                     <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none group-focus-within:text-indigo-500 transition-colors">
                        <Tag size={20} />
                    </div>
                  </div>
                  {errors.typeCategorique && <p className="text-red-500 text-[10px] font-bold mt-1 animate-pulse">{errors.typeCategorique.message}</p>}
                </div>

                {/* Établissement */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-700 text-start">
                    {t('sections.general.establishment')} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative group">
                    <select
                      {...register('etablissementId')}
                      className="w-full px-4 py-2 pr-11 pl-10 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none bg-gray-50/50 focus:bg-white font-bold text-gray-700 appearance-none cursor-pointer transition-all hover:bg-white text-sm text-start"
                    >
                      <option value="">{t('sections.general.select_establishment')}</option>
                      {etablissements.map(e => (
                        <option key={e.id} value={e.id}>{e.nom}</option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none group-focus-within:text-indigo-500 transition-colors">
                        <Building2 size={20} />
                    </div>
                  </div>
                  {errors.etablissementId && <p className="text-red-500 text-[10px] font-bold mt-1 animate-pulse">{errors.etablissementId.message}</p>}
                </div>
              </div>

              {/* Tags */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-700 text-start">
                  {t('sections.general.tags')} <span className="text-gray-400 font-normal text-[10px] italic">{t('sections.general.tags_hint')}</span>
                </label>
                <div className="relative group">
                    <input
                      {...register('tags')}
                      type="text"
                      placeholder={t('sections.general.tags_placeholder')}
                      className="w-full px-4 py-2 pr-11 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all font-bold placeholder:text-gray-300 bg-gray-50/50 focus:bg-white text-sm text-start"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors pointer-events-none">
                        <Tag size={20} />
                    </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section Date et Lieu */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-300">
            <div className={`px-5 py-2.5 border-b border-gray-50 bg-gradient-to-r rtl:bg-gradient-to-l from-amber-50/50 to-transparent ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
              <h2 className="text-sm font-black text-gray-900 flex items-center gap-2 font-cairo">
                 <div className="p-1.5 bg-amber-100 rounded-lg text-amber-600 shadow-sm">
                   <Calendar className="w-4 h-4" />
                 </div>
                 {t('sections.datetime.title')}
              </h2>
            </div>
            
            <div className="p-4 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-700 text-start">
                    {t('sections.datetime.start_date')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('dateDebut')}
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 outline-none font-bold text-gray-700 cursor-pointer text-sm bg-gray-50/50 focus:bg-white transition-all"
                  />
                  {errors.dateDebut && <p className="text-red-500 text-[10px] font-bold mt-1 animate-pulse">{errors.dateDebut.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-700 text-start">{t('sections.datetime.end_date')}</label>
                  <input
                    {...register('dateFin')}
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 outline-none font-bold text-gray-700 cursor-pointer text-sm bg-gray-50/50 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-700 text-start">{t('sections.datetime.start_time')}</label>
                  <div className="relative group">
                    <input
                      {...register('heureDebut')}
                      type="text"
                      placeholder="00:00"
                      className="w-full px-4 py-2 pr-11 rounded-xl border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 outline-none font-bold text-gray-700 text-sm bg-gray-50/50 focus:bg-white transition-all text-start"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-amber-500 transition-colors pointer-events-none">
                      <Clock size={18} />
                    </div>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-700 text-start">{t('sections.datetime.end_time')}</label>
                  <div className="relative group">
                    <input
                      {...register('heureFin')}
                      type="text"
                      placeholder="00:00"
                      className="w-full px-4 py-2 pr-11 rounded-xl border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 outline-none font-bold text-gray-700 text-sm bg-gray-50/50 focus:bg-white transition-all text-start"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-amber-500 transition-colors pointer-events-none">
                      <Clock size={18} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-700 text-start">
                    {t('sections.datetime.location')}
                  </label>
                  <div className="relative group">
                    <input
                        {...register('lieu')}
                        type="text"
                        placeholder={t('sections.datetime.location_placeholder')}
                        className="w-full px-4 py-2 pr-11 rounded-xl border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 outline-none font-bold bg-gray-50/50 focus:bg-white text-sm transition-all text-start"
                    />
                     <div className="absolute right-4 rtl:right-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-amber-500 transition-colors pointer-events-none">
                        <MapPin size={20} />
                     </div>
                   </div>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-700 text-start">{t('sections.datetime.address')}</label>
                  <input
                    {...register('adresse')}
                    type="text"
                    placeholder={t('sections.datetime.address_placeholder')}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 outline-none font-bold bg-gray-50/50 focus:bg-white text-sm transition-all text-start"
                  />
                </div>
                <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-700 text-start">
                  {t('sections.datetime.neighborhood')}
                </label>
                <input
                  {...register('quartierDouar')}
                  type="text"
                  placeholder={t('sections.datetime.neighborhood_placeholder')}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 outline-none placeholder:text-gray-300 font-bold text-gray-800 text-sm bg-gray-50/50 focus:bg-white transition-all text-start"
                />
              </div>
              </div>
            </div>
          </div>

           {/* Section 4: Organisateur & Contact */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-300">
            <div className="px-5 py-2.5 border-b border-gray-50 bg-gradient-to-r rtl:bg-gradient-to-l from-purple-50/50 to-transparent">
              <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <div className="p-1.5 bg-purple-100 rounded-lg text-purple-600 shadow-sm">
                   <User className="w-4 h-4" />
                </div>
                {t('sections.organizer.title')}
              </h2>
            </div>
            
            <div className="p-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-700 text-start">
                    {t('sections.organizer.name')}
                  </label>
                  <div className="relative group">
                    <input
                        {...register('organisateur')}
                        type="text"
                        placeholder={t('sections.organizer.name_placeholder')}
                        className="w-full px-4 py-2 pr-11 rtl:pr-11 rtl:pl-4 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 outline-none placeholder:text-gray-300 font-bold bg-gray-50/50 focus:bg-white transition-all text-sm text-start"
                    />
                    <div className="absolute right-4 rtl:right-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-purple-500 transition-colors pointer-events-none">
                        <User size={18} />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-700 text-start">
                    {t('sections.organizer.phone')}
                  </label>
                  <div className="relative group">
                    <input
                        {...register('contactOrganisateur')}
                        type="tel"
                        placeholder={t('sections.organizer.phone_placeholder')}
                        className="w-full px-4 py-2 pr-11 rtl:pr-11 rtl:pl-4 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 outline-none placeholder:text-gray-300 font-bold bg-gray-50/50 focus:bg-white transition-all text-sm ltr:text-left text-right"
                    />
                    <div className="absolute right-4 rtl:right-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-purple-500 transition-colors pointer-events-none">
                        <Phone size={18} />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-700 text-start">
                    {t('sections.organizer.email')}
                  </label>
                  <div className="relative group">
                    <input
                        {...register('emailContact')}
                        type="email"
                        placeholder={t('sections.organizer.email_placeholder')}
                        className="w-full px-4 py-2 pr-11 rtl:pr-11 rtl:pl-4 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 outline-none placeholder:text-gray-300 font-bold bg-gray-50/50 focus:bg-white transition-all text-sm text-start"
                    />
                    <div className="absolute right-4 rtl:right-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-purple-500 transition-colors pointer-events-none">
                        <Mail size={18} />
                    </div>
                  </div>
                  {errors.emailContact && <p className="text-red-500 text-[10px] font-bold mt-1 animate-pulse">{errors.emailContact.message}</p>}
                </div>
              </div>
            </div>
          </div>

          {/* Section Participation */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-300">
            <div className="px-5 py-2.5 border-b border-gray-50 bg-gradient-to-r rtl:bg-gradient-to-l from-green-50/50 to-transparent">
              <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                 <div className="p-1.5 bg-green-100 rounded-lg text-green-600 shadow-sm">
                   <Users className="w-4 h-4" />
                 </div>
                 {t('sections.participation.title')}
              </h2>
            </div>
            
            <div className="p-4 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-700 text-start">{t('sections.participation.max_capacity')}</label>
                  <div className="relative group">
                    <input
                        {...register('capaciteMax')}
                        type="number"
                        min="0"
                        placeholder={t('sections.participation.max_capacity_placeholder')}
                        className="w-full px-4 py-2 pr-11 rtl:pr-11 rtl:pl-4 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-500/10 outline-none font-bold bg-gray-50/50 focus:bg-white transition-all text-sm text-start"
                    />
                    <div className="absolute right-4 rtl:right-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-500 transition-colors pointer-events-none">
                        <Users size={18} />
                    </div>
                  </div>
                </div>
                <div className="flex items-center">
                  <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-green-400 hover:bg-green-50/30 cursor-pointer transition-all w-full shadow-sm text-start">
                    <input
                    type="checkbox"
                    {...register('inscriptionsOuvertes')}
                    className="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    <div className="flex flex-col">
                      <span className="font-bold text-gray-800 text-sm">{t('sections.participation.open_registrations')}</span>
                       <span className="text-[10px] text-gray-500 font-medium">{t('sections.participation.open_registrations_desc')}</span>
                    </div>
                  </label>
                </div>
              </div>

              {watchedInscriptions && (
                <div className="animate-in slide-in-from-top-2 fade-in duration-300 space-y-1.5">
                  <label className="block text-xs font-bold text-gray-700 text-start">{t('sections.participation.external_link')}</label>
                  <div className="relative group">
                    <input
                        {...register('lienInscription')}
                        type="url"
                        placeholder={t('sections.participation.external_link_placeholder')}
                        className="w-full px-4 py-2 pr-11 rtl:pr-11 rtl:pl-4 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-500/10 outline-none font-bold bg-gray-50/50 focus:bg-white text-sm ltr:text-left text-right transition-all"
                    />
                    <div className="absolute right-4 rtl:right-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-green-500 transition-colors pointer-events-none">
                        <LinkIcon size={18} />
                    </div>
                  </div>
                  {errors.lienInscription && (
                    <p className="text-red-500 text-[10px] font-bold mt-1 animate-pulse">{errors.lienInscription.message}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <Link
              href="/delegation/evenements"
              className="px-6 py-2.5 text-gray-500 hover:text-gray-900 font-bold text-sm transition-colors hover:bg-gray-100 rounded-xl"
            >
              {tEdit('buttons.cancel')}
            </Link>
            
            <button
              type="submit"
              disabled={saving}
              className={`px-8 py-2.5 bg-gradient-to-r ${watchedType ? typeColors[watchedType] || 'from-blue-600 to-indigo-600' : 'from-blue-600 to-indigo-600'} text-white rounded-xl hover:shadow-lg hover:-translate-y-0.5 transition-all shadow-blue-500/20 font-bold text-sm flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0`}
            >
              {saving ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  {tEdit('buttons.saving')}
                </>
              ) : (
                <>
                  <Save size={20} />
                  {tEdit('buttons.save')}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
