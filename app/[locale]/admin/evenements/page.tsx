'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from '@/i18n/navigation';
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
  Trash2,
  Star,
  X,
  Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useTranslations, useLocale } from 'next-intl';
import EmptyState from '@/components/ui/EmptyState';
import { GovButton } from '@/components/ui/GovButton';
import { GovKpiCard, GovKpiGrid } from '@/components/ui/GovKpiCard';
import { GovTable, GovTh, GovTd, GovTr } from '@/components/ui/GovTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { GovInput, GovSelect, GovModal, GovPageHeader } from '@/components/ui';
import { cn, decodeHtmlEntities } from '@/lib/utils';
import { useData } from '@/hooks/use-data';
import { useMutation } from '@/hooks/use-mutation';

interface Evenement {
  id: number;
  titre: string;
  description: string;
  secteur: string;
  typeCategorique: string;
  dateDebut: string;
  dateFin: string | null;
  heureDebut?: string | null;
  heureFin?: string | null;
  lieu: string | null;
  statut: string;
  isMisEnAvant: boolean;
  nombreVues: number;
  nombreInscrits: number;
  capaciteMax: number | null;
  createdAt: string;
  commune: { id: number; nom: string; nomArabe?: string };
  etablissement: { id: number; nom: string; nomArabe?: string } | null;
  lieuEtablissement: { id: number; nom: string; nomArabe?: string; secteur: string } | null;
  createdByUser: { nom: string; prenom: string } | null;
  isOrganiseParProvince?: boolean;
  sousCouvertProvince?: boolean;
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
  PUBLIEE: { color: 'text-gov-green-dark', bg: 'bg-gov-green/5', icon: CheckCircle },
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

import { Suspense } from 'react';

// ... (keep existing imports, but move AdminEvenementsPage logic to AdminEvenementsContent)

function AdminEvenementsContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const t = useTranslations('admin.events_page');
  const tSectors = useTranslations('admin.users_page.sectors');
  const tModal = useTranslations('admin.common_modal');
  const locale = useLocale();
  
  const [refreshing, setRefreshing] = useState(false);
  
  // Pagination
  const [page, setPage] = useState(1);
  
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
  


  const actionMutation = useMutation();

