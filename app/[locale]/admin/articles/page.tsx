'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  User,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Globe,
  Star,
  Tag,
  Loader2,
  X,
  BookOpen,
  TrendingUp,
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';

interface Article {
  id: number;
  titre: string;
  resume: string;
  contenu: string;
  imageUrl: string | null;
  categorie: string | null;
  tags: string[];
  statut: string;
  nombreVues: number;
  nombreLikes: number;
  isMisEnAvant: boolean;
  datePublication: string | null;
  createdAt: string;
  auteur: { id: number; nom: string; prenom: string } | null;
}

const STATUT_CONFIG: Record<string, { bg: string; text: string; icon: React.ElementType }> = {
  BROUILLON: { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-600 dark:text-gray-300', icon: Edit },
  EN_ATTENTE: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400', icon: Clock },
  PUBLIE: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400', icon: Globe },
  REJETE: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', icon: XCircle },
  ARCHIVE: { bg: 'bg-slate-100 dark:bg-slate-700', text: 'text-slate-600 dark:text-slate-300', icon: FileText },
};

export default function AdminArticlesPage() {
  const t = useTranslations('admin.articles_page');
  const locale = useLocale();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  
  // Filters
  const [search, setSearch] = useState('');
  const [statutFilter, setStatutFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Modal
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    publies: 0,
    enAttente: 0,
    brouillons: 0,
    totalVues: 0,
  });

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', '12');
      if (search) params.set('search', search);
      if (statutFilter) params.set('statut', statutFilter);

      const res = await fetch(`/api/articles?${params}`);
      if (res.ok) {
        const data = await res.json();
        setArticles(data.data || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotal(data.pagination?.total || 0);
        
        // Calculate stats
        const all = data.data || [];
        setStats({
          total: data.pagination?.total || 0,
          publies: all.filter((a: Article) => a.statut === 'PUBLIE').length,
          enAttente: all.filter((a: Article) => a.statut === 'EN_ATTENTE').length,
          brouillons: all.filter((a: Article) => a.statut === 'BROUILLON').length,
          totalVues: all.reduce((acc: number, a: Article) => acc + (a.nombreVues || 0), 0),
        });
      }
    } catch (error) {
      console.error('Erreur chargement articles:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }, [page, search, statutFilter]);

  useEffect(() => {
    const debounce = setTimeout(fetchArticles, 300);
    return () => clearTimeout(debounce);
  }, [fetchArticles]);

  const handleChangeStatut = async (id: number, newStatut: string) => {
    setActionLoading(`${id}-${newStatut}`);
    try {
      const res = await fetch(`/api/articles/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statut: newStatut }),
      });

      if (res.ok) {
        toast.success(t('messages.status_changed'));
        fetchArticles();
        setShowDetailModal(false);
      } else {
        const data = await res.json();
        toast.error(data.error || 'Erreur');
      }
    } catch (error) {
      toast.error('Erreur de connexion');
    } finally {
      setActionLoading(null);
    }
  };

  const statusKeyMap: Record<string, string> = {
    'BROUILLON': 'draft',
    'EN_ATTENTE': 'pending',
    'PUBLIE': 'published',
    'REJETE': 'rejected',
    'ARCHIVE': 'archived'
  };

  const handleToggleMisEnAvant = async (id: number, current: boolean) => {
    setActionLoading(`highlight-${id}`);
    try {
      const res = await fetch(`/api/articles/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isMisEnAvant: !current }),
      });

      if (res.ok) {
        toast.success(current ? t('messages.unhighlighted') : t('messages.highlighted'));
        fetchArticles();
      } else {
        toast.error('Erreur');
      }
    } catch (error) {
      toast.error('Erreur de connexion');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t('messages.confirm_delete'))) return;
    
    setActionLoading(`delete-${id}`);
    try {
      const res = await fetch(`/api/articles/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success(t('messages.deleted'));
        fetchArticles();
        setShowDetailModal(false);
      } else {
        toast.error('Erreur lors de la suppression');
      }
    } catch (error) {
      toast.error('Erreur de connexion');
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString(locale === 'ar' ? 'ar-MA' : 'fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30">
              <BookOpen className="w-6 h-6" />
            </div>
            {t('title')}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {t('subtitle', { count: total })}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={fetchArticles}
            className="p-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all ${
              showFilters
                ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-700 text-indigo-700 dark:text-indigo-400'
                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            <Filter size={18} />
            {t('filters')}
          </button>
          <Link
            href="/admin/articles/nouveau"
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-medium shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30 hover:shadow-xl transition-all"
          >
            <Plus size={18} />
            {t('create')}
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-5 text-white"
        >
          <div className="flex items-center justify-between mb-2">
            <BookOpen className="w-6 h-6 opacity-80" />
            <span className="text-2xl font-bold">{stats.total}</span>
          </div>
          <p className="text-sm opacity-80">{t('stats.total')}</p>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700"
        >
          <div className="flex items-center justify-between mb-2">
            <Globe className="w-6 h-6 text-emerald-500" />
            <span className="text-2xl font-bold text-gray-900 dark:text-white">{stats.publies}</span>
          </div>
          <p className="text-sm text-gray-500">{t('stats.published')}</p>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700"
        >
          <div className="flex items-center justify-between mb-2">
            <Clock className="w-6 h-6 text-amber-500" />
            <span className="text-2xl font-bold text-gray-900 dark:text-white">{stats.enAttente}</span>
          </div>
          <p className="text-sm text-gray-500">{t('stats.pending')}</p>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700"
        >
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-6 h-6 text-blue-500" />
            <span className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalVues}</span>
          </div>
          <p className="text-sm text-gray-500">{t('stats.views')}</p>
        </motion.div>
      </div>

      {/* Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 overflow-hidden"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative lg:col-span-2">
                <Search className={`absolute ${locale === 'ar' ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400`} />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t('labels.search_placeholder')}
                  className={`w-full ${locale === 'ar' ? 'pr-12 pl-4' : 'pl-12 pr-4'} py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500 dark:text-white`}
                />
              </div>

              {/* Statut */}
              <select
                value={statutFilter}
                onChange={(e) => setStatutFilter(e.target.value)}
                className="px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500 dark:text-white"
              >
                <option value="">{t('labels.all_statuses')}</option>
                <option value="BROUILLON">{t('status.draft')}</option>
                <option value="EN_ATTENTE">{t('status.pending')}</option>
                <option value="PUBLIE">{t('status.published')}</option>
                <option value="REJETE">{t('status.rejected')}</option>
                <option value="ARCHIVE">{t('status.archived')}</option>
              </select>

              {/* Reset */}
              <button
                onClick={() => { setSearch(''); setStatutFilter(''); }}
                className="flex items-center justify-center gap-2 px-4 py-3 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
              >
                <X size={16} />
                {t('labels.reset')}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {loading ? (
          [...Array(6)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl p-6 animate-pulse">
              <div className="h-5 w-3/4 bg-gray-200 dark:bg-gray-700 rounded mb-3" />
              <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded mb-4" />
              <div className="flex gap-2">
                <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded-full" />
                <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded-full" />
              </div>
            </div>
          ))
        ) : articles.length === 0 ? (
          <div className="col-span-full text-center py-16">
            <BookOpen className="w-16 h-16 text-gray-200 dark:text-gray-700 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {t('empty.title')}
            </h3>
            <p className="text-gray-500">
              {search || statutFilter ? t('empty.no_results') : t('empty.create_first')}
            </p>
          </div>
        ) : (
          articles.map((article) => {
            const statutConfig = STATUT_CONFIG[article.statut] || STATUT_CONFIG.BROUILLON;
            const StatutIcon = statutConfig.icon;
            
            return (
              <motion.div
                key={article.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="group bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-all"
              >
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${statutConfig.bg} ${statutConfig.text}`}>
                        <StatutIcon className="w-3 h-3" />
                        {t('status.' + (statusKeyMap[article.statut] || 'draft'))}
                      </span>
                      {article.isMisEnAvant && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                          <Star className="w-3 h-3 fill-current" />
                          {t('labels.featured')}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => { setSelectedArticle(article); setShowDetailModal(true); }}
                        className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      >
                        <Eye size={16} />
                      </button>
                      <Link
                        href={`/admin/articles/${article.id}/modifier`}
                        className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                      >
                        <Edit size={16} />
                      </Link>
                    </div>
                  </div>

                  {/* Title & Resume */}
                  <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2 mb-2 leading-tight">
                    {article.titre}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-4">
                    {article.resume || t('labels.no_resume')}
                  </p>

                  {/* Tags */}
                  {article.tags && article.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {article.tags.slice(0, 3).map((tag, i) => (
                        <span key={i} className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded-full">
                          #{tag}
                        </span>
                      ))}
                      {article.tags.length > 3 && (
                        <span className="px-2 py-0.5 text-gray-400 text-xs">+{article.tags.length - 3}</span>
                      )}
                    </div>
                  )}

                  {/* Meta */}
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-1">
                      <Calendar size={12} />
                      {formatDate(article.createdAt)}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Eye size={12} />
                        {article.nombreVues}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
          <p className="text-sm text-gray-500">
            Page {page} sur {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
            >
              {locale === 'ar' ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
            >
              {locale === 'ar' ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
            </button>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      <AnimatePresence>
        {showDetailModal && selectedArticle && (
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
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 px-6 py-4 flex items-center justify-between z-10">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  {t('modal.title')}
                </h2>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-6">
                {/* Title */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    {(() => {
                      const config = STATUT_CONFIG[selectedArticle.statut] || STATUT_CONFIG.BROUILLON;
                      const Icon = config.icon;
                      return (
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
                          <Icon className="w-3 h-3" />
                          {t('status.' + (statusKeyMap[selectedArticle.statut] || 'draft'))}
                        </span>
                      );
                    })()}
                    {selectedArticle.isMisEnAvant && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                        <Star className="w-3 h-3 fill-current" />
                        {t('labels.featured')}
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    {selectedArticle.titre}
                  </h3>
                </div>

                {/* Resume */}
                <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                      {t('modal.resume')}
                    </label>
                    <p className="text-gray-700 dark:text-gray-300">
                      {selectedArticle.resume || t('labels.no_resume')}
                    </p>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-xl text-center">
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{selectedArticle.nombreVues}</p>
                      <p className="text-xs text-gray-500">{t('modal.views')}</p>
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-xl text-center">
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{selectedArticle.nombreLikes}</p>
                      <p className="text-xs text-gray-500">{t('modal.likes')}</p>
                    </div>
                </div>

                {/* Author */}
                {selectedArticle.auteur && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {selectedArticle.auteur.prenom} {selectedArticle.auteur.nom}
                      </p>
                      <p className="text-xs text-gray-500">{t('modal.author')}</p>
                    </div>
                  </div>
                )}

                {/* Change Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                    {t('modal.change_status')}
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(STATUT_CONFIG).map(([key, config]) => {
                      const Icon = config.icon;
                      const isActive = selectedArticle.statut === key;
                      const isLoading = actionLoading === `${selectedArticle.id}-${key}`;

                      return (
                        <button
                          key={key}
                          onClick={() => handleChangeStatut(selectedArticle.id, key)}
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
                          {t('status.' + (statusKeyMap[key] || 'draft'))}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Toggle Featured */}
                <button
                  onClick={() => handleToggleMisEnAvant(selectedArticle.id, selectedArticle.isMisEnAvant)}
                  disabled={!!actionLoading}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all ${
                    selectedArticle.isMisEnAvant
                      ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {actionLoading === `highlight-${selectedArticle.id}` ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Star className={`w-4 h-4 ${selectedArticle.isMisEnAvant ? 'fill-current' : ''}`} />
                  )}
                  {selectedArticle.isMisEnAvant ? t('modal.toggle_featured_off') : t('modal.toggle_featured')}
                </button>

                {/* Delete */}
                <button
                  onClick={() => handleDelete(selectedArticle.id)}
                  disabled={!!actionLoading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl font-medium hover:bg-red-100 dark:hover:bg-red-900/30 transition-all"
                >
                  {actionLoading === `delete-${selectedArticle.id}` ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  {t('modal.delete')}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
