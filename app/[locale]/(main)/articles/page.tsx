'use client';

import { Suspense, useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import {
  FileText, Search, BookOpen, Filter, X
} from 'lucide-react';
import ArticleCard from '@/components/articles/ArticleCard';
import { Pagination } from '@/components/ui';
import { useData } from '@/hooks/use-data';

interface Article {
  id: number;
  titre: string;
  resume?: string;
  categorie?: string;
  imageCouverture?: string;
  vues: number;
  datePublication?: string;
  createdAt: string;
  auteur?: {
    id: number;
    prenom: string;
    nom: string;
  };
}

interface Categorie {
  nom: string;
  count: number;
}

const getCategoryKey = (cat: string) => {
  return cat.toUpperCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Z0-9]/g, "_");
};

function ArticlesContent() {
  const t = useTranslations('articles_page');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL Params
  const search = searchParams.get('search') || '';
  const selectedCategorie = searchParams.get('categorie') || '';
  const page = parseInt(searchParams.get('page') || '1');
  
  // ECC: useData
  const queryStr = useMemo(() => {
    const params = new URLSearchParams();
    params.set('page', page.toString());
    params.set('limit', '12');
    if (search) params.set('search', search);
    if (selectedCategorie) params.set('categorie', selectedCategorie);
    return params.toString();
  }, [page, search, selectedCategorie]);

  const { data: responseData, isLoading: loading } = useData(`/api/articles?${queryStr}`);
  
  // Support both wrapped and unwrapped response structures
  const articles: Article[] = Array.isArray(responseData?.data?.data)
    ? responseData.data.data
    : Array.isArray(responseData?.data)
      ? responseData.data
      : [];
  const categories: Categorie[] = Array.isArray(responseData?.data?.categories)
    ? responseData.data.categories
    : Array.isArray(responseData?.categories)
      ? responseData.categories
      : [];
  const totalPages = responseData?.data?.pagination?.totalPages || responseData?.pagination?.totalPages || 1;
  const total = responseData?.data?.pagination?.total || responseData?.pagination?.total || 0;

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.set('page', '1');
    router.push(`?${params.toString()}`);
  };

  const setPage = (p: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', p.toString());
    router.replace(`?${params.toString()}`, { scroll: false });
  };

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
        {/* Pattern & Overlay */}
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>
        
        {/* Bande Tricolore Top */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-gov-red via-gov-gold to-gov-green shadow-md z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 lg:py-20 relative z-10 text-center">
            <motion.div 
               initial={{ opacity: 0, y: 20 }} 
               animate={{ opacity: 1, y: 0 }}
               className="max-w-3xl mx-auto"
            >
               <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 text-white/90 text-sm font-medium mb-6">
                  <BookOpen className="w-4 h-4 text-gov-gold" />
                  {t('badge')}
               </div>
               
               <h1 className="text-4xl md:text-5xl font-semibold text-white mb-6 tracking-tight leading-tight">
                  {t('title_prefix')}<span className="text-transparent bg-clip-text bg-gradient-to-r from-gov-gold to-amber-200">{t('title_suffix')}</span>
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
          <aside className="lg:w-72 flex-shrink-0">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200/60 p-5 sticky top-24">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-bold text-gray-900 flex items-center gap-2">
                  <Filter className="w-5 h-5 text-gray-400" />
                  {tCommon('filters.title')}
                </h2>
                {(search || selectedCategorie) && (
                  <button
                    onClick={() => { updateFilter('search', ''); updateFilter('categorie', ''); }}
                    className="text-xs font-medium text-red-600 hover:bg-red-50 px-2 py-1 rounded transition-colors"
                  >
                    {tCommon('actions.reset')}
                  </button>
                )}
              </div>

              {/* Search */}
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
                    className="block w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-gov-blue/10 focus:border-gov-blue focus:bg-white transition-all shadow-inner"
                    placeholder={t('search_placeholder')}
                  />
                </div>
              </div>

              {/* Categories */}
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 block px-1">
                   {t('all_categories')}
                </label>
                <div className="space-y-1.5">
                  <button
                    onClick={() => updateFilter('categorie', '')}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm transition-all group ${
                      !selectedCategorie 
                        ? 'bg-gov-blue text-white font-bold shadow-lg shadow-blue-900/20' 
                        : 'text-gray-600 hover:bg-gray-50 hover:translate-x-1'
                    }`}
                  >
                    {t('all_categories')}
                    {!selectedCategorie && <div className="w-1.5 h-1.5 bg-white rounded-full shadow-sm" />}
                  </button>
                  {(Array.isArray(categories) ? categories : []).map((cat) => (
                    <button
                      key={cat.nom}
                      onClick={() => updateFilter('categorie', cat.nom)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm transition-all group ${
                        selectedCategorie === cat.nom
                          ? 'bg-gov-blue text-white font-bold shadow-lg shadow-blue-900/20'
                          : 'text-gray-600 hover:bg-gray-50 hover:translate-x-1'
                      }`}
                    >
                      <span className="flex-1 text-left truncate">{t('categories.' + getCategoryKey(cat.nom))}</span>
                      <span className={`ml-2 px-2 py-0.5 rounded-lg text-[10px] font-bold transition-colors ${
                        selectedCategorie === cat.nom 
                          ? 'bg-white/20 text-white' 
                          : 'bg-gray-100 text-gray-400 group-hover:bg-gov-blue/10 group-hover:text-gov-blue'
                      }`}>
                        {cat.count}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* ==================== CONTENT LIST ==================== */}
          <main className="flex-1 min-w-0">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
               <div className="text-sm font-medium text-gray-500">
                  {t('showing', { start: (page - 1) * 12 + 1, end: Math.min(page * 12, total), total })}
               </div>
               
               <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-2 px-3 py-1.5 text-gov-blue font-bold text-xs uppercase tracking-wider">
                     <FileText className="w-4 h-4" />
                     {t('badge')}
                  </div>
               </div>
            </div>

            {loading ? (
                 <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-8">
                   {[1,2,3,4,5,6].map(i => (
                      <div key={i} className="bg-white rounded-2xl h-96 animate-pulse border border-gray-100 shadow-sm p-4">
                         <div className="w-full h-48 bg-gray-100 rounded-xl mb-4" />
                         <div className="w-3/4 h-6 bg-gray-100 rounded mb-3" />
                         <div className="w-full h-4 bg-gray-100 rounded mb-2" />
                         <div className="w-2/3 h-4 bg-gray-100 rounded" />
                      </div>
                   ))}
                </div>
            ) : articles.length === 0 ? (
               <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
                 <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                   <FileText className="w-8 h-8 text-gray-400" />
                 </div>
                 <h3 className="text-xl font-bold text-gray-900 mb-2">{t('no_articles')}</h3>
                 <p className="text-gray-500 max-w-sm mx-auto mb-6">{t('no_articles_desc')}</p>
                 <button 
                      onClick={() => { updateFilter('search', ''); updateFilter('categorie', ''); }}
                      className="px-5 py-2.5 bg-gov-blue text-white rounded-xl font-medium hover:bg-[hsl(213,80%,35%)] transition-colors inline-flex items-center gap-2"
                 >
                    <X className="w-4 h-4" />
                    {t('reset_filters')}
                 </button>
               </div>
            ) : (
              <>
                <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-8">
                  {(Array.isArray(articles) ? articles : []).map((article, index) => (
                    <ArticleCard key={article.id} article={article} index={index} />
                  ))}
                </div>

                <Pagination 
                   currentPage={page} 
                   totalPages={totalPages} 
                   onPageChange={setPage} 
                />
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

export default function ArticlesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="w-8 h-8 border-4 border-gov-blue border-t-transparent rounded-full animate-spin"></div></div>}>
      <ArticlesContent />
    </Suspense>
  );
}
