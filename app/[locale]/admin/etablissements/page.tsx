'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  Star,
  Users,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Globe,
  Phone,
  Mail,
  Loader2,
  X,
  Shield,
  Award,
  TrendingUp,
} from 'lucide-react';
import { toast } from 'sonner';
import { Link } from '@/i18n/navigation';
import { useTranslations, useLocale } from 'next-intl';
import EmptyState from '@/components/ui/EmptyState';
import { GovButton } from '@/components/ui/GovButton';
import { KpiCard, KpiGrid } from '@/components/ui/KpiCard';
import { GovTable, GovTh, GovTd, GovTr } from '@/components/ui/GovTable';
import { StatusBadge } from '@/components/ui/StatusBadge';

interface Etablissement {
  id: number;
  nom: string;
  code: string;
  secteur: string;
  adresse: string | null;
  telephone: string | null;
  email: string | null;
  siteWeb: string | null;
  latitude: number | null;
  longitude: number | null;
  isValide: boolean;
  isPublie: boolean;
  isMisEnAvant: boolean;
  noteMoyenne: number;
  nombreEvaluations: number;
  createdAt: string;
  commune: { id: number; nom: string; nomArabe?: string } | null;
  annexe: { id: number; nom: string; nomArabe?: string } | null;
  responsable: { id: number; nom: string; prenom: string } | null;
  photoPrincipale: string | null;
  _count?: {
    reclamations: number;
    evenements: number;
    evaluations: number;
  };
}

