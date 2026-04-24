'use client';

import { useState, useMemo } from 'react';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  Plus, 
  Trash2, 
  Save, 
  Loader2,
  Info,
  Layers,
  ArrowRight,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  GraduationCap,
  Coins,
  History,
  FileText
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { soumettreDemandeEtablissement } from '@/app/actions/etablissementWorkflow';

interface DemandeFormProps {
  initialData?: any;
  type: 'CREATION' | 'MODIFICATION';
  etablissementId?: number;
}

const STEPS = [
  { id: 'general', icon: Building2 },
  { id: 'localization', icon: MapPin },
  { id: 'infra', icon: Layers },
  { id: 'education', icon: GraduationCap },
  { id: 'final', icon: Save }
];

export default function DemandeForm({ initialData, type, etablissementId }: DemandeFormProps) {
  const t = useTranslations('establishments_workflow');
  const te = useTranslations('admin.establishments');
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const [formData, setFormData] = useState({
    // Step 1: Identification
    nom: initialData?.nom || '',
    nomArabe: initialData?.nomArabe || '',
    code: initialData?.code || '',
    secteur: initialData?.secteur || 'EDUCATION',
    typeEtablissement: initialData?.typeEtablissement || '',
    nature: initialData?.nature || 'PUBLIC',
    tutelle: initialData?.tutelle || '',
    statutJuridique: initialData?.statutJuridique || '',
    gestionnaire: initialData?.gestionnaire || '',
    responsableNom: initialData?.responsableNom || '',
    anneeCreation: initialData?.anneeCreation || '',
    anneeOuverture: initialData?.anneeOuverture || '',
    
    // Step 2: Localisation
    communeId: initialData?.communeId || '',
    annexeId: initialData?.annexeId || '',
    quartierDouar: initialData?.quartierDouar || '',
    adresseComplete: initialData?.adresseComplete || initialData?.adresse || '',
    latitude: initialData?.latitude || '',
    longitude: initialData?.longitude || '',
    altitude: initialData?.altitude || '',
    distanceChefLieu: initialData?.distanceChefLieu || '',
    transportPublic: initialData?.transportPublic || '',
    voieAcces: initialData?.voieAcces || '',
    
    // Step 3: Contact
    telephone: initialData?.telephone || '',
    email: initialData?.email || '',
    siteWeb: initialData?.siteWeb || '',
    
    // Step 3: Infrastructure & RH
    etatInfrastructure: initialData?.etatInfrastructure || 'BON',
    statutFonctionnel: initialData?.statutFonctionnel || 'FONCTIONNEL',
    surfaceTotale: initialData?.surfaceTotale || '',
    disponibiliteEau: initialData?.disponibiliteEau ?? true,
    disponibiliteElectricite: initialData?.disponibiliteElectricite ?? true,
    connexionInternet: initialData?.connexionInternet ?? true,
    nombreSalles: initialData?.nombreSalles || '',
    effectifTotal: initialData?.effectifTotal || '',
    nombrePersonnel: initialData?.nombrePersonnel || '',
    cadre: initialData?.cadre || '',
    capaciteAccueil: initialData?.capaciteAccueil || '',
    
    // Step 4: Secteur Éducation
    cycle: initialData?.cycle || '',
    nbClasses: initialData?.nbClasses || '',
    nbEnseignants: initialData?.nbEnseignants || '',
    nbCadres: initialData?.nbCadres || '',
    elevesPrescolaire: initialData?.elevesPrescolaire || '',
    elevesPrescolaireFilles: initialData?.elevesPrescolaireFilles || '',
    elevesTotal: initialData?.elevesTotal || '',
    elevesFilles: initialData?.elevesFilles || '',
    nouveauxInscrits: initialData?.nouveauxInscrits || '',
    nouveauxInscritsFilles: initialData?.nouveauxInscritsFilles || '',
    tauxReussite: initialData?.tauxReussite || '',
    fillesDerniereAnnee: initialData?.fillesDerniereAnnee || '',

    // Step 5: Financement & Finalisation
    sourcesFinancement: initialData?.sourcesFinancement || '',
    budgetAnnuel: initialData?.budgetAnnuel || '',
    partenaires: initialData?.partenaires || '',
    remarques: initialData?.remarques || '',
    besoinsUrgents: initialData?.besoinsUrgents || '',
    projetsFuturs: initialData?.projetsFuturs || '',
    justification: '',
  });

  const [complementaryFields, setComplementaryFields] = useState<Array<{ key: string, value: string }>>(() => {
    if (initialData?.champsComplementaires) {
      return Object.entries(initialData.champsComplementaires).map(([key, value]) => ({ 
        key, 
        value: String(value) 
      }));
    }
    return [];
  });

  const addField = () => setComplementaryFields([...complementaryFields, { key: '', value: '' }]);
  const removeField = (index: number) => setComplementaryFields(complementaryFields.filter((_, i) => i !== index));
  const updateField = (index: number, keyOrValue: 'key' | 'value', text: string) => {
    const updated = [...complementaryFields];
    updated[index][keyOrValue] = text;
    setComplementaryFields(updated);
  };

  const nextStep = () => {
    // Validation minimale
    if (currentStep === 0) {
      if (!formData.nom || !formData.code) {
        toast.error("Veuillez remplir les champs obligatoires (Nom et Code)");
        return;
      }
    }
    if (currentStep === 1) {
      if (!formData.communeId || !formData.latitude || !formData.longitude) {
        toast.error("Veuillez remplir les données de localisation (Commune, Lat, Long)");
        return;
      }
    }
    
    // Skip Step 4 if not EDUCATION
    if (currentStep === 2 && formData.secteur !== 'EDUCATION') {
      setCurrentStep(4);
    } else {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
    }
  };

  const prevStep = () => {
    if (currentStep === 4 && formData.secteur !== 'EDUCATION') {
      setCurrentStep(2);
    } else {
      setCurrentStep(prev => Math.max(prev - 1, 0));
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!formData.justification) {
      toast.error("Veuillez fournir une justification pour cette demande");
      return;
    }
    
    setLoading(true);

    const extraFields: Record<string, string> = {};
    complementaryFields.forEach(f => {
      if (f.key.trim()) extraFields[f.key.trim()] = f.value;
    });

    const parseNum = (val: any, isFloat = false) => {
      if (val === '' || val === null || val === undefined) return null;
      return isFloat ? parseFloat(String(val)) : parseInt(String(val));
    };

    const { justification, ...cleanDonnees } = formData;

    const res = await soumettreDemandeEtablissement({
      type,
      etablissementId,
      donneesModifiees: {
        ...cleanDonnees,
        communeId: parseNum(formData.communeId),
        annexeId: parseNum(formData.annexeId),
        latitude: parseNum(formData.latitude, true),
        longitude: parseNum(formData.longitude, true),
        altitude: parseNum(formData.altitude, true),
        surfaceTotale: parseNum(formData.surfaceTotale, true),
        anneeCreation: parseNum(formData.anneeCreation),
        anneeOuverture: parseNum(formData.anneeOuverture),
        nombreSalles: parseNum(formData.nombreSalles),
        effectifTotal: parseNum(formData.effectifTotal),
        nombrePersonnel: parseNum(formData.nombrePersonnel),
        capaciteAccueil: parseNum(formData.capaciteAccueil),
        nbClasses: parseNum(formData.nbClasses),
        nbEnseignants: parseNum(formData.nbEnseignants),
        nbCadres: parseNum(formData.nbCadres),
        elevesPrescolaire: parseNum(formData.elevesPrescolaire),
        elevesPrescolaireFilles: parseNum(formData.elevesPrescolaireFilles),
        elevesTotal: parseNum(formData.elevesTotal),
        elevesFilles: parseNum(formData.elevesFilles),
        nouveauxInscrits: parseNum(formData.nouveauxInscrits),
        nouveauxInscritsFilles: parseNum(formData.nouveauxInscritsFilles),
        tauxReussite: parseNum(formData.tauxReussite, true),
        fillesDerniereAnnee: parseNum(formData.fillesDerniereAnnee),
        distanceChefLieu: parseNum(formData.distanceChefLieu, true),
        budgetAnnuel: parseNum(formData.budgetAnnuel, true),
      },
      champsComplementaires: extraFields,
      justification: formData.justification
    });

    if (res.success) {
      toast.success(t('submit_success'));
      router.push('/delegation/etablissements/mes-demandes');
    } else {
      toast.error(res.error || 'Erreur');
    }
    setLoading(false);
  };

  return (
    <div className="max-w-6xl mx-auto pb-20 px-4">
      {/* Header Premium */}
      <div className="mb-10 text-center">
         <motion.div 
           initial={{ opacity: 0, y: -20 }}
           animate={{ opacity: 1, y: 0 }}
           className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-full text-sm font-bold mb-4"
         >
           <History size={16} />
           {type === 'CREATION' ? t('request_creation') : t('request_edit')}
         </motion.div>
         <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-2">
           {type === 'CREATION' ? te('create_title') : t('request_edit')}
         </h1>
         <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
           {t('subtitle')}
         </p>
      </div>

      {/* Stepper Logic Visual */}
      <div className="relative mb-12 px-4">
        <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-100 dark:bg-gray-800 -translate-y-1/2 z-0 rounded-full" />
        <div 
          className="absolute top-1/2 left-0 h-1 bg-emerald-500 -translate-y-1/2 z-0 rounded-full transition-all duration-500" 
          style={{ width: `${(currentStep / (STEPS.length - 1)) * 100}%` }}
        />
        
        <div className="relative z-10 flex justify-between">
          {STEPS.map((step, idx) => {
            const Icon = step.icon;
            const isActive = currentStep === idx;
            const isCompleted = currentStep > idx;
            
            // Skip step 4 visually if not Education
            if (idx === 3 && formData.secteur !== 'EDUCATION') return null;

            return (
              <div key={step.id} className="flex flex-col items-center">
                <button
                  onClick={() => idx <= currentStep && setCurrentStep(idx)}
                  disabled={idx > currentStep}
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 border-2 ${
                    isActive 
                      ? 'bg-emerald-500 border-emerald-500 text-white scale-110 shadow-lg shadow-emerald-200 dark:shadow-none' 
                      : isCompleted
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-500'
                        : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-400'
                  }`}
                >
                  {isCompleted ? <CheckCircle2 size={20} /> : <Icon size={20} />}
                </button>
                <span className={`mt-2 text-xs font-bold uppercase tracking-wider ${isActive ? 'text-emerald-600' : 'text-gray-400'}`}>
                  {te(`sections.${step.id}`)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Form Content */}
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-[2.5rem] shadow-2xl shadow-gray-200/50 dark:shadow-none p-8 md:p-12 relative overflow-hidden">
        
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-8"
          >
            {/* STEP 1: GÉNÉRAL */}
            {currentStep === 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                   <SectionTitle icon={Building2} title={te('sections.general')} color="text-emerald-500" />
                   <FormField label={te('form.name')} required>
                      <input
                        required
                        value={formData.nom}
                        onChange={e => setFormData({ ...formData, nom: e.target.value })}
                        className="input-premium"
                        placeholder="Ex: École Al Manar"
                      />
                   </FormField>
                   <FormField label={te('form.nameArabe')}>
                      <input
                        value={formData.nomArabe}
                        onChange={e => setFormData({ ...formData, nomArabe: e.target.value })}
                        dir="rtl"
                        className="input-premium font-arabic text-lg"
                        placeholder="اسم المؤسسة بالعربية"
                      />
                   </FormField>
                   <div className="grid grid-cols-2 gap-4">
                      <FormField label={te('form.code')} required>
                        <input
                          required
                          value={formData.code}
                          onChange={e => setFormData({ ...formData, code: e.target.value })}
                          className="input-premium font-mono"
                          placeholder="CODE123"
                        />
                      </FormField>
                      <FormField label={te('form.sector')}>
                        <select
                          value={formData.secteur}
                          onChange={e => setFormData({ ...formData, secteur: e.target.value })}
                          className="input-premium"
                        >
                          <option value="EDUCATION">Éducation</option>
                          <option value="SANTE">Santé</option>
                          <option value="SPORT">Sport</option>
                          <option value="SOCIAL">Social</option>
                          <option value="CULTUREL">Culturel</option>
                          <option value="AUTRE">Autre</option>
                        </select>
                      </FormField>
                   </div>
                </div>
                <div className="space-y-6">
                   <SectionTitle icon={Info} title={te('sections.admin_details')} color="text-blue-500" />
                   <div className="grid grid-cols-2 gap-4">
                      <FormField label={te('form.nature')}>
                        <select
                          value={formData.nature}
                          onChange={e => setFormData({ ...formData, nature: e.target.value })}
                          className="input-premium"
                        >
                          <option value="PUBLIC">Public</option>
                          <option value="PRIVE">Privé</option>
                        </select>
                      </FormField>
                      <FormField label={te('form.typeEtab')}>
                        <input
                          value={formData.typeEtablissement}
                          onChange={e => setFormData({ ...formData, typeEtablissement: e.target.value })}
                          className="input-premium"
                          placeholder="Ex: École Primaire"
                        />
                      </FormField>
                   </div>
                   <FormField label={te('form.tutelle')}>
                      <input
                        value={formData.tutelle}
                        onChange={e => setFormData({ ...formData, tutelle: e.target.value })}
                        className="input-premium"
                        placeholder="Ex: Ministère de l'Éducation"
                      />
                   </FormField>
                   <div className="grid grid-cols-2 gap-4">
                      <FormField label={te('form.anneeCreation')}>
                        <input
                          type="number"
                          value={formData.anneeCreation}
                          onChange={e => setFormData({ ...formData, anneeCreation: e.target.value })}
                          className="input-premium"
                          placeholder="YYYY"
                        />
                      </FormField>
                      <FormField label={te('form.statutJuridique')}>
                        <input
                          value={formData.statutJuridique}
                          onChange={e => setFormData({ ...formData, statutJuridique: e.target.value })}
                          className="input-premium"
                          placeholder="Ex: Établissement Public"
                        />
                      </FormField>
                   </div>
                </div>
              </div>
            )}

            {/* STEP 2: LOCALISATION */}
            {currentStep === 1 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-6">
                  <SectionTitle icon={MapPin} title={te('sections.localization')} color="text-red-500" />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField label={te('form.commune')} required>
                      <select
                        required
                        value={formData.communeId}
                        onChange={e => setFormData({ ...formData, communeId: e.target.value })}
                        className="input-premium"
                      >
                        <option value="">Sélectionner...</option>
                        <option value="1">Médiouna</option>
                        <option value="2">Tit Mellil</option>
                        <option value="3">Lahraouyine</option>
                        <option value="4">Sidi Hajjaj Oued Hassar</option>
                        <option value="5">Mejatia Oulad Taleb</option>
                        <option value="6">Al Majat</option>
                      </select>
                    </FormField>
                    <FormField label={te('form.quartier')}>
                      <input
                        value={formData.quartierDouar}
                        onChange={e => setFormData({ ...formData, quartierDouar: e.target.value })}
                        className="input-premium"
                        placeholder="Quartier / Douar"
                      />
                    </FormField>
                  </div>
                  <FormField label={te('form.adresse_complete')}>
                    <textarea
                      rows={2}
                      value={formData.adresseComplete}
                      onChange={e => setFormData({ ...formData, adresseComplete: e.target.value })}
                      className="input-premium resize-none"
                      placeholder="Adresse précise..."
                    />
                  </FormField>
                  <div className="grid grid-cols-3 gap-4">
                    <FormField label={te('form.latitude')} required>
                      <input type="number" step="any" value={formData.latitude} onChange={e => setFormData({...formData, latitude: e.target.value})} className="input-premium text-sm font-mono" />
                    </FormField>
                    <FormField label={te('form.longitude')} required>
                      <input type="number" step="any" value={formData.longitude} onChange={e => setFormData({...formData, longitude: e.target.value})} className="input-premium text-sm font-mono" />
                    </FormField>
                    <FormField label={te('form.altitude')}>
                      <input type="number" step="any" value={formData.altitude} onChange={e => setFormData({...formData, altitude: e.target.value})} className="input-premium text-sm font-mono" />
                    </FormField>
                  </div>
                </div>
                <div className="space-y-6">
                   <SectionTitle icon={ArrowRight} title={te('sections.accessibility')} color="text-amber-500" />
                   <FormField label={te('form.voieAcces')}>
                      <input value={formData.voieAcces} onChange={e => setFormData({...formData, voieAcces: e.target.value})} className="input-premium" placeholder="Ex: Route Goudronnée" />
                   </FormField>
                   <FormField label={te('form.transportPublic')}>
                      <input value={formData.transportPublic} onChange={e => setFormData({...formData, transportPublic: e.target.value})} className="input-premium" placeholder="Bus, Grands Taxis..." />
                   </FormField>
                   <FormField label={te('form.distanceChefLieu')}>
                      <input type="number" step="any" value={formData.distanceChefLieu} onChange={e => setFormData({...formData, distanceChefLieu: e.target.value})} className="input-premium" placeholder="Km" />
                   </FormField>
                </div>
              </div>
            )}

            {/* STEP 3: INFRA & RH */}
            {currentStep === 2 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-6">
                  <SectionTitle icon={Layers} title={te('sections.infra')} color="text-indigo-500" />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField label={te('form.etatInfrastructure')}>
                      <select value={formData.etatInfrastructure} onChange={e => setFormData({...formData, etatInfrastructure: e.target.value})} className="input-premium">
                        <option value="EXCELLENT">Excellent</option>
                        <option value="BON">Bon</option>
                        <option value="MOYEN">Moyen</option>
                        <option value="DEGRADE">Dégradé</option>
                        <option value="A_RENOVER">À rénover</option>
                      </select>
                    </FormField>
                    <FormField label={te('form.statutFonctionnel')}>
                      <select value={formData.statutFonctionnel} onChange={e => setFormData({...formData, statutFonctionnel: e.target.value})} className="input-premium">
                        <option value="FONCTIONNEL">Fonctionnel</option>
                        <option value="PARTIEL">Partiel</option>
                        <option value="RENOVATION">Rénovation</option>
                        <option value="FERME">Fermé</option>
                      </select>
                    </FormField>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField label={te('form.surfaceTotale')}>
                      <input type="number" value={formData.surfaceTotale} onChange={e => setFormData({...formData, surfaceTotale: e.target.value})} className="input-premium" placeholder="m²" />
                    </FormField>
                    <FormField label={te('form.nombreSalles')}>
                      <input type="number" value={formData.nombreSalles} onChange={e => setFormData({...formData, nombreSalles: e.target.value})} className="input-premium" />
                    </FormField>
                  </div>
                  <div className="grid grid-cols-3 gap-2 pt-4">
                    <CheckItem label={te('form.disponibiliteEau')} checked={formData.disponibiliteEau} onChange={v => setFormData({...formData, disponibiliteEau: v})} />
                    <CheckItem label={te('form.disponibiliteElectricite')} checked={formData.disponibiliteElectricite} onChange={v => setFormData({...formData, disponibiliteElectricite: v})} />
                    <CheckItem label={te('form.connexionInternet')} checked={formData.connexionInternet} onChange={v => setFormData({...formData, connexionInternet: v})} />
                  </div>
                </div>
                <div className="space-y-6">
                   <SectionTitle icon={Plus} title={te('sections.staff')} color="text-teal-500" />
                   <div className="grid grid-cols-2 gap-4">
                      <FormField label={te('form.capaciteAccueil')}>
                        <input type="number" value={formData.capaciteAccueil} onChange={e => setFormData({...formData, capaciteAccueil: e.target.value})} className="input-premium" />
                      </FormField>
                      <FormField label={te('form.effectifTotal')}>
                        <input type="number" value={formData.effectifTotal} onChange={e => setFormData({...formData, effectifTotal: e.target.value})} className="input-premium" />
                      </FormField>
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <FormField label={te('form.nombrePersonnel')}>
                        <input type="number" value={formData.nombrePersonnel} onChange={e => setFormData({...formData, nombrePersonnel: e.target.value})} className="input-premium" />
                      </FormField>
                      <FormField label={te('form.cadre')}>
                        <input value={formData.cadre} onChange={e => setFormData({...formData, cadre: e.target.value})} className="input-premium" placeholder="Ex: Médical / Enseignant" />
                      </FormField>
                   </div>
                   <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                      <SectionTitle icon={Phone} title={te('sections.contact_manager')} color="text-blue-500" />
                      <FormField label={te('form.manager')}>
                         <input value={formData.responsableNom} onChange={e => setFormData({...formData, responsableNom: e.target.value})} className="input-premium" />
                      </FormField>
                      <div className="grid grid-cols-2 gap-4">
                         <FormField label={te('form.phone')}>
                            <input type="tel" value={formData.telephone} onChange={e => setFormData({...formData, telephone: e.target.value})} className="input-premium" />
                         </FormField>
                         <FormField label={te('form.email')}>
                            <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="input-premium" />
                         </FormField>
                      </div>
                   </div>
                </div>
              </div>
            )}

            {/* STEP 4: SECTEUR ÉDUCATION (Optionnel) */}
            {currentStep === 3 && formData.secteur === 'EDUCATION' && (
              <div className="space-y-8">
                <SectionTitle icon={GraduationCap} title={te('sections.education')} color="text-orange-500" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <FormField label={te('form.cycle')}>
                    <select value={formData.cycle} onChange={e => setFormData({...formData, cycle: e.target.value})} className="input-premium">
                      <option value="">Choisir...</option>
                      <option value="PRIMAIRE">Primaire</option>
                      <option value="COLLEGE">Collège</option>
                      <option value="LYCEE">Lycée</option>
                      <option value="PRE-SCOLAIRE">Préscolaire</option>
                    </select>
                  </FormField>
                  <FormField label={te('form.nbClasses')}>
                    <input type="number" value={formData.nbClasses} onChange={e => setFormData({...formData, nbClasses: e.target.value})} className="input-premium" />
                  </FormField>
                  <FormField label={te('form.nbEnseignants')}>
                    <input type="number" value={formData.nbEnseignants} onChange={e => setFormData({...formData, nbEnseignants: e.target.value})} className="input-premium" />
                  </FormField>
                  <FormField label={te('form.nbCadres')}>
                    <input type="number" value={formData.nbCadres} onChange={e => setFormData({...formData, nbCadres: e.target.value})} className="input-premium" />
                  </FormField>
                  
                  <FormField label={te('form.elevesTotal')}>
                    <input type="number" value={formData.elevesTotal} onChange={e => setFormData({...formData, elevesTotal: e.target.value})} className="input-premium" />
                  </FormField>
                  <FormField label={te('form.elevesFilles')}>
                    <input type="number" value={formData.elevesFilles} onChange={e => setFormData({...formData, elevesFilles: e.target.value})} className="input-premium" />
                  </FormField>
                  <FormField label={te('form.elevesPrescolaire')}>
                    <input type="number" value={formData.elevesPrescolaire} onChange={e => setFormData({...formData, elevesPrescolaire: e.target.value})} className="input-premium" />
                  </FormField>
                  <FormField label={te('form.tauxReussite')}>
                    <input type="number" step="0.01" value={formData.tauxReussite} onChange={e => setFormData({...formData, tauxReussite: e.target.value})} className="input-premium" placeholder="%" />
                  </FormField>
                </div>
              </div>
            )}

            {/* STEP 5: FINALISATION */}
            {currentStep === 4 && (
              <div className="space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-6">
                    <SectionTitle icon={Coins} title={te('sections.financial')} color="text-amber-500" />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField label={te('form.budgetAnnuel')}>
                        <input type="number" value={formData.budgetAnnuel} onChange={e => setFormData({...formData, budgetAnnuel: e.target.value})} className="input-premium" placeholder="DH" />
                      </FormField>
                      <FormField label={te('form.sourcesFinancement')}>
                        <input value={formData.sourcesFinancement} onChange={e => setFormData({...formData, sourcesFinancement: e.target.value})} className="input-premium" />
                      </FormField>
                    </div>
                    <FormField label={te('form.partenaires')}>
                       <textarea value={formData.partenaires} onChange={e => setFormData({...formData, partenaires: e.target.value})} className="input-premium h-24" />
                    </FormField>
                  </div>
                  <div className="space-y-6">
                    <SectionTitle icon={FileText} title={te('sections.observations')} color="text-purple-500" />
                    <FormField label={te('form.remarques')}>
                       <textarea value={formData.remarques} onChange={e => setFormData({...formData, remarques: e.target.value})} className="input-premium h-20" />
                    </FormField>
                    <FormField label={te('form.besoinsUrgents')}>
                       <textarea value={formData.besoinsUrgents} onChange={e => setFormData({...formData, besoinsUrgents: e.target.value})} className="input-premium h-20" />
                    </FormField>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <SectionTitle icon={Plus} title={t('complementary_fields')} color="text-gray-400" />
                    <button type="button" onClick={addField} className="btn-add">
                      <Plus size={16} /> {t('add_field')}
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {complementaryFields.map((field, idx) => (
                      <div key={idx} className="flex gap-2 group items-start animate-in zoom-in-95">
                        <div className="flex-1 grid grid-cols-2 gap-2 bg-gray-50 dark:bg-gray-800 p-2 rounded-xl border border-gray-100 dark:border-gray-700">
                          <input placeholder={t('field_name')} value={field.key} onChange={e => updateField(idx, 'key', e.target.value)} className="bg-transparent border-none focus:ring-0 text-sm" />
                          <input placeholder={t('field_value')} value={field.value} onChange={e => updateField(idx, 'value', e.target.value)} className="bg-transparent border-none focus:ring-0 text-sm" />
                        </div>
                        <button type="button" onClick={() => removeField(idx)} className="p-2 text-gray-400 hover:text-red-500">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-100 dark:border-gray-800">
                   <SectionTitle icon={Info} title={t('justification')} color="text-emerald-500" />
                   <textarea
                     required
                     rows={4}
                     value={formData.justification}
                     onChange={e => setFormData({ ...formData, justification: e.target.value })}
                     className="w-full mt-4 p-6 rounded-3xl border-2 border-emerald-100 dark:border-emerald-900/40 bg-emerald-50/20 dark:bg-emerald-900/10 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all text-lg"
                     placeholder={t('justification_placeholder')}
                   />
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation Buttons Container */}
        <div className="mt-16 flex items-center justify-between pt-8 border-t border-gray-50 dark:border-gray-800">
          <button
            type="button"
            onClick={currentStep === 0 ? () => router.back() : prevStep}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
          >
            <ChevronLeft size={20} />
            {currentStep === 0 ? te('actions.cancel') : te('actions.previous')}
          </button>

          <div className="flex items-center gap-4">
            {currentStep < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={nextStep}
                className="flex items-center gap-2 px-10 py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-2xl font-black shadow-xl hover:scale-105 active:scale-95 transition-all"
              >
                {te('actions.next')}
                <ChevronRight size={20} />
              </button>
            ) : (
              <button
                type="button"
                disabled={loading}
                onClick={() => handleSubmit()}
                className="flex items-center gap-3 px-12 py-4 bg-gradient-to-br from-emerald-600 to-teal-700 text-white font-black text-lg rounded-2xl shadow-xl shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin" /> : <Save size={24} />}
                {t('soumettre', { defaultValue: 'Soumettre la demande' })}
              </button>
            )}
          </div>
        </div>
      </div>

      <style jsx global>{`
        .input-premium {
          width: 100%;
          padding: 0.875rem 1.25rem;
          border-radius: 1.25rem;
          border: 1px solid #e5e7eb;
          background-color: #f9fafb;
          font-weight: 500;
          transition: all 0.2s;
        }
        .dark .input-premium {
          border-color: #374151;
          background-color: #111827;
          color: white;
        }
        .input-premium:focus {
          outline: none;
          border-color: #10b981;
          background-color: white;
          box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.1);
        }
        .dark .input-premium:focus {
          background-color: #1f2937;
        }
        .btn-add {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1.25rem;
          background-color: #111827;
          color: white;
          border-radius: 1rem;
          font-size: 0.875rem;
          font-weight: 700;
          transition: all 0.2s;
        }
        .dark .btn-add {
          background-color: white;
          color: #111827;
        }
        .btn-add:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
        }
      `}</style>
    </div>
  );
}

function SectionTitle({ icon: Icon, title, color }: { icon: any, title: string, color: string }) {
  return (
    <h2 className={`text-xl font-black flex items-center gap-3 ${color}`}>
      <div className={`p-2 rounded-xl bg-current bg-opacity-10`}>
        <Icon size={20} />
      </div>
      {title}
    </h2>
  );
}

function FormField({ label, children, required }: { label: string, children: any, required?: boolean }) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1">
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

function CheckItem({ label, checked, onChange }: { label: string, checked: boolean, onChange: (v: boolean) => void }) {
  return (
    <label className={`flex items-center gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
      checked 
        ? 'border-emerald-500 bg-emerald-50/30 dark:bg-emerald-900/10 text-emerald-700 dark:text-emerald-300' 
        : 'border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-500'
    }`}>
      <div className={`w-5 h-5 rounded flex items-center justify-center border-2 transition-all ${
        checked ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-300 dark:border-gray-700'
      }`}>
        {checked && <CheckCircle2 size={12} />}
      </div>
      <input type="checkbox" className="hidden" checked={checked} onChange={e => onChange(e.target.checked)} />
      <span className="text-xs font-bold leading-tight">{label}</span>
    </label>
  );
}
