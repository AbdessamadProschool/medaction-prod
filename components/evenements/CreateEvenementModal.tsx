'use client';

import { useState, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import {
  X,
  ChevronRight,
  ChevronLeft,
  Check,
  Calendar,
  MapPin,
  Users,
  Image as ImageIcon,
  Loader2,
  Upload,
  Trash2,
  Clock,
  Building2,
  Info,
  Save,
} from 'lucide-react';
import { z } from 'zod';

// Carte dynamique
const LocationMap = dynamic(() => import('@/components/maps/LocationMap'), {
  ssr: false,
  loading: () => <div className="w-full h-48 bg-gray-100 rounded-xl animate-pulse" />,
});

// Schéma de validation Zod
const evenementSchema = z.object({
  // Step 1: Infos base
  titre: z.string().min(5, "Minimum 5 caractères").max(200, "Maximum 200 caractères"),
  description: z.string().min(20, "Minimum 20 caractères").max(5000, "Maximum 5000 caractères"),
  secteur: z.enum(['EDUCATION', 'SANTE', 'SPORT', 'SOCIAL', 'CULTUREL', 'AUTRE']),
  typeCategorique: z.string().min(1, "Catégorie requise"),
  
  // Step 2: Localisation
  communeId: z.number().int().positive("Commune requise"),
  etablissementId: z.number().int().positive().optional().nullable(),
  lieu: z.string().min(3, "Lieu requis").max(255),
  adresseComplete: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  
  // Step 3: Participation
  dateDebut: z.string().min(1, "Date de début requise"),
  dateFin: z.string().optional(),
  heureDebut: z.string().optional(),
  heureFin: z.string().optional(),
  capaciteMax: z.number().int().positive().optional().nullable(),
  isGratuit: z.boolean(),
  prixEntree: z.number().positive().optional().nullable(),
  lienInscription: z.string().url().optional().nullable().or(z.literal('')),
  
  // Step 4: Médias
  medias: z.array(z.object({
    url: z.string(),
    type: z.enum(['IMAGE', 'VIDEO']),
  })).optional(),
});

type EvenementFormData = z.infer<typeof evenementSchema>;

interface CreateEvenementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (evenement: any) => void;
}

interface Commune {
  id: number;
  nom: string;
}

interface Etablissement {
  id: number;
  nom: string;
}

const STEPS = [
  { id: 1, title: 'Informations', icon: Info, description: 'Titre et description' },
  { id: 2, title: 'Localisation', icon: MapPin, description: 'Lieu de l\'événement' },
  { id: 3, title: 'Participation', icon: Users, description: 'Dates et inscriptions' },
  { id: 4, title: 'Médias', icon: ImageIcon, description: 'Photos et vidéos' },
];

const SECTEURS = [
  { value: 'EDUCATION', label: 'Éducation', emoji: '🎓' },
  { value: 'SANTE', label: 'Santé', emoji: '🏥' },
  { value: 'SPORT', label: 'Sport', emoji: '⚽' },
  { value: 'SOCIAL', label: 'Social', emoji: '🤝' },
  { value: 'CULTUREL', label: 'Culturel', emoji: '🎭' },
  { value: 'AUTRE', label: 'Autre', emoji: '📌' },
];

const CATEGORIES = [
  'Conférence', 'Formation', 'Atelier', 'Festival', 'Compétition',
  'Spectacle', 'Exposition', 'Journée portes ouvertes', 'Campagne',
  'Rencontre', 'Cérémonie', 'Autre',
];