const SECTEURS = [
  { value: '', color: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' },
  { value: 'EDUCATION', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  { value: 'SANTE', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  { value: 'SPORT', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  { value: 'SOCIAL', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  { value: 'CULTUREL', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  { value: 'AUTRE', color: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' },
];

export default function AdminEtablissementsPage() {
  const t = useTranslations('admin.establishments_page');
  const tSectors = useTranslations('admin.users_page.sectors');
  const locale = useLocale();

  const [etablissements, setEtablissements] = useState<Etablissement[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  
  // Filters
  const [search, setSearch] = useState('');
  const [secteurFilter, setSecteurFilter] = useState('');
  const [validFilter, setValidFilter] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Modal
  const [selectedEtablissement, setSelectedEtablissement] = useState<Etablissement | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    valides: 0,
    publies: 0,
    enAttente: 0,
    averageRating: 0,
  });

  const fetchEtablissements = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', '12');
      params.set('includeNonPublie', 'true');
      if (search) params.set('search', search);
      if (secteurFilter) params.set('secteur', secteurFilter);

      const res = await fetch(`/api/etablissements?${params}`);
      if (res.ok) {
        const data = await res.json();
        setEtablissements(data.data || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotal(data.pagination?.total || 0);
        
        // Calculate stats
        const all = data.data || [];
        setStats({
          total: data.pagination?.total || 0,
          valides: all.filter((e: Etablissement) => e.isValide).length,
          publies: all.filter((e: Etablissement) => e.isPublie).length,
          enAttente: all.filter((e: Etablissement) => !e.isValide).length,
          averageRating: all.reduce((acc: number, e: Etablissement) => acc + e.noteMoyenne, 0) / (all.length || 1),
        });
      }
    } catch (error) {
      console.error('Erreur chargement établissements:', error);
      toast.error(t('messages.error'));
    } finally {
      setLoading(false);
    }
  }, [page, search, secteurFilter, t]);

  useEffect(() => {
    const debounce = setTimeout(fetchEtablissements, 300);
    return () => clearTimeout(debounce);
  }, [fetchEtablissements]);

  const handleValidate = async (id: number, action: 'valider' | 'publier' | 'misEnAvant') => {
    setActionLoading(`${action}-${id}`);
    try {
      const body: { isValide?: boolean; isPublie?: boolean; isMisEnAvant?: boolean } = {};
      
      if (action === 'valider') {
        const etab = etablissements.find(e => e.id === id);
        body.isValide = !etab?.isValide;
      } else if (action === 'publier') {
        const etab = etablissements.find(e => e.id === id);
        body.isPublie = !etab?.isPublie;
      } else if (action === 'misEnAvant') {
        const etab = etablissements.find(e => e.id === id);
        body.isMisEnAvant = !etab?.isMisEnAvant;
      }

      const res = await fetch(`/api/etablissements/${id}/valider`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        toast.success(t('messages.updated'));
        fetchEtablissements();
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

  const handleDelete = async (id: number) => {
    if (!confirm(t('messages.delete_confirm'))) return;
    
    setActionLoading(`delete-${id}`);
    try {
      const res = await fetch(`/api/etablissements/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success(t('messages.deleted'));
        fetchEtablissements();
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

  const getSecteurConfig = (secteur: string) => {
    return SECTEURS.find(s => s.value === secteur) || { value: secteur, color: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' };
  };

  const getSecteurLabel = (key: string) => {
    if (!key) return t('all_sectors');
    if (key === 'AUTRE') return tSectors('AUTRE'); // Assuming 'AUTRE' key exists or use fallback
    return tSectors(key as any);
  };

  const handlePublishAll = async () => {
    if (!confirm(t('messages.bulk_publish_confirm'))) return;
    
    const toastId = toast.loading(t('messages.publishing'));
    try {
        const res = await fetch('/api/etablissements/bulk', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ action: 'publish_all' })
        });
        
        if (res.ok) {
            const data = await res.json();
            toast.success(data.message || t('messages.bulk_publish_success'), { id: toastId });
            fetchEtablissements();
        } else {
            const err = await res.json();
            toast.error(err.error || t('messages.bulk_publish_error'), { id: toastId });
        }
    } catch(e) { 
        toast.error(t('messages.server_error'), { id: toastId });
    }
  };

  const handleDeleteAll = async () => {
     if (!confirm(t('messages.bulk_delete_confirm'))) return;
     
     const toastId = toast.loading(t('messages.deleting'));
     try {
        const res = await fetch('/api/etablissements/bulk', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ action: 'delete_all' })
        });
        
        if (res.ok) {
            const data = await res.json();
            toast.success(data.message || t('messages.bulk_delete_success'), { id: toastId });
            fetchEtablissements();
        } else {
             const err = await res.json();
            toast.error(err.error || t('messages.bulk_delete_error'), { id: toastId });
        }
     } catch(e) {
         toast.error(t('messages.server_error'), { id: toastId });
     }
  };

  if (loading && etablissements.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[hsl(var(--gov-blue))/0.1] border-t-[hsl(var(--gov-blue))] rounded-full animate-spin" />
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground animate-pulse">
            {t('loading') || 'Chargement des établissements...'}
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
              <Building2 className="text-[hsl(var(--gov-blue))] w-6 h-6" />
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground">
              {t('page_title')}
            </h1>
          </div>
          <p className="text-muted-foreground font-medium text-lg ml-15">
            {t('total_establishments', { count: total })}
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <GovButton
            onClick={fetchEtablissements}
            variant="outline"
            size="icon"
            loading={loading && etablissements.length > 0}
            title={t('refresh') || "Actualiser"}
          />

          <div className="flex items-center gap-1 bg-card border border-border rounded-2xl p-1 shadow-sm">
            <GovButton
              onClick={handlePublishAll}
              variant="outline"
              size="icon"
              title={t('bulk_publish') || "Tout Publier"}
              className="text-[hsl(var(--gov-blue))] border-none hover:bg-[hsl(var(--gov-blue))/0.05]"
            >
              <Globe size={18} />
            </GovButton>
            <div className="w-px h-6 bg-border" />
            <GovButton
              onClick={handleDeleteAll}
              variant="outline"
              size="icon"
              title={t('bulk_delete') || "Tout Supprimer"}
              className="text-[hsl(var(--gov-red))] border-none hover:bg-[hsl(var(--gov-red))/0.05]"
            >
              <Trash2 size={18} />
            </GovButton>
          </div>

          <GovButton
            onClick={() => setShowFilters(!showFilters)}
            variant={showFilters ? "primary" : "outline"}
            leftIcon={<Filter size={16} />}
            className={showFilters ? "shadow-lg shadow-[hsl(var(--gov-blue))/0.2]" : ""}
          >
            {t('filters')}
          </GovButton>

          <GovButton
            asChild
            variant="primary"
            leftIcon={<Plus size={18} />}
            className="shadow-lg shadow-[hsl(var(--gov-blue))/0.2]"
          >
            <Link href="/admin/etablissements/nouveau">
              {t('new_establishment')}
            </Link>
          </GovButton>
        </div>
      </div>      {/* Stats Cards */}
      <KpiGrid cols={4}>
        <KpiCard
          index={0}
          label={t('stats.total')}
          value={stats.total}
          icon={Building2}
          variant="blue"
        />
        <KpiCard
          index={1}
          label={t('stats.validated')}
          value={stats.valides}
          icon={CheckCircle}
          variant="green"
        />
        <KpiCard
          index={2}
          label={t('stats.published')}
          value={stats.publies}
          icon={Globe}
          variant="blue"
        />
        <KpiCard
          index={3}
          label={t('stats.average_rating')}
          value={stats.averageRating.toFixed(1)}
          icon={Star}
          variant="gold"
        />
      </KpiGrid>

      {/* Filters */}
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
                <div className="space-y-2 lg:col-span-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">
                    {t('search_placeholder') || 'Rechercher un établissement...'}
                  </label>
                  <div className="relative group">
                    <Search className={`absolute top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-[hsl(var(--gov-blue))] transition-colors ${locale === 'ar' ? 'right-4' : 'left-4'}`} size={18} />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder={t('search_placeholder') || 'Rechercher...'}
                      className="gov-input pl-12 h-12 text-sm font-medium"
                    />
                  </div>
                </div>
 
                {/* Secteur */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">
                    {t('all_sectors') || 'Secteur'}
                  </label>
                  <select
                    value={secteurFilter}
                    onChange={(e) => setSecteurFilter(e.target.value)}
                    className="gov-input h-12 text-sm font-medium appearance-none cursor-pointer"
                  >
                    {SECTEURS.map((s) => (
                      <option key={s.value} value={s.value}>{getSecteurLabel(s.value)}</option>
                    ))}
                  </select>
                </div>
 
                {/* Reset */}
                <div className="flex items-end">
                  <GovButton
                    onClick={() => { setSearch(''); setSecteurFilter(''); setValidFilter(''); }}
                    variant="outline"
                    leftIcon={<X size={14} />}
                    className="w-full justify-center"
                  >
                    {t('reset')}
                  </GovButton>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table View */}
      <GovTable>
        <thead>
          <tr>
            <GovTh>{t('card.name') || "Établissement"}</GovTh>
            <GovTh>{t('card.sector') || "Secteur"}</GovTh>
            <GovTh>{t('card.location') || "Localisation"}</GovTh>
            <GovTh>{t('card.status') || "Statut"}</GovTh>
            <GovTh>{t('card.rating') || "Note"}</GovTh>
            <GovTh className="text-right">{t('card.actions') || "Actions"}</GovTh>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {loading ? (
            [...Array(5)].map((_, i) => (
              <GovTr key={i} className="animate-pulse">
                <GovTd><div className="h-4 w-32 bg-muted rounded" /></GovTd>
                <GovTd><div className="h-4 w-20 bg-muted rounded" /></GovTd>
                <GovTd><div className="h-4 w-24 bg-muted rounded" /></GovTd>
                <GovTd><div className="h-4 w-16 bg-muted rounded" /></GovTd>
                <GovTd><div className="h-4 w-12 bg-muted rounded" /></GovTd>
                <GovTd><div className="h-4 w-24 bg-muted rounded ml-auto" /></GovTd>
              </GovTr>
            ))
          ) : etablissements.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-6 py-20">
                <EmptyState
                  icon={<Building2 className="w-10 h-10" />}
                  title={t('empty.title')}
                  description={search || secteurFilter ? t('empty.no_results') : t('empty.description')}
                  action={
                    (search || secteurFilter || validFilter) ? (
                      <GovButton
                        onClick={() => { setSearch(''); setSecteurFilter(''); setValidFilter(''); }}
                        variant="primary"
                        className="shadow-lg shadow-[hsl(var(--gov-blue))/0.2]"
                      >
                        {t('reset')}
                      </GovButton>
                    ) : undefined
                  }
                />
              </td>
            </tr>
          ) : (
            etablissements.map((etablissement) => (
              <GovTr
                key={etablissement.id}
                onClick={() => { setSelectedEtablissement(etablissement); setShowDetailModal(true); }}
              >
                <GovTd>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground border border-border shadow-sm overflow-hidden shrink-0">
                      {etablissement.photoPrincipale ? (
                        <img 
                          src={etablissement.photoPrincipale} 
                          alt={etablissement.nom}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Building2 size={18} />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-extrabold text-foreground">{etablissement.nom}</span>
                        {etablissement.isMisEnAvant && (
                          <Star size={12} className="text-[hsl(var(--gov-gold))] fill-current" />
                        )}
                      </div>
                      <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground opacity-60">
                        {etablissement.code}
                      </span>
                    </div>
                  </div>
                </GovTd>
                <GovTd>
                  <span className="px-2.5 py-0.5 bg-muted rounded-full text-[9px] font-bold uppercase tracking-widest text-muted-foreground border border-border">
                    {getSecteurLabel(etablissement.secteur)}
                  </span>
                </GovTd>
                <GovTd>
                  {etablissement.commune && (
                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                      <MapPin size={12} className="text-[hsl(var(--gov-red))]" />
                      <span>{locale === 'ar' ? (etablissement.commune.nomArabe || etablissement.commune.nom) : etablissement.commune.nom}</span>
                    </div>
                  )}
                </GovTd>
                <GovTd>
                  <div className="flex flex-wrap gap-1">
                    <StatusBadge status={etablissement.isValide ? "VALIDEE" : "REJETEE"} size="sm" />
                    {etablissement.isPublie && <StatusBadge status="PUBLIEE" size="sm" />}
                  </div>
                </GovTd>
                <GovTd>
                  <div className="flex items-center gap-1.5">
                    <Star size={14} className="text-[hsl(var(--gov-gold))] fill-current" />
                    <span className="text-xs font-black text-foreground">{etablissement.noteMoyenne.toFixed(1)}</span>
                    <span className="text-[9px] font-bold text-muted-foreground">({etablissement.nombreEvaluations})</span>
                  </div>
                </GovTd>
                <GovTd className="text-right">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-95 group-hover:scale-100">
                    <GovButton
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedEtablissement(etablissement);
                        setShowDetailModal(true);
                      }}
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-[hsl(var(--gov-blue))]"
                    >
                      <Eye size={18} />
                    </GovButton>
                    <GovButton
                      onClick={(e) => {
                        e.stopPropagation();
                        handleValidate(etablissement.id, 'publier');
                      }}
                      variant="ghost"
                      size="icon"
                      className={etablissement.isPublie ? "text-[hsl(var(--gov-blue))]" : "text-muted-foreground hover:text-[hsl(var(--gov-blue))]"}
                      loading={actionLoading === `publier-${etablissement.id}`}
                    >
                      <Globe size={18} />
                    </GovButton>
                    <GovButton
                      asChild
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-[hsl(var(--gov-blue))]"
                    >
                      <Link href={`/admin/etablissements/${etablissement.id}/edit`}>
                        <Edit size={18} />
                      </Link>
                    </GovButton>
                  </div>
                </GovTd>
              </GovTr>
            ))
          )}
        </tbody>
      </GovTable>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-8 py-6 bg-card border border-border rounded-3xl shadow-xl shadow-[hsl(var(--gov-blue))/0.02]">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            {t('pagination.info', { page, total: totalPages })}
          </p>
          <div className="flex items-center gap-3">
            <GovButton
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              variant="outline"
              size="icon"
            >
              {locale === 'ar' ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </GovButton>
            <div className="flex items-center gap-1">
              {[...Array(Math.min(5, totalPages))].map((_, i) => {
                const pageNum = i + 1;
                return (
                  <GovButton
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    variant={page === pageNum ? "primary" : "outline"}
                    className="w-10 h-10 p-0"
                  >
                    {pageNum}
                  </GovButton>
                );
              })}
            </div>
            <GovButton
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              variant="outline"
              size="icon"
            >
              {locale === 'ar' ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
            </GovButton>
          </div>
        </div>
      )}

      {/* Detail Modal (Institutional Sidebar) */}
      <AnimatePresence>
        {showDetailModal && selectedEtablissement && (
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
                    {t('card.details_title')}
                  </h2>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">
                    Gestion de l'établissement
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
                {/* Header Profile */}
                <div className="flex items-center gap-6">
                  <div className="w-24 h-24 rounded-3xl bg-muted flex items-center justify-center text-muted-foreground border border-border shadow-inner overflow-hidden">
                    {selectedEtablissement.photoPrincipale ? (
                      <img 
                        src={selectedEtablissement.photoPrincipale} 
                        alt={selectedEtablissement.nom}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Building2 className="w-10 h-10" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-foreground mb-1">
                      {selectedEtablissement.nom}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 bg-muted rounded-full text-[9px] font-bold uppercase tracking-widest text-muted-foreground border border-border">
                        {selectedEtablissement.code}
                      </span>
                      <StatusBadge color="blue">
                        {getSecteurLabel(selectedEtablissement.secteur)}
                      </StatusBadge>
                    </div>
                  </div>
                </div>
 
                {/* Rating Card */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-6 bg-[hsl(var(--gov-yellow))/0.03] rounded-3xl border border-[hsl(var(--gov-yellow))/0.1] text-center">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-[hsl(var(--gov-yellow))] mb-2 opacity-60">Note Moyenne</p>
                    <p className="text-4xl font-black text-foreground leading-none mb-3">
                      {selectedEtablissement.noteMoyenne.toFixed(1)}
                    </p>
                    <div className="flex items-center justify-center gap-1 text-[hsl(var(--gov-yellow))]">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={14}
                          className={star <= Math.round(selectedEtablissement.noteMoyenne) ? 'fill-current' : ''}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="p-6 bg-muted/30 rounded-3xl border border-border/50 text-center">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-2 opacity-60">Total Evaluations</p>
                    <p className="text-4xl font-black text-foreground leading-none mb-3">
                      {selectedEtablissement.nombreEvaluations}
                    </p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-40">Avis Citoyens</p>
                  </div>
                </div>
 
                {/* Contact Info */}
                <div className="space-y-4">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-foreground flex items-center gap-2">
                    <div className="w-1.5 h-4 bg-[hsl(var(--gov-blue))] rounded-full" />
                    Informations de Contact
                  </h4>
                  <div className="grid grid-cols-1 gap-3">
                    {selectedEtablissement.adresse && (
                      <div className="flex items-center gap-4 p-4 bg-muted/20 rounded-2xl border border-border/50">
                        <div className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center text-[hsl(var(--gov-red))]">
                          <MapPin size={18} />
                        </div>
                        <span className="text-sm font-bold text-foreground">{selectedEtablissement.adresse}</span>
                      </div>
                    )}
                    {selectedEtablissement.telephone && (
                      <div className="flex items-center gap-4 p-4 bg-muted/20 rounded-2xl border border-border/50">
                        <div className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center text-[hsl(var(--gov-blue))]">
                          <Phone size={18} />
                        </div>
                        <span className="text-sm font-bold text-foreground">{selectedEtablissement.telephone}</span>
                      </div>
                    )}
                    {selectedEtablissement.email && (
                      <div className="flex items-center gap-4 p-4 bg-muted/20 rounded-2xl border border-border/50">
                        <div className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center text-[hsl(var(--gov-muted))]">
                          <Mail size={18} />
                        </div>
                        <span className="text-sm font-bold text-foreground">{selectedEtablissement.email}</span>
                      </div>
                    )}
                  </div>
                </div>
 
                {/* Workflow Actions */}
                <div className="space-y-4 pt-10 border-t border-border">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-foreground flex items-center gap-2">
                    <div className="w-1.5 h-4 bg-[hsl(var(--gov-green))] rounded-full" />
                    Actions Administratives
                  </h4>
                  <div className="grid grid-cols-1 gap-4">
                    <GovButton
                      onClick={() => handleValidate(selectedEtablissement.id, 'valider')}
                      disabled={!!actionLoading}
                      loading={actionLoading === `valider-${selectedEtablissement.id}`}
                      variant={selectedEtablissement.isValide ? "outline" : "primary"}
                      leftIcon={!(actionLoading === `valider-${selectedEtablissement.id}`) && (selectedEtablissement.isValide ? <CheckCircle size={18} /> : <Award size={18} />)}
                      className={`w-full justify-between h-16 ${selectedEtablissement.isValide ? "text-[hsl(var(--gov-green))] bg-[hsl(var(--gov-green))/0.05] border-[hsl(var(--gov-green))/0.2]" : ""}`}
                    >
                      <span>{selectedEtablissement.isValide ? t('card.validated') : t('card.validate')}</span>
                      <ChevronRight size={16} />
                    </GovButton>
 
                    <GovButton
                      onClick={() => handleValidate(selectedEtablissement.id, 'publier')}
                      disabled={!!actionLoading}
                      loading={actionLoading === `publier-${selectedEtablissement.id}`}
                      variant={selectedEtablissement.isPublie ? "outline" : "primary"}
                      leftIcon={!(actionLoading === `publier-${selectedEtablissement.id}`) && <Globe size={18} />}
                      className={`w-full justify-between h-16 ${selectedEtablissement.isPublie ? "text-[hsl(var(--gov-blue))] bg-[hsl(var(--gov-blue))/0.05] border-[hsl(var(--gov-blue))/0.2]" : ""}`}
                    >
                      <span>{selectedEtablissement.isPublie ? t('card.unpublish') : t('card.publish')}</span>
                      <ChevronRight size={16} />
                    </GovButton>
 
                    <GovButton
                      onClick={() => handleValidate(selectedEtablissement.id, 'misEnAvant')}
                      disabled={!!actionLoading}
                      loading={actionLoading === `misEnAvant-${selectedEtablissement.id}`}
                      variant={selectedEtablissement.isMisEnAvant ? "outline" : "primary"}
                      leftIcon={!(actionLoading === `misEnAvant-${selectedEtablissement.id}`) && <Star size={18} />}
                      className={`w-full justify-between h-16 ${selectedEtablissement.isMisEnAvant ? "text-[hsl(var(--gov-yellow))] bg-[hsl(var(--gov-yellow))/0.05] border-[hsl(var(--gov-yellow))/0.2]" : ""}`}
                    >
                      <span>{selectedEtablissement.isMisEnAvant ? t('card.featured') || "Mis en avant" : t('card.feature') || "Mettre en avant"}</span>
                      <ChevronRight size={16} />
                    </GovButton>
 
                    <div className="pt-6">
                      <GovButton
                        onClick={() => handleDelete(selectedEtablissement.id)}
                        disabled={!!actionLoading}
                        variant="outline"
                        leftIcon={<Trash2 size={18} />}
                        className="w-full justify-center h-16 border-dashed border-[hsl(var(--gov-red))/0.3] text-[hsl(var(--gov-red))] hover:bg-[hsl(var(--gov-red))/0.05]"
                      >
                        {t('card.delete')}
                      </GovButton>
                    </div>
                  </div>
                </div>
 
                {/* Footer Actions */}
                <div className="pt-10">
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="w-full px-6 py-4 bg-muted text-muted-foreground rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-muted/80 transition-all border border-transparent hover:border-border"
                  >
                    Fermer la vue
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
