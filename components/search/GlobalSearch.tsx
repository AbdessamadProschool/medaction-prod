'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  X,
  Loader2,
  Building2,
  Calendar,
  Newspaper,
  User,
  MapPin,
  ArrowRight,
  Clock,
  TrendingUp,
} from 'lucide-react';

interface Suggestion {
  id: number;
  text: string;
  type: string;
  icon: string;
  url: string;
}

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

interface GlobalSearchProps {
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
  showFilters?: boolean;
  onResultClick?: (result: SearchResult) => void;
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  etablissements: <Building2 size={16} className="text-blue-500" />,
  evenements: <Calendar size={16} className="text-purple-500" />,
  actualites: <Newspaper size={16} className="text-orange-500" />,
  users: <User size={16} className="text-teal-500" />,
  commune: <MapPin size={16} className="text-red-500" />,
};

const TYPE_LABELS: Record<string, string> = {
  etablissements: 'Établissement',
  evenements: 'Événement',
  actualites: 'Actualité',
  users: 'Personne',
  reclamations: 'Réclamation',
};

export default function GlobalSearch({
  placeholder = 'Rechercher...',
  className = '',
  autoFocus = false,
  showFilters = false,
  onResultClick,
}: GlobalSearchProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [popularSearches, setPopularSearches] = useState<string[]>([]);

  // Debounce la recherche
  const debounceRef = useRef<NodeJS.Timeout>();

  // Recherche avec debounce
  const performSearch = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setSuggestions([]);
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      // Récupérer les suggestions
      const suggestionsRes = await fetch(
        `/api/search/suggestions?q=${encodeURIComponent(searchQuery)}&type=${selectedType}`
      );
      if (suggestionsRes.ok) {
        const data = await suggestionsRes.json();
        setSuggestions(data.suggestions || []);
        setPopularSearches(data.popularSearches || []);
      }

      // Récupérer les résultats complets
      const resultsRes = await fetch(
        `/api/search?q=${encodeURIComponent(searchQuery)}&type=${selectedType}&limit=10`
      );
      if (resultsRes.ok) {
        const data = await resultsRes.json();
        setResults(data.results || []);
      }
    } catch (error) {
      console.error('Erreur recherche:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedType]);

  // Effet pour le debounce
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (query.length >= 2) {
      debounceRef.current = setTimeout(() => {
        performSearch(query);
      }, 300);
    } else {
      setSuggestions([]);
      setResults([]);
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, performSearch]);

  // Fermer le dropdown quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Gérer la navigation avec le clavier
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    } else if (e.key === 'Enter' && query.length >= 2) {
      router.push(`/recherche?q=${encodeURIComponent(query)}&type=${selectedType}`);
      setIsOpen(false);
    }
  };

  // Cliquer sur un résultat
  const handleResultClick = (result: SearchResult) => {
    if (onResultClick) {
      onResultClick(result);
    } else {
      router.push(result.url);
    }
    setIsOpen(false);
    setQuery('');
  };

  // Cliquer sur une suggestion
  const handleSuggestionClick = (suggestion: Suggestion) => {
    router.push(suggestion.url);
    setIsOpen(false);
    setQuery('');
  };

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {/* Input de recherche */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="w-full pl-10 pr-10 py-2.5 bg-gray-100 border border-transparent rounded-xl focus:bg-white focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-all"
        />
        {loading && (
          <Loader2 className="absolute right-10 top-1/2 -translate-y-1/2 text-blue-500 animate-spin" size={16} />
        )}
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setSuggestions([]);
              setResults([]);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Dropdown des résultats */}
      {isOpen && (query.length >= 2 || results.length > 0) && (
        <div 
          className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-[100]"
          style={{ maxHeight: 'min(70vh, 500px)' }}
        >
          <div className="overflow-y-auto" style={{ maxHeight: 'min(70vh, 500px)' }}>
          {showFilters && (
            <div className="px-3 py-2 border-b border-gray-100 flex gap-2 overflow-x-auto">
              {['all', 'etablissements', 'evenements', 'actualites'].map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                    selectedType === type
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {type === 'all' ? 'Tout' : TYPE_LABELS[type] || type}
                </button>
              ))}
            </div>
          )}

          {/* Suggestions rapides */}
          {suggestions.length > 0 && (
            <div className="p-2 border-b border-gray-100">
              <p className="px-2 py-1 text-xs font-medium text-gray-400 uppercase">Suggestions</p>
              {suggestions.map((suggestion, index) => (
                <button
                  key={`${suggestion.type}-${suggestion.id}-${index}`}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 text-left"
                >
                  <span className="text-lg">{suggestion.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{suggestion.text}</p>
                    <p className="text-xs text-gray-500 capitalize">{suggestion.type}</p>
                  </div>
                  <ArrowRight size={14} className="text-gray-400" />
                </button>
              ))}
            </div>
          )}

          {/* Résultats de recherche */}
          {results.length > 0 && (
            <div className="p-2">
              <p className="px-2 py-1 text-xs font-medium text-gray-400 uppercase">Résultats</p>
              {results.map((result, index) => (
                <button
                  key={`${result.type}-${result.id}-${index}`}
                  onClick={() => handleResultClick(result)}
                  className="w-full flex items-start gap-3 px-3 py-3 rounded-lg hover:bg-gray-50 text-left"
                >
                  {result.image ? (
                    <img
                      src={result.image}
                      alt=""
                      className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                      {TYPE_ICONS[result.type] || <Building2 size={20} className="text-gray-400" />}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{result.title}</p>
                    {result.subtitle && (
                      <p className="text-xs text-gray-500 truncate">{result.subtitle}</p>
                    )}
                    {result.description && (
                      <p className="text-xs text-gray-400 line-clamp-1 mt-0.5">{result.description}</p>
                    )}
                  </div>
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded flex-shrink-0">
                    {TYPE_LABELS[result.type] || result.type}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Recherches populaires (quand pas de résultats) */}
          {results.length === 0 && popularSearches.length > 0 && query.length < 2 && (
            <div className="p-2">
              <p className="px-2 py-1 text-xs font-medium text-gray-400 uppercase flex items-center gap-1">
                <TrendingUp size={12} />
                Recherches populaires
              </p>
              {popularSearches.map((term, index) => (
                <button
                  key={index}
                  onClick={() => setQuery(term)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 text-left"
                >
                  <Clock size={14} className="text-gray-400" />
                  <span className="text-sm text-gray-700">{term}</span>
                </button>
              ))}
            </div>
          )}

          {/* Aucun résultat */}
          {query.length >= 2 && !loading && results.length === 0 && suggestions.length === 0 && (
            <div className="p-8 text-center">
              <Search className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">Aucun résultat pour "{query}"</p>
              <p className="text-sm text-gray-400 mt-1">Essayez des termes plus généraux</p>
            </div>
          )}

          {/* Voir tous les résultats */}
          {results.length > 0 && (
            <div className="p-2 border-t border-gray-100">
              <button
                onClick={() => {
                  router.push(`/recherche?q=${encodeURIComponent(query)}&type=${selectedType}`);
                  setIsOpen(false);
                }}
                className="w-full py-2 text-center text-sm text-blue-600 hover:bg-blue-50 rounded-lg font-medium"
              >
                Voir tous les résultats →
              </button>
            </div>
          )}
          </div>
        </div>
      )}
    </div>
  );
}
