'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Search,
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
} from 'lucide-react';
import { toast } from 'sonner';
import { PermissionGuard } from '@/hooks/use-permission';
import { useTranslations, useLocale } from 'next-intl';

interface Reclamation {
  id: number;
  code: string;
  titre: string;
  description: string;
  categorie: string;
  statut: string | null;
  isUrgente: boolean;
  affectationReclamation: string;
  createdAt: string;
  citoyen: { id: number; nom: string; prenom: string } | null;
  user: { nom: string; prenom: string; email: string } | null;
  commune: { id: number; nom: string };
  etablissement: { id: number; nom: string } | null;
  affecteeAAutorite: { id: number; nom: string; prenom: string } | null;
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

const CATEGORIES = [
  'Infrastructure',
  'Services',
  'Propreté',
  'Sécurité',
  'Personnel',
  'Accessibilité',
  'Autre',
];

export default function AdminReclamationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const t = useTranslations('admin.reclamations_page');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  
  const [reclamations, setReclamations] = useState<Reclamation[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [communes, setCommunes] = useState<{ id: number; nom: string }[]>([]);
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
  
  // Modals
  const [selectedReclamation, setSelectedReclamation] = useState<Reclamation | null>(null);
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
          const filteredAgents = (data.users || []).filter(
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
    try {
      const res = await fetch(`/api/reclamations/${selectedReclamation.id}/affecter`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ affecteAId: agentId }),
      });
      
