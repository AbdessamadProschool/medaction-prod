'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lightbulb,
  Search,
  Filter,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Loader2,
  ChevronLeft,
  ChevronRight,
  User,
  Sparkles,
  MessageSquare,
  Calendar,
  ArrowUpDown,
  MoreVertical,
  Mail,
} from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations, useLocale } from 'next-intl';
import { GovButton } from '@/components/ui/GovButton';
import { KpiCard, KpiGrid } from '@/components/ui/KpiCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { GovTable, GovTh, GovTd, GovTr } from '@/components/ui/GovTable';
import { cn } from '@/lib/utils';
import EmptyState from '@/components/ui/EmptyState';

interface Suggestion {
  id: number;
  titre: string;
  description: string;
  categorie: string | null;
  statut: string;
  reponseAdmin: string | null;
  dateTraitement: string | null;
  createdAt: string;
  user: {
    id: number;
    nom: string;
    prenom: string;
    email?: string;
  };
}

const STATUT_CONFIG: Record<string, { bg: string; text: string; icon: React.ElementType }> = {
  SOUMISE: { bg: 'bg-gray-100', text: 'text-gray-700', icon: Clock },
  EN_EXAMEN: { bg: 'bg-blue-100', text: 'text-blue-700', icon: Eye },
  APPROUVEE: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle },
  REJETEE: { bg: 'bg-red-100', text: 'text-red-700', icon: XCircle },
  IMPLEMENTEE: { bg: 'bg-purple-100', text: 'text-purple-700', icon: Sparkles },
};

const CATEGORIES: Record<string, { emoji: string }> = {
  infrastructure: { emoji: '🏗️' },
  services: { emoji: '🏛️' },
  environnement: { emoji: '🌿' },
  education: { emoji: '📚' },
  sante: { emoji: '🏥' },
  transport: { emoji: '🚌' },
  culture: { emoji: '🎭' },
  numerique: { emoji: '💻' },
  autre: { emoji: '💡' },
};

const suggestionColorMap: Record<string, any> = {
  SOUMISE: 'gold',
  EN_EXAMEN: 'blue',
  APPROUVEE: 'green',
  REJETEE: 'red',
  IMPLEMENTEE: 'purple'
};