  // Modal création et détails
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedEvenement, setSelectedEvenement] = useState<Evenement | null>(null);
  const [showDeleteId, setShowDeleteId] = useState<number | null>(null);
  const [showRejectModal, setShowRejectModal] = useState<number | null>(null);
  const [motifRejet, setMotifRejet] = useState('');

  // Vérifier authentification
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Charger communes
  const { data: communesData } = useData('/api/map/communes');
  const communes = communesData?.communes || [];

  // Charger les événements
  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    params.set('page', page.toString());
    params.set('limit', '15');
    if (filters.search) params.set('search', filters.search);
    if (filters.statut) params.set('statut', filters.statut);
    if (filters.secteur) params.set('secteur', filters.secteur);
    if (filters.communeId) params.set('communeId', filters.communeId);
    return params;
  }, [page, filters]);
  
  const { data: evenementsData, isLoading: loading, mutate: loadEvenements } = useData(`/api/evenements?${queryParams.toString()}`);

  // /api/evenements returns successResponse({data: evenements[], pagination})
  // → SWR: { success, data: { data: evenements[], pagination } } (double-nested)
  const evenements: Evenement[] = Array.isArray(evenementsData?.data?.data)
    ? evenementsData.data.data
    : Array.isArray(evenementsData?.data)
      ? evenementsData.data
      : [];
  const totalPages = evenementsData?.data?.pagination?.totalPages || evenementsData?.pagination?.totalPages || 1;
  const total = evenementsData?.data?.pagination?.total || evenementsData?.pagination?.total || 0;

  const stats = useMemo(() => {
    const allEvts: Evenement[] = Array.isArray(evenementsData?.data?.data)
      ? evenementsData.data.data
      : Array.isArray(evenementsData?.data)
        ? evenementsData.data
        : [];
    return {
      total: evenementsData?.data?.pagination?.total || evenementsData?.pagination?.total || 0,
      enAttente: allEvts.filter((e: Evenement) => e.statut === 'EN_ATTENTE_VALIDATION').length,
      publiees: allEvts.filter((e: Evenement) => e.statut === 'PUBLIEE').length,
      enCours: allEvts.filter((e: Evenement) => e.statut === 'EN_ACTION').length,
      cloturees: allEvts.filter((e: Evenement) => e.statut === 'CLOTUREE').length,
    };
  }, [evenementsData]);

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
  const handleValidation = async (id: number, action: 'valider' | 'rejeter', motif?: string) => {
    if (action === 'rejeter' && !motif) {
      setShowRejectModal(id);
      return;
    }

    const promise = new Promise(async (resolve, reject) => {
      try {
        await actionMutation.mutate(`/api/evenements/${id}/valider`, {
          method: 'PATCH',
          data: {
            decision: action === 'valider' ? 'PUBLIEE' : 'REJETEE',
            motifRejet: motif,
          },
        });
        
        await loadEvenements();
        setShowRejectModal(null);
        setMotifRejet('');
        resolve(true);
      } catch (error: unknown) {
        reject(new Error(error instanceof Error ? error.message : t('messages.error')));
      }
    });

    toast.promise(promise, {
      loading: action === 'valider' ? tModal('validating') : tModal('rejecting'),
      success: action === 'valider' ? t('messages.validated') : t('messages.rejected'),
      error: (err) => err.message,
    });
  };

  const handleDelete = async (id: number) => {
    if (showDeleteId !== id) {
      setShowDeleteId(id);
      return;
    }
    setShowDeleteId(null);

    const promise = new Promise(async (resolve, reject) => {
      try {
        await actionMutation.mutate(`/api/evenements/${id}`, { method: 'DELETE' });
        await loadEvenements();
        resolve(true);
      } catch (e: unknown) {
        reject(new Error(e instanceof Error ? e.message : 'Erreur lors de la suppression'));
      }
    });

    toast.promise(promise, {
      loading: tModal('deleting'),
      success: tModal('deleted'),
      error: (err) => err.message,
    });
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
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[hsl(var(--gov-blue))/0.1] border-t-[hsl(var(--gov-blue))] rounded-full animate-spin" />
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground animate-pulse">
            {t('loading') || 'Chargement des événements...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto pb-20">
      {/* Header */}
      <GovPageHeader
        title={t('title')}
        subtitle={t('subtitle')}
        icon={<Calendar className="w-8 h-8" />}
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <GovButton
            onClick={async () => {
              setRefreshing(true);
              await loadEvenements();
              setRefreshing(false);
            }}
            disabled={refreshing || loading}
            variant="outline"
            size="icon"
            loading={refreshing || loading}
            title={t('refresh')}
          >
            <RefreshCw size={16} />
          </GovButton>
          <GovButton
            onClick={() => setShowFilters(!showFilters)}
            variant={showFilters ? "primary" : "outline"}
            leftIcon={<Filter size={16} />}
            className={showFilters ? "shadow-lg shadow-[hsl(var(--gov-blue))/0.2]" : ""}
          >
            {t('filters')}
          </GovButton>
          <GovButton
            onClick={() => setShowCreateModal(true)}
            variant="primary"
            leftIcon={<Plus size={18} />}
            className="shadow-lg shadow-[hsl(var(--gov-blue))/0.2]"
          >
            {t('create')}
          </GovButton>
          </div>
        }
      />

      {/* Stats Cards */}
      <GovKpiGrid cols={5}>
        <GovKpiCard
          index={0}
          label={t('stats.total')}
          value={stats.total}
          icon={Calendar}
          variant="blue"
        />
        <GovKpiCard
          index={1}
          label={t('stats.pending')}
          value={stats.enAttente}
          icon={Clock}
          variant="red"
        />
        <GovKpiCard
          index={2}
          label={t('stats.published')}
          value={stats.publiees}
          icon={CheckCircle}
          variant="green"
        />
        <GovKpiCard
          index={3}
          label={t('stats.in_progress')}
          value={stats.enCours}
          icon={Play}
          variant="blue"
        />
        <GovKpiCard
          index={4}
          label={t('stats.closed')}
          value={stats.cloturees}
          icon={Archive}
          variant="muted"
        />
      </GovKpiGrid>

      {/* Filtres avancés */}
      <AnimatePresence>
        {showFilters && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-card/50 backdrop-blur-xl border border-border rounded-[2.5rem] p-10 shadow-2xl shadow-[hsl(var(--gov-blue))/0.05] mb-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {/* Recherche */}
                <GovInput
                  label={t('filter_labels.search')}
                  placeholder={t('filter_labels.search_placeholder') || 'Rechercher...'}
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  leftIcon={<Search size={18} />}
                />

                {/* Statut */}
                <GovSelect
                  label={t('filter_labels.statut')}
                  value={filters.statut}
                  onChange={(e) => setFilters({ ...filters, statut: e.target.value })}
                  leftIcon={<Filter size={18} />}
                  options={[
                    { label: t('filter_labels.all_statuses'), value: "" },
                    { label: t('status.pending'), value: "EN_ATTENTE_VALIDATION" },
                    { label: t('status.published'), value: "PUBLIEE" },
                    { label: t('status.in_progress'), value: "EN_ACTION" },
                    { label: t('status.closed'), value: "CLOTUREE" },
                    { label: t('status.rejected'), value: "REJETEE" }
                  ]}
                />

                {/* Secteur */}
                <GovSelect
                  label={t('filter_labels.secteur')}
                  value={filters.secteur}
                  onChange={(e) => setFilters({ ...filters, secteur: e.target.value })}
                  leftIcon={<Building2 size={18} />}
                  options={[
                    { label: t('filter_labels.all_sectors'), value: "" },
                    ...SECTEURS.map(s => ({
                      label: tSectors(s),
                      value: s
                    }))
                  ]}
                />

                {/* Commune */}
                <GovSelect
                  label={t('filter_labels.commune')}
                  value={filters.communeId}
                  onChange={(e) => setFilters({ ...filters, communeId: e.target.value })}
                  leftIcon={<MapPin size={18} />}
                  options={[
                    { label: t('filter_labels.all_muncipalities'), value: "" },
                    ...communes.map((c: { id: number; nom: string; nomArabe?: string }) => ({
                      label: locale === 'ar' ? (c.nomArabe || c.nom) : c.nom,
                      value: c.id.toString()
                    }))
                  ]}
                />
              </div>

              <div className="flex justify-end mt-10 pt-8 border-t border-border/50">
                <GovButton
                  onClick={resetFilters}
                  variant="outline"
                  size="sm"
                  leftIcon={<RefreshCw size={14} />}
                  className="rounded-full px-8"
                >
                  {t('filter_labels.reset')}
                </GovButton>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Table Section */}
      <div className="mb-6 space-y-4">
        {/* Vue Desktop: Tableau */}
        <div className="hidden md:block overflow-x-auto custom-scrollbar bg-card rounded-2xl shadow-sm border border-border">
          <GovTable>
        <thead>
          <tr>
            <GovTh>{t('table.event')}</GovTh>
            <GovTh>{t('table.sector')}</GovTh>
            <GovTh>{t('table.location')}</GovTh>
            <GovTh>{t('table.date')}</GovTh>
            <GovTh>{t('table.status')}</GovTh>
            <GovTh>{t('table.registrations')}</GovTh>
            <GovTh className="text-right">{t('table.actions')}</GovTh>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
          {(Array.isArray(evenements) ? evenements : []).map((evenement: Evenement) => {
            const statutKey = statusKeyMap[evenement.statut] || 'pending';
            const statutBadgeMap: Record<string, string> = {
              pending: 'gold',
              published: 'green',
              in_progress: 'blue',
              closed: 'muted',
              rejected: 'red'
            };
            const StatutIcon = STATUT_CONFIG[evenement.statut]?.icon || Clock;
            const secteurLabel = tSectors(evenement.secteur);
            
            return (
              <GovTr key={evenement.id}>
                <GovTd>
                  <div className="flex flex-col">
                    <p className="font-extrabold text-foreground group-hover:text-[hsl(var(--gov-blue))] transition-colors leading-tight mb-1">
                      {evenement.titre}
                    </p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">{evenement.typeCategorique}</p>
                  </div>
                </GovTd>
                <GovTd>
                  <span className="px-3 py-1 bg-muted rounded-full text-[10px] font-bold uppercase tracking-widest text-muted-foreground border border-border">
                    {secteurLabel}
                  </span>
                </GovTd>
                <GovTd>
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <MapPin size={14} className="text-[hsl(var(--gov-red))]" />
                    <span className="line-clamp-1">
                      {evenement.lieu || (locale === 'ar' ? (evenement.commune?.nomArabe || evenement.commune?.nom) : evenement.commune?.nom) || '-'}
                    </span>
                  </div>
                </GovTd>
                <GovTd>
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Calendar size={14} className="text-[hsl(var(--gov-blue))]" />
                    {new Date(evenement.dateDebut).toLocaleDateString(locale === 'ar' ? 'ar-MA' : 'fr-FR')}
                  </div>
                </GovTd>
                <GovTd>
                  <StatusBadge status={evenement.statut} animate={evenement.statut === 'EN_ATTENTE_VALIDATION'} />
                </GovTd>
                <GovTd>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center border border-border">
                      <Users size={14} className="text-muted-foreground" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-foreground">
                        {evenement.nombreInscrits}
                      </span>
                      {evenement.capaciteMax && (
                        <span className="text-[10px] font-bold uppercase text-muted-foreground/60 tracking-tighter">
                          Max {evenement.capaciteMax}
                        </span>
                      )}
                    </div>
                  </div>
                </GovTd>
                <GovTd className="text-right">
                  {/* Actions toujours visibles sur mobile */}
                  <div className="flex items-center justify-end gap-1">
                    <GovButton
                      onClick={() => { setSelectedEvenement(evenement); setShowDetailModal(true); }}
                      variant="outline"
                      size="icon"
                      title={t('actions.view')}
                      aria-label={t('actions.view')}
                    >
                      <Eye size={16} />
                    </GovButton>
                    
                    {evenement.statut !== 'CLOTUREE' && (
                      <GovButton
                        asChild
                        variant="outline"
                        size="icon"
                        title={t('actions.edit')}
                        className="text-gov-gold hover:bg-gov-gold/5 hover:border-gov-gold/30"
                      >
                        <Link href={`/admin/evenements/${evenement.id}/modifier`}>
                          <Edit2 size={16} />
                        </Link>
                      </GovButton>
                    )}

                    {evenement.statut === 'EN_ATTENTE_VALIDATION' && (
                      <>
                        <GovButton
                          onClick={() => handleValidation(evenement.id, 'valider')}
                          variant="outline"
                          size="icon"
                          title={t('actions.validate')}
                          aria-label={t('actions.validate')}
                          className="text-[hsl(var(--gov-green))] hover:bg-[hsl(var(--gov-green))] hover:text-white"
                        >
                          <CheckCircle size={16} />
                        </GovButton>
                        <GovButton
                          onClick={() => handleValidation(evenement.id, 'rejeter')}
                          variant="outline"
                          size="icon"
                          title={t('actions.reject')}
                          aria-label={t('actions.reject')}
                          className="text-[hsl(var(--gov-red))] hover:bg-[hsl(var(--gov-red))] hover:text-white"
                        >
                          <XCircle size={16} />
                        </GovButton>
                      </>
                    )}
                    
                    <GovButton
                      onClick={() => handleDelete(evenement.id)}
                      variant="outline"
                      size="icon"
                      title={tModal('delete')}
                      aria-label={tModal('delete')}
                      className="hover:text-[hsl(var(--gov-red))] hover:bg-[hsl(var(--gov-red))/0.05]"
                    >
                      <Trash2 size={16} />
                    </GovButton>
                  </div>
                </GovTd>
              </GovTr>
            );
          })}
        </tbody>
      </GovTable>
      </div>

      {/* Vue Mobile: Cartes Empilées */}
      {evenements.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:hidden">
          {(Array.isArray(evenements) ? evenements : []).map((evenement: Evenement) => {
            const statutKey = statusKeyMap[evenement.statut] || 'pending';
            const secteurLabel = tSectors(evenement.secteur);
            
            return (
              <div 
                key={evenement.id} 
                className="gov-card p-5 bg-card/80 backdrop-blur-xl border border-border rounded-2xl flex flex-col gap-4 shadow-sm"
              >
                {/* En-tête: Statut & Inscrits */}
                <div className="flex items-start justify-between gap-2">
                  <StatusBadge status={evenement.statut} animate={evenement.statut === 'EN_ATTENTE_VALIDATION'} />
                  <div className="flex items-center gap-1.5 bg-muted px-2 py-1 rounded-lg border border-border shrink-0">
                    <Users size={12} className="text-muted-foreground" />
                    <span className="text-xs font-black text-foreground">{evenement.nombreInscrits}</span>
                    {evenement.capaciteMax && (
                      <span className="text-[10px] text-muted-foreground">/ {evenement.capaciteMax}</span>
                    )}
                  </div>
                </div>

                {/* Titre & Catégorie */}
                <div>
                  <h3 className="text-sm font-bold text-foreground line-clamp-2">{evenement.titre}</h3>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="px-2 py-1 bg-muted rounded-md text-[10px] font-bold uppercase tracking-widest text-muted-foreground border border-border inline-block">
                      {secteurLabel}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">{evenement.typeCategorique}</span>
                  </div>
                </div>

                {/* Date & Lieu */}
                <div className="grid grid-cols-2 gap-2 py-3 border-y border-border/50">
                  <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <Calendar size={14} className="text-[hsl(var(--gov-blue))] shrink-0" />
                    <span className="truncate">{new Date(evenement.dateDebut).toLocaleDateString(locale === 'ar' ? 'ar-MA' : 'fr-FR')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground justify-end">
                    <MapPin size={14} className="text-[hsl(var(--gov-red))] shrink-0" />
                    <span className="truncate text-right">
                      {evenement.lieu || (locale === 'ar' ? (evenement.commune?.nomArabe || evenement.commune?.nom) : evenement.commune?.nom) || '-'}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-3 gap-2 mt-1">
                  <GovButton
                    onClick={() => { setSelectedEvenement(evenement); setShowDetailModal(true); }}
                    variant="outline"
                    size="sm"
                    title={t('actions.view')}
                    className="w-full h-10 text-muted-foreground border-border hover:bg-muted"
                  >
                    <Eye size={18} />
                  </GovButton>
                  
                  {evenement.statut !== 'CLOTUREE' ? (
                    <GovButton
                      asChild
                      variant="outline"
                      size="sm"
                      title={t('actions.edit')}
                      className="w-full h-10 text-gov-gold border-gov-gold/20 hover:bg-gov-gold/5"
                    >
                      <Link href={`/admin/evenements/${evenement.id}/modifier`}>
                        <Edit2 size={18} />
                      </Link>
                    </GovButton>
                  ) : (
                    <div />
                  )}

                  {evenement.statut === 'EN_ATTENTE_VALIDATION' ? (
                    <GovButton
                      onClick={() => handleValidation(evenement.id, 'valider')}
                      variant="outline"
                      size="sm"
                      title={t('actions.validate')}
                      className="w-full h-10 text-[hsl(var(--gov-green))] border-[hsl(var(--gov-green))/0.2] hover:bg-[hsl(var(--gov-green))/0.05]"
                    >
                      <CheckCircle size={18} />
                    </GovButton>
                  ) : (
                    <GovButton
                      onClick={() => handleDelete(evenement.id)}
                      variant="outline"
                      size="sm"
                      title={tModal('delete')}
                      className="w-full h-10 text-gov-red border-gov-red/20 hover:bg-gov-red/5"
                    >
                      <Trash2 size={18} />
                    </GovButton>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {evenements.length === 0 && (
        <div className="p-8">
          <EmptyState
            icon={<Calendar className="w-10 h-10" />}
            title={t('empty')}
            description="Aucun événement ne correspond à vos critères actuels. Vous pouvez en créer un nouveau ou ajuster vos filtres."
            action={
              (filters.search || filters.statut || filters.secteur || filters.communeId) ? (
                <button 
                  onClick={resetFilters}
                  className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors mt-2 shadow-sm font-medium"
                >
                  Effacer les filtres
                </button>
              ) : undefined
            }
          />
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 sm:px-8 py-6 bg-card border border-border rounded-3xl shadow-xl shadow-[hsl(var(--gov-blue))/0.02]">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground hidden sm:block">
            {t('pagination.page', { current: page, total: totalPages })}
          </p>
          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-between sm:justify-start">
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
                    className="w-8 h-8 sm:w-10 sm:h-10 p-0 text-xs sm:text-sm"
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

      {/* Detail Modal (Institutional Sidebar) */}
      <GovModal
        isOpen={showDetailModal && selectedEvenement !== null}
        onClose={() => setShowDetailModal(false)}
        title={selectedEvenement?.titre}
        subtitle={selectedEvenement?.typeCategorique}
        maxWidth="3xl"
        footer={
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setShowDetailModal(false)}
              className="px-6 py-4 bg-muted text-muted-foreground rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-muted/80 transition-all border border-transparent hover:border-border"
            >
              {tModal('close')}
            </button>
            {selectedEvenement && (
              <Link
                href={`/admin/evenements/${selectedEvenement.id}/modifier`}
                className="gov-btn-primary py-4 rounded-2xl flex items-center justify-center gap-2 text-xs uppercase tracking-widest font-bold"
              >
                <Edit2 size={16} />
                {tModal('edit_full')}
              </Link>
            )}
          </div>
        }
      >
        {selectedEvenement && (
          <div className="space-y-10">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-6 bg-muted/30 rounded-3xl border border-border/50">
                <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1">{tModal('sector')}</p>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[hsl(var(--gov-blue))/0.1] flex items-center justify-center text-[hsl(var(--gov-blue))]">
                    <Building2 size={16} />
                  </div>
                  <p className="font-extrabold text-foreground">{tSectors(selectedEvenement.secteur)}</p>
                </div>
              </div>
              <div className="p-6 bg-muted/30 rounded-3xl border border-border/50">
                <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1">{tModal('registrations')}</p>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[hsl(var(--gov-green))/0.1] flex items-center justify-center text-[hsl(var(--gov-green))]">
                    <Users size={16} />
                  </div>
                  <p className="font-extrabold text-foreground">
                    {selectedEvenement.nombreInscrits}
                    {selectedEvenement.capaciteMax && <span className="text-muted-foreground/60 font-medium ml-1">/ {selectedEvenement.capaciteMax}</span>}
                  </p>
                </div>
              </div>
            </div>

            {/* Info List */}
            <div className="space-y-6">
              {/* Provincial Partnership Banner */}
              {(selectedEvenement.isOrganiseParProvince || selectedEvenement.sousCouvertProvince) && (
                <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-200 text-amber-800">
                  <Sparkles className="w-5 h-5 text-amber-600 shrink-0" />
                  <div className="text-sm font-bold">
                    {selectedEvenement.sousCouvertProvince 
                      ? (locale === 'ar' ? 'تحت إشراف عمالة إقليم مديونة' : 'Sous couvert de la Province de Médiouna')
                      : (locale === 'ar' ? 'رسمي - عمالة إقليم مديونة' : 'Officiel - Province de Médiouna')
                    }
                  </div>
                </div>
              )}

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center flex-shrink-0 border border-border">
                  <Calendar className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">{tModal('period')}</p>
                  <p className="font-bold text-foreground">
                    {new Date(selectedEvenement.dateDebut).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    {selectedEvenement.dateFin && (
                      <span className="block text-sm text-muted-foreground/80 mt-1">
                        au {new Date(selectedEvenement.dateFin).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                    )}
                    {selectedEvenement.heureDebut && (
                      <span className="block text-xs text-muted-foreground mt-1">
                        {locale === 'ar' 
                          ? `من الساعة ${selectedEvenement.heureDebut} ${selectedEvenement.heureFin ? `إلى ${selectedEvenement.heureFin}` : ''}`
                          : `De ${selectedEvenement.heureDebut} ${selectedEvenement.heureFin ? `à ${selectedEvenement.heureFin}` : ''}`
                        }
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center flex-shrink-0 border border-border">
                  <MapPin className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">{tModal('location')}</p>
                  <p className="font-bold text-foreground">
                    {(() => {
                      const parts: string[] = [];
                      if (selectedEvenement.lieu) parts.push(selectedEvenement.lieu);
                      if (selectedEvenement.lieuEtablissement) {
                        parts.push(locale === 'ar' && selectedEvenement.lieuEtablissement.nomArabe ? selectedEvenement.lieuEtablissement.nomArabe : selectedEvenement.lieuEtablissement.nom);
                      }
                      if (selectedEvenement.commune) {
                        parts.push(locale === 'ar' ? (selectedEvenement.commune.nomArabe || selectedEvenement.commune.nom) : selectedEvenement.commune.nom);
                      }
                      return parts.join(', ');
                    })()}
                  </p>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-foreground flex items-center gap-2">
                <div className="w-1.5 h-4 bg-[hsl(var(--gov-blue))] rounded-full" />
                {tModal('description_event')}
              </h4>
              <div dir="auto" className="p-6 bg-muted/20 rounded-3xl border border-border/50 text-muted-foreground leading-relaxed font-medium text-justify">
                {decodeHtmlEntities(selectedEvenement.description)}
              </div>
            </div>

            {/* Status Section */}
            <div className="p-6 bg-[hsl(var(--gov-blue))/0.03] rounded-3xl border border-[hsl(var(--gov-blue))/0.1] space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{tModal('current_status')}</span>
                <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm ${STATUT_CONFIG[selectedEvenement.statut]?.bg} ${STATUT_CONFIG[selectedEvenement.statut]?.color} border-current/10`}>
                  {t('status.' + (statusKeyMap[selectedEvenement.statut] || 'pending'))}
                </span>
              </div>
              {selectedEvenement.isMisEnAvant && (
                <div className="flex items-center gap-2 text-amber-700 bg-amber-50/80 px-4 py-2 rounded-xl border border-amber-200/50">
                  <Star className="w-4 h-4 fill-current" />
                  <span className="text-[10px] font-black uppercase tracking-widest">{tModal('featured_event')}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </GovModal>
    </div>
  );
}

export default function AdminEvenementsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 text-[hsl(var(--gov-green))] animate-spin" />
      </div>
    }>
      <AdminEvenementsContent />
    </Suspense>
  );
}
