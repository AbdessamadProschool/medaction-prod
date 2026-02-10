'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import TalentCard from '@/components/talents/TalentCard';
import TalentModal from '@/components/talents/TalentModal';

interface Talent {
  id: number;
  nom: string;
  prenom: string;
  nomArtistique?: string | null;
  domaine: string;
  photo?: string | null;
  bio?: string | null;
  reseauxSociaux?: any;
}

const domaines = [
  'Tous',
  'Musique',
  'Art Plastique',
  'Théâtre',
  'Cinéma',
  'Littérature',
  'Sport',
  'Artisanat',
  'Innovation',
  'Autre'
];

function TalentsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [talents, setTalents] = useState<Talent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTalent, setSelectedTalent] = useState<Talent | null>(null);
  
  // Filters
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [domaine, setDomaine] = useState(searchParams.get('domaine') || 'Tous');
  
  // Pagination
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Sync URL with filters
  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (domaine && domaine !== 'Tous') params.set('domaine', domaine);
    
    // Replace URL without reloading
    const newUrl = `/talents?${params.toString()}`;
    window.history.replaceState({ ...window.history.state, as: newUrl, url: newUrl }, '', newUrl);
  }, [search, domaine]);

  // Fetch talents
  const fetchTalents = async (reset = false) => {
    if (reset) {
      setLoading(true);
      setPage(1);
    }

    try {
      const params = new URLSearchParams();
      params.set('page', reset ? '1' : page.toString());
      params.set('limit', '12');
      params.set('isPublie', 'true');
      if (search) params.set('search', search);
      if (domaine && domaine !== 'Tous') params.set('domaine', domaine);

      const res = await fetch(`/api/talents?${params.toString()}`);
      const json = await res.json();
      
      if (reset) {
        setTalents(json.data || []);
      } else {
        setTalents(prev => [...prev, ...(json.data || [])]);
      }
      
      setHasMore(json.pagination.page < json.pagination.pages);
      if (!reset) setPage(p => p + 1);
      
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch and filter change
  useEffect(() => {
    fetchTalents(true);
  }, [search, domaine]);

  // Load more
  const handleLoadMore = () => {
    if (!loading && hasMore) {
      setPage(p => p + 1);
      // fetchTalents will be called by effect if we depend on page, 
      // but here we have a manual load more logic which is slightly different from filter change
      // Let's adjust logic: 
      // Actually, better to just call fetch directly for load more
      const params = new URLSearchParams();
      params.set('page', (page + 1).toString());
      params.set('limit', '12');
      params.set('isPublie', 'true');
      if (search) params.set('search', search);
      if (domaine && domaine !== 'Tous') params.set('domaine', domaine);

      setLoading(true);
      fetch(`/api/talents?${params.toString()}`)
        .then(res => res.json())
        .then(json => {
            setTalents(prev => [...prev, ...(json.data || [])]);
            setHasMore(json.pagination.page < json.pagination.pages);
            setLoading(false);
        });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-[hsl(213,80%,20%)] to-[hsl(213,80%,30%)] py-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/images/pattern.svg')] opacity-10" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10 text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-bold text-white mb-4"
          >
            Talents de Médiouna
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-[hsl(45,93%,70%)] max-w-2xl mx-auto"
          >
            Découvrez les artistes, créateurs et innovateurs qui font rayonner notre province.
          </motion.p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        {/* Filters */}
        <div className="mb-12 space-y-6">
          {/* Search */}
          <div className="max-w-md mx-auto">
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un talent..."
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all shadow-sm"
              />
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Domaines */}
          <div className="flex flex-wrap justify-center gap-2">
            {domaines.map((d) => (
              <button
                key={d}
                onClick={() => setDomaine(d)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  domaine === d
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200 scale-105'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {talents.length === 0 && !loading ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🎨</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Aucun talent trouvé</h3>
            <p className="text-gray-500">Essayez de modifier vos critères de recherche.</p>
          </div>
        ) : (
          <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
            {talents.map((talent) => (
              <TalentCard
                key={talent.id}
                talent={talent}
                onClick={() => setSelectedTalent(talent)}
              />
            ))}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Load More */}
        {!loading && hasMore && talents.length > 0 && (
          <div className="text-center mt-12">
            <button
              onClick={handleLoadMore}
              className="px-8 py-3 bg-white border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all shadow-sm"
            >
              Voir plus de talents
            </button>
          </div>
        )}
      </div>

      {/* Modal */}
      <TalentModal
        talent={selectedTalent}
        onClose={() => setSelectedTalent(null)}
      />
    </div>
  );
}

export default function TalentsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Chargement...</div>}>
      <TalentsContent />
    </Suspense>
  );
}
