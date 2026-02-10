'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import EtablissementCard from '@/components/etablissements/EtablissementCard';
import { Building2, GraduationCap, Hospital, Trophy, HeartHandshake, Drama, Search, Filter, X, LayoutGrid, List } from 'lucide-react';

interface Etablissement {
  id: number;
  code: string;
  nom: string;
  secteur: string;
  photoPrincipale?: string;
  noteMoyenne: number;
  nombreEvaluations: number;
  commune: { nom: string };
  annexe?: { nom: string } | null;
  nature?: string;
  _count?: {
    evaluations: number;
    reclamations: number;
    evenements: number;
    actualites: number;
  };
}

interface Commune {
  id: number;
  nom: string;
}

const secteurs = [
  { id: '', label: 'Tous les secteurs', icon: Building2 },
  { id: 'EDUCATION', label: 'Éducation', icon: GraduationCap },
  { id: 'SANTE', label: 'Santé', icon: Hospital },
  { id: 'SPORT', label: 'Sport', icon: Trophy },
  { id: 'SOCIAL', label: 'Social', icon: HeartHandshake },
  { id: 'CULTUREL', label: 'Culturel', icon: Drama },
];

const noteFilters = [
  { id: 0, label: 'Toutes les notes', stars: 0 },
  { id: 4, label: 'Excellents (4+)', stars: 4 },
  { id: 3, label: 'Très bons (3+)', stars: 3 },
  { id: 2, label: 'Bons (2+)', stars: 2 },
];