export default function CreateEvenementModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateEvenementModalProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Data
  const [communes, setCommunes] = useState<Commune[]>([]);
  const [etablissements, setEtablissements] = useState<Etablissement[]>([]);
  
  // Form data
  const [formData, setFormData] = useState<Partial<EvenementFormData>>({
    titre: '',
    description: '',
    secteur: 'AUTRE',
    typeCategorique: '',
    communeId: undefined,
    etablissementId: null,
    lieu: '',
    adresseComplete: '',
    latitude: 33.45,
    longitude: -7.52,
    dateDebut: '',
    dateFin: '',
    heureDebut: '',
    heureFin: '',
    capaciteMax: null,
    isGratuit: true,
    prixEntree: null,
    lienInscription: '',
    medias: [],
  });
  
  // Upload
  const [uploadedImages, setUploadedImages] = useState<{ url: string; filename: string }[]>([]);
  const [uploading, setUploading] = useState(false);

  // Charger communes
  useEffect(() => {
    const loadCommunes = async () => {
      try {
        const res = await fetch('/api/map/communes');
        if (res.ok) {
          const data = await res.json();
          setCommunes(data.communes || []);
        }
      } catch (error) {
        console.error('Erreur chargement communes:', error);
      }
    };
    if (isOpen) loadCommunes();
  }, [isOpen]);

  // Charger établissements par commune
  useEffect(() => {
    const loadEtablissements = async () => {
      if (!formData.communeId) {
        setEtablissements([]);
        return;
      }
      try {
        const res = await fetch(`/api/etablissements?communeId=${formData.communeId}&limit=100`);
        if (res.ok) {
          const data = await res.json();
          setEtablissements(data.data || []);
        }
      } catch (error) {
        console.error('Erreur chargement établissements:', error);
      }
    };
    loadEtablissements();
  }, [formData.communeId]);

  // Charger draft depuis localStorage
  useEffect(() => {
    if (isOpen) {
      const draft = localStorage.getItem('evenement_draft');
      if (draft) {
        try {
          const parsed = JSON.parse(draft);
          setFormData(parsed.formData);
          setUploadedImages(parsed.images || []);
          setCurrentStep(parsed.step || 1);
        } catch (e) {
          console.error('Erreur parsing draft:', e);
        }
      }
    }
  }, [isOpen]);

  // Update form data
  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Valider step
  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.titre || formData.titre.length < 5) {
        newErrors.titre = 'Titre requis (min 5 caractères)';
      }
      if (!formData.description || formData.description.length < 20) {
        newErrors.description = 'Description requise (min 20 caractères)';
      }
      if (!formData.typeCategorique) {
        newErrors.typeCategorique = 'Catégorie requise';
      }
    }

    if (step === 2) {
      if (!formData.communeId) {
        newErrors.communeId = 'Commune requise';
      }
      if (!formData.lieu || formData.lieu.length < 3) {
        newErrors.lieu = 'Lieu requis';
      }
    }

    if (step === 3) {
      if (!formData.dateDebut) {
        newErrors.dateDebut = 'Date de début requise';
      }
      if (!formData.isGratuit && (!formData.prixEntree || formData.prixEntree <= 0)) {
        newErrors.prixEntree = 'Prix requis si non gratuit';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Navigation
  const goNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(4, prev + 1));
    }
  };

  const goPrev = () => {
    setCurrentStep(prev => Math.max(1, prev - 1));
  };

  // Save draft
  const saveDraft = async () => {
    setSavingDraft(true);
    try {
      localStorage.setItem('evenement_draft', JSON.stringify({
        formData,
        images: uploadedImages,
        step: currentStep,
        savedAt: new Date().toISOString(),
      }));
      // Petit délai pour UX
      await new Promise(r => setTimeout(r, 500));
    } finally {
      setSavingDraft(false);
    }
  };

  // Upload images
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const formData = new FormData();
      Array.from(files).forEach(file => formData.append('files', file));
      formData.append('type', 'evenement');

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setUploadedImages(prev => [
          ...prev,
          ...data.uploaded.map((f: any) => ({ url: f.url, filename: f.filename })),
        ]);
      } else {
        const data = await res.json();
        alert(data.error || 'Erreur upload');
      }
    } catch (error) {
      alert('Erreur de connexion');
    } finally {
      setUploading(false);
    }
  };

  // Supprimer image
  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  // Soumettre
  const handleSubmit = async () => {
    // Valider tous les steps
    for (let i = 1; i <= 3; i++) {
      if (!validateStep(i)) {
        setCurrentStep(i);
        return;
      }
    }

    setLoading(true);
    try {
      const submitData = {
        ...formData,
        medias: uploadedImages.map(img => ({
          url: img.url,
          type: 'IMAGE' as const,
        })),
      };

      const res = await fetch('/api/evenements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      });

      if (res.ok) {
        const data = await res.json();
        // Supprimer le draft
        localStorage.removeItem('evenement_draft');
        onSuccess?.(data.data);
        onClose();
        router.push(`/evenements/${data.data.id}`);
      } else {
        const data = await res.json();
        alert(data.error || 'Erreur création');
      }
    } catch (error) {
      alert('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  // Fermer et sauvegarder draft
  const handleClose = () => {
    saveDraft();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Créer un événement
            </h2>
            <p className="text-sm text-gray-500">Étape {currentStep} sur 4</p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        {/* Steps indicator */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              
              return (
                <div key={step.id} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                      isCompleted 
                        ? 'bg-emerald-500 text-white'
                        : isActive 
                          ? 'bg-emerald-100 text-emerald-600 border-2 border-emerald-500'
                          : 'bg-gray-100 text-gray-400'
                    }`}>
                      {isCompleted ? <Check size={18} /> : <Icon size={18} />}
                    </div>
                    <span className={`text-xs mt-1 hidden sm:block ${
                      isActive ? 'text-emerald-600 font-medium' : 'text-gray-400'
                    }`}>
                      {step.title}
                    </span>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div className={`w-8 sm:w-16 h-0.5 mx-2 ${
                      isCompleted ? 'bg-emerald-500' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Step 1: Infos base */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Titre de l'événement *
                </label>
                <input
                  type="text"
                  value={formData.titre || ''}
                  onChange={(e) => updateField('titre', e.target.value)}
                  placeholder="Ex: Journée portes ouvertes au centre culturel"
                  className={`w-full px-4 py-2.5 rounded-xl border ${
                    errors.titre ? 'border-red-500' : 'border-gray-200'
                  } focus:ring-2 focus:ring-emerald-500 focus:border-transparent`}
                />
                {errors.titre && (
                  <p className="text-red-500 text-xs mt-1">{errors.titre}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description *
                </label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => updateField('description', e.target.value)}
                  rows={4}
                  placeholder="Décrivez l'événement en détail..."
                  className={`w-full px-4 py-2.5 rounded-xl border ${
                    errors.description ? 'border-red-500' : 'border-gray-200'
                  } focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none`}
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  {errors.description && (
                    <span className="text-red-500">{errors.description}</span>
                  )}
                  <span>{formData.description?.length || 0}/5000</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Secteur *
                  </label>
                  <select
                    value={formData.secteur || 'AUTRE'}
                    onChange={(e) => updateField('secteur', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500"
                  >
                    {SECTEURS.map(s => (
                      <option key={s.value} value={s.value}>
                        {s.emoji} {s.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Catégorie *
                  </label>
                  <select
                    value={formData.typeCategorique || ''}
                    onChange={(e) => updateField('typeCategorique', e.target.value)}
                    className={`w-full px-4 py-2.5 rounded-xl border ${
                      errors.typeCategorique ? 'border-red-500' : 'border-gray-200'
                    } focus:ring-2 focus:ring-emerald-500`}
                  >
                    <option value="">Sélectionner...</option>
                    {CATEGORIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Localisation */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Commune *
                  </label>
                  <select
                    value={formData.communeId || ''}
                    onChange={(e) => updateField('communeId', e.target.value ? parseInt(e.target.value) : undefined)}
                    className={`w-full px-4 py-2.5 rounded-xl border ${
                      errors.communeId ? 'border-red-500' : 'border-gray-200'
                    } focus:ring-2 focus:ring-emerald-500`}
                  >
                    <option value="">Sélectionner...</option>
                    {communes.map(c => (
                      <option key={c.id} value={c.id}>{c.nom}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Établissement (optionnel)
                  </label>
                  <select
                    value={formData.etablissementId || ''}
                    onChange={(e) => updateField('etablissementId', e.target.value ? parseInt(e.target.value) : null)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500"
                    disabled={!formData.communeId}
                  >
                    <option value="">Aucun</option>
                    {etablissements.map(e => (
                      <option key={e.id} value={e.id}>{e.nom}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Lieu précis *
                </label>
                <input
                  type="text"
                  value={formData.lieu || ''}
                  onChange={(e) => updateField('lieu', e.target.value)}
                  placeholder="Ex: Salle des fêtes, 12 rue principale"
                  className={`w-full px-4 py-2.5 rounded-xl border ${
                    errors.lieu ? 'border-red-500' : 'border-gray-200'
                  } focus:ring-2 focus:ring-emerald-500`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Localiser sur la carte
                </label>
                <LocationMap
                  position={{ lat: formData.latitude || 33.45, lng: formData.longitude || -7.52 }}
                  onPositionChange={(lat, lng) => {
                    updateField('latitude', lat);
                    updateField('longitude', lng);
                  }}
                  height="h-48"
                />
              </div>
            </div>
          )}

          {/* Step 3: Participation */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Date de début *
                  </label>
                  <input
                    type="date"
                    value={formData.dateDebut || ''}
                    onChange={(e) => updateField('dateDebut', e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className={`w-full px-4 py-2.5 rounded-xl border ${
                      errors.dateDebut ? 'border-red-500' : 'border-gray-200'
                    } focus:ring-2 focus:ring-emerald-500`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Date de fin
                  </label>
                  <input
                    type="date"
                    value={formData.dateFin || ''}
                    onChange={(e) => updateField('dateFin', e.target.value)}
                    min={formData.dateDebut || new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Heure de début
                  </label>
                  <input
                    type="time"
                    value={formData.heureDebut || ''}
                    onChange={(e) => updateField('heureDebut', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Heure de fin
                  </label>
                  <input
                    type="time"
                    value={formData.heureFin || ''}
                    onChange={(e) => updateField('heureFin', e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Capacité maximale
                </label>
                <input
                  type="number"
                  value={formData.capaciteMax || ''}
                  onChange={(e) => updateField('capaciteMax', e.target.value ? parseInt(e.target.value) : null)}
                  placeholder="Laisser vide si illimité"
                  min={1}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isGratuit}
                    onChange={(e) => updateField('isGratuit', e.target.checked)}
                    className="w-5 h-5 rounded border-gray-300 text-emerald-500 focus:ring-emerald-500"
                  />
                  <span className="font-medium">Événement gratuit</span>
                </label>
              </div>

              {!formData.isGratuit && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Prix d'entrée (DH) *
                  </label>
                  <input
                    type="number"
                    value={formData.prixEntree || ''}
                    onChange={(e) => updateField('prixEntree', e.target.value ? parseFloat(e.target.value) : null)}
                    placeholder="50"
                    min={0}
                    step={0.01}
                    className={`w-full px-4 py-2.5 rounded-xl border ${
                      errors.prixEntree ? 'border-red-500' : 'border-gray-200'
                    } focus:ring-2 focus:ring-emerald-500`}
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Lien d'inscription externe
                </label>
                <input
                  type="url"
                  value={formData.lienInscription || ''}
                  onChange={(e) => updateField('lienInscription', e.target.value)}
                  placeholder="https://..."
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          )}

          {/* Step 4: Médias */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Photos de l'événement
                </label>
                
                {/* Zone d'upload */}
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                  {uploading ? (
                    <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-gray-400 mb-2" />
                      <span className="text-sm text-gray-500">
                        Cliquer pour ajouter des images
                      </span>
                      <span className="text-xs text-gray-400 mt-1">
                        JPG, PNG, WebP (max 5MB)
                      </span>
                    </>
                  )}
                </label>
              </div>

              {/* Images uploadées */}
              {uploadedImages.length > 0 && (
                <div className="grid grid-cols-3 gap-3">
                  {uploadedImages.map((img, index) => (
                    <div key={index} className="relative aspect-video rounded-lg overflow-hidden group">
                      <img
                        src={img.url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Résumé */}
              <div className="bg-emerald-50 rounded-xl p-4 mt-6">
                <h4 className="font-medium text-emerald-800 mb-3">Résumé de l'événement</h4>
                <div className="space-y-2 text-sm text-emerald-700">
                  <p><strong>Titre:</strong> {formData.titre || '-'}</p>
                  <p><strong>Secteur:</strong> {SECTEURS.find(s => s.value === formData.secteur)?.label}</p>
                  <p><strong>Date:</strong> {formData.dateDebut ? new Date(formData.dateDebut).toLocaleDateString('fr-FR') : '-'}</p>
                  <p><strong>Lieu:</strong> {formData.lieu || '-'}</p>
                  <p><strong>Prix:</strong> {formData.isGratuit ? 'Gratuit' : `${formData.prixEntree} DH`}</p>
                  <p><strong>Photos:</strong> {uploadedImages.length}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-100 dark:border-gray-700">
          <button
            onClick={saveDraft}
            disabled={savingDraft}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {savingDraft ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            Sauvegarder brouillon
          </button>

          <div className="flex items-center gap-3">
            {currentStep > 1 && (
              <button
                onClick={goPrev}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft size={18} />
                Précédent
              </button>
            )}

            {currentStep < 4 ? (
              <button
                onClick={goNext}
                className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors"
              >
                Suivant
                <ChevronRight size={18} />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Check size={18} />
                )}
                Créer l'événement
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
