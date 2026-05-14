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
          <button
            onClick={fetchEtablissements}
            className="w-12 h-12 flex items-center justify-center bg-card border border-border rounded-2xl hover:bg-muted hover:border-muted-foreground/30 transition-all shadow-sm group"
          >
            <RefreshCw size={20} className={`text-muted-foreground group-hover:text-foreground transition-colors ${loading ? 'animate-spin' : ''}`} />
          </button>

          <div className="flex items-center gap-1 bg-card border border-border rounded-2xl p-1 shadow-sm">
            <button
              onClick={handlePublishAll}
              title={t('bulk_publish') || "Tout Publier"}
              className="w-10 h-10 flex items-center justify-center text-[hsl(var(--gov-blue))] hover:bg-[hsl(var(--gov-blue))/0.05] rounded-xl transition-colors"
            >
              <Globe size={18} />
            </button>
            <div className="w-px h-6 bg-border" />
            <button
              onClick={handleDeleteAll}
              title={t('bulk_delete') || "Tout Supprimer"}
              className="w-10 h-10 flex items-center justify-center text-[hsl(var(--gov-red))] hover:bg-[hsl(var(--gov-red))/0.05] rounded-xl transition-colors"
            >
              <Trash2 size={18} />
            </button>
          </div>

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

          <Link
            href="/admin/etablissements/nouveau"
            className="gov-btn-primary h-12 px-8 rounded-2xl text-xs uppercase tracking-widest font-bold"
          >
            <Plus size={18} />
            {t('new_establishment')}
          </Link>
        </div>
      </div>

      {/* Stats Cards */      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: t('stats.total'), value: stats.total, icon: Building2, color: 'hsl(var(--gov-blue))' },
          { label: t('stats.validated'), value: stats.valides, icon: CheckCircle, color: 'hsl(var(--gov-green))' },
          { label: t('stats.published'), value: stats.publies, icon: Globe, color: 'hsl(var(--gov-blue))' },
          { label: t('stats.average_rating'), value: stats.averageRating.toFixed(1), icon: Star, color: 'hsl(var(--gov-yellow))' },
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
              </div>
              <p className="text-3xl font-black text-foreground mb-1 tracking-tight">{stat.value}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{stat.label}</p>
            </div>
          </motion.div>
        ))}
      </div>}

      {/* Filters */}      <AnimatePresence>
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
                  <button
                    onClick={() => { setSearch(''); setSecteurFilter(''); setValidFilter(''); }}
                    className="flex items-center gap-2 px-6 h-12 text-muted-foreground hover:text-foreground font-bold text-[10px] uppercase tracking-widest transition-colors w-full justify-center bg-muted/30 rounded-2xl border border-border/50 hover:bg-muted"
                  >
                    <X size={14} />
                    {t('reset')}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {loading ? (
          [...Array(6)].map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-3xl p-8 animate-pulse shadow-sm">
              <div className="flex items-start gap-6 mb-6">
                <div className="w-16 h-16 bg-muted rounded-2xl" />
                <div className="flex-1 space-y-3">
                  <div className="h-5 w-3/4 bg-muted rounded-full" />
                  <div className="h-4 w-1/2 bg-muted rounded-full opacity-60" />
                </div>
              </div>
              <div className="space-y-4">
                <div className="h-4 w-full bg-muted rounded-full opacity-40" />
                <div className="h-4 w-2/3 bg-muted rounded-full opacity-40" />
              </div>
            </div>
          ))
        ) : etablissements.length === 0 ? (
          <div className="col-span-full">
            <EmptyState
              icon={<Building2 className="w-10 h-10" />}
              title={t('empty.title')}
              description={search || secteurFilter ? t('empty.no_results') : t('empty.description')}
              action={
                (search || secteurFilter || validFilter) ? (
                  <button 
                    onClick={() => { setSearch(''); setSecteurFilter(''); setValidFilter(''); }}
                    className="px-8 py-3 bg-[hsl(var(--gov-blue))] text-white rounded-2xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-[hsl(var(--gov-blue))/0.2] transition-all hover:scale-105 active:scale-95"
                  >
                    {t('reset')}
                  </button>
                ) : undefined
              }
            />
          </div>
        ) : (
          etablissements.map((etablissement) => {
            const secteurConfig = getSecteurConfig(etablissement.secteur);
            
            return (
              <motion.div
                key={etablissement.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="group bg-card border border-border rounded-3xl shadow-xl shadow-[hsl(var(--gov-blue))/0.02] hover:shadow-[hsl(var(--gov-blue))/0.08] hover:border-[hsl(var(--gov-blue))/0.3] transition-all overflow-hidden relative"
              >
                <div className="p-8">
                  {/* Header */}
                  <div className="flex items-start gap-6 mb-8">
                    <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground group-hover:scale-105 transition-transform overflow-hidden border border-border shadow-inner">
                      {etablissement.photoPrincipale ? (
                        <img 
                          src={etablissement.photoPrincipale} 
                          alt={etablissement.nom}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Building2 className="w-8 h-8" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-xl font-extrabold text-foreground group-hover:text-[hsl(var(--gov-blue))] transition-colors truncate">
                          {etablissement.nom}
                        </h3>
                        {etablissement.isMisEnAvant && (
                          <Star className="w-4 h-4 text-[hsl(var(--gov-yellow))] fill-current" />
                        )}
                      </div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-60">{etablissement.code}</p>
                    </div>
                  </div>
 
                  {/* Status badges */}
                  <div className="flex flex-wrap items-center gap-2 mb-8">
                    <span className="px-3 py-1 bg-muted rounded-full text-[10px] font-bold uppercase tracking-widest text-muted-foreground border border-border">
                      {getSecteurLabel(etablissement.secteur)}
                    </span>
                    {etablissement.isValide ? (
                      <span className="px-3 py-1 bg-[hsl(var(--gov-green))/0.1] text-[hsl(var(--gov-green))] rounded-full text-[10px] font-black uppercase tracking-widest border border-[hsl(var(--gov-green))/0.2]">
                        {t('card.validated')}
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-[hsl(var(--gov-red))/0.1] text-[hsl(var(--gov-red))] rounded-full text-[10px] font-black uppercase tracking-widest border border-[hsl(var(--gov-red))/0.2]">
                        {t('card.pending')}
                      </span>
                    )}
                    {etablissement.isPublie && (
                      <span className="px-3 py-1 bg-[hsl(var(--gov-blue))/0.1] text-[hsl(var(--gov-blue))] rounded-full text-[10px] font-black uppercase tracking-widest border border-[hsl(var(--gov-blue))/0.2]">
                        {t('card.published')}
                      </span>
                    )}
                  </div>
 
                  {/* Location & Stats */}
                  <div className="space-y-4 mb-8">
                    {etablissement.commune && (
                      <div className="flex items-center gap-3 text-sm font-medium text-muted-foreground">
                        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center border border-border">
                          <MapPin size={14} className="text-[hsl(var(--gov-red))]" />
                        </div>
                        <span className="line-clamp-1">{locale === 'ar' ? (etablissement.commune.nomArabe || etablissement.commune.nom) : etablissement.commune.nom}</span>
                      </div>
                    )}
 
                    <div className="flex items-center justify-between p-4 bg-muted/20 rounded-2xl border border-border/50">
                      <div className="flex items-center gap-2">
                        <Star size={16} className="text-[hsl(var(--gov-yellow))] fill-current" />
                        <span className="text-sm font-black text-foreground">{etablissement.noteMoyenne.toFixed(1)}</span>
                        <span className="text-[10px] font-bold uppercase text-muted-foreground opacity-60">
                          ({etablissement.nombreEvaluations})
                        </span>
                      </div>
                      <div className="h-4 w-px bg-border/50" />
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Users size={16} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">
                          {etablissement._count?.evaluations || 0} avis
                        </span>
                      </div>
                    </div>
                  </div>
 
                  {/* Actions */}
                  <div className="flex items-center gap-3 pt-6 border-t border-border">
                    <button
                      onClick={() => { setSelectedEtablissement(etablissement); setShowDetailModal(true); }}
                      className="flex-1 h-12 flex items-center justify-center gap-2 bg-card border border-border text-muted-foreground hover:text-[hsl(var(--gov-blue))] hover:bg-[hsl(var(--gov-blue))/0.05] hover:border-[hsl(var(--gov-blue))/0.2] rounded-2xl transition-all shadow-sm font-bold text-[10px] uppercase tracking-widest"
                    >
                      <Eye size={16} />
                      {t('card.details')}
                    </button>
                    <button
                      onClick={() => handleValidate(etablissement.id, 'publier')}
                      disabled={!!actionLoading}
                      className={`flex-1 h-12 flex items-center justify-center gap-2 rounded-2xl transition-all shadow-sm font-bold text-[10px] uppercase tracking-widest ${
                        etablissement.isPublie
                          ? 'bg-[hsl(var(--gov-blue))] text-white border-[hsl(var(--gov-blue))]'
                          : 'bg-card border border-border text-muted-foreground hover:text-[hsl(var(--gov-blue))] hover:bg-[hsl(var(--gov-blue))/0.05]'
                      }`}
                    >
                      {actionLoading === `publier-${etablissement.id}` ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Globe size={16} />
                      )}
                      {etablissement.isPublie ? t('card.published') : t('card.publish')}
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-8 py-6 bg-card border border-border rounded-3xl shadow-xl shadow-[hsl(var(--gov-blue))/0.02]">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            {t('pagination.info', { page, total: totalPages })}
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
                      <span className="px-3 py-1 bg-[hsl(var(--gov-blue))/0.1] text-[hsl(var(--gov-blue))] rounded-full text-[9px] font-bold uppercase tracking-widest border border-[hsl(var(--gov-blue))/0.2]">
                        {getSecteurLabel(selectedEtablissement.secteur)}
                      </span>
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
                    <button
                      onClick={() => handleValidate(selectedEtablissement.id, 'valider')}
                      disabled={!!actionLoading}
                      className={`w-full flex items-center justify-between p-5 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all border ${
                        selectedEtablissement.isValide
                          ? 'bg-[hsl(var(--gov-green))/0.05] text-[hsl(var(--gov-green))] border-[hsl(var(--gov-green))/0.2]'
                          : 'bg-card text-muted-foreground border-border hover:bg-[hsl(var(--gov-green))/0.05] hover:text-[hsl(var(--gov-green))] hover:border-[hsl(var(--gov-green))/0.2]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {actionLoading === `valider-${selectedEtablissement.id}` ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                        {selectedEtablissement.isValide ? t('card.validated') : t('card.validate')}
                      </div>
                      <ChevronRight size={16} />
                    </button>
 
                    <button
                      onClick={() => handleValidate(selectedEtablissement.id, 'publier')}
                      disabled={!!actionLoading}
                      className={`w-full flex items-center justify-between p-5 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all border ${
                        selectedEtablissement.isPublie
                          ? 'bg-[hsl(var(--gov-blue))/0.05] text-[hsl(var(--gov-blue))] border-[hsl(var(--gov-blue))/0.2]'
                          : 'bg-card text-muted-foreground border-border hover:bg-[hsl(var(--gov-blue))/0.05] hover:text-[hsl(var(--gov-blue))] hover:border-[hsl(var(--gov-blue))/0.2]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {actionLoading === `publier-${selectedEtablissement.id}` ? <Loader2 size={18} className="animate-spin" /> : <Globe size={18} />}
                        {selectedEtablissement.isPublie ? t('card.unpublish') : t('card.publish')}
                      </div>
                      <ChevronRight size={16} />
                    </button>
 
                    <button
                      onClick={() => handleValidate(selectedEtablissement.id, 'misEnAvant')}
                      disabled={!!actionLoading}
                      className={`w-full flex items-center justify-between p-5 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all border ${
                        selectedEtablissement.isMisEnAvant
                          ? 'bg-[hsl(var(--gov-yellow))/0.05] text-[hsl(var(--gov-yellow))] border-[hsl(var(--gov-yellow))/0.2]'
                          : 'bg-card text-muted-foreground border-border hover:bg-[hsl(var(--gov-yellow))/0.05] hover:text-[hsl(var(--gov-yellow))] hover:border-[hsl(var(--gov-yellow))/0.2]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {actionLoading === `misEnAvant-${selectedEtablissement.id}` ? <Loader2 size={18} className="animate-spin" /> : <Star size={18} className={selectedEtablissement.isMisEnAvant ? 'fill-current' : ''} />}
                        {selectedEtablissement.isMisEnAvant ? t('card.remove_highlight') : t('card.highlight')}
                      </div>
                      <ChevronRight size={16} />
                    </button>
 
                    <button
                      onClick={() => handleDelete(selectedEtablissement.id)}
                      disabled={!!actionLoading}
                      className="w-full flex items-center justify-between p-5 bg-[hsl(var(--gov-red))/0.05] text-[hsl(var(--gov-red))] border border-[hsl(var(--gov-red))/0.2] rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-[hsl(var(--gov-red))] hover:text-white transition-all shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        {actionLoading === `delete-${selectedEtablissement.id}` ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                        {t('card.delete')}
                      </div>
                      <ChevronRight size={16} />
                    </button>
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
