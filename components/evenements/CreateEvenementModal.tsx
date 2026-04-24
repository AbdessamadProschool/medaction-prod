'use client';

import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  X, 
  ChevronRight, 
  ChevronLeft, 
  Upload, 
  MapPin, 
  Calendar, 
  Clock, 
  Users, 
  Target,
  Image as ImageIcon,
  Loader2,
  Check,
  Building2,
  Sparkles,
  Save,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations, useLocale } from 'next-intl';
import dynamic from 'next/dynamic';

const LocationMap = dynamic(() => import('../maps/LocationMap'), { 
  ssr: false,
  loading: () => <div className="h-48 w-full bg-gray-100 animate-pulse rounded-xl flex items-center justify-center"><MapPin className="text-gray-400" /></div>
});

interface Commune {
  id: number;
  nom: string;
  nomArabe?: string;
}

interface Etablissement {
  id: number;
  nom: string;
  nomArabe?: string;
  secteur: string;
}

interface CreateEvenementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const SECTEURS = [
  { value: 'EDUCATION', label: 'Éducation' },
  { value: 'SANTE', label: 'Santé' },
  { value: 'SPORT', label: 'Sport' },
  { value: 'SOCIAL', label: 'Social' },
  { value: 'CULTUREL', label: 'Culturel' },
  { value: 'AUTRE', label: 'Autre' },
];

const STEPS = [
  { id: 1, title: 'Informations' },
  { id: 2, title: 'Lieu & Organisation' },
  { id: 3, title: 'Participation' },
  { id: 4, title: 'Médias' },
];

