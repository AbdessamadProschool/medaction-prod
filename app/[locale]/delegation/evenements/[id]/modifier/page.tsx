'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
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
  LayoutTemplate
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function ModifierEvenementPage() {
  const t = useTranslations('delegation.dashboard.event_creation');
  const tEdit = useTranslations('delegation.dashboard.event_edit');
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
          
          // Image actuelle
          if (evt.medias && evt.medias.length > 0) {
            setCurrentImageUrl(evt.medias[0].urlPublique);
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
    <div className="min-h-screen font-sans text-right" dir="rtl">
      <div className="max-w-5xl mx-auto px-4 py-8">
        
        {/* Header with Premium Design */}
        <div className="mb-10 relative">
          <Link 
            href="/delegation/evenements"
            className="inline-flex items-center gap-2 text-gray-500 hover:text-blue-600 mb-6 transition-colors group font-bold"
          >
            <ArrowRight size={20} className="group-hover:-translate-x-1 transition-transform" />
            <span>{t('back_to_list')}</span>
          </Link>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-gray-100">
             <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 rounded-full border border-blue-100 animate-fade-in-up">
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                    <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">{tEdit('subtitle')}</span>
                </div>
                <h1 className="text-4xl font-black text-gray-900 tracking-tight leading-tight">
                    {tEdit('title')}
                </h1>
             </div>
             <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30 transform -rotate-3">
                <Calendar className="w-8 h-8 text-white" />
             </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 animate-fade-in-up animation-delay-100">
          
          {/* Section 1: Image de couverture */}
          <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden group hover:shadow-xl transition-all duration-300">
            <div className="p-8 border-b border-gray-50 bg-gradient-to-l from-blue-50/50 to-transparent">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                <div className="p-2.5 bg-blue-100 rounded-xl text-blue-600 shadow-sm">
                   <ImageIcon className="w-6 h-6" />
                </div>
                {t('sections.visual.title')}
              </h2>
            </div>
            
            <div className="p-8">
              {displayImage ? (
                <div className="relative w-full h-80 bg-gray-100 rounded-[1.5rem] overflow-hidden group shadow-inner border border-gray-100">
                  <img src={displayImage} alt="Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                       <div className="flex flex-col gap-3">
                           <label className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-base font-bold shadow-lg transform hover:scale-105 cursor-pointer text-center flex items-center gap-2">
                              {t('sections.visual.click_to_add')}
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
                                className="px-6 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors text-base font-bold shadow-lg transform hover:scale-105 flex items-center gap-2"
                            >
                                <X size={20} />
                                {t('sections.visual.remove')}
                            </button>
                       </div>
                  </div>
                  <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl text-white text-sm font-bold shadow-lg">
                     {previewUrl ? t('sections.visual.selected_image') : t('sections.visual.subtitle')}
                  </div>
                </div>
              ) : (
                <label className="relative flex flex-col items-center justify-center h-80 border-3 border-dashed border-gray-200 rounded-[1.5rem] bg-gray-50/50 hover:bg-blue-50/50 hover:border-blue-300 transition-all cursor-pointer group overflow-hidden">
                   <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10"></div>
                  <div className="w-24 h-24 bg-white rounded-full shadow-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 group-hover:shadow-2xl ring-4 ring-gray-50 group-hover:ring-blue-50">
                    <ImageIcon className="w-10 h-10 text-gray-400 group-hover:text-blue-500 transition-colors" />
                  </div>
                  <p className="text-xl font-bold text-gray-700 mb-2 group-hover:text-blue-700 transition-colors">{t('sections.visual.click_to_add')}</p>
                  <p className="text-gray-400 font-medium">{t('sections.visual.formats')}</p>
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

          {/* Section Informations */}
          <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300">
            <div className="p-8 border-b border-gray-50 bg-gradient-to-l from-indigo-50/50 to-transparent">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                 <div className="p-2.5 bg-indigo-100 rounded-xl text-indigo-600 shadow-sm">
                   <AlignLeft className="w-6 h-6" />
                 </div>
                 {t('sections.general.title')}
              </h2>
            </div>
            
            <div className="p-8 space-y-8">
              {/* Titre */}
              <div className="space-y-3">
                <label className="block text-base font-bold text-gray-800 text-right" style={{ textAlign: 'right' }}>
                  {t('sections.general.event_title')} <span className="text-red-500 text-lg">*</span>
                </label>
                <div className="relative group">
                    <input
                      {...register('titre')}
                      type="text"
                      dir="rtl"
                      placeholder={t('sections.general.event_title_placeholder')}
                      className="w-full px-6 py-4 pr-14 rounded-2xl border-2 border-gray-100 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all text-xl font-bold placeholder:text-gray-300 placeholder:font-normal bg-gray-50/50 focus:bg-white"
                    />
                     <div className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors pointer-events-none">
                        <LayoutTemplate size={24} />
                     </div>
                </div>
                {errors.titre && <p className="text-red-500 text-sm font-medium flex items-center gap-2 bg-red-50 p-2 rounded-lg max-w-fit px-4">⚠️ {errors.titre.message}</p>}
              </div>

              {/* Description */}
              <div className="space-y-3">
                <label className="block text-base font-bold text-gray-800 text-right" style={{ textAlign: 'right' }}>
                   {t('sections.general.description')} <span className="text-red-500 text-lg">*</span>
                </label>
                <div className="relative rounded-2xl border-2 border-gray-100 focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all bg-gray-50/50 focus-within:bg-white overflow-hidden">
                    <textarea
                    {...register('description')}
                    rows={5}
                    dir="rtl"
                    placeholder={t('sections.general.description_placeholder')}
                    className="w-full px-8 py-6 outline-none bg-transparent placeholder:text-gray-300 leading-relaxed text-lg font-medium resize-y"
                    />
                </div>
                {errors.description && <p className="text-red-500 text-sm font-medium flex items-center gap-2 bg-red-50 p-2 rounded-lg max-w-fit px-4">⚠️ {errors.description.message}</p>}
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                {/* Type */}
                <div className="space-y-3">
                  <label className="block text-base font-bold text-gray-800 text-right" style={{ textAlign: 'right' }}>
                    {t('sections.general.event_type')} <span className="text-red-500 text-lg">*</span>
                  </label>
                  <div className="relative group">
                    <select
                      {...register('typeCategorique')}
                      className="w-full px-6 py-5 pr-14 pl-12 rounded-2xl border-2 border-gray-100 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none bg-white font-bold text-gray-700 appearance-none cursor-pointer transition-all hover:bg-gray-50"
                    >
                      <option value="">{t('sections.general.select_type')}</option>
                      <option value="CULTUREL">🎭 {t('types.culturel')}</option>
                      <option value="SPORTIF">⚽ {t('types.sportif')}</option>
                      <option value="SOCIAL">🤝 {t('types.social')}</option>
                      <option value="EDUCATIF">📚 {t('types.educatif')}</option>
                      <option value="SANTE">🏥 {t('types.sante')}</option>
                      <option value="AUTRE">📌 {t('types.autre')}</option>
                    </select>
                     <div className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none group-hover:text-indigo-600 transition-colors">
                        <Tag size={24} />
                    </div>
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                        <ArrowRight className="rotate-90" size={20} />
                    </div>
                  </div>
                  {errors.typeCategorique && <p className="text-red-500 text-sm font-medium mt-2">⚠️ {errors.typeCategorique.message}</p>}
                </div>

                {/* Établissement */}
                <div className="space-y-3">
                  <label className="block text-base font-bold text-gray-800 text-right" style={{ textAlign: 'right' }}>
                    {t('sections.general.establishment')} <span className="text-red-500 text-lg">*</span>
                  </label>
                  <div className="relative group">
                    <select
                      {...register('etablissementId')}
                      className="w-full px-6 py-5 pr-14 pl-12 rounded-2xl border-2 border-gray-100 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none bg-white font-bold text-gray-700 appearance-none cursor-pointer transition-all hover:bg-gray-50"
                    >
                      <option value="">{t('sections.general.select_establishment')}</option>
                      {etablissements.map(e => (
                        <option key={e.id} value={e.id}>{e.nom}</option>
                      ))}
                    </select>
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none group-hover:text-indigo-600 transition-colors">
                        <Building2 size={24} />
                    </div>
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                        <ArrowRight className="rotate-90" size={20} />
                    </div>
                  </div>
                  {errors.etablissementId && <p className="text-red-500 text-sm font-medium mt-2">⚠️ {errors.etablissementId.message}</p>}
                </div>
              </div>

              {/* Tags */}
              <div className="space-y-3">
                <label className="block text-base font-bold text-gray-800 text-right" style={{ textAlign: 'right' }}>
                  {t('sections.general.tags')} <span className="text-gray-400 font-normal text-sm">{t('sections.general.tags_hint')}</span>
                </label>
                <input
                  {...register('tags')}
                  type="text"
                  dir="rtl"
                  placeholder={t('sections.general.tags_placeholder')}
                  className="w-full px-6 py-4 rounded-2xl border-2 border-gray-100 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-medium placeholder:text-gray-300 bg-gray-50/50 focus:bg-white"
                />
              </div>
            </div>
          </div>

          {/* Section Date et Lieu */}
          <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300">
            <div className="p-8 border-b border-gray-50 bg-gradient-to-l from-amber-50/50 to-transparent">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                 <div className="p-2.5 bg-amber-100 rounded-xl text-amber-600 shadow-sm">
                   <Calendar className="w-6 h-6" />
                 </div>
                 {t('sections.datetime.title')}
              </h2>
            </div>
            
            <div className="p-8 space-y-8">
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="block text-base font-bold text-gray-800 text-right" style={{ textAlign: 'right' }}>
                    {t('sections.datetime.start_date')} <span className="text-red-500 text-lg">*</span>
                  </label>
                  <input
                    {...register('dateDebut')}
                    type="date"
                    className="w-full px-6 py-4 rounded-2xl border-2 border-gray-100 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none font-bold text-gray-700 shadow-sm cursor-pointer"
                  />
                  {errors.dateDebut && <p className="text-red-500 text-sm mt-2 font-medium">⚠️ {errors.dateDebut.message}</p>}
                </div>
                <div className="space-y-3">
                  <label className="block text-base font-bold text-gray-800 text-right" style={{ textAlign: 'right' }}>{t('sections.datetime.end_date')}</label>
                  <input
                    {...register('dateFin')}
                    type="date"
                    className="w-full px-6 py-4 rounded-2xl border-2 border-gray-100 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none font-bold text-gray-700 shadow-sm cursor-pointer"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="block text-base font-bold text-gray-800 text-right" style={{ textAlign: 'right' }}>{t('sections.datetime.start_time')}</label>
                  <input
                    {...register('heureDebut')}
                    type="time"
                    className="w-full px-6 py-4 rounded-2xl border-2 border-gray-100 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none font-bold text-gray-700 shadow-sm cursor-pointer"
                  />
                </div>
                <div className="space-y-3">
                  <label className="block text-base font-bold text-gray-800 text-right" style={{ textAlign: 'right' }}>{t('sections.datetime.end_time')}</label>
                  <input
                    {...register('heureFin')}
                    type="time"
                    className="w-full px-6 py-4 rounded-2xl border-2 border-gray-100 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none font-bold text-gray-700 shadow-sm cursor-pointer"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="block text-base font-bold text-gray-800 text-right" style={{ textAlign: 'right' }}>
                    {t('sections.datetime.location')}
                  </label>
                  <div className="relative">
                    <input
                        {...register('lieu')}
                        type="text"
                        dir="rtl"
                        placeholder={t('sections.datetime.location_placeholder')}
                        className="w-full px-6 py-4 rounded-2xl border-2 border-gray-100 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none font-medium bg-gray-50/30 focus:bg-white"
                    />
                     <div className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                        <MapPin size={20} />
                     </div>
                   </div>
                </div>
                <div className="space-y-3">
                  <label className="block text-base font-bold text-gray-800 text-right" style={{ textAlign: 'right' }}>{t('sections.datetime.address')}</label>
                  <input
                    {...register('adresse')}
                    type="text"
                     dir="rtl"
                    placeholder={t('sections.datetime.address_placeholder')}
                    className="w-full px-6 py-4 rounded-2xl border-2 border-gray-100 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none font-medium bg-gray-50/30 focus:bg-white"
                  />
                </div>
                <div className="space-y-3">
                <label className="block text-base font-bold text-gray-800 text-right" style={{ textAlign: 'right' }}>
                  {t('sections.datetime.neighborhood')}
                </label>
                <input
                  {...register('quartierDouar')}
                  type="text"
                  dir="rtl"
                  placeholder={t('sections.datetime.neighborhood_placeholder')}
                  className="w-full px-6 py-4 rounded-2xl border-2 border-gray-100 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none placeholder:text-gray-300 font-medium text-gray-800 shadow-sm"
                />
              </div>
              </div>
            </div>
          </div>

           {/* Section 4: Organisateur & Contact */}
          <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300">
            <div className="p-8 border-b border-gray-50 bg-gradient-to-l from-purple-50/50 to-transparent">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                <div className="p-2.5 bg-purple-100 rounded-xl text-purple-600 shadow-sm">
                   <User className="w-6 h-6" />
                </div>
                {t('sections.organizer.title')}
              </h2>
            </div>
            
            <div className="p-8">
              <div className="grid md:grid-cols-3 gap-8">
                <div className="space-y-3">
                  <label className="block text-base font-bold text-gray-700 text-right" style={{ textAlign: 'right' }}>
                    <User className="w-4 h-4 inline ml-2 text-gray-400" />
                    {t('sections.organizer.name')}
                  </label>
                  <input
                    {...register('organisateur')}
                    type="text"
                    placeholder={t('sections.organizer.name_placeholder')}
                    className="w-full px-6 py-4 rounded-2xl border-2 border-gray-100 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none placeholder:text-gray-300 font-medium transition-all"
                  />
                </div>

                <div className="space-y-3">
                  <label className="block text-base font-bold text-gray-700 text-right" style={{ textAlign: 'right' }}>
                    <Phone className="w-4 h-4 inline ml-2 text-gray-400" />
                    {t('sections.organizer.phone')}
                  </label>
                  <input
                    {...register('contactOrganisateur')}
                    type="tel"
                    placeholder={t('sections.organizer.phone_placeholder')}
                    className="w-full px-6 py-4 rounded-2xl border-2 border-gray-100 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none placeholder:text-gray-300 font-medium transition-all text-right ltr:text-left"
                  />
                </div>

                <div className="space-y-3">
                  <label className="block text-base font-bold text-gray-700 text-right" style={{ textAlign: 'right' }}>
                    <Mail className="w-4 h-4 inline ml-2 text-gray-400" />
                    {t('sections.organizer.email')}
                  </label>
                  <input
                    {...register('emailContact')}
                    type="email"
                    placeholder={t('sections.organizer.email_placeholder')}
                    className="w-full px-6 py-4 rounded-2xl border-2 border-gray-100 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none placeholder:text-gray-300 font-medium transition-all"
                  />
                  {errors.emailContact && <p className="text-red-500 text-sm mt-2 font-medium">⚠️ {errors.emailContact.message}</p>}
                </div>
              </div>
            </div>
          </div>

          {/* Section Participation */}
          <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300">
            <div className="p-8 border-b border-gray-50 bg-gradient-to-l from-green-50/50 to-transparent">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                 <div className="p-2.5 bg-green-100 rounded-xl text-green-600 shadow-sm">
                   <Users className="w-6 h-6" />
                 </div>
                 {t('sections.participation.title')}
              </h2>
            </div>
            
            <div className="p-8 space-y-8">
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="block text-base font-bold text-gray-800 text-right" style={{ textAlign: 'right' }}>{t('sections.participation.max_capacity')}</label>
                  <input
                    {...register('capaciteMax')}
                    type="number"
                    min="0"
                    placeholder={t('sections.participation.max_capacity_placeholder')}
                    className="w-full px-6 py-4 rounded-2xl border-2 border-gray-100 focus:border-green-500 focus:ring-4 focus:ring-green-500/10 outline-none font-medium bg-gray-50/30 focus:bg-white"
                  />
                </div>
                <div className="flex items-center">
                  <label className="flex items-start gap-4 p-5 rounded-2xl border-2 border-gray-100 hover:border-green-400 hover:bg-green-50/30 cursor-pointer transition-all w-full shadow-sm hover:shadow-md h-full">
                    <div className="relative flex items-center">
                        <input
                        type="checkbox"
                        {...register('inscriptionsOuvertes')}
                        className="w-6 h-6 rounded-md border-gray-300 text-green-600 focus:ring-green-500 mt-1"
                        />
                    </div>
                    <div>
                      <span className="font-bold text-gray-800 block text-lg">{t('sections.participation.open_registrations')}</span>
                       <span className="text-sm text-gray-500 font-medium">{t('sections.participation.open_registrations_desc')}</span>
                    </div>
                  </label>
                </div>
              </div>

              {watchedInscriptions && (
                <div className="animate-in slide-in-from-top-4 fade-in duration-300 space-y-3">
                  <label className="block text-base font-bold text-gray-800 text-right" style={{ textAlign: 'right' }}><LinkIcon className="w-4 h-4 inline ml-2 text-gray-400" />{t('sections.participation.external_link')}</label>
                  <input
                    {...register('lienInscription')}
                    type="url"
                    placeholder={t('sections.participation.external_link_placeholder')}
                    className="w-full px-6 py-4 rounded-2xl border-2 border-gray-100 focus:border-green-500 focus:ring-4 focus:ring-green-500/10 outline-none font-medium bg-gray-50/30 focus:bg-white ltr:text-left text-right"
                  />
                  {errors.lienInscription && (
                    <p className="text-red-500 text-sm font-medium bg-red-50 p-2 rounded-lg max-w-fit px-4">{errors.lienInscription.message}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-10 border-t border-gray-200">
            <Link
              href="/delegation/evenements"
              className="px-10 py-5 text-gray-500 hover:text-gray-900 font-bold text-lg transition-colors hover:bg-gray-100 rounded-2xl"
            >
              {tEdit('buttons.cancel')}
            </Link>
            
            <button
              type="submit"
              disabled={saving}
              className={`px-12 py-5 bg-gradient-to-r ${watchedType ? typeColors[watchedType] || 'from-blue-600 to-blue-700' : 'from-blue-600 to-blue-700'} text-white rounded-2xl hover:shadow-xl hover:-translate-y-1 transition-all shadow-blue-500/30 font-bold text-lg flex items-center gap-4 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0`}
            >
              {saving ? (
                <>
                  <Loader2 size={24} className="animate-spin" />
                  {tEdit('buttons.saving')}
                </>
              ) : (
                <>
                  <Save size={24} />
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
