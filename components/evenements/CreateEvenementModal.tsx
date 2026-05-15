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
import { GovInput, GovSelect, GovTextarea, GovButton } from '@/components/ui';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

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
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-800 w-full sm:max-w-4xl max-h-[95dvh] sm:max-h-[90vh] rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200">
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
        <div className="px-8 py-6 bg-muted/20 border-b border-border">
          <div className="flex items-center justify-between max-w-2xl mx-auto relative">
            {/* Connection Line */}
            <div className="absolute top-5 left-0 right-0 h-[2px] bg-border z-0" />
            <div 
              className="absolute top-5 left-0 h-[2px] bg-[hsl(var(--gov-blue))] z-0 transition-all duration-500" 
              style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
            />

            {STEPS.map((step) => (
              <div key={step.id} className="relative z-10 flex flex-col items-center gap-3">
                <motion.div 
                  initial={false}
                  animate={{
                    scale: currentStep === step.id ? 1.2 : 1,
                    backgroundColor: currentStep >= step.id ? 'hsl(var(--gov-blue))' : 'hsl(var(--muted))',
                    color: currentStep >= step.id ? 'white' : 'hsl(var(--muted-foreground))'
                  }}
                  className={cn(
                    "w-10 h-10 rounded-2xl flex items-center justify-center text-xs font-black shadow-xl transition-colors",
                    currentStep === step.id ? "ring-4 ring-[hsl(var(--gov-blue)/0.2)]" : ""
                  )}
                >
                  {currentStep > step.id ? <Check size={18} strokeWidth={3} /> : step.id}
                </motion.div>
                <span className={cn(
                  "text-[9px] font-black uppercase tracking-widest transition-colors hidden sm:block",
                  currentStep >= step.id ? "text-foreground" : "text-muted-foreground/60"
                )}>
                  {step.title}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 bg-gradient-to-br from-muted/20 to-transparent">
          <AnimatePresence mode="wait">
            {currentStep === 1 && (
              <motion.div 
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="md:col-span-2">
                    <GovInput
                      label={t('form.title') + " *"}
                      placeholder="Ex: Nettoyage de la plage de Médiouna"
                      error={errors.titre?.message?.toString()}
                      className="text-lg font-black tracking-tight"
                      {...register('titre')}
                    />
                  </div>

                  <GovSelect
                    label={t('form.sector') + " *"}
                    error={errors.secteur?.message?.toString()}
                    leftIcon={<Building2 size={18} />}
                    options={[
                      { label: "Sélectionner un secteur...", value: "" },
                      ...SECTEURS.map(s => ({
                        label: tSectors(s.value as any),
                        value: s.value
                      }))
                    ]}
                    {...register('secteur')}
                  />

                  <GovInput
                    label="Catégorie d'événement *"
                    placeholder="Ex: Concours de dessin, Marathon..."
                    leftIcon={<Target size={18} />}
                    {...register('typeCategorique')}
                  />

                  <div className="md:col-span-2">
                    <GovTextarea
                      label="Description détaillée *"
                      placeholder="Décrivez l'événement, son but et ses activités..."
                      error={errors.description?.message?.toString()}
                      {...register('description')}
                    />
                  </div>

                  <div className="md:col-span-2 pt-6 border-t border-border">
                    <h4 className="text-[10px] font-black text-foreground uppercase tracking-widest mb-6 flex items-center gap-2">
                        <div className="w-1.5 h-4 bg-emerald-500 rounded-full" />
                        Organisation & Établissement
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <label className={cn(
                          "flex items-start gap-4 p-5 rounded-[1.5rem] border-2 cursor-pointer transition-all group shadow-sm",
                          formData.isOrganiseParProvince 
                            ? "border-emerald-500 bg-emerald-500/5 shadow-emerald-500/10" 
                            : "border-border bg-muted/10 hover:border-border/80"
                        )}>
                          <input
                            type="checkbox"
                            {...register('isOrganiseParProvince')}
                            className="w-6 h-6 rounded-lg border-border text-emerald-600 mt-1 focus:ring-emerald-500/20 cursor-pointer"
                          />
                          <div>
                            <span className={cn(
                              "text-xs font-black uppercase tracking-widest block transition-colors",
                              formData.isOrganiseParProvince ? "text-emerald-700" : "text-foreground"
                            )}>Organisé par la Province</span>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60 mt-1">L'événement sera rattaché à la Province</p>
                          </div>
                        </label>

                        <label className={cn(
                          "flex items-start gap-4 p-5 rounded-[1.5rem] border-2 cursor-pointer transition-all group shadow-sm",
                          formData.sousCouvertProvince 
                            ? "border-emerald-500 bg-emerald-500/5 shadow-emerald-500/10" 
                            : "border-border bg-muted/10 hover:border-border/80"
                        )}>
                          <input
                            type="checkbox"
                            {...register('sousCouvertProvince')}
                            className="w-6 h-6 rounded-lg border-border text-emerald-600 mt-1 focus:ring-emerald-500/20 cursor-pointer"
                          />
                          <div>
                            <span className={cn(
                              "text-xs font-black uppercase tracking-widest block transition-colors",
                              formData.sousCouvertProvince ? "text-emerald-700" : "text-foreground"
                            )}>Sous le couvert de la Province</span>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60 mt-1">Affichage protocolaire spécial</p>
                          </div>
                        </label>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

          {currentStep === 2 && (
            <motion.div 
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <GovSelect
                  label="Commune *"
                  leftIcon={<MapPin size={18} />}
                  options={communes.map(c => ({
                    label: locale === 'ar' ? (c.nomArabe || c.nom) : c.nom,
                    value: c.id
                  }))}
                  {...register('communeId', { valueAsNumber: true })}
                />

                <div className="md:col-span-2 space-y-6">
                  <div className="flex items-center justify-between bg-muted/30 p-2 rounded-2xl border border-border">
                    <button
                      type="button"
                      onClick={() => setLocationMode('manuel')}
                      className={cn(
                        "flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all",
                        locationMode === 'manuel' ? "bg-card text-[hsl(var(--gov-blue))] shadow-sm" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      Saisie Manuelle
                    </button>
                    <button
                      type="button"
                      onClick={() => setLocationMode('etablissement')}
                      className={cn(
                        "flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all",
                        locationMode === 'etablissement' ? "bg-card text-[hsl(var(--gov-blue))] shadow-sm" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      Établissement Existant
                    </button>
                  </div>

                  {locationMode === 'etablissement' ? (
                    <div className="grid md:grid-cols-2 gap-6 p-6 bg-card/40 rounded-3xl border border-border">
                      <GovSelect
                        label="Secteur du lieu"
                        value={lieuSecteur}
                        onChange={(e) => setLieuSecteur(e.target.value)}
                        leftIcon={<Building2 size={18} />}
                        options={[
                          { label: "Tous les secteurs", value: "" },
                          { label: "Éducation", value: "EDUCATION" },
                          { label: "Santé", value: "SANTE" },
                          { label: "Sport", value: "SPORT" },
                          { label: "Social", value: "SOCIAL" },
                          { label: "Culturel", value: "CULTUREL" },
                          { label: "Autre", value: "AUTRE" }
                        ]}
                      />
                      <GovSelect
                        label="Établissement *"
                        leftIcon={<Target size={18} />}
                        options={[
                          { label: "Sélectionnez un établissement...", value: "" },
                          ...etablissements
                            .filter(e => !lieuSecteur || e.secteur === lieuSecteur)
                            .map(e => ({
                              label: locale === 'ar' ? (e.nomArabe || e.nom) : e.nom,
                              value: e.id
                            }))
                        ]}
                        {...register('lieuEtablissementId', { valueAsNumber: true })}
                      />
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <GovInput
                        label="Lieu exact ou Nom de la salle *"
                        placeholder="Ex: Grande Salle du Conseil, Stade Municipal..."
                        leftIcon={<MapPin size={18} />}
                        {...register('lieu')}
                      />
                      
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">
                          Position sur la carte
                        </label>
                        <div className="rounded-[2rem] overflow-hidden border-4 border-border shadow-inner">
                          <LocationMap 
                            position={{ lat: formData.latitude || 33.45, lng: formData.longitude || -7.52 }}
                            onPositionChange={(lat, lng) => {
                              updateField('latitude', lat);
                              updateField('longitude', lng);
                            }}
                            height="h-64"
                          />
                        </div>
                        <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest text-center italic">Glissez le marqueur pour définir l'emplacement exact</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {currentStep === 3 && (
            <motion.div 
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <GovInput
                  label="Date de début *"
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  leftIcon={<Calendar size={18} />}
                  {...register('dateDebut')}
                />
                <GovInput
                  label="Date de fin"
                  type="date"
                  min={formData.dateDebut || new Date().toISOString().split('T')[0]}
                  leftIcon={<Calendar size={18} />}
                  {...register('dateFin')}
                />

                <GovInput
                  label="Heure de début"
                  type="time"
                  leftIcon={<Clock size={18} />}
                  {...register('heureDebut')}
                />
                <GovInput
                  label="Heure de fin"
                  type="time"
                  leftIcon={<Clock size={18} />}
                  {...register('heureFin')}
                />

                <GovInput
                  label="Capacité maximale"
                  type="number"
                  placeholder="Ex: 500"
                  leftIcon={<Users size={18} />}
                  {...register('capaciteMax', { valueAsNumber: true })}
                />

                <div className="flex flex-col justify-end">
                   <label className={cn(
                    "flex items-start gap-4 p-5 rounded-[1.5rem] border-2 cursor-pointer transition-all w-full group shadow-sm",
                    formData.isGratuit 
                      ? "border-emerald-500 bg-emerald-500/5 shadow-emerald-500/10 shadow-lg" 
                      : "border-border bg-muted/10 hover:border-border/80"
                  )}>
                    <input
                      type="checkbox"
                      {...register('isGratuit')}
                      className="w-6 h-6 rounded-lg border-border text-emerald-600 mt-1 focus:ring-emerald-500/20 cursor-pointer"
                    />
                    <div>
                      <span className={cn(
                        "text-xs font-black uppercase tracking-widest block transition-colors",
                        formData.isGratuit ? "text-emerald-700" : "text-foreground"
                      )}>Participation gratuite</span>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60 mt-1">L'accès à l'événement est-il gratuit ?</p>
                    </div>
                  </label>
                </div>

                <AnimatePresence>
                  {!formData.isGratuit && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden md:col-span-2"
                    >
                      <GovInput
                        label="Prix d'entrée (DH) *"
                        type="number"
                        placeholder="Ex: 50"
                        leftIcon={<Sparkles size={18} />}
                        {...register('prixEntree', { valueAsNumber: true })}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {currentStep === 4 && (
            <motion.div 
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div>
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1 mb-4 block">
                  Photos de l'événement
                </label>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-8">
                  {uploadedImages.map((img, idx) => (
                    <motion.div 
                      layout
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      key={idx} 
                      className="relative aspect-video rounded-3xl overflow-hidden group border border-border shadow-md"
                    >
                      <img src={img.url} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <GovButton 
                          onClick={() => removeImage(idx)}
                          variant="danger"
                          size="icon"
                          className="rounded-full h-10 w-10"
                        >
                          <Trash2 size={16} />
                        </GovButton>
                      </div>
                    </motion.div>
                  ))}
                  <label className="aspect-video rounded-3xl border-4 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:bg-muted/30 hover:border-[hsl(var(--gov-blue)/0.3)] transition-all group relative overflow-hidden">
                    <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
                    {uploading ? (
                      <Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--gov-blue))]" />
                    ) : (
                      <>
                        <div className="w-12 h-12 bg-muted rounded-2xl flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                          <Upload className="w-6 h-6 text-muted-foreground group-hover:text-[hsl(var(--gov-blue))]" />
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Ajouter</span>
                      </>
                    )}
                  </label>
                </div>
              </div>

              {/* Résumé Final */}
              <div className="p-8 bg-card/60 backdrop-blur-md rounded-[2.5rem] border border-border shadow-xl">
                 <h4 className="text-[10px] font-black text-foreground uppercase tracking-widest mb-6 flex items-center gap-2">
                    <Target className="w-5 h-5 text-emerald-500" />
                    Résumé de l'événement
                 </h4>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-4 text-sm">
                    <div className="flex justify-between items-center py-2 border-b border-border/50">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Titre</span>
                      <span className="font-black text-foreground truncate max-w-[200px]">{formData.titre || '-'}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-border/50">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Secteur</span>
                      <span className="font-black text-foreground">{formData.secteur ? tSectors(formData.secteur as any) : '-'}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-border/50">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Lieu</span>
                      <span className="font-black text-foreground truncate max-w-[200px]">{formData.lieu || '-'}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-border/50">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Date</span>
                      <span className="font-black text-foreground">{formData.dateDebut || '-'}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-border/50">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Organisation</span>
                      <span className="font-black text-[hsl(var(--gov-blue))]">
                         {formData.isOrganiseParProvince ? 'Province de Médiouna' : 'Établissement'}
                      </span>
                    </div>
                 </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="px-10 py-8 border-t border-border bg-card flex items-center justify-between flex-shrink-0">
           <GovButton
             onClick={saveDraft}
             loading={savingDraft}
             variant="outline"
             size="sm"
             leftIcon={!savingDraft && <Save size={16} />}
             className="rounded-full px-8"
           >
             Brouillon
           </GovButton>

           <div className="flex items-center gap-4">
             {currentStep > 1 && (
               <GovButton
                 onClick={goPrev}
                 variant="outline"
                 size="sm"
                 leftIcon={<ChevronLeft size={16} />}
                 className="rounded-full px-8"
               >
                 Retour
               </GovButton>
             )}
             {currentStep < 4 ? (
               <GovButton
                 onClick={goNext}
                 variant="primary"
                 size="sm"
                 rightIcon={<ChevronRight size={16} />}
                 className="rounded-full px-10 shadow-lg shadow-[hsl(var(--gov-blue))/0.2]"
               >
                 Suivant
               </GovButton>
             ) : (
               <GovButton
                 onClick={handleSubmit(onSubmit)}
                 loading={loading}
                 variant="primary"
                 size="sm"
                 leftIcon={!loading && <Check size={18} />}
                 className="rounded-full px-12 shadow-xl shadow-[hsl(var(--gov-blue))/0.3] bg-emerald-600 hover:bg-emerald-700 border-none"
               >
                 Créer l'événement
               </GovButton>
             )}
           </div>
        </div>
      </div>
    </div>
  );
}
