'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import EventCard from '@/components/evenements/EventCard';
import { Pagination } from '@/components/ui';
import { 
  Search, Filter, Calendar, MapPin, List, LayoutGrid, X, 
  PlayCircle, CheckCircle2, Trophy, GraduationCap, Hospital, HeartHandshake, Drama, Building2
} from 'lucide-react';
import { useData } from '@/hooks/use-data';

// Interfaces
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
  capaciteMax?: number;
  nombreInscrits: number;
  nombreVues: number;
  etablissement?: { nom: string } | null;
  commune: { nom: string };
  medias?: { urlPublique: string }[];
  isOrganiseParProvince?: boolean;
}

const SECTEURS = [
  { id: '', label: 'Tous les secteurs', icon: Building2 },
  { id: 'EDUCATION', label: 'Éducation', icon: GraduationCap },
  { id: 'SANTE', label: 'Santé', icon: Hospital },
  { id: 'SPORT', label: 'Sport', icon: Trophy },
  { id: 'SOCIAL', label: 'Social', icon: HeartHandshake },
  { id: 'CULTUREL', label: 'Culturel', icon: Drama },
];

const STATUS_TABS = [
  { id: 'all', label: 'Tous', icon: List },
  { id: 'upcoming', label: 'À venir', icon: Calendar },
  { id: 'EN_ACTION', label: 'En cours', icon: PlayCircle },
  { id: 'CLOTUREE', label: 'Terminés', icon: CheckCircle2 },
];

