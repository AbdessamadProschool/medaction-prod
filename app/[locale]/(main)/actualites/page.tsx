'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { 
  Search, Newspaper, LayoutGrid, List, Filter 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import NewsCard from '@/components/actualites/NewsCard';

// Configuration Secteurs (Couleurs Context7)
const CATEGORIES = [
  'Annonce', 'Événement', 'Rénovation', 'Service', 'Projet', 'Partenariat', 'Autre'
];

const getCategoryKey = (cat: string) => {
  return cat.toUpperCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Z0-9]/g, "_");
};

interface Actualite {
  id: number;
  titre: string;
  description: string | null;
  contenu: string;
  categorie: string | null;
  tags: string[];
  nombreVues: number;
  datePublication: string | null;
  createdAt: string;
  etablissement: {
    id: number;
    nom: string;
    secteur: string;
    commune: { nom: string };
  };
  medias: { urlPublique: string }[];
}

function ActualitesContent() {
  const t = useTranslations('news_page');
  const tPagination = useTranslations('pagination');
  const router = useRouter();
  const searchParams = useSearchParams();

  // State
  const [actualites, setActualites] = useState<Actualite[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Filters from URL
  const search = searchParams.get('search') || '';
  const categorie = searchParams.get('categorie') || '';
  const page = parseInt(searchParams.get('page') || '1');

  // Stats
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Fetch Data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', '9');
      if (search) params.set('search', search);
      if (categorie) params.set('categorie', categorie);

      const res = await fetch(`/api/actualites?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setActualites(json.data || []);
        setTotalPages(json.pagination?.totalPages || 1);
        setTotal(json.pagination?.total || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, search, categorie]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Update URL helper
  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.set('page', '1'); // Reset page on filter
    router.push(`?${params.toString()}`);
  };

  const setPage = (p: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', p.toString());
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-[72px]">
      {/* ==================== HERO HEADER ==================== */}
      <div className="relative bg-gradient-to-br from-[hsl(213,80%,20%)] to-[hsl(213,80%,30%)] overflow-hidden">
        {/* Pattern & Overlay */}
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>

        
        {/* Bande Tricolore Top */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[hsl(348,83%,47%)] via-[hsl(45,93%,47%)] to-[hsl(145,63%,32%)] shadow-md z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 lg:py-20 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto text-center flex flex-col items-center"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 text-white/90 text-sm font-medium mb-6">
              <Newspaper className="w-4 h-4 text-[hsl(45,93%,47%)]" />
              {t('badge')}
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold text-white mb-6 tracking-tight leading-tight">
              {t('title_prefix')}<span className="text-transparent bg-clip-text bg-gradient-to-r from-[hsl(45,93%,47%)] to-amber-200">{t('title_suffix')}</span>
            </h1>
            
            <p className="text-lg text-blue-100/80 leading-relaxed max-w-2xl mx-auto">
              {t('hero_subtitle')}
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* ==================== SIDEBAR FILTERS ==================== */}
          <div className="lg:hidden mb-4">
             <button
                onClick={() => setShowMobileFilters(!showMobileFilters)}
                className="w-full flex items-center justify-between px-4 py-3 bg-white rounded-xl border border-gray-200 shadow-sm text-gray-900 font-semibold"
              >
                <span className="flex items-center gap-2">
                  <Filter className="w-5 h-5 text-[hsl(213,80%,28%)]" />
                  {t('filter_mobile')}
                </span>
            </button>
          </div>

          <AnimatePresence>
            {(showMobileFilters || (typeof window !== 'undefined' && window.innerWidth >= 1024)) && (
              <motion.aside 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className={`lg:w-72 flex-shrink-0 ${showMobileFilters ? 'block' : 'hidden lg:block'}`}
              >
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200/60 p-5 sticky top-24">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="font-bold text-gray-900 flex items-center gap-2">
                      <Search className="w-5 h-5 text-gray-400" />
                      {t('search_title')}
                    </h2>
                    {(search || categorie) && (
                      <button
                        onClick={() => router.push('/actualites')}
                        className="text-xs font-medium text-red-600 hover:bg-red-50 px-2 py-1 rounded transition-colors"
                      >
                        {t('reset')}
                      </button>
                    )}
                  </div>

                  {/* Search Input */}
                  <div className="mb-6 relative">
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => updateFilter('search', e.target.value)}
                      className="block w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(213,80%,28%)]/20 focus:border-[hsl(213,80%,28%)] transition-all"
                      placeholder={t('search_placeholder')}
                    />
                  </div>

                  {/* Categories */}
                  <div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">{t('categories_title')}</h3>
                    <div className="space-y-1">
                      <button
                        onClick={() => updateFilter('categorie', '')}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all ${
                          !categorie 
                            ? 'bg-[hsl(213,80%,28%)] text-white font-medium shadow-md shadow-blue-900/10' 
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {t('all_news')}
                        {!categorie && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                      </button>
                      {CATEGORIES.map(cat => (
                        <button
                          key={cat}
                          onClick={() => updateFilter('categorie', cat)}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all ${
                            categorie === cat
                              ? 'bg-[hsl(213,80%,28%)] text-white font-medium shadow-md shadow-blue-900/10'
                              : 'text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          {t('categories.' + getCategoryKey(cat))}
                          {categorie === cat && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.aside>
            )}
          </AnimatePresence>

          {/* ==================== CONTENT LIST ==================== */}
          <main className="flex-1 min-w-0">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
               <div className="text-sm text-gray-500">
                 {t('showing', { start: (page - 1) * 9 + 1, end: Math.min(page * 9, total), total })}
               </div>
               
               <div className="flex bg-gray-100 p-1 rounded-lg">
                  <button
                    onClick={() => setView('grid')}
                    className={`p-2 rounded-md transition-all ${view === 'grid' ? 'bg-white text-[hsl(213,80%,28%)] shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setView('list')}
                    className={`p-2 rounded-md transition-all ${view === 'list' ? 'bg-white text-[hsl(213,80%,28%)] shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    <List className="w-4 h-4" />
                  </button>
               </div>
            </div>

            {loading ? (
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                 {[1,2,3,4,5,6].map(i => (
                   <div key={i} className="bg-white rounded-2xl h-80 animate-pulse border border-gray-100 shadow-sm" />
                 ))}
              </div>
            ) : actualites.length === 0 ? (
               <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
                 <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                   <Search className="w-8 h-8 text-gray-400" />
                 </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{t('no_news_found')}</h3>
                  <button onClick={() => router.push('/actualites')} className="text-[hsl(213,80%,28%)] font-medium hover:underline">
                    {t('reset_filters')}
                  </button>
               </div>
            ) : (
              <>
                <div className={view === 'grid' ? 'grid md:grid-cols-2 xl:grid-cols-3 gap-6' : 'flex flex-col gap-4'}>
                  <AnimatePresence mode="popLayout">
                    {actualites.map((actu, idx) => (
                       <NewsCard key={actu.id} news={actu} view={view} index={idx} />
                    ))}
                  </AnimatePresence>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-12 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <button
                      onClick={() => setPage(page - 1)}
                      disabled={page <= 1}
                      className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {t('previous')}
                    </button>
                    
                    <div className="flex items-center gap-1">
                      {[...Array(totalPages)].map((_, i) => {
                         const p = i + 1;
                         if (p === 1 || p === totalPages || (p >= page - 1 && p <= page + 1)) {
                           return (
                             <button
                               key={p}
                               onClick={() => setPage(p)}
                               className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-bold transition-all ${
                                 page === p 
                                  ? 'bg-[hsl(213,80%,28%)] text-white shadow-md' 
                                  : 'text-gray-500 hover:bg-gray-50'
                               }`}
                             >
                               {p}
                             </button>
                           );
                         }
                         if (p === page - 2 || p === page + 2) return <span key={p} className="text-gray-300">...</span>;
                         return null;
                      })}
                    </div>

                    <button
                      onClick={() => setPage(page + 1)}
                      disabled={page >= totalPages}
                      className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {t('next')}
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

export default function ActualitesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="w-8 h-8 border-4 border-[hsl(213,80%,28%)] border-t-transparent rounded-full animate-spin"></div></div>}>
      <ActualitesContent />
    </Suspense>
  );
}
