'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lightbulb,
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
  MessageSquare,
  Calendar,
  ArrowUpDown,
  MoreVertical,
  Mail,
} from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations, useLocale } from 'next-intl';

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
    email?: string;
  };
}

const STATUT_CONFIG: Record<string, { bg: string; text: string; icon: React.ElementType }> = {
  SOUMISE: { bg: 'bg-gray-100', text: 'text-gray-700', icon: Clock },
  EN_EXAMEN: { bg: 'bg-blue-100', text: 'text-blue-700', icon: Eye },
  APPROUVEE: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle },
  REJETEE: { bg: 'bg-red-100', text: 'text-red-700', icon: XCircle },
  IMPLEMENTEE: { bg: 'bg-purple-100', text: 'text-purple-700', icon: Sparkles },
};

const CATEGORIES: Record<string, { emoji: string }> = {
  infrastructure: { emoji: '🏗️' },
  services: { emoji: '🏛️' },
  environnement: { emoji: '🌿' },
  education: { emoji: '📚' },
  sante: { emoji: '🏥' },
  transport: { emoji: '🚌' },
  culture: { emoji: '🎭' },
  numerique: { emoji: '💻' },
  autre: { emoji: '💡' },
};

export default function AdminSuggestionsPage() {
  const t = useTranslations('admin.suggestions_page');
  const tCat = useTranslations('suggestions.categories');
  const locale = useLocale();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSuggestion, setSelectedSuggestion] = useState<Suggestion | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  
  // Filters
  const [statutFilter, setStatutFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  
  // Pagination & Stats
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<Record<string, number>>({});

  // Action states
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [reponseAdmin, setReponseAdmin] = useState('');

  const fetchSuggestions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', '15');
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
      toast.error('Erreur lors du chargement des suggestions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuggestions();
  }, [page, statutFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchSuggestions();
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const handleChangeStatut = async (suggestionId: number, newStatut: string) => {
    setActionLoading(`${suggestionId}-${newStatut}`);
    try {
      const res = await fetch(`/api/suggestions/${suggestionId}/statut`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          statut: newStatut,
          reponseAdmin: reponseAdmin || undefined,
        }),
      });

      if (res.ok) {
        const statutLabel = STATUT_CONFIG[newStatut]?.label || newStatut;
        toast.success(`Statut changé: ${statutLabel}`);
        fetchSuggestions();
        setShowDetailModal(false);
        setReponseAdmin('');
      } else {
        const data = await res.json();
        toast.error(data.error || 'Erreur lors du changement de statut');
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur de connexion');
    } finally {
      setActionLoading(null);
    }
  };

  const openDetail = (suggestion: Suggestion) => {
    setSelectedSuggestion(suggestion);
    setReponseAdmin(suggestion.reponseAdmin || '');
    setShowDetailModal(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(locale === 'ar' ? 'ar-MA' : 'fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const totalSuggestions = Object.values(stats).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center text-white">
              <Lightbulb className="w-5 h-5" />
            </div>
            {t('page_title')}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {t('page_subtitle')}
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {Object.entries(STATUT_CONFIG).map(([key, config]) => {
          const count = stats[key] || 0;
          const Icon = config.icon;
          const percentage = totalSuggestions > 0 ? Math.round((count / totalSuggestions) * 100) : 0;
          
          return (
            <button
              key={key}
              onClick={() => setStatutFilter(statutFilter === key ? '' : key)}
              className={`p-4 rounded-2xl border transition-all ${
                statutFilter === key
                  ? `${config.bg} border-current shadow-lg`
                  : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <Icon className={`w-5 h-5 ${config.text}`} />
                <span className="text-xs text-gray-400">{percentage}%</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{count}</p>
              <p className={`text-xs ${config.text}`}>{t(`statuses.${key}`)}</p>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('search_placeholder')}
              className="w-full pl-12 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-emerald-500 dark:text-white"
            />
          </div>
          
          {statutFilter && (
            <button
              onClick={() => setStatutFilter('')}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              <XCircle className="w-4 h-4" />
              {t('reset_filters')}
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
          </div>
        ) : suggestions.length === 0 ? (
          <div className="text-center py-20">
            <Lightbulb className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {t('no_suggestions')}
            </h3>
            <p className="text-gray-500">
              {search ? t('no_results') : t('waiting_suggestions')}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {t('table.suggestion')}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {t('table.category')}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {t('table.citizen')}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {t('table.status')}
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {t('table.date')}
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {t('table.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {suggestions.map((suggestion) => {
                  const statutInfo = STATUT_CONFIG[suggestion.statut] || STATUT_CONFIG.SOUMISE;
                  const StatutIcon = statutInfo.icon;
                  const catInfo = suggestion.categorie ? CATEGORIES[suggestion.categorie] : null;

                  return (
                    <tr
                      key={suggestion.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                      onClick={() => openDetail(suggestion)}
                    >
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900 dark:text-white line-clamp-1">
                          {suggestion.titre}
                        </p>
                        <p className="text-sm text-gray-500 line-clamp-1">
                          {suggestion.description.substring(0, 60)}...
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        {catInfo ? (
                          <span className="inline-flex items-center gap-1 text-sm">
                            <span>{catInfo.emoji}</span>
                            <span className="text-gray-600 dark:text-gray-300">{tCat(suggestion.categorie!)}</span>
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                            <span className="text-xs font-bold text-emerald-600">
                              {suggestion.user.prenom.charAt(0)}{suggestion.user.nom.charAt(0)}
                            </span>
                          </div>
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {suggestion.user.prenom} {suggestion.user.nom}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statutInfo.bg} ${statutInfo.text}`}>
                          <StatutIcon className="w-3 h-3" />
                          {t(`statuses.${suggestion.statut}`)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {formatDate(suggestion.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openDetail(suggestion);
                          }}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                        >
                          <Eye className="w-4 h-4 text-gray-500" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              {t('page_info', { page, total: totalPages, count: total})}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {showDetailModal && selectedSuggestion && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDetailModal(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-xl bg-white dark:bg-gray-800 shadow-2xl z-50 overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  {t('detail_modal.title')} #{selectedSuggestion.id}
                </h2>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-6">
                {/* Statut actuel */}
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                    {t('detail_modal.current_status')}
                  </label>
                  {(() => {
                    const info = STATUT_CONFIG[selectedSuggestion.statut];
                    const Icon = info.icon;
                    return (
                      <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${info.bg} ${info.text} font-medium`}>
                        <Icon className="w-4 h-4" />
                        {t(`statuses.${selectedSuggestion.statut}`)}
                      </span>
                    );
                  })()}
                </div>

                {/* Titre */}
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    {t('detail_modal.suggestion_title')}
                  </label>
                  <p className="text-gray-900 dark:text-white font-semibold">
                    {selectedSuggestion.titre}
                  </p>
                </div>

                {/* Catégorie */}
                {selectedSuggestion.categorie && CATEGORIES[selectedSuggestion.categorie] && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      {t('detail_modal.category')}
                    </label>
                    <span className="inline-flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <span className="text-xl">{CATEGORIES[selectedSuggestion.categorie].emoji}</span>
                      {tCat(selectedSuggestion.categorie)}
                    </span>
                  </div>
                )}

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    {t('detail_modal.description')}
                  </label>
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                    {selectedSuggestion.description}
                  </p>
                </div>

                {/* Citoyen */}
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                    {t('detail_modal.submitted_by')}
                  </label>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                      <span className="font-bold text-emerald-600">
                        {selectedSuggestion.user.prenom.charAt(0)}{selectedSuggestion.user.nom.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {selectedSuggestion.user.prenom} {selectedSuggestion.user.nom}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatDate(selectedSuggestion.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Réponse Admin */}
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                    {t('detail_modal.admin_response')}
                  </label>
                  <textarea
                    value={reponseAdmin}
                    onChange={(e) => setReponseAdmin(e.target.value)}
                    rows={4}
                    placeholder={t('detail_modal.response_placeholder')}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-emerald-500 dark:text-white"
                  />
                </div>

                {/* Actions */}
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                    {t('detail_modal.change_status')}
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(STATUT_CONFIG).map(([key, config]) => {
                      const Icon = config.icon;
                      const isActive = selectedSuggestion.statut === key;
                      const isLoading = actionLoading === `${selectedSuggestion.id}-${key}`;

                      return (
                        <button
                          key={key}
                          onClick={() => handleChangeStatut(selectedSuggestion.id, key)}
                          disabled={isActive || !!actionLoading}
                          className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all disabled:opacity-50 ${
                            isActive
                              ? `${config.bg} ${config.text} border-2 border-current`
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                          }`}
                        >
                          {isLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Icon className="w-4 h-4" />
                          )}
                          {t(`statuses.${key}`)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
