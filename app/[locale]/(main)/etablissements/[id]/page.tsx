'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import EventCard from '@/components/evenements/EventCard';
import SubscribeButton from '@/components/etablissements/SubscribeButton';
import { useTranslations } from 'next-intl';
import { PermissionGuard } from '@/hooks/use-permission';
import { 
  GraduationCap, Hospital, Trophy, HeartHandshake, Drama, Building2, 
  ClipboardList, Calendar, Star, Newspaper, Megaphone, FileText, 
  MapPin, Phone, Mail, Globe, Activity, ChevronLeft, Share2, Info, X,
  Stethoscope, Bed, Users2, UserCheck, Syringe, BookOpen, Music, Palette, School, Baby,
  Briefcase, Layout, Box, Zap, Wifi, Droplets, CheckCircle2, User, Ruler, Signal
} from 'lucide-react';
import React from 'react';
import { OptimizedImage } from '@/components/ui/OptimizedImage';

// Map dynamique
const LocationMap = dynamic(() => import('@/components/maps/LocationMap'), {
  ssr: false,
  loading: () => <div className="w-full h-48 bg-gray-100 rounded-xl animate-pulse" />,
});

interface Etablissement {
  id: number;
  code: string;
  nom: string;
  nomArabe?: string;
  secteur: string;
  nature?: string;
  tutelle?: string;
  gestionnaire?: string;
  responsableNom?: string;
  telephone?: string;
  email?: string;
  siteWeb?: string;
  adresseComplete?: string;
  latitude: number;
  longitude: number;
  capaciteAccueil?: number;
  effectifTotal?: number;
  etatInfrastructure?: string;
  services: string[];
  programmes: string[];
  noteMoyenne: number;
  nombreEvaluations: number;
  photoPrincipale?: string;
  statutFonctionnel?: string;
  anneeCreation?: number;
  commune: { id: number; nom: string };
  annexe?: { id: number; nom: string } | null;
  medias: { id: number; urlPublique: string; type: string }[];
  evaluations: {
    id: number;
    noteGlobale: number;
    commentaire?: string;
    createdAt: string;
    user: { nom: string; prenom: string };
  }[];
  _count: {
    evaluations: number;
    reclamations: number;
    evenements: number;
  actualites: number;
  };
  donneesSpecifiques?: Record<string, any>;
  // Root Infrastructure Fields
  surfaceTotale?: number;
  nombreSalles?: number;
  nombrePersonnel?: number;
  disponibiliteEau?: boolean;
  disponibiliteElectricite?: boolean;
  connexionInternet?: boolean;
  // Root Education Fields
  elevesTotal?: number;
  elevesFilles?: number;
  tauxReussite?: number;
  nouveauxInscrits?: number;
}

interface Actualite {
  id: number;
  titre: string;
  description?: string;
  image?: string;
  datePublication: string;
  medias?: { urlPublique: string }[];
  etablissement: { nom: string; secteur: string };
  categorie?: string;
}

interface Evenement {
  id: number;
  titre: string;
  description: string;
  typeCategorique: string;
  secteur: string;
  statut: string;
  dateDebut: string;
  dateFin?: string;
  heureDebut?: string;
  lieu?: string;
  nombreVues: number;
  nombreInscrits: number;
  capaciteMax?: number;
  etablissement: { nom: string };
  commune: { nom: string };
  medias?: { urlPublique: string }[];
}

const getSecteurConfig = (t: any) => ({
  EDUCATION: { gradient: 'from-blue-600 to-indigo-700', icon: GraduationCap, label: t('education'), bg: 'bg-blue-50', text: 'text-blue-700' },
  SANTE: { gradient: 'from-red-600 to-pink-700', icon: Hospital, label: t('sante'), bg: 'bg-red-50', text: 'text-red-700' },
  SPORT: { gradient: 'from-emerald-600 to-teal-700', icon: Trophy, label: t('sport'), bg: 'bg-emerald-50', text: 'text-emerald-700' },
  SOCIAL: { gradient: 'from-purple-600 to-violet-700', icon: HeartHandshake, label: t('social'), bg: 'bg-purple-50', text: 'text-purple-700' },
  CULTUREL: { gradient: 'from-orange-600 to-amber-700', icon: Drama, label: t('culture'), bg: 'bg-orange-50', text: 'text-orange-700' },
  AUTRE: { gradient: 'from-gray-600 to-slate-700', icon: Building2, label: t('autre'), bg: 'bg-gray-50', text: 'text-gray-700' },
});

const getTabs = (t: any) => [
  { id: 'infos', label: t('tabs.infos'), icon: Info },
  { id: 'actualites', label: t('tabs.actualites'), icon: Newspaper },
  { id: 'activites', label: t('tabs.activites'), icon: Activity },
  { id: 'events', label: t('tabs.events'), icon: Calendar },
  { id: 'articles', label: t('tabs.articles'), icon: FileText },
  { id: 'campagnes', label: t('tabs.campagnes'), icon: Megaphone },
  { id: 'avis', label: t('tabs.avis'), icon: Star },
];

