'use client';

import { useState, useEffect, useCallback, Suspense, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  X,
  Building2,
  Calendar,
  Newspaper,
  User,
  MapPin,
  Grid3X3,
  List,
  SlidersHorizontal,
  TrendingUp,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
} from 'lucide-react';
import { useTranslations } from 'next-intl';

interface SearchResult {
  id: number;
  type: string;
  title: string;
  subtitle?: string;
  description?: string;
  image?: string;
  url: string;
  metadata?: Record<string, unknown>;
}

interface SearchStats {
  total: number;
  byType: Record<string, number>;
}

interface Suggestion {
  id: number;
  text: string;
  type: string;
  icon: string;
  url: string;
}

const TYPE_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  all: { label: 'Tout', icon: <Grid3X3 size={16} />, color: 'gov-blue' },
  etablissements: { label: 'Établissements', icon: <Building2 size={16} />, color: 'indigo' },
  evenements: { label: 'Événements', icon: <Calendar size={16} />, color: 'purple' },
  actualites: { label: 'Actualités', icon: <Newspaper size={16} />, color: 'orange' },
  users: { label: 'Personnes', icon: <User size={16} />, color: 'teal' },
};

const SECTEURS = [
  'SANTE', 'EDUCATION', 'SPORT', 'CULTURE', 
  'JEUNESSE', 'SOCIAL', 'ENVIRONNEMENT', 'ADMINISTRATION'
];

const getIconForType = (type: string) => {
  switch (type) {
    case 'etablissement': return <Building2 size={20} className="text-indigo-600" />;
    case 'evenement': return <Calendar size={20} className="text-purple-600" />;
    case 'actualite': return <Newspaper size={20} className="text-orange-600" />;
    case 'commune': return <MapPin size={20} className="text-red-600" />;
    default: return <Search size={20} className="text-gray-400" />;
  }
};

// Fonction pour surligner les termes de recherche
function highlightText(text: string, query: string): React.ReactNode {
  if (!query || query.length < 2) return text;
  
  try {
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const parts = text.split(new RegExp(`(${escapedQuery})`, 'gi'));
    return parts.map((part, index) => 
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={index} className="bg-[hsl(45,93%,47%)]/40 text-gray-900 rounded px-0.5 font-medium">
          {part}
        </mark>
      ) : part
    );
  } catch {
    return text;
  }
}

import { useSession } from 'next-auth/react';

