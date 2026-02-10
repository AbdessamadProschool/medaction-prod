'use client';

import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ClipboardList,
  Search,
  Filter,
  Calendar,
  Building2,
  Clock,
  Users,
  CheckCircle,
  XCircle,
  Eye,
  MoreVertical,
  RefreshCw,
  AlertCircle,
  ChevronDown,
  PlayCircle,
  PauseCircle,
  FileText,
  Download,
  Plus,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { fr, arMA } from 'date-fns/locale';
import { useTranslations, useLocale } from 'next-intl';

interface ProgrammeActivite {
  id: number;
  titre: string;
  date: string;
  heureDebut: string;
  heureFin: string;
  typeActivite: string;
  statut: string;
  lieu?: string;
  participantsAttendus?: number;
  presenceEffective?: number;
  isVisiblePublic: boolean;
  isValideParAdmin: boolean;
  rapportComplete: boolean;
  etablissement: {
    id: number;
    nom: string;
    secteur: string;
  };
  createdByUser?: {
    id: number;
    nom: string;
    prenom: string;
  };
}

const STATUT_CONFIG: Record<string, { color: string; icon: React.ElementType }> = {
  BROUILLON: { color: 'bg-gray-100 text-gray-600 border-gray-300', icon: FileText },
  EN_ATTENTE_VALIDATION: { color: 'bg-amber-100 text-amber-700 border-amber-300', icon: Clock },
  PLANIFIEE: { color: 'bg-blue-100 text-blue-700 border-blue-300', icon: Calendar },
  EN_COURS: { color: 'bg-green-100 text-green-700 border-green-300', icon: PlayCircle },
  TERMINEE: { color: 'bg-gray-100 text-gray-700 border-gray-300', icon: CheckCircle },
  RAPPORT_COMPLETE: { color: 'bg-emerald-100 text-emerald-700 border-emerald-300', icon: FileText },
  ANNULEE: { color: 'bg-red-100 text-red-700 border-red-300', icon: XCircle },
  REPORTEE: { color: 'bg-amber-100 text-amber-700 border-amber-300', icon: PauseCircle },
};

const SECTEUR_COLORS: Record<string, string> = {
  EDUCATION: 'bg-blue-500',
  SANTE: 'bg-rose-500',
  SPORT: 'bg-green-500',
  SOCIAL: 'bg-purple-500',
  CULTUREL: 'bg-amber-500',
  AUTRE: 'bg-gray-500',
};

