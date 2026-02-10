'use client';


import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations, useLocale } from 'next-intl';
import {
  Search,
  Filter,
  Clock,
  CheckCircle,
  MapPin,
  Calendar,
  User,
  ChevronLeft,
  ChevronRight,
  Eye,
  Loader2,
  AlertCircle,
  FileText,
  X,
  ListFilter
} from 'lucide-react';

interface Reclamation {
  id: number;
  titre: string;
  description: string;
  categorie: string;
  dateAffectation: string;
  createdAt: string;
  dateResolution: string | null;
  isResolue: boolean;
  joursDepuisAffectation: number;
  quartierDouar: string | null;
  commune: { id: number; nom: string };
  user: { id: number; nom: string; prenom: string; telephone: string | null; email: string };
  etablissement: { id: number; nom: string; secteur: string } | null;
  medias: { id: number; urlPublique: string; type: string }[];
  _count: { historique: number };
}

interface Category {
  value: string;
  label: string;
  count: number;
}

export default function AutoriteReclamationsPage() {
  const t = useTranslations('authority_reclamations_page');
  const locale = useLocale();
  const isRtl = locale === 'ar';
  
  const [reclamations, setReclamations] = useState<Reclamation[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  
  // Filtres
  const [statut, setStatut] = useState('all');
  const [categorie, setCategorie] = useState('');
  const [search, setSearch] = useState('');

  const STATUT_OPTIONS = [
    { value: 'all', label: t('filters.all'), icon: FileText },
    { value: 'en_attente', label: t('filters.pending'), icon: Clock },
    { value: 'resolue', label: t('filters.resolved'), icon: CheckCircle },
  ];

  // Charger les données
  useEffect(() => {
    fetchReclamations();
  }, [page, statut, categorie]);

  const fetchReclamations = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', '10');
      if (statut !== 'all') params.set('statut', statut);
      if (categorie) params.set('categorie', categorie);
      if (search) params.set('search', search);

      const res = await fetch(`/api/autorite/reclamations?${params}`);
      if (res.ok) {
        const data = await res.json();
        setReclamations(data.data || []);
        setCategories(data.categories || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotal(data.pagination?.total || 0);
      }
    } catch (error) {
      console.error('Erreur chargement réclamations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchReclamations();
  };

  const clearFilters = () => {
    setStatut('all');
    setCategorie('');
    setSearch('');
    setPage(1);
  };

  return (
    <div className={`space-y-6 ${isRtl ? 'font-cairo' : ''}`}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
          <p className="text-gray-500 mt-1">
            {t('subtitle', { count: total })}
          </p>
        </div>
      </div>

      {/* Onglets de statut */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {STATUT_OPTIONS.map((option) => {
          const Icon = option.icon;
          const isActive = statut === option.value;
          return (
            <button
              key={option.value}
              onClick={() => { setStatut(option.value); setPage(1); }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium whitespace-nowrap transition-all duration-200 ${
                isActive
                  ? 'bg-gov-blue text-white shadow-md shadow-blue-900/10 scale-[1.02]'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-100'
              }`}
            >
              <Icon size={16} className={isActive ? 'text-white' : 'text-gray-400'} />
              {option.label}
            </button>
          );
        })}
      </div>

      {/* Barre de recherche et filtres */}
      <div className="gov-card p-4 shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Recherche */}
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative group">
              <Search className={`absolute ${isRtl ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-gov-blue transition-colors`} size={18} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('filters.search_placeholder')}
                className={`w-full h-11 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-gov-blue focus:ring-2 focus:ring-gov-blue/10 transition-all outline-none ${
                    isRtl ? 'pr-10 pl-10' : 'pl-10 pr-10'
                }`}
              />
              {search && (
                <button
                  type="button"
                  onClick={() => { setSearch(''); fetchReclamations(); }}
                  className={`absolute ${isRtl ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors bg-gray-100 hover:bg-red-50 rounded-full p-0.5`}
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </form>

          {/* Filtre catégorie */}
          <div className="flex items-center gap-3">
            <div className="relative min-w-[200px]">
                <ListFilter className={`absolute ${isRtl ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none`} size={16} />
                <select
                value={categorie}
                onChange={(e) => { setCategorie(e.target.value); setPage(1); }}
                className={`gov-select h-11 w-full bg-white border border-gray-200 rounded-xl text-sm focus:border-gov-blue focus:ring-2 focus:ring-gov-blue/10 outline-none appearance-none cursor-pointer ${
                    isRtl ? 'pr-10 pl-8' : 'pl-10 pr-8'
                }`}
                >
                <option value="">{t('filters.all_categories')}</option>
                {categories.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                    {cat.label} ({cat.count})
                    </option>
                ))}
                </select>
            </div>

            {(statut !== 'all' || categorie || search) && (
              <button
                onClick={clearFilters}
                className="text-sm font-medium text-gov-blue hover:text-gov-blue-dark hover:underline whitespace-nowrap px-2"
              >
                {t('filters.reset')}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Contenu */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 min-h-[400px]">
          <Loader2 className="w-10 h-10 text-gov-blue animate-spin mb-4" />
          <p className="text-gray-500 text-sm animate-pulse">Chargement des données...</p>
        </div>
      ) : reclamations.length === 0 ? (
        <div className="gov-card text-center py-20 flex flex-col items-center justify-center min-h-[400px]">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
            <AlertCircle className="w-10 h-10 text-gray-300" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">{t('empty.title')}</h3>
          <p className="text-gray-500 max-w-md mx-auto mb-6">
            {search || categorie
              ? t('empty.search_desc')
              : statut === 'en_attente'
              ? t('empty.pending_desc')
              : t('empty.default_desc')}
          </p>
          {(search || categorie) && (
            <button
              onClick={clearFilters}
              className="px-6 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors shadow-lg shadow-gray-200 font-medium"
            >
              {t('filters.reset_filters')}
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Table */}
          <div className="gov-card overflow-hidden shadow-sm border border-gray-100 rounded-xl">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50/50 border-b border-gray-100">
                  <tr>
                    <th className={`text-start px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider ${isRtl ? 'text-right' : 'text-left'}`}>
                      {t('table.reclamation')}
                    </th>
                    <th className={`text-start px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider ${isRtl ? 'text-right' : 'text-left'}`}>
                      {t('table.citizen')}
                    </th>
                    <th className={`text-start px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider ${isRtl ? 'text-right' : 'text-left'}`}>
                      {t('table.location')}
                    </th>
                    <th className={`text-start px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider ${isRtl ? 'text-right' : 'text-left'}`}>
                      {t('table.assigned_on')}
                    </th>
                    <th className="text-center px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {t('table.status')}
                    </th>
                    <th className={`text-end px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider ${isRtl ? 'text-left' : 'text-right'}`}>
                      {t('table.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  <AnimatePresence>
                    {reclamations.map((reclamation, index) => (
                      <motion.tr
                        key={reclamation.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="hover:bg-blue-50/30 transition-colors group"
                      >
                        {/* Réclamation */}
                        <td className="px-6 py-4">
                          <div className="max-w-xs">
                            <p className="font-semibold text-gray-900 truncate group-hover:text-gov-blue transition-colors">
                              {reclamation.titre}
                            </p>
                            <span className={`inline-flex items-center mt-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold tracking-wide uppercase ${
                              reclamation.joursDepuisAffectation > 7
                                ? 'bg-red-50 text-gov-red border border-red-100'
                                : reclamation.joursDepuisAffectation > 3
                                ? 'bg-orange-50 text-gov-gold-dark border border-orange-100'
                                : 'bg-gray-100 text-gray-600 border border-gray-200'
                            }`}>
                              {reclamation.categorie}
                            </span>
                          </div>
                        </td>

                        {/* Citoyen */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0 border border-blue-100">
                              <User size={16} className="text-gov-blue" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {reclamation.user.prenom} {reclamation.user.nom}
                              </p>
                              {reclamation.user.telephone && (
                                <p className="text-xs text-gray-400 font-outfit" dir="ltr">{reclamation.user.telephone}</p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Localisation */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 text-sm text-gray-600">
                            <MapPin size={16} className="text-gray-400" />
                            <span className="font-medium">{reclamation.commune.nom}</span>
                          </div>
                          {reclamation.quartierDouar && (
                            <p className="text-xs text-gray-400 mt-1 pl-5 rtl:pl-0 rtl:pr-5">{reclamation.quartierDouar}</p>
                          )}
                        </td>

                        {/* Date affectation */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 text-sm text-gray-900">
                            <Calendar size={16} className="text-gray-400" />
                            <span className="font-outfit">
                              {new Date(reclamation.dateAffectation).toLocaleDateString(locale)}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1 pl-5 rtl:pl-0 rtl:pr-5 font-medium">
                            {t('table.ago_days', { days: reclamation.joursDepuisAffectation })}
                          </p>
                        </td>

                        {/* Statut */}
                        <td className="px-6 py-4 text-center">
                          {reclamation.isResolue ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-green-50 text-gov-green border border-green-100">
                              <CheckCircle size={14} />
                              {t('table.resolved_badge')}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-orange-50 text-gov-gold-dark border border-orange-100">
                              <Clock size={14} />
                              {t('table.pending_badge')}
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 text-end">
                          <Link
                            href={`/autorite/reclamations/${reclamation.id}`}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:text-gov-blue hover:bg-blue-50 transition-all"
                            title={t('table.view')}
                          >
                            <Eye size={18} />
                          </Link>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
              <p className="text-sm text-gray-500 font-medium">
                {t('pagination.info', { page: page, total: totalPages, count: total })}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2.5 rounded-xl border border-gray-200 text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 hover:border-gray-300 transition-all bg-white shadow-sm"
                >
                  <ChevronLeft size={18} className="rtl:rotate-180" />
                </button>
                <div className="flex items-center gap-1 px-2">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        // Logic simplified for presentation
                        let p = i + 1;
                        if (totalPages > 5 && page > 3) p = page - 2 + i;
                        if (p > totalPages) p = i + 1; // Fallback
                        
                        return (
                            <button
                                key={p}
                                onClick={() => setPage(p)}
                                className={`w-9 h-9 rounded-lg text-sm font-bold transition-all ${
                                    page === p 
                                    ? 'bg-gov-blue text-white shadow-md shadow-blue-500/20' 
                                    : 'text-gray-500 hover:bg-gray-100'
                                }`}
                            >
                                {p}
                            </button>
                        );
                    })}
                </div>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2.5 rounded-xl border border-gray-200 text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 hover:border-gray-300 transition-all bg-white shadow-sm"
                >
                  <ChevronRight size={18} className="rtl:rotate-180" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
