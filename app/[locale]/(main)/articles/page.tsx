'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import {
  FileText, Search, Loader2, BookOpen, Filter, X
} from 'lucide-react';
import ArticleCard from '@/components/articles/ArticleCard';

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
  const tPagination = useTranslations('pagination');
  const router = useRouter();
  const searchParams = useSearchParams();

  // State
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [loading, setLoading] = useState(true);
  
  // URL Params
  const search = searchParams.get('search') || '';
  const selectedCategorie = searchParams.get('categorie') || '';
  const page = parseInt(searchParams.get('page') || '1');
  
  // Stats
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Fetch logic
  useEffect(() => {
    const fetchArticles = async () => {
      setLoading(true);
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', '12');
      if (search) params.set('search', search);
      if (selectedCategorie) params.set('categorie', selectedCategorie);

      try {
        const res = await fetch(`/api/articles?${params.toString()}`);
        if (res.ok) {
          const json = await res.json();
          setArticles(json.data || []);
          setCategories(json.categories || []);
          setTotalPages(json.pagination?.totalPages || 1);
          setTotal(json.pagination?.total || 0);
        }
      } catch (error) {
        console.error('Erreur:', error);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchArticles, 300); // 300ms debounce
    return () => clearTimeout(timer);
  }, [page, search, selectedCategorie]);

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

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 lg:py-20 relative z-10 text-center">
            <motion.div 
               initial={{ opacity: 0, y: 20 }} 
               animate={{ opacity: 1, y: 0 }}
               className="max-w-3xl mx-auto"
            >
               <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 text-white/90 text-sm font-medium mb-6">
                  <BookOpen className="w-4 h-4 text-[hsl(45,93%,47%)]" />
                  {t('badge')}
               </div>
               
               <h1 className="text-4xl md:text-5xl font-semibold text-white mb-6 tracking-tight leading-tight">
                  {t('title_prefix')}<span className="text-transparent bg-clip-text bg-gradient-to-r from-[hsl(45,93%,47%)] to-amber-200">{t('title_suffix')}</span>
               </h1>
               
               <p className="text-lg text-blue-100/80 leading-relaxed max-w-2xl mx-auto">
                  {t('hero_subtitle')}
               </p>
            </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        
        {/* ==================== FILTERS ==================== */}
        <div className="flex flex-col lg:flex-row gap-6 mb-10 items-center justify-between">
            <div className="flex-1 w-full lg:max-w-md relative group">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[hsl(213,80%,28%)] transition-colors" size={20} />
               <input
                  type="text"
                  value={search}
                  onChange={(e) => updateFilter('search', e.target.value)}
                  placeholder={t('search_placeholder')}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[hsl(213,80%,28%)]/20 focus:border-[hsl(213,80%,28%)] transition-all shadow-sm"
               />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto w-full lg:w-auto no-scrollbar pb-2 lg:pb-0">
               <button
                  onClick={() => updateFilter('categorie', '')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
                     !selectedCategorie
                        ? 'bg-[hsl(213,80%,28%)] text-white shadow-md shadow-[hsl(213,80%,28%)]/20'
                        : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                  }`}
               >
                  <Filter className="w-4 h-4" />
                  {t('all_categories')}
               </button>
               {categories.map((cat) => (
                  <button
                     key={cat.nom}
                     onClick={() => updateFilter('categorie', cat.nom)}
                     className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
                        selectedCategorie === cat.nom
                           ? 'bg-[hsl(213,80%,28%)] text-white shadow-md shadow-[hsl(213,80%,28%)]/20'
                           : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                     }`}
                  >
                     {t('categories.' + getCategoryKey(cat.nom))}
                     <span className={`ml-1 px-1.5 py-0.5 rounded-md text-xs ${selectedCategorie === cat.nom ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
                        {cat.count}
                     </span>
                  </button>
               ))}
            </div>
        </div>

        {/* ==================== CONTENT GRID ==================== */}
        {loading ? (
             <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
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
                  className="px-5 py-2.5 bg-[hsl(213,80%,28%)] text-white rounded-xl font-medium hover:bg-[hsl(213,80%,35%)] transition-colors inline-flex items-center gap-2"
             >
                <X className="w-4 h-4" />
                {t('reset_filters')}
             </button>
           </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {articles.map((article, index) => (
                <ArticleCard key={article.id} article={article} index={index} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-12 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                 <button
                   onClick={() => setPage(page - 1)}
                   disabled={page <= 1}
                   className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                 >
                   {tPagination('prev')}
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
                   {tPagination('next')}
                 </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function ArticlesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="w-8 h-8 border-4 border-[hsl(213,80%,28%)] border-t-transparent rounded-full animate-spin"></div></div>}>
      <ArticlesContent />
    </Suspense>
  );
}
