'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import CreateEvenementModal from '@/components/evenements/CreateEvenementModal';
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  MapPin,
  Building2,
  Eye,
  Edit2,
  Loader2,
  RefreshCw,
  Plus,
  Users,
  Play,
  Archive,
} from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations, useLocale } from 'next-intl';

interface Evenement {
  id: number;
  titre: string;
  description: string;
  secteur: string;
  typeCategorique: string;
  dateDebut: string;
  dateFin: string | null;
  lieu: string | null;
  statut: string;
  isMisEnAvant: boolean;
  nombreVues: number;
  nombreInscrits: number;
  capaciteMax: number | null;
  createdAt: string;
  commune: { id: number; nom: string };
  etablissement: { id: number; nom: string } | null;
  createdByUser: { nom: string; prenom: string } | null;
}

interface Filters {
  search: string;
  statut: string;
  secteur: string;
  communeId: string;
  dateDebut: string;
  dateFin: string;
}

const STATUT_CONFIG: Record<string, { color: string; bg: string; icon: React.ElementType }> = {
  EN_ATTENTE_VALIDATION: { color: 'text-yellow-600', bg: 'bg-yellow-50', icon: Clock },
  PUBLIEE: { color: 'text-emerald-600', bg: 'bg-emerald-50', icon: CheckCircle },
  EN_ACTION: { color: 'text-blue-600', bg: 'bg-blue-50', icon: Play },
  CLOTUREE: { color: 'text-gray-600', bg: 'bg-gray-100', icon: Archive },
  REJETEE: { color: 'text-red-600', bg: 'bg-red-50', icon: XCircle },
};

const SECTEURS = [
  'EDUCATION',
  'SANTE',
  'SPORT',
  'SOCIAL',
  'CULTUREL',
  'AUTRE',
];