function EvenementsContent() {
  const t = useTranslations();
  const tCommon = useTranslations('common');
  const router = useRouter();
  const searchParams = useSearchParams();

  // State
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);

  const page = parseInt(searchParams.get('page') || '1');
  const search = searchParams.get('search') || '';
  const secteur = searchParams.get('secteur') || '';
  const statusParam = searchParams.get('status') || 'all';

  // Construct query params for useData
  const queryParams = new URLSearchParams();
  queryParams.set('page', page.toString());
  queryParams.set('limit', '9');
  
  if (search) queryParams.set('search', search);
  if (secteur) queryParams.set('secteur', secteur);
  
  // Status handling logic
  if (statusParam === 'upcoming') queryParams.set('upcoming', 'true');
  else if (statusParam !== 'all') queryParams.set('statut', statusParam);

  // Data fetching using useData
  const { data: eventsResponse, isLoading: loading } = useData(`/api/evenements?${queryParams.toString()}`);
  
  // Handle response structure
  const events = Array.isArray(eventsResponse) ? eventsResponse : eventsResponse?.data || [];
  const pagination = eventsResponse?.pagination || eventsResponse?.meta?.pagination || { totalPages: 1, total: 0 };
  const totalPages = pagination.totalPages || 1;
  const total = pagination.total || 0;

  // Handlers
  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== 'all') params.set(key, value);
    else params.delete(key);
    params.set('page', '1'); // Reset pagination
    router.push(`?${params.toString()}`);
  };

  const setPage = (p: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', p.toString());
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  const resetFilters = () => {
    router.push('/evenements');
  };

  const hasActiveFilters = search || secteur || statusParam !== 'all';

  return (
    <div className="min-h-screen bg-gray-50 relative z-0">
      {/* Background Pattern */}
      <div 
        className="absolute inset-0 z-[-1] opacity-[0.08] pointer-events-none"
        style={{
          backgroundImage: "url('/images/zellige-bg.jpg')",
          backgroundSize: 'cover',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        }}
      />
      {/* ==================== HERO HEADER ==================== */}
      <div className="relative bg-gradient-to-br from-gov-blue-dark to-gov-blue-dark overflow-hidden">
        {/* Background Patterns */}
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>

        
        {/* Bande Tricolore Top */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-gov-red via-gov-gold to-gov-green shadow-md z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 lg:py-16 relative z-10">
          <div className="max-w-4xl mx-auto text-center flex flex-col items-center">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 text-white/90 text-sm font-medium mb-4"
            >
              <Calendar className="w-4 h-4 text-gov-gold" />
              {t('events_page.badge')}
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-3xl md:text-5xl font-semibold text-white mb-4"
            >
              {t('events_page.title')}
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg text-blue-100/80 leading-relaxed max-w-2xl mx-auto"
            >
              {t('events_page.subtitle')}
            </motion.p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* ==================== FILTERS SIDEBAR ==================== */}
          <div className="lg:hidden mb-4">
            <button
               onClick={() => setShowFilters(!showFilters)}
               className="w-full flex items-center justify-between px-4 py-3 bg-white rounded-xl border border-gray-200 shadow-sm text-gray-900 font-semibold"
             >
                 <span className="flex items-center gap-2">
                  <Filter className="w-5 h-5 text-gov-blue" />
                  {t('filters.search_label')}
                </span>
                {hasActiveFilters && (
                  <span className="bg-gov-gold text-gov-blue text-xs font-bold px-2 py-0.5 rounded-full">
                    {tCommon('filters.active')}
                  </span>
                )}
           </button>
          </div>

          <AnimatePresence>
            {(showFilters || (typeof window !== 'undefined' && window.innerWidth >= 1024)) && (
              <motion.aside 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className={`lg:w-80 flex-shrink-0 ${showFilters ? 'block' : 'hidden lg:block'}`}
              >
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200/60 p-5 sticky top-24">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="font-bold text-gray-900 flex items-center gap-2">
                      <Filter className="w-5 h-5 text-gray-400" />
                      {tCommon('filters.title')}
                    </h2>
                    {hasActiveFilters && (
                      <button
                        onClick={resetFilters}
                        className="text-xs font-medium text-red-600 hover:bg-red-50 px-2 py-1 rounded transition-colors"
                      >
                        {tCommon('filters.reset')}
                      </button>
                    )}
                  </div>

                  {/* Search Input Premium */}
                  <div className="mb-8 group">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block px-1">
                      {tCommon('filters.search_label')}
                    </label>
                    <div className="relative">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-gov-blue transition-colors" />
                      <input
                        type="text"
                        value={search}
                        onChange={(e) => updateFilter('search', e.target.value)}
                        placeholder={tCommon('filters.search_placeholder')}
                        className="block w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-gov-blue/10 focus:border-gov-blue focus:bg-white transition-all shadow-inner"
                      />
                    </div>
                  </div>

                  {/* Status Tabs */}
                  <div className="mb-8">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 block px-1">{tCommon('filters.status')}</label>
                    <div className="space-y-1.5">
                      {STATUS_TABS.map(tab => {
                        const labelKey = tab.id === 'all' ? 'all_status' : 
                                       tab.id === 'upcoming' ? 'upcoming' : 
                                       tab.id === 'EN_ACTION' ? 'in_progress' : 'completed';
                        return (
                          <button
                            key={tab.id}
                            onClick={() => updateFilter('status', tab.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all group ${
                              statusParam === tab.id
                                ? 'bg-gov-blue text-white shadow-lg shadow-blue-900/20 font-bold'
                                : 'text-gray-600 hover:bg-gray-50 hover:translate-x-1'
                            }`}
                          >
                            <tab.icon className={`w-4 h-4 transition-colors ${statusParam === tab.id ? 'text-white' : 'text-gray-400 group-hover:text-gov-blue'}`} />
                            {tCommon(`filters.${labelKey}`)}
                            {statusParam === tab.id && <motion.div layoutId="statusDot" className="ml-auto w-1.5 h-1.5 bg-white rounded-full shadow-sm" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Secteurs */}
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 block px-1">{tCommon('filters.sector')}</label>
                    <div className="space-y-1.5">
                      {SECTEURS.map(s => (
                        <button
                          key={s.id}
                          onClick={() => updateFilter('secteur', s.id)}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all group ${
                            secteur === s.id
                              ? 'bg-gov-green/5 text-gov-green-dark font-bold border border-gov-green/30/50 shadow-sm'
                              : 'text-gray-600 hover:bg-gray-50 border border-transparent hover:translate-x-1'
                          }`}
                        >
                          <s.icon className={`w-4 h-4 transition-colors ${secteur === s.id ? 'text-gov-green-dark' : 'text-gray-400 group-hover:text-gov-green'}`} />
                          {s.id === '' ? tCommon('filters.all_sectors') : tCommon(`sectors.${s.id === 'CULTUREL' ? 'culture' : s.id.toLowerCase()}`)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.aside>
            )}
          </AnimatePresence>

          {/* ==================== RESULTS GRID ==================== */}
          <main className="flex-1 min-w-0">
             {/* Toolbar */}
             <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
               <div className="text-sm text-gray-500">
                 {t('events_page.showing', { start: (page - 1) * 9 + 1, end: Math.min(page * 9, total), total })}
               </div>
               
               <div className="flex bg-gray-100 p-1 rounded-lg">
                  <button
                    onClick={() => setView('grid')}
                    className={`p-2 rounded-md transition-all ${view === 'grid' ? 'bg-white text-gov-blue shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setView('list')}
                    className={`p-2 rounded-md transition-all ${view === 'list' ? 'bg-white text-gov-blue shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    <List className="w-4 h-4" />
                  </button>
               </div>
            </div>

            {loading ? (
               <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="bg-white rounded-2xl h-96 p-4 animate-pulse border border-gray-100 shadow-sm">
                       <div className="w-full h-48 bg-gray-200 rounded-xl mb-4" />
                       <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                       <div className="h-4 bg-gray-200 rounded w-1/2 mb-4" />
                       <div className="h-20 bg-gray-100 rounded-xl" />
                    </div>
                  ))}
               </div>
            ) : events.length === 0 ? (
               <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
                 <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                   <Calendar className="w-8 h-8 text-gray-400" />
                 </div>
                 <h3 className="text-lg font-bold text-gray-900 mb-2">{t('events_page.empty_title')}</h3>
                 <p className="text-gray-500 max-w-sm mx-auto mb-6">{t('events_page.empty_desc')}</p>
                 <button onClick={resetFilters} className="px-5 py-2.5 bg-gov-blue text-white rounded-xl font-medium hover:bg-[hsl(213,80%,35%)] transition-colors inline-flex items-center gap-2">
                   <X className="w-4 h-4" />
                   {t('filters.reset')}
                 </button>
               </div>
            ) : (
               <>
                  <div className={view === 'grid' ? 'grid md:grid-cols-2 xl:grid-cols-3 gap-6' : 'flex flex-col gap-4'}>
                     <AnimatePresence mode="popLayout">
                        {events.map((event: any, index: any) => (
                           <EventCard key={event.id} event={event} index={index} view={view} />
                        ))}
                     </AnimatePresence>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                     <Pagination 
                        currentPage={page} 
                        totalPages={totalPages} 
                        onPageChange={setPage} 
                     />
                  )}
               </>
            )}

          </main>
        </div>
      </div>
    </div>
  );
}

export default function EvenementsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="w-8 h-8 border-4 border-gov-blue border-t-transparent rounded-full animate-spin"></div></div>}>
      <EvenementsContent />
    </Suspense>
  );
}
