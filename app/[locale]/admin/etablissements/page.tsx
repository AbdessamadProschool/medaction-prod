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
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';

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
  commune: { id: number; nom: string } | null;
  annexe: { id: number; nom: string } | null;
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-200 dark:shadow-emerald-900/30">
              <Building2 className="w-6 h-6" />
            </div>
            {t('page_title')}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {t('total_establishments', { count: total })}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={fetchEtablissements}
            className="p-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all ${
              showFilters
                ? 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400'
                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            <Filter size={18} />
            {t('filters')}
          </button>
          <Link
            href="/admin/etablissements/nouveau"
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-medium shadow-lg shadow-emerald-200 dark:shadow-emerald-900/30 hover:shadow-xl transition-all"
          >
            <Plus size={18} />
            {t('new_establishment')}
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-5 text-white"
        >
          <div className="flex items-center justify-between mb-2">
            <Building2 className="w-6 h-6 opacity-80" />
            <span className="text-2xl font-bold">{stats.total}</span>
          </div>
          <p className="text-sm opacity-80">{t('stats.total')}</p>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700"
        >
          <div className="flex items-center justify-between mb-2">
            <CheckCircle className="w-6 h-6 text-emerald-500" />
            <span className="text-2xl font-bold text-gray-900 dark:text-white">{stats.valides}</span>
          </div>
          <p className="text-sm text-gray-500">{t('stats.validated')}</p>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700"
        >
          <div className="flex items-center justify-between mb-2">
            <Globe className="w-6 h-6 text-blue-500" />
            <span className="text-2xl font-bold text-gray-900 dark:text-white">{stats.publies}</span>
          </div>
          <p className="text-sm text-gray-500">{t('stats.published')}</p>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700"
        >
          <div className="flex items-center justify-between mb-2">
            <Star className="w-6 h-6 text-amber-500" />
            <span className="text-2xl font-bold text-gray-900 dark:text-white">{stats.averageRating.toFixed(1)}</span>
          </div>
          <p className="text-sm text-gray-500">{t('stats.average_rating')}</p>
        </motion.div>
      </div>

      {/* Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 overflow-hidden"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative lg:col-span-2">
                <Search className="absolute ltr:left-4 rtl:right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t('search_placeholder')}
                  className="w-full ltr:pl-12 rtl:pr-12 ltr:pr-4 rtl:pl-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-emerald-500 dark:text-white"
                />
              </div>

              {/* Secteur */}
              <select
                value={secteurFilter}
                onChange={(e) => setSecteurFilter(e.target.value)}
                className="px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-emerald-500 dark:text-white"
              >
                {SECTEURS.map((s) => (
                  <option key={s.value} value={s.value}>{getSecteurLabel(s.value)}</option>
                ))}
              </select>

              {/* Reset */}
              <button
                onClick={() => { setSearch(''); setSecteurFilter(''); setValidFilter(''); }}
                className="flex items-center justify-center gap-2 px-4 py-3 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
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
            <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl p-6 animate-pulse">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-xl" />
                <div className="flex-1">
                  <div className="h-5 w-3/4 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
                  <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-700 rounded" />
                </div>
              </div>
            </div>
          ))
        ) : etablissements.length === 0 ? (
          <div className="col-span-full text-center py-16">
            <Building2 className="w-16 h-16 text-gray-200 dark:text-gray-700 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {t('empty.title')}
            </h3>
            <p className="text-gray-500">
              {search || secteurFilter ? t('empty.no_results') : t('empty.description')}
            </p>
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
                className="group bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-all"
              >
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform overflow-hidden">
                      {etablissement.photoPrincipale ? (
                        <img 
                          src={etablissement.photoPrincipale} 
                          alt={etablissement.nom}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Building2 className="w-6 h-6" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                          {etablissement.nom}
                        </h3>
                        {etablissement.isMisEnAvant && (
                          <Star className="w-4 h-4 text-amber-500 fill-current" />
                        )}
                      </div>
                      <p className="text-xs text-gray-500">{etablissement.code}</p>
                    </div>
                  </div>

                  {/* Status badges */}
                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${secteurConfig.color}`}>
                      {getSecteurLabel(etablissement.secteur)}
                    </span>
                    {etablissement.isValide ? (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                        {t('card.validated')}
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                        {t('card.pending')}
                      </span>
                    )}
                    {etablissement.isPublie && (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                        {t('card.published')}
                      </span>
                    )}
                  </div>

                  {/* Location */}
                  {etablissement.commune && (
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                      <MapPin size={14} />
                      <span>{etablissement.commune.nom}</span>
                    </div>
                  )}

                  {/* Rating */}
                  <div className="flex items-center gap-2 text-sm mb-4">
                    <div className="flex items-center gap-1 text-amber-500">
                      <Star size={14} className="fill-current" />
                      <span className="font-medium">{etablissement.noteMoyenne.toFixed(1)}</span>
                    </div>
                    <span className="text-gray-400">•</span>
                    <span className="text-gray-500">{t('card.reviews', { count: etablissement.nombreEvaluations })}</span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <button
                      onClick={() => { setSelectedEtablissement(etablissement); setShowDetailModal(true); }}
                      className="flex-1 flex items-center justify-center gap-2 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                    >
                      <Eye size={16} />
                      {t('card.details')}
                    </button>
                    <button
                      onClick={() => handleValidate(etablissement.id, 'publier')}
                      disabled={!!actionLoading}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm rounded-lg transition-colors ${
                        etablissement.isPublie
                          ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/20'
                          : 'text-gray-600 dark:text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20'
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
        <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
          <p className="text-sm text-gray-500">
            Page {page} sur {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
            >
              <ChevronLeft size={20} className="ltr:rotate-0 rtl:rotate-180" />
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
            >
              <ChevronRight size={20} className="ltr:rotate-0 rtl:rotate-180" />
            </button>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      <AnimatePresence>
        {showDetailModal && selectedEtablissement && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDetailModal(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, x: locale === 'ar' ? -100 : 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: locale === 'ar' ? -100 : 100 }}
              className="fixed ltr:right-0 rtl:left-0 top-0 bottom-0 w-full max-w-xl bg-white dark:bg-gray-800 shadow-2xl z-50 overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 px-6 py-4 flex items-center justify-between z-10">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  {t('card.details_title')}
                </h2>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 flex items-center justify-center text-emerald-600 overflow-hidden">
                    {selectedEtablissement.photoPrincipale ? (
                      <img 
                        src={selectedEtablissement.photoPrincipale} 
                        alt={selectedEtablissement.nom}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Building2 className="w-8 h-8" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      {selectedEtablissement.nom}
                    </h3>
                    <p className="text-gray-500">{selectedEtablissement.code}</p>
                  </div>
                </div>

                {/* Rating */}
                <div className="flex items-center gap-4 p-4 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-amber-600">{selectedEtablissement.noteMoyenne.toFixed(1)}</p>
                    <div className="flex items-center gap-1 text-amber-500">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={14}
                          className={star <= Math.round(selectedEtablissement.noteMoyenne) ? 'fill-current' : ''}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="h-12 w-px bg-amber-200 dark:bg-amber-800" />
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{selectedEtablissement.nombreEvaluations}</p>
                    <p className="text-sm text-gray-500">{t('card.reviews', { count: selectedEtablissement.nombreEvaluations })}</p>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="space-y-3">
                  {selectedEtablissement.adresse && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                      <MapPin className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-700 dark:text-gray-300">{selectedEtablissement.adresse}</span>
                    </div>
                  )}
                  {selectedEtablissement.telephone && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                      <Phone className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-700 dark:text-gray-300">{selectedEtablissement.telephone}</span>
                    </div>
                  )}
                  {selectedEtablissement.email && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                      <Mail className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-700 dark:text-gray-300">{selectedEtablissement.email}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="space-y-3">
                  <button
                    onClick={() => handleValidate(selectedEtablissement.id, 'valider')}
                    disabled={!!actionLoading}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all ${
                      selectedEtablissement.isValide
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-emerald-100 hover:text-emerald-700'
                    }`}
                  >
                    {actionLoading === `valider-${selectedEtablissement.id}` ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <CheckCircle className="w-5 h-5" />
                    )}
                    {selectedEtablissement.isValide ? t('card.validated') : t('card.validate')}
                  </button>

                  <button
                    onClick={() => handleValidate(selectedEtablissement.id, 'publier')}
                    disabled={!!actionLoading}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all ${
                      selectedEtablissement.isPublie
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-blue-100 hover:text-blue-700'
                    }`}
                  >
                    {actionLoading === `publier-${selectedEtablissement.id}` ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Globe className="w-5 h-5" />
                    )}
                    {selectedEtablissement.isPublie ? t('card.unpublish') : t('card.publish')}
                  </button>

                  <button
                    onClick={() => handleValidate(selectedEtablissement.id, 'misEnAvant')}
                    disabled={!!actionLoading}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all ${
                      selectedEtablissement.isMisEnAvant
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-amber-100 hover:text-amber-700'
                    }`}
                  >
                    {actionLoading === `misEnAvant-${selectedEtablissement.id}` ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Star className={`w-5 h-5 ${selectedEtablissement.isMisEnAvant ? 'fill-current' : ''}`} />
                    )}
                    {selectedEtablissement.isMisEnAvant ? t('card.remove_highlight') : t('card.highlight')}
                  </button>

                  <button
                    onClick={() => handleDelete(selectedEtablissement.id)}
                    disabled={!!actionLoading}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl font-medium hover:bg-red-100 dark:hover:bg-red-900/30 transition-all"
                  >
                    {actionLoading === `delete-${selectedEtablissement.id}` ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Trash2 className="w-5 h-5" />
                    )}
                    {t('card.delete')}
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