function StarRating({ rating, size = 'md' }: { rating: number; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClass = size === 'lg' ? 'w-6 h-6' : size === 'md' ? 'w-5 h-5' : 'w-4 h-4';
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${sizeClass} ${star <= rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`}
        />
      ))}
    </div>
  );
}

export default function EtablissementDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [etablissement, setEtablissement] = useState<Etablissement | null>(null);
  const [evenements, setEvenements] = useState<Evenement[]>([]);
  const [activites, setActivites] = useState<any[]>([]);
  const [actualites, setActualites] = useState<Actualite[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('infos');
  const t = useTranslations('etablissement_page');
  const tSectors = useTranslations('sectors');
  const secteurConfig = getSecteurConfig(tSectors);
  const tabs = getTabs(t);

  // Update URL tab param listener
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && tabs.some(t => t.id === tabParam)) {
        setActiveTab(tabParam);
    }
  }, [searchParams]);
  const [activeImage, setActiveImage] = useState(0);
  const [showGallery, setShowGallery] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetch(`/api/etablissements/${params.id}`)
        .then(res => res.json())
        .then(json => {
          setEtablissement(json.data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [params.id]);

  // Fetch content based on active tab
  useEffect(() => {
    if (!etablissement) return;

    if (activeTab === 'events') {
      fetch(`/api/evenements?etablissementId=${etablissement.id}`)
        .then(res => res.json())
        .then(json => setEvenements(json.data || []))
        .catch(console.error);
    } else if (activeTab === 'activites') {
      fetch(`/api/programmes-activites?etablissementId=${etablissement.id}`)
        .then(res => res.json())
        .then(json => setActivites(json.data || []))
        .catch(console.error);
    } else if (activeTab === 'actualites') {
      fetch(`/api/actualites?etablissementId=${etablissement.id}`)
        .then(res => res.json())
        .then(json => setActualites(json.data || []))
        .catch(console.error);
    }
  }, [activeTab, etablissement]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-[hsl(213,80%,28%)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!etablissement) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center pt-24">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
           <Building2 className="w-10 h-10 text-gray-400" />
        </div>
         <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('not_found.title')}</h1>
         <p className="text-gray-500 mb-8">{t('not_found.description')}</p>
         <Link href="/etablissements" className="px-6 py-3 bg-[hsl(213,80%,28%)] text-white rounded-xl font-medium hover:bg-[hsl(213,80%,35%)] transition-colors">
           {t('not_found.back_button')}
         </Link>
      </div>
    );
  }

  const config = secteurConfig[etablissement.secteur as keyof typeof secteurConfig] || secteurConfig.AUTRE;
  const images = etablissement.medias.filter(m => m.type === 'IMAGE');
  const allImages = etablissement.photoPrincipale 
    ? [{ id: 0, urlPublique: etablissement.photoPrincipale, type: 'IMAGE' }, ...images]
    : images;

  // Helper function for fuzzy finding values in donneesSpecifiques
  const getValue = (keys: string[]): any => {
    if (!etablissement.donneesSpecifiques) return null;
    
    // 1. Try exact matches from keys list
    for (const key of keys) {
      if (etablissement.donneesSpecifiques[key] !== undefined) return etablissement.donneesSpecifiques[key];
    }
    
    // 2. Try normalized matches (ignore case, accents, spaces, underscores)
    const normalizedDataKeys = Object.keys(etablissement.donneesSpecifiques).map(k => ({
      original: k,
      normalized: k.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "")
    }));

    for (const key of keys) {
       const normalizedSearch = key.toLowerCase().normalize("NFD").replace(/[^a-z0-9]/g, "");
       const found = normalizedDataKeys.find(k => k.normalized === normalizedSearch || k.normalized.includes(normalizedSearch));
       if (found) return etablissement.donneesSpecifiques[found.original];
    }
    
    return null;
  };

  // Pre-fetching standardized values to use in display AND filtering
  const santeData = {
    medecins: getValue(['nombre_medecins', 'medecins', 'medecin', 'effectif_medical']),
    infirmiers: getValue(['nombre_infirmiers', 'infirmiers', 'infirmier', 'paramedical']),
    lits: getValue(['nombre_lits', 'lits', 'lit', 'capacite_lits']),
    autre_pers: getValue(['autres_personnel', 'autre_personnel', 'administratif', 'support']),
    ambulances: getValue(['ambulances', 'nombre_ambulances'])
  };


  return (
    <div className="min-h-screen bg-gray-50">
      {/* ==================== IMMERSIVE HERO ==================== */}
      <div className="relative h-[500px] lg:h-[450px]">
        {allImages.length > 0 ? (
          <div className="absolute inset-0">
             <OptimizedImage
                src={allImages[0].urlPublique}
                alt={etablissement.nom}
                type="etablissement"
                fill
                className="object-cover"
                priority
             />
             <div className="absolute inset-0 bg-gradient-to-t from-[hsl(213,80%,15%)] via-[hsl(213,80%,15%)]/70 to-[hsl(213,80%,15%)]/30 backdrop-blur-[2px]" />
          </div>
        ) : (
          <div className={`absolute inset-0 bg-gradient-to-br ${config.gradient}`}>
             <div className="absolute inset-0 bg-black/20 pattern-grid-lg opacity-20" />
          </div>
        )}

        {/* Content Container */}
        <div className="absolute inset-0 pt-24 pb-8 flex flex-col justify-end">
          <div className="max-w-7xl mx-auto w-full px-4 sm:px-6">
            
            {/* Top Navigation Row (Absolute) */}
            <div className="absolute top-24 left-4 sm:left-6 lg:left-8 right-4 sm:right-6 lg:right-8 flex justify-between items-start">
              <Link 
                href="/etablissements"
                className="inline-flex items-center gap-2 px-4 py-2 bg-black/30 backdrop-blur-md text-white rounded-full hover:bg-black/40 transition-all border border-white/10 text-sm font-medium"
              >
                 <ChevronLeft className="w-4 h-4" />
                 {t('buttons.back')}
               </Link>
              <button 
                onClick={async () => {
                  const url = window.location.href;
                  if (navigator.share) {
                    try {
                      await navigator.share({ title: etablissement?.nom, url });
                    } catch (e) { /* cancelled */ }
                  } else {
                    await navigator.clipboard.writeText(url);
                    alert(t('feedback_copied'));
                  }
                }}
                className="p-2 bg-black/30 backdrop-blur-md text-white rounded-full hover:bg-black/40 border border-white/10"
              >
                <Share2 className="w-5 h-5" />
              </button>
            </div>

            {/* Main Hero Info */}
            <motion.div 
               initial={{ opacity: 0, y: 30 }}
               animate={{ opacity: 1, y: 0 }}
               className="flex flex-col lg:flex-row lg:items-end gap-8 mb-6"
            >
               {/* Avatar / Logo */}
               <div className="hidden lg:block shrink-0 w-32 h-32 rounded-2xl overflow-hidden border-4 border-white/20 shadow-2xl bg-white">
                  {etablissement.photoPrincipale ? (
                    <OptimizedImage 
                      src={etablissement.photoPrincipale} 
                      alt="Logo"
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br ${config.gradient}`}>
                       <config.icon className="w-12 h-12 text-white" />
                    </div>
                  )}
               </div>

               <div className="flex-1 text-white">
                 <div className="flex flex-wrap items-center gap-3 mb-4">
                   <span className={`inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-bold rounded-full uppercase tracking-wider`}>
                     <config.icon className="w-3.5 h-3.5" /> {t('sections.contact').split(' ')[0] === 'Coordonnées' && config.label === 'Autre' ? t('sections.about') : config.label}
                   </span>
                   {etablissement.statutFonctionnel && (
                     <span className="px-3 py-1 bg-emerald-500/20 text-emerald-100 border border-emerald-500/30 rounded-full text-xs font-bold uppercase backdrop-blur-md">
                       {etablissement.statutFonctionnel}
                     </span>
                   )}
                   <span className="font-mono text-white/60 text-xs px-2 py-0.5 border border-white/10 rounded">
                     {etablissement.code}
                   </span>
                 </div>

                 <h1 className="text-3xl md:text-5xl font-bold mb-2 leading-tight">
                   {etablissement.nom}
                 </h1>
                 {etablissement.nomArabe && (
                   <p className="text-xl md:text-2xl text-white/80 font-serif mb-4" dir="rtl">{etablissement.nomArabe}</p>
                 )}

                 <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-blue-100/90 font-medium">
                   <div className="flex items-center gap-2">
                     <MapPin className="w-4 h-4 text-[hsl(45,93%,47%)]" />
                     {etablissement.commune.nom}
                     {etablissement.adresseComplete ? ` • ${etablissement.adresseComplete.split(',')[0]}` : ''}
                   </div>
                   <div className="flex items-center gap-2">
                     <div className="flex gap-0.5">
                       {[1,2,3,4,5].map(s => <Star key={s} className={`w-3.5 h-3.5 ${s <= Math.round(etablissement.noteMoyenne) ? 'text-[hsl(45,93%,47%)] fill-[hsl(45,93%,47%)]' : 'text-white/20'}`} />)}
                     </div>
                      <span className="text-white font-bold">{etablissement.noteMoyenne.toFixed(1)}</span>
                      <span className="text-white/50">({etablissement.nombreEvaluations} {t('tabs.avis').toLowerCase()})</span>
                    </div>
                 </div>
               </div>

               {/* CTA Box */}
               <div className="lg:w-72 shrink-0">
                  <PermissionGuard 
                    permission="etablissements.subscribe"
                    fallback={
                      <Link 
                        href={`/login?callbackUrl=${encodeURIComponent(pathname || '')}`}
                        className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-[hsl(45,93%,47%)] text-gray-900 rounded-xl font-bold shadow-lg shadow-black/20 hover:bg-amber-300 transition-all transform hover:scale-[1.02]"
                      >
                          <Star className="w-5 h-5 fill-current" />
                          {t('buttons.subscribe')}
                       </Link>
                    }
                  >
                    <SubscribeButton 
                      etablissementId={etablissement.id} 
                      etablissementNom={etablissement.nom}
                      className="w-full px-6 py-4 bg-[hsl(45,93%,47%)] text-gray-900 rounded-xl font-bold shadow-lg shadow-black/20 hover:bg-amber-300 transition-all transform hover:scale-[1.02] flex justify-center"
                    />
                  </PermissionGuard>
                  <p className="text-center text-white/50 text-xs mt-3">
                     {t('notifications_hint')}
                  </p>
               </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* ==================== STICKY TABS ==================== */}
      <div className="sticky top-[64px] z-30 bg-white border-y border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-1 overflow-x-auto py-1 hide-scrollbar">
            {tabs.map(tab => {
              const isActive = activeTab === tab.id;
              const hasCount = tab.id === 'events' && etablissement._count.evenements > 0;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    relative flex items-center gap-2 px-4 py-3.5 text-sm font-medium transition-all whitespace-nowrap
                    ${isActive ? 'text-[hsl(213,80%,28%)]' : 'text-gray-500 hover:text-gray-900'}
                  `}
                >
                  <tab.icon className={`w-4 h-4 ${isActive ? 'text-[hsl(213,80%,28%)]' : 'text-gray-400'}`} />
                  {tab.label}
                  
                  {hasCount && (
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      isActive ? 'bg-[hsl(213,80%,28%)]/10 text-[hsl(213,80%,28%)]' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {etablissement._count.evenements}
                    </span>
                  )}

                  {isActive && (
                    <motion.div 
                      layoutId="activeTabIndicator"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-[hsl(213,80%,28%)]"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ==================== TAB CONTENT CONTAINER ==================== */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 lg:py-12">
        <AnimatePresence mode="wait">
          {activeTab === 'infos' && (
            <motion.div
              key="infos"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid lg:grid-cols-3 gap-8"
            >
              {/* LEFT COLUMN: Main Info */}
              <div className="lg:col-span-2 space-y-8">
                
                {/* Description / Nature Block - Only show fields with values */}
                {(etablissement.nature || etablissement.anneeCreation || etablissement.tutelle || etablissement.responsableNom) && (
                <section className="bg-white rounded-2xl p-6 lg:p-8 shadow-sm border border-gray-100">
                   <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                      <span className="w-1.5 h-6 bg-[hsl(45,93%,47%)] rounded-full"/>
                      {t('sections.about')}
                    </h2>
                   
                   <div className="grid sm:grid-cols-2 gap-y-6 gap-x-12">
                      {etablissement.nature && (
                        <div className="space-y-1">
                          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{t('labels.nature')}</span>
                          <p className="font-medium text-gray-900 text-lg">{etablissement.nature}</p>
                        </div>
                      )}
                      {etablissement.anneeCreation && (
                        <div className="space-y-1">
                          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{t('labels.creation_date')}</span>
                          <p className="font-medium text-gray-900 text-lg">{etablissement.anneeCreation}</p>
                        </div>
                      )}
                      {etablissement.tutelle && (
                        <div className="space-y-1">
                          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{t('labels.tutelle')}</span>
                          <p className="font-medium text-gray-900 text-lg">{etablissement.tutelle}</p>
                        </div>
                      )}
                      {etablissement.responsableNom && (
                        <div className="space-y-1">
                          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{t('labels.manager')}</span>
                          <p className="font-medium text-gray-900 text-lg">{etablissement.responsableNom}</p>
                        </div>
                      )}
                   </div>
                </section>
                )}

                {/* SECTION 1: INFRASTRUCTURE & RESSOURCES - Only show fields with values */}
                {(() => {
                   const hasPersonnel = etablissement.nombrePersonnel || etablissement.effectifTotal;
                   const hasSalles = etablissement.nombreSalles;
                   const hasSurface = etablissement.surfaceTotale;
                   const hasEtat = etablissement.etatInfrastructure;
                   const hasAnyInfra = hasPersonnel || hasSalles || hasSurface || hasEtat;
                   const hasUtilities = etablissement.connexionInternet || etablissement.disponibiliteElectricite || etablissement.disponibiliteEau;
                   
                   return (hasAnyInfra || hasUtilities) ? (
                   <section className="bg-white rounded-2xl p-6 lg:p-8 shadow-sm border border-gray-100 space-y-6">
                      <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-4">
                          <span className="w-1.5 h-6 bg-gray-500 rounded-full"/>
                          {t('sections.infrastructure')}
                       </h2>
                      
                      {hasAnyInfra && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                         {/* Effectif / Personnel */}
                         {hasPersonnel && (
                         <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-2 mb-2 text-gray-600">
                              <Users2 className="w-5 h-5" />
                              <span className="font-semibold text-xs uppercase tracking-wide">{t('labels.personnel')}</span>
                            </div>
                            <p className="text-2xl font-bold text-gray-900">{etablissement.nombrePersonnel || etablissement.effectifTotal}</p>
                         </div>
                         )}

                         {/* Capacité / Salles */}
                         {hasSalles && (
                         <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-2 mb-2 text-gray-600">
                              <Layout className="w-5 h-5" />
                              <span className="font-semibold text-xs uppercase tracking-wide">{t('labels.rooms')}</span>
                            </div>
                            <p className="text-2xl font-bold text-gray-900">{etablissement.nombreSalles}</p>
                         </div>
                         )}

                         {/* Surface */}
                         {hasSurface && (
                         <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-2 mb-2 text-gray-600">
                              <Ruler className="w-5 h-5" />
                              <span className="font-semibold text-xs uppercase tracking-wide">{t('labels.surface')}</span>
                            </div>
                            <p className="text-2xl font-bold text-gray-900">{etablissement.surfaceTotale} m²</p>
                         </div>
                         )}

                         {/* État */}
                         {hasEtat && (
                         <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-2 mb-2 text-gray-600">
                              <Activity className="w-5 h-5" />
                              <span className="font-semibold text-xs uppercase tracking-wide">{t('labels.infra_status')}</span>
                            </div>
                            <p className="text-lg font-bold text-gray-900 truncate">{etablissement.etatInfrastructure}</p>
                         </div>
                         )}
                      </div>
                      )}

                      {/* Utilitaires (Eau, Elec, Internet) - Only show available utilities */}
                      {hasUtilities && (
                      <div className="flex flex-wrap gap-3 pt-2">
                         {etablissement.connexionInternet && (
                         <div className="flex items-center gap-2 px-4 py-2 rounded-lg border bg-blue-50 border-blue-100 text-blue-700">
                             <Wifi className="w-4 h-4" />
                             <span className="text-sm font-medium">{t('labels.internet_available')}</span>
                          </div>
                          )}
                          {etablissement.disponibiliteElectricite && (
                          <div className="flex items-center gap-2 px-4 py-2 rounded-lg border bg-amber-50 border-amber-100 text-amber-700">
                             <Zap className="w-4 h-4" />
                             <span className="text-sm font-medium">{t('labels.electricity_available')}</span>
                          </div>
                          )}
                          {etablissement.disponibiliteEau && (
                          <div className="flex items-center gap-2 px-4 py-2 rounded-lg border bg-cyan-50 border-cyan-100 text-cyan-700">
                             <Droplets className="w-4 h-4" />
                             <span className="text-sm font-medium">{t('labels.water_available')}</span>
                          </div>
                         )}
                      </div>
                      )}
                   </section>
                   ) : null;
                })()}

                {/* SECTION 2: DONNÉES SPÉCIFIQUES SECTEUR */}
                <section className="bg-white rounded-2xl p-6 lg:p-8 shadow-sm border border-gray-100 space-y-6">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-4">
                        <span className={`w-1.5 h-6 rounded-full ${secteurConfig[etablissement.secteur as keyof typeof secteurConfig]?.bg.replace('bg-', 'bg-').replace('50', '500') || 'bg-gray-500'}`}/>
                        {t('sections.specific_details')}
                     </h2>
                    
                    {/* SECTOR: SANTE */}
                    {etablissement.secteur === 'SANTE' && (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                          {/* Médecins - Always Show */}
                          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                            <div className="flex items-center gap-2 mb-2 text-blue-700"><UserCheck className="w-5 h-5" /><span className="text-xs font-bold uppercase">{t('labels.doctors')}</span></div>
                            <p className="text-2xl font-bold">{santeData.medecins ?? '-'}</p>
                          </div>
                          
                          {/* Infirmiers - Always Show */}
                          <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                            <div className="flex items-center gap-2 mb-2 text-emerald-700"><Stethoscope className="w-5 h-5" /><span className="text-xs font-bold uppercase">{t('labels.nurses')}</span></div>
                            <p className="text-2xl font-bold">{santeData.infirmiers ?? '-'}</p>
                          </div>
                          
                          {/* Autre Personnel - Always Show */}
                          <div className="bg-cyan-50 rounded-xl p-4 border border-cyan-100">
                            <div className="flex items-center gap-2 mb-2 text-cyan-700"><Briefcase className="w-5 h-5" /><span className="text-xs font-bold uppercase">{t('labels.other_staff')}</span></div>
                            <p className="text-2xl font-bold">{santeData.autre_pers ?? '-'}</p>
                          </div>
                          
                          {/* Lits - Always Show */}
                          <div className="bg-pink-50 rounded-xl p-4 border border-pink-100">
                            <div className="flex items-center gap-2 mb-2 text-pink-700"><Bed className="w-5 h-5" /><span className="text-xs font-bold uppercase">{t('labels.beds')}</span></div>
                            <p className="text-2xl font-bold">{santeData.lits ?? '-'}</p>
                          </div>
                          
                          {/* Ambulances - Show if > 0 or explicit */}
                          {(santeData.ambulances !== undefined && santeData.ambulances !== null) && (
                            <div className="bg-red-50 rounded-xl p-4 border border-red-100">
                              <div className="flex items-center gap-2 mb-2 text-red-700"><Activity className="w-5 h-5" /><span className="text-xs font-bold uppercase">{t('labels.ambulances')}</span></div>
                              <p className="text-2xl font-bold">{santeData.ambulances}</p>
                            </div>
                         )}
                      </div>
                    )}

                    {/* SECTOR: EDUCATION */}
                    {etablissement.secteur === 'EDUCATION' && (
                       <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                          <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
                            <div className="flex items-center gap-2 mb-2 text-indigo-700"><GraduationCap className="w-5 h-5" /><span className="text-xs font-bold uppercase">{t('labels.total_students')}</span></div>
                            <p className="text-2xl font-bold text-gray-900">{etablissement.elevesTotal || getValue(['eleves', 'etudiants', 'nombre_eleves']) || '-'}</p>
                          </div>
                          {(etablissement.elevesFilles !== undefined || getValue(['filles'])) && (
                            <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                              <div className="flex items-center gap-2 mb-2 text-purple-700"><Baby className="w-5 h-5" /><span className="text-xs font-bold uppercase">{t('labels.including_girls')}</span></div>
                              <p className="text-2xl font-bold text-gray-900">{etablissement.elevesFilles || getValue(['filles'])}</p>
                            </div>
                          )}
                          {(etablissement.tauxReussite !== undefined || getValue(['reussite', 'taux'])) && (
                            <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                              <div className="flex items-center gap-2 mb-2 text-emerald-700"><Trophy className="w-5 h-5" /><span className="text-xs font-bold uppercase">{t('labels.success_rate')}</span></div>
                              <p className="text-2xl font-bold text-gray-900">{etablissement.tauxReussite || getValue(['reussite', 'taux'])}%</p>
                            </div>
                          )}
                          {getValue(['enseignants', 'professeurs']) && (
                            <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                              <div className="flex items-center gap-2 mb-2 text-amber-700"><School className="w-5 h-5" /><span className="text-xs font-bold uppercase">{t('labels.teachers')}</span></div>
                             <p className="text-2xl font-bold text-gray-900">{getValue(['enseignants', 'professeurs'])}</p>
                           </div>
                         )}
                      </div>
                    )}

                    {/* SECTOR: SPORT (NEW) */}
                    {etablissement.secteur === 'SPORT' && (
                       <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                           {getValue(['terrains', 'nombre_terrains']) && (
                              <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                                 <div className="flex items-center gap-2 mb-2 text-emerald-700"><Layout className="w-5 h-5" /><span className="text-xs font-bold uppercase">{t('labels.fields')}</span></div>
                                 <p className="text-2xl font-bold text-gray-900">{getValue(['terrains', 'nombre_terrains'])}</p>
                              </div>
                           )}
                           {getValue(['disciplines', 'activites_sportives']) && (
                              <div className="col-span-2 bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                                 <div className="flex items-center gap-2 mb-2 text-emerald-700"><Trophy className="w-5 h-5" /><span className="text-xs font-bold uppercase">{t('labels.disciplines')}</span></div>
                                <p className="font-medium text-gray-900">{String(getValue(['disciplines', 'activites_sportives']))}</p>
                             </div>
                          )}
                       </div>
                    )}

                    {/* SECTOR: SOCIAL (NEW) */}
                    {etablissement.secteur === 'SOCIAL' && (() => {
                       const beneficiaires = getValue(['beneficiaires', 'nombre_beneficiaires']);
                       const capacite = getValue(['hebergement', 'lits', 'capacite']);
                       
                       // Helper to truncate long text
                       const truncateText = (val: any, maxLen = 100) => {
                         const str = String(val);
                         return str.length > maxLen ? str.substring(0, maxLen) + '...' : str;
                       };
                       
                       // Check if value is numeric or text
                       const isNumeric = (val: any) => !isNaN(Number(val)) && String(val).length < 10;
                       
                       return (beneficiaires || capacite) ? (
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {beneficiaires && (
                               <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                                  <div className="flex items-center gap-2 mb-2 text-purple-700">
                                    <HeartHandshake className="w-5 h-5" />
                                    <span className="text-xs font-bold uppercase">{t('labels.beneficiaries')}</span>
                                  </div>
                                  <div className={isNumeric(beneficiaires) ? '' : 'max-h-24 overflow-y-auto'}>
                                    <p className={isNumeric(beneficiaires) 
                                      ? 'text-2xl font-bold text-gray-900' 
                                      : 'text-sm font-medium text-gray-800 leading-relaxed'
                                    }>
                                      {isNumeric(beneficiaires) ? beneficiaires : truncateText(beneficiaires, 150)}
                                    </p>
                                  </div>
                               </div>
                            )}
                            {capacite && (
                               <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                                  <div className="flex items-center gap-2 mb-2 text-purple-700">
                                    <Bed className="w-5 h-5" />
                                    <span className="text-xs font-bold uppercase">{t('labels.capacity')}</span>
                                  </div>
                                  <p className="text-2xl font-bold text-gray-900">{capacite}</p>
                               </div>
                            )}
                         </div>
                       ) : null;
                    })()}

                    {/* SECTOR: CULTUREL (Refined) */}
                    {etablissement.secteur === 'CULTUREL' && (
                          <div className="space-y-6">
                             {getValue(['activites', 'type_activites']) && (
                               <div>
                                   <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                                   <Palette className="w-4 h-4" /> {t('labels.activity_types')}
                                 </h4>
                                 <div className="flex flex-wrap gap-2">
                                   {String(getValue(['activites', 'type_activites'])).split(/[-,;]/).map((act: string, i: number) => (
                                     <span key={i} className="px-3 py-1 bg-orange-50 text-orange-700 rounded-lg text-sm font-medium border border-orange-100">
                                       {act.trim()}
                                     </span>
                                   ))}
                                 </div>
                               </div>
                             )}
                          </div>
                    )}

                    {/* DYNAMIC GRID FOR ALL OTHER/REMAINING DATA */}
                    {etablissement.donneesSpecifiques && (() => {
                      // === FILTRAGE AVANCÉ POUR ÉLIMINER BRUIT ET REDONDANCE ===
                      const seenValues = new Set<string>(); // Pour dédoublonnage
                      
                      // Clés techniques/inutiles à ignorer complètement
                      const technicalKeys = [
                        'geometrie', 'geometry', 'type_geometrie', 'typegeometrie', 'geom', 'shape', 'wkt',
                        'zone', 'typologie', 'zone_typologie', 'zonetypologie',
                        'objectid', 'fid', 'gid', 'pk', 'id', 'rowid',
                        'coord', 'coordx', 'coordy', 'x', 'y', 'lat', 'lng', 'longitude', 'latitude', 'gps',
                        'province', 'region', 'prefecture', 'commune',
                        'agr', 'nb_agr', 'nbagr', 'code_insee', 'codeinsee', 'insee',
                        'idem', 'idemcommu', 'idem_commu',
                        'point', 'polygon', 'multipolygon', 'linestring'
                      ];
                      
                      // Clés déjà affichées dans les sections hardcodées
                      const handledKeys = [
                        'nature', 'description', 'nom', 'adresse', 'telephone', 'email', 'site',
                        'medecin', 'infirmier', 'lit', 'ambulance', 'personnel', 'administratif',
                        'eleve', 'etudiant', 'fille', 'reussite', 'enseignant', 'professeur',
                        'salle', 'classe', 'beneficiaire', 'hebergement',
                        'terrain', 'discipline', 'sport', 'activite',
                        'directeur', 'responsable', 'horaire', 'heure', 'capacite', 'staff', 'surface', 'etat',
                        'partenaire', 'budget', 'financement', 'gestionnaire'
                      ];
                      
                      // Valeurs qui sont des labels/placeholders au lieu de vraies données
                      const invalidValues = [
                        'non', 'non disponible', 'non précise', 'non precise', 'non défini', 'non defini',
                        'néant', 'neant', 'aucun', 'aucune', 'vide', 'null', 'undefined', 'false', 'true',
                        '0', 'oui', 'n/a', 'na', 'nd', '-', '--', '---', '.',
                        'année d\'ouverture', 'annee d\'ouverture', 'année de création', 'annee de creation',
                        'à préciser', 'a preciser', 'en cours', 'inconnu', 'point', 'rurale', 'urbaine'
                      ];
                      
                      const filteredEntries = Object.entries(etablissement.donneesSpecifiques)
                        .filter(([key, value]) => {
                          const normKey = key.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
                          const valStr = String(value).toLowerCase().trim();
                          
                          // 1. Exclure clés techniques
                          if (technicalKeys.some(tk => normKey.includes(tk))) return false;
                          
                          // 2. Exclure clés déjà traitées
                          if (handledKeys.some(hk => normKey.includes(hk))) return false;
                          
                          // 3. Exclure valeurs invalides/vides
                          if (!valStr || valStr.length < 2 || invalidValues.includes(valStr)) return false;
                          
                          // 4. Exclure objets
                          if (typeof value === 'object') return false;
                          
                          // 5. Dédoublonnage: si valeur déjà vue, ignorer
                          const valNorm = valStr.substring(0, 50); // Comparer premiers 50 chars
                          if (seenValues.has(valNorm)) return false;
                          seenValues.add(valNorm);
                          
                          return true;
                        })
                        .slice(0, 9); // Limiter à 9 éléments max pour éviter surcharge
                      
                      return filteredEntries.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
                           {filteredEntries.map(([key, value]) => (
                             <div key={key} className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-4 border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all">
                                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                                   {/* Try to translate the key, otherwise format it */}
                                   {(key.toLowerCase().includes('quartier') || key.toLowerCase().includes('douar')) 
                                      ? t('labels.neighborhood') 
                                      : key.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim()}
                                </h4>
                                <p className="text-sm font-medium text-gray-800 leading-relaxed">
                                  {String(value).startsWith('http') ? (
                                    <a href={String(value)} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-1">
                                      <span>{t('labels.view')}</span>
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                    </a>
                                  ) : String(value).length > 100 ? String(value).substring(0, 100) + '...' : String(value)}
                                </p>
                             </div>
                           ))}
                        </div>
                      ) : null;
                    })()}
                </section>

                {/* Services & Programmes */}
                {(etablissement.services.length > 0 || etablissement.programmes.length > 0) && (
                   <section className="bg-white rounded-2xl p-6 lg:p-8 shadow-sm border border-gray-100">
                      <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <span className="w-1.5 h-6 bg-[hsl(213,80%,28%)] rounded-full"/>
                        {t('sections.service_offer')}
                      </h2>
                      
                       {etablissement.services.length > 0 && (
                         <div className="mb-6">
                            <h3 className="text-sm font-semibold text-gray-500 mb-3">{t('labels.available_services')}</h3>
                            <div className="flex flex-wrap gap-2">
                             {etablissement.services.map((s, i) => (
                               <span key={i} className="px-3 py-1.5 bg-gray-50 text-gray-700 rounded-lg text-sm font-medium border border-gray-200">
                                 {s}
                               </span>
                             ))}
                           </div>
                        </div>
                      )}
                      
                       {etablissement.programmes.length > 0 && (
                         <div>
                            <h3 className="text-sm font-semibold text-gray-500 mb-3">{t('labels.educ_programs')}</h3>
                            <div className="flex flex-wrap gap-2">
                             {etablissement.programmes.map((p, i) => (
                               <span key={i} className={`px-3 py-1.5 bg-${config.bg} ${config.text} rounded-lg text-sm font-medium border border-${config.text}/10`}>
                                 {p}
                               </span>
                             ))}
                           </div>
                        </div>
                      )}
                   </section>
                )}

                {/* Galerie Photo */}
                {allImages.length > 0 && (
                   <section className="bg-white rounded-2xl p-6 lg:p-8 shadow-sm border border-gray-100">
                     <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                           <span className="w-1.5 h-6 bg-purple-500 rounded-full"/>
                           {t('sections.gallery')}
                        </h2>
                        <span className="text-sm text-gray-500">{t('labels.photos_count', { count: allImages.length })}</span>
                     </div>
                     
                     <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {allImages.map((img, i) => (
                           <button 
                             key={i}
                             onClick={() => { setActiveImage(i); setShowGallery(true); }}
                             className="group relative aspect-square rounded-xl overflow-hidden bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[hsl(213,80%,28%)]"
                           >
                             <OptimizedImage
                               src={img.urlPublique}
                               alt=""
                               fill
                               className="object-cover group-hover:scale-110 transition-transform duration-500"
                             />
                             <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                           </button>
                        ))}
                     </div>
                   </section>
                )}
              </div>

              {/* RIGHT COLUMN: Sidebar Info */}
              <div className="space-y-6">
                 {/* Map Widget */}
                 <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
                    <LocationMap
                      position={{ lat: etablissement.latitude, lng: etablissement.longitude }}
                      onPositionChange={() => {}}
                      readonly
                      height="h-56"
                    />
                    <div className="p-5">
                        <h3 className="font-bold text-gray-900 mb-1">{t('sections.location')}</h3>
                        <p className="text-sm text-gray-600 mb-4">{etablissement.adresseComplete || 'Adresse non disponible'}</p>
                        <a 
                          href={`https://maps.google.com/?q=${etablissement.latitude},${etablissement.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 w-full py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl text-sm font-medium transition-colors"
                        >
                          <MapPin className="w-4 h-4" />
                          {t('buttons.view_on_maps')}
                        </a>
                    </div>
                 </div>

                 {/* Contact Card */}
                 <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                     <h3 className="font-bold text-gray-900 mb-4">{t('sections.contact')}</h3>
                     <div className="space-y-4">
                        {etablissement.telephone && (
                          <div className="flex items-center gap-3">
                             <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                                <Phone className="w-5 h-5" />
                             </div>
                             <div>
                                <p className="text-xs text-gray-500 font-medium uppercase">{t('labels.phone')}</p>
                               <a href={`tel:${etablissement.telephone}`} className="text-sm font-semibold text-gray-900 hover:text-emerald-600 font-mono">
                                  {etablissement.telephone}
                               </a>
                            </div>
                         </div>
                       )}
                       {etablissement.email && (
                         <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                               <Mail className="w-5 h-5" />
                            </div>
                             <div className="min-w-0">
                                <p className="text-xs text-gray-500 font-medium uppercase">{t('labels.email')}</p>
                                <a href={`mailto:${etablissement.email}`} className="text-sm font-semibold text-gray-900 hover:text-blue-600 truncate block">
                                   {etablissement.email}
                                </a>
                             </div>
                          </div>
                        )}
                        {etablissement.siteWeb && (
                          <div className="flex items-center gap-3">
                             <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                                <Globe className="w-5 h-5" />
                             </div>
                             <div className="min-w-0">
                                <p className="text-xs text-gray-500 font-medium uppercase">{t('labels.website')}</p>
                                <a href={etablissement.siteWeb} target="_blank" rel="noopener" className="text-sm font-semibold text-gray-900 hover:text-purple-600 truncate block">
                                   {t('buttons.visit_site')}
                                </a>
                            </div>
                         </div>
                       )}
                    </div>
                 </div>

                 {/* Stats Card */}
                  <div className="bg-gradient-to-br from-[hsl(213,80%,28%)] to-[hsl(213,80%,35%)] rounded-2xl p-6 shadow-lg text-white">
                     <h3 className="font-bold mb-4 opacity-90">{t('sections.metrics')}</h3>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                           <p className="text-2xl font-bold mb-1">{etablissement._count.evenements}</p>
                           <p className="text-xs opacity-70">{t('labels.events_organized')}</p>
                        </div>
                        <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                           <p className="text-2xl font-bold mb-1">{etablissement.capaciteAccueil || '-'}</p>
                           <p className="text-xs opacity-70">{t('labels.hosting_capacity')}</p>
                        </div>
                        <div className="col-span-2 bg-white/10 rounded-xl p-3 backdrop-blur-sm flex items-center justify-between">
                           <div>
                              <p className="text-2xl font-bold mb-1">{etablissement.noteMoyenne.toFixed(1)}<span className="text-sm opacity-60 font-normal">/5</span></p>
                              <p className="text-xs opacity-70">{t('labels.citizen_satisfaction')}</p>
                           </div>
                          <div>
                             <StarRating rating={Math.round(etablissement.noteMoyenne)} />
                          </div>
                       </div>
                    </div>
                 </div>
              </div>
            </motion.div>
          )}

          {/* OTHER TABS: Minimal implementation for clarity, assume similar improvements */}
          {activeTab === 'events' && (
             <motion.div 
               key="events"
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
             >
                 {evenements.length > 0 ? evenements.map((evt, i) => (
                    <EventCard key={evt.id} event={evt} index={i} />
                 )) : (
                    <div className="col-span-full py-20 text-center bg-white rounded-2xl border border-dashed border-gray-300">
                       <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                       <p className="text-gray-500">{t('placeholders.no_events')}</p>
                    </div>
                 )}
             </motion.div>
          )}

          {activeTab === 'avis' && (
             <motion.div
               key="avis"
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
                className="max-w-3xl mx-auto"
              >
                 <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm text-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('sections.reviews')}</h2>
                    
                    <div className="flex justify-center items-end gap-2 mb-4">
                      <span className="text-6xl font-bold text-gray-900">{etablissement.noteMoyenne.toFixed(1)}</span>
                      <span className="text-xl text-gray-400 mb-2">/ 5</span>
                   </div>
                   
                   <div className="flex justify-center mb-8">
                      <StarRating rating={Math.round(etablissement.noteMoyenne)} size="lg" />
                   </div>

                   <PermissionGuard
                     permission="evaluations.create"
                      fallback={
                         <Link href={`/login?callbackUrl=${encodeURIComponent(pathname || '')}`} className="inline-flex items-center gap-2 px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full font-medium transition-colors">
                            🔒 {t('buttons.login_rating')}
                         </Link>
                      }
                   >
                      <Link href={`/evaluer/${etablissement.id}`} className="inline-flex items-center gap-2 px-8 py-3 bg-[hsl(45,93%,47%)] text-gray-900 rounded-full font-bold shadow-lg hover:bg-amber-300 transition-all">
                         <Star className="w-5 h-5 fill-current" />
                         {t('buttons.give_rating')}
                      </Link>
                   </PermissionGuard>
                </div>

                <div className="space-y-4">
                   {etablissement.evaluations.map((evaluation) => (
                      <div key={evaluation.id} className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                         <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-3">
                               <div className="w-10 h-10 rounded-full bg-[hsl(213,80%,28%)]/10 text-[hsl(213,80%,28%)] flex items-center justify-center font-bold">
                                  {evaluation.user.prenom[0]}{evaluation.user.nom[0]}
                               </div>
                               <div>
                                  <p className="font-bold text-gray-900">{evaluation.user.prenom} {evaluation.user.nom}</p>
                                  <p className="text-xs text-gray-500">{new Date(evaluation.createdAt).toLocaleDateString('fr-FR', { dateStyle: 'long' })}</p>
                               </div>
                            </div>
                            <StarRating rating={Math.round(evaluation.noteGlobale)} size="sm" />
                         </div>
                         {evaluation.commentaire && (
                            <p className="text-gray-600 leading-relaxed bg-gray-50 p-4 rounded-lg text-sm">
                              "{evaluation.commentaire}"
                            </p>
                         )}
                      </div>
                   ))}
                </div>
             </motion.div>
          )}

          {/* Placeholders for other tabs */}
           {['actualites', 'activites', 'articles', 'campagnes'].includes(activeTab) && !['infos', 'events', 'avis'].includes(activeTab) && (
               <div className="py-20 text-center bg-white rounded-2xl border border-dashed border-gray-300">
                 <p className="text-gray-500">{t('placeholders.content_unavailable')}</p>
               </div>
           )}
        </AnimatePresence>
      </div>

      {/* Fullscreen Gallery Lightbox */}
      <AnimatePresence>
        {showGallery && allImages.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 backdrop-blur-sm"
            onClick={() => setShowGallery(false)}
          >
            <button className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors">
               <X className="w-8 h-8" />
            </button>
            
            <div className="relative w-full max-w-5xl aspect-video rounded-lg overflow-hidden" onClick={e => e.stopPropagation()}>
               <OptimizedImage
                  src={allImages[activeImage].urlPublique}
                  alt="Gallery"
                  fill
                  className="object-contain"
               />
            </div>
            
            {allImages.length > 1 && (
               <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-4">
                  <button onClick={(e) => { e.stopPropagation(); setActiveImage((p) => (p - 1 + allImages.length) % allImages.length) }} className="p-3 bg-white/10 rounded-full hover:bg-white/20 text-white">
                     <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); setActiveImage((p) => (p + 1) % allImages.length) }} className="p-3 bg-white/10 rounded-full hover:bg-white/20 text-white">
                     <ChevronLeft className="w-6 h-6 rotate-180" />
                  </button>
               </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