export default function AdminSuggestionsPage() {
  const t = useTranslations('admin.suggestions_page');
  const tCat = useTranslations('suggestions.categories');
  const locale = useLocale();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSuggestion, setSelectedSuggestion] = useState<Suggestion | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  
  // Filters
  const [statutFilter, setStatutFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  
  // Pagination & Stats
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<Record<string, number>>({});

  // Action states
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [reponseAdmin, setReponseAdmin] = useState('');

  const fetchSuggestions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', '15');
      if (statutFilter) params.set('statut', statutFilter);
      if (search) params.set('search', search);

      const res = await fetch(`/api/suggestions?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setSuggestions(data.data);
        setTotalPages(data.pagination.totalPages);
        setTotal(data.pagination.total);
        setStats(data.stats.parStatut || {});
      }
    } catch (error) {
      console.error('Erreur chargement suggestions:', error);
      toast.error('Erreur lors du chargement des suggestions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuggestions();
  }, [page, statutFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchSuggestions();
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const handleChangeStatut = async (suggestionId: number, newStatut: string) => {
    setActionLoading(`${suggestionId}-${newStatut}`);
    const promise = new Promise(async (resolve, reject) => {
      try {
        const res = await fetch(`/api/suggestions/${suggestionId}/statut`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            statut: newStatut,
            reponseAdmin: reponseAdmin || undefined,
          }),
        });

        if (res.ok) {
          fetchSuggestions();
          setShowDetailModal(false);
          setReponseAdmin('');
          resolve(true);
        } else {
          const data = await res.json();
          reject(new Error(data.error || 'Erreur lors du changement de statut'));
        }
      } catch (error) {
        reject(new Error('Erreur de connexion'));
      } finally {
        setActionLoading(null);
      }
    });

    toast.promise(promise, {
      loading: 'Mise à jour en cours...',
      success: `Statut mis à jour: ${t(`statuses.${newStatut}`)}`,
      error: (err) => err.message,
    });
  };

  const openDetail = (suggestion: Suggestion) => {
    setSelectedSuggestion(suggestion);
    setReponseAdmin(suggestion.reponseAdmin || '');
    setShowDetailModal(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(locale === 'ar' ? 'ar-MA' : 'fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const totalSuggestions = Object.values(stats).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center text-white">
              <Lightbulb className="w-5 h-5" />
            </div>
            {t('page_title')}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {t('page_subtitle')}
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <KpiGrid cols={5}>
        {Object.entries(STATUT_CONFIG).map(([key, config], i) => (
          <KpiCard
            key={key}
            index={i}
            label={t(`statuses.${key}`)}
            value={stats[key] || 0}
            icon={config.icon}
            variant={key === 'APPROUVEE' ? 'green' : key === 'REJETEE' ? 'red' : key === 'EN_EXAMEN' ? 'blue' : key === 'IMPLEMENTEE' ? 'muted' : 'gold'}
            onClick={() => setStatutFilter(statutFilter === key ? '' : key)}
            className={statutFilter === key ? 'ring-2 ring-[hsl(var(--gov-blue))]' : ''}
          />
        ))}
      </KpiGrid>

      {/* Filters */}
      <div className="bg-card rounded-2xl shadow-sm border border-border p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-[hsl(var(--gov-blue))] transition-colors" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('search_placeholder')}
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-border bg-muted/30 focus:ring-2 focus:ring-[hsl(var(--gov-blue))/0.2] focus:border-[hsl(var(--gov-blue))] transition-all"
            />
          </div>
          
          {statutFilter && (
            <GovButton
              onClick={() => setStatutFilter('')}
              variant="outline"
              leftIcon={<XCircle className="w-4 h-4" />}
            >
              {t('reset_filters')}
            </GovButton>
          )}
        </div>
      </div>

      {/* Table */}
      <GovTable>
        <thead>
          <tr>
            <GovTh>{t('table.suggestion')}</GovTh>
            <GovTh>{t('table.category')}</GovTh>
            <GovTh>{t('table.citizen')}</GovTh>
            <GovTh>{t('table.status')}</GovTh>
            <GovTh>{t('table.date')}</GovTh>
            <GovTh className="text-right">{t('table.actions')}</GovTh>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {suggestions.length > 0 ? (
            suggestions.map((suggestion) => {
              const statutInfo = STATUT_CONFIG[suggestion.statut] || STATUT_CONFIG.SOUMISE;
              const StatutIcon = statutInfo.icon;
              const catInfo = suggestion.categorie ? CATEGORIES[suggestion.categorie] : null;

              // Map status to StatusBadge colors
              const statusColorMap: Record<string, any> = {
                SOUMISE: 'gold',
                EN_EXAMEN: 'blue',
                APPROUVEE: 'green',
                REJETEE: 'red',
                IMPLEMENTEE: 'purple'
              };

              return (
                <GovTr
                  key={suggestion.id}
                  onClick={() => openDetail(suggestion)}
                >
                  <GovTd>
                    <p className="font-bold text-foreground line-clamp-1 group-hover:text-[hsl(var(--gov-blue))] transition-colors">
                      {suggestion.titre}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                      {suggestion.description.substring(0, 60)}...
                    </p>
                  </GovTd>
                  <GovTd>
                    {catInfo ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-muted rounded-lg text-xs font-bold border border-border">
                        <span>{catInfo.emoji}</span>
                        <span className="text-muted-foreground uppercase tracking-widest text-[9px]">{tCat(suggestion.categorie!)}</span>
                      </span>
                    ) : (
                      <span className="text-muted-foreground opacity-30 font-mono">-</span>
                    )}
                  </GovTd>
                  <GovTd>
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[hsl(var(--gov-blue)/0.1)] to-[hsl(var(--gov-blue)/0.2)] flex items-center justify-center border border-[hsl(var(--gov-blue)/0.2)]">
                        <span className="text-[10px] font-black text-[hsl(var(--gov-blue))]">
                          {suggestion.user.prenom.charAt(0)}{suggestion.user.nom.charAt(0)}
                        </span>
                      </div>
                      <span className="text-sm font-bold text-foreground/80">
                        {suggestion.user.prenom} {suggestion.user.nom}
                      </span>
                    </div>
                  </GovTd>
                  <GovTd>
                    <StatusBadge status={suggestion.statut} animate={suggestion.statut === 'SOUMISE'} />
                  </GovTd>
                  <GovTd>
                    <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                      {formatDate(suggestion.createdAt)}
                    </div>
                  </GovTd>
                  <GovTd className="text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-95 group-hover:scale-100">
                      <GovButton
                        onClick={(e) => {
                          e.stopPropagation();
                          openDetail(suggestion);
                        }}
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-[hsl(var(--gov-blue))]"
                      >
                        <Eye className="w-5 h-5" />
                      </GovButton>
                    </div>
                  </GovTd>
                </GovTr>
              );
            })
          ) : (
            <tr>
              <td colSpan={6}>
                <EmptyState
                  icon={<Lightbulb className="w-10 h-10" />}
                  title={t('empty.title') || "Aucune suggestion"}
                  description={search ? t('empty.no_results') : t('empty.description')}
                />
              </td>
            </tr>
          )}
        </tbody>
      </GovTable>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-5 bg-muted/20 border-t border-border flex items-center justify-between">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              {t('page_info', { page, total: totalPages, count: total})}
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

      {/* Detail Modal */}
      <AnimatePresence>
        {showDetailModal && selectedSuggestion && (
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
              className="fixed right-0 top-0 bottom-0 w-full max-w-xl bg-card shadow-2xl z-50 overflow-y-auto border-l border-border flex flex-col"
            >
              {/* Modal Header */}
              <div className="sticky top-0 bg-card/80 backdrop-blur-md border-b border-border px-8 py-6 flex items-center justify-between z-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                    <Lightbulb size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-foreground uppercase tracking-tight">
                      {t('detail_modal.title')} #{selectedSuggestion.id}
                    </h2>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
                      {selectedSuggestion.user.prenom} {selectedSuggestion.user.nom}
                    </p>
                  </div>
                </div>
                <GovButton
                  onClick={() => setShowDetailModal(false)}
                  variant="ghost"
                  size="icon"
                  className="rounded-full"
                >
                  <XCircle size={24} />
                </GovButton>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-6">
                {/* Statut actuel */}
                <div className="bg-muted/30 p-6 rounded-2xl border border-border flex items-center justify-between">
                  <div>
                    <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">
                      {t('detail_modal.current_status')}
                    </label>
                    <StatusBadge 
                      color={suggestionColorMap[selectedSuggestion.statut] || 'muted'} 
                      icon={STATUT_CONFIG[selectedSuggestion.statut]?.icon}
                      pulse={selectedSuggestion.statut === 'SOUMISE'}
                    >
                      {t(`statuses.${selectedSuggestion.statut}`)}
                    </StatusBadge>
                  </div>
                  <div className="text-right">
                    <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">
                      {t('table.date')}
                    </label>
                    <p className="text-xs font-bold text-foreground">
                      {formatDate(selectedSuggestion.createdAt)}
                    </p>
                  </div>
                </div>

                {/* Contenu */}
                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-3">
                      {t('detail_modal.suggestion_title')}
                    </label>
                    <h3 className="text-2xl font-black text-foreground leading-tight">
                      {selectedSuggestion.titre}
                    </h3>
                  </div>

                  {selectedSuggestion.categorie && CATEGORIES[selectedSuggestion.categorie] && (
                    <div>
                      <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-3">
                        {t('detail_modal.category')}
                      </label>
                      <span className="inline-flex items-center gap-2 px-4 py-2 bg-muted rounded-xl border border-border text-sm font-bold">
                        <span className="text-xl">{CATEGORIES[selectedSuggestion.categorie].emoji}</span>
                        {tCat(selectedSuggestion.categorie)}
                      </span>
                    </div>
                  )}

                  <div>
                    <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-3">
                      {t('detail_modal.description')}
                    </label>
                    <div className="p-6 bg-card border-2 border-dashed border-border rounded-2xl">
                      <p className="text-foreground/80 leading-relaxed whitespace-pre-wrap">
                        {selectedSuggestion.description}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Citoyen */}
                <div className="pt-8 border-t border-border">
                  <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4">
                    {t('detail_modal.submitted_by')}
                  </label>
                  <div className="flex items-center gap-4 p-5 bg-gradient-to-br from-card to-muted/20 rounded-2xl border border-border shadow-sm">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[hsl(var(--gov-blue))] to-[hsl(var(--gov-blue-dark))] flex items-center justify-center text-white text-xl font-black shadow-lg">
                      {selectedSuggestion.user.prenom.charAt(0)}{selectedSuggestion.user.nom.charAt(0)}
                    </div>
                    <div>
                      <p className="text-lg font-black text-foreground">
                        {selectedSuggestion.user.prenom} {selectedSuggestion.user.nom}
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                          <Mail size={12} className="text-[hsl(var(--gov-blue))]" />
                          {selectedSuggestion.user.email || 'Email non fourni'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Réponse Admin */}
                <div className="pt-8 border-t border-border">
                  <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4">
                    {t('detail_modal.admin_response')}
                  </label>
                  <textarea
                    value={reponseAdmin}
                    onChange={(e) => setReponseAdmin(e.target.value)}
                    rows={4}
                    placeholder={t('detail_modal.response_placeholder')}
                    className="w-full px-5 py-4 rounded-2xl border border-border bg-muted/20 focus:ring-4 focus:ring-[hsl(var(--gov-blue))/0.1] focus:border-[hsl(var(--gov-blue))] transition-all text-sm font-medium"
                  />
                </div>

                {/* Actions */}
                <div className="pt-8 border-t border-border pb-10">
                  <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4">
                    {t('detail_modal.change_status')}
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(STATUT_CONFIG).map(([key, config]) => {
                      const isActive = selectedSuggestion.statut === key;
                      const isLoading = actionLoading === `${selectedSuggestion.id}-${key}`;
                      const color = suggestionColorMap[key] || 'muted';

                      return (
                        <GovButton
                          key={key}
                          onClick={() => handleChangeStatut(selectedSuggestion.id, key)}
                          disabled={isActive || !!actionLoading}
                          loading={isLoading}
                          variant={isActive ? "primary" : "outline"}
                          leftIcon={!isLoading && <config.icon size={16} />}
                          className={`justify-start h-14 ${isActive ? "" : `hover:text-[hsl(var(--gov-${color}))] hover:bg-[hsl(var(--gov-${color}))/0.05] hover:border-[hsl(var(--gov-${color}))/0.2]`}`}
                        >
                          <span className="truncate">{t(`statuses.${key}`)}</span>
                        </GovButton>
                      );
                    })}
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
