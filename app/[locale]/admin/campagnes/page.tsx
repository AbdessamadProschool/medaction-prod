'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Megaphone,
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
  MapPin,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Target,
  Users,
  TrendingUp,
  Loader2,
  X,
  Play,
  Pause,
  BarChart3,
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

interface Campagne {
  id: number;
  titre: string;
  description: string;
  objectif: string | null;
  secteur: string;
  statut: string;
  dateDebut: string;
  dateFin: string | null;
  nombreParticipants: number;
  objectifParticipants: number | null;
  budget: number | null;
  createdAt: string;
  createdByUser: { id: number; nom: string; prenom: string } | null;
  commune: { id: number; nom: string } | null;
}

const STATUT_CONFIG: Record<string, { bg: string; text: string; icon: React.ElementType; label: string }> = {
  BROUILLON: { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-600 dark:text-gray-300', icon: Edit, label: 'Brouillon' },
  EN_ATTENTE: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400', icon: Clock, label: 'En attente' },
  ACTIVE: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400', icon: Play, label: 'Active' },
  EN_PAUSE: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-400', icon: Pause, label: 'En pause' },
  TERMINEE: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', icon: CheckCircle, label: 'Terminée' },
  ANNULEE: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', icon: XCircle, label: 'Annulée' },
};

const SECTEURS = [
  { value: '', label: 'Tous les secteurs' },
  { value: 'EDUCATION', label: 'Éducation' },
  { value: 'SANTE', label: 'Santé' },
  { value: 'SPORT', label: 'Sport' },
  { value: 'SOCIAL', label: 'Social' },
  { value: 'CULTUREL', label: 'Culturel' },
  { value: 'ENVIRONNEMENT', label: 'Environnement' },
];

export default function AdminCampagnesPage() {
  const t = useTranslations('admin_campagnes');
  const [campagnes, setCampagnes] = useState<Campagne[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  
  // Filters
  const [search, setSearch] = useState('');
  const [statutFilter, setStatutFilter] = useState('');
  const [secteurFilter, setSecteurFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Modal
  const [selectedCampagne, setSelectedCampagne] = useState<Campagne | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    actives: 0,
    enAttente: 0,
    terminees: 0,
    totalParticipants: 0,
  });

  const fetchCampagnes = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', '12');
      if (search) params.set('search', search);
      if (statutFilter) params.set('statut', statutFilter);
      if (secteurFilter) params.set('secteur', secteurFilter);

      const res = await fetch(`/api/campagnes?${params}`);
      if (res.ok) {
        const data = await res.json();
        setCampagnes(data.data || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotal(data.pagination?.total || 0);
        
        // Calculate stats
        const allCampagnes = data.data || [];
        setStats({
          total: data.pagination?.total || 0,
          actives: allCampagnes.filter((c: Campagne) => c.statut === 'ACTIVE').length,
          enAttente: allCampagnes.filter((c: Campagne) => c.statut === 'EN_ATTENTE').length,
          terminees: allCampagnes.filter((c: Campagne) => c.statut === 'TERMINEE').length,
          totalParticipants: allCampagnes.reduce((acc: number, c: Campagne) => acc + (c.nombreParticipants || 0), 0),
        });
      }
    } catch (error) {
      console.error('Erreur chargement campagnes:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }, [page, search, statutFilter, secteurFilter]);

  useEffect(() => {
    const debounce = setTimeout(fetchCampagnes, 300);
    return () => clearTimeout(debounce);
  }, [fetchCampagnes]);

  const handleChangeStatut = async (id: number, newStatut: string) => {
    setActionLoading(`${id}-${newStatut}`);
    try {
      const res = await fetch(`/api/campagnes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statut: newStatut }),
      });

      if (res.ok) {
        toast.success(`Statut modifié: ${STATUT_CONFIG[newStatut]?.label || newStatut}`);
        fetchCampagnes();
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

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer cette campagne ?')) return;
    
    setActionLoading(`delete-${id}`);
    try {
      const res = await fetch(`/api/campagnes/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Campagne supprimée');
        fetchCampagnes();
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
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getProgressPercentage = (campagne: Campagne) => {
    if (!campagne.objectifParticipants) return 0;
    return Math.min(100, Math.round((campagne.nombreParticipants / campagne.objectifParticipants) * 100));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-purple-200 dark:shadow-purple-900/30">
              <Megaphone className="w-6 h-6" />
            </div>
            {t('title')}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {t('subtitle', { total })}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={fetchCampagnes}
            className="p-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all ${
              showFilters
                ? 'bg-purple-50 dark:bg-purple-900/30 border-purple-200 dark:border-purple-700 text-purple-700 dark:text-purple-400'
                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            <Filter size={18} />
            {t('filters')}
          </button>
          <Link
            href="/admin/campagnes/nouvelle"
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl font-medium shadow-lg shadow-purple-200 dark:shadow-purple-900/30 hover:shadow-xl transition-all"
          >
            <Plus size={18} />
            {t('new_campaign')}
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-5 text-white"
        >
          <div className="flex items-center justify-between mb-2">
            <BarChart3 className="w-6 h-6 opacity-80" />
            <span className="text-2xl font-bold">{stats.total}</span>
          </div>
          <p className="text-sm opacity-80">{t('stats.total')}</p>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700"
        >
          <div className="flex items-center justify-between mb-2">
            <Play className="w-6 h-6 text-emerald-500" />
            <span className="text-2xl font-bold text-gray-900 dark:text-white">{stats.actives}</span>
          </div>
          <p className="text-sm text-gray-500">{t('stats.active')}</p>
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
            <Users className="w-6 h-6 text-blue-500" />
            <span className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalParticipants}</span>
          </div>
          <p className="text-sm text-gray-500">{t('stats.participants')}</p>
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
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t('search_placeholder')}
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-purple-500 dark:text-white"
                />
              </div>

              {/* Statut */}
              <select
                value={statutFilter}
                onChange={(e) => setStatutFilter(e.target.value)}
                className="px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-purple-500 dark:text-white"
              >
                <option value="">{t('all_statuses')}</option>
                {Object.entries(STATUT_CONFIG).map(([key, config]) => (
                  <option key={key} value={key}>
                    {t(`status.${{
                      BROUILLON: 'draft',
                      EN_ATTENTE: 'pending',
                      ACTIVE: 'active',
                      EN_PAUSE: 'paused',
                      TERMINEE: 'finished',
                      ANNULEE: 'cancelled'
                    }[key] || 'draft'}`)}
                  </option>
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
              <div className="h-5 w-3/4 bg-gray-200 dark:bg-gray-700 rounded mb-3" />
              <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded mb-4" />
              <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded mb-4" />
              <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          ))
        ) : campagnes.length === 0 ? (
          <div className="col-span-full text-center py-16">
            <Megaphone className="w-16 h-16 text-gray-200 dark:text-gray-700 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {t('no_campaigns')}
            </h3>
            <p className="text-gray-500">
              {search || statutFilter ? t('no_results') : t('create_first')}
            </p>
          </div>
        ) : (
          campagnes.map((campagne) => {
            const statutConfig = STATUT_CONFIG[campagne.statut] || STATUT_CONFIG.BROUILLON;
            const StatutIcon = statutConfig.icon;
            const progress = getProgressPercentage(campagne);
            
            return (
              <motion.div
                key={campagne.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="group bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-all"
              >
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${statutConfig.bg} ${statutConfig.text}`}>
                      <StatutIcon className="w-3 h-3" />
                      {t(`status.${{
                        BROUILLON: 'draft',
                        EN_ATTENTE: 'pending',
                        ACTIVE: 'active',
                        EN_PAUSE: 'paused',
                        TERMINEE: 'finished',
                        ANNULEE: 'cancelled'
                      }[campagne.statut] || 'draft'}`)}
                    </span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => { setSelectedCampagne(campagne); setShowDetailModal(true); }}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Eye size={16} />
                      </button>
                      <Link
                        href={`/admin/campagnes/${campagne.id}/modifier`}
                        className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                      >
                        <Edit size={16} />
                      </Link>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2 mb-2 leading-tight">
                    {campagne.titre}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-4">
                    {campagne.description || t('no_description')}
                  </p>

                  {/* Progress */}
                  {campagne.objectifParticipants && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                        <span>{t('progress')}</span>
                        <span className="font-medium">{progress}%</span>
                      </div>
                      <div className="w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 0.5 }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {t('participants_count', { count: campagne.nombreParticipants, total: campagne.objectifParticipants })}
                      </p>
                    </div>
                  )}

                  {/* Meta */}
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-1">
                      <Calendar size={12} />
                      {formatDate(campagne.dateDebut)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Users size={12} />
                      {campagne.nombreParticipants} participants
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
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      <AnimatePresence>
        {showDetailModal && selectedCampagne && (
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
                  {t('details')}
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
                {/* Status & Title */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    {(() => {
                      const config = STATUT_CONFIG[selectedCampagne.statut] || STATUT_CONFIG.BROUILLON;
                      const Icon = config.icon;
                      return (
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
                          <Icon className="w-3 h-3" />
                          {t(`status.${{
                            BROUILLON: 'draft',
                            EN_ATTENTE: 'pending',
                            ACTIVE: 'active',
                            EN_PAUSE: 'paused',
                            TERMINEE: 'finished',
                            ANNULEE: 'cancelled'
                          }[selectedCampagne.statut] || 'draft'}`)}
                        </span>
                      );
                    })()}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    {selectedCampagne.titre}
                  </h3>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    {t('description')}
                  </label>
                  <p className="text-gray-700 dark:text-gray-300">
                    {selectedCampagne.description || t('no_description')}
                  </p>
                </div>

                {/* Progress */}
                {selectedCampagne.objectifParticipants && (
                  <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('progress')}</span>
                      <span className="text-lg font-bold text-purple-600">{getProgressPercentage(selectedCampagne)}%</span>
                    </div>
                    <div className="w-full h-3 bg-white dark:bg-gray-700 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${getProgressPercentage(selectedCampagne)}%` }}
                      />
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                      {t('participants_count', { count: selectedCampagne.nombreParticipants, total: selectedCampagne.objectifParticipants })}
                    </p>
                  </div>
                )}

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('start_date')}</p>
                    <p className="font-medium text-gray-900 dark:text-white">{formatDate(selectedCampagne.dateDebut)}</p>
                  </div>
                  {selectedCampagne.dateFin && (
                    <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('end_date')}</p>
                      <p className="font-medium text-gray-900 dark:text-white">{formatDate(selectedCampagne.dateFin)}</p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                    {t('change_status')}
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(STATUT_CONFIG).map(([key, config]) => {
                      const Icon = config.icon;
                      const isActive = selectedCampagne.statut === key;
                      const isLoading = actionLoading === `${selectedCampagne.id}-${key}`;

                      return (
                        <button
                          key={key}
                          onClick={() => handleChangeStatut(selectedCampagne.id, key)}
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
                          {t(`status.${{
                            BROUILLON: 'draft',
                            EN_ATTENTE: 'pending',
                            ACTIVE: 'active',
                            EN_PAUSE: 'paused',
                            TERMINEE: 'finished',
                            ANNULEE: 'cancelled'
                          }[key] || 'draft'}`)}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Delete */}
                <button
                  onClick={() => handleDelete(selectedCampagne.id)}
                  disabled={!!actionLoading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl font-medium hover:bg-red-100 dark:hover:bg-red-900/30 transition-all"
                >
                  {actionLoading === `delete-${selectedCampagne.id}` ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  {t('delete_campaign')}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
