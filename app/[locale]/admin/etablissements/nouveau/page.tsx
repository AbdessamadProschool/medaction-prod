'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  ArrowLeft, 
  Save, 
  Loader2,
  Trash2,
  Sparkles,
  Shield,
  FileText,
  Calendar,
  Users,
  Target
} from 'lucide-react';
import { toast } from 'sonner';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { GovInput, GovSelect, GovButton } from '@/components/ui';
import { cn } from '@/lib/utils';

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

    const submitPromise = new Promise(async (resolve, reject) => {
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
          resolve(true);
          router.push('/admin/etablissements');
        } else {
          reject(new Error(data.error || t('actions.error_creation')));
        }
      } catch (err) {
        reject(new Error(t('actions.server_error')));
      } finally {
        setLoading(false);
      }
    });

    toast.promise(submitPromise, {
      loading: 'Création en cours...',
      success: t('actions.success'),
      error: (err: any) => err.message,
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-24">
      {/* Header Premium */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-6"
      >
        <div className="space-y-4">
          <Link 
            href="/admin/etablissements"
            className="group inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
          >
            <div className="w-8 h-8 rounded-full border border-border flex items-center justify-center group-hover:border-foreground/20 group-hover:bg-muted/50 transition-all">
              <ArrowLeft size={14} />
            </div>
            <span>{t('back_list')}</span>
          </Link>
          
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-gradient-to-br from-[hsl(var(--gov-blue))] to-[hsl(var(--gov-blue-dark))] rounded-[2rem] flex items-center justify-center shadow-2xl shadow-[hsl(var(--gov-blue))/0.3] ring-8 ring-[hsl(var(--gov-blue))/0.1]">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-black tracking-tight text-foreground uppercase italic">
                {t('create_title')}
              </h1>
              <p className="text-muted-foreground font-bold uppercase tracking-widest text-[10px] opacity-70 mt-1">
                {t('create_subtitle')}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
           <GovButton
            onClick={handleSubmit}
            loading={loading}
            variant="primary"
            leftIcon={!loading && <Save size={18} />}
            className="rounded-full px-10 shadow-xl shadow-[hsl(var(--gov-blue))/0.2]"
          >
            {t('actions.save')}
          </GovButton>
        </div>
      </motion.div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* Left Column: Content */}
        <div className="lg:col-span-2 space-y-10">
          
          {/* SECTION 1: IDENTIFICATION */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card/50 backdrop-blur-xl rounded-[2.5rem] border border-border overflow-hidden shadow-2xl shadow-[hsl(var(--gov-blue))/0.03]"
          >
            <div className="p-10 border-b border-border/50 bg-muted/5">
              <h2 className="text-[10px] font-black text-foreground uppercase tracking-widest flex items-center gap-3">
                <div className="w-2 h-5 bg-[hsl(var(--gov-blue))] rounded-full" />
                {t('sections.general')}
              </h2>
            </div>
            
            <div className="p-10 space-y-8">
              <GovInput
                label={t('form.name') + ' *'}
                required
                value={formData.nom}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                leftIcon={<Building2 size={18} />}
                className="text-lg font-bold"
              />

              <GovInput
                label={t('form.nameArabe')}
                value={formData.nomArabe}
                onChange={(e) => setFormData({ ...formData, nomArabe: e.target.value })}
                className="text-xl font-arabic text-right"
                dir="rtl"
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <GovInput
                  label={t('form.code') + ' *'}
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  leftIcon={<Shield size={18} />}
                  className="font-mono"
                />

                <GovSelect
                  label={t('form.sector') + ' *'}
                  required
                  value={formData.secteur}
                  onChange={(e) => setFormData({ ...formData, secteur: e.target.value })}
                  options={[
                    { label: tSectors('EDUCATION'), value: 'EDUCATION' },
                    { label: tSectors('SANTE'), value: 'SANTE' },
                    { label: tSectors('SPORT'), value: 'SPORT' },
                    { label: tSectors('SOCIAL'), value: 'SOCIAL' },
                    { label: tSectors('CULTUREL'), value: 'CULTUREL' },
                    { label: tSectors('AUTRE'), value: 'AUTRE' },
                  ]}
                  leftIcon={<Target size={18} />}
                />

                <GovSelect
                  label={t('form.nature')}
                  value={formData.nature}
                  onChange={(e) => setFormData({ ...formData, nature: e.target.value })}
                  options={[
                    { label: t('options.natures.PUBLIC'), value: 'PUBLIC' },
                    { label: t('options.natures.PRIVE'), value: 'PRIVE' },
                  ]}
                />

                <GovInput
                  label={t('form.typeEtab')}
                  value={formData.typeEtablissement}
                  onChange={(e) => setFormData({ ...formData, typeEtablissement: e.target.value })}
                  placeholder={t('placeholders.typeEtab')}
                />
              </div>
            </div>
          </motion.div>

          {/* SECTION 2: GÉOLOCALISATION */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card/50 backdrop-blur-xl rounded-[2.5rem] border border-border overflow-hidden shadow-2xl shadow-[hsl(var(--gov-blue))/0.03]"
          >
            <div className="p-10 border-b border-border/50 bg-muted/5">
              <h2 className="text-[10px] font-black text-foreground uppercase tracking-widest flex items-center gap-3">
                <div className="w-2 h-5 bg-[hsl(var(--gov-red))] rounded-full" />
                {t('sections.localization')}
              </h2>
            </div>
            
            <div className="p-10 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <GovSelect
                  label={t('form.commune') + ' *'}
                  required
                  value={formData.communeId}
                  onChange={(e) => setFormData({ ...formData, communeId: e.target.value })}
                  options={[
                    { label: t('form.select_commune'), value: '' },
                    { label: t('options.communes.1'), value: '1' },
                    { label: t('options.communes.2'), value: '2' },
                    { label: t('options.communes.3'), value: '3' },
                    { label: t('options.communes.4'), value: '4' },
                    { label: t('options.communes.5'), value: '5' },
                    { label: t('options.communes.6'), value: '6' },
                  ]}
                  leftIcon={<MapPin size={18} />}
                />

                <GovInput
                  label={t('form.quartier')}
                  value={formData.quartierDouar}
                  onChange={(e) => setFormData({ ...formData, quartierDouar: e.target.value })}
                  leftIcon={<MapPin size={18} />}
                />
              </div>

              <GovInput
                label={t('form.adresse_complete')}
                value={formData.adresseComplete}
                onChange={(e) => setFormData({ ...formData, adresseComplete: e.target.value })}
                leftIcon={<MapPin size={18} />}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <GovInput
                  label={t('form.latitude') + ' *'}
                  type="number"
                  step="any"
                  required
                  value={formData.latitude}
                  onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                  className="font-mono"
                />
                <GovInput
                  label={t('form.longitude') + ' *'}
                  type="number"
                  step="any"
                  required
                  value={formData.longitude}
                  onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                  className="font-mono"
                />
                <GovInput
                  label={t('form.altitude')}
                  type="number"
                  step="any"
                  value={formData.altitude}
                  onChange={(e) => setFormData({ ...formData, altitude: e.target.value })}
                  className="font-mono"
                />
              </div>
            </div>
          </motion.div>

          {/* SECTION 3: SECTOR-SPECIFIC (Conditionnelle) */}
          <AnimatePresence>
            {formData.secteur === 'EDUCATION' && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-card/50 backdrop-blur-xl rounded-[2.5rem] border border-[hsl(var(--gov-yellow))/0.2] overflow-hidden shadow-2xl shadow-[hsl(var(--gov-yellow))/0.03] mt-10">
                  <div className="p-10 border-b border-[hsl(var(--gov-yellow))/0.1] bg-[hsl(var(--gov-yellow))/0.02]">
                    <h2 className="text-[10px] font-black text-foreground uppercase tracking-widest flex items-center gap-3">
                      <div className="w-2 h-5 bg-[hsl(var(--gov-yellow))] rounded-full" />
                      {t('sections.education')}
                    </h2>
                  </div>
                  
                  <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <GovSelect
                      label={t('form.cycle')}
                      value={formData.cycle}
                      onChange={(e) => setFormData({ ...formData, cycle: e.target.value })}
                      options={[
                        { label: t('actions.select') || 'Sélectionner...', value: '' },
                        { label: t('options.cycles.PRIMAIRE'), value: 'PRIMAIRE' },
                        { label: t('options.cycles.COLLEGE'), value: 'COLLEGE' },
                        { label: t('options.cycles.LYCEE'), value: 'LYCEE' },
                        { label: t('options.cycles.PRE-SCOLAIRE'), value: 'PRE-SCOLAIRE' },
                      ]}
                    />

                    <GovInput
                      label={t('form.nbClasses')}
                      type="number"
                      value={formData.nbClasses}
                      onChange={(e) => setFormData({ ...formData, nbClasses: e.target.value })}
                    />

                    <GovInput
                      label={t('form.nbEnseignants')}
                      type="number"
                      value={formData.nbEnseignants}
                      onChange={(e) => setFormData({ ...formData, nbEnseignants: e.target.value })}
                    />

                    <GovInput
                      label={t('form.tauxReussite')}
                      type="number"
                      step="0.01"
                      value={formData.tauxReussite}
                      onChange={(e) => setFormData({ ...formData, tauxReussite: e.target.value })}
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>

        {/* Right Column: Settings */}
        <div className="space-y-10">
          
          {/* Section Contact */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-card/50 backdrop-blur-xl rounded-[2.5rem] border border-border p-10 shadow-xl"
          >
            <h3 className="text-[10px] font-black text-foreground uppercase tracking-widest flex items-center gap-3 mb-8">
              <Phone className="w-5 h-5 text-[hsl(var(--gov-green))]" />
              {t('sections.contact')}
            </h3>
            
            <div className="space-y-6">
              <GovInput
                label={t('form.telephone')}
                type="tel"
                value={formData.telephone}
                onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                placeholder={t('placeholders.telephone') || "+212 ..."}
                leftIcon={<Phone size={18} />}
              />

              <GovInput
                label={t('form.email')}
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder={t('placeholders.email') || "contact@..."}
                leftIcon={<Mail size={18} />}
              />

              <GovInput
                label={t('form.siteWeb')}
                type="url"
                value={formData.siteWeb}
                onChange={(e) => setFormData({ ...formData, siteWeb: e.target.value })}
                placeholder={t('placeholders.website') || "https://..."}
                leftIcon={<Globe size={18} />}
              />
            </div>
          </motion.div>

          {/* Section Statut */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-card/50 backdrop-blur-xl rounded-[2.5rem] border border-border p-10 shadow-xl"
          >
            <h3 className="text-[10px] font-black text-foreground uppercase tracking-widest flex items-center gap-3 mb-8">
              <Globe className="w-5 h-5 text-[hsl(var(--gov-blue))]" />
              Visibilité
            </h3>
            
            <div className="space-y-4">
              <label 
                className={cn(
                  "relative flex flex-col p-5 rounded-[1.5rem] border-2 cursor-pointer transition-all group shadow-sm",
                  formData.isPublie
                    ? "border-[hsl(var(--gov-blue))] bg-[hsl(var(--gov-blue))/0.05] shadow-[hsl(var(--gov-blue))/0.1] shadow-lg scale-[1.02]"
                    : "border-border bg-muted/10 hover:border-border/80"
                )}
              >
                <input
                  type="checkbox"
                  checked={formData.isPublie}
                  onChange={(e) => setFormData({ ...formData, isPublie: e.target.checked })}
                  className="sr-only"
                />
                <div className="flex justify-between items-center mb-1">
                  <span className={cn(
                    "text-[10px] font-black uppercase tracking-widest transition-colors",
                    formData.isPublie ? "text-[hsl(var(--gov-blue))]" : "text-foreground"
                  )}>{t('form.publish_now')}</span>
                  {formData.isPublie && <div className="w-2 h-2 rounded-full bg-[hsl(var(--gov-blue))] shadow-[0_0_8px_hsl(var(--gov-blue))]" />}
                </div>
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest opacity-60 leading-tight">
                  Rendre l'établissement visible sur le portail public
                </span>
              </label>
            </div>
          </motion.div>

        </div>
      </form>
    </div>
  );
}
