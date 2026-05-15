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
  CalendarDays
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { PermissionGuard } from '@/hooks/use-permission';
import { useTranslations, useLocale } from 'next-intl';
import EmptyState from '@/components/ui/EmptyState';
import { GovButton } from '@/components/ui/GovButton';
import { KpiCard, KpiGrid } from '@/components/ui/KpiCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { GovTable, GovTh, GovTd, GovTr } from '@/components/ui/GovTable';
import { GovInput, GovSelect } from '@/components/ui';
import { cn } from '@/lib/utils';

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
                    {tCommon('nav.user_menu.admin')}
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
              <GovButton
                onClick={loadReclamations}
                disabled={refreshing}
                variant="outline"
                size="icon"
                loading={refreshing}
                title={tCommon('refresh')}
              />
              
              <div className="h-10 w-px bg-border mx-1 hidden sm:block" />
              
              <GovButton
                onClick={() => setShowFilters(!showFilters)}
                variant={showFilters ? 'primary' : 'outline'}
                leftIcon={<Filter size={18} className={showFilters ? 'scale-110' : ''} />}
                className={showFilters ? 'shadow-lg shadow-[hsl(var(--gov-blue)/0.2)]' : ''}
              >
                {tActions('filter')}
                {Object.values(filters).filter(v => v !== '').length > 0 && (
                  <span className="ml-1 w-5 h-5 bg-white text-[hsl(var(--gov-blue))] rounded-full flex items-center justify-center text-[10px] font-black shadow-sm">
                    {Object.values(filters).filter(v => v !== '').length}
                  </span>
                )}
              </GovButton>

              <GovButton
                onClick={() => {/* Export logic */}}
                variant="outline"
                leftIcon={<Download size={18} />}
              >
                {tCommon('export')}
              </GovButton>
            </div>
          </div>

          {/* Stats Grid */}
          <KpiGrid cols={5} className="mb-10">
            <KpiCard
              label={t('stats.total')}
              value={stats.total}
              icon={Flag}
              variant="blue"
              index={0}
            />
            <KpiCard
              label={t('stats.pending')}
              value={stats.enAttente}
              icon={Clock}
              variant="gold"
              index={1}
            />
            <KpiCard
              label={t('stats.to_dispatch')}
              value={stats.aDispatcher}
              icon={ArrowUpDown}
              variant="muted"
              index={2}
            />
            <KpiCard
              label={t('stats.in_progress')}
              value={stats.enCours}
              icon={RefreshCw}
              variant="green"
              index={3}
            />
            <KpiCard
              label={t('stats.rejected')}
              value={stats.rejetees}
              icon={XCircle}
              variant="red"
              index={4}
            />
          </KpiGrid>

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
                    <GovInput
                      label={tCommon('search')}
                      placeholder={t('search_placeholder')}
                      value={filters.search}
                      onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                      leftIcon={<Search size={18} />}
                    />

                    {/* Statut */}
                    <GovSelect
                      label={t('status_filter')}
                      value={filters.statut}
                      onChange={(e) => setFilters({ ...filters, statut: e.target.value })}
                      options={[
                        { label: tCommon('all_statuses'), value: '' },
                        { label: t('status_labels.pending'), value: 'EN_ATTENTE' },
                        { label: t('status_labels.accepted'), value: 'ACCEPTEE' },
                        { label: t('status_labels.rejected'), value: 'REJETEE' }
                      ]}
                      leftIcon={<Clock size={18} />}
                    />

                    {/* Affectation */}
                    <GovSelect
                      label={t('affectation')}
                      value={filters.affectation}
                      onChange={(e) => setFilters({ ...filters, affectation: e.target.value })}
                      options={[
                        { label: tCommon('all'), value: '' },
                        { label: t('not_assigned'), value: 'NON_AFFECTEE' },
                        { label: t('status_labels.assigned'), value: 'AFFECTEE' }
                      ]}
                      leftIcon={<User size={18} />}
                    />

                    {/* Commune */}
                    <GovSelect
                      label={t('communeId')}
                      value={filters.communeId}
                      onChange={(e) => setFilters({ ...filters, communeId: e.target.value })}
                      options={[
                        { label: t('filters_labels.all_communes'), value: '' },
                        ...communes.map(c => ({ 
                          label: locale === 'ar' ? (c.nomArabe || c.nom) : c.nom, 
                          value: c.id 
                        }))
                      ]}
                      leftIcon={<MapPin size={18} />}
                    />

                    {/* Catégorie */}
                    <GovSelect
                      label={t('categorie')}
                      value={filters.categorie}
                      onChange={(e) => setFilters({ ...filters, categorie: e.target.value })}
                      options={[
                        { label: t('category_filter'), value: '' },
                        ...CATEGORIES.map(c => ({ label: tCategories(c), value: c }))
                      ]}
                      leftIcon={<Flag size={18} />}
                    />

                    {/* Date début & fin */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">{tCommon('date_range')}</label>
                      <div className="grid grid-cols-2 gap-2">
                        <GovInput
                          type="date"
                          value={filters.dateDebut}
                          onChange={(e) => setFilters({ ...filters, dateDebut: e.target.value })}
                          className="h-11 px-2 text-xs"
                        />
                        <GovInput
                          type="date"
                          value={filters.dateFin}
                          onChange={(e) => setFilters({ ...filters, dateFin: e.target.value })}
                          className="h-11 px-2 text-xs"
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
          <GovTable>
            <thead>
              <tr>
                <GovTh>{t('table.ref')}</GovTh>
                <GovTh>{t('table.citoyen')}</GovTh>
                <GovTh>{t('table.sujet')}</GovTh>
                <GovTh>{t('table.statut')}</GovTh>
                <GovTh>{t('table.affectation')}</GovTh>
                <GovTh>{t('table.date')}</GovTh>
                <GovTh className="text-right">{tCommon('actions')}</GovTh>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {reclamations.length > 0 ? (
                reclamations.map((r, i) => {
                  const statusKey = r.statut ?? "EN_ATTENTE";

                  return (
                    <GovTr
                      key={r.id}
                      onClick={() => {
                        setSelectedReclamation(r);
                        setShowDetail(true);
                      }}
                    >
                      <GovTd>
                        <span className="font-mono text-xs font-black text-[hsl(var(--gov-blue))] bg-[hsl(var(--gov-blue)/0.05)] px-2 py-1 rounded border border-[hsl(var(--gov-blue)/0.1)]">
                          #{(r as any).reference || r.id.toString().padStart(4, '0')}
                        </span>
                      </GovTd>
                      <GovTd>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center text-[hsl(var(--gov-blue))] font-black shadow-sm group-hover:scale-110 transition-transform">
                            {r.user?.nom?.[0] || 'U'}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-foreground line-clamp-1">{r.user?.nom || tCommon('reclamations.anonyme')}</p>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{r.user?.telephone || tCommon('reclamations.no_phone')}</p>
                          </div>
                        </div>
                      </GovTd>
                      <GovTd>
                        <div>
                          <p className="text-sm font-bold text-foreground line-clamp-1 group-hover:text-[hsl(var(--gov-blue))] transition-colors">{r.titre}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-bold bg-muted px-1.5 py-0.5 rounded text-muted-foreground uppercase tracking-widest">
                              {tCategories(r.categorie)}
                            </span>
                          </div>
                        </div>
                      </GovTd>
                      <GovTd>
                        <StatusBadge 
                          status={statusKey}
                          animate={statusKey === 'EN_ATTENTE'}
                        />
                      </GovTd>
                      <GovTd>
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
                      </GovTd>
                      <GovTd>
                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                          <p className="text-foreground">{new Date(r.createdAt).toLocaleDateString(locale)}</p>
                          <p className="opacity-60">{new Date(r.createdAt).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                      </GovTd>
                      <GovTd className="text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-95 group-hover:scale-100">
                          <GovButton 
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedReclamation(r);
                              setShowAffectationModal(true);
                            }}
                            variant="ghost"
                            size="icon"
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            title={t('actions.assign')}
                          >
                            <UserPlus size={18} />
                          </GovButton>
                          <GovButton 
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedReclamation(r);
                              setShowStatutModal(true);
                            }}
                            variant="ghost"
                            size="icon"
                            className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                            title={t('actions.update_status')}
                          >
                            <Edit size={18} />
                          </GovButton>
                          <GovButton 
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedReclamation(r);
                              setShowDeleteModal(true);
                            }}
                            variant="ghost"
                            size="icon"
                            className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                            title={tActions('delete')}
                          >
                            <Trash2 size={18} />
                          </GovButton>
                        </div>
                      </GovTd>
                    </GovTr>
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
          </GovTable>

            {/* Institutional Pagination */}
            <div className="px-6 py-5 bg-muted/20 border-t border-border flex items-center justify-between">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                {tCommon('pagination.page_info', { page, total: totalPages })}
                <span className="mx-2">•</span>
                <span className="text-foreground">{total}</span> {tCommon('pagination.results')}
              </p>
              <div className="flex gap-2">
                <GovButton
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  variant="outline"
                  size="sm"
                >
                  {tCommon('previous')}
                </GovButton>
                <GovButton
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  variant="outline"
                  size="sm"
                >
                  {tCommon('next')}
                </GovButton>
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
                      <StatusBadge 
                        status={selectedReclamation.statut ?? "EN_ATTENTE"}
                        animate={selectedReclamation.statut === 'EN_ATTENTE'}
                        size="md"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <GovButton 
                        onClick={() => setShowAffectationModal(true)}
                        variant="primary"
                        leftIcon={<UserPlus size={14} />}
                        className="shadow-lg shadow-blue-500/20"
                      >
                        {t('actions.assign')}
                      </GovButton>
                      <GovButton 
                        onClick={() => setShowStatutModal(true)}
                        variant="primary"
                        className="bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/20 border-none"
                        leftIcon={<Edit size={14} />}
                      >
                        {t('actions.update_status')}
                      </GovButton>
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
                        <p className="text-lg font-black text-foreground">{selectedReclamation.user?.nom || tCommon('reclamations.anonyme')}</p>
                        <div className="flex flex-wrap items-center gap-4 mt-1">
                          <p className="text-sm font-bold text-muted-foreground flex items-center gap-1.5">
                            <Phone size={14} className="text-[hsl(var(--gov-blue))]" />
                            {selectedReclamation.user?.telephone || tCommon('reclamations.no_phone')}
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
                        {t('table.agent_in_charge')}
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

        {/* Affectation Modal */}
        {showAffectationModal && selectedReclamation && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-[200] p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="bg-card/95 backdrop-blur-xl rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col border border-border"
            >
              <div className="p-8 border-b border-border flex items-center justify-between bg-gradient-to-br from-card/50 to-muted/30">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center text-white shadow-lg">
                    <UserPlus size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-foreground uppercase tracking-tight">{t('modals.assignment.title')}</h3>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">{t('modals.assignment.subtitle') || t('modals.assignment.title')}</p>
                  </div>
                </div>
                <GovButton onClick={() => setShowAffectationModal(false)} variant="ghost" size="icon" className="rounded-full">
                  <X size={20} />
                </GovButton>
              </div>
              
              <div className="p-8 space-y-6">
                <GovSelect 
                  label={t('modals.assignment.select_label')}
                  defaultValue={selectedReclamation.agentId || ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val) handleAffectation(parseInt(val));
                  }}
                  options={[
                    { label: t('modals.assignment.select_label'), value: "" },
                    ...agents.map(a => ({ label: `${a.nom} (${a.role})`, value: a.id }))
                  ]}
                  leftIcon={<User size={18} />}
                />
                
                <div className="p-5 bg-blue-500/5 border border-blue-500/10 rounded-2xl flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 shrink-0">
                    <Info size={20} />
                  </div>
                  <p className="text-xs font-bold text-blue-700/80 leading-relaxed uppercase tracking-wide">
                    {t('modals.assignment.notification_hint')}
                  </p>
                </div>
              </div>
              
              <div className="p-6 bg-muted/20 border-t border-border flex justify-end">
                <GovButton onClick={() => setShowAffectationModal(false)} variant="ghost" className="px-8">
                  {tCommon('cancel')}
                </GovButton>
              </div>
            </motion.div>
          </div>
        )}

        {/* Statut Modal */}
        {showStatutModal && selectedReclamation && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-[200] p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="bg-card/95 backdrop-blur-xl rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col border border-border"
            >
              <div className="p-8 border-b border-border flex items-center justify-between bg-gradient-to-br from-card/50 to-muted/30">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-2xl flex items-center justify-center text-white shadow-lg">
                    <Edit size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-foreground uppercase tracking-tight">{t('modals.status.title')}</h3>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">{t('modals.status.subtitle')}</p>
                  </div>
                </div>
                <GovButton onClick={() => setShowStatutModal(false)} variant="ghost" size="icon" className="rounded-full">
                  <X size={20} />
                </GovButton>
              </div>
              
              <div className="p-8 space-y-6">
                <div className="grid grid-cols-1 gap-3">
                  {['EN_ATTENTE', 'ACCEPTEE', 'REJETEE', 'TO_DISPATCH'].map(statut => (
                    <button
                      key={statut}
                      onClick={() => handleStatut(statut as any)}
                      className={cn(
                        "flex items-center justify-between p-5 rounded-2xl border-2 transition-all group shadow-sm",
                        selectedReclamation.statut === statut 
                          ? "border-[hsl(var(--gov-blue))] bg-[hsl(var(--gov-blue)/0.05)] shadow-md shadow-[hsl(var(--gov-blue)/0.1)]" 
                          : "border-border bg-muted/20 hover:border-border/80"
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <StatusBadge status={statut} />
                      </div>
                      {selectedReclamation.statut === statut && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-6 h-6 bg-[hsl(var(--gov-blue))] rounded-full flex items-center justify-center shadow-lg"
                        >
                          <CheckCircle size={16} className="text-white" />
                        </motion.div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="p-6 bg-muted/20 border-t border-border flex justify-end">
                <GovButton onClick={() => setShowStatutModal(false)} variant="ghost" className="px-8">
                  {tCommon('cancel')}
                </GovButton>
              </div>
            </motion.div>
          </div>
        )}

        {/* Delete Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-[200] p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="bg-card/95 backdrop-blur-xl rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden flex flex-col border border-rose-500/20"
            >
              <div className="p-10 text-center space-y-8">
                <div className="w-24 h-24 bg-rose-500/10 text-rose-600 rounded-[2rem] flex items-center justify-center mx-auto ring-8 ring-rose-500/5 group">
                  <Trash2 size={48} className="group-hover:scale-110 transition-transform duration-500" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-foreground mb-3 uppercase tracking-tight">{tCommon('confirm_delete')}</h3>
                  <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest leading-relaxed px-4 opacity-70">
                    {t('delete_confirmation')}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <GovButton 
                    onClick={() => setShowDeleteModal(false)}
                    variant="outline"
                    className="flex-1 h-14"
                  >
                    {tCommon('cancel')}
                  </GovButton>
                  <GovButton 
                    onClick={handleDelete}
                    variant="primary"
                    className="flex-1 h-14 bg-rose-600 hover:bg-rose-700 shadow-xl shadow-rose-500/25 border-none"
                    loading={actionLoading}
                  >
                    {tCommon('delete')}
                  </GovButton>
                </div>
              </div>
            </motion.div>
          </div>
        )}
    </PermissionGuard>
  );
}