function EtablissementsContent() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [etablissements, setEtablissements] = useState<Etablissement[]>([]);
  const [communes, setCommunes] = useState<Commune[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  
  // Filters - initialize from URL params
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [secteur, setSecteur] = useState(searchParams.get('secteur') || '');
  const [communeId, setCommuneId] = useState(searchParams.get('communeId') || '');
  const [noteMin, setNoteMin] = useState(parseInt(searchParams.get('noteMin') || '0') || 0);
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Mobile sidebar
  const [showFilters, setShowFilters] = useState(false);
  
  // Update filters when URL params change
  useEffect(() => {
    const urlSecteur = searchParams.get('secteur') || '';
    const urlCommuneId = searchParams.get('communeId') || '';
    const urlSearch = searchParams.get('search') || '';
    const urlNoteMin = parseInt(searchParams.get('noteMin') || '0') || 0;
    
    if (urlSecteur !== secteur) setSecteur(urlSecteur);
    if (urlCommuneId !== communeId) setCommuneId(urlCommuneId);
    if (urlSearch !== search) setSearch(urlSearch);
    if (urlNoteMin !== noteMin) setNoteMin(urlNoteMin);
  }, [searchParams]);

  // Fetch communes
  useEffect(() => {
    fetch('/api/communes')
      .then(res => res.json())
      .then(json => setCommunes(json.data || []));
  }, []);

  // Fetch etablissements
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', '12'); // Fixed limit for clearer pagination logic
      if (search) params.set('search', search);
      if (secteur) params.set('secteur', secteur);
      if (communeId) params.set('communeId', communeId);
      if (noteMin > 0) params.set('noteMin', noteMin.toString());

      try {
        const res = await fetch(`/api/etablissements?${params.toString()}`);
        const json = await res.json();
        setEtablissements(json.data || []);
        setTotalPages(json.pagination?.totalPages || 1);
        setTotal(json.pagination?.total || 0);
      } catch (error) {
        console.error('Erreur:', error);
      }
      setLoading(false);
    };

    const timer = setTimeout(fetchData, 300);
    return () => clearTimeout(timer);
  }, [page, search, secteur, communeId, noteMin]);

  // Reset page on filter change
  useEffect(() => {
    setPage(1);
  }, [search, secteur, communeId, noteMin]);

  // Update URL on filter change (Debounced to avoid history spam on type)
  // Implementing simplified URL sync for key filter changes
  const updateUrlParams = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== '0') {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  const resetFilters = () => {
    setSearch('');
    setSecteur('');
    setCommuneId('');
    setNoteMin(0);
    setPage(1);
    router.replace('/etablissements');
  };

  const hasActiveFilters = search || secteur || communeId || noteMin > 0;

  return (
    <div className="min-h-screen bg-gray-50 pt-[72px]">
        {/* ==================== HERO HEADER ==================== */}
        <div className="relative bg-gradient-to-br from-[hsl(213,80%,20%)] to-[hsl(213,80%,30%)] overflow-hidden">
          {/* Background Patterns */}
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>

          
          {/* Bande Tricolore Top */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[hsl(348,83%,47%)] via-[hsl(45,93%,47%)] to-[hsl(145,63%,32%)] shadow-md z-10" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 lg:py-10 relative z-10">
            <div className="max-w-4xl mx-auto text-center flex flex-col items-center">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 text-white/90 text-sm font-medium mb-4"
              >
                <Building2 className="w-4 h-4 text-[hsl(45,93%,47%)]" />
                {t('directory.badge')}
              </motion.div>
              
              <motion.h1 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-3xl md:text-5xl font-semibold text-white mb-4"
              >
                {t('directory.title')}
              </motion.h1>
              
              <motion.p 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-lg text-blue-100/80 leading-relaxed max-w-2xl mx-auto"
              >
                {t('directory.subtitle')}
              </motion.p>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* ==================== SEARCH & FILTERS SIDEBAR ==================== */}
            
            {/* Mobile Toggle Button */}
            <div className="lg:hidden mb-4">
               <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-white rounded-xl border border-gray-200 shadow-sm text-gray-900 font-semibold"
                >
                  <span className="flex items-center gap-2">
                    <Filter className="w-5 h-5 text-[hsl(213,80%,28%)]" />
                    {t('filters.search_label')}
                  </span>
                  {hasActiveFilters && (
                    <span className="bg-[hsl(45,93%,47%)] text-[hsl(213,80%,28%)] text-xs font-bold px-2 py-0.5 rounded-full">
                      {t('filters.active')}
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
                    {t('filters.title')}
                  </h2>
                  {hasActiveFilters && (
                    <button
                      onClick={resetFilters}
                      className="text-xs font-medium text-red-600 hover:bg-red-50 px-2 py-1 rounded transition-colors"
                    >
                      {t('filters.clear')}
                    </button>
                  )}
                </div>

                {/* Search Input */}
                <div className="mb-6 relative z-20">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    onFocus={(e) => e.stopPropagation()}
                    onKeyDown={(e) => {
                      e.stopPropagation();
                      if (e.key === 'Enter') {
                        e.preventDefault();
                      }
                    }}
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl bg-gray-50/50 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[hsl(213,80%,28%)]/20 focus:border-[hsl(213,80%,28%)] transition-all text-sm cursor-text pointer-events-auto"
                    placeholder={t('filters.search_etablissement')}
                    style={{ pointerEvents: 'auto' }}
                  />
                </div>

                {/* Secteur Filter */}
                <div className="mb-6">
                  <label className={`text-xs font-semibold text-gray-500 mb-3 block ${locale === 'ar' ? '' : 'uppercase tracking-wider'}`}>{t('filters.sector')}</label>
                  <div className="space-y-1">
                    {secteurs.map(s => (
                      <button
                        key={s.id}
                        onClick={() => { setSecteur(s.id); updateUrlParams('secteur', s.id); }}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                          secteur === s.id
                            ? 'bg-[hsl(213,80%,28%)] text-white shadow-md shadow-[hsl(213,80%,28%)]/20 font-medium'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <s.icon className={`w-4 h-4 ${secteur === s.id ? 'text-white' : 'text-gray-400'}`} />
                        <span>{s.id === '' ? t('filters.all_sectors') : t(`sectors.${s.id === 'CULTUREL' ? 'culture' : s.id.toLowerCase()}`)}</span>
                        {secteur === s.id && (
                          <motion.div layoutId="activeFilter" className="ml-auto w-1.5 h-1.5 bg-white rounded-full" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Commune Filter */}
                <div className="mb-6">
                  <label className={`text-xs font-semibold text-gray-500 mb-2 block ${locale === 'ar' ? '' : 'uppercase tracking-wider'}`}>{t('filters.location')}</label>
                  <select
                    value={communeId}
                    onChange={(e) => { setCommuneId(e.target.value); updateUrlParams('communeId', e.target.value); }}
                    className="block w-full py-2.5 px-3 border border-gray-200 bg-white rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[hsl(213,80%,28%)]/20 focus:border-[hsl(213,80%,28%)] sm:text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <option value="">{t('filters.all_communes')}</option>
                    {communes.map(c => (
                      <option key={c.id} value={c.id}>{c.nom}</option>
                    ))}
                  </select>
                </div>

                {/* Note Filter */}
                <div>
                  <label className={`text-xs font-semibold text-gray-500 mb-3 block ${locale === 'ar' ? '' : 'uppercase tracking-wider'}`}>{t('filters.note')}</label>
                  <div className="space-y-2">
                    {noteFilters.map(n => (
                      <label 
                        key={n.id}
                        className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all border ${
                          noteMin === n.id 
                            ? 'bg-amber-50 border-amber-200' 
                            : 'border-transparent hover:bg-gray-50'
                        }`}
                        onClick={() => { setNoteMin(n.id); updateUrlParams('noteMin', n.id.toString()); }}
                      >
                        <div className="flex items-center gap-2">
                          <input 
                              type="radio" 
                              name="noteMin" 
                              checked={noteMin === n.id}
                              onChange={() => {}}
                              className="sr-only" 
                          />
                          <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                             noteMin === n.id ? 'border-amber-500 bg-amber-500' : 'border-gray-300 bg-white'
                          }`}>
                            {noteMin === n.id && <span className="w-1.5 h-1.5 bg-white rounded-full" />}
                          </span>
                          <span className={`text-sm ${noteMin === n.id ? 'font-medium text-amber-900' : 'text-gray-600'}`}>
                            {n.id === 0 ? t('filters.all_notes') : n.id === 4 ? t('filters.excellent') : n.id === 3 ? t('filters.very_good') : t('filters.good')}
                          </span>
                        </div>
                        {n.stars > 0 && (
                          <div className="flex text-amber-400">
                             {[...Array(n.stars)].map((_, i) => (
                               <svg key={i} className="w-3 h-3 fill-current" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                             ))}
                          </div>
                        )}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </motion.aside>
            )}
            </AnimatePresence>

            {/* ==================== MAIN CONTENT LIST ==================== */}
            <main className="flex-1 min-w-0">
              {/* Results Toolbar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div>
                   <h2 className="text-lg font-bold text-gray-800">{t('directory.results')}</h2>
                   <p className="text-sm text-gray-500">
                     {t('directory.showing', { start: (page - 1) * 12 + 1, end: Math.min(page * 12, total), total })}
                   </p>
                </div>

                {/* View Switcher */}
                <div className="flex bg-gray-100 p-1 rounded-lg self-end sm:self-auto">
                  <button
                    onClick={() => setView('grid')}
                    className={`p-2 rounded-md transition-all ${
                      view === 'grid' 
                        ? 'bg-white text-[hsl(213,80%,28%)] shadow-sm' 
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                    title="Vue Grille"
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setView('list')}
                    className={`p-2 rounded-md transition-all ${
                      view === 'list' 
                        ? 'bg-white text-[hsl(213,80%,28%)] shadow-sm' 
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                    title="Vue Liste"
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Loader */}
              {loading ? (
                <div className={view === 'grid' ? 'grid md:grid-cols-2 xl:grid-cols-3 gap-6' : 'space-y-4'}>
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm animate-pulse h-64">
                       <div className="w-full h-32 bg-gray-200 rounded-xl mb-4" />
                       <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                       <div className="h-3 bg-gray-200 rounded w-1/2" />
                    </div>
                  ))}
                </div>
              ) : etablissements.length === 0 ? (
                <motion.div 
                   initial={{ opacity: 0, scale: 0.95 }}
                   animate={{ opacity: 1, scale: 1 }}
                   className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center"
                >
                   <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                     <Search className="w-8 h-8 text-gray-400" />
                   </div>
                   <h3 className="text-lg font-bold text-gray-900 mb-1">{t('directory.empty_title')}</h3>
                   <p className="text-gray-500 max-w-sm mx-auto mb-6">
                     {t('directory.empty_desc')}
                   </p>
                   <button 
                     onClick={resetFilters}
                     className="px-5 py-2.5 bg-[hsl(213,80%,28%)] text-white rounded-xl font-medium hover:bg-[hsl(213,80%,35%)] transition-colors inline-flex items-center gap-2"
                   >
                     <X className="w-4 h-4" />
                     {t('directory.reset_filters')}
                   </button>
                </motion.div>
              ) : (
                <>
                  <div className={view === 'grid' ? 'grid md:grid-cols-2 xl:grid-cols-3 gap-6' : 'space-y-4'}>
                    <AnimatePresence mode="popLayout">
                      {etablissements.map((etab, index) => (
                        <EtablissementCard 
                          key={etab.id} 
                          etablissement={etab} 
                          index={index} 
                          view={view}
                        />
                      ))}
                    </AnimatePresence>
                  </div>

                  {/* Enhanced Pagination */}
                  {totalPages > 1 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-10 pt-6 border-t border-gray-200">
                      <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {t('pagination.prev')}
                      </button>

                      <div className="flex items-center gap-2">
                        {/* Logic to show partial pages if too many */}
                        {[...Array(totalPages)].map((_, i) => {
                          const p = i + 1;
                          // Simple pagination logic: show first, last, current, and adjacent
                          if (p === 1 || p === totalPages || (p >= page - 1 && p <= page + 1)) {
                             return (
                               <button
                                 key={p}
                                 onClick={() => setPage(p)}
                                 className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-all ${
                                   page === p
                                     ? 'bg-[hsl(213,80%,28%)] text-white shadow-md'
                                     : 'text-gray-600 hover:bg-gray-100'
                                 }`}
                               >
                                 {p}
                               </button>
                             );
                          } else if (p === page - 2 || p === page + 2) {
                             return <span key={p} className="text-gray-400">...</span>;
                          }
                          return null;
                        })}
                      </div>

                      <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {t('pagination.next')}
                      </button>
                    </div>
                  )}
                </>
              )}
            </main>
          </div>
        </div>
      </div>
  );
}

export default function EtablissementsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="w-8 h-8 border-4 border-[hsl(213,80%,28%)] border-t-transparent rounded-full animate-spin"></div></div>}>
      <EtablissementsContent />
    </Suspense>
  );
}