export default function AdminProgrammesActivitesPage() {
  const t = useTranslations('admin.programs_page');
  const locale = useLocale();
  const [activites, setActivites] = useState<ProgrammeActivite[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatut, setFilterStatut] = useState<string>('');
  const [filterValidation, setFilterValidation] = useState<string>('');
  const [selectedActivite, setSelectedActivite] = useState<ProgrammeActivite | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    enAttente: 0,
    validees: 0,
    terminees: 0,
    rapportsComplets: 0,
  });

  const fetchActivites = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/programmes-activites?limit=100');
      if (res.ok) {
        const data = await res.json();
        const acts = data.data || [];
        setActivites(acts);
        
        // Calculer les stats - EN_ATTENTE_VALIDATION = activités à valider
        setStats({
          total: acts.length,
          enAttente: acts.filter((a: ProgrammeActivite) => a.statut === 'EN_ATTENTE_VALIDATION').length,
          validees: acts.filter((a: ProgrammeActivite) => a.statut === 'PLANIFIEE' || a.isValideParAdmin).length,
          terminees: acts.filter((a: ProgrammeActivite) => a.statut === 'TERMINEE' || a.statut === 'RAPPORT_COMPLETE').length,
          rapportsComplets: acts.filter((a: ProgrammeActivite) => a.rapportComplete).length,
        });
      }
    } catch (error) {
      console.error('Erreur chargement activités:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActivites();
  }, [fetchActivites]);

  // Filtrer les activités
  const filteredActivites = activites.filter(a => {
    const matchSearch = !search || 
      a.titre.toLowerCase().includes(search.toLowerCase()) ||
      a.etablissement.nom.toLowerCase().includes(search.toLowerCase()) ||
      a.typeActivite.toLowerCase().includes(search.toLowerCase());
    
    const matchStatut = !filterStatut || a.statut === filterStatut;
    const matchValidation = !filterValidation || 
      (filterValidation === 'validated' ? a.isValideParAdmin : !a.isValideParAdmin);
    
    return matchSearch && matchStatut && matchValidation;
  });

  // Actions - Utiliser l'API de validation dédiée
  const handleValidate = async (id: number, validate: boolean) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/programmes-activites/${id}/valider`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: validate ? 'validate' : 'reject' }),
      });
      
      if (res.ok) {
        fetchActivites();
      } else {
        const data = await res.json();
        alert(`Erreur: ${data.error || 'Erreur inconnue'}`);
      }
    } catch (error) {
      console.error('Erreur validation:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleVisibility = async (id: number, visible: boolean) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/programmes-activites/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isVisiblePublic: visible }),
      });
      
      if (res.ok) {
        fetchActivites();
      }
    } catch (error) {
      console.error('Erreur visibilité:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const openDetail = (activite: ProgrammeActivite) => {
    setSelectedActivite(activite);
    setShowDetailModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header avec design gouvernemental */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[hsl(213,80%,20%)] via-[hsl(213,80%,28%)] to-[hsl(213,80%,35%)] p-6 text-white">
        {/* Tricolor band */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[hsl(348,83%,47%)] via-[hsl(45,93%,47%)] to-[hsl(145,63%,32%)]" />
        
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/10 backdrop-blur rounded-2xl flex items-center justify-center">
              <ClipboardList className="w-7 h-7 text-[hsl(45,93%,47%)]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{t('title')}</h1>
              <p className="text-white/70">{t('subtitle')}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Link
              href="/admin/programmes-activites/nouvelle"
              className="flex items-center gap-2 px-4 py-2 bg-[hsl(45,93%,47%)] hover:bg-[hsl(45,93%,40%)] text-black font-medium rounded-xl transition-colors shadow-lg shadow-[hsl(45,93%,47%)]/20"
            >
              <Plus className="w-4 h-4" />
              {t('create')}
            </Link>
            
            <button
              onClick={fetchActivites}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              {t('refresh')}
            </button>
          </div>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: t('stats.total'), value: stats.total, color: 'from-blue-500 to-blue-600', icon: ClipboardList },
          { label: t('stats.pending'), value: stats.enAttente, color: 'from-amber-500 to-orange-500', icon: Clock },
          { label: t('stats.validated'), value: stats.validees, color: 'from-emerald-500 to-green-600', icon: CheckCircle },
          { label: t('stats.finished'), value: stats.terminees, color: 'from-gray-500 to-gray-600', icon: Calendar },
          { label: t('stats.reports_ok'), value: stats.rapportsComplets, color: 'from-purple-500 to-violet-600', icon: FileText },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700"
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-white`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                <p className="text-xs text-gray-500">{stat.label}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 ${locale === 'ar' ? 'right-3' : 'left-3'}`} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('filters.search')}
              className={`w-full py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-[hsl(213,80%,50%)] focus:border-transparent bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white ${locale === 'ar' ? 'pr-10 pl-4 text-right' : 'pl-10 pr-4 text-left'}`}
            />
          </div>
          
          {/* Filter by status */}
          <select
            value={filterStatut}
            onChange={(e) => setFilterStatut(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-[hsl(213,80%,50%)] bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">{t('filters.all_statuses')}</option>
            <option value="BROUILLON">{t('status.draft')}</option>
            <option value="EN_ATTENTE_VALIDATION">{t('status.to_validate')}</option>
            <option value="PLANIFIEE">{t('status.planned')}</option>
            <option value="EN_COURS">{t('status.in_progress')}</option>
            <option value="TERMINEE">{t('status.finished')}</option>
            <option value="RAPPORT_COMPLETE">{t('status.report_ok')}</option>
            <option value="ANNULEE">{t('status.cancelled')}</option>
            <option value="REPORTEE">{t('status.postponed')}</option>
          </select>
          
          {/* Filter by validation */}
          <select
            value={filterValidation}
            onChange={(e) => setFilterValidation(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-[hsl(213,80%,50%)] bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">{t('filters.all_validations')}</option>
            <option value="pending">{t('filters.pending_validation')}</option>
            <option value="validated">{t('filters.validated')}</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="w-8 h-8 text-[hsl(213,80%,50%)] animate-spin" />
          </div>
        ) : filteredActivites.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <ClipboardList className="w-12 h-12 mb-4 text-gray-300" />
            <p className="font-medium">{t('empty.title')}</p>
            <p className="text-sm">{t('empty.subtitle')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <tr>
                  <th className={`px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider ${locale === 'ar' ? 'text-right' : 'text-left'}`}>{t('table.activity')}</th>
                  <th className={`px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider ${locale === 'ar' ? 'text-right' : 'text-left'}`}>{t('table.establishment')}</th>
                  <th className={`px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider ${locale === 'ar' ? 'text-right' : 'text-left'}`}>{t('table.date')}</th>
                  <th className={`px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider ${locale === 'ar' ? 'text-right' : 'text-left'}`}>{t('table.status')}</th>
                  <th className={`px-4 py-3 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider ${locale === 'ar' ? 'text-right' : 'text-left'}`}>{t('table.validation')}</th>
                  <th className={`px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider ${locale === 'ar' ? 'text-left' : 'text-right'}`}>{t('table.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filteredActivites.map((activite) => {
                  const statutConfig = STATUT_CONFIG[activite.statut] || STATUT_CONFIG.PLANIFIEE;
                  const StatusIcon = statutConfig.icon;
                  const statusKeyMap: Record<string, string> = {
                    'BROUILLON': 'draft',
                    'EN_ATTENTE_VALIDATION': 'to_validate',
                    'PLANIFIEE': 'planned',
                    'EN_COURS': 'in_progress',
                    'TERMINEE': 'finished',
                    'RAPPORT_COMPLETE': 'report_ok',
                    'ANNULEE': 'cancelled',
                    'REPORTEE': 'postponed'
                  };
                  const statusLabel = t('status.' + (statusKeyMap[activite.statut] || 'planned'));
                  
                  return (
                    <tr key={activite.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-10 rounded-full ${SECTEUR_COLORS[activite.etablissement.secteur] || SECTEUR_COLORS.AUTRE}`} />
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white line-clamp-1">{activite.titre}</p>
                            <p className="text-sm text-gray-500">{t(`types.${activite.typeActivite}`) || activite.typeActivite}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600 dark:text-gray-300">{activite.etablissement.nom}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {format(parseISO(activite.date), 'dd MMM yyyy', { locale: locale === 'ar' ? arMA : fr })}
                          </p>
                          <p className="text-xs text-gray-500">{activite.heureDebut}h - {activite.heureFin}h</p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${statutConfig.color}`}>
                          <StatusIcon className="w-3.5 h-3.5" />
                          {statusLabel}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        {activite.isValideParAdmin ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600">
                            <CheckCircle className="w-4 h-4" />
                            <span className="text-sm">{t('table.valide')}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-amber-600">
                            <Clock className="w-4 h-4" />
                            <span className="text-sm">{t('table.waiting')}</span>
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className={`flex items-center gap-2 ${locale === 'ar' ? 'justify-start' : 'justify-end'}`}>
                          <button
                            onClick={() => openDetail(activite)}
                            className="p-2 text-gray-400 hover:text-[hsl(213,80%,50%)] hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
                            title="Voir détails"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          
                          {!activite.isValideParAdmin ? (
                            <button
                              onClick={() => handleValidate(activite.id, true)}
                              disabled={actionLoading === activite.id}
                              className="p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors disabled:opacity-50"
                              title="Valider"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleValidate(activite.id, false)}
                              disabled={actionLoading === activite.id}
                              className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                              title="Retirer validation"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {showDetailModal && selectedActivite && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowDetailModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="relative bg-gradient-to-r from-[hsl(213,80%,20%)] to-[hsl(213,80%,30%)] p-6 text-white">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[hsl(348,83%,47%)] via-[hsl(45,93%,47%)] to-[hsl(145,63%,32%)]" />
                <h3 className="text-xl font-bold">{selectedActivite.titre}</h3>
                <p className="text-white/70 mt-1">{t(`types.${selectedActivite.typeActivite}`) || selectedActivite.typeActivite}</p>
              </div>
              
              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Info grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{t('modal.establishment')}</p>
                    <p className="font-medium text-gray-900 dark:text-white">{selectedActivite.etablissement.nom}</p>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{t('modal.sector')}</p>
                    <p className="font-medium text-gray-900 dark:text-white">{selectedActivite.etablissement.secteur}</p>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{t('modal.date')}</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {format(parseISO(selectedActivite.date), 'EEEE dd MMMM yyyy', { locale: locale === 'ar' ? arMA : fr })}
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{t('modal.hours')}</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {selectedActivite.heureDebut}h - {selectedActivite.heureFin}h
                    </p>
                  </div>
                  {selectedActivite.lieu && (
                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{t('modal.location')}</p>
                      <p className="font-medium text-gray-900 dark:text-white">{selectedActivite.lieu}</p>
                    </div>
                  )}
                  {selectedActivite.participantsAttendus && (
                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{t('modal.participants')}</p>
                      <p className="font-medium text-gray-900 dark:text-white">{selectedActivite.participantsAttendus}</p>
                    </div>
                  )}
                </div>
                
                {/* Status badges */}
                <div className="flex flex-wrap gap-3">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border ${STATUT_CONFIG[selectedActivite.statut]?.color || ''}`}>
                    {t('status.' + (
                      {
                        'BROUILLON': 'draft',
                        'EN_ATTENTE_VALIDATION': 'to_validate',
                        'PLANIFIEE': 'planned',
                        'EN_COURS': 'in_progress',
                        'TERMINEE': 'finished',
                        'RAPPORT_COMPLETE': 'report_ok',
                        'ANNULEE': 'cancelled',
                        'REPORTEE': 'postponed'
                      }[selectedActivite.statut] || 'planned'
                    ))}
                  </span>
                  {selectedActivite.isValideParAdmin ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">
                      <CheckCircle className="w-4 h-4" />
                      {t('modal.validated_by_admin')}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 text-amber-700 rounded-full text-sm font-medium">
                      <Clock className="w-4 h-4" />
                      {t('modal.waiting_validation')}
                    </span>
                  )}
                  {selectedActivite.isVisiblePublic && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                      <Eye className="w-4 h-4" />
                      {t('modal.visible_public')}
                    </span>
                  )}
                </div>
                
                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-600">
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 dark:text-gray-200 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    {t('modal.close')}
                  </button>
                  {!selectedActivite.isValideParAdmin ? (
                    <button
                      onClick={() => {
                        handleValidate(selectedActivite.id, true);
                        setShowDetailModal(false);
                      }}
                      className="flex-1 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl hover:shadow-lg transition-all"
                    >
                      {t('modal.validate')}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleToggleVisibility(selectedActivite.id, !selectedActivite.isVisiblePublic)}
                      className="flex-1 px-4 py-2.5 bg-gradient-to-r from-[hsl(213,80%,50%)] to-[hsl(213,80%,40%)] text-white rounded-xl hover:shadow-lg transition-all"
                    >
                      {selectedActivite.isVisiblePublic ? t('modal.hide') : t('modal.show')}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