export default function AdminEvenementsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const t = useTranslations('admin.events_page');
  const tSectors = useTranslations('admin.users_page.sectors');
  const locale = useLocale();
  
  const [evenements, setEvenements] = useState<Evenement[]>([]);
  const [communes, setCommunes] = useState<{ id: number; nom: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  
  // Filtres
  const searchParams = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    search: searchParams.get('search') || '',
    statut: searchParams.get('statut') || '',
    secteur: searchParams.get('secteur') || '',
    communeId: searchParams.get('communeId') || '',
    dateDebut: searchParams.get('dateDebut') || '',
    dateFin: searchParams.get('dateFin') || '',
  });
  
  // Stats
  const [stats, setStats] = useState({
    total: 0,
    enAttente: 0,
    publiees: 0,
    enCours: 0,
    cloturees: 0,
  });

  // Modal création
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Vérifier authentification
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Charger communes
  useEffect(() => {
    const loadCommunes = async () => {
      try {
        const res = await fetch('/api/map/communes');
        if (res.ok) {
          const data = await res.json();
          setCommunes(data.communes || []);
        }
      } catch (error) {
        console.error('Erreur chargement communes:', error);
      }
    };
    loadCommunes();
  }, []);

  // Charger les événements
  const loadEvenements = useCallback(async () => {
    setRefreshing(true);
    try {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', '15');
      
      if (filters.search) params.set('search', filters.search);
      if (filters.statut) params.set('statut', filters.statut);
      if (filters.secteur) params.set('secteur', filters.secteur);
      if (filters.communeId) params.set('communeId', filters.communeId);
      
      const res = await fetch(`/api/evenements?${params}`);
      if (res.ok) {
        const data = await res.json();
        setEvenements(data.data || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotal(data.pagination?.total || 0);
        
        // Calculer stats depuis les données reçues
        const allEvts = data.data || [];
        setStats({
          total: data.pagination?.total || 0,
          enAttente: allEvts.filter((e: Evenement) => e.statut === 'EN_ATTENTE_VALIDATION').length,
          publiees: allEvts.filter((e: Evenement) => e.statut === 'PUBLIEE').length,
          enCours: allEvts.filter((e: Evenement) => e.statut === 'EN_ACTION').length,
          cloturees: allEvts.filter((e: Evenement) => e.statut === 'CLOTUREE').length,
        });
      }
    } catch (error) {
      console.error('Erreur chargement:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, filters]);

  useEffect(() => {
    loadEvenements();
  }, [loadEvenements]);

  // Reset filtres
  const resetFilters = () => {
    setFilters({
      search: '',
      statut: '',
      secteur: '',
      communeId: '',
      dateDebut: '',
      dateFin: '',
    });
    setPage(1);
  };

  // Valider / Rejeter événement
  const handleValidation = async (id: number, action: 'valider' | 'rejeter') => {
    // Si rejet, demander le motif
    let motifRejet: string | undefined;
    if (action === 'rejeter') {
      const response = prompt(t('messages.reject_reason'));
      if (!response || response.length < 10) {
        toast.error(t('messages.reject_error'));
        return;
      }
      motifRejet = response;
    }

    try {
      const res = await fetch(`/api/evenements/${id}/valider`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision: action === 'valider' ? 'PUBLIEE' : 'REJETEE',
          motifRejet: motifRejet,
        }),
      });
      
      if (res.ok) {
        toast.success(action === 'valider' ? t('messages.validated') : t('messages.rejected'));
        loadEvenements();
      } else {
        const data = await res.json();
        toast.error(data.error || t('messages.error'));
      }
    } catch (error) {
      toast.error(t('messages.error'));
    }
  };

  const statusKeyMap: Record<string, string> = {
    'EN_ATTENTE_VALIDATION': 'pending',
    'PUBLIEE': 'published',
    'EN_ACTION': 'in_progress',
    'CLOTUREE': 'closed',
    'REJETEE': 'rejected'
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('title')}
          </h1>
          <p className="text-gray-500">{t('subtitle', { count: total })}</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={loadEvenements}
            disabled={refreshing}
            className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
              showFilters 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Filter size={18} />
            {t('filters')}
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg hover:shadow-lg transition-all"
          >
            <Plus size={18} />
            {t('create')}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
          <p className="text-sm text-gray-500">{t('stats.total')}</p>
        </div>
        <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-100">
          <p className="text-2xl font-bold text-yellow-600">{stats.enAttente}</p>
          <p className="text-sm text-yellow-700">{t('stats.pending')}</p>
        </div>
        <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
          <p className="text-2xl font-bold text-emerald-600">{stats.publiees}</p>
          <p className="text-sm text-emerald-700">{t('stats.published')}</p>
        </div>
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
          <p className="text-2xl font-bold text-blue-600">{stats.enCours}</p>
          <p className="text-sm text-blue-700">{t('stats.in_progress')}</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
          <p className="text-2xl font-bold text-gray-600">{stats.cloturees}</p>
          <p className="text-sm text-gray-700">{t('stats.closed')}</p>
        </div>
      </div>

      {/* Filtres avancés */}
      {showFilters && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Recherche */}
            <div className="relative">
              <Search className={`absolute top-1/2 -translate-y-1/2 text-gray-400 ${locale === 'ar' ? 'right-3' : 'left-3'}`} size={18} />
              <input
                type="text"
                placeholder={t('filter_labels.search')}
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className={`w-full py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 ${locale === 'ar' ? 'pr-10 pl-4 text-right' : 'pl-10 pr-4 text-left'}`}
              />
            </div>

            {/* Statut */}
            <select
              value={filters.statut}
              onChange={(e) => setFilters({ ...filters, statut: e.target.value })}
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">{t('filter_labels.all_statuses')}</option>
              <option value="EN_ATTENTE_VALIDATION">{t('status.pending')}</option>
              <option value="PUBLIEE">{t('status.published')}</option>
              <option value="EN_ACTION">{t('status.in_progress')}</option>
              <option value="CLOTUREE">{t('status.closed')}</option>
              <option value="REJETEE">{t('status.rejected')}</option>
            </select>

            {/* Secteur */}
            <select
              value={filters.secteur}
              onChange={(e) => setFilters({ ...filters, secteur: e.target.value })}
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">{t('filter_labels.all_sectors')}</option>
              {SECTEURS.map(s => (
                <option key={s} value={s}>{tSectors(s)}</option>
              ))}
            </select>

            {/* Commune */}
            <select
              value={filters.communeId}
              onChange={(e) => setFilters({ ...filters, communeId: e.target.value })}
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">{t('filter_labels.all_muncipalities')}</option>
              {communes.map(c => (
                <option key={c.id} value={c.id}>{c.nom}</option>
              ))}
            </select>

            {/* Reset */}
            <button
              onClick={resetFilters}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {t('filter_labels.reset')}
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className={`px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
                  {t('table.event')}
                </th>
                <th className={`px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
                  {t('table.sector')}
                </th>
                <th className={`px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
                  {t('table.location')}
                </th>
                <th className={`px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
                  {t('table.date')}
                </th>
                <th className={`px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
                  {t('table.status')}
                </th>
                <th className={`px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
                  {t('table.registrations')}
                </th>
                <th className={`px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${locale === 'ar' ? 'text-left' : 'text-right'}`}>
                  {t('table.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {evenements.map((evenement) => {
                const statutConfig = STATUT_CONFIG[evenement.statut] || STATUT_CONFIG.EN_ATTENTE_VALIDATION;
                const StatutIcon = statutConfig.icon;
                const secteurLabel = tSectors(evenement.secteur);
                
                return (
                  <tr key={evenement.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white line-clamp-1">
                          {evenement.titre}
                        </p>
                        <p className="text-xs text-gray-500">{evenement.typeCategorique}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-600">{secteurLabel}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-sm text-gray-600">
                        <MapPin size={14} />
                        <span className="line-clamp-1">
                          {evenement.lieu || evenement.commune?.nom || '-'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-sm text-gray-600">
                        <Calendar size={14} />
                        {new Date(evenement.dateDebut).toLocaleDateString(locale === 'ar' ? 'ar-MA' : 'fr-FR')}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statutConfig.bg} ${statutConfig.color}`}>
                        <StatutIcon size={12} />
                        {t('status.' + (statusKeyMap[evenement.statut] || 'pending'))}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-sm">
                        <Users size={14} className="text-gray-400" />
                        <span className="text-gray-900">
                          {evenement.nombreInscrits}
                          {evenement.capaciteMax && `/${evenement.capaciteMax}`}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className={`flex items-center gap-2 ${locale === 'ar' ? 'justify-start' : 'justify-end'}`}>
                        {/* Voir */}
                        <Link
                          href={`/evenements/${evenement.id}`}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                          title={t('actions.view')}
                        >
                          <Eye size={16} />
                        </Link>
                        
                        {/* Modifier - Visible pour tous sauf Clôturés */}
                        {evenement.statut !== 'CLOTUREE' && (
                          <Link
                            href={`/admin/evenements/${evenement.id}/modifier`}
                            className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded"
                            title={t('actions.edit')}
                          >
                            <Edit2 size={16} />
                          </Link>
                        )}
                        
                        {/* Valider/Rejeter - Seulement en attente */}
                        {evenement.statut === 'EN_ATTENTE_VALIDATION' && (
                          <>
                            <button
                              onClick={() => handleValidation(evenement.id, 'valider')}
                              className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded"
                              title={t('actions.validate')}
                            >
                              <CheckCircle size={16} />
                            </button>
                            <button
                              onClick={() => handleValidation(evenement.id, 'rejeter')}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                              title={t('actions.reject')}
                            >
                              <XCircle size={16} />
                            </button>
                          </>
                        )}
                        
                        {/* Clôture pour Admin si terminé */}
                        {(evenement.statut === 'PUBLIEE' || evenement.statut === 'EN_ACTION') && 
                         evenement.dateFin && new Date(evenement.dateFin) < new Date() && (
                          <Link
                            href={`/delegation/evenements/${evenement.id}/cloture`}
                            className="p-1.5 text-orange-500 hover:text-orange-700 hover:bg-orange-50 rounded animate-pulse"
                            title={t('actions.close')}
                          >
                            <Archive size={16} />
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {evenements.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500">{t('empty')}</p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Page {page} sur {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50"
              >
                {locale === 'ar' ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50"
              >
                {locale === 'ar' ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Création */}
      <CreateEvenementModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          setShowCreateModal(false);
          loadEvenements();
        }}
      />
    </div>
  );
}
