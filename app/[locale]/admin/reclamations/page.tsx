'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from '@/i18n/navigation';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Info, Minus, Edit, Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  User,
  MapPin,
  Calendar,
  Building2,
  MoreVertical,
  X,
  UserPlus,
  Flag,
  Eye,
  Loader2,
  RefreshCw,
  Download,
  ArrowUpDown,
  Check,
  Ban,
  MessageSquare,
  Trash2,
  Shield,
  FileText,
  Mail,
  Phone,
  Paperclip,
  ExternalLink,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { PermissionGuard } from '@/hooks/use-permission';
import { useTranslations, useLocale } from 'next-intl';
import EmptyState from '@/components/ui/EmptyState';

interface Reclamation {
  id: number;
  reference?: string;
  code: string;
  titre: string;
  description: string;
  categorie: string;
  statut: string | null;
  isUrgente: boolean;
  affectationReclamation: string;
  createdAt: string;
  updatedAt?: string;
  photoUrl?: string;
  citoyen: { id: number; nom: string; prenom: string; email?: string; telephone?: string } | null;
  user: { nom: string; prenom: string; email: string; telephone?: string } | null;
  auteur?: { nom: string; telephone?: string };
  commune: { id: number; nom: string; nomArabe?: string };
  etablissement: { id: number; nom: string; nomArabe?: string } | null;
  affecteeAAutorite: { id: number; nom: string; prenom: string; role?: string; email?: string } | null;
  agentAffecte?: { id: number; nom: string; prenom?: string; email?: string; role?: string };
  agentId?: number;
}

interface Agent {
  id: number;
  nom: string;
  prenom: string;
  role: string;
  email: string;
}

interface Filters {
  search: string;
  statut: string;
  affectation: string;
  communeId: string;
  categorie: string;
  dateDebut: string;
  dateFin: string;
}

const STATUT_CONFIG: Record<string, { labelKey: string, color: string, bg: string, icon: any }> = {
  'EN_ATTENTE': { labelKey: 'status_labels.pending', color: 'text-amber-700', bg: 'bg-amber-100', icon: Clock },
  'ACCEPTEE': { labelKey: 'status_labels.accepted', color: 'text-emerald-700', bg: 'bg-emerald-100', icon: CheckCircle },
  'REJETEE': { labelKey: 'status_labels.rejected', color: 'text-red-700', bg: 'bg-red-100', icon: XCircle },
  'AFFECTEE': { labelKey: 'status_labels.assigned', color: 'text-blue-700', bg: 'bg-blue-100', icon: User },
  'TO_DISPATCH': { labelKey: 'status_labels.to_dispatch', color: 'text-purple-700', bg: 'bg-purple-100', icon: ArrowUpDown },
};

