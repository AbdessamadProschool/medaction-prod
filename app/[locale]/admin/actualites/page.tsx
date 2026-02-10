'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Newspaper,
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
  Building2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Globe,
  Star,
  Archive,
  Send,
  Loader2,
  X,
  ImageIcon,
  TrendingUp,
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

interface Actualite {
  id: number;
  titre: string;
  resume: string;
  contenu: string;
  medias: { urlPublique: string }[];
  secteur: string;
  statut: string;
  nombreVues: number;
  isMisEnAvant: boolean;
  datePublication: string | null;
  createdAt: string;
  createdByUser: { id: number; nom: string; prenom: string } | null;
  commune: { id: number; nom: string } | null;
}

const STATUT_STYLES: Record<string, { bg: string; text: string; icon: React.ElementType }> = {
  BROUILLON: { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-600 dark:text-gray-300', icon: Edit },
  EN_ATTENTE_VALIDATION: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400', icon: Clock },
  VALIDEE: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', icon: CheckCircle },
  PUBLIEE: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400', icon: Globe },
  DEPUBLIEE: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-400', icon: Archive },
  ARCHIVEE: { bg: 'bg-slate-100 dark:bg-slate-700', text: 'text-slate-600 dark:text-slate-300', icon: Archive },
};

const SECTEURS_KEYS = [
  'EDUCATION', 'SANTE', 'SPORT', 'SOCIAL', 'CULTUREL', 'AUTRE'
];

export default function AdminActualitesPage() {
  const t = useTranslations('admin.news_page');
  const tSectors = useTranslations('admin.users_page.sectors');

  const [actualites, setActualites] = useState<Actualite[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<Record<string, number>>({});
  
  // Filters
  const [search, setSearch] = useState('');
  const [statutFilter, setStatutFilter] = useState('');
  const [secteurFilter, setSecteurFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Modal
  const [selectedActualite, setSelectedActualite] = useState<Actualite | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchActualites = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', '12');
      if (search) params.set('search', search);
      if (statutFilter) params.set('statut', statutFilter);
      if (secteurFilter) params.set('secteur', secteurFilter);

      const res = await fetch(`/api/actualites?${params}`);
      if (res.ok) {
        const data = await res.json();
        setActualites(data.data || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotal(data.pagination?.total || 0);
        
        // Calculate stats from data
        const statsCounts: Record<string, number> = {};
        (data.data || []).forEach((a: Actualite) => {
          statsCounts[a.statut] = (statsCounts[a.statut] || 0) + 1;
        });
        setStats(statsCounts);
      }
    } catch (error) {
      console.error('Erreur chargement actualités:', error);
      toast.error(t('messages.loading_error'));
    } finally {
      setLoading(false);
    }
  }, [page, search, statutFilter, secteurFilter, t]);

  useEffect(() => {
    const debounce = setTimeout(fetchActualites, 300);
    return () => clearTimeout(debounce);
  }, [fetchActualites]);

  const handleChangeStatut = async (id: number, newStatut: string) => {
    setActionLoading(`${id}-${newStatut}`);
    try {
      const res = await fetch(`/api/actualites/${id}/statut`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statut: newStatut }),
      });

      if (res.ok) {
        toast.success(t('messages.status_changed', { status: t(`statuses.${newStatut}`) }));
        fetchActualites();
        setShowDetailModal(false);
      } else {
        const data = await res.json();
        toast.error(data.error || t('messages.error'));
      }
    } catch (error) {
      toast.error(t('messages.error'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleMisEnAvant = async (id: number, current: boolean) => {
    setActionLoading(`highlight-${id}`);
    try {
      const res = await fetch(`/api/actualites/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isMisEnAvant: !current }),
      });

      if (res.ok) {
        toast.success(current ? t('messages.highlight_removed') : t('messages.highlight_added'));
        fetchActualites();
      } else {
        toast.error(t('messages.error'));
      }
    } catch (error) {
      toast.error(t('messages.error'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t('messages.delete_confirm'))) return;
    
    setActionLoading(`delete-${id}`);
    try {
      const res = await fetch(`/api/actualites/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success(t('messages.deleted'));
        fetchActualites();
        setShowDetailModal(false);
      } else {
        toast.error(t('messages.error'));
      }
    } catch (error) {
      toast.error(t('messages.error'));
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const totalActualites = Object.values(stats).reduce((a, b) => a + b, 0);

  const getSecteurLabel = (key: string) => {
    if (key === 'AUTRE') return 'Autre';
    return tSectors(key as any);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200 dark:shadow-blue-900/30">
              <Newspaper className="w-6 h-6" />
            </div>
            {t('page_title')}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {t('total_news', { count: total })}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={fetchActualites}
            className="p-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all ${
              showFilters
                ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-400'
                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <Filter size={18} />
            {t('filters')}
          </button>
          <Link
            href="/admin/actualites/nouvelle"
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-medium shadow-lg shadow-blue-200 dark:shadow-blue-900/30 hover:shadow-xl transition-all"
          >
            <Plus size={18} />
            {t('new_news')}
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {Object.entries(STATUT_STYLES).map(([key, style]) => {
          const count = stats[key] || 0;
          const Icon = style.icon;
          const isActive = statutFilter === key;
          
          return (
            <motion.button
              key={key}
              onClick={() => setStatutFilter(statutFilter === key ? '' : key)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`p-4 rounded-2xl border-2 transition-all ${
                isActive
                  ? 'border-blue-500 shadow-lg'
                  : 'border-transparent hover:border-gray-200 dark:hover:border-gray-700'
              } ${style.bg}`}
            >
              <div className="flex items-center justify-between mb-2">
                <Icon className={`w-5 h-5 ${style.text}`} />
                {count > 0 && (
                  <span className="text-xs font-bold text-gray-500">
                    {totalActualites > 0 ? Math.round((count / totalActualites) * 100) : 0}%
                  </span>
                )}
              </div>
              <p className={`text-2xl font-bold ${style.text}`}>{count}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{t(`statuses.${key}`)}</p>
            </motion.button>
          );
        })}
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
                <Search className="absolute ltr:left-4 rtl:right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t('search_placeholder')}
                  className="w-full ltr:pl-12 rtl:pr-12 ltr:pr-4 rtl:pl-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 dark:text-white"
                />
              </div>

              {/* Secteur */}
              <select
                value={secteurFilter}
                onChange={(e) => setSecteurFilter(e.target.value)}
                className="px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 dark:text-white"
              >
                <option value="">{t('all_sectors')}</option>
                {SECTEURS_KEYS.map((s) => (
                  <option key={s} value={s}>{getSecteurLabel(s)}</option>
                ))}
              </select>

              {/* Reset */}
              <button
                onClick={() => { setSearch(''); setStatutFilter(''); setSecteurFilter(''); }}
                className="flex items-center justify-center gap-2 px-4 py-3 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
              >
                <X size={16} />
                {t('reset')}
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
              <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded-xl mb-4" />
              <div className="h-5 w-3/4 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
              <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded mb-4" />
              <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          ))
        ) : actualites.length === 0 ? (
          <div className="col-span-full text-center py-16">
            <Newspaper className="w-16 h-16 text-gray-200 dark:text-gray-700 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {t('no_news')}
            </h3>
            <p className="text-gray-500">
              {search || statutFilter || secteurFilter ? t('no_results') : t('create_first')}
            </p>
          </div>
        ) : (
          actualites.map((actualite) => {
            const style = STATUT_STYLES[actualite.statut] || STATUT_STYLES.BROUILLON;
            const Icon = style.icon;
            
            return (
              <motion.div
                key={actualite.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="group bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-all"
              >
                {/* Image */}
                <div className="relative h-44 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800">
                  {actualite.medias?.[0]?.urlPublique ? (
                    <img
                      src={actualite.medias[0].urlPublique}
                      alt={actualite.titre}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="w-12 h-12 text-gray-300 dark:text-gray-600" />
                    </div>
                  )}
                  
                  {/* Badges overlay */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
                      <Icon className="w-3 h-3" />
                      {t(`statuses.${actualite.statut}`)}
                    </span>
                    {actualite.isMisEnAvant && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                        <Star className="w-3 h-3 fill-current" />
                        {t('highlight')}
                      </span>
                    )}
                  </div>
                  
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <Link
                      href={`/actualites/${actualite.id}`}
                      target="_blank"
                      className="p-2.5 bg-white rounded-xl text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                      title={t('modal.view_online')}
                    >
                      <Globe size={18} />
                    </Link>
                    <button
                      onClick={() => { setSelectedActualite(actualite); setShowDetailModal(true); }}
                      className="p-2.5 bg-white rounded-xl text-gray-700 hover:bg-gray-100 transition-colors"
                      title={t('view_details')}
                    >
                      <Eye size={18} />
                    </button>
                    <Link
                      href={`/admin/actualites/${actualite.id}/modifier`}
                      className="p-2.5 bg-white rounded-xl text-gray-700 hover:bg-gray-100 transition-colors"
                      title={t('edit')}
                    >
                      <Edit size={18} />
                    </Link>
                    <button
                      onClick={() => handleDelete(actualite.id)}
                      className="p-2.5 bg-red-500 rounded-xl text-white hover:bg-red-600 transition-colors"
                      title={t('delete')}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2 mb-2 leading-tight">
                    {actualite.titre}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-4">
                    {actualite.resume || t('modal.no_resume')}
                  </p>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <Calendar size={12} />
                      {formatDate(actualite.createdAt)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Eye size={12} />
                      {t('views', { count: actualite.nombreVues })}
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
            {t('pagination', { page, totalPages, total })}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={20} />
            </button>
            {[...Array(Math.min(5, totalPages))].map((_, i) => {
              const pageNum = i + 1;
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                    page === pageNum
                      ? 'bg-blue-500 text-white'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      <AnimatePresence>
        {showDetailModal && selectedActualite && (
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
                {/* Image */}
                {selectedActualite.imageUrl && (
                  <img
                    src={selectedActualite.imageUrl}
                    alt={selectedActualite.titre}
                    className="w-full h-48 object-cover rounded-xl"
                  />
                )}

                {/* Title & Status */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    {(() => {
                      const style = STATUT_STYLES[selectedActualite.statut] || STATUT_STYLES.BROUILLON;
                      const Icon = style.icon;
                      return (
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
                          <Icon className="w-3 h-3" />
                          {t(`statuses.${selectedActualite.statut}`)}
                        </span>
                      );
                    })()}
                    {selectedActualite.isMisEnAvant && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                        <Star className="w-3 h-3 fill-current" />
                        {t('highlight')}
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    {selectedActualite.titre}
                  </h3>
                </div>

                {/* Resume */}
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    {t('modal.resume')}
                  </label>
                  <p className="text-gray-700 dark:text-gray-300">
                    {selectedActualite.resume || t('modal.no_resume')}
                  </p>
                </div>

                {/* Meta */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('modal.sector')}</p>
                    <p className="font-medium text-gray-900 dark:text-white">{getSecteurLabel(selectedActualite.secteur)}</p>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('modal.views')}</p>
                    <p className="font-medium text-gray-900 dark:text-white flex items-center gap-1">
                      <TrendingUp size={14} />
                      {selectedActualite.nombreVues}
                    </p>
                  </div>
                </div>

                {/* Author */}
                {selectedActualite.createdByUser && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <User className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {selectedActualite.createdByUser.prenom} {selectedActualite.createdByUser.nom}
                      </p>
                      <p className="text-xs text-gray-500">
                        {t('modal.created_on', { date: formatDate(selectedActualite.createdAt) })}
                      </p>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                    {t('modal.change_status')}
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(STATUT_STYLES).map(([key, style]) => {
                      const Icon = style.icon;
                      const isActive = selectedActualite.statut === key;
                      const isLoading = actionLoading === `${selectedActualite.id}-${key}`;

                      return (
                        <button
                          key={key}
                          onClick={() => handleChangeStatut(selectedActualite.id, key)}
                          disabled={isActive || !!actionLoading}
                          className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all disabled:opacity-50 ${
                            isActive
                              ? `${style.bg} ${style.text} border-2 border-current`
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

                {/* View Online */}
                <Link
                  href={`/actualites/${selectedActualite.id}`}
                  target="_blank"
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl font-medium hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all mb-3"
                >
                  <Globe className="w-4 h-4" />
                  {t('modal.view_online')}
                </Link>

                {/* Toggle Featured */}
                <button
                  onClick={() => handleToggleMisEnAvant(selectedActualite.id, selectedActualite.isMisEnAvant)}
                  disabled={!!actionLoading}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all ${
                    selectedActualite.isMisEnAvant
                      ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {actionLoading === `highlight-${selectedActualite.id}` ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Star className={`w-4 h-4 ${selectedActualite.isMisEnAvant ? 'fill-current' : ''}`} />
                  )}
                  {selectedActualite.isMisEnAvant ? t('modal.remove_highlight') : t('modal.add_highlight')}
                </button>

                {/* Delete */}
                <button
                  onClick={() => handleDelete(selectedActualite.id)}
                  disabled={!!actionLoading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl font-medium hover:bg-red-100 dark:hover:bg-red-900/30 transition-all"
                >
                  {actionLoading === `delete-${selectedActualite.id}` ? (
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
