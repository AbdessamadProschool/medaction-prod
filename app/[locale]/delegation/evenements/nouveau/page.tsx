'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  Building2,
  Tag,
  Loader2,
  Users,
  ArrowRight, 
  Sparkles,
  Phone,
  Mail,
  User,
  Link as LinkIcon,
  LayoutTemplate,
  AlertCircle
} from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { toast } from 'sonner';

export default function NouveauEventPage() {
  const t = useTranslations('delegation.dashboard.event_creation');
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [etablissements, setEtablissements] = useState<{id: number, nom: string, secteur?: string}[]>([]);
  const [allEtablissements, setAllEtablissements] = useState<{id: number, nom: string, secteur: string}[]>([]);
  const [locationMode, setLocationMode] = useState<'manuel' | 'etablissement'>('manuel');
  const [lieuSecteur, setLieuSecteur] = useState('');
  
  // Image state
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Schéma de validation défini à l'intérieur du composant pour utiliser les traductions
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
    isOrganiseParProvince: z.boolean().optional(),
    sousCouvertProvince: z.boolean().optional(),
    lieuEtablissementId: z.string().optional(),
  });

  type EventForm = z.infer<typeof eventSchema>;

  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<EventForm>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      inscriptionsOuvertes: false,
      isOrganiseParProvince: false,
      sousCouvertProvince: false,
    }
  });

  const watchedType = watch('typeCategorique');
  const watchedInscriptions = watch('inscriptionsOuvertes');
  
  // Custom Time Picker Logic
  const watchedHeureDebut = watch('heureDebut') || '09:00';
  const watchedHeureFin = watch('heureFin') || '18:00';
  const HOURS = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
  const MINUTES = ['00', '15', '30', '45'];

  const handleTimeChange = (field: 'heureDebut' | 'heureFin', type: 'h' | 'm', val: string) => {
    const current = field === 'heureDebut' ? watchedHeureDebut : watchedHeureFin;
    const [h, m] = (current && current.includes(':')) ? current.split(':') : ['09', '00'];
    if (type === 'h') setValue(field, `${val}:${m}`);
    else setValue(field, `${h}:${val}`);
  };

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
        
        // Fetch all establishments for location selection
        const resAll = await fetch('/api/etablissements?limit=100');
        const dataAll = await resAll.json();
        if (dataAll.data) {
          setAllEtablissements(dataAll.data);
        }
      } catch (error) {
        console.error("Erreur chargement établissements", error);
      }
    };

    if (session?.user) {
      fetchEtablissements();
    }
  }, [session]);

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

  const onSubmit = async (data: EventForm) => {
    setLoading(true);
    try {
      let imageUrl = null;

      // === UPLOAD DE L'IMAGE ===
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
            throw new Error(t('validation.upload.generic'));
          } 
            
          const uploadData = await uploadRes.json();
          if (!uploadData.success) {
             const errorCode = uploadData.errors?.[0]?.code || uploadData.code;
             let errorMsg = t('validation.upload.generic'); 
             
             if (errorCode) {
               switch (errorCode) {
                 case 'FILE_TOO_SMALL': errorMsg = t('validation.upload.small'); break;
                 case 'FILE_TOO_LARGE': errorMsg = t('validation.upload.size'); break;
                 case 'INVALID_EXTENSION': 
                 case 'MAGIC_BYTES_MISMATCH':
                 case 'INVALID_TYPE':
                   errorMsg = t('validation.upload.type'); break;
                 case 'INVALID_FILENAME': errorMsg = t('validation.upload.filename'); break;
                 case 'MALICIOUS_CONTENT': errorMsg = t('validation.upload.security'); break;
                 case 'NO_FILE': errorMsg = t('validation.upload.no_file'); break;
                 case 'TOO_MANY_FILES': errorMsg = t('validation.upload.too_many_files'); break;
                 default: errorMsg = uploadData.errors?.[0]?.error || uploadData.error || uploadData.message || t('validation.upload.generic');
               }
             } else {
                errorMsg = uploadData.errors?.[0]?.error || uploadData.error || uploadData.message || t('validation.upload.generic');
             }
             
             throw new Error(errorMsg);
          } 
          imageUrl = uploadData.url;
          
        } catch (uploadError: any) {
           console.error("Upload error details:", uploadError);
           toast.error(uploadError.message || t('validation.upload.generic'));
           setLoading(false);
           return; 
        }
      }

      // Parse tags
      const tagsArray = data.tags ? data.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [];

      // === CRÉATION DE L'ÉVÉNEMENT ===
      const res = await fetch('/api/delegation/evenements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            ...data,
            etablissementId: parseInt(data.etablissementId),
            capaciteMax: data.capaciteMax ? parseInt(data.capaciteMax) : null,
            tags: tagsArray,
            isOrganiseParProvince: data.isOrganiseParProvince,
            sousCouvertProvince: data.sousCouvertProvince,
            lieuEtablissementId: locationMode === 'etablissement' && data.lieuEtablissementId ? parseInt(data.lieuEtablissementId) : null,
            lieu: locationMode === 'manuel' ? data.lieu : null,
            adresse: locationMode === 'manuel' ? data.adresse : null,
            quartierDouar: locationMode === 'manuel' ? data.quartierDouar : null,
            imagePrincipale: imageUrl
        }),
      });

      if (res.ok) {
        toast.success(imageUrl ? t('validation.success') : t('validation.success_no_image'));
        router.push('/delegation/evenements?success=true');
        router.refresh();
      } else {
        const errorData = await res.json();
        toast.error(errorData.error || t('validation.error'));
      }
    } catch (error) {
      console.error(error);
      toast.error(t('validation.error'));
    } finally {
      setLoading(false);
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

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-4">
        
        {/* Header with Premium Design */}
        <div className="mb-5 relative">
          <Link 
            href="/delegation/evenements"
            className="inline-flex items-center gap-2 text-gray-500 hover:text-blue-600 mb-3 transition-colors group font-bold text-sm"
          >
            <ArrowRight size={20} className="rtl:rotate-0 rotate-180 group-hover:translate-x-[-4px] rtl:group-hover:translate-x-[4px] transition-transform" />
            <span>{t('back_to_list')}</span>
          </Link>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-gray-100">
             <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 rounded-full border border-blue-100 animate-fade-in-up">
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                    <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">{t('subtitle')}</span>
                </div>
                <h1 className="text-2xl font-black text-gray-900 tracking-tight leading-tight">
                    {t('title')}
                </h1>
             </div>
             <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30 transform -rotate-3">
                <Sparkles className="w-5 h-5 text-white" />
             </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 animate-fade-in-up animation-delay-100">
          
          {/* Section 1: Image de couverture */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden group hover:shadow-md transition-all duration-300">
            <div className="px-5 py-3 border-b border-gray-50 bg-gradient-to-r rtl:bg-gradient-to-l from-blue-50/50 to-transparent">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                {t('sections.visual.title')}
              </h2>
            </div>
            
            <div className="p-4">
              {previewUrl ? (
                <div className="relative w-full h-48 bg-gray-100 rounded-xl overflow-hidden group shadow-inner border border-gray-100">
                  <img src={previewUrl} alt="Prévisualisation" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedImage(null);
                          setPreviewUrl(null);
                        }}
                        className="px-6 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors text-base font-bold shadow-lg transform hover:scale-105 flex items-center gap-2"
                      >
                         <Save size={20} className="rotate-45" /> {/* Using X icon equivalent logic if available or just generic remove */}
                        {t('sections.visual.remove')}
                      </button>
                  </div>
                  <div className="absolute bottom-4 right-4 rtl:right-auto rtl:left-4 bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl text-white text-sm font-bold shadow-lg">
                     {t('sections.visual.selected_image')}
                  </div>
                </div>
              ) : (
                <label className="relative flex flex-col items-center justify-center h-40 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50 hover:bg-blue-50/50 hover:border-blue-300 transition-all cursor-pointer group overflow-hidden">
                  <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10"></div>
                  
                  <div className="w-14 h-14 bg-white rounded-full shadow-md flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                    <ImageIcon className="w-6 h-6 text-gray-400 group-hover:text-blue-500 transition-colors" />
                  </div>
                  <p className="text-sm font-bold text-gray-700 mb-1 group-hover:text-blue-700 transition-colors">{t('sections.visual.click_to_add')}</p>
                  <p className="text-xs text-gray-400">{t('sections.visual.formats')}</p>
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

          {/* Section 2: Informations Principales */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-300">
            <div className="px-5 py-3 border-b border-gray-50 bg-gradient-to-r rtl:bg-gradient-to-l from-indigo-50/50 to-transparent">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                {t('sections.general.title')}
              </h2>
            </div>
            
            <div className="p-5 space-y-4">
              {/* Titre */}
              <div className="space-y-1.5">
                <label className="block text-sm font-bold text-gray-700 text-start">
                  {t('sections.general.event_title')} <span className="text-red-500">*</span>
                </label>
                <div className="relative group">
                    <input
                      {...register('titre')}
                      type="text"
                      placeholder={t('sections.general.event_title_placeholder')}
                      className="w-full px-4 py-3 pl-4 pr-12 rtl:pr-12 rtl:pl-4 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all text-sm font-bold placeholder:text-gray-300 placeholder:font-normal bg-gray-50/50 focus:bg-white text-start"
                    />
                     <div className="absolute right-5 rtl:right-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors pointer-events-none">
                        <LayoutTemplate size={20} />
                     </div>
                </div>
                {errors.titre && <p className="text-red-500 text-sm font-medium flex items-center gap-2 bg-red-50 p-2 rounded-lg max-w-fit px-4"><AlertCircle className="w-4 h-4" /> {errors.titre.message}</p>}
              </div>

              {/* Description */}
              <div className="space-y-3">
                <label className="block text-sm font-bold text-gray-700 text-start">
                  {t('sections.general.description')} <span className="text-red-500">*</span>
                </label>
                <div className="relative rounded-xl border border-gray-200 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/10 transition-all bg-gray-50/50 focus-within:bg-white overflow-hidden">
                    <textarea
                    {...register('description')}
                    rows={3}
                    placeholder={t('sections.general.description_placeholder')}
                    className="w-full px-4 py-3 outline-none bg-transparent placeholder:text-gray-300 leading-relaxed text-sm font-bold resize-y text-start"
                    />
                </div>
                {errors.description && <p className="text-red-500 text-sm font-medium flex items-center gap-2 bg-red-50 p-2 rounded-lg max-w-fit px-4"><AlertCircle className="w-4 h-4" /> {errors.description.message}</p>}
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {/* Type */}
                <div className="space-y-3">
                  <label className="block text-sm font-bold text-gray-700 text-start">
                    {t('sections.general.event_type')} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative group">
                    <select
                      {...register('typeCategorique')}
                      className="w-full px-4 py-3 pr-12 pl-10 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none bg-white font-bold text-gray-700 appearance-none cursor-pointer transition-all hover:bg-gray-50 text-sm text-start"
                    >
                      <option value="">{t('sections.general.select_type')}</option>
                      <option value="CULTUREL">{t('types.culturel')}</option>
                      <option value="SPORTIF">{t('types.sportif')}</option>
                      <option value="SOCIAL">{t('types.social')}</option>
                      <option value="EDUCATIF">{t('types.educatif')}</option>
                      <option value="SANTE">{t('types.sante')}</option>
                      <option value="AUTRE">{t('types.autre')}</option>
                    </select>
                     <div className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none group-hover:text-indigo-600 transition-colors">
                        <Tag size={20} />
                    </div>
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                        <ArrowRight className="rotate-90" size={18} />
                    </div>
                  </div>
                  {errors.typeCategorique && <p className="text-red-500 text-sm font-medium mt-2 flex items-center gap-2"><AlertCircle className="w-4 h-4" /> {errors.typeCategorique.message}</p>}
                </div>

                {/* Établissement */}
                <div className="space-y-3">
                  <label className="block text-sm font-bold text-gray-700 text-start">
                    {t('sections.general.establishment')} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative group">
                    <select
                      {...register('etablissementId')}
                      className="w-full px-4 py-3 pr-12 pl-10 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none bg-white font-bold text-gray-700 appearance-none cursor-pointer transition-all hover:bg-gray-50 text-sm text-start"
                    >
                      <option value="">{t('sections.general.select_establishment')}</option>
                      {etablissements.map(e => (
                        <option key={e.id} value={e.id}>{e.nom}</option>
                      ))}
                    </select>
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none group-hover:text-indigo-600 transition-colors">
                        <Building2 size={20} />
                    </div>
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                        <ArrowRight className="rotate-90" size={18} />
                    </div>
                  </div>
                  {errors.etablissementId && <p className="text-red-500 text-sm font-medium mt-2 flex items-center gap-2"><AlertCircle className="w-4 h-4" /> {errors.etablissementId.message}</p>}
                </div>
              </div>


              {/* Tags */}
              <div className="space-y-3">
                <label className="block text-base font-bold text-gray-800 text-start">
                  {t('sections.general.tags')} <span className="text-gray-400 font-normal text-xs">{t('sections.general.tags_hint')}</span>
                </label>
                <input
                  {...register('tags')}
                  type="text"
                  placeholder={t('sections.general.tags_placeholder')}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 outline-none placeholder:text-gray-300 font-bold transition-all text-sm bg-gray-50/50 focus:bg-white text-start"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Date, Heure et Lieu */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-300">
            <div className="px-5 py-3 border-b border-gray-50 bg-gradient-to-r rtl:bg-gradient-to-l from-amber-50/50 to-transparent">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                {t('sections.datetime.title')}
              </h2>
            </div>
            
            <div className="p-5 space-y-4">
              {/* Dates */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <label className="block text-sm font-bold text-gray-700 text-start">
                    {t('sections.datetime.start_date')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('dateDebut')}
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 outline-none font-bold text-gray-700 cursor-pointer bg-gray-50/50 focus:bg-white text-sm"
                  />
                  {errors.dateDebut && <p className="text-red-500 text-sm mt-2 font-medium flex items-center gap-2"><AlertCircle className="w-4 h-4" /> {errors.dateDebut.message}</p>}
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-bold text-gray-700 text-start">
                    {t('sections.datetime.end_date')} <span className="text-gray-400 font-normal text-xs">{t('sections.datetime.optional')}</span>
                  </label>
                  <input
                    {...register('dateFin')}
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 outline-none font-bold text-gray-700 cursor-pointer bg-gray-50/50 focus:bg-white text-sm"
                  />
                </div>
              </div>

              {/* Heures - Custom Widget 24h Simple */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <label className="block text-sm font-bold text-gray-700 text-start">
                    <Clock className="w-4 h-4 inline me-2 text-gray-400" />
                    {t('sections.datetime.start_time')}
                  </label>
                  <div className="flex items-center gap-2" dir="ltr">
                    <div className="relative flex-1">
                      <select 
                        value={watchedHeureDebut ? watchedHeureDebut.split(':')[0] : '09'}
                        onChange={(e) => handleTimeChange('heureDebut', 'h', e.target.value)}
                        className="w-full px-3 py-3 rounded-xl border border-gray-200 focus:border-amber-500 outline-none font-bold text-gray-800 text-center appearance-none bg-gray-50/50 cursor-pointer hover:bg-white transition-colors text-sm"
                      >
                        {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>
                    <span className="font-bold text-gray-400 text-xl">:</span>
                    <div className="relative flex-1">
                      <select 
                        value={watchedHeureDebut ? watchedHeureDebut.split(':')[1] : '00'}
                        onChange={(e) => handleTimeChange('heureDebut', 'm', e.target.value)}
                        className="w-full px-3 py-3 rounded-xl border border-gray-200 focus:border-amber-500 outline-none font-bold text-gray-800 text-center appearance-none bg-gray-50/50 cursor-pointer hover:bg-white transition-colors text-sm"
                      >
                        {MINUTES.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>
                  </div>
                  <input type="hidden" {...register('heureDebut')} />
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-bold text-gray-700 text-start">
                    <Clock className="w-4 h-4 inline me-2 text-gray-400" />
                    {t('sections.datetime.end_time')}
                  </label>
                  <div className="flex items-center gap-2" dir="ltr">
                    <div className="relative flex-1">
                      <select 
                        value={watchedHeureFin ? watchedHeureFin.split(':')[0] : '18'}
                        onChange={(e) => handleTimeChange('heureFin', 'h', e.target.value)}
                        className="w-full px-3 py-3 rounded-xl border border-gray-200 focus:border-amber-500 outline-none font-bold text-gray-800 text-center appearance-none bg-gray-50/50 cursor-pointer hover:bg-white transition-colors text-sm"
                      >
                        {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>
                    <span className="font-bold text-gray-400 text-xl">:</span>
                    <div className="relative flex-1">
                      <select 
                        value={watchedHeureFin ? watchedHeureFin.split(':')[1] : '00'}
                        onChange={(e) => handleTimeChange('heureFin', 'm', e.target.value)}
                        className="w-full px-3 py-3 rounded-xl border border-gray-200 focus:border-amber-500 outline-none font-bold text-gray-800 text-center appearance-none bg-gray-50/50 cursor-pointer hover:bg-white transition-colors text-sm"
                      >
                        {MINUTES.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>
                  </div>
                  <input type="hidden" {...register('heureFin')} />
                </div>
              </div>

              {/* Lieu */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-bold text-gray-700 text-start">
                    <MapPin className="w-4 h-4 inline me-2 text-gray-400" />
                    {t('sections.datetime.location')}
                  </label>
                  
                  <div className="flex bg-gray-100 p-1 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setLocationMode('manuel')}
                      className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${locationMode === 'manuel' ? 'bg-white text-amber-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                      {t('sections.datetime.manual_entry')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setLocationMode('etablissement')}
                      className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${locationMode === 'etablissement' ? 'bg-white text-amber-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                      {t('sections.datetime.existing_establishment')}
                    </button>
                  </div>
                </div>

                {locationMode === 'etablissement' ? (
                  <div className="grid md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="space-y-3">
                      <label className="block text-xs font-bold text-gray-600 text-start">{t('sections.datetime.location_sector')}</label>
                      <select
                        value={lieuSecteur}
                        onChange={(e) => setLieuSecteur(e.target.value)}
                         className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-amber-500 outline-none font-bold text-gray-700 appearance-none bg-white cursor-pointer transition-colors text-sm"
                      >
                        <option value="">{t('sections.datetime.all_sectors')}</option>
                        <option value="EDUCATION">Éducation</option>
                        <option value="SANTE">Santé</option>
                        <option value="SPORT">Sport</option>
                        <option value="SOCIAL">Social</option>
                        <option value="CULTUREL">Culturel</option>
                        <option value="AUTRE">Autre</option>
                      </select>
                    </div>
                    <div className="space-y-3">
                      <label className="block text-xs font-bold text-gray-600 text-start">{t('sections.datetime.establishment_location_label')}</label>
                      <select
                        {...register('lieuEtablissementId')}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-amber-500 outline-none font-bold text-gray-700 appearance-none bg-white cursor-pointer transition-colors text-sm"
                      >
                        <option value="">{t('sections.datetime.select_establishment_location')}</option>
                        {allEtablissements
                          .filter(e => !lieuSecteur || e.secteur === lieuSecteur)
                          .map(e => (
                          <option key={e.id} value={e.id} className="truncate max-w-[250px]">{e.nom} {e.secteur ? `(${e.secteur})` : ''}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <input
                          {...register('lieu')}
                          type="text"
                          placeholder={t('sections.datetime.location_placeholder')}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 outline-none placeholder:text-gray-300 font-bold text-gray-800 text-sm bg-gray-50/50 focus:bg-white text-start"
                        />
                      </div>

                      <div className="space-y-3">
                        <input
                          {...register('adresse')}
                          type="text"
                          placeholder={t('sections.datetime.address_placeholder')}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 outline-none placeholder:text-gray-300 font-bold text-gray-800 bg-gray-50/50 focus:bg-white text-sm text-start"
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <input
                        {...register('quartierDouar')}
                        type="text"
                        placeholder={t('sections.datetime.neighborhood_placeholder')}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 outline-none placeholder:text-gray-300 font-bold text-gray-800 text-sm bg-gray-50/50 focus:bg-white text-start"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section 4: Organisateur & Contact */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-300">
            <div className="px-5 py-3 border-b border-gray-50 bg-gradient-to-r rtl:bg-gradient-to-l from-purple-50/50 to-transparent">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                {t('sections.organizer.title')}
              </h2>
            </div>
            
            <div className="p-5">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-3">
                  <label className="block text-sm font-bold text-gray-700 text-start">
                    <User className="w-4 h-4 inline me-2 text-gray-400" />
                    {t('sections.organizer.name')}
                  </label>
                  <input
                    {...register('organisateur')}
                    type="text"
                    placeholder={t('sections.organizer.name_placeholder')}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 outline-none placeholder:text-gray-300 font-bold transition-all text-sm bg-gray-50/50 focus:bg-white text-start"
                  />
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-bold text-gray-700 text-start">
                    <Phone className="w-4 h-4 inline me-2 text-gray-400" />
                    {t('sections.organizer.phone')}
                  </label>
                  <input
                    {...register('contactOrganisateur')}
                    type="tel"
                    placeholder={t('sections.organizer.phone_placeholder')}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 outline-none placeholder:text-gray-300 font-bold transition-all text-start bg-gray-50/50 focus:bg-white"
                  />
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-bold text-gray-700 text-start">
                    <Mail className="w-4 h-4 inline me-2 text-gray-400" />
                    {t('sections.organizer.email')}
                  </label>
                  <input
                    {...register('emailContact')}
                    type="email"
                    placeholder={t('sections.organizer.email_placeholder')}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 outline-none placeholder:text-gray-300 font-bold transition-all text-sm bg-gray-50/50 focus:bg-white text-start"
                  />
                  {errors.emailContact && <p className="text-red-500 text-sm mt-2 font-medium flex items-center gap-2"><AlertCircle className="w-4 h-4" /> {errors.emailContact.message}</p>}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-50 grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="flex items-start gap-3 p-4 rounded-xl border border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors group">
                  <div className="pt-0.5">
                    <input
                      type="checkbox"
                      {...register('isOrganiseParProvince')}
                      className="w-5 h-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                  </div>
                  <div className="text-start">
                    <span className="font-bold text-gray-900 group-hover:text-emerald-600 transition-colors text-xs">منظمة من طرف العمالة</span>
                    <p className="text-[10px] text-gray-500 mt-1">سيتم ربط الحدث مباشرة بعمالة مديونة</p>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-4 rounded-xl border border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors group">
                  <div className="pt-0.5">
                    <input
                      type="checkbox"
                      {...register('sousCouvertProvince')}
                      className="w-5 h-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                  </div>
                  <div className="text-start">
                    <span className="font-bold text-gray-900 group-hover:text-emerald-600 transition-colors text-xs">تحت غطاء العمالة</span>
                    <p className="text-[10px] text-gray-500 mt-1">إظهار عبارة "تحت غطاء السيد العامل"</p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Section 5: Participation & Inscription */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-300">
            <div className="px-5 py-3 border-b border-gray-50 bg-gradient-to-r rtl:bg-gradient-to-l from-green-50/50 to-transparent">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                {t('sections.participation.title')}
              </h2>
            </div>
            
            <div className="p-5">
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div className="space-y-3">
                  <label className="block text-sm font-bold text-gray-700 text-start">
                    {t('sections.participation.max_capacity')}
                  </label>
                  <input
                    {...register('capaciteMax')}
                    type="number"
                    min="0"
                    placeholder={t('sections.participation.max_capacity_placeholder')}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-500/10 outline-none placeholder:text-gray-300 font-bold transition-all text-sm bg-gray-50/50 focus:bg-white text-start"
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
                      <span className="font-bold text-gray-800 block text-base">{t('sections.participation.open_registrations')}</span>
                      <span className="text-xs text-gray-500 font-bold">{t('sections.participation.open_registrations_desc')}</span>
                    </div>
                  </label>
                </div>
              </div>

              {watchedInscriptions && (
                <div className="animate-in slide-in-from-top-4 fade-in duration-300 space-y-3">
                  <label className="block text-sm font-bold text-gray-700 text-start">
                    <LinkIcon className="w-4 h-4 inline me-2 text-gray-400" />
                    {t('sections.participation.external_link')}
                  </label>
                  <input
                    {...register('lienInscription')}
                    type="url"
                    placeholder={t('sections.participation.external_link_placeholder')}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-500/10 outline-none placeholder:text-gray-300 font-bold transition-all text-start bg-gray-50/50 focus:bg-white text-sm"
                  />
                  {errors.lienInscription && <p className="text-red-500 text-sm mt-2 font-medium flex items-center gap-2"><AlertCircle className="w-4 h-4" /> {errors.lienInscription.message}</p>}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-5 border-t border-gray-200">
            <Link
              href="/delegation/evenements"
              className="px-6 py-3 text-gray-500 hover:text-gray-900 font-bold text-sm transition-colors hover:bg-gray-100 rounded-xl"
            >
              {t('buttons.cancel')}
            </Link>
            
            <button
              type="submit"
              disabled={loading}
              className={`px-8 py-3 bg-gradient-to-r ${watchedType ? typeColors[watchedType] || 'from-blue-600 to-blue-700' : 'from-blue-600 to-blue-700'} text-white rounded-xl hover:shadow-lg hover:-translate-y-0.5 transition-all shadow-blue-500/30 font-bold text-sm flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0`}
            >
              {loading ? (
                <>
                  <Loader2 size={24} className="animate-spin" />
                  {t('buttons.creating')}
                </>
              ) : (
                <>
                  <Save size={24} />
                  {t('buttons.create')}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
