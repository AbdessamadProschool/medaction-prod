'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  Lightbulb,
  Plus,
  Search,
  Filter,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Loader2,
  ChevronLeft,
  ChevronRight,
  User,
  Sparkles,
  TrendingUp,
  Trash2,
} from 'lucide-react';
import SuggestionModal from '@/components/suggestions/SuggestionModal';
import { toast } from 'sonner';

interface Suggestion {
  id: number;
  titre: string;
  description: string;
  categorie: string | null;
  statut: string;
  reponseAdmin: string | null;
  dateTraitement: string | null;
  createdAt: string;
  user: {
    id: number;
    nom: string;
    prenom: string;
  };
}

const STATUT_CONFIG: Record<string, { bg: string; text: string; icon: React.ElementType; label: string }> = {
  SOUMISE: { bg: 'bg-gray-100', text: 'text-gray-700', icon: Clock, label: 'En attente' },
  EN_EXAMEN: { bg: 'bg-blue-100', text: 'text-blue-700', icon: Eye, label: 'En examen' },
  APPROUVEE: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle, label: 'Approuvée' },
  REJETEE: { bg: 'bg-red-100', text: 'text-red-700', icon: XCircle, label: 'Rejetée' },
  IMPLEMENTEE: { bg: 'bg-purple-100', text: 'text-purple-700', icon: Sparkles, label: 'Implémentée' },
};

const CATEGORIES: Record<string, { label: string; emoji: string }> = {
  infrastructure: { label: 'Infrastructure', emoji: '🏗️' },
  services: { label: 'Services publics', emoji: '🏛️' },
  environnement: { label: 'Environnement', emoji: '🌿' },
  education: { label: 'Éducation', emoji: '📚' },
  sante: { label: 'Santé', emoji: '🏥' },
  transport: { label: 'Transport', emoji: '🚌' },
  culture: { label: 'Culture & Loisirs', emoji: '🎭' },
  numerique: { label: 'Numérique', emoji: '💻' },
  autre: { label: 'Autre', emoji: '💡' },
};

