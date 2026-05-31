'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
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
  Shield,
} from 'lucide-react';
import { toast } from 'sonner';
import { Link } from '@/i18n/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { useData } from '@/hooks/use-data';
import { useMutation } from '@/hooks/use-mutation';
import { GovInput } from '@/components/ui/GovInput';
import { GovSelect } from '@/components/ui/GovSelect';
import { GovButton } from '@/components/ui/GovButton';

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
  etablissement: { 
    id: number; 
    nom: string; 
    nomArabe?: string;
    secteur: string; 
    commune: { id: number; nom: string; nomArabe?: string } | null;
  } | null;
}

const STATUT_STYLES: Record<string, { bg: string; text: string; icon: React.ElementType }> = {
  BROUILLON: { bg: 'bg-muted', text: 'text-muted-foreground', icon: Edit },
  EN_ATTENTE_VALIDATION: { bg: 'bg-gov-gold/10/10', text: 'text-gov-gold', icon: Clock },
  VALIDEE: { bg: 'bg-[hsl(var(--gov-blue))/0.1]', text: 'text-[hsl(var(--gov-blue))]', icon: CheckCircle },
  PUBLIEE: { bg: 'bg-[hsl(var(--gov-green))/0.1]', text: 'text-[hsl(var(--gov-green))]', icon: Globe },
  DEPUBLIEE: { bg: 'bg-gov-gold/10/10', text: 'text-gov-gold', icon: Archive },
  ARCHIVEE: { bg: 'bg-slate-500/10', text: 'text-slate-600', icon: Archive },
};

const SECTEURS_KEYS = [
  'EDUCATION', 'SANTE', 'SPORT', 'SOCIAL', 'CULTUREL', 'AUTRE'
];

