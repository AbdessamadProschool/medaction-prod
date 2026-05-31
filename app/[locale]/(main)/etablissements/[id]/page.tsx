'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams, usePathname } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations, useLocale } from 'next-intl';
import { useData } from '@/hooks/use-data';
import EventCard from '@/components/evenements/EventCard';
import NewsCard from '@/components/actualites/NewsCard';
import SubscribeButton from '@/components/etablissements/SubscribeButton';
import { PermissionGuard } from '@/hooks/use-permission';
import { 
  GraduationCap, Hospital, Trophy, HeartHandshake, Drama, Building2, 
  ClipboardList, Calendar, Clock, Star, Newspaper, Megaphone, FileText, 
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
    evenementsOrganises?: number;
    actualites?: number;
    activitesOrganisees?: number;
    abonnements?: number;
  };
  evenementsOrganises?: Evenement[];
  actualites?: Actualite[];
  activitesOrganisees?: any[];
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
  description: string | null;
  categorie: string | null;
  nombreVues: number;
  datePublication: string | null;
  createdAt: string;
  etablissement?: {
    id: number;
    nom: string;
    nomArabe?: string;
    secteur: string;
    commune?: { nom: string; nomArabe?: string };
  } | null;
  medias: { urlPublique: string }[];
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
  EDUCATION: { gradient: 'from-[hsl(var(--gov-blue))] to-[hsl(var(--gov-blue-dark))]', icon: GraduationCap, label: t('education'), badge: 'bg-[hsl(var(--gov-blue)/0.08)] text-[hsl(var(--gov-blue))] border-[hsl(var(--gov-blue)/0.2)]' },
  SANTE: { gradient: 'from-[hsl(var(--gov-red))] to-[hsl(var(--gov-red-dark))]', icon: Hospital, label: t('sante'), badge: 'bg-[hsl(var(--gov-red)/0.08)] text-[hsl(var(--gov-red))] border-[hsl(var(--gov-red)/0.2)]' },
  SPORT: { gradient: 'from-[hsl(var(--gov-green))] to-[hsl(var(--gov-green-dark))]', icon: Trophy, label: t('sport'), badge: 'bg-[hsl(var(--gov-green)/0.08)] text-[hsl(var(--gov-green))] border-[hsl(var(--gov-green)/0.2)]' },
  SOCIAL: { gradient: 'from-[hsl(var(--gov-gold))] to-[hsl(var(--gov-gold-dark))]', icon: HeartHandshake, label: t('social'), badge: 'bg-[hsl(var(--gov-gold)/0.12)] text-[hsl(var(--gov-gold-dark))] border-[hsl(var(--gov-gold)/0.25)]' },
  CULTUREL: { gradient: 'from-[hsl(var(--gov-blue-light))] to-[hsl(var(--gov-blue))]', icon: Drama, label: t('culture'), badge: 'bg-[hsl(var(--gov-blue)/0.08)] text-[hsl(var(--gov-blue))] border-[hsl(var(--gov-blue)/0.2)]' },
  AUTRE: { gradient: 'from-muted-foreground to-foreground', icon: Building2, label: t('autre'), badge: 'bg-muted text-muted-foreground border-border' },
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
          className={`${sizeClass} ${star <= rating ? 'text-gov-gold fill-amber-400' : 'text-gray-200'}`}
        />
      ))}
    </div>
  );
}

