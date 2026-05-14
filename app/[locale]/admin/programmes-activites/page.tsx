'use client';

import { Link } from '@/i18n/navigation';
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
  Trash2,
  Loader2,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { fr, arMA } from 'date-fns/locale';
import { useTranslations, useLocale } from 'next-intl';
import { toast } from 'sonner';

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

const STATUT_CONFIG: Record<string, { color: string; icon: React.ElementType; label: string }> = {
  BROUILLON: { color: 'hsl(var(--gov-muted))', icon: FileText, label: 'draft' },
  EN_ATTENTE_VALIDATION: { color: 'hsl(var(--gov-red))', icon: Clock, label: 'to_validate' },
  PLANIFIEE: { color: 'hsl(var(--gov-blue))', icon: Calendar, label: 'planned' },
  EN_COURS: { color: 'hsl(var(--gov-green))', icon: PlayCircle, label: 'in_progress' },
  TERMINEE: { color: 'hsl(var(--gov-muted))', icon: CheckCircle, label: 'finished' },
  RAPPORT_COMPLETE: { color: 'hsl(var(--gov-green))', icon: FileText, label: 'report_ok' },
  ANNULEE: { color: 'hsl(var(--gov-red))', icon: XCircle, label: 'cancelled' },
  REPORTEE: { color: 'hsl(var(--gov-yellow))', icon: PauseCircle, label: 'postponed' },
};