export default function AdminActualitesPage() {
  const t = useTranslations('admin.news_page');
  const tSectors = useTranslations('admin.users_page.sectors');
  const locale = useLocale();

  const [page, setPage] = useState(1);
  
  const actionMutation = useMutation();
  
  // Filters
  const [search, setSearch] = useState('');
  const [statutFilter, setStatutFilter] = useState('');
  const [secteurFilter, setSecteurFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Modal
  const [selectedActualite, setSelectedActualite] = useState<Actualite | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const queryParams = new URLSearchParams();
  queryParams.set('page', page.toString());
  queryParams.set('limit', '12');
  if (search) queryParams.set('search', search);
  if (statutFilter) queryParams.set('statut', statutFilter);
  if (secteurFilter) queryParams.set('secteur', secteurFilter);

  const { data: actualitesData, isLoading: loading, mutate: fetchActualites } = useData(`/api/actualites?${queryParams.toString()}`);

  const actualites = Array.isArray(actualitesData?.data) ? actualitesData.data : [];
  const totalPages = actualitesData?.pagination?.totalPages || 1;
  const total = actualitesData?.pagination?.total || 0;

  const stats = useMemo(() => {
    const allData = Array.isArray(actualitesData?.data) ? actualitesData.data : [];
    const statsCounts: Record<string, number> = {};
    allData.forEach((a: Actualite) => {
      statsCounts[a.statut] = (statsCounts[a.statut] || 0) + 1;
    });
    return statsCounts;
  }, [actualitesData]);

  const handleChangeStatut = async (id: number, newStatut: string) => {
    const promise = new Promise(async (resolve, reject) => {
      try {
        await actionMutation.mutate(`/api/actualites/${id}/statut`, {
          method: 'PATCH',
          data: { statut: newStatut },
        });

        await fetchActualites();
        setShowDetailModal(false);
        resolve(true);
      } catch (error: any) {
        reject(new Error(error.message || t('messages.error')));
      }
    });

    toast.promise(promise, {
      loading: 'Mise à jour du statut...',
      success: t('messages.status_changed', { status: t(`statuses.${newStatut}`) }),
      error: (err) => err.message,
    });
  };

  const handleToggleMisEnAvant = async (id: number, current: boolean) => {
    const promise = new Promise(async (resolve, reject) => {
      try {
        // keeping original logic for url
        await actionMutation.mutate(`/actualites/${id}`, {
          method: 'PATCH',
          data: { isMisEnAvant: !current },
        });

        await fetchActualites();
        resolve(true);
      } catch (error: any) {
        reject(new Error(error.message || t('messages.error')));
      }
    });

    toast.promise(promise, {
      loading: current ? 'Retrait de la mise en avant...' : 'Mise en avant...',
      success: current ? t('messages.highlight_removed') : t('messages.highlight_added'),
      error: (err) => err.message,
    });
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t('messages.delete_confirm'))) return;
    
    const promise = new Promise(async (resolve, reject) => {
      try {
        await actionMutation.mutate(`/api/actualites/${id}`, { method: 'DELETE' });
        await fetchActualites();
        setShowDetailModal(false);
        resolve(true);
      } catch (error: any) {
        reject(new Error(error.message || t('messages.error')));
      }
    });

    toast.promise(promise, {
      loading: 'Suppression en cours...',
      success: t('messages.deleted'),
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

  const totalActualites = Object.values(stats).reduce((a, b) => a + b, 0);

  const getSecteurLabel = (key: string) => {
    if (!key) return t('all_sectors');
    if (key === 'AUTRE') return tSectors('AUTRE');
    return tSectors(key as any);
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[hsl(var(--gov-blue)/0.03)] rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-[hsl(var(--gov-gold)/0.03)] rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl pointer-events-none" />

      <div className="max-w-[1600px] mx-auto relative z-10 pb-20">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-gradient-to-br from-[hsl(var(--gov-blue))] to-[hsl(var(--gov-blue-dark))] rounded-2xl flex items-center justify-center text-white shadow-xl shadow-[hsl(var(--gov-blue)/0.25)] ring-4 ring-white dark:ring-gray-900 group">
              <Newspaper className="w-8 h-8 group-hover:scale-110 transition-transform duration-500" />
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
                <p>{t('total_news', { count: total })}</p>
                <div className="w-1 h-1 bg-border rounded-full" />
                <p className="flex items-center gap-1.5">
                  <Shield size={14} className="text-[hsl(var(--gov-blue))]" />
                  Gouvernance
                </p>
              </div>
            </div>
          </div>
        
          <div className="flex flex-wrap items-center gap-3">
            <GovButton
              onClick={async () => {
                await fetchActualites();
              }}
              disabled={loading}
              variant="outline"
              size="icon"
              loading={loading}
            >
              <RefreshCw size={18} />
            </GovButton>

            <GovButton
              onClick={() => setShowFilters(!showFilters)}
              variant={showFilters ? 'primary' : 'outline'}
              leftIcon={<Filter size={18} className={showFilters ? 'scale-110' : ''} />}
              className={showFilters ? 'shadow-lg shadow-[hsl(var(--gov-blue)/0.2)]' : ''}
            >
              {t('filters')}
              {Object.values({ search, statutFilter, secteurFilter }).filter(v => v !== '').length > 0 && (
                <span className="ml-1 w-5 h-5 bg-white text-[hsl(var(--gov-blue))] rounded-full flex items-center justify-center text-[10px] font-black shadow-sm">
                  {Object.values({ search, statutFilter, secteurFilter }).filter(v => v !== '').length}
                </span>
              )}
            </GovButton>

            <Link href="/admin/actualites/nouvelle">
              <GovButton leftIcon={<Plus size={18} />} variant="primary">
                {t('new_news')}
              </GovButton>
            </Link>
          </div>
        </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {Object.entries(STATUT_STYLES).map(([key, style], i) => {
          const count = stats[key] || 0;
          const Icon = style.icon;
          const isActive = statutFilter === key;
          
          return (
            <motion.button
              key={key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => setStatutFilter(statutFilter === key ? '' : key)}
              className={`gov-stat-card group text-left transition-all ${
                isActive
                  ? 'ring-2 ring-[hsl(var(--gov-blue))] shadow-lg bg-card'
                  : ''
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-10 h-10 rounded-xl ${style.bg} ${style.text} flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform`}>
                  <Icon className="w-5 h-5" />
                </div>
                {count > 0 && (
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">
                    {totalActualites > 0 ? Math.round((count / totalActualites) * 100) : 0}%
                  </span>
                )}
              </div>
              <p className="gov-stat-value">{count}</p>
              <p className="gov-stat-label truncate font-bold uppercase tracking-widest text-[10px]">{t(`statuses.${key}`)}</p>
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
            className="gov-card p-5 overflow-hidden border-border"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Recherche */}
              <div className="lg:col-span-2">
                <GovInput
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t('search_placeholder')}
                  leftIcon={<Search className="w-5 h-5" />}
                  className={locale === 'ar' ? 'text-right' : 'text-left'}
                />
              </div>

              {/* Secteur */}
              <GovSelect
                value={secteurFilter}
                onChange={(e) => setSecteurFilter(e.target.value)}
                options={[
                  { label: t('all_sectors'), value: '' },
                  ...SECTEURS_KEYS.map((s) => ({ label: getSecteurLabel(s), value: s }))
                ]}
              />

              {/* Reset */}
              <GovButton
                variant="outline"
                onClick={() => { setSearch(''); setStatutFilter(''); setSecteurFilter(''); }}
                className="w-full h-[46px]"
              >
                <X size={16} className="mr-2" />
                {t('reset')}
              </GovButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {loading ? (
          [...Array(6)].map((_, i) => (
            <div key={i} className="bg-card rounded-3xl p-6 animate-pulse border border-border">
              <div className="h-40 bg-muted rounded-2xl mb-4" />
              <div className="h-5 w-3/4 bg-muted rounded mb-2" />
              <div className="h-4 w-full bg-muted rounded mb-4" />
              <div className="h-8 w-24 bg-muted rounded-full" />
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
          actualites.map((actualite: any) => {
            const style = STATUT_STYLES[actualite.statut] || STATUT_STYLES.BROUILLON;
            const Icon = style.icon;
            
            return (
              <motion.div
                key={actualite.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="group bg-card rounded-3xl shadow-sm border border-border overflow-hidden hover:shadow-xl hover:shadow-[hsl(var(--gov-blue)/0.1)] hover:-translate-y-1 transition-all duration-300"
              >
                {/* Image */}
                <div className="relative h-44 bg-muted">
                  {actualite.medias?.[0]?.urlPublique ? (
                    <img
                      src={actualite.medias[0].urlPublique}
                      alt={actualite.titre}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="w-12 h-12 text-muted-foreground/20" />
                    </div>
                  )}
                  
                  {/* Badges overlay */}
                  <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border shadow-sm ${style.bg} ${style.text} border-current/20 backdrop-blur-md bg-opacity-80`}>
                      <Icon className="w-3 h-3" />
                      {t(`statuses.${actualite.statut}`)}
                    </span>
                    {actualite.isMisEnAvant && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-gov-gold/10/90 text-white border border-gov-gold/30/50 shadow-sm backdrop-blur-md">
                        <Star className="w-3 h-3 fill-current" />
                        {t('highlight')}
                      </span>
                    )}
                  </div>
                  
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-3">
                    <Link
                      href={`/actualites/${actualite.id}`}
                      target="_blank"
                      className="p-3 bg-card rounded-2xl text-foreground hover:text-[hsl(var(--gov-blue))] border border-border hover:border-[hsl(var(--gov-blue))/0.5] transition-all shadow-sm hover:shadow-lg"
                      title={t('modal.view_online')}
                    >
                      <Globe size={18} />
                    </Link>
                    <button
                      onClick={() => { setSelectedActualite(actualite); setShowDetailModal(true); }}
                      className="p-3 bg-card rounded-2xl text-foreground hover:text-[hsl(var(--gov-blue))] border border-border hover:border-[hsl(var(--gov-blue))/0.5] transition-all shadow-sm hover:shadow-lg"
                      title={t('view_details')}
                    >
                      <Eye size={18} />
                    </button>
                    <Link
                      href={`/admin/actualites/${actualite.id}/modifier`}
                      className="p-3 bg-card rounded-2xl text-foreground hover:text-[hsl(var(--gov-blue))] border border-border hover:border-[hsl(var(--gov-blue))/0.5] transition-all shadow-sm hover:shadow-lg"
                      title={t('edit')}
                    >
                      <Edit size={18} />
                    </Link>
                    <button
                      onClick={() => handleDelete(actualite.id)}
                      className="p-3 bg-[hsl(var(--gov-red))/0.1] rounded-2xl text-[hsl(var(--gov-red))] hover:bg-[hsl(var(--gov-red))] hover:text-white border border-[hsl(var(--gov-red))/0.2] transition-all shadow-sm hover:shadow-lg"
                      title={t('delete')}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <h3 className="font-extrabold text-foreground line-clamp-2 mb-2 leading-tight group-hover:text-[hsl(var(--gov-blue))] transition-colors">
                    {actualite.titre}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-6 font-medium">
                    {actualite.resume || t('modal.no_resume')}
                  </p>
                  
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-muted-foreground pt-5 border-t border-border/50">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 bg-muted rounded-md flex items-center justify-center">
                        <Calendar size={12} className="text-[hsl(var(--gov-blue))]" />
                      </div>
                      {formatDate(actualite.createdAt)}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 bg-muted rounded-md flex items-center justify-center">
                        <Eye size={12} className="text-[hsl(var(--gov-gold))]" />
                      </div>
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
        <div className="flex items-center justify-between px-6 py-5 bg-card rounded-3xl border border-border shadow-sm">
          <p className="text-sm text-muted-foreground font-bold uppercase tracking-widest">
            {t('pagination', { page, totalPages, total })}
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2.5 text-foreground hover:text-[hsl(var(--gov-blue))] bg-background hover:bg-muted rounded-xl border border-border disabled:opacity-30 transition-all shadow-sm"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="flex items-center gap-2">
              {[...Array(Math.min(5, totalPages))].map((_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`w-10 h-10 rounded-xl text-xs font-bold uppercase transition-all shadow-sm border ${
                      page === pageNum
                        ? 'bg-[hsl(var(--gov-blue))] border-[hsl(var(--gov-blue))] text-white shadow-[hsl(var(--gov-blue)/0.2)] shadow-lg'
                        : 'bg-card text-foreground border-border hover:bg-muted'
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
              className="p-2.5 text-foreground hover:text-[hsl(var(--gov-blue))] bg-background hover:bg-muted rounded-xl border border-border disabled:opacity-30 transition-all shadow-sm"
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
                  {t('modal.title')}
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
                {/* Image */}
                {selectedActualite.medias?.[0]?.urlPublique && (
                  <img
                    src={selectedActualite.medias[0].urlPublique}
                    alt={selectedActualite.titre}
                    className="w-full h-56 object-cover rounded-3xl shadow-lg border border-border"
                  />
                )}

                {/* Title & Status */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    {(() => {
                      const style = STATUT_STYLES[selectedActualite.statut] || STATUT_STYLES.BROUILLON;
                      const Icon = style.icon;
                      return (
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border shadow-sm ${style.bg} ${style.text} border-current/20`}>
                          <Icon className="w-3 h-3" />
                          {t(`statuses.${selectedActualite.statut}`)}
                        </span>
                      );
                    })()}
                    {selectedActualite.isMisEnAvant && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-gov-gold/10/10 text-gov-gold border border-gov-gold/30/20 shadow-sm">
                        <Star className="w-3 h-3 fill-current" />
                        {t('highlight')}
                      </span>
                    )}
                  </div>
                  <h3 className="text-2xl font-extrabold text-foreground leading-tight">
                    {selectedActualite.titre}
                  </h3>
                </div>

                {/* Resume */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
                    {t('modal.resume')}
                  </label>
                  <div className="p-5 bg-muted/30 rounded-2xl border border-border/50 text-foreground font-medium leading-relaxed">
                    {selectedActualite.resume || t('modal.no_resume')}
                  </div>
                </div>

                {/* Meta */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-muted/50 rounded-2xl border border-border/50">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">{t('modal.sector')}</p>
                    <p className="font-bold text-foreground">{getSecteurLabel(selectedActualite.secteur)}</p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-2xl border border-border/50">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">{t('modal.views')}</p>
                    <p className="font-bold text-foreground flex items-center gap-2">
                      <TrendingUp size={14} className="text-[hsl(var(--gov-blue))]" />
                      {selectedActualite.nombreVues}
                    </p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-2xl border border-border/50">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">{t('modal.establishment')}</p>
                    <p className="font-bold text-foreground truncate">
                      {locale === 'ar' ? (selectedActualite.etablissement?.nomArabe || selectedActualite.etablissement?.nom) : selectedActualite.etablissement?.nom}
                    </p>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-2xl border border-border/50">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">{t('modal.commune')}</p>
                    <p className="font-bold text-foreground truncate">
                      {locale === 'ar' ? (selectedActualite.etablissement?.commune?.nomArabe || selectedActualite.etablissement?.commune?.nom) : selectedActualite.etablissement?.commune?.nom}
                    </p>
                  </div>
                </div>

                {/* Author */}
                {selectedActualite.createdByUser && (
                  <div className="flex items-center gap-4 p-5 bg-gradient-to-br from-[hsl(var(--gov-blue))/0.05] to-transparent rounded-3xl border border-[hsl(var(--gov-blue))/0.1]">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[hsl(var(--gov-blue))] to-[hsl(var(--gov-blue-dark))] flex items-center justify-center text-white shadow-lg">
                      <User className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">{t('modal.author') || 'Auteur'}</p>
                      <p className="font-extrabold text-foreground text-lg">
                        {selectedActualite.createdByUser.prenom} {selectedActualite.createdByUser.nom}
                      </p>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">
                        {t('modal.created_on', { date: formatDate(selectedActualite.createdAt) })}
                      </p>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="space-y-6">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-4">
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
                            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-50 border shadow-sm ${
                              isActive
                                ? `${style.bg} ${style.text} border-current/30 scale-[1.02] ring-2 ring-offset-2 ring-offset-card ring-current/20`
                                : 'bg-card text-muted-foreground border-border hover:bg-muted hover:text-foreground'
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
                  <div className="grid grid-cols-1 gap-3">
                    {/* View Online */}
                    <Link
                      href={`/actualites/${selectedActualite.id}`}
                      target="_blank"
                      className="flex items-center justify-center gap-2 px-4 py-4 bg-[hsl(var(--gov-blue))/0.05] text-[hsl(var(--gov-blue))] rounded-2xl font-bold text-sm hover:bg-[hsl(var(--gov-blue))] hover:text-white transition-all border border-[hsl(var(--gov-blue))/0.2] shadow-sm"
                    >
                      <Globe className="w-4 h-4" />
                      {t('modal.view_online')}
                    </Link>

                    {/* Toggle Featured */}
                    <button
                      onClick={() => handleToggleMisEnAvant(selectedActualite.id, selectedActualite.isMisEnAvant)}
                      disabled={!!actionLoading}
                      className={`flex items-center justify-center gap-2 px-4 py-4 rounded-2xl font-bold text-sm transition-all border shadow-sm ${
                        selectedActualite.isMisEnAvant
                          ? 'bg-gov-gold/10/10 text-gov-gold border-gov-gold/30/20 hover:bg-gov-gold/10 hover:text-white'
                          : 'bg-card text-muted-foreground border-border hover:bg-muted hover:text-foreground'
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
                      className="flex items-center justify-center gap-2 px-4 py-4 bg-[hsl(var(--gov-red))/0.05] text-[hsl(var(--gov-red))] rounded-2xl font-bold text-sm hover:bg-[hsl(var(--gov-red))] hover:text-white transition-all border border-[hsl(var(--gov-red))/0.2] shadow-sm"
                    >
                      {actionLoading === `delete-${selectedActualite.id}` ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                      {t('modal.delete')}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
}