export default function SuggestionsPage() {
  const t = useTranslations('suggestions_page');
  const { data: session } = useSession();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  
  // Filters
  const [statutFilter, setStatutFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  
  // Pagination
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  
  // Stats
  const [stats, setStats] = useState<Record<string, number>>({});

  const fetchSuggestions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', '12');
      if (statutFilter) params.set('statut', statutFilter);
      if (search) params.set('search', search);

      const res = await fetch(`/api/suggestions?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setSuggestions(data.data);
        setTotalPages(data.pagination.totalPages);
        setTotal(data.pagination.total);
        setStats(data.stats.parStatut || {});
      }
    } catch (error) {
      console.error('Erreur chargement suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuggestions();
  }, [page, statutFilter]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchSuggestions();
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const handleModalSuccess = () => {
    fetchSuggestions();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-[hsl(213,80%,28%)] via-[hsl(213,80%,32%)] to-[hsl(213,80%,40%)] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-3xl md:text-4xl font-bold mb-3"
              >
                💡 {t('title')}
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-white/80 max-w-xl"
              >
                {t('subtitle')}
              </motion.p>
            </div>
            
            {session?.user && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                onClick={() => setModalOpen(true)}
                className="flex items-center gap-2 px-6 py-3.5 bg-[hsl(45,93%,47%)] text-[hsl(213,80%,20%)] rounded-xl font-semibold shadow-lg hover:shadow-xl hover:bg-[hsl(45,93%,55%)] transition-all"
              >
                <Plus className="w-5 h-5" />
                {t('propose_btn')}
              </motion.button>
            )}
          </div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-8"
          >
            {Object.entries(STATUT_CONFIG).map(([key, config]) => {
              const count = stats[key] || 0;
              const Icon = config.icon;
              return (
                <button
                  key={key}
                  onClick={() => setStatutFilter(statutFilter === key ? '' : key)}
                  className={`p-4 rounded-xl transition-all ${
                    statutFilter === key
                      ? 'bg-white text-gray-900 shadow-lg'
                      : 'bg-white/10 hover:bg-white/20 text-white'
                  }`}
                >
                  <Icon className={`w-5 h-5 mb-2 ${statutFilter === key ? config.text : ''}`} />
                  <p className="text-2xl font-bold">{count}</p>
                  <p className={`text-xs ${statutFilter === key ? 'text-gray-500' : 'text-white/70'}`}>
                    {t(`status.${key === 'SOUMISE' ? 'submitted' : key === 'EN_EXAMEN' ? 'review' : key === 'APPROUVEE' ? 'approved' : key === 'REJETEE' ? 'rejected' : 'implemented'}`)}
                  </p>
                </button>
              );
            })}
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('search_placeholder')}
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[hsl(213,80%,28%)] focus:border-transparent"
            />
          </div>
          
          {statutFilter && (
            <button
              onClick={() => setStatutFilter('')}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-xl text-gray-600 hover:bg-gray-200"
            >
              <XCircle className="w-4 h-4" />
              {t('reset_filter')}
            </button>
          )}
        </div>

        {/* Results count */}
        <p className="text-gray-500 mb-6">
          {t('results_found', { count: total })}
          {statutFilter && ` • ${t('filter_label', { label: t(`status.${statutFilter === 'SOUMISE' ? 'submitted' : statutFilter === 'EN_EXAMEN' ? 'review' : statutFilter === 'APPROUVEE' ? 'approved' : statutFilter === 'REJETEE' ? 'rejected' : 'implemented'}`) })}`}
        </p>

        {/* Suggestions Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-[hsl(213,80%,28%)] animate-spin" />
          </div>
        ) : suggestions.length === 0 ? (
          <div className="text-center py-20">
            <Lightbulb className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {t('no_suggestions')}
            </h3>
            <p className="text-gray-500 mb-6">
              {search ? t('no_results') : t('be_first')}
            </p>
            {session?.user && !search && (
              <button
                onClick={() => setModalOpen(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-[hsl(213,80%,28%)] text-white rounded-xl font-medium hover:bg-[hsl(213,80%,35%)]"
              >
                <Plus className="w-5 h-5" />
                Proposer une idée
              </button>
            )}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <AnimatePresence mode="popLayout">
              {suggestions.map((suggestion, index) => {
                const statutInfo = STATUT_CONFIG[suggestion.statut] || STATUT_CONFIG.SOUMISE;
                const StatutIcon = statutInfo.icon;
                const catInfo = suggestion.categorie ? CATEGORIES[suggestion.categorie] : null;

                return (
                  <motion.div
                    key={suggestion.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    {/* Header */}
                    <div className="p-5 border-b border-gray-50">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2">
                          {catInfo && (
                            <span className="text-xl">{catInfo.emoji}</span>
                          )}
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statutInfo.bg} ${statutInfo.text} flex items-center gap-1`}>
                            <StatutIcon className="w-3 h-3" />
                            {t(`status.${suggestion.statut === 'SOUMISE' ? 'submitted' : suggestion.statut === 'EN_EXAMEN' ? 'review' : suggestion.statut === 'APPROUVEE' ? 'approved' : suggestion.statut === 'REJETEE' ? 'rejected' : 'implemented'}`)}
                          </span>
                        </div>
                        <span className="text-xs text-gray-400">
                          {formatDate(suggestion.createdAt)}
                        </span>
                      </div>
                      
                      <h3 className="font-semibold text-gray-900 line-clamp-2 mb-2">
                        {suggestion.titre}
                      </h3>
                      
                      <p className="text-sm text-gray-500 line-clamp-3">
                        {suggestion.description}
                      </p>
                    </div>

                    {/* Footer */}
                    <div className="px-5 py-3 bg-gray-50 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <User className="w-4 h-4" />
                        <span>{suggestion.user.prenom} {suggestion.user.nom.charAt(0)}.</span>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        {session?.user?.id && Number(session.user.id) === suggestion.user.id && (
                          <button
                            onClick={async () => {
                              if (!confirm(t('delete_confirm'))) return;
                              try {
                                const res = await fetch(`/api/suggestions/${suggestion.id}`, { 
                                  method: 'DELETE' 
                                });
                                if (res.ok) {
                                  toast.success(t('delete_success'));
                                  fetchSuggestions();
                                } else {
                                  const data = await res.json();
                                  toast.error(data.error || 'Erreur lors de la suppression');
                                }
                              } catch (e) {
                                toast.error('Erreur serveur');
                              }
                            }}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Supprimer"
                          >
                           <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                        {suggestion.reponseAdmin && (
                          <span className="text-xs text-[hsl(213,80%,28%)] font-medium flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            {t('admin_response')}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Admin Response (if any) */}
                    {suggestion.reponseAdmin && (
                      <div className="px-5 py-3 bg-[hsl(213,80%,28%)]/5 border-t border-[hsl(213,80%,28%)]/10">
                        <p className="text-xs text-gray-600 italic line-clamp-2">
                          "{suggestion.reponseAdmin}"
                        </p>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-10">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:hover:bg-transparent"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (page <= 3) {
                pageNum = i + 1;
              } else if (page >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = page - 2 + i;
              }
              
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                    page === pageNum
                      ? 'bg-[hsl(213,80%,28%)] text-white'
                      : 'hover:bg-gray-100 text-gray-600'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:hover:bg-transparent"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* Suggestion Modal */}
      <SuggestionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={handleModalSuccess}
      />

      {/* CTA for non-authenticated users */}
      {!session?.user && (
        <div className="bg-gradient-to-r from-[hsl(213,80%,28%)] to-[hsl(213,80%,40%)] py-12">
          <div className="max-w-3xl mx-auto px-4 text-center">
            <h2 className="text-2xl font-bold text-white mb-4">
              {t('cta_title')}
            </h2>
            <p className="text-white/80 mb-6">
              {t('cta_text')}
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[hsl(45,93%,47%)] text-[hsl(213,80%,20%)] rounded-xl font-semibold hover:bg-[hsl(45,93%,55%)] transition-colors"
            >
              {t('login_btn')}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