export default function AdminReclamationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const t = useTranslations('admin.reclamations_page');
  const tCommon = useTranslations('common');
  const tCategories = useTranslations('reclamation_categories');
  const tActions = useTranslations('actions');
  const locale = useLocale();
  
  const [reclamations, setReclamations] = useState<Reclamation[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [communes, setCommunes] = useState<{ id: number; nom: string; nomArabe?: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  
  // Filtres
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    search: '',
    statut: '',
    affectation: '',
    communeId: '',
    categorie: '',
    dateDebut: '',
    dateFin: '',
  });
  
  // Modals & Detail
  const [selectedReclamation, setSelectedReclamation] = useState<Reclamation | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showAffectationModal, setShowAffectationModal] = useState(false);
  const [showStatutModal, setShowStatutModal] = useState(false);
  const [rejetMotif, setRejetMotif] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // Stats
  const [stats, setStats] = useState({
    total: 0,
    enAttente: 0,
    aDispatcher: 0,
    enCours: 0,
    rejetees: 0,
  });

  // Vérifier authentification
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Charger communes et agents
  useEffect(() => {
    const loadMeta = async () => {
      try {
        // Charger les communes
        const communesRes = await fetch('/api/map/communes');
        if (communesRes.ok) {
          const data = await communesRes.json();
          setCommunes(data.communes || []);
        }
        
        // Charger les agents (AUTORITE_LOCALE, DELEGATION et ADMIN peuvent être affectés)
        // On charge tous les utilisateurs actifs puis on filtre côté client
        const agentsRes = await fetch('/api/users?isActive=true&limit=100');
        if (agentsRes.ok) {
          const data = await agentsRes.json();
          // Filtrer pour garder uniquement les rôles pouvant traiter des réclamations
          const eligibleRoles = ['AUTORITE_LOCALE', 'DELEGATION', 'ADMIN', 'SUPER_ADMIN'];
          const filteredAgents = (data.data || []).filter(
            (u: any) => eligibleRoles.includes(u.role)
          );
          setAgents(filteredAgents);
        }
      } catch (error) {
        console.error('Erreur chargement meta:', error);
      }
    };
    loadMeta();
  }, []);

  // Charger les réclamations
  const loadReclamations = useCallback(async () => {
    setRefreshing(true);
    try {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', '15');
      
      if (filters.search) params.set('search', filters.search);
      if (filters.statut) params.set('statut', filters.statut);
      if (filters.affectation) params.set('affectation', filters.affectation);
      if (filters.communeId) params.set('communeId', filters.communeId);
      if (filters.categorie) params.set('categorie', filters.categorie);
      
      const res = await fetch(`/api/reclamations?${params}`);
      if (res.ok) {
        const data = await res.json();
        setReclamations(data.data || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotal(data.pagination?.total || 0);
        
        // Utiliser les stats globales de l'API
        if (data.stats) {
          setStats({
            total: data.pagination?.total || 0,
            enAttente: data.stats.enAttente || 0,
            aDispatcher: data.stats.aDispatcher || 0,
            enCours: data.stats.enCours || 0,
            rejetees: (data.pagination?.total || 0) - (data.stats.enAttente || 0) - (data.stats.acceptees || 0),
          });
        }
      }
    } catch (error) {
      console.error('Erreur chargement:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, filters]);

  useEffect(() => {
    loadReclamations();
  }, [loadReclamations]);

  // Affecter une réclamation
  const handleAffectation = async (agentId: number | null) => {
    if (!selectedReclamation) return;
    
    setActionLoading(true);
    const promise = new Promise(async (resolve, reject) => {
      try {
        const res = await fetch(`/api/reclamations/${selectedReclamation.id}/affecter`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ affecteAId: agentId }),
        });
        
        if (res.ok) {
          setShowAffectationModal(false);
          setSelectedReclamation(null);
          loadReclamations();
          resolve(true);
        } else {
          const data = await res.json();
          reject(new Error(data.error || 'Erreur lors de l\'affectation'));
        }
      } catch (error) {
        reject(new Error('Erreur de connexion'));
      } finally {
        setActionLoading(false);
      }
    });

    toast.promise(promise, {
      loading: t('messages.assigning') || 'Affectation en cours...',
      success: t('messages.assigned_success'),
      error: (err) => err.message,
    });
  };

  // Changer le statut d'une réclamation (Accepter ou Rejeter)
  const handleStatut = async (statut: 'ACCEPTEE' | 'REJETEE') => {
    if (!selectedReclamation) return;
    
    setActionLoading(true);
    const promise = new Promise(async (resolve, reject) => {
      try {
        const res = await fetch(`/api/reclamations/${selectedReclamation.id}/statut`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            statut,
            motifRejet: statut === 'REJETEE' ? rejetMotif : undefined,
          }),
        });
        
        if (res.ok) {
          setShowStatutModal(false);
          setSelectedReclamation(null);
          setRejetMotif('');
          loadReclamations();
          resolve(true);
        } else {
          const data = await res.json();
          reject(new Error(data.error || 'Erreur lors de la modification du statut'));
        }
      } catch (error) {
        reject(new Error('Erreur de connexion'));
      } finally {
        setActionLoading(false);
      }
    });

    toast.promise(promise, {
      loading: t('messages.updating_status') || 'Mise à jour du statut...',
      success: t('messages.status_success'),
      error: (err) => err.message,
    });
  };

  // Supprimer une réclamation
  const handleDelete = async () => {
    if (!selectedReclamation) return;
    
    setActionLoading(true);
    const promise = new Promise(async (resolve, reject) => {
      try {
        const res = await fetch(`/api/reclamations/${selectedReclamation.id}`, {
          method: 'DELETE',
        });
        
        if (res.ok) {
          setShowDeleteModal(false);
          setSelectedReclamation(null);
          loadReclamations();
          resolve(true);
        } else {
          const data = await res.json();
          reject(new Error(data.error || 'Erreur lors de la suppression'));
        }
      } catch (error) {
        reject(new Error('Erreur de connexion'));
      } finally {
        setActionLoading(false);
      }
    });

    toast.promise(promise, {
      loading: t('messages.deleting') || 'Suppression en cours...',
      success: t('messages.deleted_success'),
      error: (err) => err.message,
    });
  };

  // Reset filtres
  const resetFilters = () => {
    setFilters({
      search: '',
      statut: '',
      affectation: '',
      communeId: '',
      categorie: '',
      dateDebut: '',
      dateFin: '',
    });
    setPage(1);
  };

  const CATEGORIES = useMemo(() => [
    'Infrastructure',
    'Services',
    'Propreté',
    'Sécurité',
    'Personnel',
    'Accessibilité',
    'Autre',
  ], []);

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-[hsl(var(--gov-blue))] animate-spin" />
          <p className="text-sm font-bold text-muted-foreground animate-pulse uppercase tracking-widest">{tCommon('loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <PermissionGuard permission="reclamations.read">
      <div className="min-h-screen bg-background py-8 px-4 sm:px-6 relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[hsl(var(--gov-blue)/0.03)] rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-[hsl(var(--gov-gold)/0.03)] rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl pointer-events-none" />

        <div className="max-w-[1600px] mx-auto relative z-10">
          {/* Header Section */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 bg-gradient-to-br from-[hsl(var(--gov-blue))] to-[hsl(var(--gov-blue-dark))] rounded-2xl flex items-center justify-center text-white shadow-xl shadow-[hsl(var(--gov-blue)/0.25)] ring-4 ring-white dark:ring-gray-900 group">
                <Flag className="w-8 h-8 group-hover:scale-110 transition-transform duration-500" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
                    {t('page_title')}
                  </h1>
                  <span className="px-3 py-1 bg-[hsl(var(--gov-blue)/0.1)] text-[hsl(var(--gov-blue))] text-[10px] font-black rounded-full uppercase tracking-widest border border-[hsl(var(--gov-blue)/0.2)]">
                    Admin
                  </span>
                </div>
                <div className="flex items-center gap-4 text-muted-foreground text-sm font-medium">
                  <p>{t('total_reclamations', { count: total })}</p>
                  <div className="w-1 h-1 bg-border rounded-full" />
                  <p className="flex items-center gap-1.5">
                    <Shield size={14} className="text-[hsl(var(--gov-blue))]" />
                    {tCommon('governance_secure')}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={loadReclamations}
                disabled={refreshing}
                className="p-3 bg-card border border-border rounded-xl hover:bg-muted disabled:opacity-50 transition-all shadow-sm hover:shadow-md active:scale-95"
                title={tCommon('refresh')}
              >
                <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} />
              </button>
              
              <div className="h-10 w-px bg-border mx-1 hidden sm:block" />
              
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2.5 px-6 py-3 rounded-xl border font-bold transition-all shadow-sm ${
                  showFilters 
                    ? 'bg-[hsl(var(--gov-blue))] border-[hsl(var(--gov-blue))] text-white shadow-lg shadow-[hsl(var(--gov-blue)/0.2)] ring-2 ring-[hsl(var(--gov-blue)/0.1)]' 
                    : 'bg-card border-border text-foreground hover:bg-muted hover:border-muted-foreground/30'
                }`}
              >
                <Filter size={18} className={showFilters ? 'scale-110' : ''} />
                {tActions('filter')}
                {Object.values(filters).filter(v => v !== '').length > 0 && (
                  <span className="ml-1 w-5 h-5 bg-white text-[hsl(var(--gov-blue))] rounded-full flex items-center justify-center text-[10px] font-black shadow-sm">
                    {Object.values(filters).filter(v => v !== '').length}
                  </span>
                )}
              </button>

              <button
                onClick={() => {/* Export logic */}}
                className="flex items-center gap-2.5 px-6 py-3 bg-card border border-border text-foreground rounded-xl font-bold hover:bg-muted transition-all shadow-sm active:scale-95"
              >
                <Download size={18} />
                {tCommon('export')}
              </button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 mb-10">
            {[
              { label: t('stats.total'), value: stats.total, icon: Flag, gradient: 'from-blue-500 to-blue-700', shadow: 'shadow-blue-500/20' },
              { label: t('stats.pending'), value: stats.enAttente, icon: Clock, gradient: 'from-amber-400 to-amber-600', shadow: 'shadow-amber-500/20', highlight: stats.enAttente > 0 },
              { label: t('stats.to_dispatch'), value: stats.aDispatcher, icon: ArrowUpDown, gradient: 'from-purple-500 to-purple-700', shadow: 'shadow-purple-500/20' },
              { label: t('stats.in_progress'), value: stats.enCours, icon: RefreshCw, gradient: 'from-emerald-500 to-emerald-700', shadow: 'shadow-emerald-500/20' },
              { label: t('stats.rejected'), value: stats.rejetees, icon: XCircle, gradient: 'from-rose-500 to-rose-700', shadow: 'shadow-rose-500/20' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="gov-stat-card group relative overflow-hidden"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center text-white shadow-lg ${stat.shadow} group-hover:scale-110 transition-transform duration-500`}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                  {stat.highlight && (
                    <div className="flex items-center gap-1 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                      <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest">Urgent</span>
                    </div>
                  )}
                </div>
                <div className="relative z-10">
                  <p className="text-3xl font-black text-foreground mb-1 tabular-nums tracking-tight">
                    {stat.value}
                  </p>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest group-hover:text-foreground transition-colors">
                    {stat.label}
                  </p>
                </div>
                {/* Decorative pulse element */}
                <div className={`absolute -right-4 -bottom-4 w-24 h-24 bg-gradient-to-br ${stat.gradient} opacity-[0.03] rounded-full group-hover:scale-150 transition-transform duration-1000`} />
              </motion.div>
            ))}
          </div>

          {/* Advanced Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: -20 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0, y: -20 }}
                className="mb-8 overflow-hidden"
              >
                <div className="gov-card p-6 bg-card/80 backdrop-blur-xl border-dashed">
                  <div className="flex items-center gap-2 mb-6">
                    <Filter className="text-[hsl(var(--gov-blue))]" size={18} />
                    <h2 className="text-sm font-black uppercase tracking-widest text-foreground">{tCommon('advanced_filters')}</h2>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Recherche */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{tCommon('search')}</label>
                      <div className="relative group">
                        <Search className="absolute ltr:left-3 rtl:right-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-[hsl(var(--gov-blue))] transition-colors" size={18} />
                        <input
                          type="text"
                          placeholder={t('search_placeholder')}
                          value={filters.search}
                          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                          className="gov-input ltr:pl-10 rtl:pr-10 h-11"
                        />
                      </div>
                    </div>

                    {/* Statut */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{t('status_filter')}</label>
                      <select
                        value={filters.statut}
                        onChange={(e) => setFilters({ ...filters, statut: e.target.value })}
                        className="gov-input h-11"
                      >
                        <option value="">{tCommon('all_statuses')}</option>
                        <option value="EN_ATTENTE">{t('status_labels.pending')}</option>
                        <option value="ACCEPTEE">{t('status_labels.accepted')}</option>
                        <option value="REJETEE">{t('status_labels.rejected')}</option>
                      </select>
                    </div>

                    {/* Affectation */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{t('affectation')}</label>
                      <select
                        value={filters.affectation}
                        onChange={(e) => setFilters({ ...filters, affectation: e.target.value })}
                        className="gov-input h-11"
                      >
                        <option value="">{tCommon('all')}</option>
                        <option value="NON_AFFECTEE">{t('not_assigned')}</option>
                        <option value="AFFECTEE">{t('status_labels.assigned')}</option>
                      </select>
                    </div>

                    {/* Commune */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{t('communeId')}</label>
                      <select
                        value={filters.communeId}
                        onChange={(e) => setFilters({ ...filters, communeId: e.target.value })}
                        className="gov-input h-11"
                      >
                        <option value="">{t('filters_labels.all_communes')}</option>
                        {communes.map(c => (
                          <option key={c.id} value={c.id}>
                            {locale === 'ar' ? (c.nomArabe || c.nom) : c.nom}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Catégorie */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{t('categorie')}</label>
                      <select
                        value={filters.categorie}
                        onChange={(e) => setFilters({ ...filters, categorie: e.target.value })}
                        className="gov-input h-11"
                      >
                        <option value="">{t('category_filter')}</option>
                        {CATEGORIES.map(c => (
                          <option key={c} value={c}>{tCategories(c)}</option>
                        ))}
                      </select>
                    </div>

                    {/* Date début */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{tCommon('date_range')}</label>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="date"
                          value={filters.dateDebut}
                          onChange={(e) => setFilters({ ...filters, dateDebut: e.target.value })}
                          className="gov-input h-11 px-2 text-xs"
                        />
                        <input
                          type="date"
                          value={filters.dateFin}
                          onChange={(e) => setFilters({ ...filters, dateFin: e.target.value })}
                          className="gov-input h-11 px-2 text-xs"
                        />
                      </div>
                    </div>

                    {/* Reset */}
                    <div className="lg:col-span-2 flex items-end">
                      <button
                        onClick={resetFilters}
                        className="flex items-center gap-2 px-6 py-3 text-rose-600 hover:bg-rose-500/10 rounded-xl transition-all font-bold text-sm border border-transparent hover:border-rose-500/20 active:scale-95"
                      >
                        <Trash2 size={16} />
                        {tCommon('reset_filters')}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Table Section */}
          <div className="gov-card overflow-hidden shadow-xl border-border bg-card/50 backdrop-blur-sm">
            <div className="gov-table-wrapper">
              <table className="gov-table">
                <thead>
                  <tr className="bg-muted/30 border-b border-border">
                    <th className="px-6 py-4 text-left text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                      {t('table.ref')}
                    </th>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                      {t('table.citoyen')}
                    </th>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                      {t('table.sujet')}
                    </th>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                      {t('table.statut')}
                    </th>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                      {t('table.affectation')}
                    </th>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                      {t('table.date')}
                    </th>
                    <th className="px-6 py-4 text-right text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                      {tCommon('actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {reclamations.length > 0 ? (
                    reclamations.map((r, i) => {
                      const status = STATUT_CONFIG[r.statut ?? "EN_ATTENTE"] || STATUT_CONFIG.EN_ATTENTE;
                      return (
                        <motion.tr
                          key={r.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.03 }}
                          className="hover:bg-muted/50 transition-colors group cursor-pointer"
                          onClick={() => {
                            setSelectedReclamation(r);
                            setShowDetail(true);
                          }}
                        >
                          <td className="px-6 py-4">
                            <span className="font-mono text-xs font-black text-[hsl(var(--gov-blue))] bg-[hsl(var(--gov-blue)/0.05)] px-2 py-1 rounded border border-[hsl(var(--gov-blue)/0.1)]">
                              #{(r as any).reference || r.id.toString().padStart(4, '0')}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center text-[hsl(var(--gov-blue))] font-black shadow-sm group-hover:scale-110 transition-transform">
                                {r.user?.nom?.[0] || 'U'}
                              </div>
                              <div>
                                <p className="text-sm font-bold text-foreground line-clamp-1">{r.user?.nom || 'Anonyme'}</p>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{r.user?.telephone || 'No phone'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <p className="text-sm font-bold text-foreground line-clamp-1 group-hover:text-[hsl(var(--gov-blue))] transition-colors">{r.titre}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] font-bold bg-muted px-1.5 py-0.5 rounded text-muted-foreground uppercase tracking-widest">
                                  {tCategories(r.categorie)}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full ${status.bg} ${status.color} border border-current/10 shadow-sm`}>
                              <status.icon size={12} className="stroke-[3]" />
                              <span className="text-[10px] font-black uppercase tracking-widest">
                                {t(status.labelKey)}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {(r as any).agentAffecte ? (
                              <div className="flex items-center gap-2 text-blue-700 bg-blue-50 px-2.5 py-1.5 rounded-lg border border-blue-100 w-fit">
                                <User size={12} className="shrink-0" />
                                <span className="text-[10px] font-black uppercase tracking-widest line-clamp-1">
                                  {(r as any).agentAffecte.nom}
                                </span>
                              </div>
                            ) : (
                              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5 opacity-60">
                                <Minus size={12} />
                                {t('not_assigned')}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                              <p className="text-foreground">{new Date(r.createdAt).toLocaleDateString(locale)}</p>
                              <p className="opacity-60">{new Date(r.createdAt).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedReclamation(r);
                                  setShowAffectationModal(true);
                                }}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-200"
                                title={t('actions.assign')}
                              >
                                <UserPlus size={18} />
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedReclamation(r);
                                  setShowStatutModal(true);
                                }}
                                className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors border border-transparent hover:border-emerald-200"
                                title={t('actions.update_status')}
                              >
                                <Edit size={18} />
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedReclamation(r);
                                  setShowDeleteModal(true);
                                }}
                                className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-200"
                                title={tActions('delete')}
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-20 text-center">
                        <div className="flex flex-col items-center gap-4 opacity-40">
                          <Flag size={48} className="text-muted-foreground" />
                          <p className="text-sm font-black uppercase tracking-widest">{t('no_reclamations')}</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Institutional Pagination */}
            <div className="px-6 py-5 bg-muted/20 border-t border-border flex items-center justify-between">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Page <span className="text-foreground">{page}</span> sur <span className="text-foreground">{totalPages}</span>
                <span className="mx-2">•</span>
                <span className="text-foreground">{total}</span> résultats
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 bg-card border border-border rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-muted disabled:opacity-50 transition-all active:scale-95 shadow-sm"
                >
                  {tCommon('previous')}
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 bg-card border border-border rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-muted disabled:opacity-50 transition-all active:scale-95 shadow-sm"
                >
                  {tCommon('next')}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* --- DETAIL DRAWER --- */}
        <AnimatePresence>
          {showDetail && selectedReclamation && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowDetail(false)}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
              />
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed top-0 ltr:right-0 rtl:left-0 bottom-0 w-full max-w-2xl bg-background shadow-2xl z-[101] flex flex-col border-l border-border"
              >
                {/* Drawer Header */}
                <div className="p-6 border-b border-border bg-card/30 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-[hsl(var(--gov-blue)/0.1)] text-[hsl(var(--gov-blue))] rounded-xl flex items-center justify-center">
                      <Flag size={24} />
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-foreground">
                        {t('table.ref')} #{(selectedReclamation as any).reference || selectedReclamation.id}
                      </h2>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                        {tCategories(selectedReclamation.categorie)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowDetail(false)}
                    className="p-2 hover:bg-muted rounded-full transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>

                {/* Drawer Content */}
                <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                  {/* Status & Quick Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-muted/30 rounded-2xl border border-border/50">
                    <div>
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">{t('table.statut')}</p>
                      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-black text-xs uppercase tracking-widest border shadow-sm ${STATUT_CONFIG[selectedReclamation.statut ?? "EN_ATTENTE"]?.bg} ${STATUT_CONFIG[selectedReclamation.statut ?? "EN_ATTENTE"]?.color} border-current/10`}>
                        {(() => {
                          const Icon = STATUT_CONFIG[selectedReclamation.statut ?? "EN_ATTENTE"]?.icon || Clock;
                          return <Icon size={14} className="stroke-[3]" />;
                        })()}
                        {t(STATUT_CONFIG[selectedReclamation.statut ?? "EN_ATTENTE"]?.labelKey || 'status_labels.pending')}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setShowAffectationModal(true)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-xs hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 active:scale-95"
                      >
                        <UserPlus size={14} />
                        {t('actions.assign')}
                      </button>
                      <button 
                        onClick={() => setShowStatutModal(true)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-xs hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
                      >
                        <Edit size={14} />
                        {t('actions.update_status')}
                      </button>
                    </div>
                  </div>

                  {/* Main Info */}
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
                        <FileText size={12} className="text-[hsl(var(--gov-blue))]" />
                        {t('table.sujet')}
                      </h3>
                      <p className="text-xl font-black text-foreground leading-tight">{selectedReclamation.titre}</p>
                    </div>

                    <div className="gov-card p-6 bg-card/50 border-dashed">
                      <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
                        {selectedReclamation.description}
                      </p>
                    </div>

                    {selectedReclamation.photoUrl && (
                      <div>
                        <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-3">{t('table.photo')}</h3>
                        <div className="rounded-2xl overflow-hidden border border-border shadow-md group">
                          <img 
                            src={selectedReclamation.photoUrl} 
                            alt="Reclamation" 
                            className="w-full h-auto object-cover max-h-[400px] group-hover:scale-105 transition-transform duration-700"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Citoyen Info */}
                  <div className="pt-6 border-t border-border">
                    <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
                      <User size={12} className="text-[hsl(var(--gov-blue))]" />
                      {t('table.citoyen')}
                    </h3>
                    <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-2xl border border-border/50">
                      <div className="w-14 h-14 bg-gradient-to-br from-[hsl(var(--gov-blue))] to-[hsl(var(--gov-blue-dark))] rounded-2xl flex items-center justify-center text-white text-xl font-black shadow-lg">
                        {selectedReclamation.user?.nom?.[0] || 'U'}
                      </div>
                      <div>
                        <p className="text-lg font-black text-foreground">{selectedReclamation.user?.nom || 'Anonyme'}</p>
                        <div className="flex flex-wrap items-center gap-4 mt-1">
                          <p className="text-sm font-bold text-muted-foreground flex items-center gap-1.5">
                            <Phone size={14} className="text-[hsl(var(--gov-blue))]" />
                            {selectedReclamation.user?.telephone || 'No phone'}
                          </p>
                          <p className="text-sm font-bold text-muted-foreground flex items-center gap-1.5">
                            <MapPin size={14} className="text-[hsl(var(--gov-blue))]" />
                            {selectedReclamation.commune?.nom}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Affectation Info */}
                  {selectedReclamation.agentAffecte && (
                    <div className="pt-6 border-t border-border">
                      <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Shield size={12} className="text-emerald-600" />
                        Agent en charge
                      </h3>
                      <div className="flex items-center gap-4 p-4 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl border border-emerald-100 dark:border-emerald-500/20">
                        <div className="w-14 h-14 bg-emerald-600 rounded-2xl flex items-center justify-center text-white text-xl font-black">
                          {selectedReclamation.agentAffecte.nom?.[0]}
                        </div>
                        <div>
                          <p className="text-lg font-black text-emerald-900 dark:text-emerald-400">{selectedReclamation.agentAffecte.nom}</p>
                          <p className="text-sm font-bold text-emerald-700/70">{selectedReclamation.agentAffecte.email}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* --- MODALS --- */}
        {/* Affectation Modal */}
        {showAffectationModal && selectedReclamation && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[200] p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="gov-card w-full max-w-lg overflow-hidden border-border bg-background"
            >
              <div className="p-6 border-b border-border flex items-center justify-between bg-muted/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center">
                    <UserPlus size={20} />
                  </div>
                  <h3 className="text-lg font-black text-foreground uppercase tracking-tight">{t('actions.assign')}</h3>
                </div>
                <button onClick={() => setShowAffectationModal(false)} className="p-2 hover:bg-muted rounded-lg transition-colors"><X size={20} /></button>
              </div>
              <div className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Sélectionner un agent ou autorité</label>
                  <select 
                    id="agent-select"
                    className="gov-input h-12"
                    defaultValue={selectedReclamation.agentId || ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val) handleAffectation(parseInt(val));
                    }}
                  >
                    <option value="">Choisir un agent...</option>
                    {agents.map(a => (
                      <option key={a.id} value={a.id}>{a.nom} ({a.role})</option>
                    ))}
                  </select>
                </div>
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
                  <p className="text-xs font-bold text-blue-700 leading-relaxed">
                    <Info size={14} className="inline mr-2 -mt-0.5" />
                    L'agent recevra une notification immédiate et pourra commencer le traitement de la réclamation.
                  </p>
                </div>
              </div>
              <div className="p-6 bg-muted/20 border-t border-border flex justify-end gap-3">
                <button onClick={() => setShowAffectationModal(false)} className="px-6 py-2.5 font-bold text-sm text-muted-foreground hover:text-foreground transition-colors">{tCommon('cancel')}</button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Statut Modal */}
        {showStatutModal && selectedReclamation && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[200] p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="gov-card w-full max-w-lg overflow-hidden border-border bg-background"
            >
              <div className="p-6 border-b border-border flex items-center justify-between bg-muted/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-600 text-white rounded-xl flex items-center justify-center">
                    <Edit size={20} />
                  </div>
                  <h3 className="text-lg font-black text-foreground uppercase tracking-tight">{t('actions.update_status')}</h3>
                </div>
                <button onClick={() => setShowStatutModal(false)} className="p-2 hover:bg-muted rounded-lg transition-colors"><X size={20} /></button>
              </div>
              <div className="p-8 space-y-6">
                <div className="grid grid-cols-1 gap-3">
                  {['EN_ATTENTE', 'ACCEPTEE', 'REJETEE', 'TO_DISPATCH'].map(statut => (
                    <button
                      key={statut}
                      onClick={() => handleStatut(statut as any)}
                      className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all group ${
                        selectedReclamation.statut === statut 
                          ? 'border-[hsl(var(--gov-blue))] bg-[hsl(var(--gov-blue)/0.05)]' 
                          : 'border-border hover:border-border-muted hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${STATUT_CONFIG[statut]?.bg} ${STATUT_CONFIG[statut]?.color}`}>
                          {(() => {
                            const Icon = STATUT_CONFIG[statut]?.icon || Clock;
                            return <Icon size={16} />;
                          })()}
                        </div>
                        <span className={`font-black text-xs uppercase tracking-widest ${selectedReclamation.statut === statut ? 'text-[hsl(var(--gov-blue))]' : 'text-foreground'}`}>
                          {t(STATUT_CONFIG[statut]?.labelKey)}
                        </span>
                      </div>
                      {selectedReclamation.statut === statut && <CheckCircle size={20} className="text-[hsl(var(--gov-blue))]" />}
                    </button>
                  ))}
                </div>
              </div>
              <div className="p-6 bg-muted/20 border-t border-border flex justify-end gap-3">
                <button onClick={() => setShowStatutModal(false)} className="px-6 py-2.5 font-bold text-sm text-muted-foreground hover:text-foreground transition-colors">{tCommon('cancel')}</button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Delete Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[200] p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="gov-card w-full max-w-md overflow-hidden border-rose-500/20 bg-background"
            >
              <div className="p-8 text-center space-y-6">
                <div className="w-20 h-20 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto ring-8 ring-rose-50 group">
                  <Trash2 size={40} className="group-hover:scale-110 transition-transform" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-foreground mb-2 uppercase tracking-tight">{tCommon('confirm_delete')}</h3>
                  <p className="text-sm font-medium text-muted-foreground">
                    {t('delete_confirmation')}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <button 
                    onClick={() => setShowDeleteModal(false)}
                    className="flex-1 px-6 py-3 font-bold text-sm bg-muted text-foreground rounded-xl hover:bg-muted/80 transition-all active:scale-95"
                  >
                    {tCommon('cancel')}
                  </button>
                  <button 
                    onClick={handleDelete}
                    className="flex-1 px-6 py-3 font-bold text-sm bg-rose-600 text-white rounded-xl hover:bg-rose-700 transition-all shadow-lg shadow-rose-500/20 active:scale-95"
                  >
                    {tCommon('delete')}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </PermissionGuard>
  );
}
