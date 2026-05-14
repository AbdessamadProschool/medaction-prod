'use client';

import { useState, useEffect, useCallback } from 'react';
import { Link } from '@/i18n/navigation';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import CreateEvenementModal from '@/components/evenements/CreateEvenementModal';
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  MapPin,
  Building2,
  Eye,
  Edit2,
  Loader2,
  RefreshCw,
  Plus,
  Users,
  Play,
  Archive,
  Trash2,
  Star,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useTranslations, useLocale } from 'next-intl';
import EmptyState from '@/components/ui/EmptyState';

interface Evenement {
  id: number;
  titre: string;
  description: string;
  secteur: string;
  typeCategorique: string;
  dateDebut: string;
  dateFin: string | null;
  lieu: string | null;
  statut: string;
  isMisEnAvant: boolean;
  nombreVues: number;
  nombreInscrits: number;
  capaciteMax: number | null;
  createdAt: string;
  commune: { id: number; nom: string; nomArabe?: string };
  etablissement: { id: number; nom: string; nomArabe?: string } | null;
  createdByUser: { nom: string; prenom: string } | null;
}

interface Filters {
  search: string;
  statut: string;
  secteur: string;
  communeId: string;
  dateDebut: string;
  dateFin: string;
}

const STATUT_CONFIG: Record<string, { color: string; bg: string; icon: React.ElementType }> = {
  EN_ATTENTE_VALIDATION: { color: 'text-yellow-600', bg: 'bg-yellow-50', icon: Clock },
  PUBLIEE: { color: 'text-emerald-600', bg: 'bg-emerald-50', icon: CheckCircle },
  EN_ACTION: { color: 'text-blue-600', bg: 'bg-blue-50', icon: Play },
  CLOTUREE: { color: 'text-gray-600', bg: 'bg-gray-100', icon: Archive },
  REJETEE: { color: 'text-red-600', bg: 'bg-red-50', icon: XCircle },
};

const SECTEURS = [
  'EDUCATION',
  'SANTE',
  'SPORT',
  'SOCIAL',
  'CULTUREL',
  'AUTRE',
];

import { Suspense } from 'react';

// ... (keep existing imports, but move AdminEvenementsPage logic to AdminEvenementsContent)

function AdminEvenementsContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const t = useTranslations('admin.events_page');
  const tSectors = useTranslations('admin.users_page.sectors');
  const locale = useLocale();
  
  const [evenements, setEvenements] = useState<Evenement[]>([]);
  const [communes, setCommunes] = useState<{ id: number; nom: string; nomArabe?: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  
  // Filtres
  const searchParams = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    search: searchParams.get('search') || '',
    statut: searchParams.get('statut') || '',
    secteur: searchParams.get('secteur') || '',
    communeId: searchParams.get('communeId') || '',
    dateDebut: searchParams.get('dateDebut') || '',
    dateFin: searchParams.get('dateFin') || '',
  });
  
  // Stats
  const [stats, setStats] = useState({
    total: 0,
    enAttente: 0,
    publiees: 0,
    enCours: 0,
    cloturees: 0,
  });

  // Modal création et détails
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedEvenement, setSelectedEvenement] = useState<Evenement | null>(null);

  // Vérifier authentification
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Charger communes
  useEffect(() => {
    const loadCommunes = async () => {
      try {
        const res = await fetch('/api/map/communes');
        if (res.ok) {
          const data = await res.json();
          setCommunes(data.communes || []);
        }
      } catch (error) {
        console.error('Erreur chargement communes:', error);
      }
    };
    loadCommunes();
  }, []);

  // Charger les événements
  const loadEvenements = useCallback(async () => {
    setRefreshing(true);
    try {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', '15');
      
      if (filters.search) params.set('search', filters.search);
      if (filters.statut) params.set('statut', filters.statut);
      if (filters.secteur) params.set('secteur', filters.secteur);
      if (filters.communeId) params.set('communeId', filters.communeId);
      
      const res = await fetch(`/api/evenements?${params}`);
      if (res.ok) {
        const data = await res.json();
        setEvenements(data.data || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotal(data.pagination?.total || 0);
        
        // Calculer stats depuis les données reçues
        const allEvts = data.data || [];
        setStats({
          total: data.pagination?.total || 0,
          enAttente: allEvts.filter((e: Evenement) => e.statut === 'EN_ATTENTE_VALIDATION').length,
          publiees: allEvts.filter((e: Evenement) => e.statut === 'PUBLIEE').length,
          enCours: allEvts.filter((e: Evenement) => e.statut === 'EN_ACTION').length,
          cloturees: allEvts.filter((e: Evenement) => e.statut === 'CLOTUREE').length,
        });
      }
    } catch (error) {
      console.error('Erreur chargement:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, filters]);

  useEffect(() => {
    loadEvenements();
  }, [loadEvenements]);

  // Reset filtres
  const resetFilters = () => {
    setFilters({
      search: '',
      statut: '',
      secteur: '',
      communeId: '',
      dateDebut: '',
      dateFin: '',
    });
    setPage(1);
  };

  // Valider / Rejeter événement
  const handleValidation = async (id: number, action: 'valider' | 'rejeter') => {
    // Si rejet, demander le motif
    let motifRejet: string | undefined;
    if (action === 'rejeter') {
      const response = prompt(t('messages.reject_reason'));
      if (!response || response.length < 10) {
        toast.error(t('messages.reject_error'));
        return;
      }
      motifRejet = response;
    }

    const promise = new Promise(async (resolve, reject) => {
      try {
        const res = await fetch(`/api/evenements/${id}/valider`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            decision: action === 'valider' ? 'PUBLIEE' : 'REJETEE',
            motifRejet: motifRejet,
          }),
        });
        
        if (res.ok) {
          loadEvenements();
          resolve(true);
        } else {
          const data = await res.json();
          reject(new Error(data.error || t('messages.error')));
        }
      } catch (error) {
        reject(new Error(t('messages.error')));
      }
    });

    toast.promise(promise, {
      loading: action === 'valider' ? 'Validation en cours...' : 'Rejet en cours...',
      success: action === 'valider' ? t('messages.validated') : t('messages.rejected'),
      error: (err) => err.message,
    });
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t('messages.delete_confirm'))) return;

    const promise = new Promise(async (resolve, reject) => {
      try {
        const res = await fetch(`/api/evenements/${id}`, { method: 'DELETE' });
        if (res.ok) {
          loadEvenements();
          resolve(true);
        } else {
          reject(new Error('Erreur lors de la suppression'));
        }
      } catch (e) {
        reject(new Error('Erreur de connexion'));
      }
    });

    toast.promise(promise, {
      loading: 'Suppression en cours...',
      success: 'Événement supprimé avec succès',
      error: (err) => err.message,
    });
  };

  const statusKeyMap: Record<string, string> = {
    'EN_ATTENTE_VALIDATION': 'pending',
    'PUBLIEE': 'published',
    'EN_ACTION': 'in_progress',
    'CLOTUREE': 'closed',
    'REJETEE': 'rejected'
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[hsl(var(--gov-blue))/0.1] border-t-[hsl(var(--gov-blue))] rounded-full animate-spin" />
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground animate-pulse">
            {t('loading') || 'Chargement des événements...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto pb-20">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-[hsl(var(--gov-blue))/0.1] rounded-2xl flex items-center justify-center border border-[hsl(var(--gov-blue))/0.2]">
              <Calendar className="text-[hsl(var(--gov-blue))] w-6 h-6" />
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground">
              {t('title')}
            </h1>
          </div>
          <p className="text-muted-foreground font-medium text-lg ml-15">
            {t('subtitle', { count: total })}
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={loadEvenements}
            disabled={refreshing}
            className="w-12 h-12 flex items-center justify-center bg-card border border-border rounded-2xl hover:bg-muted hover:border-muted-foreground/30 transition-all shadow-sm group"
          >
            <RefreshCw size={20} className={`text-muted-foreground group-hover:text-foreground transition-colors ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-6 h-12 rounded-2xl border font-bold text-xs uppercase tracking-widest transition-all ${
              showFilters 
                ? 'bg-[hsl(var(--gov-blue))] border-[hsl(var(--gov-blue))] text-white shadow-lg shadow-[hsl(var(--gov-blue))/0.2]' 
                : 'bg-card border-border text-foreground hover:bg-muted shadow-sm'
            }`}
          >
            <Filter size={16} />
            {t('filters')}
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="gov-btn-primary h-12 px-8 rounded-2xl text-xs uppercase tracking-widest font-bold"
          >
            <Plus size={18} />
            {t('create')}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        {[
          { label: t('stats.total'), value: stats.total, icon: Calendar, color: 'hsl(var(--gov-blue))' },
          { label: t('stats.pending'), value: stats.enAttente, icon: Clock, color: 'hsl(var(--gov-red))', highlight: true },
          { label: t('stats.published'), value: stats.publiees, icon: CheckCircle, color: 'hsl(var(--gov-green))' },
          { label: t('stats.in_progress'), value: stats.enCours, icon: Play, color: 'hsl(var(--gov-blue))' },
          { label: t('stats.closed'), value: stats.cloturees, icon: Archive, color: 'hsl(var(--gov-muted))' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="gov-stat-card group relative overflow-hidden"
          >
            <div 
              className="absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 opacity-[0.03] transition-transform group-hover:scale-110 group-hover:rotate-12"
              style={{ color: stat.color }}
            >
              <stat.icon className="w-full h-full" />
            </div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center border border-current/10"
                  style={{ backgroundColor: `${stat.color}08`, color: stat.color }}
                >
                  <stat.icon className="w-5 h-5" />
                </div>
                {stat.highlight && stat.value > 0 && (
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[hsl(var(--gov-red))] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[hsl(var(--gov-red))]"></span>
                  </span>
                )}
              </div>
              <p className="text-3xl font-black text-foreground mb-1 tracking-tight">{stat.value}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{stat.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filtres avancés */}
      <AnimatePresence>
        {showFilters && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-card border border-border rounded-3xl p-8 shadow-xl shadow-[hsl(var(--gov-blue))/0.05]">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Recherche */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">
                    {t('filter_labels.search')}
                  </label>
                  <div className="relative group">
                    <Search className={`absolute top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-[hsl(var(--gov-blue))] transition-colors ${locale === 'ar' ? 'right-4' : 'left-4'}`} size={18} />
                    <input
                      type="text"
                      placeholder={t('filter_labels.search_placeholder') || 'Rechercher...'}
                      value={filters.search}
                      onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                      className="gov-input pl-12 h-12 text-sm font-medium"
                    />
                  </div>
                </div>

                {/* Statut */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">
                    {t('filter_labels.statut')}
                  </label>
                  <select
                    value={filters.statut}
                    onChange={(e) => setFilters({ ...filters, statut: e.target.value })}
                    className="gov-input h-12 text-sm font-medium appearance-none cursor-pointer"
                  >
                    <option value="">{t('filter_labels.all_statuses')}</option>
                    <option value="EN_ATTENTE_VALIDATION">{t('status.pending')}</option>
                    <option value="PUBLIEE">{t('status.published')}</option>
                    <option value="EN_ACTION">{t('status.in_progress')}</option>
                    <option value="CLOTUREE">{t('status.closed')}</option>
                    <option value="REJETEE">{t('status.rejected')}</option>
                  </select>
                </div>

                {/* Secteur */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">
                    {t('filter_labels.secteur')}
                  </label>
                  <select
                    value={filters.secteur}
                    onChange={(e) => setFilters({ ...filters, secteur: e.target.value })}
                    className="gov-input h-12 text-sm font-medium appearance-none cursor-pointer"
                  >
                    <option value="">{t('filter_labels.all_sectors')}</option>
                    {SECTEURS.map(s => (
                      <option key={s} value={s}>{tSectors(s)}</option>
                    ))}
                  </select>
                </div>

                {/* Commune */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">
                    {t('filter_labels.commune')}
                  </label>
                  <select
                    value={filters.communeId}
                    onChange={(e) => setFilters({ ...filters, communeId: e.target.value })}
                    className="gov-input h-12 text-sm font-medium appearance-none cursor-pointer"
                  >
                    <option value="">{t('filter_labels.all_muncipalities')}</option>
                    {communes.map(c => (
                      <option key={c.id} value={c.id}>
                        {locale === 'ar' ? (c.nomArabe || c.nom) : c.nom}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end mt-8 pt-6 border-t border-border/50">
                <button
                  onClick={resetFilters}
                  className="flex items-center gap-2 px-6 py-2.5 text-muted-foreground hover:text-foreground font-bold text-[10px] uppercase tracking-widest transition-colors"
                >
                  <RefreshCw size={14} />
                  {t('filter_labels.reset')}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table */}
      <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-xl shadow-[hsl(var(--gov-blue))/0.05]">
        <div className="overflow-x-auto">
          <table className="gov-table">
            <thead>
              <tr className="bg-muted/30">
                <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground whitespace-nowrap">
                  {t('table.event')}
                </th>
                <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground whitespace-nowrap">
                  {t('table.sector')}
                </th>
                <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground whitespace-nowrap">
                  {t('table.location')}
                </th>
                <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground whitespace-nowrap">
                  {t('table.date')}
                </th>
                <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground whitespace-nowrap">
                  {t('table.status')}
                </th>
                <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground whitespace-nowrap">
                  {t('table.registrations')}
                </th>
                <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-right whitespace-nowrap">
                  {t('table.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {evenements.map((evenement) => {
                const statutConfig = STATUT_CONFIG[evenement.statut] || STATUT_CONFIG.EN_ATTENTE_VALIDATION;
                const StatutIcon = statutConfig.icon;
                const secteurLabel = tSectors(evenement.secteur);
                
                return (
                  <tr key={evenement.id} className="group hover:bg-muted/50 transition-colors">
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                        <p className="font-extrabold text-foreground group-hover:text-[hsl(var(--gov-blue))] transition-colors leading-tight mb-1">
                          {evenement.titre}
                        </p>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">{evenement.typeCategorique}</p>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="px-3 py-1 bg-muted rounded-full text-[10px] font-bold uppercase tracking-widest text-muted-foreground border border-border">
                        {secteurLabel}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <MapPin size={14} className="text-[hsl(var(--gov-red))]" />
                        <span className="line-clamp-1">
                          {evenement.lieu || (locale === 'ar' ? (evenement.commune?.nomArabe || evenement.commune?.nom) : evenement.commune?.nom) || '-'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <Calendar size={14} className="text-[hsl(var(--gov-blue))]" />
                        {new Date(evenement.dateDebut).toLocaleDateString(locale === 'ar' ? 'ar-MA' : 'fr-FR')}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm ${statutConfig.bg} ${statutConfig.color} border-current/10`}>
                        <StatutIcon size={12} />
                        {t('status.' + (statusKeyMap[evenement.statut] || 'pending'))}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center border border-border">
                          <Users size={14} className="text-muted-foreground" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-foreground">
                            {evenement.nombreInscrits}
                          </span>
                          {evenement.capaciteMax && (
                            <span className="text-[10px] font-bold uppercase text-muted-foreground/60 tracking-tighter">
                              Max {evenement.capaciteMax}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center justify-end gap-2">
                        {/* Voir */}
                        <button
                          onClick={() => { setSelectedEvenement(evenement); setShowDetailModal(true); }}
                          className="w-9 h-9 flex items-center justify-center bg-card border border-border text-muted-foreground hover:text-[hsl(var(--gov-blue))] hover:bg-[hsl(var(--gov-blue))/0.05] hover:border-[hsl(var(--gov-blue))/0.2] rounded-xl transition-all shadow-sm"
                          title={t('actions.view')}
                        >
                          <Eye size={16} />
                        </button>
                        
                        {/* Modifier */}
                        {evenement.statut !== 'CLOTUREE' && (
                          <Link
                            href={`/admin/evenements/${evenement.id}/modifier`}
                            className="w-9 h-9 flex items-center justify-center bg-card border border-border text-muted-foreground hover:text-amber-600 hover:bg-amber-50 hover:border-amber-200 rounded-xl transition-all shadow-sm"
                            title={t('actions.edit')}
                          >
                            <Edit2 size={16} />
                          </Link>
                        )}

                        {/* Valider/Rejeter */}
                        {evenement.statut === 'EN_ATTENTE_VALIDATION' && (
                          <>
                            <button
                              onClick={() => handleValidation(evenement.id, 'valider')}
                              className="w-9 h-9 flex items-center justify-center bg-[hsl(var(--gov-green))/0.05] border border-[hsl(var(--gov-green))/0.1] text-[hsl(var(--gov-green))] hover:bg-[hsl(var(--gov-green))] hover:text-white rounded-xl transition-all shadow-sm"
                              title={t('actions.validate')}
                            >
                              <CheckCircle size={16} />
                            </button>
                            <button
                              onClick={() => handleValidation(evenement.id, 'rejeter')}
                              className="w-9 h-9 flex items-center justify-center bg-[hsl(var(--gov-red))/0.05] border border-[hsl(var(--gov-red))/0.1] text-[hsl(var(--gov-red))] hover:bg-[hsl(var(--gov-red))] hover:text-white rounded-xl transition-all shadow-sm"
                              title={t('actions.reject')}
                            >
                              <XCircle size={16} />
                            </button>
                          </>
                        )}
                        
                        {/* Supprimer */}
                        <button
                          onClick={() => handleDelete(evenement.id)}
                          className="w-9 h-9 flex items-center justify-center bg-card border border-border text-muted-foreground hover:text-[hsl(var(--gov-red))] hover:bg-[hsl(var(--gov-red))/0.05] hover:border-[hsl(var(--gov-red))/0.2] rounded-xl transition-all shadow-sm"
                          title="Supprimer"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {evenements.length === 0 && (
          <div className="p-8">
            <EmptyState
              icon={<Calendar className="w-10 h-10" />}
              title={t('empty')}
              description="Aucun événement ne correspond à vos critères actuels. Vous pouvez en créer un nouveau ou ajuster vos filtres."
              action={
                (filters.search || filters.statut || filters.secteur || filters.communeId) ? (
                  <button 
                    onClick={resetFilters}
                    className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors mt-2"
                  >
                    Effacer les filtres
                  </button>
                ) : undefined
              }
            />
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-8 py-6 border-t border-border/50 bg-muted/10">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              {t('pagination.page', { current: page, total: totalPages })}
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-10 h-10 flex items-center justify-center bg-card border border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground/30 rounded-xl transition-all shadow-sm disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {locale === 'ar' ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
              </button>
              <div className="flex items-center gap-1">
                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                  const pageNum = i + 1;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`w-10 h-10 rounded-xl text-xs font-bold transition-all ${
                        page === pageNum 
                          ? 'bg-[hsl(var(--gov-blue))] text-white shadow-lg shadow-[hsl(var(--gov-blue))/0.2]' 
                          : 'bg-card border border-border text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="w-10 h-10 flex items-center justify-center bg-card border border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground/30 rounded-xl transition-all shadow-sm disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {locale === 'ar' ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Création */}
      <CreateEvenementModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          setShowCreateModal(false);
          loadEvenements();
        }}
      />

      {/* Detail Modal (Institutional Sidebar) */}
      <AnimatePresence>
        {showDetailModal && selectedEvenement && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDetailModal(false)}
              className="fixed inset-0 bg-background/80 backdrop-blur-md z-[100]"
            />
            <motion.div
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-xl bg-card shadow-2xl z-[101] overflow-y-auto border-l border-border"
            >
              {/* Header */}
              <div className="sticky top-0 bg-card/80 backdrop-blur-md border-b border-border px-8 py-6 flex items-center justify-between z-10">
                <div>
                  <h2 className="text-xl font-extrabold text-foreground">
                    {selectedEvenement.titre}
                  </h2>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">
                    {selectedEvenement.typeCategorique}
                  </p>
                </div>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="p-2.5 hover:bg-muted rounded-xl transition-colors border border-transparent hover:border-border text-muted-foreground hover:text-foreground"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Content */}
              <div className="p-8 space-y-10">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-6 bg-muted/30 rounded-3xl border border-border/50">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Secteur</p>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-[hsl(var(--gov-blue))/0.1] flex items-center justify-center text-[hsl(var(--gov-blue))]">
                        <Building2 size={16} />
                      </div>
                      <p className="font-extrabold text-foreground">{tSectors(selectedEvenement.secteur)}</p>
                    </div>
                  </div>
                  <div className="p-6 bg-muted/30 rounded-3xl border border-border/50">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Inscriptions</p>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-[hsl(var(--gov-green))/0.1] flex items-center justify-center text-[hsl(var(--gov-green))]">
                        <Users size={16} />
                      </div>
                      <p className="font-extrabold text-foreground">
                        {selectedEvenement.nombreInscrits}
                        {selectedEvenement.capaciteMax && <span className="text-muted-foreground/60 font-medium ml-1">/ {selectedEvenement.capaciteMax}</span>}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Info List */}
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center flex-shrink-0 border border-border">
                      <Calendar className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Période</p>
                      <p className="font-bold text-foreground">
                        {new Date(selectedEvenement.dateDebut).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                        {selectedEvenement.dateFin && (
                          <span className="block text-sm text-muted-foreground/80 mt-1">
                            au {new Date(selectedEvenement.dateFin).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center flex-shrink-0 border border-border">
                      <MapPin className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Localisation</p>
                      <p className="font-bold text-foreground">
                        {selectedEvenement.lieu || (locale === 'ar' ? (selectedEvenement.commune?.nomArabe || selectedEvenement.commune?.nom) : selectedEvenement.commune?.nom)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-4">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-foreground flex items-center gap-2">
                    <div className="w-1.5 h-4 bg-[hsl(var(--gov-blue))] rounded-full" />
                    Description de l'événement
                  </h4>
                  <div className="p-6 bg-muted/20 rounded-3xl border border-border/50 text-muted-foreground leading-relaxed font-medium">
                    {selectedEvenement.description}
                  </div>
                </div>

                {/* Status Section */}
                <div className="p-6 bg-[hsl(var(--gov-blue))/0.03] rounded-3xl border border-[hsl(var(--gov-blue))/0.1] space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Statut Actuel</span>
                    <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm ${STATUT_CONFIG[selectedEvenement.statut]?.bg} ${STATUT_CONFIG[selectedEvenement.statut]?.color} border-current/10`}>
                      {t('status.' + (statusKeyMap[selectedEvenement.statut] || 'pending'))}
                    </span>
                  </div>
                  {selectedEvenement.isMisEnAvant && (
                    <div className="flex items-center gap-2 text-amber-600 bg-amber-500/5 px-4 py-2 rounded-xl border border-amber-500/10">
                      <Star className="w-4 h-4 fill-current" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Événement Mis en avant</span>
                    </div>
                  )}
                </div>

                {/* Footer Actions */}
                <div className="grid grid-cols-2 gap-4 pt-10 border-t border-border">
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="px-6 py-4 bg-muted text-muted-foreground rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-muted/80 transition-all border border-transparent hover:border-border"
                  >
                    Fermer
                  </button>
                  <Link
                    href={`/admin/evenements/${selectedEvenement.id}/modifier`}
                    className="gov-btn-primary py-4 rounded-2xl justify-center text-xs uppercase tracking-widest font-bold"
                  >
                    <Edit2 size={16} />
                    Modifier complet
                  </Link>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AdminEvenementsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    }>
      <AdminEvenementsContent />
    </Suspense>
  );
}
