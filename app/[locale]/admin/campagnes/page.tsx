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
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import EmptyState from '@/components/ui/EmptyState';

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
  BROUILLON: { bg: 'bg-muted', text: 'text-muted-foreground', icon: Edit, label: 'Brouillon' },
  EN_ATTENTE: { bg: 'bg-amber-500/10', text: 'text-amber-600', icon: Clock, label: 'En attente' },
  ACTIVE: { bg: 'bg-[hsl(var(--gov-green))/0.1]', text: 'text-[hsl(var(--gov-green))]', icon: Play, label: 'Active' },
  EN_PAUSE: { bg: 'bg-orange-500/10', text: 'text-orange-600', icon: Pause, label: 'En pause' },
  TERMINEE: { bg: 'bg-[hsl(var(--gov-blue))/0.1]', text: 'text-[hsl(var(--gov-blue))]', icon: CheckCircle, label: 'Terminée' },
  ANNULEE: { bg: 'bg-[hsl(var(--gov-red))/0.1]', text: 'text-[hsl(var(--gov-red))]', icon: XCircle, label: 'Annulée' },
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
    const promise = new Promise(async (resolve, reject) => {
      try {
        const res = await fetch(`/api/campagnes/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ statut: newStatut }),
        });

        if (res.ok) {
          fetchCampagnes();
          setShowDetailModal(false);
          resolve(true);
        } else {
          const data = await res.json();
          reject(new Error(data.error || 'Erreur'));
        }
      } catch (error) {
        reject(new Error('Erreur de connexion'));
      }
    });

    toast.promise(promise, {
      loading: 'Mise à jour du statut...',
      success: `Statut modifié: ${STATUT_CONFIG[newStatut]?.label || newStatut}`,
      error: (err) => err.message,
    });
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer cette campagne ?')) return;
    
    const promise = new Promise(async (resolve, reject) => {
      try {
        const res = await fetch(`/api/campagnes/${id}`, { method: 'DELETE' });
        if (res.ok) {
          fetchCampagnes();
          setShowDetailModal(false);
          resolve(true);
        } else {
          reject(new Error('Erreur lors de la suppression'));
        }
      } catch (error) {
        reject(new Error('Erreur de connexion'));
      }
    });

    toast.promise(promise, {
      loading: 'Suppression en cours...',
      success: 'Campagne supprimée',
      error: (err) => err.message,
    });
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
    <div className="space-y-8 bg-background min-h-screen p-4 sm:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-[hsl(var(--gov-blue))] to-[hsl(var(--gov-blue-dark))] rounded-2xl flex items-center justify-center text-white shadow-lg shadow-[hsl(var(--gov-blue)/0.3)]">
              <Megaphone className="w-6 h-6" />
            </div>
            {t('title')}
          </h1>
          <p className="text-muted-foreground mt-2 font-medium">
            {t('subtitle', { total })}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={fetchCampagnes}
            className="p-2.5 bg-card border border-border rounded-xl hover:bg-muted transition-colors shadow-sm"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border font-bold transition-all shadow-sm ${
              showFilters
                ? 'bg-[hsl(var(--gov-blue))] border-[hsl(var(--gov-blue))] text-white shadow-lg shadow-[hsl(var(--gov-blue)/0.2)]'
                : 'bg-card border-border text-foreground hover:bg-muted'
            }`}
          >
            <Filter size={18} />
            {t('filters')}
          </button>
          <Link
            href="/admin/campagnes/nouvelle"
            className="gov-btn-primary"
          >
            <Plus size={18} />
            {t('new_campaign')}
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: t('stats.total'), value: stats.total, icon: BarChart3, gradient: 'from-[hsl(var(--gov-blue))] to-[hsl(var(--gov-blue-dark))]' },
          { label: t('stats.active'), value: stats.actives, icon: Play, gradient: 'from-[hsl(var(--gov-green))] to-[hsl(var(--gov-green-dark))]' },
          { label: t('stats.pending'), value: stats.enAttente, icon: Clock, gradient: 'from-amber-400 to-amber-600' },
          { label: t('stats.participants'), value: stats.totalParticipants, icon: Users, gradient: 'from-purple-500 to-purple-700' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="gov-stat-card group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform`}>
                <stat.icon className="w-5 h-5" />
              </div>
            </div>
            <p className="gov-stat-value">{stat.value}</p>
            <p className="gov-stat-label">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="gov-card p-5 overflow-hidden border-border"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative lg:col-span-2 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-[hsl(var(--gov-blue))] transition-colors" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t('search_placeholder')}
                  className="gov-input pl-12"
                />
              </div>

              {/* Statut */}
              <select
                value={statutFilter}
                onChange={(e) => setStatutFilter(e.target.value)}
                className="gov-input py-3"
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
                className="flex items-center justify-center gap-2 px-4 py-3 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-all font-bold text-sm border border-transparent hover:border-border"
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
            <div key={i} className="bg-card rounded-2xl p-6 animate-pulse border border-border">
              <div className="h-5 w-3/4 bg-muted rounded mb-3" />
              <div className="h-4 w-full bg-muted rounded mb-4" />
              <div className="h-2 w-full bg-muted rounded mb-4" />
              <div className="h-8 w-24 bg-muted rounded" />
            </div>
          ))
        ) : campagnes.length === 0 ? (
          <div className="col-span-full">
            <EmptyState
              icon={<Megaphone className="w-10 h-10" />}
              title={t('no_campaigns')}
              description={search || statutFilter || secteurFilter ? t('no_results') : t('create_first')}
              action={
                (search || statutFilter || secteurFilter) ? (
                  <button 
                    onClick={() => { setSearch(''); setStatutFilter(''); setSecteurFilter(''); }}
                    className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors mt-2"
                  >
                    Effacer les filtres
                  </button>
                ) : undefined
              }
            />
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
                className="group bg-card rounded-3xl shadow-sm border border-border overflow-hidden hover:shadow-xl hover:shadow-[hsl(var(--gov-blue)/0.1)] hover:-translate-y-1 transition-all duration-300"
              >
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-5">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border shadow-sm ${statutConfig.bg} ${statutConfig.text} border-current/20`}>
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
                    <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
                      <button
                        onClick={() => { setSelectedCampagne(campagne); setShowDetailModal(true); }}
                        className="p-2 text-muted-foreground hover:text-[hsl(var(--gov-blue))] hover:bg-[hsl(var(--gov-blue))/0.1] rounded-xl transition-all shadow-sm bg-background border border-border"
                      >
                        <Eye size={16} />
                      </button>
                      <Link
                        href={`/admin/campagnes/${campagne.id}/modifier`}
                        className="p-2 text-muted-foreground hover:text-[hsl(var(--gov-blue))] hover:bg-[hsl(var(--gov-blue))/0.1] rounded-xl transition-all shadow-sm bg-background border border-border"
                      >
                        <Edit size={16} />
                      </Link>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 className="font-extrabold text-foreground line-clamp-2 mb-2 leading-tight text-lg group-hover:text-[hsl(var(--gov-blue))] transition-colors">
                    {campagne.titre}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-6 font-medium">
                    {campagne.description || t('no_description')}
                  </p>

                  {/* Progress */}
                  {campagne.objectifParticipants && (
                    <div className="mb-6 p-4 bg-muted/30 rounded-2xl border border-border/50">
                      <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                        <span>{t('progress')}</span>
                        <span className="text-[hsl(var(--gov-blue))]">{progress}%</span>
                      </div>
                      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-[hsl(var(--gov-blue))] to-[hsl(var(--gov-blue-dark))]"
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                        />
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-2 font-bold">
                        {t('participants_count', { count: campagne.nombreParticipants, total: campagne.objectifParticipants })}
                      </p>
                    </div>
                  )}

                  {/* Meta */}
                  <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-widest text-muted-foreground pt-5 border-t border-border/50">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 bg-muted rounded-md flex items-center justify-center">
                        <Calendar size={12} className="text-[hsl(var(--gov-blue))]" />
                      </div>
                      {formatDate(campagne.dateDebut)}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 bg-muted rounded-md flex items-center justify-center">
                        <Users size={12} className="text-[hsl(var(--gov-gold))]" />
                      </div>
                      {campagne.nombreParticipants}
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
        <div className="flex items-center justify-between px-6 py-5 bg-card rounded-3xl border border-border shadow-sm">
          <p className="text-sm text-muted-foreground font-bold uppercase tracking-widest">
            Page {page} sur {totalPages}
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2.5 text-foreground hover:text-[hsl(var(--gov-blue))] bg-background hover:bg-muted rounded-xl border border-border disabled:opacity-30 transition-all shadow-sm"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2.5 text-foreground hover:text-[hsl(var(--gov-blue))] bg-background hover:bg-muted rounded-xl border border-border disabled:opacity-30 transition-all shadow-sm"
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
              className="fixed inset-0 bg-background/80 backdrop-blur-md z-50"
            />
            <motion.div
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-xl bg-card shadow-2xl z-50 overflow-y-auto border-l border-border"
            >
              {/* Modal Header */}
              <div className="sticky top-0 bg-card/80 backdrop-blur-md border-b border-border px-8 py-6 flex items-center justify-between z-10">
                <h2 className="text-xl font-extrabold text-foreground">
                  {t('details')}
                </h2>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="p-2.5 hover:bg-muted rounded-xl transition-colors border border-transparent hover:border-border"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-8 space-y-8">
                {/* Status & Title */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    {(() => {
                      const config = STATUT_CONFIG[selectedCampagne.statut] || STATUT_CONFIG.BROUILLON;
                      const Icon = config.icon;
                      return (
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border shadow-sm ${config.bg} ${config.text} border-current/20`}>
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
                  <h3 className="text-2xl font-extrabold text-foreground leading-tight">
                    {selectedCampagne.titre}
                  </h3>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
                    {t('description')}
                  </label>
                  <div className="p-5 bg-muted/30 rounded-2xl border border-border/50 text-foreground font-medium leading-relaxed">
                    {selectedCampagne.description || t('no_description')}
                  </div>
                </div>

                {/* Progress */}
                {selectedCampagne.objectifParticipants && (
                  <div className="p-6 bg-gradient-to-br from-[hsl(var(--gov-blue))/0.05] to-transparent rounded-3xl border border-[hsl(var(--gov-blue))/0.1]">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{t('progress')}</span>
                      <span className="text-xl font-extrabold text-[hsl(var(--gov-blue))]">{getProgressPercentage(selectedCampagne)}%</span>
                    </div>
                    <div className="w-full h-3 bg-muted rounded-full overflow-hidden shadow-inner">
                      <motion.div
                        className="h-full bg-gradient-to-r from-[hsl(var(--gov-blue))] to-[hsl(var(--gov-blue-dark))]"
                        initial={{ width: 0 }}
                        animate={{ width: `${getProgressPercentage(selectedCampagne)}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                      />
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-3 font-bold uppercase tracking-widest">
                      {t('participants_count', { count: selectedCampagne.nombreParticipants, total: selectedCampagne.objectifParticipants })}
                    </p>
                  </div>
                )}

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-muted/50 rounded-2xl border border-border/50">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">{t('start_date')}</p>
                    <p className="font-bold text-foreground">{formatDate(selectedCampagne.dateDebut)}</p>
                  </div>
                  {selectedCampagne.dateFin && (
                    <div className="p-4 bg-muted/50 rounded-2xl border border-border/50">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">{t('end_date')}</p>
                      <p className="font-bold text-foreground">{formatDate(selectedCampagne.dateFin)}</p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-4">
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
                          className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-50 border shadow-sm ${
                            isActive
                              ? `${config.bg} ${config.text} border-current/30 scale-[1.02] ring-2 ring-offset-2 ring-offset-card ring-current/20`
                              : 'bg-card text-muted-foreground border-border hover:bg-muted hover:text-foreground'
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
                  className="w-full flex items-center justify-center gap-2 px-4 py-4 bg-[hsl(var(--gov-red))/0.05] text-[hsl(var(--gov-red))] rounded-2xl font-bold text-sm hover:bg-[hsl(var(--gov-red))] hover:text-white transition-all border border-[hsl(var(--gov-red))/0.2] shadow-sm active:scale-95"
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