function SearchPageContent() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const t = useTranslations('search_page');
  // ... existing hooks ...
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  
  const initialQuery = searchParams.get('q') || '';
  const initialType = searchParams.get('type') || 'all';
  
  const [query, setQuery] = useState(initialQuery);
  const [activeType, setActiveType] = useState(initialType);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [stats, setStats] = useState<SearchStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Filtres
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    secteur: '',
    dateFrom: '',
    dateTo: '',
    commune: '',
  });
  
  // Vue
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  
  // Suggestions
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Charger les recherches récentes
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved).slice(0, 5));
    }
  }, []);

  // Sauvegarder la recherche
  const saveSearch = (term: string) => {
    const updated = [term, ...recentSearches.filter(s => s !== term)].slice(0, 5);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
    setRecentSearches(updated);
  };

  // Effectuer la recherche
  const performSearch = useCallback(async () => {
    if (!query || query.length < 2) {
      setResults([]);
      setStats(null);
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('q', query);
      params.set('type', activeType);
      params.set('limit', '20');
      
      const res = await fetch(`/api/search?${params}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.results || []);
        setStats(data.stats || null);
        setTotalPages(Math.ceil((data.stats?.total || 0) / 20));
        saveSearch(query);
      }
    } catch (error) {
      console.error('Erreur recherche:', error);
    } finally {
      setLoading(false);
    }
  }, [query, activeType]);

  // Charger les suggestions
  const loadSuggestions = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setSuggestions([]);
      return;
    }

    try {
      const res = await fetch(`/api/search/suggestions?q=${encodeURIComponent(searchQuery)}`);
      if (res.ok) {
        const data = await res.json();
        setSuggestions(data.suggestions || []);
      }
    } catch (error) {
      console.error('Erreur suggestions:', error);
    }
  }, []);

  // Effet pour la recherche initiale et les changements
  useEffect(() => {
    performSearch();
  }, [performSearch]);

  // Effet pour les suggestions avec debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      loadSuggestions(query);
    }, 200);
    return () => clearTimeout(timer);
  }, [query, loadSuggestions]);

  // Mettre à jour l'URL
  const updateURL = (newQuery: string, newType: string) => {
    const params = new URLSearchParams();
    if (newQuery) params.set('q', newQuery);
    if (newType !== 'all') params.set('type', newType);
    router.push(`/recherche?${params.toString()}`);
  };

  // Soumettre la recherche
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSuggestions(false);
    updateURL(query, activeType);
    performSearch();
  };

  // Changer le type
  const handleTypeChange = (type: string) => {
    setActiveType(type);
    updateURL(query, type);
  };

  // Sélectionner une suggestion
  const selectSuggestion = (suggestion: Suggestion) => {
    setQuery(suggestion.text);
    setShowSuggestions(false);
    updateURL(suggestion.text, activeType);
  };

  // Grouper les résultats par type
  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.type]) {
      acc[result.type] = [];
    }
    acc[result.type].push(result);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header de recherche - Gouvernemental */}
      <div className="bg-gradient-to-r from-[hsl(213,80%,20%)] to-[hsl(213,80%,30%)] text-white py-12 relative">
        {/* Bande tricolore */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[hsl(348,83%,47%)] via-[hsl(45,93%,47%)] to-[hsl(145,63%,32%)]" />
        
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-3xl font-bold mb-2 text-white">{t('title')}</h1>
          <p className="text-[hsl(45,93%,70%)] mb-8">
            {t('subtitle')}
          </p>
          
          {/* Formulaire de recherche */}
          <form onSubmit={handleSubmit} className="relative">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  placeholder={t('placeholder')}
                  className="w-full pl-12 pr-12 py-4 text-lg text-gray-900 border-2 border-[hsl(45,93%,47%)]/30 rounded-xl focus:border-[hsl(45,93%,47%)] focus:ring-4 focus:ring-[hsl(45,93%,47%)]/20 transition-all bg-white"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => {
                      setQuery('');
                      setResults([]);
                      inputRef.current?.focus();
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X size={20} />
                  </button>
                )}
                
                {/* Suggestions dropdown */}
                {showSuggestions && (suggestions.length > 0 || (recentSearches.length > 0 && !query)) && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
                    {/* Recherches récentes */}
                    {!query && recentSearches.length > 0 && (
                      <div className="p-3 border-b border-gray-100">
                        <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                          <Clock size={12} />
                          {t('recent_searches')}
                        </p>
                        {recentSearches.map((term, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => {
                              setQuery(term);
                              setShowSuggestions(false);
                              updateURL(term, activeType);
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 text-left rounded-lg text-gray-700"
                          >
                            <Clock size={14} className="text-gray-400" />
                            {term}
                          </button>
                        ))}
                      </div>
                    )}
                    
                    {/* Suggestions */}
                    {suggestions.length > 0 && (
                      <div className="py-2">
                        {suggestions.map((suggestion) => (
                          <button
                            key={`${suggestion.type}-${suggestion.id}`}
                            type="button"
                            onClick={() => selectSuggestion(suggestion)}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[hsl(213,80%,28%)]/5 text-left border-b border-gray-50 last:border-0 transition-colors"
                          >
                            <span className="flex items-center justify-center w-8 h-8 bg-gray-50 rounded-lg shrink-0">
                               {getIconForType(suggestion.type)}
                            </span>
                            <div className="flex-1 min-w-0">
                              <span className="text-gray-900 font-medium">{highlightText(suggestion.text, query)}</span>
                              <span className="text-xs text-gray-500 ml-2">{suggestion.type}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="gov-btn gov-btn-gold px-8 flex-1 md:flex-none justify-center"
                >
                  <Search size={18} />
                  <span className="md:hidden lg:inline">{t('search_btn')}</span>
                </button>
                
                <button
                  type="button"
                  onClick={() => setShowFilters(!showFilters)}
                  className={`px-4 py-3 rounded-xl border-2 flex items-center gap-2 font-medium transition-colors justify-center ${
                    showFilters 
                      ? 'bg-white border-[hsl(45,93%,47%)] text-[hsl(213,80%,28%)]' 
                      : 'bg-white/10 border-white/30 text-white hover:bg-white/20'
                  }`}
                >
                  <SlidersHorizontal size={18} />
                  <span className="md:hidden lg:inline">{t('filters')}</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Onglets par type */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center gap-1 py-3 overflow-x-auto">
            {Object.entries(TYPE_CONFIG)
              .filter(([type]) => {
                // Masquer "Personnes" pour les citoyens et non-connectés
                if (type === 'users') {
                  const role = session?.user?.role;
                  return role && ['ADMIN', 'SUPER_ADMIN', 'GOUVERNEUR', 'DELEGATION', 'AUTORITE_LOCALE'].includes(role);
                }
                return true;
              })
              .map(([type, config]) => (
              <button
                key={type}
                onClick={() => handleTypeChange(type)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium whitespace-nowrap transition-all ${
                  activeType === type
                    ? 'bg-[hsl(213,80%,28%)] text-white shadow-lg shadow-[hsl(213,80%,28%)]/20'
                    : 'text-gray-600 hover:bg-[hsl(213,80%,28%)]/10'
                }`}
              >
                {config.icon}
                {t('tabs.' + type)}
                {stats?.byType[type] !== undefined && type !== 'all' && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                    activeType === type ? 'bg-white/20' : 'bg-gray-200'
                  }`}>
                    {stats.byType[type]}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Filtres avancés */}
      {showFilters && (
        <div className="bg-[hsl(213,80%,28%)]/5 border-b border-gray-200 px-4 py-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {activeType === 'etablissements' && (
                <div>
                  <label className="gov-label">{t('filters_section.secteur')}</label>
                  <select
                    value={filters.secteur}
                    onChange={(e) => setFilters({ ...filters, secteur: e.target.value })}
                    className="gov-input gov-select"
                  >
                    <option value="">{t('filters_section.all_sectors')}</option>
                    {SECTEURS.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              )}
              
              {(activeType === 'evenements' || activeType === 'actualites') && (
                <>
                  <div>
                    <label className="gov-label">{t('filters_section.date_from')}</label>
                    <input
                      type="date"
                      value={filters.dateFrom}
                      onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                      className="gov-input"
                    />
                  </div>
                  <div>
                    <label className="gov-label">{t('filters_section.date_to')}</label>
                    <input
                      type="date"
                      value={filters.dateTo}
                      onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                      className="gov-input"
                    />
                  </div>
                </>
              )}
              
              <div>
                <label className="gov-label">{t('filters_section.commune')}</label>
                <input
                  type="text"
                  value={filters.commune}
                  onChange={(e) => setFilters({ ...filters, commune: e.target.value })}
                  placeholder={t('filters_section.commune_placeholder')}
                  className="gov-input"
                />
              </div>
            </div>
            
            <div className="flex justify-end mt-4">
              <button
                onClick={() => setFilters({ secteur: '', dateFrom: '', dateTo: '', commune: '' })}
                className="text-sm text-[hsl(213,80%,28%)] hover:underline"
              >
                                {t('filters_section.reset')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contenu */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Info résultats */}
        {query && stats && (
          <div className="flex items-center justify-between mb-6">
            <p className="text-gray-600">
              <span className="font-semibold text-[hsl(213,80%,28%)]">{stats.total}</span> {t('results.count', { count: stats.total, query })}
            </p>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-[hsl(213,80%,28%)] text-white' : 'text-gray-400 hover:bg-gray-100'}`}
              >
                <List size={18} />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-[hsl(213,80%,28%)] text-white' : 'text-gray-400 hover:bg-gray-100'}`}
              >
                <Grid3X3 size={18} />
              </button>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-[hsl(213,80%,28%)] border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Résultats */}
        {!loading && results.length > 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-8"
          >
            {activeType === 'all' ? (
              // Vue groupée par type
              Object.entries(groupedResults).map(([type, typeResults], groupIndex) => (
                <motion.div 
                  key={type} 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: groupIndex * 0.1 }}
                  className="gov-card p-6 border-l-4 border-[hsl(213,80%,28%)]"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      {TYPE_CONFIG[type]?.icon}
                      {TYPE_CONFIG[type]?.label || type}
                      <span className="text-sm font-normal text-gray-500">
                        ({typeResults.length})
                      </span>
                    </h2>
                    {typeResults.length > 3 && (
                      <button
                        onClick={() => handleTypeChange(type)}
                        className="text-sm text-[hsl(213,80%,28%)] hover:underline font-medium"
                      >
                        {t('results.see_all')}
                      </button>
                    )}
                  </div>
                  
                  <div className={viewMode === 'grid' 
                    ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' 
                    : 'space-y-3'
                  }>
                    {typeResults.slice(0, 3).map((result) => (
                      <ResultCard 
                        key={`${result.type}-${result.id}`} 
                        result={result} 
                        query={query}
                        viewMode={viewMode}
                      />
                    ))}
                  </div>
                </motion.div>
              ))
            ) : (
              // Vue filtrée par type
              <div className={viewMode === 'grid' 
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' 
                : 'space-y-3'
              }>
                {results.map((result) => (
                  <ResultCard 
                    key={`${result.type}-${result.id}`} 
                    result={result} 
                    query={query}
                    viewMode={viewMode}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Aucun résultat */}
        {!loading && query && results.length === 0 && (
          <div className="gov-card text-center py-16">
            <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {t('no_results.title', { query })}
            </h3>
            <p className="text-gray-500 max-w-md mx-auto mb-6">
              {t('no_results.description')}
            </p>
            <div>
              <p className="text-sm text-gray-400 mb-3">{t('no_results.suggestions_title')}</p>
              <div className="flex flex-wrap justify-center gap-2">
                {['Hôpital', 'École', 'Sport', 'Culture'].map((term) => (
                  <button
                    key={term}
                    onClick={() => {
                      setQuery(term);
                      updateURL(term, activeType);
                    }}
                    className="px-4 py-2 bg-[hsl(213,80%,28%)]/10 hover:bg-[hsl(213,80%,28%)]/20 rounded-lg text-sm text-[hsl(213,80%,28%)] font-medium transition-colors"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* État initial */}
        {!loading && !query && (
          <div className="gov-card text-center py-16">
            <Search className="w-20 h-20 text-gray-200 mx-auto mb-6" />
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">
              {t('empty_state.title')}
            </h3>
            <p className="text-gray-500 max-w-md mx-auto mb-8">
              {t('empty_state.description')}
            </p>
            
            <div className="max-w-lg mx-auto">
              <p className="text-sm text-gray-400 mb-3 flex items-center justify-center gap-1">
                <TrendingUp size={14} />
                {t('empty_state.popular')}
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {['Hôpital Provincial', 'Maison de jeunes', 'Terrain de sport', 'Centre culturel', 'École primaire'].map((term) => (
                  <button
                    key={term}
                    onClick={() => {
                      setQuery(term);
                      updateURL(term, activeType);
                    }}
                    className="px-4 py-2 bg-white border border-gray-200 hover:border-[hsl(213,80%,28%)] hover:bg-[hsl(213,80%,28%)]/5 rounded-lg text-sm text-gray-700 transition-colors"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto border-t border-gray-100 pt-8">
               <button className="p-4 bg-blue-50/50 rounded-xl text-center border border-blue-100 hover:bg-blue-50 transition-colors cursor-pointer" onClick={() => handleTypeChange('etablissements')}>
                  <Building2 className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <span className="text-sm font-bold text-blue-900 block">{t('tabs.etablissements')}</span>
               </button>
               <button className="p-4 bg-purple-50/50 rounded-xl text-center border border-purple-100 hover:bg-purple-50 transition-colors cursor-pointer" onClick={() => handleTypeChange('evenements')}>
                  <Calendar className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <span className="text-sm font-bold text-purple-900 block">{t('tabs.evenements')}</span>
               </button>
               <button className="p-4 bg-orange-50/50 rounded-xl text-center border border-orange-100 hover:bg-orange-50 transition-colors cursor-pointer" onClick={() => handleTypeChange('actualites')}>
                  <Newspaper className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                  <span className="text-sm font-bold text-orange-900 block">{t('tabs.actualites')}</span>
               </button>
               <Link href="/carte" className="p-4 bg-indigo-50/50 rounded-xl text-center border border-indigo-100 hover:bg-indigo-50 transition-colors cursor-pointer block">
                  <MapPin className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
                  <span className="text-sm font-bold text-indigo-900 block">{t('empty_state.interactive_map')}</span>
               </Link>
            </div>
          </div>
        )}

        {/* Pagination */}
        {results.length > 0 && totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg border border-gray-200 disabled:opacity-50 hover:bg-gray-50"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="px-4 py-2 text-sm text-gray-600">
              {t('pagination', { page, totalPages })}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-lg border border-gray-200 disabled:opacity-50 hover:bg-gray-50"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Composant pour les cartes de résultat
function ResultCard({ 
  result, 
  query, 
  viewMode 
}: { 
  result: SearchResult; 
  query: string;
  viewMode: 'grid' | 'list';
}) {
  const config = TYPE_CONFIG[result.type];
  
  if (viewMode === 'grid') {
    return (
      <Link
        href={result.url}
        className="block bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg hover:border-[hsl(45,93%,47%)]/50 transition-all group"
      >
        {result.image ? (
          <div className="aspect-video bg-gray-100 relative overflow-hidden">
            <img
              src={result.image}
              alt=""
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <span className="absolute top-2 right-2 px-2 py-1 bg-white/90 backdrop-blur rounded-full text-xs font-medium text-gray-700">
              {config?.label}
            </span>
          </div>
        ) : (
          <div className="aspect-video bg-gradient-to-br from-[hsl(213,80%,28%)]/10 to-[hsl(213,80%,28%)]/5 flex items-center justify-center">
            <div className="text-[hsl(213,80%,28%)] scale-150">
              {config?.icon}
            </div>
          </div>
        )}
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 group-hover:text-[hsl(213,80%,28%)] transition-colors">
            {highlightText(result.title, query)}
          </h3>
          {result.subtitle && (
            <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
              <MapPin size={12} />
              {result.subtitle}
            </p>
          )}
          {result.description && (
            <p className="text-sm text-gray-400 mt-2 line-clamp-2">
              {highlightText(result.description, query)}
            </p>
          )}
        </div>
      </Link>
    );
  }
  
  return (
    <Link
      href={result.url}
      className="flex items-start gap-4 p-4 bg-white rounded-xl border border-gray-200 hover:shadow-md hover:border-[hsl(45,93%,47%)]/50 transition-all group"
    >
      {result.image ? (
        <img
          src={result.image}
          alt=""
          className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
        />
      ) : (
        <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-[hsl(213,80%,28%)]/10 to-[hsl(213,80%,28%)]/5 flex items-center justify-center flex-shrink-0">
          <div className="text-[hsl(213,80%,28%)] scale-150">
            {config?.icon}
          </div>
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-gray-900 group-hover:text-[hsl(213,80%,28%)] transition-colors">
            {highlightText(result.title, query)}
          </h3>
          <span className="flex-shrink-0 text-xs text-[hsl(213,80%,28%)] bg-[hsl(213,80%,28%)]/10 px-2 py-1 rounded-full font-medium">
            {config?.label}
          </span>
        </div>
        {result.subtitle && (
          <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
            <MapPin size={12} />
            {result.subtitle}
          </p>
        )}
        {result.description && (
          <p className="text-sm text-gray-400 mt-2 line-clamp-2">
            {highlightText(result.description, query)}
          </p>
        )}
      </div>
    </Link>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-[hsl(213,80%,28%)] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <SearchPageContent />
    </Suspense>
  );
}