const SECTEUR_COLORS: Record<string, string> = {
  EDUCATION: 'hsl(var(--gov-blue))',
  SANTE: 'hsl(var(--gov-red))',
  SPORT: 'hsl(var(--gov-green))',
  SOCIAL: 'hsl(var(--gov-purple))',
  CULTUREL: 'hsl(var(--gov-yellow))',
  AUTRE: 'hsl(var(--gov-muted))',
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
    const promise = new Promise(async (resolve, reject) => {
      try {
        const res = await fetch(`/api/programmes-activites/${id}/valider`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: validate ? 'validate' : 'reject' }),
        });
        
        if (res.ok) {
          fetchActivites();
          resolve(true);
        } else {
          const data = await res.json();
          reject(new Error(data.error || 'Erreur inconnue'));
        }
      } catch (error) {
        reject(new Error('Erreur de connexion'));
      }
    });

    toast.promise(promise, {
      loading: validate ? 'Validation en cours...' : 'Annulation de la validation...',
      success: validate ? 'Programme validé avec succès' : 'Validation annulée',
      error: (err) => err.message,
    });
  };

  const handleToggleVisibility = async (id: number, visible: boolean) => {
    const promise = new Promise(async (resolve, reject) => {
      try {
        const res = await fetch(`/api/programmes-activites/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isVisiblePublic: visible }),
        });
        
        if (res.ok) {
          fetchActivites();
          resolve(true);
        } else {
          reject(new Error('Erreur lors du changement de visibilité'));
        }
      } catch (error) {
        reject(new Error('Erreur de connexion'));
      }
    });

    toast.promise(promise, {
      loading: 'Mise à jour de la visibilité...',
      success: visible ? 'Programme désormais visible' : 'Programme masqué',
      error: (err) => err.message,
    });
  };

  const openDetail = (activite: ProgrammeActivite) => {
    setSelectedActivite(activite);
    setShowDetailModal(true);
  };

  return (
  return (
    <div className="space-y-8 max-w-[1600px] mx-auto pb-20">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-[hsl(var(--gov-blue))/0.1] rounded-2xl flex items-center justify-center border border-[hsl(var(--gov-blue))/0.2]">
              <ClipboardList className="text-[hsl(var(--gov-blue))] w-6 h-6" />
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground">
              {t('title')}
            </h1>
          </div>
          <p className="text-muted-foreground font-medium text-lg ml-15">
            {t('subtitle')}
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={fetchActivites}
            disabled={loading}
            className="w-12 h-12 flex items-center justify-center bg-card border border-border rounded-2xl hover:bg-muted hover:border-muted-foreground/30 transition-all shadow-sm group disabled:opacity-50"
          >
            <RefreshCw size={20} className={`text-muted-foreground group-hover:text-foreground transition-colors ${loading ? 'animate-spin' : ''}`} />
          </button>
          
          <Link
            href="/admin/programmes-activites/nouvelle"
            className="gov-btn-primary h-12 px-8 rounded-2xl text-xs uppercase tracking-widest font-bold"
          >
            <Plus size={18} />
            {t('create')}
          </Link>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        {[
          { label: t('stats.total'), value: stats.total, icon: ClipboardList, color: 'hsl(var(--gov-muted))' },
          { label: t('stats.pending'), value: stats.enAttente, icon: Clock, color: 'hsl(var(--gov-red))', highlight: true },
          { label: t('stats.validated'), value: stats.validees, icon: CheckCircle, color: 'hsl(var(--gov-blue))' },
          { label: t('stats.finished'), value: stats.terminees, icon: Calendar, color: 'hsl(var(--gov-green))' },
          { label: t('stats.reports_ok'), value: stats.rapportsComplets, icon: FileText, color: 'hsl(var(--gov-green))' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`gov-stat-card group relative overflow-hidden ${stat.highlight && stat.value > 0 ? 'ring-2 ring-[hsl(var(--gov-red))/0.3]' : ''}`}
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
                {stat.highlight && stat.value > 0 && (
                  <span className="w-2 h-2 rounded-full bg-[hsl(var(--gov-red))] animate-ping" />
                )}
              </div>
              <p className="text-3xl font-black text-foreground mb-1 tracking-tight">{stat.value}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{stat.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-card border border-border rounded-3xl p-6 shadow-xl shadow-[hsl(var(--gov-blue))/0.02]">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Search */}
          <div className="relative group">
            <Search className={`absolute top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-[hsl(var(--gov-blue))] transition-colors ${locale === 'ar' ? 'right-4' : 'left-4'}`} size={18} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('filters.search')}
              className="gov-input pl-12 h-12 text-sm font-medium"
            />
          </div>
          
          {/* Filter by status */}
          <div className="relative">
            <select
              value={filterStatut}
              onChange={(e) => setFilterStatut(e.target.value)}
              className="gov-input h-12 text-sm font-medium appearance-none cursor-pointer"
            >
              <option value="">{t('filters.all_statuses')}</option>
              {Object.keys(STATUT_CONFIG).map(key => (
                <option key={key} value={key}>{t(`status.${STATUT_CONFIG[key].label}`)}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          </div>
          
          {/* Filter by validation */}
          <div className="relative">
            <select
              value={filterValidation}
              onChange={(e) => setFilterValidation(e.target.value)}
              className="gov-input h-12 text-sm font-medium appearance-none cursor-pointer"
            >
              <option value="">{t('filters.all_validations')}</option>
              <option value="pending">{t('filters.pending_validation')}</option>
              <option value="validated">{t('filters.validated')}</option>
            </select>
            <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-xl shadow-[hsl(var(--gov-blue))/0.05]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-12 h-12 border-4 border-[hsl(var(--gov-blue))/0.1] border-t-[hsl(var(--gov-blue))] rounded-full animate-spin" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground animate-pulse">Chargement des activités...</p>
          </div>
        ) : filteredActivites.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center px-8">
            <div className="w-20 h-20 bg-muted rounded-3xl flex items-center justify-center mb-6 border border-border shadow-inner">
              <ClipboardList className="w-10 h-10 text-muted-foreground/30" />
            </div>
            <h3 className="text-xl font-extrabold text-foreground mb-2">{t('empty.title')}</h3>
            <p className="text-muted-foreground max-w-md mx-auto text-sm">{t('empty.subtitle')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="gov-table">
              <thead>
                <tr className="bg-muted/30">
                  <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground whitespace-nowrap">{t('table.activity')}</th>
                  <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground whitespace-nowrap">{t('table.establishment')}</th>
                  <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground whitespace-nowrap">{t('table.date')}</th>
                  <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground whitespace-nowrap">{t('table.status')}</th>
                  <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground whitespace-nowrap">{t('table.validation')}</th>
                  <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-right whitespace-nowrap">{t('table.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredActivites.map((activite) => {
                  const statutConfig = STATUT_CONFIG[activite.statut] || STATUT_CONFIG.PLANIFIEE;
                  const StatusIcon = statutConfig.icon;
                  const statusLabel = t('status.' + statutConfig.label);
                  
                  return (
                    <tr key={activite.id} className="group hover:bg-muted/50 transition-colors">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div 
                            className="w-1.5 h-12 rounded-full flex-shrink-0" 
                            style={{ backgroundColor: SECTEUR_COLORS[activite.etablissement.secteur] || SECTEUR_COLORS.AUTRE }} 
                          />
                          <div>
                            <p className="font-extrabold text-foreground group-hover:text-[hsl(var(--gov-blue))] transition-colors leading-tight line-clamp-1">{activite.titre}</p>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-60 mt-0.5">{t(`types.${activite.typeActivite}`) || activite.typeActivite}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center border border-border shadow-inner">
                            <Building2 size={14} className="text-muted-foreground/60" />
                          </div>
                          <span className="text-sm font-bold text-foreground line-clamp-1">{activite.etablissement.nom}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-foreground">
                            <Calendar size={14} className="text-[hsl(var(--gov-blue))]" />
                            <span className="text-sm font-black">
                              {format(parseISO(activite.date), 'dd MMM yyyy', { locale: locale === 'ar' ? arMA : fr })}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock size={12} />
                            <span className="text-[10px] font-bold uppercase tracking-widest">{activite.heureDebut}h - {activite.heureFin}h</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span 
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm"
                          style={{ backgroundColor: `${statutConfig.color}10`, color: statutConfig.color, borderColor: `${statutConfig.color}20` }}
                        >
                          <StatusIcon size={12} />
                          {statusLabel}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        {activite.isValideParAdmin ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[hsl(var(--gov-green))/0.1] text-[hsl(var(--gov-green))] rounded-full text-[10px] font-black uppercase tracking-widest border border-[hsl(var(--gov-green))/0.2]">
                            <CheckCircle size={12} />
                            {t('table.valide')}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[hsl(var(--gov-red))/0.1] text-[hsl(var(--gov-red))] rounded-full text-[10px] font-black uppercase tracking-widest border border-[hsl(var(--gov-red))/0.2] animate-pulse">
                            <Clock size={12} />
                            {t('table.waiting')}
                          </span>
                        )}
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openDetail(activite)}
                            className="w-9 h-9 flex items-center justify-center bg-card border border-border text-muted-foreground hover:text-[hsl(var(--gov-blue))] hover:bg-[hsl(var(--gov-blue))/0.05] hover:border-[hsl(var(--gov-blue))/0.2] rounded-xl transition-all shadow-sm"
                            title="Voir détails"
                          >
                            <Eye size={16} />
                          </button>
                          
                          <button
                            onClick={async () => {
                              if (confirm('Voulez-vous vraiment supprimer ce programme ?')) {
                                const promise = new Promise(async (resolve, reject) => {
                                  try {
                                    const res = await fetch(`/api/programmes-activites/${activite.id}`, { method: 'DELETE' });
                                    if (res.ok) {
                                      fetchActivites();
                                      resolve(true);
                                    } else {
                                      reject(new Error('Erreur lors de la suppression'));
                                    }
                                  } catch (e) {
                                    reject(new Error('Erreur de connexion'));
                                  }
                                });

                                toast.promise(promise, {
                                  loading: 'Suppression en cours...',
                                  success: 'Programme supprimé',
                                  error: (err) => err.message,
                                });
                              }
                            }}
                            className="w-9 h-9 flex items-center justify-center bg-card border border-border text-muted-foreground hover:text-[hsl(var(--gov-red))] hover:bg-[hsl(var(--gov-red))/0.05] hover:border-[hsl(var(--gov-red))/0.2] rounded-xl transition-all shadow-sm"
                            title="Supprimer"
                          >
                            <Trash2 size={16} />
                          </button>
                          
                          <div className="w-px h-6 bg-border mx-1" />
                          
                          {!activite.isValideParAdmin ? (
                            <button
                              onClick={() => handleValidate(activite.id, true)}
                              disabled={actionLoading === activite.id}
                              className="w-9 h-9 flex items-center justify-center bg-[hsl(var(--gov-green))/0.1] text-[hsl(var(--gov-green))] border border-[hsl(var(--gov-green))/0.2] hover:bg-[hsl(var(--gov-green))] hover:text-white rounded-xl transition-all shadow-sm disabled:opacity-50"
                              title="Valider"
                            >
                              <CheckCircle size={16} />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleValidate(activite.id, false)}
                              disabled={actionLoading === activite.id}
                              className="w-9 h-9 flex items-center justify-center bg-[hsl(var(--gov-red))/0.1] text-[hsl(var(--gov-red))] border border-[hsl(var(--gov-red))/0.2] hover:bg-[hsl(var(--gov-red))] hover:text-white rounded-xl transition-all shadow-sm disabled:opacity-50"
                              title="Retirer validation"
                            >
                              <XCircle size={16} />
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

      {/* Detail Modal (Institutional Sidebar) */}
      <AnimatePresence>
        {showDetailModal && selectedActivite && (
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
                    {t('modal.title') || 'Détails de l\'activité'}
                  </h2>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">
                    Gestion du programme institutionnel
                  </p>
                </div>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="p-2.5 hover:bg-muted rounded-xl transition-colors border border-transparent hover:border-border text-muted-foreground hover:text-foreground"
                >
                  <RefreshCw size={20} className="rotate-45" />
                </button>
              </div>
 
              {/* Content */}
              <div className="p-8 space-y-10">
                {/* Header Profile */}
                <div className="flex items-center gap-6">
                  <div 
                    className="w-20 h-20 rounded-3xl flex items-center justify-center text-white border border-white/10 shadow-lg group-hover:scale-105 transition-transform"
                    style={{ backgroundColor: SECTEUR_COLORS[selectedActivite.etablissement.secteur] || SECTEUR_COLORS.AUTRE }}
                  >
                    <ClipboardList className="w-10 h-10" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-foreground mb-1 leading-tight">
                      {selectedActivite.titre}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 bg-muted rounded-full text-[9px] font-bold uppercase tracking-widest text-muted-foreground border border-border">
                        {t(`types.${selectedActivite.typeActivite}`) || selectedActivite.typeActivite}
                      </span>
                      <span className="px-3 py-1 bg-[hsl(var(--gov-blue))/0.1] text-[hsl(var(--gov-blue))] rounded-full text-[9px] font-bold uppercase tracking-widest border border-[hsl(var(--gov-blue))/0.2]">
                        {selectedActivite.etablissement.secteur}
                      </span>
                    </div>
                  </div>
                </div>
 
                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-6 bg-muted/30 rounded-3xl border border-border/50">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-2 opacity-60">Établissement</p>
                    <p className="text-sm font-black text-foreground leading-tight">
                      {selectedActivite.etablissement.nom}
                    </p>
                  </div>
                  <div className="p-6 bg-muted/30 rounded-3xl border border-border/50">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-2 opacity-60">Date prévue</p>
                    <p className="text-sm font-black text-foreground leading-tight">
                      {format(parseISO(selectedActivite.date), 'EEEE dd MMMM yyyy', { locale: locale === 'ar' ? arMA : fr })}
                    </p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-40 mt-1">
                      {selectedActivite.heureDebut}h - {selectedActivite.heureFin}h
                    </p>
                  </div>
                </div>
 
                {/* Details Section */}
                <div className="space-y-4">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-foreground flex items-center gap-2">
                    <div className="w-1.5 h-4 bg-[hsl(var(--gov-blue))] rounded-full" />
                    Informations Complémentaires
                  </h4>
                  <div className="grid grid-cols-1 gap-3">
                    {selectedActivite.lieu && (
                      <div className="flex items-center gap-4 p-4 bg-muted/20 rounded-2xl border border-border/50">
                        <div className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center text-[hsl(var(--gov-red))]">
                          <MapPin size={18} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground opacity-60">Lieu de l'activité</span>
                          <span className="text-sm font-bold text-foreground">{selectedActivite.lieu}</span>
                        </div>
                      </div>
                    )}
                    {selectedActivite.participantsAttendus && (
                      <div className="flex items-center gap-4 p-4 bg-muted/20 rounded-2xl border border-border/50">
                        <div className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center text-[hsl(var(--gov-blue))]">
                          <Users size={18} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground opacity-60">Participants Attendus</span>
                          <span className="text-sm font-bold text-foreground">{selectedActivite.participantsAttendus} personnes</span>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-4 p-4 bg-muted/20 rounded-2xl border border-border/50">
                      <div className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center text-[hsl(var(--gov-muted))]">
                        <RefreshCw size={18} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground opacity-60">Statut Actuel</span>
                        <span 
                          className="text-sm font-black uppercase tracking-widest"
                          style={{ color: STATUT_CONFIG[selectedActivite.statut]?.color || 'inherit' }}
                        >
                          {t('status.' + (STATUT_CONFIG[selectedActivite.statut]?.label || 'planned'))}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
 
                {/* Actions */}
                <div className="space-y-4 pt-10 border-t border-border">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-foreground flex items-center gap-2">
                    <div className="w-1.5 h-4 bg-[hsl(var(--gov-green))] rounded-full" />
                    Actions Administratives
                  </h4>
                  <div className="grid grid-cols-1 gap-4">
                    {!selectedActivite.isValideParAdmin ? (
                      <button
                        onClick={() => {
                          handleValidate(selectedActivite.id, true);
                          setShowDetailModal(false);
                        }}
                        className="w-full flex items-center justify-between p-5 bg-[hsl(var(--gov-green))/0.05] text-[hsl(var(--gov-green))] border border-[hsl(var(--gov-green))/0.2] rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-[hsl(var(--gov-green))] hover:text-white transition-all shadow-sm group"
                      >
                        <div className="flex items-center gap-3">
                          <CheckCircle size={18} />
                          {t('modal.validate')}
                        </div>
                        <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleToggleVisibility(selectedActivite.id, !selectedActivite.isVisiblePublic)}
                        className={`w-full flex items-center justify-between p-5 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all border ${
                          selectedActivite.isVisiblePublic
                            ? 'bg-[hsl(var(--gov-red))/0.05] text-[hsl(var(--gov-red))] border-[hsl(var(--gov-red))/0.2] hover:bg-[hsl(var(--gov-red))] hover:text-white'
                            : 'bg-[hsl(var(--gov-blue))/0.05] text-[hsl(var(--gov-blue))] border-[hsl(var(--gov-blue))/0.2] hover:bg-[hsl(var(--gov-blue))] hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {selectedActivite.isVisiblePublic ? <XCircle size={18} /> : <Eye size={18} />}
                          {selectedActivite.isVisiblePublic ? t('modal.hide') : t('modal.show')}
                        </div>
                        <ChevronRight size={16} />
                      </button>
                    )}
 
                    <button
                      onClick={() => setShowDetailModal(false)}
                      className="w-full px-6 py-4 bg-muted text-muted-foreground rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-muted/80 transition-all border border-transparent hover:border-border"
                    >
                      {t('modal.close')}
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