export default function CreateEvenementModal({ isOpen, onClose, onSuccess }: CreateEvenementModalProps) {
  const t = useTranslations('admin.events');
  const tSectors = useTranslations('admin.users_page.sectors');
  const locale = useLocale();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [communes, setCommunes] = useState<Commune[]>([]);
  const [etablissements, setEtablissements] = useState<Etablissement[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<{url: string, type: 'IMAGE'}[]>([]);
  const [savingDraft, setSavingDraft] = useState(false);

  // New states for location mode
  const [locationMode, setLocationMode] = useState<'manuel' | 'etablissement'>('manuel');
  const [lieuSecteur, setLieuSecteur] = useState('');

  const evenementSchema = useMemo(() => z.object({
    titre: z.string().min(5, t('errors.create_error')).max(200),
    description: z.string().min(20, t('errors.create_error')).max(5000),
    secteur: z.enum(['EDUCATION', 'SANTE', 'SPORT', 'SOCIAL', 'CULTUREL', 'AUTRE']),
    typeCategorique: z.string().min(1),
    communeId: z.number().int().positive(),
    etablissementId: z.number().int().positive().optional().nullable(),
    isOrganiseParProvince: z.boolean().optional(),
    sousCouvertProvince: z.boolean().optional(),
    lieuEtablissementId: z.number().int().positive().optional().nullable(),
    lieu: z.string().min(3).max(255),
    adresse: z.string().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    dateDebut: z.string().min(1),
    dateFin: z.string().optional(),
    heureDebut: z.string().optional(),
    heureFin: z.string().optional(),
    capaciteMax: z.number().int().positive().optional().nullable(),
    isGratuit: z.boolean().default(true),
    prixEntree: z.number().positive().optional().nullable(),
    lienInscription: z.string().url().optional().nullable().or(z.literal('')),
    organisateur: z.string().optional(),
  }), [t]);

  const { register, handleSubmit, watch, setValue, formState: { errors }, trigger } = useForm({
    resolver: zodResolver(evenementSchema),
    defaultValues: {
      isGratuit: true,
      communeId: 1, // Default to Médiouna
      isOrganiseParProvince: false,
      sousCouvertProvince: false,
    }
  });

  const formData = watch();

  useEffect(() => {
    if (isOpen) {
      loadInitialData();
    }
  }, [isOpen]);

  const loadInitialData = async () => {
    try {
      const [communesRes, etablissementsRes] = await Promise.all([
        fetch('/api/map/communes'),
        fetch('/api/etablissements?limit=200')
      ]);
      
      if (communesRes.ok) {
        const data = await communesRes.json();
        setCommunes(data.communes || []);
      }
      
      if (etablissementsRes.ok) {
        const data = await etablissementsRes.json();
        setEtablissements(data.data || []);
      }
    } catch (error) {
      console.error('Erreur chargement données:', error);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    setUploading(true);
    
    try {
      const files = Array.from(e.target.files);
      const uploadPromises = files.map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', 'evenements');
        
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });
        
        if (res.ok) {
          const data = await res.json();
          return { url: data.url, type: 'IMAGE' as const };
        }
        return null;
      });
      
      const results = await Promise.all(uploadPromises);
      const validResults = results.filter((r): r is {url: string, type: 'IMAGE'} => r !== null);
      setUploadedImages(prev => [...prev, ...validResults]);
    } catch (error) {
      toast.error(t('errors.upload_error'));
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const updateField = (name: any, value: any) => {
    setValue(name, value);
  };

  const goNext = async () => {
    let fieldsToValidate: any[] = [];
    if (currentStep === 1) fieldsToValidate = ['titre', 'description', 'secteur', 'typeCategorique'];
    if (currentStep === 2) fieldsToValidate = ['lieu', 'communeId'];
    if (currentStep === 3) fieldsToValidate = ['dateDebut'];

    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const goPrev = () => setCurrentStep(prev => prev - 1);

  const saveDraft = async () => {
    setSavingDraft(true);
    // Logic for saving draft
    setTimeout(() => {
      setSavingDraft(false);
      toast.success(t('buttons.save_draft_success'));
    }, 1000);
  };

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      const res = await fetch('/api/evenements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          medias: uploadedImages,
          statut: 'EN_ATTENTE_VALIDATION',
          lieuEtablissementId: locationMode === 'etablissement' && data.lieuEtablissementId ? data.lieuEtablissementId : null,
          lieu: locationMode === 'manuel' ? data.lieu : null,
          adresse: locationMode === 'manuel' ? data.adresse : null,
        })
      });

      if (res.ok) {
        toast.success(t('validation.success'));
        onSuccess();
      } else {
        const err = await res.json();
        toast.error(err.error || t('validation.error'));
      }
    } catch (error) {
      toast.error(t('errors.create_error'));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-800 w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Sparkles className="text-emerald-500 w-5 h-5" />
              {t('new_title')}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('new_subtitle')}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Steps Progress */}
        <div className="flex items-center justify-center gap-4 py-4 bg-gray-50/50 dark:bg-gray-900/20 border-b border-gray-100 dark:border-gray-700">
          {STEPS.map((step) => (
            <div key={step.id} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                currentStep === step.id 
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 ring-4 ring-emerald-500/10' 
                  : currentStep > step.id 
                    ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30' 
                    : 'bg-gray-200 text-gray-500 dark:bg-gray-700'
              }`}>
                {currentStep > step.id ? <Check size={16} /> : step.id}
              </div>
              <span className={`text-sm font-medium hidden sm:inline ${
                currentStep === step.id ? 'text-gray-900 dark:text-white' : 'text-gray-400'
              }`}>
                {step.title}
              </span>
              {step.id < STEPS.length && <div className="w-12 h-[2px] bg-gray-200 dark:bg-gray-700 mx-2 hidden sm:block" />}
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('form.title')} *
                  </label>
                  <input
                    {...register('titre')}
                    type="text"
                    placeholder="Ex: Nettoyage de la plage"
                    className={`w-full px-4 py-3 rounded-xl border ${
                      errors.titre ? 'border-red-500' : 'border-gray-200 dark:border-gray-600'
                    } focus:ring-2 focus:ring-emerald-500 outline-none dark:bg-gray-700 dark:text-white transition-all`}
                  />
                  {errors.titre && <p className="text-red-500 text-xs mt-1">{errors.titre.message?.toString()}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('form.sector')} *
                  </label>
                  <select
                    {...register('secteur')}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-emerald-500 outline-none dark:bg-gray-700 dark:text-white transition-all appearance-none bg-white"
                  >
                    <option value="">Sélectionner...</option>
                    {SECTEURS.map(s => (
                      <option key={s.value} value={s.value}>{tSectors(s.value as any)}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Catégorie d'événement *
                  </label>
                  <input
                    {...register('typeCategorique')}
                    type="text"
                    placeholder="Ex: Concours de dessin"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-emerald-500 outline-none dark:bg-gray-700 dark:text-white transition-all"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description détaillée *
                  </label>
                  <textarea
                    {...register('description')}
                    rows={4}
                    placeholder="Détails de l'événement..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-emerald-500 outline-none dark:bg-gray-700 dark:text-white transition-all"
                  />
                </div>

                <div className="md:col-span-2 pt-4 border-t border-gray-100">
                   <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-emerald-500" />
                      Organisation & Établissement
                   </h4>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <label className="flex items-start gap-3 p-4 rounded-xl border border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors group">
                        <div className="pt-0.5">
                          <input
                            type="checkbox"
                            {...register('isOrganiseParProvince')}
                            className="w-5 h-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                          />
                        </div>
                        <div>
                          <span className="font-medium text-gray-900 group-hover:text-emerald-600 transition-colors">Organisé par la Province</span>
                          <p className="text-xs text-gray-500 mt-1">L'événement sera rattaché à la Province de Médiouna</p>
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
                        <div>
                          <span className="font-medium text-gray-900 group-hover:text-emerald-600 transition-colors">Sous le couvert de la Province</span>
                          <p className="text-xs text-gray-500 mt-1">Affichage "Sous le couvert de Monsieur le Gouverneur"</p>
                        </div>
                      </label>
                   </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Commune *
                  </label>
                  <select
                    {...register('communeId', { valueAsNumber: true })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-emerald-500 outline-none dark:bg-gray-700 dark:text-white"
                  >
                    {communes.map(c => (
                      <option key={c.id} value={c.id}>{locale === 'ar' ? (c.nomArabe || c.nom) : c.nom}</option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2 space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Type de lieu d'événement *
                    </label>
                    <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                      <button
                        type="button"
                        onClick={() => setLocationMode('manuel')}
                        className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${locationMode === 'manuel' ? 'bg-white dark:bg-gray-700 text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
                      >
                        Saisie Manuelle
                      </button>
                      <button
                        type="button"
                        onClick={() => setLocationMode('etablissement')}
                        className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${locationMode === 'etablissement' ? 'bg-white dark:bg-gray-700 text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
                      >
                        Établissement Existant
                      </button>
                    </div>
                  </div>

                  {locationMode === 'etablissement' ? (
                    <div className="grid md:grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700">
                      <div className="space-y-3">
                        <label className="block text-xs font-bold text-gray-600 dark:text-gray-400">Secteur du lieu (optionnel)</label>
                        <select
                          value={lieuSecteur}
                          onChange={(e) => setLieuSecteur(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-emerald-500 outline-none dark:bg-gray-700 dark:text-white transition-all text-sm"
                        >
                          <option value="">Tous les secteurs</option>
                          <option value="EDUCATION">Éducation</option>
                          <option value="SANTE">Santé</option>
                          <option value="SPORT">Sport</option>
                          <option value="SOCIAL">Social</option>
                          <option value="CULTUREL">Culturel</option>
                          <option value="AUTRE">Autre</option>
                        </select>
                      </div>
                      <div className="space-y-3">
                        <label className="block text-xs font-bold text-gray-600 dark:text-gray-400">Établissement (Emplacement)</label>
                        <select
                          {...register('lieuEtablissementId', { valueAsNumber: true })}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-emerald-500 outline-none dark:bg-gray-700 dark:text-white transition-all text-sm"
                        >
                          <option value="">Sélectionnez un établissement...</option>
                          {etablissements
                            .filter(e => !lieuSecteur || e.secteur === lieuSecteur)
                            .map(e => (
                            <option key={e.id} value={e.id} className="truncate max-w-[200px]">
                              {locale === 'ar' ? (e.nomArabe || e.nom) : e.nom} {e.secteur ? `(${e.secteur})` : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Lieu exact ou Nom de la salle *
                        </label>
                        <input
                          {...register('lieu')}
                          type="text"
                          placeholder="Ex: Grande Salle du Conseil"
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none dark:bg-gray-700 dark:text-white transition-all"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Position sur la carte
                        </label>
                        <LocationMap 
                          position={{ lat: formData.latitude || 33.45, lng: formData.longitude || -7.52 }}
                          onPositionChange={(lat, lng) => {
                            updateField('latitude', lat);
                            updateField('longitude', lng);
                          }}
                          height="h-64"
                        />
                        <p className="text-xs text-gray-400 mt-2 italic">Glissez le marqueur pour définir l'emplacement exact</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Date de début *
                  </label>
                  <input
                    {...register('dateDebut')}
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Date de fin
                  </label>
                  <input
                    {...register('dateFin')}
                    type="date"
                    min={formData.dateDebut || new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Heure de début
                  </label>
                  <input
                    {...register('heureDebut')}
                    type="time"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Heure de fin
                  </label>
                  <input
                    {...register('heureFin')}
                    type="time"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Capacité maximale
                  </label>
                  <input
                    {...register('capaciteMax', { valueAsNumber: true })}
                    type="number"
                    placeholder="Ex: 500"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div className="flex flex-col justify-end">
                   <label className="flex items-center gap-3 p-4 rounded-xl border border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors w-full">
                      <input
                        type="checkbox"
                        {...register('isGratuit')}
                        className="w-5 h-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="font-medium text-gray-900">Participation gratuite</span>
                    </label>
                </div>

                {!formData.isGratuit && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Prix d'entrée (DH) *
                    </label>
                    <input
                      {...register('prixEntree', { valueAsNumber: true })}
                      type="number"
                      placeholder="Ex: 50"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                  Photos de l'événement
                </label>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                  {uploadedImages.map((img, idx) => (
                    <div key={idx} className="relative aspect-video rounded-xl overflow-hidden group border border-gray-100 dark:border-gray-700">
                      <img src={img.url} className="w-full h-full object-cover" />
                      <button 
                        onClick={() => removeImage(idx)}
                        className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                  <label className="aspect-video rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group">
                    <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
                    {uploading ? <Loader2 className="w-6 h-6 animate-spin text-emerald-500" /> : <Upload className="w-6 h-6 text-gray-400 group-hover:text-emerald-500 transition-colors" />}
                    <span className="text-xs text-gray-400 mt-2 font-medium">Ajouter</span>
                  </label>
                </div>
              </div>

              {/* Résumé Final */}
              <div className="p-6 bg-gray-50 dark:bg-gray-900/40 rounded-2xl border border-gray-100 dark:border-gray-700">
                 <h4 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Target className="w-5 h-5 text-emerald-500" />
                    Résumé de l'événement
                 </h4>
                 <div className="grid grid-cols-2 gap-y-3 text-sm">
                    <span className="text-gray-500">Titre :</span>
                    <span className="font-medium text-gray-900 dark:text-white">{formData.titre || '-'}</span>
                    <span className="text-gray-500">Secteur :</span>
                    <span className="font-medium text-gray-900 dark:text-white">{formData.secteur ? tSectors(formData.secteur as any) : '-'}</span>
                    <span className="text-gray-500">Lieu :</span>
                    <span className="font-medium text-gray-900 dark:text-white">{formData.lieu || '-'}</span>
                    <span className="text-gray-500">Date :</span>
                    <span className="font-medium text-gray-900 dark:text-white">{formData.dateDebut || '-'}</span>
                    <span className="text-gray-500">Organisation :</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                       {formData.isOrganiseParProvince ? 'Province de Médiouna' : 'Établissement'}
                    </span>
                 </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between bg-white dark:bg-gray-800">
           <button
             onClick={saveDraft}
             disabled={savingDraft}
             className="px-6 py-2.5 text-gray-600 dark:text-gray-400 font-medium flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-colors disabled:opacity-50"
           >
             {savingDraft ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
             Brouillon
           </button>

           <div className="flex items-center gap-4">
             {currentStep > 1 && (
               <button
                 onClick={goPrev}
                 className="px-6 py-2.5 text-gray-600 dark:text-gray-400 font-medium flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-colors"
               >
                 <ChevronLeft size={18} />
                 Retour
               </button>
             )}
             {currentStep < 4 ? (
               <button
                 onClick={goNext}
                 className="px-8 py-2.5 bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 hover:shadow-emerald-500/40 transition-all flex items-center gap-2"
               >
                 Suivant
                 <ChevronRight size={18} />
               </button>
             ) : (
               <button
                 onClick={handleSubmit(onSubmit)}
                 disabled={loading}
                 className="px-10 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 transition-all flex items-center gap-2 disabled:opacity-50"
               >
                 {loading ? <Loader2 size={20} className="animate-spin" /> : <Check size={20} />}
                 Créer l'événement
               </button>
             )}
           </div>
        </div>
      </div>
    </div>
  );
}
