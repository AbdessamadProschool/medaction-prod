'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  ChevronLeft, 
  Save, 
  Loader2,
  Trash2,
  Plus,
  Image as ImageIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';

export default function NouveauEtablissementPage() {
  const t = useTranslations('admin.establishments');
  const tSectors = useTranslations('admin.news.sectors'); 
  
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    // Identification
    nom: '',
    nomArabe: '',
    code: '',
    secteur: 'EDUCATION',
    typeEtablissement: '',
    nature: 'PUBLIC',
    tutelle: '',
    statutJuridique: '',
    gestionnaire: '',
    responsableNom: '',
    anneeCreation: '',
    anneeOuverture: '',
    
    // Localisation
    communeId: '',
    annexeId: '',
    quartierDouar: '',
    adresseComplete: '',
    latitude: '',
    longitude: '',
    altitude: '',
    
    // Contact
    telephone: '',
    email: '',
    siteWeb: '',
    
    // Infrastructure
    etatInfrastructure: 'BON',
    statutFonctionnel: 'FONCTIONNEL',
    surfaceTotale: '',
    disponibiliteEau: true,
    disponibiliteElectricite: true,
    connexionInternet: true,
    nombreSalles: '',
    
    // RH & Capacité
    effectifTotal: '',
    nombrePersonnel: '',
    cadre: '',
    capaciteAccueil: '',
    
    // Secteur Éducation
    cycle: '',
    nbClasses: '',
    nbEnseignants: '',
    nbCadres: '',
    elevesPrescolaire: '',
    elevesTotal: '',
    nouveauxInscrits: '',
    tauxReussite: '',

    // Financement
    sourcesFinancement: '',
    budgetAnnuel: '',
    partenaires: '',

    isPublie: false,
    isValide: true
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const parseNum = (val: any, isFloat = false) => {
      if (val === '' || val === null || val === undefined) return null;
      return isFloat ? parseFloat(String(val)) : parseInt(String(val));
    };

    try {
      const res = await fetch('/api/etablissements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
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
          elevesTotal: parseNum(formData.elevesTotal),
          nouveauxInscrits: parseNum(formData.nouveauxInscrits),
          tauxReussite: parseNum(formData.tauxReussite, true),
          // Financement
          budgetAnnuel: parseNum(formData.budgetAnnuel, true),
        }),
      });

      const data = await res.json();
      
      if (res.ok && data.success) {
        toast.success(t('actions.success') || 'Établissement créé avec succès');
        router.push('/admin/etablissements');
      } else {
        toast.error(data.error || 'Erreur lors de la création');
      }
    } catch (err) {
      toast.error('Erreur serveur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-12 px-4 space-y-10 animate-in fade-in duration-700">
      <Link 
        href="/admin/etablissements" 
        className="flex items-center gap-2 text-gray-500 hover:text-emerald-600 transition-all mb-6 group w-fit"
      >
        <div className="p-2 rounded-full group-hover:bg-emerald-50 transition-colors">
          <ChevronLeft size={20} />
        </div>
        <span className="font-bold">{t('back_list')}</span>
      </Link>

      <div className="bg-white dark:bg-gray-800 rounded-[3rem] shadow-2xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 p-12 text-white relative">
          <div className="absolute top-0 right-0 p-12 opacity-10">
            <Building2 size={120} />
          </div>
          <div className="relative z-10 flex items-center gap-6">
            <div className="w-16 h-16 bg-white/20 rounded-[2rem] flex items-center justify-center backdrop-blur-xl border border-white/30 shadow-2xl">
              <Plus size={32} />
            </div>
            <div>
              <h1 className="text-4xl font-black tracking-tight">{t('create_title')}</h1>
              <p className="text-emerald-50/80 text-lg mt-2 font-medium">{t('create_subtitle')}</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-12 space-y-12">
          {/* SECTION 1: IDENTIFICATION & SECTEUR */}
          <section className="space-y-6">
            <h2 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3">
               <div className="w-2 h-8 bg-emerald-500 rounded-full" />
               {t('sections.general')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-gray-50/50 dark:bg-gray-900/50 p-8 rounded-[2rem] border border-gray-100 dark:border-gray-800">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">{t('form.name')} *</label>
                <input
                  required
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  className="w-full px-5 py-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all text-lg font-medium shadow-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">{t('form.nameArabe')}</label>
                <input
                  dir="rtl"
                  value={formData.nomArabe}
                  onChange={(e) => setFormData({ ...formData, nomArabe: e.target.value })}
                  className="w-full px-5 py-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all text-2xl font-arabic shadow-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 uppercase tracking-wider">{t('form.code')} *</label>
                  <input
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-5 py-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-4 focus:ring-emerald-500/10 transition-all font-mono shadow-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 uppercase tracking-wider">{t('form.sector')} *</label>
                  <select
                    value={formData.secteur}
                    onChange={(e) => setFormData({ ...formData, secteur: e.target.value })}
                    className="w-full px-5 py-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-4 focus:ring-emerald-500/10 transition-all font-bold shadow-sm"
                  >
                    <option value="EDUCATION">{tSectors('EDUCATION')}</option>
                    <option value="SANTE">{tSectors('SANTE')}</option>
                    <option value="SPORT">{tSectors('SPORT')}</option>
                    <option value="SOCIAL">{tSectors('SOCIAL')}</option>
                    <option value="CULTUREL">{tSectors('CULTUREL')}</option>
                    <option value="AUTRE">{tSectors('AUTRE')}</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 uppercase tracking-wider">{t('form.nature')}</label>
                  <select
                    value={formData.nature}
                    onChange={(e) => setFormData({ ...formData, nature: e.target.value })}
                    className="w-full px-5 py-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-4 focus:ring-emerald-500/10 shadow-sm"
                  >
                    <option value="PUBLIC">Public</option>
                    <option value="PRIVE">Privé</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 uppercase tracking-wider">{t('form.typeEtab')}</label>
                  <input
                    value={formData.typeEtablissement}
                    onChange={(e) => setFormData({ ...formData, typeEtablissement: e.target.value })}
                    placeholder="Ex: Dispensaire, École..."
                    className="w-full px-5 py-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-4 focus:ring-emerald-500/10 shadow-sm"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 2: GÉOLOCALISATION */}
          <section className="space-y-6">
            <h2 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3">
               <div className="w-2 h-8 bg-blue-500 rounded-full" />
               {t('sections.localization')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-gray-50/50 dark:bg-gray-900/50 p-8 rounded-[2rem] border border-gray-100 dark:border-gray-800">
               <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">{t('form.commune')} *</label>
                <select
                  required
                  value={formData.communeId}
                  onChange={(e) => setFormData({ ...formData, communeId: e.target.value })}
                  className="w-full px-5 py-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-4 focus:ring-blue-500/10 shadow-sm"
                >
                  <option value="">{t('form.select_commune')}</option>
                  <option value="1">Médiouna</option>
                  <option value="2">Tit Mellil</option>
                  <option value="3">Lahraouyine</option>
                  <option value="4">Sidi Hajjaj Oued Hassar</option>
                  <option value="5">Mejatia Oulad Taleb</option>
                  <option value="6">Al Majat</option>
                </select>
               </div>
               <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">{t('form.quartier')}</label>
                <input
                  value={formData.quartierDouar}
                  onChange={(e) => setFormData({ ...formData, quartierDouar: e.target.value })}
                  className="w-full px-5 py-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-4 focus:ring-blue-500/10 shadow-sm"
                />
               </div>
               <div className="col-span-full space-y-2">
                <label className="text-sm font-bold text-gray-700">{t('form.adresse_complete')}</label>
                <input
                  value={formData.adresseComplete}
                  onChange={(e) => setFormData({ ...formData, adresseComplete: e.target.value })}
                  className="w-full px-5 py-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-4 focus:ring-blue-500/10 shadow-sm"
                />
               </div>
               <div className="grid grid-cols-3 gap-4 col-span-full">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">{t('form.latitude')} *</label>
                    <input
                      type="number" step="any" required
                      value={formData.latitude}
                      onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-4 focus:ring-blue-500/10 font-mono shadow-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">{t('form.longitude')} *</label>
                    <input
                      type="number" step="any" required
                      value={formData.longitude}
                      onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-4 focus:ring-blue-500/10 font-mono shadow-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">{t('form.altitude')}</label>
                    <input
                      type="number" step="any"
                      value={formData.altitude}
                      onChange={(e) => setFormData({ ...formData, altitude: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-4 focus:ring-blue-500/10 font-mono shadow-sm"
                    />
                  </div>
               </div>
            </div>
          </section>

          {/* SECTION 3: CONTACT & WEB */}
          <section className="space-y-6">
            <h2 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3">
               <div className="w-2 h-8 bg-purple-500 rounded-full" />
               {t('sections.contact')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 bg-gray-50/50 dark:bg-gray-900/50 p-8 rounded-[2rem] border border-gray-100 dark:border-gray-800">
               <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">{t('form.telephone')}</label>
                <div className="relative">
                  <Phone className="absolute ltr:left-4 rtl:right-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="tel"
                    value={formData.telephone}
                    onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                    className="w-full ltr:pl-12 rtl:pr-12 ltr:pr-5 rtl:pl-5 py-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-4 focus:ring-purple-500/10 shadow-sm transition-all"
                    placeholder="+212 ..."
                  />
                </div>
               </div>
               <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">{t('form.email')}</label>
                <div className="relative">
                  <Mail className="absolute ltr:left-4 rtl:right-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full ltr:pl-12 rtl:pr-12 ltr:pr-5 rtl:pl-5 py-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-4 focus:ring-purple-500/10 shadow-sm transition-all"
                    placeholder="contact@etablissement.ma"
                  />
                </div>
               </div>
               <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">{t('form.siteWeb')}</label>
                <div className="relative">
                  <Globe className="absolute ltr:left-4 rtl:right-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="url"
                    value={formData.siteWeb}
                    onChange={(e) => setFormData({ ...formData, siteWeb: e.target.value })}
                    className="w-full ltr:pl-12 rtl:pr-12 ltr:pr-5 rtl:pl-5 py-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-4 focus:ring-purple-500/10 shadow-sm transition-all"
                    placeholder="https://..."
                  />
                </div>
               </div>
            </div>
          </section>

          {/* SECTION 3: SECTOR-SPECIFIC (Conditionnelle) */}
          {formData.secteur === 'EDUCATION' && (
            <section className="space-y-6 animate-in zoom-in-95 duration-500">
               <h2 className="text-2xl font-black text-orange-600 flex items-center gap-3">
                  <div className="w-2 h-8 bg-orange-500 rounded-full" />
                  {t('sections.education')}
               </h2>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 bg-orange-50/30 dark:bg-orange-950/10 p-8 rounded-[2rem] border border-orange-100 dark:border-orange-900/30 shadow-xl shadow-orange-500/5">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-orange-900 dark:text-orange-100">{t('form.cycle')}</label>
                    <select
                      value={formData.cycle}
                      onChange={(e) => setFormData({ ...formData, cycle: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-orange-200 bg-white dark:bg-gray-800 focus:ring-4 focus:ring-orange-500/20"
                    >
                      <option value="">Sélectionner...</option>
                      <option value="PRIMAIRE">Primaire</option>
                      <option value="COLLEGE">Collège</option>
                      <option value="LYCEE">Lycée</option>
                      <option value="PRE-SCOLAIRE">Préscolaire</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-orange-900">{t('form.nbClasses')}</label>
                    <input
                      type="number"
                      value={formData.nbClasses}
                      onChange={(e) => setFormData({ ...formData, nbClasses: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-orange-200 bg-white dark:bg-gray-800 shadow-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-orange-900">{t('form.nbEnseignants')}</label>
                    <input
                      type="number"
                      value={formData.nbEnseignants}
                      onChange={(e) => setFormData({ ...formData, nbEnseignants: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-orange-200 bg-white dark:bg-gray-800 shadow-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-orange-900">{t('form.tauxReussite')}</label>
                    <input
                      type="number" step="0.01"
                      value={formData.tauxReussite}
                      onChange={(e) => setFormData({ ...formData, tauxReussite: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-orange-200 bg-white dark:bg-gray-800 shadow-sm"
                    />
                  </div>
               </div>
            </section>
          )}

          {/* FOOTER ACTIONS */}
          <div className="pt-12 border-t border-gray-100 dark:border-gray-700 flex flex-wrap items-center justify-between gap-6">
            <label className="flex items-center gap-4 cursor-pointer group bg-gray-50 dark:bg-gray-900/50 px-6 py-4 rounded-2xl border border-gray-100 transition-all hover:bg-emerald-50/50">
              <input
                type="checkbox"
                checked={formData.isPublie}
                onChange={(e) => setFormData({ ...formData, isPublie: e.target.checked })}
                className="w-6 h-6 rounded-lg border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-sm font-bold text-gray-700 dark:text-gray-300 group-hover:text-emerald-700 transition-colors uppercase tracking-tight">{t('form.publish_now')}</span>
            </label>

            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-8 py-4 text-gray-600 dark:text-gray-400 font-black uppercase tracking-widest text-xs hover:bg-gray-100 dark:hover:bg-gray-700 rounded-2xl transition-all"
              >
                {t('actions.cancel')}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-12 py-4 bg-gradient-to-br from-emerald-500 to-teal-700 text-white font-black text-lg rounded-2xl shadow-2xl shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-3 disabled:opacity-50"
              >
                {loading ? <Loader2 size={24} className="animate-spin" /> : <Save size={24} />}
                {t('actions.save')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