function ActivityCard({ activity, index, locale }: { activity: any; index: number; locale: string }) {
  const t = useTranslations('etablissement_page');
  const dateObj = new Date(activity.date);
  const formattedDate = dateObj.toLocaleDateString(locale === 'ar' ? 'ar-MA' : 'fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  // Color & Icon mapping based on status
  const statusColors: Record<string, { bg: string; text: string; border: string }> = {
    BROUILLON: { bg: 'bg-gray-50 text-gray-500', text: 'text-gray-500', border: 'border-gray-200' },
    EN_ATTENTE_VALIDATION: { bg: 'bg-amber-50 text-amber-700', text: 'text-amber-700', border: 'border-amber-200/50' },
    PLANIFIEE: { bg: 'bg-blue-50 text-blue-700', text: 'text-blue-700', border: 'border-blue-200/50' },
    EN_COURS: { bg: 'bg-emerald-50 text-emerald-700', text: 'text-emerald-700', border: 'border-emerald-200/50' },
    TERMINEE: { bg: 'bg-gray-100 text-gray-700', text: 'text-gray-700', border: 'border-gray-200' },
    RAPPORT_COMPLETE: { bg: 'bg-emerald-50 text-emerald-700', text: 'text-emerald-700', border: 'border-emerald-200/50' },
    ANNULEE: { bg: 'bg-red-50 text-red-700', text: 'text-red-700', border: 'border-red-200/50' },
    REPORTEE: { bg: 'bg-amber-50 text-amber-700', text: 'text-amber-700', border: 'border-amber-200/50' },
  };

  const status = activity.statut || 'PLANIFIEE';
  const colors = statusColors[status] || statusColors.PLANIFIEE;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -5 }}
      className="group bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-xl hover:shadow-gov-blue/5 transition-all duration-300 flex flex-col h-full"
    >
      <div className="flex items-center justify-between mb-4">
        <span className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1.5 rounded-lg border border-gray-100 text-xs font-semibold text-gray-500">
          <Calendar className="w-3.5 h-3.5 text-gov-gold" />
          {formattedDate}
        </span>
        <span className={`inline-flex px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${colors.bg} ${colors.text} ${colors.border}`}>
          {status}
        </span>
      </div>

      <h3 className="font-bold text-gray-900 text-lg mb-2 group-hover:text-gov-blue transition-colors leading-tight line-clamp-2">
        {activity.titre}
      </h3>

      <p className="text-gray-500 text-sm line-clamp-3 mb-6 flex-1">
        {activity.description || "Aucune description supplémentaire fournie pour cette activité."}
      </p>

      <div className="pt-4 border-t border-gray-50 mt-auto space-y-3">
        <div className="flex items-center justify-between text-xs text-gray-500 font-medium">
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-gray-400" />
            {activity.heureDebut || '00:00'} - {activity.heureFin || '00:00'}
          </span>
          {activity.lieu && (
            <span className="flex items-center gap-1.5 truncate max-w-[150px]">
              <MapPin className="w-3.5 h-3.5 text-gray-400" />
              {activity.lieu}
            </span>
          )}
        </div>

        {(activity.participantsAttendus > 0 || activity.presenceEffective > 0) && (
          <div className="flex items-center gap-4 bg-gray-50 p-2.5 rounded-xl border border-gray-100/50">
            {activity.participantsAttendus > 0 && (
              <div className="flex-1 text-center">
                <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">{locale === 'ar' ? 'المتوقع' : 'Attendus'}</span>
                <span className="text-sm font-extrabold text-gray-700">{activity.participantsAttendus}</span>
              </div>
            )}
            {activity.presenceEffective > 0 && (
              <div className="flex-1 text-center border-l border-gray-200">
                <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">{locale === 'ar' ? 'الحاضرون' : 'Présents'}</span>
                <span className="text-sm font-extrabold text-gov-green-dark">{activity.presenceEffective}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function EtablissementDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState('infos');
  const t = useTranslations('etablissement_page');
  const locale = useLocale();
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

  // Fetching data via ECC Standard hook (SWR)
  const { data: etablissement, isLoading: loading } = useData<Etablissement>(params.id ? `/api/etablissements/${params.id}` : null);

  const shouldFetchEvents = activeTab === 'events' && etablissement;
  const { data: evenementsData } = useData<Evenement[]>(shouldFetchEvents ? `/api/evenements?etablissementId=${etablissement.id}` : null);
  const evenements = evenementsData || [];

  const shouldFetchActivites = activeTab === 'activites' && etablissement;
  const { data: activitesData } = useData<any[]>(shouldFetchActivites ? `/api/programmes-activites?etablissementId=${etablissement.id}` : null);
  const activites = activitesData || [];

  const shouldFetchActualites = activeTab === 'actualites' && etablissement;
  const { data: actualitesData } = useData<Actualite[]>(shouldFetchActualites ? `/api/actualites?etablissementId=${etablissement.id}` : null);
  const actualites = actualitesData || [];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-gov-blue border-t-transparent rounded-full animate-spin" />
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
         <Link href="/etablissements" className="px-6 py-3 bg-gov-blue text-white rounded-xl font-medium hover:bg-[hsl(213,80%,35%)] transition-colors">
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

  const displayEvents = evenements.length > 0 ? evenements : (etablissement.evenementsOrganises || []);
  const displayActualites = actualites.length > 0 ? actualites : (etablissement.actualites || []);
  const displayActivites = activites.length > 0 ? activites : (etablissement.activitesOrganisees || []);

  // Tracking keys that are explicitly used in the UI to avoid duplication in the "Specific Details" grid
  const usedKeys = new Set<string>();

  // Helper function for fuzzy finding values in donneesSpecifiques
  const getValue = (keys: string[]): any => {
    if (!etablissement.donneesSpecifiques) return null;
    
    // 1. Try exact matches from keys list
    for (const key of keys) {
      if (etablissement.donneesSpecifiques[key] !== undefined) {
        usedKeys.add(key);
        return etablissement.donneesSpecifiques[key];
      }
    }
    
    // 2. Try normalized matches (ignore case, accents, spaces, underscores)
    const dataKeys = Object.keys(etablissement.donneesSpecifiques);
    const normalizedDataKeys = dataKeys.map(k => ({
      original: k,
      normalized: k.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "")
    }));

    for (const key of keys) {
       const normalizedSearch = key.toLowerCase().normalize("NFD").replace(/[^a-z0-9]/g, "");
       const found = normalizedDataKeys.find(k => k.normalized === normalizedSearch || k.normalized.includes(normalizedSearch));
       if (found) {
         usedKeys.add(found.original);
         return etablissement.donneesSpecifiques[found.original];
       }
    }
    
    return null;
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
             <div className="absolute inset-0 bg-gradient-to-t from-[hsl(222,47%,11%)] via-[hsl(222,47%,11%)]/80 to-transparent backdrop-blur-[1px]" />
          </div>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#1e40af] to-[#1e3a8a]">
             <div className="absolute inset-0 bg-[hsl(var(--gov-blue-dark)/0.1)] pattern-grid-lg opacity-20" />
          </div>
        )}

        {/* Content Container */}
        <div className="absolute inset-0 pt-24 pb-8 flex flex-col justify-end">
          <div className="max-w-7xl mx-auto w-full px-4 sm:px-6">
            
            {/* Top Navigation Row (Absolute) */}
            <div className="absolute top-24 left-4 sm:left-6 lg:left-8 right-4 sm:right-6 lg:right-8 flex justify-between items-start">
              <Link 
                href="/etablissements"
                className="inline-flex items-center gap-2 px-4 py-2 bg-[hsl(var(--gov-blue-dark)/0.36)] text-white rounded-full hover:bg-[hsl(var(--gov-blue-dark)/0.46)] transition-colors border border-white/10 text-sm font-medium"
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
                className="p-2 bg-[hsl(var(--gov-blue-dark)/0.36)] text-white rounded-full hover:bg-[hsl(var(--gov-blue-dark)/0.46)] border border-white/10"
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
                     <span className="px-3 py-1 bg-gov-green/20 text-gov-green border border-gov-green/30/30 rounded-full text-xs font-bold uppercase backdrop-blur-md">
                       {etablissement.statutFonctionnel}
                     </span>
                   )}
                   {/* 
                   <span className="font-mono text-white/60 text-xs px-2 py-0.5 border border-white/10 rounded">
                     {etablissement.code}
                   </span>
                   */}
                 </div>

                 <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-3 leading-tight tracking-tight text-white drop-shadow-sm">
                   {etablissement.nom}
                 </h1>
                 {etablissement.nomArabe && (
                   <p className="text-2xl md:text-3xl text-white/90 font-serif mb-6 drop-shadow-sm" dir="rtl">{etablissement.nomArabe}</p>
                 )}

                 <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm md:text-base text-white/90 font-medium">
                   <div className="flex items-center gap-2">
                     <MapPin className="w-5 h-5 text-gov-gold" />
                     {etablissement.commune.nom}
                     {etablissement.adresseComplete ? ` • ${etablissement.adresseComplete.split(',')[0]}` : ''}
                   </div>
                   <div className="flex items-center gap-2">
                     <div className="flex gap-0.5">
                       {[1,2,3,4,5].map(s => <Star key={s} className={`w-4 h-4 ${s <= Math.round(etablissement.noteMoyenne) ? 'text-gov-gold fill-amber-400' : 'text-white/30'}`} />)}
                     </div>
                      <span className="text-white font-bold text-lg">{etablissement.noteMoyenne.toFixed(1)}</span>
                      <span className="text-white/70">({etablissement.nombreEvaluations} {t('tabs.avis').toLowerCase()})</span>
                    </div>
                  </div>
               </div>

               {/* CTA Box */}
               <div className="lg:w-72 shrink-0">
                  <div className="flex flex-col gap-3">
                    <PermissionGuard 
                      permission="etablissements.subscribe"
                      fallback={
                        <Link 
                          href={`/login?callbackUrl=${encodeURIComponent(pathname || '')}`}
                          className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gov-gold text-gray-900 rounded-xl font-bold shadow-lg shadow-black/20 hover:bg-gov-gold/10 transition-all transform hover:scale-[1.02]"
                        >
                            <Star className="w-5 h-5 fill-current" />
                            {t('buttons.subscribe')}
                         </Link>
                      }
                    >
                      <SubscribeButton 
                        etablissementId={etablissement.id} 
                        etablissementNom={etablissement.nom}
                        className="w-full px-6 py-4 bg-gov-gold text-gray-900 rounded-xl font-bold shadow-lg shadow-black/20 hover:bg-gov-gold/10 transition-all transform hover:scale-[1.02] flex justify-center"
                      />
                    </PermissionGuard>



                  </div>
                  
                  <p className="text-center text-white/50 text-xs mt-4">
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
              
              let count = 0;
              if (tab.id === 'events') count = etablissement._count?.evenementsOrganises || 0;
              if (tab.id === 'actualites') count = etablissement._count?.actualites || 0;
              if (tab.id === 'activites') count = etablissement._count?.activitesOrganisees || 0;
              if (tab.id === 'avis') count = etablissement._count?.evaluations || 0;
              
              const hasCount = count > 0;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    relative flex items-center justify-center gap-2.5 px-6 py-3.5 text-lg font-bold transition-all whitespace-nowrap rounded-xl mx-1
                    ${isActive 
                      ? 'bg-gov-blue text-white shadow-lg ring-2 ring-gov-blue/20 ring-offset-2' 
                      : 'text-gray-700 bg-gray-100 hover:bg-gray-200 hover:text-gov-blue border border-gray-200 shadow-sm'}
                  `}
                >
                  <tab.icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gov-blue/60'}`} />
                  {tab.label}
                  
                  {hasCount && (
                    <span className={`px-2 py-0.5 rounded text-xs font-extrabold ${
                      isActive ? 'bg-white/20 text-white shadow-sm' : 'bg-gray-200 text-gray-700'
                    }`}>
                      {count}
                    </span>
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
                      <span className="w-1.5 h-6 bg-gov-gold rounded-full"/>
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
                          <div className="flex items-center gap-2 px-4 py-2 rounded-lg border bg-gov-gold/5 border-gov-gold/30 text-gov-gold">
                             <Zap className="w-4 h-4" />
                             <span className="text-sm font-medium">{t('labels.electricity_available')}</span>
                          </div>
                          )}
                          {etablissement.disponibiliteEau && (
                          <div className="flex items-center gap-2 px-4 py-2 rounded-lg border bg-[hsl(var(--gov-blue)/0.08)] border-[hsl(var(--gov-blue)/0.18)] text-[hsl(var(--gov-blue))]">
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
                        <span className="w-1.5 h-6 rounded-full bg-[hsl(var(--gov-blue))]"/>
                        {t('sections.specific_details')}
                     </h2>
                    
                    {/* SECTOR: SANTE */}
                    {etablissement.secteur === 'SANTE' && (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                          {/* Médecins - Always Show */}
                          <div className="bg-[hsl(var(--gov-blue)/0.08)] rounded-xl p-4 border border-[hsl(var(--gov-blue)/0.18)]">
                            <div className="flex items-center gap-2 mb-2 text-[hsl(var(--gov-blue))]"><UserCheck className="w-5 h-5" /><span className="text-xs font-bold uppercase">{t('labels.doctors')}</span></div>
                            <p className="text-2xl font-bold">{getValue(['nombre_medecins', 'medecins', 'medecin', 'effectif_medical']) ?? '-'}</p>
                          </div>
                          
                          {/* Infirmiers - Always Show */}
                          <div className="bg-[hsl(var(--gov-green)/0.08)] rounded-xl p-4 border border-[hsl(var(--gov-green)/0.18)]">
                            <div className="flex items-center gap-2 mb-2 text-[hsl(var(--gov-green))]"><Stethoscope className="w-5 h-5" /><span className="text-xs font-bold uppercase">{t('labels.nurses')}</span></div>
                            <p className="text-2xl font-bold">{getValue(['nombre_infirmiers', 'infirmiers', 'infirmier', 'paramedical']) ?? '-'}</p>
                          </div>
                          
                          {/* Autre Personnel - Always Show */}
                          <div className="bg-[hsl(var(--gov-blue)/0.08)] rounded-xl p-4 border border-[hsl(var(--gov-blue)/0.18)]">
                            <div className="flex items-center gap-2 mb-2 text-[hsl(var(--gov-blue))]"><Briefcase className="w-5 h-5" /><span className="text-xs font-bold uppercase">{t('labels.other_staff')}</span></div>
                            <p className="text-2xl font-bold">{getValue(['autres_personnel', 'autre_personnel', 'administratif', 'support']) ?? '-'}</p>
                          </div>
                          
                          {/* Lits - Always Show */}
                          <div className="bg-[hsl(var(--gov-red)/0.08)] rounded-xl p-4 border border-[hsl(var(--gov-red)/0.18)]">
                            <div className="flex items-center gap-2 mb-2 text-[hsl(var(--gov-red))]"><Bed className="w-5 h-5" /><span className="text-xs font-bold uppercase">{t('labels.beds')}</span></div>
                            <p className="text-2xl font-bold">{getValue(['nombre_lits', 'lits', 'lit', 'capacite_lits']) ?? '-'}</p>
                          </div>
                          
                          {/* Ambulances - Show if > 0 or explicit */}
                          {(() => {
                            const val = getValue(['ambulances', 'nombre_ambulances']);
                            return (val !== undefined && val !== null) ? (
                            <div className="bg-[hsl(var(--gov-red)/0.08)] rounded-xl p-4 border border-[hsl(var(--gov-red)/0.18)]">
                              <div className="flex items-center gap-2 mb-2 text-[hsl(var(--gov-red))]"><Activity className="w-5 h-5" /><span className="text-xs font-bold uppercase">{t('labels.ambulances')}</span></div>
                              <p className="text-2xl font-bold">{val}</p>
                            </div>
                            ) : null;
                          })()}
                      </div>
                    )}

                    {/* SECTOR: EDUCATION */}
                    {etablissement.secteur === 'EDUCATION' && (
                       <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                          <div className="bg-[hsl(var(--gov-blue)/0.08)] rounded-xl p-4 border border-[hsl(var(--gov-blue)/0.18)]">
                            <div className="flex items-center gap-2 mb-2 text-[hsl(var(--gov-blue))]"><GraduationCap className="w-5 h-5" /><span className="text-xs font-bold uppercase">{t('labels.total_students')}</span></div>
                            <p className="text-2xl font-bold text-gray-900">{etablissement.elevesTotal || getValue(['eleves', 'etudiants', 'nombre_eleves']) || '-'}</p>
                          </div>
                          {(etablissement.elevesFilles !== undefined || getValue(['filles'])) && (
                            <div className="bg-[hsl(var(--gov-green)/0.08)] rounded-xl p-4 border border-[hsl(var(--gov-green)/0.18)]">
                              <div className="flex items-center gap-2 mb-2 text-[hsl(var(--gov-green))]"><Baby className="w-5 h-5" /><span className="text-xs font-bold uppercase">{t('labels.including_girls')}</span></div>
                              <p className="text-2xl font-bold text-gray-900">{etablissement.elevesFilles || getValue(['filles'])}</p>
                            </div>
                          )}
                          {(etablissement.tauxReussite !== undefined || getValue(['reussite', 'taux'])) && (
                            <div className="bg-[hsl(var(--gov-green)/0.08)] rounded-xl p-4 border border-[hsl(var(--gov-green)/0.18)]">
                              <div className="flex items-center gap-2 mb-2 text-[hsl(var(--gov-green))]"><Trophy className="w-5 h-5" /><span className="text-xs font-bold uppercase">{t('labels.success_rate')}</span></div>
                              <p className="text-2xl font-bold text-gray-900">{etablissement.tauxReussite || getValue(['reussite', 'taux'])}%</p>
                            </div>
                          )}
                          {getValue(['enseignants', 'professeurs']) && (
                            <div className="bg-[hsl(var(--gov-gold)/0.12)] rounded-xl p-4 border border-[hsl(var(--gov-gold)/0.24)]">
                              <div className="flex items-center gap-2 mb-2 text-[hsl(var(--gov-gold-dark))]"><School className="w-5 h-5" /><span className="text-xs font-bold uppercase">{t('labels.teachers')}</span></div>
                             <p className="text-2xl font-bold text-gray-900">{getValue(['enseignants', 'professeurs'])}</p>
                           </div>
                         )}
                      </div>
                    )}

                    {/* SECTOR: SPORT (NEW) */}
                    {etablissement.secteur === 'SPORT' && (
                       <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                           {getValue(['terrains', 'nombre_terrains']) && (
                              <div className="bg-[hsl(var(--gov-green)/0.08)] rounded-xl p-4 border border-[hsl(var(--gov-green)/0.18)]">
                                 <div className="flex items-center gap-2 mb-2 text-[hsl(var(--gov-green))]"><Layout className="w-5 h-5" /><span className="text-xs font-bold uppercase">{t('labels.fields')}</span></div>
                                 <p className="text-2xl font-bold text-gray-900">{getValue(['terrains', 'nombre_terrains'])}</p>
                              </div>
                           )}
                           {getValue(['disciplines', 'activites_sportives']) && (
                              <div className="col-span-2 bg-[hsl(var(--gov-green)/0.08)] rounded-xl p-4 border border-[hsl(var(--gov-green)/0.18)]">
                                 <div className="flex items-center gap-2 mb-2 text-[hsl(var(--gov-green))]"><Trophy className="w-5 h-5" /><span className="text-xs font-bold uppercase">{t('labels.disciplines')}</span></div>
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
                               <div className="bg-[hsl(var(--gov-green)/0.08)] rounded-xl p-4 border border-[hsl(var(--gov-green)/0.18)]">
                                  <div className="flex items-center gap-2 mb-2 text-[hsl(var(--gov-green))]">
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
                               <div className="bg-[hsl(var(--gov-green)/0.08)] rounded-xl p-4 border border-[hsl(var(--gov-green)/0.18)]">
                                  <div className="flex items-center gap-2 mb-2 text-[hsl(var(--gov-green))]">
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
                                     <span key={i} className="px-3 py-1 bg-gov-gold/5 text-gov-gold rounded-lg text-sm font-medium border border-gov-gold/30">
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
                      // === DB KEY MAPPING FOR TRANSLATION ===
                      const keyMap: Record<string, string> = {
                        // Priority Matches (Specific first) - USES NORMALIZED KEYS (no accents, spaces only)
                        'filles derniere annee': 'last_year_girls',
                        'fille derniere annee': 'last_year_girls',
                        'filles dernier annee': 'last_year_girls', 
                        'fille dernier annee': 'last_year_girls',
                        'derniere annee fille': 'last_year_girls',
                        'dernier annee fille': 'last_year_girls',

                        'filles nouveaux inscrits': 'new_enrollees_girls',
                        'fille nouveaux inscrits': 'new_enrollees_girls',
                        'nv inscrits fille': 'new_enrollees_girls',

                        'eleves prescolaire filles': 'preschool_girls',
                        'prescolaire filles': 'preschool_girls',
                        
                        'eleves prescolaire': 'preschool_students',
                        'prescolaire total': 'preschool_students',
                        'prescolaire': 'preschool_students', // carefully placed before catch-all

                        'eleves filles': 'including_girls',
                        'nombre filles': 'including_girls',
                        'filles': 'including_girls', // Catch-all

                        'nouveaux inscrits': 'new_enrollees',
                        'nv inscrits': 'new_enrollees',

                        'derniere annee': 'last_year',
                        'dernier annee': 'last_year',
                        'annee derniere': 'last_year',

                        'taux reussite': 'success_rate',
                        'reussite': 'success_rate',

                        'nb classes': 'classes_count',
                        'nombre classes': 'classes_count',
                        'classes': 'classes_count',

                        'eleves total': 'total_students',
                        'nombre eleves': 'total_students',
                        'total eleves': 'total_students',
                        'eleves': 'total_students', 

                        'nombre salles': 'rooms',
                        'salles': 'rooms',

                        'cycle': 'cycle',
                        
                        // General Info
                        'quartier': 'neighborhood',
                        'douar': 'neighborhood',
                        'adresse': 'address',
                        'code': 'code',
                        'type': 'type',
                        'capacite': 'capacity',
                        'budget': 'budget',
                        'partenaire': 'partner',
                        'observation': 'observation',
                        'remarque': 'remarks',
                        'source': 'source_data'
                      };

                      // === FILTRAGE AVANCÉ ===
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
                      
                      // Valeurs qui sont des labels/placeholders
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
                          
                          // 2. Exclure clés DÉJÀ traitées par getValue() dans les sections précédentes
                          if (usedKeys.has(key)) return false;
                          
                          // 3. Exclure valeurs invalides/vides
                          if (!valStr || valStr.length < 2 || invalidValues.includes(valStr)) return false;
                          
                          // 4. Exclure objets
                          if (typeof value === 'object') return false;
                          
                          // 5. Dédoublonnage: si valeur déjà vue, ignorer
                          const valNorm = valStr.substring(0, 50); // Comparer premiers 50 chars
                          if (seenValues.has(valNorm)) return false;
                          seenValues.add(valNorm);
                          
                          return true;
                        });
                        //.slice(0, 50); // Removed hard limit to show all info
                      
                      return filteredEntries.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
                           {filteredEntries.map(([key, value]) => {
                             // Determine label
                             // Normalize: Handle CamelCase, underscore -> spaces, remove accents, lower
                             const normKeyForLabel = key
                               .replace(/([a-z])([A-Z])/g, '$1 $2') // split camelCase
                               .replace(/_/g, ' ') // split snake_case
                               .toLowerCase()
                               .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
                               .replace(/[^a-z0-9]/g, " ") // remove special chars
                               .replace(/\s+/g, " ") // collapse spaces
                               .trim();
                             
                             let label = key.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim();
                             
                             // Try to find a mapped translation key - LONGEST MATCH FIRST
                             let mappedKey = null;
                             const sortedMapKeys = Object.keys(keyMap).sort((a, b) => b.length - a.length);
                             
                             for (const mapK of sortedMapKeys) {
                               if (normKeyForLabel.includes(mapK)) {
                                 mappedKey = keyMap[mapK];
                                 break;
                               }
                             }
                             
                             if (mappedKey) {
                               label = t(`labels.${mappedKey}`);
                             }

                             const getIcon = (keyName: string) => {
                               const k = keyName.toLowerCase();
                               if (k.includes('eleve') || k.includes('etudiant') || k.includes('garcon') || k.includes('fille') || k.includes('inscrit')) return Users2;
                               if (k.includes('salle') || k.includes('class') || k.includes('room') || k.includes('const')) return Layout;
                               if (k.includes('enseignant') || k.includes('prof') || k.includes('staff')) return GraduationCap;
                               if (k.includes('annee') || k.includes('date') || k.includes('age')) return Calendar;
                               if (k.includes('mail')) return Mail;
                               if (k.includes('tel') || k.includes('phone') || k.includes('fixe') || k.includes('mobile')) return Phone;
                               if (k.includes('web') || k.includes('site') || k.includes('url')) return Globe;
                               if (k.includes('adress') || k.includes('lieu') || k.includes('douar') || k.includes('quartier') || k.includes('commune') || k.includes('local')) return MapPin;
                               if (k.includes('capacit') || k.includes('places') || k.includes('lit')) return Box;
                               if (k.includes('surface') || k.includes('superficie')) return Ruler;
                               if (k.includes('reussite') || k.includes('score') || k.includes('note') || k.includes('mention')) return Trophy;
                               if (k.includes('budget') || k.includes('cout') || k.includes('finan')) return Activity;
                               return FileText;
                             };

                             const Icon = getIcon(key);
                             
                             return (
                             <div key={key} className="group relative bg-card rounded-lg p-6 border border-border hover:border-[hsl(var(--gov-blue)/0.3)] hover:shadow-md transition-shadow duration-200 flex flex-col items-center text-center h-full justify-center min-h-[180px]">
                                {String(value).startsWith('http') && (
                                   <a href={String(value)} target="_blank" rel="noopener noreferrer" className="absolute top-4 right-4 text-gray-400 hover:text-gov-blue transition-colors">
                                     <Globe className="w-5 h-5" />
                                   </a>
                                )}
                                
                                <div className={`mb-4 p-4 rounded-lg ${config.badge} transition-colors duration-200 shadow-sm`}>
                                  <Icon className="w-7 h-7" />
                                </div>
                                
                                <h4 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-3 line-clamp-2 w-full px-2" title={key}>
                                   {label}
                                </h4>
                                
                                <div className="font-extrabold text-gray-900 leading-tight break-words w-full px-2">
                                  {String(value).startsWith('http') ? (
                                    <a href={String(value)} target="_blank" rel="noopener noreferrer" className="text-gov-blue hover:underline text-base font-bold">
                                      {t('labels.view_site')}
                                    </a>
                                  ) : (
                                     <span className={String(value).length < 20 ? "text-2xl md:text-3xl tracking-tight" : "text-lg leading-snug"}>
                                       {String(value).length > 200 ? String(value).substring(0, 200) + '...' : String(value)}
                                     </span>
                                  )}
                                </div>
                             </div>
                           )})}
                        </div>
                      ) : null;
                    })()}
                </section>

                {/* Services & Programmes */}
                {(etablissement.services.length > 0 || etablissement.programmes.length > 0) && (
                   <section className="bg-white rounded-2xl p-6 lg:p-8 shadow-sm border border-gray-100">
                      <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <span className="w-1.5 h-6 bg-gov-blue rounded-full"/>
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
                               <span key={i} className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${config.badge}`}>
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
                           <span className="w-1.5 h-6 bg-[hsl(var(--gov-blue))] rounded-full"/>
                           {t('sections.gallery')}
                        </h2>
                        <span className="text-sm text-gray-500">{t('labels.photos_count', { count: allImages.length })}</span>
                     </div>
                     
                     <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {allImages.map((img, i) => (
                           <button 
                             key={i}
                             onClick={() => { setActiveImage(i); setShowGallery(true); }}
                             className="group relative aspect-square rounded-xl overflow-hidden bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gov-blue"
                           >
                             <OptimizedImage
                               src={img.urlPublique}
                               alt=""
                               fill
                               className="object-cover group-hover:scale-110 transition-transform duration-500"
                             />
                             <div className="absolute inset-0 bg-[hsl(var(--gov-blue-dark)/0)] group-hover:bg-[hsl(var(--gov-blue-dark)/0.2)] transition-colors" />
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
                      height="h-64"
                    />
                    <div className="p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">{t('sections.location')}</h3>
                        <p className="text-base text-gray-600 mb-6 leading-relaxed">{etablissement.adresseComplete || 'Adresse non disponible'}</p>
                        <a 
                          href={`https://maps.google.com/?q=${etablissement.latitude},${etablissement.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 w-full py-3 bg-gov-blue/10 hover:bg-gov-blue/20 text-gov-blue rounded-xl text-sm font-bold transition-colors"
                        >
                          <MapPin className="w-5 h-5" />
                          {t('buttons.view_on_maps')}
                        </a>
                    </div>
                 </div>

                 {/* Contact Card */}
                 <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                     <h3 className="text-lg font-bold text-gray-900 mb-6">{t('sections.contact')}</h3>
                     <div className="space-y-6">
                        {etablissement.telephone && (
                          <div className="flex items-start gap-4">
                             <div className="w-12 h-12 rounded-2xl bg-gov-green/5 text-gov-green-dark flex items-center justify-center shrink-0 shadow-sm">
                                <Phone className="w-6 h-6" />
                             </div>
                             <div>
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-wide mb-1">{t('labels.phone')}</p>
                               <a href={`tel:${etablissement.telephone}`} className="text-base font-bold text-gray-900 hover:text-gov-green-dark font-mono tracking-tight">
                                  {etablissement.telephone}
                               </a>
                            </div>
                         </div>
                       )}
                       {etablissement.email && (
                         <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 shadow-sm">
                               <Mail className="w-6 h-6" />
                            </div>
                             <div className="min-w-0">
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-wide mb-1">{t('labels.email')}</p>
                                <a href={`mailto:${etablissement.email}`} className="text-base font-bold text-gray-900 hover:text-blue-600 truncate block">
                                   {etablissement.email}
                                </a>
                             </div>
                          </div>
                        )}
                        {etablissement.siteWeb && (
                          <div className="flex items-start gap-4">
                             <div className="w-12 h-12 rounded-2xl bg-[hsl(var(--gov-blue)/0.08)] text-[hsl(var(--gov-blue))] flex items-center justify-center shrink-0 shadow-sm">
                                <Globe className="w-6 h-6" />
                             </div>
                             <div className="min-w-0">
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-wide mb-1">{t('labels.website')}</p>
                                <a href={etablissement.siteWeb} target="_blank" rel="noopener" className="text-base font-bold text-gray-900 hover:text-[hsl(var(--gov-blue))] truncate block">
                                   {t('buttons.visit_site')}
                                </a>
                            </div>
                         </div>
                       )}
                    </div>
                 </div>

                  {/* Stats Card */}
                  <div className="bg-gradient-to-br from-blue-900 to-blue-950 rounded-2xl p-6 shadow-lg text-white ring-1 ring-white/10">
                     <h3 className="font-bold mb-6 text-lg tracking-wide opacity-90">{t('sections.metrics')}</h3>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/5 rounded-2xl p-4 backdrop-blur-md border border-white/5 hover:bg-white/10 transition-colors">
                           <p className="text-3xl font-extrabold mb-1 tracking-tight">{etablissement._count?.evenementsOrganises || 0}</p>
                           <p className="text-sm font-medium opacity-70">{t('labels.events_organized')}</p>
                        </div>
                        <div className="bg-white/5 rounded-2xl p-4 backdrop-blur-md border border-white/5 hover:bg-white/10 transition-colors">
                           <p className="text-3xl font-extrabold mb-1 tracking-tight">{etablissement.capaciteAccueil || '-'}</p>
                           <p className="text-sm font-medium opacity-70">{t('labels.hosting_capacity')}</p>
                        </div>
                        <div className="col-span-2 bg-white/5 rounded-2xl p-4 backdrop-blur-md border border-white/5 hover:bg-white/10 transition-colors flex items-center justify-between">
                           <div>
                              <p className="text-3xl font-extrabold mb-1 tracking-tight">{etablissement.noteMoyenne.toFixed(1)}<span className="text-lg opacity-60 font-normal ml-1">/5</span></p>
                              <p className="text-sm font-medium opacity-70">{t('labels.citizen_satisfaction')}</p>
                           </div>
                          <div>
                             <StarRating rating={Math.round(etablissement.noteMoyenne)} size="lg" />
                          </div>
                       </div>
                    </div>
                 </div>
              </div>
            </motion.div>
          )}

          {/* OTHER TABS: Fully implemented with display fallbacks and premium styling */}
          {activeTab === 'events' && (
             <motion.div 
               key="events"
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
             >
                 {displayEvents.length > 0 ? displayEvents.map((evt, i) => (
                    <EventCard key={evt.id} event={evt} index={i} />
                 )) : (
                    <div className="col-span-full py-20 text-center bg-white rounded-2xl border border-dashed border-gray-300">
                       <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                       <p className="text-gray-500">{t('placeholders.no_events')}</p>
                    </div>
                 )}
             </motion.div>
          )}

          {activeTab === 'actualites' && (
             <motion.div 
               key="actualites"
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
             >
                 {displayActualites.length > 0 ? displayActualites.map((actu, i) => (
                    <NewsCard key={actu.id} news={actu} index={i} />
                 )) : (
                    <div className="col-span-full py-20 text-center bg-white rounded-2xl border border-dashed border-gray-300">
                       <Newspaper className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                       <p className="text-gray-500">{t('placeholders.no_news')}</p>
                    </div>
                 )}
             </motion.div>
          )}

          {activeTab === 'activites' && (
             <motion.div 
               key="activites"
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
             >
                 {displayActivites.length > 0 ? displayActivites.map((act, i) => (
                    <ActivityCard key={act.id} activity={act} index={i} locale={locale} />
                 )) : (
                    <div className="col-span-full py-20 text-center bg-white rounded-2xl border border-dashed border-gray-300">
                       <Activity className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                       <p className="text-gray-500">{t('placeholders.no_activities')}</p>
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
                      <Link href={`/evaluer/${etablissement.id}`} className="inline-flex items-center gap-2 px-8 py-3 bg-gov-gold text-gray-900 rounded-full font-bold shadow-lg hover:bg-gov-gold/10 transition-all">
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
                               <div className="w-10 h-10 rounded-full bg-gov-blue/10 text-gov-blue flex items-center justify-center font-bold">
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

          {/* Placeholders for remaining tabs */}
           {['articles', 'campagnes'].includes(activeTab) && (
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
            className="fixed inset-0 z-50 bg-[hsl(var(--gov-blue-dark)/0.96)] flex items-center justify-center p-4"
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
