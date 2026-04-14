'use client';

import { useState } from 'react';
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
  ArrowRight
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { soumettreDemandeEtablissement } from '@/app/actions/etablissementWorkflow';

interface DemandeFormProps {
  initialData?: any;
  type: 'CREATION' | 'MODIFICATION';
  etablissementId?: number;
}

export default function DemandeForm({ initialData, type, etablissementId }: DemandeFormProps) {
  const t = useTranslations('establishments_workflow');
  const te = useTranslations('admin.establishments');
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    // Identification
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
    
    // Localisation
    communeId: initialData?.communeId || '',
    annexeId: initialData?.annexeId || '',
    quartierDouar: initialData?.quartierDouar || '',
    adresseComplete: initialData?.adresseComplete || initialData?.adresse || '',
    latitude: initialData?.latitude || '',
    longitude: initialData?.longitude || '',
    altitude: initialData?.altitude || '',
    
    // Contact
    telephone: initialData?.telephone || '',
    email: initialData?.email || '',
    siteWeb: initialData?.siteWeb || '',
    
    // Infrastructure
    etatInfrastructure: initialData?.etatInfrastructure || 'BON',
    statutFonctionnel: initialData?.statutFonctionnel || 'FONCTIONNEL',
    surfaceTotale: initialData?.surfaceTotale || '',
    disponibiliteEau: initialData?.disponibiliteEau ?? true,
    disponibiliteElectricite: initialData?.disponibiliteElectricite ?? true,
    connexionInternet: initialData?.connexionInternet ?? true,
    nombreSalles: initialData?.nombreSalles || '',
    
    // RH & Capacité
    effectifTotal: initialData?.effectifTotal || '',
    nombrePersonnel: initialData?.nombrePersonnel || '',
    cadre: initialData?.cadre || '',
    capaciteAccueil: initialData?.capaciteAccueil || '',
    
    // Secteur Éducation
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

    // Financement
    sourcesFinancement: initialData?.sourcesFinancement || '',
    budgetAnnuel: initialData?.budgetAnnuel || '',
    partenaires: initialData?.partenaires || '',

    // Observations & Besoins
    remarques: initialData?.remarques || '',
    besoinsUrgents: initialData?.besoinsUrgents || '',
    projetsFuturs: initialData?.projetsFuturs || '',
    
    // Localisation Extra
    distanceChefLieu: initialData?.distanceChefLieu || '',
    transportPublic: initialData?.transportPublic || '',
    voieAcces: initialData?.voieAcces || '',
    
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

  const addField = () => {
    setComplementaryFields([...complementaryFields, { key: '', value: '' }]);
  };

  const removeField = (index: number) => {
    setComplementaryFields(complementaryFields.filter((_, i) => i !== index));
  };

  const updateField = (index: number, keyOrValue: 'key' | 'value', text: string) => {
    const updated = [...complementaryFields];
    updated[index][keyOrValue] = text;
    setComplementaryFields(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const extraFields: Record<string, string> = {};
    complementaryFields.forEach(f => {
      if (f.key.trim()) extraFields[f.key.trim()] = f.value;
    });

    // Helper pour parser proprement les nombres
    const parseNum = (val: any, isFloat = false) => {
      if (val === '' || val === null || val === undefined) return null;
      return isFloat ? parseFloat(String(val)) : parseInt(String(val));
    };

    // On retire justification de donneesModifiees pour éviter les erreurs Prisma (car c'est un champ séparé)
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
        // Éducation
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
        // Localisation Extra
        distanceChefLieu: parseNum(formData.distanceChefLieu, true),
        // Financement
        budgetAnnuel: parseNum(formData.budgetAnnuel, true),
      },
      champsComplementaires: extraFields,
      justification: formData.justification
    });

    if (res.success) {
      toast.success(t('submit_success'));
      router.back();
    } else {
      toast.error(res.error || 'Erreur');
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-10 max-w-5xl mx-auto pb-20">
      {/* Header Info */}
      <div className="bg-emerald-50 dark:bg-emerald-950/20 p-8 rounded-3xl border border-emerald-100 dark:border-emerald-900/50 flex gap-6 shadow-sm">
        <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-emerald-200 dark:shadow-none">
          <Info size={26} />
        </div>
        <div>
          <h3 className="text-xl font-bold text-emerald-900 dark:text-emerald-100">
            {type === 'CREATION' ? t('request_creation') : t('request_edit')}
          </h3>
          <p className="text-emerald-700 dark:text-emerald-300 opacity-90 mt-1">
            {t('subtitle')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-10">
        {/* SECTION 1: IDENTIFICATION & LOCALISATION (Essentiel) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <section className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2 px-2">
              <Building2 className="text-emerald-500" size={24} />
              {te('sections.general')}
            </h2>
            <div className="space-y-5 bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-gray-700">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">{te('form.name')}</label>
                <input
                  required
                  value={formData.nom}
                  onChange={e => setFormData({ ...formData, nom: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">{te('form.nameArabe')}</label>
                <input
                  value={formData.nomArabe}
                  onChange={e => setFormData({ ...formData, nomArabe: e.target.value })}
                  dir="rtl"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-emerald-500 transition-all font-arabic text-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">{te('form.code')}</label>
                  <input
                    required
                    value={formData.code}
                    onChange={e => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-emerald-500 transition-all font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">{te('form.sector')}</label>
                  <select
                    value={formData.secteur}
                    onChange={e => setFormData({ ...formData, secteur: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
                  >
                    <option value="EDUCATION">Éducation</option>
                    <option value="SANTE">Santé</option>
                    <option value="SPORT">Sport</option>
                    <option value="SOCIAL">Social</option>
                    <option value="CULTUREL">Culturel</option>
                    <option value="AUTRE">Autre</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">{te('form.nature')}</label>
                  <select
                    value={formData.nature}
                    onChange={e => setFormData({ ...formData, nature: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-emerald-500 transition-all"
                  >
                    <option value="PUBLIC">Public</option>
                    <option value="PRIVE">Privé</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">{te('form.typeEtab')}</label>
                  <input
                    placeholder="Ex: École Primaire, Dispensaire..."
                    value={formData.typeEtablissement}
                    onChange={e => setFormData({ ...formData, typeEtablissement: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-emerald-500 transition-all"
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2 px-2">
              <MapPin className="text-emerald-500" size={24} />
              {te('sections.localization')}
            </h2>
            <div className="space-y-5 bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-gray-700">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700">{te('form.commune')}</label>
                  <select
                    required
                    value={formData.communeId}
                    onChange={e => setFormData({ ...formData, communeId: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-emerald-500 transition-all"
                  >
                    <option value="">{te('form.select_commune')}</option>
                    <option value="1">Médiouna</option>
                    <option value="2">Tit Mellil</option>
                    <option value="3">Lahraouyine</option>
                    <option value="4">Sidi Hajjaj Oued Hassar</option>
                    <option value="5">Mejatia Oulad Taleb</option>
                    <option value="6">Al Majat</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700">{te('form.quartier')}</label>
                  <input
                    value={formData.quartierDouar}
                    onChange={e => setFormData({ ...formData, quartierDouar: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-emerald-500 transition-all"
                  />
                </div>
              </div>
              <input
                placeholder={te('form.adresse_complete')}
                value={formData.adresseComplete}
                onChange={e => setFormData({ ...formData, adresseComplete: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-emerald-500 transition-all"
              />
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">{te('form.latitude')}</label>
                  <input
                    type="number" step="any" required
                    value={formData.latitude}
                    onChange={e => setFormData({ ...formData, latitude: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-emerald-500 transition-all text-sm font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">{te('form.longitude')}</label>
                  <input
                    type="number" step="any" required
                    value={formData.longitude}
                    onChange={e => setFormData({ ...formData, longitude: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-emerald-500 transition-all text-sm font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">{te('form.altitude')}</label>
                  <input
                    type="number" step="any"
                    value={formData.altitude}
                    onChange={e => setFormData({ ...formData, altitude: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-emerald-500 transition-all text-sm font-mono"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="space-y-1.5">
                    <label className="text-sm font-semibold">{te('form.voie_acces') || 'Voie d\'accès'}</label>
                    <input
                      value={formData.voieAcces}
                      onChange={e => setFormData({ ...formData, voieAcces: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-emerald-500"
                    />
                 </div>
                 <div className="space-y-1.5">
                    <label className="text-sm font-semibold">{te('form.transport_public') || 'Transport Public'}</label>
                    <input
                      value={formData.transportPublic}
                      onChange={e => setFormData({ ...formData, transportPublic: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-emerald-500"
                    />
                 </div>
              </div>
              <div className="space-y-1.5">
                  <label className="text-sm font-semibold">{te('form.distance_chef_lieu') || 'Distance au Chef-lieu (km)'}</label>
                  <input
                    type="number" step="any"
                    value={formData.distanceChefLieu}
                    onChange={e => setFormData({ ...formData, distanceChefLieu: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-emerald-500"
                  />
               </div>
            </div>
          </section>
        </div>

        {/* SECTION 2: ADMINISTRATIF & CONTACT */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold px-2 flex items-center gap-2">
            <Info className="text-blue-500" size={24} />
            Administratif & Contact
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 bg-white dark:bg-gray-800 p-8 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-xl shadow-gray-200/40">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold">{te('form.tutelle')}</label>
              <input
                value={formData.tutelle}
                onChange={e => setFormData({ ...formData, tutelle: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold">{te('form.manager')}</label>
              <input
                value={formData.responsableNom}
                onChange={e => setFormData({ ...formData, responsableNom: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold">{te('form.statut_fonctionnel') || 'Statut Opérationnel'}</label>
              <select
                value={formData.statutFonctionnel}
                onChange={e => setFormData({ ...formData, statutFonctionnel: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500"
              >
                <option value="FONCTIONNEL">Fonctionnel</option>
                <option value="PARTIEL">Fonctionnement Partiel</option>
                <option value="RENOVATION">En Rénovation</option>
                <option value="FERME">Fermé / Inactif</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold flex items-center gap-2"><Phone size={14} className="text-gray-400" /> {te('form.phone')}</label>
              <input
                type="tel"
                value={formData.telephone}
                onChange={e => setFormData({ ...formData, telephone: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold flex items-center gap-2"><Mail size={14} className="text-gray-400" /> {te('form.email')}</label>
              <input
                type="email"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold flex items-center gap-2"><Globe size={14} className="text-gray-400" /> {te('form.website')}</label>
              <input
                value={formData.siteWeb}
                onChange={e => setFormData({ ...formData, siteWeb: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </section>

        {/* SECTION 3: INFRASTRUCTURE & ÉQUIPEMENTS */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold px-2 flex items-center gap-2">
            <Layers className="text-indigo-500" size={24} />
            {te('sections.infra') || 'Infrastructure & Équipements'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 bg-white dark:bg-gray-800 p-8 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-xl">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold">{te('form.infra_status')}</label>
              <select
                value={formData.etatInfrastructure}
                onChange={e => setFormData({ ...formData, etatInfrastructure: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-indigo-500"
              >
                <option value="EXCELLENT">Excellent</option>
                <option value="BON">Bon</option>
                <option value="MOYEN">Moyen</option>
                <option value="DEGRADE">Dégradé</option>
                <option value="A_RENOVER">À rénover</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold">{te('form.surfaceTotale')}</label>
              <input
                type="number"
                value={formData.surfaceTotale}
                onChange={e => setFormData({ ...formData, surfaceTotale: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold">{te('form.nombreSalles')}</label>
              <input
                type="number"
                value={formData.nombreSalles}
                onChange={e => setFormData({ ...formData, nombreSalles: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="space-y-1.5 flex flex-col justify-center gap-3">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={formData.disponibiliteEau}
                  onChange={e => setFormData({ ...formData, disponibiliteEau: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm font-medium group-hover:text-indigo-600 transition-colors">{te('form.disponibiliteEau')}</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={formData.disponibiliteElectricite}
                  onChange={e => setFormData({ ...formData, disponibiliteElectricite: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm font-medium group-hover:text-indigo-600 transition-colors">{te('form.disponibiliteElectricite')}</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={formData.connexionInternet}
                  onChange={e => setFormData({ ...formData, connexionInternet: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm font-medium group-hover:text-indigo-600 transition-colors">{te('form.connexionInternet') || 'Internet'}</span>
              </label>
            </div>
          </div>
        </section>

        {/* SECTION 4: SECTOR-SPECIFIC (Conditionnelle) */}
        {formData.secteur === 'EDUCATION' && (
          <section className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-500">
            <h2 className="text-xl font-bold px-2 flex items-center gap-2 text-orange-600">
              <Layers size={24} />
              {te('sections.education') || 'Données Pédagogiques (Éducation)'}
            </h2>
            <div className="bg-orange-50/30 dark:bg-orange-950/10 p-8 rounded-3xl border border-orange-100 dark:border-orange-900/40 shadow-xl">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold">{te('form.cycle')}</label>
                  <select
                    value={formData.cycle}
                    onChange={e => setFormData({ ...formData, cycle: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-orange-200 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">Sélectionner...</option>
                    <option value="PRIMAIRE">Primaire</option>
                    <option value="COLLEGE">Collège</option>
                    <option value="LYCEE">Lycée</option>
                    <option value="PRE-SCOLAIRE">Préscolaire</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold">{te('form.nbClasses')}</label>
                  <input
                    type="number"
                    value={formData.nbClasses}
                    onChange={e => setFormData({ ...formData, nbClasses: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-orange-200 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold">{te('form.nbEnseignants')}</label>
                  <input
                    type="number"
                    value={formData.nbEnseignants}
                    onChange={e => setFormData({ ...formData, nbEnseignants: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-orange-200 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold">{te('form.nbCadres')}</label>
                  <input
                    type="number"
                    value={formData.nbCadres}
                    onChange={e => setFormData({ ...formData, nbCadres: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-orange-200 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold">{te('form.elevesTotal')}</label>
                  <input
                    type="number"
                    value={formData.elevesTotal}
                    onChange={e => setFormData({ ...formData, elevesTotal: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-orange-200 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold">{te('form.elevesFilles') || 'Total Filles'}</label>
                  <input
                    type="number"
                    value={formData.elevesFilles}
                    onChange={e => setFormData({ ...formData, elevesFilles: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-orange-200 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold">{te('form.elevesPrescolaire')}</label>
                  <input
                    type="number"
                    value={formData.elevesPrescolaire}
                    onChange={e => setFormData({ ...formData, elevesPrescolaire: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-orange-200 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold">{te('form.elevesPrescolaireFilles') || 'Filles Préscolaire'}</label>
                  <input
                    type="number"
                    value={formData.elevesPrescolaireFilles}
                    onChange={e => setFormData({ ...formData, elevesPrescolaireFilles: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-orange-200 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold">{te('form.nouveauxInscrits')}</label>
                  <input
                    type="number"
                    value={formData.nouveauxInscrits}
                    onChange={e => setFormData({ ...formData, nouveauxInscrits: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-orange-200 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold">{te('form.nouveauxInscritsFilles') || 'Filles Nvx Inscrits'}</label>
                  <input
                    type="number"
                    value={formData.nouveauxInscritsFilles}
                    onChange={e => setFormData({ ...formData, nouveauxInscritsFilles: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-orange-200 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold">{te('form.tauxReussite')}</label>
                    <input
                      type="number" step="0.01"
                      value={formData.tauxReussite}
                      onChange={e => setFormData({ ...formData, tauxReussite: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-orange-200 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold">{te('form.fillesDerniereAnnee') || 'Filles Dern. Année'}</label>
                    <input
                      type="number"
                      value={formData.fillesDerniereAnnee}
                      onChange={e => setFormData({ ...formData, fillesDerniereAnnee: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-orange-200 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* SECTION 5: RH & CAPACITÉ (Shared) */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold px-2 flex items-center gap-2">
            <Info className="text-teal-500" size={24} />
            {te('sections.staff') || 'Ressources Humaines & Capacité'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 bg-white dark:bg-gray-800 p-8 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-xl">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold">{te('form.capaciteAccueil')}</label>
              <input
                type="number"
                value={formData.capaciteAccueil}
                onChange={e => setFormData({ ...formData, capaciteAccueil: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold">{te('form.effectifTotal')}</label>
              <input
                type="number"
                value={formData.effectifTotal}
                onChange={e => setFormData({ ...formData, effectifTotal: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold">{te('form.nombrePersonnel')}</label>
              <input
                type="number"
                value={formData.nombrePersonnel}
                onChange={e => setFormData({ ...formData, nombrePersonnel: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold">{te('form.cadre')}</label>
              <input
                value={formData.cadre}
                onChange={e => setFormData({ ...formData, cadre: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-teal-500"
                placeholder="Ex: Médical, Enseignant..."
              />
            </div>
          </div>
        </section>

        {/* SECTION 6: FINANCEMENT & OBSERVATIONS */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold px-2 flex items-center gap-2">
            <Save className="text-amber-500" size={24} />
            {te('sections.financial') || 'Financement & Observations'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white dark:bg-gray-800 p-8 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-xl">
             <div className="space-y-1.5">
                <label className="text-sm font-semibold">{te('form.budgetAnnuel')}</label>
                <input
                  type="number"
                  value={formData.budgetAnnuel}
                  onChange={e => setFormData({ ...formData, budgetAnnuel: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-amber-500"
                  placeholder="DH / an"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold">{te('form.sourcesFinancement')}</label>
                <input
                  value={formData.sourcesFinancement}
                  onChange={e => setFormData({ ...formData, sourcesFinancement: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-amber-500"
                  placeholder="Ex: État, Partenaires..."
                />
              </div>
              <div className="col-span-full space-y-1.5">
                <label className="text-sm font-semibold">{te('form.partenaires')}</label>
                <textarea
                  rows={2}
                  value={formData.partenaires}
                  onChange={e => setFormData({ ...formData, partenaires: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-amber-500 resize-none"
                />
              </div>
              <div className="space-y-1.5">
                 <label className="text-sm font-semibold">{te('form.remarques') || 'Remarques'}</label>
                 <textarea
                   rows={2}
                   value={formData.remarques}
                   onChange={e => setFormData({ ...formData, remarques: e.target.value })}
                   className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-amber-500 resize-none"
                 />
              </div>
              <div className="space-y-1.5">
                 <label className="text-sm font-semibold">{te('form.besoinsUrgents') || 'Besoins Urgents'}</label>
                 <textarea
                   rows={2}
                   value={formData.besoinsUrgents}
                   onChange={e => setFormData({ ...formData, besoinsUrgents: e.target.value })}
                   className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-amber-500 resize-none"
                 />
              </div>
              <div className="col-span-full space-y-1.5">
                 <label className="text-sm font-semibold">{te('form.projetsFuturs') || 'Projets Futurs'}</label>
                 <textarea
                   rows={2}
                   value={formData.projetsFuturs}
                   onChange={e => setFormData({ ...formData, projetsFuturs: e.target.value })}
                   className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-amber-500 resize-none"
                 />
              </div>
          </div>
        </section>

        {/* SECTION 7: CHAMPS COMPLÉMENTAIRES (JSON FLEXIBLE) */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Plus className="text-gray-400" size={24} />
              {t('complementary_fields')}
            </h2>
            <button
              type="button"
              onClick={addField}
              className="px-4 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-xl text-sm font-bold flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-lg"
            >
              <Plus size={16} /> {t('add_field')}
            </button>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-900/50 p-8 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-800 space-y-4 min-h-[150px]">
            <p className="text-sm text-gray-500 mb-4 px-2 italic">
              {t('complementary_fields_desc')}
            </p>
            
            {complementaryFields.length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                <Layers size={40} strokeWidth={1} className="opacity-20" />
                <p className="text-sm mt-3 font-medium">Aucun champ personnalisé</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {complementaryFields.map((field, idx) => (
                <div key={idx} className="flex gap-2 group items-start animate-in zoom-in-95 duration-200">
                  <div className="flex-1 grid grid-cols-2 gap-2 bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-100 shadow-sm">
                    <input
                      placeholder={t('field_name')}
                      value={field.key}
                      onChange={e => updateField(idx, 'key', e.target.value)}
                      className="px-3 py-2 text-sm rounded-lg border-none bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-emerald-500"
                    />
                    <input
                      placeholder={t('field_value')}
                      value={field.value}
                      onChange={e => updateField(idx, 'value', e.target.value)}
                      className="px-3 py-2 text-sm rounded-lg border-none bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeField(idx)}
                    className="p-3 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 8: JUSTIFICATION (REQUIS) */}
        <section className="space-y-4 pt-4">
          <h2 className="text-xl font-bold flex items-center gap-2 px-2 text-amber-600">
            <ArrowRight size={24} />
            {t('justification')}
          </h2>
          <textarea
            required
            rows={5}
            value={formData.justification}
            onChange={e => setFormData({ ...formData, justification: e.target.value })}
            className="w-full px-6 py-5 rounded-3xl border-2 border-amber-200 dark:border-amber-900/40 bg-white dark:bg-gray-800 focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 shadow-xl shadow-amber-500/5 transition-all text-lg"
            placeholder={t('justification_placeholder')}
          />
        </section>
      </div>

      <div className="sticky bottom-8 z-20 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl p-6 rounded-3xl border border-gray-100 dark:border-gray-800 flex justify-end gap-6 shadow-2xl shadow-emerald-500/10">
        <button
          type="button"
          disabled={loading}
          onClick={() => router.back()}
          className="px-8 py-4 text-gray-600 dark:text-gray-400 font-bold hover:bg-gray-100 dark:hover:bg-gray-800 rounded-2xl transition-all"
        >
          {te('actions.cancel')}
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-12 py-4 bg-gradient-to-br from-emerald-600 to-teal-700 text-white font-black text-lg rounded-2xl shadow-2xl shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-3 disabled:opacity-50"
        >
          {loading ? <Loader2 className="animate-spin" /> : <Save size={24} />}
          {t('soumettre', { defaultValue: 'Soumettre la demande' })}
        </button>
      </div>
    </form>
  );
}
