'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { Link } from '@/i18n/navigation';
import { useTranslations, useLocale } from 'next-intl';
import {
  Lightbulb,
  Plus,
  Search,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Loader2,
  ChevronLeft,
  ChevronRight,
  User,
  Sparkles,
  Trash2,
  Building2,
  Landmark,
  Leaf,
  GraduationCap,
  HeartPulse,
  Bus,
  Palette,
  Laptop,
  ArrowRight
} from 'lucide-react';
import SuggestionModal from '@/components/suggestions/SuggestionModal';
import { toast } from 'sonner';

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
  };
}

const STATUT_CONFIG: Record<string, { icon: React.ElementType; colorClass: string; bgClass: string; dotClass: string }> = {
  SOUMISE:     { icon: Clock,        colorClass: 'text-amber-700',  bgClass: 'bg-amber-50 border-amber-100',   dotClass: 'bg-amber-400' },
  EN_EXAMEN:   { icon: Eye,          colorClass: 'text-blue-700',   bgClass: 'bg-blue-50 border-blue-100',     dotClass: 'bg-blue-500' },
  APPROUVEE:   { icon: CheckCircle,  colorClass: 'text-green-700',  bgClass: 'bg-green-50 border-green-100',   dotClass: 'bg-green-500' },
  REJETEE:     { icon: XCircle,      colorClass: 'text-red-700',    bgClass: 'bg-red-50 border-red-100',       dotClass: 'bg-red-500' },
  IMPLEMENTEE: { icon: Sparkles,     colorClass: 'text-purple-700', bgClass: 'bg-purple-50 border-purple-100', dotClass: 'bg-purple-500' },
};

const CATEGORIES: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  infrastructure: { label: 'Infrastructure',    icon: Building2,    color: 'text-orange-600' },
  services:       { label: 'Services publics',  icon: Landmark,     color: 'text-blue-600' },
  environnement:  { label: 'Environnement',     icon: Leaf,         color: 'text-green-600' },
  education:      { label: 'Éducation',         icon: GraduationCap,color: 'text-indigo-600' },
  sante:          { label: 'Santé',             icon: HeartPulse,   color: 'text-pink-600' },
  transport:      { label: 'Transport',          icon: Bus,          color: 'text-sky-600' },
  culture:        { label: 'Culture & Loisirs', icon: Palette,      color: 'text-violet-600' },
  numerique:      { label: 'Numérique',          icon: Laptop,       color: 'text-cyan-600' },
  autre:          { label: 'Autre',              icon: Lightbulb,    color: 'text-gray-600' },
};