      if (res.ok) {
        toast.success(t('messages.assigned_success'));
        setShowAffectationModal(false);
        setSelectedReclamation(null);
        loadReclamations();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Erreur lors de l\'affectation');
      }
    } catch (error) {
      toast.error('Erreur de connexion');
    } finally {
      setActionLoading(false);
    }
  };

  // Changer le statut d'une réclamation (Accepter ou Rejeter)
  const handleStatut = async (statut: 'ACCEPTEE' | 'REJETEE') => {
    if (!selectedReclamation) return;
    
    setActionLoading(true);
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
        toast.success(t('messages.status_success'));
        setShowStatutModal(false);
        setSelectedReclamation(null);
        setRejetMotif('');
        loadReclamations();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Erreur lors de la modification du statut');
      }
    } catch (error) {
      toast.error('Erreur de connexion');
    } finally {
      setActionLoading(false);
    }
  };

  // Supprimer une réclamation
  const handleDelete = async () => {
    if (!selectedReclamation) return;
    
    setActionLoading(true);
    try {
      const res = await fetch(`/api/reclamations/${selectedReclamation.id}`, {
        method: 'DELETE',
      });
      
      if (res.ok) {
        toast.success(t('messages.deleted_success'));
        setShowDeleteModal(false);
        setSelectedReclamation(null);
        loadReclamations();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Erreur lors de la suppression');
      }
    } catch (error) {
      toast.error('Erreur de connexion');
    } finally {
      setActionLoading(false);
    }
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

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  return (
    <PermissionGuard permission="reclamations.read">
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {t('page_title')}
              </h1>
              <p className="text-gray-500">{t('total_reclamations', { count: total })}</p>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={loadReclamations}
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
                Filtres
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
              <p className="text-sm text-gray-500">{t('stats.total')}</p>
            </div>
            <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-100">
              <p className="text-2xl font-bold text-yellow-600">{stats.enAttente}</p>
              <p className="text-sm text-yellow-700">{t('stats.pending')}</p>
            </div>
            <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
              <p className="text-2xl font-bold text-purple-600">{stats.aDispatcher}</p>
              <p className="text-sm text-purple-700">{t('stats.to_dispatch')}</p>
            </div>
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
              <p className="text-2xl font-bold text-blue-600">{stats.enCours}</p>
              <p className="text-sm text-blue-700">{t('stats.in_progress')}</p>
            </div>
            <div className="bg-red-50 rounded-xl p-4 border border-red-100">
              <p className="text-2xl font-bold text-red-600">{stats.rejetees}</p>
              <p className="text-sm text-red-700">{t('stats.rejected')}</p>
            </div>
          </div>

          {/* Filtres avancés */}
          {showFilters && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-6 border border-gray-100 dark:border-gray-700">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Recherche */}
                <div className="relative">
                  <Search className="absolute ltr:left-3 rtl:right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder={t('search_placeholder')}
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    className="w-full ltr:pl-10 rtl:pr-10 ltr:pr-4 rtl:pl-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Statut */}
                <select
                  value={filters.statut}
                  onChange={(e) => setFilters({ ...filters, statut: e.target.value })}
                  className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">{t('status_filter')}</option>
                  <option value="EN_ATTENTE">{t('status_labels.pending')}</option>
                  <option value="ACCEPTEE">{t('status_labels.accepted')}</option>
                  <option value="REJETEE">{t('status_labels.rejected')}</option>
                </select>

                {/* Affectation */}
                <select
                  value={filters.affectation}
                  onChange={(e) => setFilters({ ...filters, affectation: e.target.value })}
                  className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">{t('filters')}</option>
                  <option value="NON_AFFECTEE">{t('not_assigned')}</option>
                  <option value="AFFECTEE">{t('status_labels.assigned')}</option>
                </select>



                {/* Commune */}
                <select
                  value={filters.communeId}
                  onChange={(e) => setFilters({ ...filters, communeId: e.target.value })}
                  className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">{t('filters_labels.all_communes')}</option>
                  {communes.map(c => (
                    <option key={c.id} value={c.id}>{c.nom}</option>
                  ))}
                </select>

                {/* Catégorie */}
                <select
                  value={filters.categorie}
                  onChange={(e) => setFilters({ ...filters, categorie: e.target.value })}
                  className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">{t('category_filter')}</option>
                  {CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>

                {/* Date début */}
                <input
                  type="date"
                  value={filters.dateDebut}
                  onChange={(e) => setFilters({ ...filters, dateDebut: e.target.value })}
                  className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
                  placeholder={t('filters_labels.start_date')}
                />

                {/* Reset */}
                <button
                  onClick={resetFilters}
                  className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  {t('filters')}
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
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('columns.reclamation')}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('columns.citizen')}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('columns.commune')}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('columns.status')}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('columns.category')}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('columns.assigned_to')}
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('columns.date')}
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('columns.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {reclamations.map((reclamation) => {
                    const isAssigned = !!reclamation.affecteeAAutorite;
                    const isNew = !reclamation.statut;
                    const isRejected = reclamation.statut === 'REJETEE';
                    const isAccepted = reclamation.statut === 'ACCEPTEE';

                    let statusConfig = { 
                      bg: 'bg-yellow-100', 
                      color: 'text-yellow-700', 
                      icon: Clock, 
                      label: t('status_labels.pending') 
                    };

                    if (isRejected) {
                      statusConfig = { bg: 'bg-red-100', color: 'text-red-700', icon: XCircle, label: t('status_labels.rejected') };
                    } else if (isAccepted) {
                      if (isAssigned) {
                        statusConfig = { bg: 'bg-blue-100', color: 'text-blue-700', icon: User, label: t('status_labels.assigned') };
                      } else {
                        statusConfig = { bg: 'bg-purple-100', color: 'text-purple-700', icon: CheckCircle, label: t('status_labels.to_dispatch') };
                      }
                    }
                    
                    const StatusIcon = statusConfig.icon;
                    
                    return (
                      <tr key={reclamation.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                        <td className="px-4 py-3">
                          <div className="flex items-start gap-3">
                            {reclamation.isUrgente && (
                              <AlertTriangle size={16} className="text-red-500 flex-shrink-0 mt-1" />
                            )}
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white line-clamp-1">
                                {reclamation.titre}
                              </p>
                              <p className="text-xs text-gray-500">{reclamation.code}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                              <User size={14} className="text-gray-500" />
                            </div>
                            <span className="text-sm text-gray-900 dark:text-white">
                              {reclamation.user ? `${reclamation.user.prenom} ${reclamation.user.nom}` : (reclamation.citoyen ? `${reclamation.citoyen.prenom} ${reclamation.citoyen.nom}` : t('anonymous'))}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5 text-sm text-gray-600">
                            <MapPin size={14} />
                            {reclamation.commune.nom}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.color}`}>
                            <StatusIcon size={12} />
                            {statusConfig.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                            {reclamation.categorie}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {reclamation.affecteeAAutorite ? (
                            <span className="text-sm text-gray-900 dark:text-white font-medium">
                              {reclamation.affecteeAAutorite.prenom} {reclamation.affecteeAAutorite.nom}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-400 italic">{t('not_assigned')}</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-500">
                            {new Date(reclamation.createdAt).toLocaleDateString(locale === 'ar' ? 'ar-MA' : 'fr-FR')}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <Link
                              href={`/admin/reclamations/${reclamation.id}`}
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                              title={t('actions.view_details')}
                            >
                              <Eye size={16} />
                            </Link>

                            {/* Bouton statut (si non décidé) */}
                            {!reclamation.statut && (
                              <PermissionGuard permission="reclamations.validate">
                                <button
                                  onClick={() => { setSelectedReclamation(reclamation); setShowStatutModal(true); }}
                                  className="p-1.5 text-yellow-500 hover:text-yellow-700 hover:bg-yellow-50 rounded"
                                  title={t('actions.decide')}
                                >
                                  <MessageSquare size={16} />
                                </button>
                              </PermissionGuard>
                            )}
                            
                            {/* Bouton affecter (si acceptée) */}
                            {reclamation.statut === 'ACCEPTEE' && (
                              <PermissionGuard permission="reclamations.assign">
                                <button
                                  onClick={() => { setSelectedReclamation(reclamation); setShowAffectationModal(true); }}
                                  className={`p-1.5 rounded transition-colors ${
                                    isAssigned 
                                      ? 'text-blue-500 hover:text-blue-700 hover:bg-blue-50' 
                                      : 'text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50'
                                  }`}
                                  title={isAssigned ? t('actions.edit_assignment') : t('actions.assign')}
                                >
                                  {isAssigned ? <RefreshCw size={16} /> : <UserPlus size={16} />}
                                </button>
                              </PermissionGuard>
                            )}
                            
                            {/* Bouton supprimer */}
                            <PermissionGuard permission="reclamations.delete">
                              <button
                                onClick={() => { setSelectedReclamation(reclamation); setShowDeleteModal(true); }}
                                className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
                                title={t('actions.delete')}
                              >
                                <Trash2 size={16} />
                              </button>
                            </PermissionGuard>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {reclamations.length === 0 && (
              <div className="text-center py-12">
                <AlertTriangle className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-500">{t('empty.title')}</p>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                <p className="text-sm text-gray-500">
                  {t('pagination', { page, total: totalPages })}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Affectation */}
        {showAffectationModal && selectedReclamation && (
          <PermissionGuard permission="reclamations.assign">
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                    {t('modals.assignment.title')}
                  </h3>
                  <button onClick={() => setShowAffectationModal(false)} className="p-1 hover:bg-gray-100 rounded">
                    <X size={20} />
                  </button>
                </div>
                
                <p className="text-sm text-gray-500 mb-4">
                  {selectedReclamation.titre}
                </p>
                
                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {/* Désaffecter */}
                  <button
                    onClick={() => handleAffectation(null)}
                    disabled={actionLoading}
                    className="w-full p-3 text-left rounded-lg hover:bg-gray-50 flex items-center gap-3 border border-gray-200"
                  >
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      <X size={18} className="text-gray-500" />
                    </div>
                    <span className="text-gray-600">{t('modals.assignment.unassign')}</span>
                  </button>
                  
                  {/* Message si aucun agent */}
                  {agents.length === 0 && (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
                      <p className="text-sm text-yellow-700">
                        {t('modals.assignment.no_agents')}
                      </p>
                      <p className="text-xs text-yellow-600 mt-1">
                        {t('modals.assignment.create_agents_hint')}
                      </p>
                    </div>
                  )}
                  
                  {/* Agents AUTORITE_LOCALE en premier */}
                  {agents.filter(a => a.role === 'AUTORITE_LOCALE').length > 0 && (
                    <p className="text-xs text-gray-500 font-medium mt-3 mb-1 uppercase">{t('modals.assignment.local_authorities')}</p>
                  )}
                  {agents.filter(a => a.role === 'AUTORITE_LOCALE').map(agent => (
                    <button
                      key={agent.id}
                      onClick={() => handleAffectation(agent.id)}
                      disabled={actionLoading}
                      className={`w-full p-3 text-left rounded-lg hover:bg-emerald-50 flex items-center gap-3 border ${
                        selectedReclamation.affecteeAAutorite?.id === agent.id 
                          ? 'border-emerald-500 bg-emerald-50' 
                          : 'border-gray-200'
                      }`}
                    >
                      <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 font-medium">
                        {agent.prenom?.[0] || ''}{agent.nom?.[0] || ''}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900">{agent.prenom} {agent.nom}</p>
                        <p className="text-xs text-gray-500 truncate">{agent.email}</p>
                      </div>
                      <span className="px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 rounded-full">
                        {t('modals.assignment.local_badge')}
                      </span>
                    </button>
                  ))}
                  
                  {/* Autres agents */}
                  {agents.filter(a => a.role !== 'AUTORITE_LOCALE').length > 0 && (
                    <p className="text-xs text-gray-500 font-medium mt-3 mb-1 uppercase">{t('modals.assignment.other_agents')}</p>
                  )}
                  {agents.filter(a => a.role !== 'AUTORITE_LOCALE').map(agent => (
                    <button
                      key={agent.id}
                      onClick={() => handleAffectation(agent.id)}
                      disabled={actionLoading}
                      className={`w-full p-3 text-left rounded-lg hover:bg-blue-50 flex items-center gap-3 border ${
                        selectedReclamation.affecteeAAutorite?.id === agent.id 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200'
                      }`}
                    >
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-medium">
                        {agent.prenom?.[0] || ''}{agent.nom?.[0] || ''}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900">{agent.prenom} {agent.nom}</p>
                        <p className="text-xs text-gray-500 truncate">{agent.email}</p>
                      </div>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                        agent.role === 'DELEGATION' ? 'bg-purple-100 text-purple-700' :
                        agent.role === 'ADMIN' ? 'bg-emerald-100 text-emerald-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {agent.role === 'DELEGATION' ? t('modals.assignment.delegate_badge') : 
                         agent.role === 'ADMIN' ? t('modals.assignment.admin_badge') : agent.role}
                      </span>
                    </button>
                  ))}
                </div>
                
                {actionLoading && (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
                  </div>
                )}
              </div>
            </div>
          </PermissionGuard>
        )}

        {/* Modal Statut (Accepter/Rejeter) */}
        {showStatutModal && selectedReclamation && (
          <PermissionGuard permission="reclamations.validate">
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                    {t('modals.status.title')}
                  </h3>
                  <button 
                    onClick={() => { setShowStatutModal(false); setRejetMotif(''); }} 
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <X size={20} />
                  </button>
                </div>
                
                <p className="text-sm text-gray-500 mb-4">
                  <strong>{selectedReclamation.code}</strong> - {selectedReclamation.titre}
                </p>
                
                <div className="space-y-3">
                  {/* Bouton Accepter */}
                  <button
                    onClick={() => handleStatut('ACCEPTEE')}
                    disabled={actionLoading}
                    className="w-full p-4 text-left rounded-xl flex items-center gap-4 border-2 border-emerald-200 bg-emerald-50 hover:bg-emerald-100 hover:border-emerald-400 transition-all disabled:opacity-50"
                  >
                    <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center">
                      <Check size={24} className="text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-emerald-700 text-lg">{t('modals.status.accept_btn')}</p>
                      <p className="text-sm text-emerald-600">{t('modals.status.accept_desc')}</p>
                    </div>
                  </button>
                  
                  {/* Bouton Rejeter */}
                  <div className="border-2 border-red-200 bg-red-50 rounded-xl p-4">
                    <div className="flex items-center gap-4 mb-3">
                      <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
                        <Ban size={24} className="text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-red-700 text-lg">{t('modals.status.reject_btn')}</p>
                        <p className="text-sm text-red-600">{t('modals.status.reject_desc')}</p>
                      </div>
                    </div>
                    <textarea
                      value={rejetMotif}
                      onChange={(e) => setRejetMotif(e.target.value)}
                      placeholder={t('modals.status.reject_placeholder')}
                      className="w-full p-3 border border-red-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
                      rows={3}
                    />
                    <button
                      onClick={() => handleStatut('REJETEE')}
                      disabled={actionLoading || rejetMotif.trim().length < 10}
                      className="mt-3 w-full py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {t('modals.status.confirm_reject')}
                    </button>
                  </div>
                </div>
                
                {actionLoading && (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
                  </div>
                )}
              </div>
            </div>
          </PermissionGuard>
        )}

        {/* Modal de suppression */}
        {showDeleteModal && selectedReclamation && (
          <PermissionGuard permission="reclamations.delete">
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                    {t('modals.delete.title')}
                  </h3>
                  <button 
                    onClick={() => setShowDeleteModal(false)} 
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <X size={20} />
                  </button>
                </div>
                
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
                  <p className="text-red-700 text-sm">
                    {t('modals.delete.confirm_question')}
                  </p>
                </div>
                
                <p className="text-sm text-gray-500 mb-4">
                  <strong>{selectedReclamation.code}</strong> - {selectedReclamation.titre}
                </p>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="flex-1 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    {tCommon('cancel')}
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={actionLoading}
                    className="flex-1 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                  >
                    {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 size={16} />}
                    {t('actions.delete')}
                  </button>
                </div>
              </div>
            </div>
          </PermissionGuard>
        )}
      </div>
    </PermissionGuard>
  );
}
