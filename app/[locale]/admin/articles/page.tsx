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
import { Link } from '@/i18n/navigation';
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
  BROUILLON: { bg: 'bg-muted', text: 'text-muted-foreground', icon: Edit },
  EN_ATTENTE: { bg: 'bg-amber-500/10', text: 'text-amber-600', icon: Clock },
  PUBLIE: { bg: 'bg-[hsl(var(--gov-green))/0.1]', text: 'text-[hsl(var(--gov-green))]', icon: Globe },
  REJETE: { bg: 'bg-[hsl(var(--gov-red))/0.1]', text: 'text-[hsl(var(--gov-red))]', icon: XCircle },
  ARCHIVE: { bg: 'bg-slate-500/10', text: 'text-slate-600', icon: FileText },
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
        setArticles(Array.isArray(data.data) ? data.data : []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotal(data.pagination?.total || 0);
        
        // Calculate stats
        const all = Array.isArray(data.data) ? data.data : [];
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
    <div className="space-y-8 bg-background min-h-screen p-4 sm:p-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-[hsl(var(--gov-blue))] to-[hsl(var(--gov-blue-dark))] rounded-2xl flex items-center justify-center text-white shadow-lg shadow-[hsl(var(--gov-blue)/0.3)]">
              <BookOpen className="w-6 h-6" />
            </div>
            {t('title')}
          </h1>
          <p className="text-muted-foreground mt-2 font-medium">
            {t('subtitle', { count: total })}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={fetchArticles}
            className="p-2.5 bg-card border border-border rounded-xl hover:bg-muted transition-colors shadow-sm text-muted-foreground hover:text-foreground"
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
            href="/admin/articles/nouveau"
            className="gov-btn-primary"
          >
            <Plus size={18} />
            {t('create')}
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
        <motion.div
          whileHover={{ y: -5 }}
          className="bg-gradient-to-br from-[hsl(var(--gov-blue))] to-[hsl(var(--gov-blue-dark))] rounded-3xl p-6 text-white shadow-xl shadow-[hsl(var(--gov-blue)/0.2)]"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md">
              <BookOpen className="w-6 h-6" />
            </div>
            <span className="text-3xl font-extrabold">{stats.total}</span>
          </div>
          <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">{t('stats.total')}</p>
        </motion.div>

        <motion.div
          whileHover={{ y: -5 }}
          className="gov-stat-card bg-card"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-[hsl(var(--gov-green))/0.1] text-[hsl(var(--gov-green))] rounded-xl flex items-center justify-center">
              <Globe className="w-6 h-6" />
            </div>
            <span className="text-3xl font-extrabold text-foreground">{stats.publies}</span>
          </div>
          <p className="gov-stat-label">{t('stats.published')}</p>
        </motion.div>

        <motion.div
          whileHover={{ y: -5 }}
          className="gov-stat-card bg-card"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-amber-500/10 text-amber-600 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
            <span className="text-3xl font-extrabold text-foreground">{stats.enAttente}</span>
          </div>
          <p className="gov-stat-label">{t('stats.pending')}</p>
        </motion.div>

        <motion.div
          whileHover={{ y: -5 }}
          className="gov-stat-card bg-card"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-[hsl(var(--gov-blue))/0.1] text-[hsl(var(--gov-blue))] rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6" />
            </div>
            <span className="text-3xl font-extrabold text-foreground">{stats.totalVues}</span>
          </div>
          <p className="gov-stat-label">{t('stats.views')}</p>
        </motion.div>
      </div>

      {/* Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="gov-card p-5 overflow-hidden border-border shadow-sm"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative lg:col-span-2 group">
                <Search className={`absolute ${locale === 'ar' ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-[hsl(var(--gov-blue))] transition-colors`} />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t('labels.search_placeholder')}
                  className={`gov-input py-3 ${locale === 'ar' ? 'pr-12 pl-4' : 'pl-12 pr-4'}`}
                />
              </div>

              {/* Statut */}
              <select
                value={statutFilter}
                onChange={(e) => setStatutFilter(e.target.value)}
                className="gov-input py-3"
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
                className="flex items-center justify-center gap-2 px-4 py-3 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-all font-bold text-sm border border-transparent hover:border-border"
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
            <div key={i} className="bg-card rounded-3xl p-6 animate-pulse border border-border">
              <div className="h-5 w-3/4 bg-muted rounded mb-3" />
              <div className="h-4 w-full bg-muted rounded mb-4" />
              <div className="flex gap-2">
                <div className="h-6 w-16 bg-muted rounded-full" />
                <div className="h-6 w-20 bg-muted rounded-full" />
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
                className="group bg-card rounded-3xl shadow-sm border border-border overflow-hidden hover:shadow-xl hover:shadow-[hsl(var(--gov-blue)/0.1)] hover:-translate-y-1 transition-all duration-300"
              >
                <div className="p-8">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border shadow-sm ${statutConfig.bg} ${statutConfig.text} border-current/20`}>
                        <StatutIcon className="w-3 h-3" />
                        {t('status.' + (statusKeyMap[article.statut] || 'draft'))}
                      </span>
                      {article.isMisEnAvant && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-amber-500/10 text-amber-600 border border-amber-500/20 shadow-sm">
                          <Star className="w-3 h-3 fill-current" />
                          {t('labels.featured')}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                      <button
                        onClick={() => { setSelectedArticle(article); setShowDetailModal(true); }}
                        className="p-2 text-muted-foreground hover:text-[hsl(var(--gov-blue))] hover:bg-[hsl(var(--gov-blue))/0.05] rounded-xl border border-transparent hover:border-[hsl(var(--gov-blue))/0.1] transition-all"
                      >
                        <Eye size={18} />
                      </button>
                      <Link
                        href={`/admin/articles/${article.id}/modifier`}
                        className="p-2 text-muted-foreground hover:text-[hsl(var(--gov-blue))] hover:bg-[hsl(var(--gov-blue))/0.05] rounded-xl border border-transparent hover:border-[hsl(var(--gov-blue))/0.1] transition-all"
                      >
                        <Edit size={18} />
                      </Link>
                    </div>
                  </div>

                  {/* Title & Resume */}
                  <h3 className="text-xl font-extrabold text-foreground line-clamp-2 mb-3 leading-tight group-hover:text-[hsl(var(--gov-blue))] transition-colors">
                    {article.titre}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-6 font-medium leading-relaxed">
                    {article.resume || t('labels.no_resume')}
                  </p>

                  {/* Tags */}
                  {article.tags && article.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-6">
                      {article.tags.slice(0, 3).map((tag, i) => (
                        <span key={i} className="px-3 py-1 bg-muted/50 text-muted-foreground text-[10px] font-bold uppercase tracking-widest rounded-lg border border-border/50">
                          #{tag}
                        </span>
                      ))}
                      {article.tags.length > 3 && (
                        <span className="px-2 py-1 text-muted-foreground/50 text-[10px] font-bold">+{article.tags.length - 3}</span>
                      )}
                    </div>
                  )}

                  {/* Meta */}
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-muted-foreground pt-6 border-t border-border/50">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-muted rounded-lg flex items-center justify-center">
                        <Calendar size={12} className="text-[hsl(var(--gov-blue))]" />
                      </div>
                      {formatDate(article.createdAt)}
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-muted rounded-lg flex items-center justify-center">
                          <Eye size={12} className="text-[hsl(var(--gov-gold))]" />
                        </div>
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
        <div className="flex items-center justify-between px-8 py-6 bg-card rounded-3xl border border-border shadow-sm">
          <p className="text-sm text-muted-foreground font-bold uppercase tracking-widest">
            Page {page} sur {totalPages}
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2.5 text-foreground hover:text-[hsl(var(--gov-blue))] bg-background hover:bg-muted rounded-xl border border-border disabled:opacity-30 transition-all shadow-sm"
            >
              {locale === 'ar' ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
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
                {/* Title */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    {(() => {
                      const config = STATUT_CONFIG[selectedArticle.statut] || STATUT_CONFIG.BROUILLON;
                      const Icon = config.icon;
                      return (
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border shadow-sm ${config.bg} ${config.text} border-current/20`}>
                          <Icon className="w-3 h-3" />
                          {t('status.' + (statusKeyMap[selectedArticle.statut] || 'draft'))}
                        </span>
                      );
                    })()}
                    {selectedArticle.isMisEnAvant && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-amber-500/10 text-amber-600 border border-amber-500/20 shadow-sm">
                        <Star className="w-3 h-3 fill-current" />
                        {t('labels.featured')}
                      </span>
                    )}
                  </div>
                  <h3 className="text-2xl font-extrabold text-foreground leading-tight">
                    {selectedArticle.titre}
                  </h3>
                </div>

                {/* Resume */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
                    {t('modal.resume')}
                  </label>
                  <div className="p-5 bg-muted/30 rounded-2xl border border-border/50 text-foreground font-medium leading-relaxed">
                    {selectedArticle.resume || t('labels.no_resume')}
                  </div>
                </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-5 bg-muted/50 rounded-2xl border border-border/50 text-center group hover:bg-[hsl(var(--gov-blue))/0.05] transition-colors">
                      <p className="text-3xl font-extrabold text-foreground group-hover:text-[hsl(var(--gov-blue))] transition-colors">{selectedArticle.nombreVues}</p>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">{t('modal.views')}</p>
                    </div>
                    <div className="p-5 bg-muted/50 rounded-2xl border border-border/50 text-center group hover:bg-[hsl(var(--gov-red))/0.05] transition-colors">
                      <p className="text-3xl font-extrabold text-foreground group-hover:text-[hsl(var(--gov-red))] transition-colors">{selectedArticle.nombreLikes}</p>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">{t('modal.likes')}</p>
                    </div>
                  </div>

                {/* Author */}
                {selectedArticle.auteur && (
                  <div className="flex items-center gap-4 p-5 bg-gradient-to-br from-[hsl(var(--gov-blue))/0.05] to-transparent rounded-3xl border border-[hsl(var(--gov-blue))/0.1]">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[hsl(var(--gov-blue))] to-[hsl(var(--gov-blue-dark))] flex items-center justify-center text-white shadow-lg">
                      <User className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">{t('modal.author')}</p>
                      <p className="font-extrabold text-foreground text-lg">
                        {selectedArticle.auteur.prenom} {selectedArticle.auteur.nom}
                      </p>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1 opacity-60">
                        {t('modal.contributor') || 'Contributeur'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Change Status */}
                <div className="space-y-6">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-4">
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
                            {t('status.' + (statusKeyMap[key] || 'draft'))}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 pt-4">
                    {/* Toggle Featured */}
                    <button
                      onClick={() => handleToggleMisEnAvant(selectedArticle.id, selectedArticle.isMisEnAvant)}
                      disabled={!!actionLoading}
                      className={`flex items-center justify-center gap-2 px-4 py-4 rounded-2xl font-bold text-sm transition-all border shadow-sm ${
                        selectedArticle.isMisEnAvant
                          ? 'bg-amber-500/10 text-amber-600 border-amber-500/20 hover:bg-amber-500 hover:text-white'
                          : 'bg-card text-muted-foreground border-border hover:bg-muted hover:text-foreground'
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
                      className="flex items-center justify-center gap-2 px-4 py-4 bg-[hsl(var(--gov-red))/0.05] text-[hsl(var(--gov-red))] rounded-2xl font-bold text-sm hover:bg-[hsl(var(--gov-red))] hover:text-white transition-all border border-[hsl(var(--gov-red))/0.2] shadow-sm"
                    >
                      {actionLoading === `delete-${selectedArticle.id}` ? (
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
  );
}