export default function SuggestionsPage() {
  const t = useTranslations('suggestions_page');
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(searchParams.get('new') === 'true');
  
  const [statutFilter, setStatutFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<Record<string, number>>({});

  const fetchSuggestions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', '12');
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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSuggestions(); }, [page, statutFilter]);

  useEffect(() => {
    const timer = setTimeout(() => { setPage(1); fetchSuggestions(); }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-white">

      {/* ── Hero Banner ── */}
      <div className="relative bg-gradient-to-b from-[hsl(var(--gov-blue-dark))] via-[hsl(var(--gov-blue))] to-[hsl(var(--gov-blue-dark))] overflow-hidden shadow-2xl pb-28">
        <div className="absolute inset-0 gov-pattern opacity-10" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent" />
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[hsl(var(--gov-gold)/0.1)] rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8 z-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur-md border border-[hsl(var(--gov-gold)/0.3)] rounded-full text-[hsl(var(--gov-gold))] text-xs font-bold uppercase tracking-widest mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--gov-gold))]" />
                {t('badge') || 'Province de Médiouna'}
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight font-outfit drop-shadow-sm flex items-center gap-4">
                <div className="w-14 h-14 bg-[hsl(var(--gov-gold)/0.15)] backdrop-blur-sm border border-[hsl(var(--gov-gold)/0.3)] rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Lightbulb className="w-7 h-7 text-[hsl(var(--gov-gold))]" />
                </div>
                {t('title')}
              </h1>
              <p className="text-blue-100/90 max-w-xl text-lg leading-relaxed">
                {t('subtitle')}
              </p>
            </motion.div>

            {session?.user && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setModalOpen(true)}
                className="flex items-center gap-3 px-8 py-4 bg-[hsl(var(--gov-gold))] text-[hsl(var(--gov-blue-dark))] rounded-2xl font-bold shadow-xl shadow-black/20 hover:bg-[hsl(var(--gov-gold-light,45,93%,60%))] transition-all flex-shrink-0"
              >
                <Plus className="w-5 h-5" />
                {t('propose_btn')}
              </motion.button>
            )}
          </div>

          {/* Stat chips */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mt-10"
          >
            {Object.entries(STATUT_CONFIG).map(([key, config]) => {
              const count = stats[key] || 0;
              const Icon = config.icon;
              const isActive = statutFilter === key;
              return (
                <button
                  key={key}
                  onClick={() => setStatutFilter(isActive ? '' : key)}
                  className={`relative p-4 rounded-2xl transition-all duration-300 text-left ${
                    isActive
                      ? 'bg-white shadow-xl scale-[1.02]'
                      : 'bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/10'
                  }`}
                >
                  {isActive && (
                    <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[hsl(var(--gov-gold))]" />
                  )}
                  <Icon className={`w-5 h-5 mb-2.5 ${isActive ? config.colorClass : 'text-white/70'}`} />
                  <p className={`text-2xl font-black ${isActive ? 'text-gray-900' : 'text-white'}`}>{count}</p>
                  <p className={`text-[10px] font-bold uppercase tracking-widest mt-0.5 ${isActive ? 'text-gray-400' : 'text-white/60'}`}>
                    {t(`status.${key === 'SOUMISE' ? 'submitted' : key === 'EN_EXAMEN' ? 'review' : key === 'APPROUVEE' ? 'approved' : key === 'REJETEE' ? 'rejected' : 'implemented'}`)}
                  </p>
                </button>
              );
            })}
          </motion.div>
        </div>

        {/* Bottom curve */}
        <div className="absolute bottom-0 w-full">
          <svg viewBox="0 0 1440 80" className="relative w-full h-[50px] fill-[hsl(var(--background))]" preserveAspectRatio="none">
            <path d="M0,0 C480,80 960,80 1440,0 L1440,80 L0,80 Z" />
          </svg>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-4 pb-16">

        {/* Search & Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-8 flex flex-col sm:flex-row gap-3"
        >
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-[hsl(var(--gov-blue))] transition-colors" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('search_placeholder')}
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[hsl(var(--gov-blue)/0.15)] focus:border-[hsl(var(--gov-blue))] transition-all bg-gray-50/50 font-medium text-sm"
            />
          </div>

          {statutFilter && (
            <button
              onClick={() => setStatutFilter('')}
              className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 rounded-xl text-gray-600 hover:bg-gray-200 transition-colors text-sm font-bold"
            >
              <XCircle className="w-4 h-4" />
              {t('reset_filter')}
            </button>
          )}
        </motion.div>

        {/* Results count */}
        <p className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-6">
          {t('results_found', { count: total })}
          {statutFilter && (
            <span className="ml-2 text-[hsl(var(--gov-blue))]">
              • {t(`status.${statutFilter === 'SOUMISE' ? 'submitted' : statutFilter === 'EN_EXAMEN' ? 'review' : statutFilter === 'APPROUVEE' ? 'approved' : statutFilter === 'REJETEE' ? 'rejected' : 'implemented'}`)}
            </span>
          )}
        </p>

        {/* Suggestions Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-10 h-10 text-[hsl(var(--gov-blue))] animate-spin" />
              <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Chargement...</p>
            </div>
          </div>
        ) : suggestions.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-24"
          >
            <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-50 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner">
              <Lightbulb className="w-12 h-12 text-gray-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">{t('no_suggestions')}</h3>
            <p className="text-gray-500 mb-8">{search ? t('no_results') : t('be_first')}</p>
            {session?.user && !search && (
              <button
                onClick={() => setModalOpen(true)}
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[hsl(var(--gov-blue))] to-[hsl(var(--gov-blue-dark))] text-white rounded-2xl font-bold shadow-lg shadow-blue-900/20 hover:shadow-xl transition-all"
              >
                <Plus className="w-5 h-5" />
                {t('propose_btn')}
              </button>
            )}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            <AnimatePresence mode="popLayout">
              {suggestions.map((suggestion, index) => {
                const statutInfo = STATUT_CONFIG[suggestion.statut] || STATUT_CONFIG.SOUMISE;
                const StatutIcon = statutInfo.icon;
                const catInfo = suggestion.categorie ? CATEGORIES[suggestion.categorie] : null;
                const CatIcon = catInfo?.icon;

                return (
                  <motion.div
                    key={suggestion.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.04 }}
                    className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg hover:border-[hsl(var(--gov-blue)/0.15)] transition-all duration-300 flex flex-col"
                  >
                    {/* Card Header */}
                    <div className="p-5 flex-1">
                      {/* Top row: category + status + date */}
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          {catInfo && CatIcon && (
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 border border-gray-100 rounded-xl text-[10px] font-black uppercase tracking-widest ${catInfo.color}`}>
                              <CatIcon className="w-3 h-3" />
                              {catInfo.label}
                            </span>
                          )}
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 border rounded-xl text-[10px] font-black uppercase tracking-widest ${statutInfo.bgClass} ${statutInfo.colorClass}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${statutInfo.dotClass}`} />
                            <StatutIcon className="w-3 h-3" />
                            {t(`status.${suggestion.statut === 'SOUMISE' ? 'submitted' : suggestion.statut === 'EN_EXAMEN' ? 'review' : suggestion.statut === 'APPROUVEE' ? 'approved' : suggestion.statut === 'REJETEE' ? 'rejected' : 'implemented'}`)}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-gray-400 whitespace-nowrap flex-shrink-0">
                          {formatDate(suggestion.createdAt)}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="font-bold text-gray-900 line-clamp-2 mb-2.5 group-hover:text-[hsl(var(--gov-blue))] transition-colors leading-snug">
                        {suggestion.titre}
                      </h3>

                      {/* Description */}
                      <p className="text-sm text-gray-500 line-clamp-3 leading-relaxed">
                        {suggestion.description}
                      </p>

                      {/* Admin response preview */}
                      {suggestion.reponseAdmin && (
                        <div className="mt-4 p-3 bg-[hsl(var(--gov-blue)/0.04)] border border-[hsl(var(--gov-blue)/0.1)] rounded-xl">
                          <p className="text-[10px] font-black uppercase tracking-widest text-[hsl(var(--gov-blue))] mb-1 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            {t('admin_response')}
                          </p>
                          <p className="text-xs text-gray-600 italic line-clamp-2 leading-relaxed">
                            "{suggestion.reponseAdmin}"
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Card Footer */}
                    <div className="px-5 py-3 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[hsl(var(--gov-blue)/0.1)] to-[hsl(var(--gov-blue)/0.2)] flex items-center justify-center border border-[hsl(var(--gov-blue)/0.15)]">
                          <span className="text-[9px] font-black text-[hsl(var(--gov-blue))]">
                            {suggestion.user.prenom.charAt(0)}{suggestion.user.nom.charAt(0)}
                          </span>
                        </div>
                        <span className="text-xs font-bold text-gray-500">
                          {suggestion.user.prenom} {suggestion.user.nom.charAt(0)}.
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {session?.user?.id && Number(session.user.id) === suggestion.user.id && (
                          <button
                            onClick={async () => {
                              if (!confirm(t('delete_confirm'))) return;
                              try {
                                const res = await fetch(`/api/suggestions/${suggestion.id}`, { method: 'DELETE' });
                                if (res.ok) {
                                  toast.success(t('delete_success'));
                                  fetchSuggestions();
                                } else {
                                  const data = await res.json();
                                  toast.error(data.error || 'Erreur lors de la suppression');
                                }
                              } catch {
                                toast.error('Erreur serveur');
                              }
                            }}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-12">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) pageNum = i + 1;
              else if (page <= 3) pageNum = i + 1;
              else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
              else pageNum = page - 2 + i;
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`w-10 h-10 rounded-xl font-bold text-sm transition-all ${
                    page === pageNum
                      ? 'bg-gradient-to-br from-[hsl(var(--gov-blue))] to-[hsl(var(--gov-blue-dark))] text-white shadow-lg shadow-blue-900/20'
                      : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        )}
      </div>

      {/* Suggestion Modal */}
      <SuggestionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={fetchSuggestions}
      />

      {/* CTA for non-authenticated users */}
      {!session?.user && (
        <div className="relative bg-gradient-to-r from-[hsl(var(--gov-blue-dark))] to-[hsl(var(--gov-blue))] py-16 overflow-hidden">
          <div className="absolute inset-0 gov-pattern opacity-10" />
          <div className="relative max-w-3xl mx-auto px-4 text-center z-10">
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-white/20">
              <Lightbulb className="w-8 h-8 text-[hsl(var(--gov-gold))]" />
            </div>
            <h2 className="text-3xl font-extrabold text-white mb-4 font-outfit">{t('cta_title')}</h2>
            <p className="text-blue-100/80 mb-8 text-lg max-w-xl mx-auto leading-relaxed">{t('cta_text')}</p>
            <Link
              href="/login"
              className="inline-flex items-center gap-3 px-8 py-4 bg-[hsl(var(--gov-gold))] text-[hsl(var(--gov-blue-dark))] rounded-2xl font-bold shadow-xl hover:shadow-2xl transition-all hover:scale-[1.02]"
            >
              {t('login_btn')}
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
