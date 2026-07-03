'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
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
import { Link } from '@/i18n/navigation';
import { useTranslations, useLocale } from 'next-intl';
import EmptyState from '@/components/ui/EmptyState';
import { GovButton } from '@/components/ui/GovButton';
import { KpiCard, KpiGrid } from '@/components/ui/KpiCard';
import { GovTable, GovTh, GovTd, GovTr } from '@/components/ui/GovTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useData } from '@/hooks/use-data';
import { useMutation } from '@/hooks/use-mutation';

interface Etablissement {
  id: number;
  nom: string;
  code: string;
  secteur: string;
  adresse: string | null;
  adresseComplete?: string | null;
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
  commune: { id: number; nom: string; nomArabe?: string } | null;
  annexe: { id: number; nom: string; nomArabe?: string } | null;
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
  { value: 'SOCIAL', color: 'bg-gov-blue/10 text-gov-blue-dark dark:bg-gov-blue dark:text-gov-blue' },
  { value: 'CULTUREL', color: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400' },
  { value: 'AUTRE', color: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' },
];

export default function AdminEtablissementsPage() {
  const t = useTranslations('admin.establishments_page');
  const tSectors = useTranslations('admin.users_page.sectors');
  const tModal = useTranslations('admin.common_modal');
  const locale = useLocale();

  const [page, setPage] = useState(1);
  
  // Filters
  const [search, setSearch] = useState('');
  const [secteurFilter, setSecteurFilter] = useState('');
  const [validFilter, setValidFilter] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Modal
  const [selectedEtablissement, setSelectedEtablissement] = useState<Etablissement | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showDeleteId, setShowDeleteId] = useState<number | null>(null);
  const [showBulkConfirm, setShowBulkConfirm] = useState<'publish' | 'delete' | null>(null);

  // Inline Editing States
  const [isEditing, setIsEditing] = useState(false);
  const [editNom, setEditNom] = useState('');
  const [editAdresse, setEditAdresse] = useState('');
  const [editTelephone, setEditTelephone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editLatitude, setEditLatitude] = useState('');
  const [editLongitude, setEditLongitude] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  const openDetailModal = (etablissement: any) => {
    setSelectedEtablissement(etablissement);
    setShowDetailModal(true);
    setIsEditing(false);
    setEditNom(etablissement.nom);
    setEditAdresse(etablissement.adresseComplete || etablissement.adresse || '');
    setEditTelephone(etablissement.telephone || '');
    setEditEmail(etablissement.email || '');
    setEditLatitude(etablissement.latitude?.toString() || '');
    setEditLongitude(etablissement.longitude?.toString() || '');
  };

  const handleSaveEdit = async () => {
    if (!selectedEtablissement) return;
    if (!editNom.trim()) {
      toast.error(locale === 'ar' ? 'الاسم مطلوب' : 'Le nom est obligatoire');
      return;
    }
    
    const lat = parseFloat(editLatitude);
    const lng = parseFloat(editLongitude);
    
    if (isNaN(lat) || lat < -90 || lat > 90) {
      toast.error(locale === 'ar' ? 'خطوط العرض غير صالحة' : 'Latitude invalide (-90 à 90)');
      return;
    }
    if (isNaN(lng) || lng < -180 || lng > 180) {
      toast.error(locale === 'ar' ? 'خطوط الطول غير صالحة' : 'Longitude invalide (-180 à 180)');
      return;
    }

    setSavingEdit(true);
    try {
      const res = await fetch(`/api/etablissements/${selectedEtablissement.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nom: editNom.trim(),
          adresseComplete: editAdresse.trim(),
          telephone: editTelephone.trim() || null,
          email: editEmail.trim() || null,
          latitude: lat,
          longitude: lng,
        }),
      });

      const result = await res.json();
      if (res.ok) {
        toast.success(locale === 'ar' ? 'تم تحديث المؤسسة بنجاح' : 'Établissement mis à jour avec succès');
        setSelectedEtablissement(prev => prev ? {
          ...prev,
          nom: editNom.trim(),
          adresse: editAdresse.trim(),
          telephone: editTelephone.trim() || null,
          email: editEmail.trim() || null,
          latitude: lat,
          longitude: lng,
        } : null);
        setIsEditing(false);
        fetchEtablissements();
      } else {
        toast.error(result.message || (locale === 'ar' ? 'فشل التحديث' : 'Échec de la mise à jour'));
      }
    } catch (error) {
      console.error(error);
      toast.error(locale === 'ar' ? 'خطأ في الخادم' : 'Erreur serveur');
    } finally {
      setSavingEdit(false);
    }
  };

  // Mutations
  const actionMutation = useMutation();
  const bulkMutation = useMutation('/api/etablissements/bulk');

  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    params.set('page', page.toString());
    params.set('limit', '12');
    params.set('includeNonPublie', 'true');
    if (search) params.set('search', search);
    if (secteurFilter) params.set('secteur', secteurFilter);
    return params;
  }, [page, search, secteurFilter]);

  const { data: etablissementsData, isLoading: loading, mutate: fetchEtablissements } = useData(`/api/etablissements?${queryParams.toString()}`);
  
  // /api/etablissements returns successResponse({data: items[], pagination})
  // → SWR: { success, data: { data: items[], pagination } } (double-nested)
  const etablissements: Etablissement[] = Array.isArray(etablissementsData?.data?.data)
    ? etablissementsData.data.data
    : Array.isArray(etablissementsData?.data)
      ? etablissementsData.data
      : [];
  const pagination = etablissementsData?.data?.pagination
    || etablissementsData?.pagination
    || etablissementsData?.meta?.pagination
    || { totalPages: 1, total: 0 };
  const totalPages = pagination.totalPages || 1;
  const total = pagination.total || 0;

  const stats = {
    total: total,
    valides:   etablissements.filter((e: Etablissement) => e.isValide).length,
    publies:   etablissements.filter((e: Etablissement) => e.isPublie).length,
    enAttente: etablissements.filter((e: Etablissement) => !e.isValide).length,
    averageRating: etablissements.length > 0
      ? etablissements.reduce((acc: number, e: Etablissement) => acc + e.noteMoyenne, 0) / etablissements.length
      : 0,
  };

  const handleValidate = async (id: number, action: 'valider' | 'publier' | 'misEnAvant') => {
    setActionLoading(`${action}-${id}`);
    const promise = new Promise(async (resolve, reject) => {
      try {
        const body: { isValide?: boolean; isPublie?: boolean; isMisEnAvant?: boolean } = {};
        if (action === 'valider') {
          const etab = etablissements.find((e: Etablissement) => e.id === id);
          body.isValide = !etab?.isValide;
        } else if (action === 'publier') {
          const etab = etablissements.find((e: Etablissement) => e.id === id);
          body.isPublie = !etab?.isPublie;
        } else if (action === 'misEnAvant') {
          const etab = etablissements.find((e: Etablissement) => e.id === id);
          body.isMisEnAvant = !etab?.isMisEnAvant;
        }
        await actionMutation.mutate(`/api/etablissements/${id}/valider`, { method: 'PATCH', data: body });
        await fetchEtablissements();
        resolve(true);
      } catch (error: any) {
        reject(new Error(error.message || t('messages.error')));
      } finally {
        setActionLoading(null);
      }
    });
    toast.promise(promise, {
      loading: t('messages.updating') || 'Mise à jour...',
      success: t('messages.updated'),
      error: (err) => err.message,
    });
  };

  const handleDelete = async (id: number) => {
    if (showDeleteId !== id) {
      setShowDeleteId(id);
      return;
    }
    setShowDeleteId(null);
    
    setActionLoading(`delete-${id}`);
    try {
      await actionMutation.mutate(`/api/etablissements/${id}`, { method: 'DELETE' });
      toast.success(t('messages.deleted'));
      await fetchEtablissements();
      setShowDetailModal(false);
    } catch (error: any) {
      toast.error(error.message || t('messages.error'));
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

  const handlePublishAll = async () => {
    if (showBulkConfirm !== 'publish') { setShowBulkConfirm('publish'); return; }
    setShowBulkConfirm(null);
    const toastId = toast.loading(t('messages.publishing'));
    try {
        await bulkMutation.mutate('/api/admin/etablissements/bulk', {
            method: 'POST', data: { action: 'publish_all' }
        });
        toast.success(t('messages.bulk_publish_success'), { id: toastId });
        await fetchEtablissements();
    } catch(e: any) { 
        toast.error(e.message || t('messages.bulk_publish_error'), { id: toastId });
    }
  };

  const handleDeleteAll = async () => {
    if (showBulkConfirm !== 'delete') { setShowBulkConfirm('delete'); return; }
    setShowBulkConfirm(null);
    const toastId = toast.loading(t('messages.deleting'));
     try {
        await bulkMutation.mutate('/api/admin/etablissements/bulk', {
            method: 'POST', data: { action: 'delete_all' }
        });
        toast.success(t('messages.bulk_delete_success'), { id: toastId });
        await fetchEtablissements();
     } catch(e: any) {
         toast.error(e.message || t('messages.bulk_delete_error'), { id: toastId });
     }
  };

  if (loading && etablissements.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[hsl(var(--gov-blue))/0.1] border-t-[hsl(var(--gov-blue))] rounded-full animate-spin" />
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground animate-pulse">
            {t('loading') || 'Chargement des établissements...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[hsl(var(--gov-blue)/0.03)] rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-[hsl(var(--gov-gold)/0.03)] rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl pointer-events-none" />

      <div className="max-w-[1600px] mx-auto relative z-10 pb-20">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-gradient-to-br from-[#ebd281] to-[#d4b962] rounded-2xl flex items-center justify-center text-[#0a3b68] shadow-xl shadow-[hsl(var(--gov-blue)/0.25)] ring-4 ring-white dark:ring-gray-900 group">
              <Building2 className="w-8 h-8 group-hover:scale-110 transition-transform duration-500" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
                  {t('page_title')}
                </h1>
                <span className="px-3 py-1 bg-[hsl(var(--gov-blue)/0.1)] text-[hsl(var(--gov-blue))] text-[10px] font-black rounded-full uppercase tracking-widest border border-[hsl(var(--gov-blue)/0.2)]">
                  Admin
                </span>
              </div>
              <div className="flex items-center gap-4 text-muted-foreground text-sm font-medium">
                <p>{t('total_establishments', { count: total })}</p>
                <div className="w-1 h-1 bg-border rounded-full" />
                <p className="flex items-center gap-1.5">
                  <Shield size={14} className="text-[hsl(var(--gov-blue))]" />
                  Gouvernance
                </p>
              </div>
            </div>
          </div>
        
          <div className="flex flex-wrap items-center gap-3">
          <GovButton
            onClick={fetchEtablissements}
            variant="outline"
            size="icon"
            loading={loading && etablissements.length > 0}
            title={t('refresh') || "Actualiser"}
          />

          <div className="flex items-center gap-1 bg-card border border-border rounded-2xl p-1 shadow-sm">
            <GovButton
              onClick={handlePublishAll}
              variant="outline"
              size="icon"
              title={t('bulk_publish') || "Tout Publier"}
              className="text-[hsl(var(--gov-blue))] border-none hover:bg-[hsl(var(--gov-blue))/0.05]"
            >
              <Globe size={18} />
            </GovButton>
            <div className="w-px h-6 bg-border" />
            <GovButton
              onClick={handleDeleteAll}
              variant="outline"
              size="icon"
              title={t('bulk_delete') || "Tout Supprimer"}
              className="text-[hsl(var(--gov-red))] border-none hover:bg-[hsl(var(--gov-red))/0.05]"
            >
              <Trash2 size={18} />
            </GovButton>
          </div>

          <GovButton
            onClick={() => setShowFilters(!showFilters)}
            variant={showFilters ? "primary" : "outline"}
            leftIcon={<Filter size={16} />}
            className={showFilters ? "shadow-lg shadow-[hsl(var(--gov-blue))/0.2]" : ""}
          >
            {t('filters')}
            {Object.values({ search, secteurFilter, validFilter }).filter(v => v !== '').length > 0 && (
              <span className="ml-2 w-5 h-5 bg-white text-[hsl(var(--gov-blue))] rounded-full flex items-center justify-center text-[10px] font-black shadow-sm">
                {Object.values({ search, secteurFilter, validFilter }).filter(v => v !== '').length}
              </span>
            )}
          </GovButton>

          <Link href="/admin/etablissements/nouveau">
            <GovButton leftIcon={<Plus size={18} />} variant="primary">
              {t('new_establishment')}
            </GovButton>
          </Link>
        </div>
      </div>
      {/* Stats Cards */}
      <KpiGrid cols={4}>
        <KpiCard
          index={0}
          label={t('stats.total')}
          value={stats.total}
          icon={Building2}
          variant="blue"
        />
        <KpiCard
          index={1}
          label={t('stats.validated')}
          value={stats.valides}
          icon={CheckCircle}
          variant="green"
        />
        <KpiCard
          index={2}
          label={t('stats.published')}
          value={stats.publies}
          icon={Globe}
          variant="blue"
        />
        <KpiCard
          index={3}
          label={t('stats.average_rating')}
          value={stats.averageRating.toFixed(1)}
          icon={Star}
          variant="gold"
        />
      </KpiGrid>

      {/* Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-card border border-border rounded-3xl p-8 shadow-xl shadow-[hsl(var(--gov-blue))/0.05]">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Recherche */}
                <div className="space-y-2 lg:col-span-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">
                    {t('search_placeholder') || 'Rechercher un établissement...'}
                  </label>
                  <div className="relative group">
                    <Search className={`absolute top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-[hsl(var(--gov-blue))] transition-colors ${locale === 'ar' ? 'right-4' : 'left-4'}`} size={18} />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder={t('search_placeholder') || 'Rechercher...'}
                      className="gov-input pl-12 h-12 text-sm font-medium"
                    />
                  </div>
                </div>
 
                {/* Secteur */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">
                    {t('all_sectors') || 'Secteur'}
                  </label>
                  <select
                    value={secteurFilter}
                    onChange={(e) => setSecteurFilter(e.target.value)}
                    className="gov-input h-12 text-sm font-medium appearance-none cursor-pointer"
                  >
                    {SECTEURS.map((s) => (
                      <option key={s.value} value={s.value}>{getSecteurLabel(s.value)}</option>
                    ))}
                  </select>
                </div>
 
                {/* Reset */}
                <div className="flex items-end">
                  <GovButton
                    onClick={() => { setSearch(''); setSecteurFilter(''); setValidFilter(''); }}
                    variant="outline"
                    leftIcon={<X size={14} />}
                    className="w-full justify-center"
                  >
                    {t('reset')}
                  </GovButton>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table View */}
      <GovTable>
        <thead>
          <tr>
            <GovTh>{t('card.name') || "Établissement"}</GovTh>
            <GovTh>{t('card.sector') || "Secteur"}</GovTh>
            <GovTh>{t('card.location') || "Localisation"}</GovTh>
            <GovTh>{t('card.status') || "Statut"}</GovTh>
            <GovTh>{t('card.rating') || "Note"}</GovTh>
            <GovTh className="text-right">{t('card.actions') || "Actions"}</GovTh>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {loading ? (
            [...Array(5)].map((_, i) => (
              <GovTr key={i} className="animate-pulse">
                <GovTd><div className="h-4 w-32 bg-muted rounded" /></GovTd>
                <GovTd><div className="h-4 w-20 bg-muted rounded" /></GovTd>
                <GovTd><div className="h-4 w-24 bg-muted rounded" /></GovTd>
                <GovTd><div className="h-4 w-16 bg-muted rounded" /></GovTd>
                <GovTd><div className="h-4 w-12 bg-muted rounded" /></GovTd>
                <GovTd><div className="h-4 w-24 bg-muted rounded ml-auto" /></GovTd>
              </GovTr>
            ))
          ) : etablissements.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-6 py-20">
                <EmptyState
                  icon={<Building2 className="w-10 h-10" />}
                  title={t('empty.title')}
                  description={search || secteurFilter ? t('empty.no_results') : t('empty.description')}
                  action={
                    (search || secteurFilter || validFilter) ? (
                      <GovButton
                        onClick={() => { setSearch(''); setSecteurFilter(''); setValidFilter(''); }}
                        variant="primary"
                        className="shadow-lg shadow-[hsl(var(--gov-blue))/0.2]"
                      >
                        {t('reset')}
                      </GovButton>
                    ) : undefined
                  }
                />
              </td>
            </tr>
          ) : (
            (Array.isArray(etablissements) ? etablissements : []).map((etablissement: any) => (
              <GovTr
                key={etablissement.id}
                onClick={() => openDetailModal(etablissement)}
              >
                <GovTd>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground border border-border shadow-sm overflow-hidden shrink-0 relative">
                      {etablissement.photoPrincipale ? (
                        <Image 
                          src={etablissement.photoPrincipale} 
                          alt={etablissement.nom}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <Building2 size={18} />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-extrabold text-foreground">{etablissement.nom}</span>
                        {etablissement.isMisEnAvant && (
                          <Star size={12} className="text-[hsl(var(--gov-gold))] fill-current" />
                        )}
                      </div>
                      <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground opacity-60">
                        {etablissement.code}
                      </span>
                    </div>
                  </div>
                </GovTd>
                <GovTd>
                  <span className="px-2.5 py-0.5 bg-muted rounded-full text-[9px] font-bold uppercase tracking-widest text-muted-foreground border border-border">
                    {getSecteurLabel(etablissement.secteur)}
                  </span>
                </GovTd>
                <GovTd>
                  {etablissement.commune && (
                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                      <MapPin size={12} className="text-[hsl(var(--gov-red))]" />
                      <span>{locale === 'ar' ? (etablissement.commune.nomArabe || etablissement.commune.nom) : etablissement.commune.nom}</span>
                    </div>
                  )}
                </GovTd>
                <GovTd>
                  <div className="flex flex-wrap gap-1">
                    <StatusBadge status={etablissement.isValide ? "VALIDEE" : "REJETEE"} size="sm" />
                    {etablissement.isPublie && <StatusBadge status="PUBLIEE" size="sm" />}
                  </div>
                </GovTd>
                <GovTd>
                  <div className="flex items-center gap-1.5">
                    <Star size={14} className="text-[hsl(var(--gov-gold))] fill-current" />
                    <span className="text-xs font-black text-foreground">{etablissement.noteMoyenne.toFixed(1)}</span>
                    <span className="text-[9px] font-bold text-muted-foreground">({etablissement.nombreEvaluations})</span>
                  </div>
                </GovTd>
                <GovTd className="text-right">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-95 group-hover:scale-100">
                    <GovButton
                      onClick={(e) => {
                        e.stopPropagation();
                        openDetailModal(etablissement);
                      }}
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-[hsl(var(--gov-blue))]"
                    >
                      <Eye size={18} />
                    </GovButton>
                    <GovButton
                      onClick={(e) => {
                        e.stopPropagation();
                        handleValidate(etablissement.id, 'publier');
                      }}
                      variant="ghost"
                      size="icon"
                      className={etablissement.isPublie ? "text-[hsl(var(--gov-blue))]" : "text-muted-foreground hover:text-[hsl(var(--gov-blue))]"}
                      loading={actionLoading === `publier-${etablissement.id}`}
                    >
                      <Globe size={18} />
                    </GovButton>
                    <GovButton
                      asChild
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-[hsl(var(--gov-blue))]"
                    >
                      <Link href={`/admin/etablissements/${etablissement.id}/modifier`}>
                        <Edit size={18} />
                      </Link>
                    </GovButton>
                  </div>
                </GovTd>
              </GovTr>
            ))
          )}
        </tbody>
      </GovTable>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-8 py-6 bg-card border border-border rounded-3xl shadow-xl shadow-[hsl(var(--gov-blue))/0.02]">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            {t('pagination.info', { page, total: totalPages })}
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

      {/* Detail Modal (Institutional Sidebar) */}
      <AnimatePresence>
        {showDetailModal && selectedEtablissement && (
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
              className="fixed inset-4 md:inset-10 lg:inset-x-[15%] lg:inset-y-10 bg-card shadow-2xl z-[101] overflow-y-auto rounded-3xl border border-border"
            >
              {/* Header */}
              <div className="sticky top-0 bg-card/80 backdrop-blur-md border-b border-border px-8 py-6 flex items-center justify-between z-10">
                <div>
                  <h2 className="text-xl font-extrabold text-foreground">
                    {t('card.details_title')}
                  </h2>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">
                    {tModal('management')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {!isEditing && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="p-2.5 hover:bg-muted rounded-xl transition-colors border border-transparent hover:border-border text-muted-foreground hover:text-foreground flex items-center gap-2 text-xs font-bold"
                      title={locale === 'ar' ? 'تعديل' : 'Modifier'}
                    >
                      <Edit size={16} />
                      <span className="hidden sm:inline">{locale === 'ar' ? 'تعديل' : 'Modifier'}</span>
                    </button>
                  )}
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="p-2.5 hover:bg-muted rounded-xl transition-colors border border-transparent hover:border-border text-muted-foreground hover:text-foreground"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
 
              {/* Content */}
              <div className="p-8 space-y-10">
                {isEditing ? (
                  <form onSubmit={(e) => { e.preventDefault(); handleSaveEdit(); }} className="space-y-6">
                    {/* Nom Field */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                        {locale === 'ar' ? 'اسم المؤسسة' : "Nom de l'établissement"}
                      </label>
                      <input
                        type="text"
                        value={editNom}
                        onChange={(e) => setEditNom(e.target.value)}
                        className="w-full px-4 py-3 bg-muted/30 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-[hsl(var(--gov-blue))] text-foreground font-semibold"
                        required
                      />
                    </div>

                    {/* Adresse Field */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                        {locale === 'ar' ? 'العنوان' : 'Adresse'}
                      </label>
                      <input
                        type="text"
                        value={editAdresse}
                        onChange={(e) => setEditAdresse(e.target.value)}
                        className="w-full px-4 py-3 bg-muted/30 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-[hsl(var(--gov-blue))] text-foreground font-semibold"
                      />
                    </div>

                    {/* Contact Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                          {locale === 'ar' ? 'الهاتف' : 'Téléphone'}
                        </label>
                        <input
                          type="text"
                          value={editTelephone}
                          onChange={(e) => setEditTelephone(e.target.value)}
                          className="w-full px-4 py-3 bg-muted/30 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-[hsl(var(--gov-blue))] text-foreground font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                          {locale === 'ar' ? 'البريد الإلكتروني' : 'Email'}
                        </label>
                        <input
                          type="email"
                          value={editEmail}
                          onChange={(e) => setEditEmail(e.target.value)}
                          className="w-full px-4 py-3 bg-muted/30 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-[hsl(var(--gov-blue))] text-foreground font-semibold"
                        />
                      </div>
                    </div>

                    {/* GPS Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                          {locale === 'ar' ? 'خط العرض (Latitude)' : 'Latitude'}
                        </label>
                        <input
                          type="number"
                          step="any"
                          value={editLatitude}
                          onChange={(e) => setEditLatitude(e.target.value)}
                          className="w-full px-4 py-3 bg-muted/30 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-[hsl(var(--gov-blue))] text-foreground font-semibold"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                          {locale === 'ar' ? 'خط الطول (Longitude)' : 'Longitude'}
                        </label>
                        <input
                          type="number"
                          step="any"
                          value={editLongitude}
                          onChange={(e) => setEditLongitude(e.target.value)}
                          className="w-full px-4 py-3 bg-muted/30 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-[hsl(var(--gov-blue))] text-foreground font-semibold"
                          required
                        />
                      </div>
                    </div>

                    {/* Edit Buttons */}
                    <div className="flex items-center gap-3 pt-6 border-t border-border">
                      <GovButton
                        type="submit"
                        loading={savingEdit}
                        variant="primary"
                        className="flex-1 h-12 justify-center"
                      >
                        {locale === 'ar' ? 'حفظ التعديلات' : 'Enregistrer'}
                      </GovButton>
                      <GovButton
                        type="button"
                        onClick={() => setIsEditing(false)}
                        variant="outline"
                        className="flex-1 h-12 justify-center"
                      >
                        {locale === 'ar' ? 'إلغاء' : 'Annuler'}
                      </GovButton>
                    </div>
                  </form>
                ) : (
                  <>
                    {/* Header Profile */}
                    <div className="flex items-center gap-6">
                      <div className="w-24 h-24 rounded-3xl bg-muted flex items-center justify-center text-muted-foreground border border-border shadow-inner overflow-hidden relative">
                        {selectedEtablissement.photoPrincipale ? (
                          <Image 
                            src={selectedEtablissement.photoPrincipale} 
                            alt={selectedEtablissement.nom}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <Building2 className="w-10 h-10" />
                        )}
                      </div>
                      <div>
                        <h3 className="text-2xl font-black text-foreground mb-1">
                          {selectedEtablissement.nom}
                        </h3>
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1 bg-muted rounded-full text-[9px] font-bold uppercase tracking-widest text-muted-foreground border border-border">
                            {selectedEtablissement.code}
                          </span>
                          <StatusBadge color="blue">
                            {getSecteurLabel(selectedEtablissement.secteur)}
                          </StatusBadge>
                        </div>
                      </div>
                    </div>
     
                    {/* Rating Card */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-6 bg-[hsl(var(--gov-yellow))/0.03] rounded-3xl border border-[hsl(var(--gov-yellow))/0.1] text-center">
                        <p className="text-[9px] font-bold uppercase tracking-widest text-[hsl(var(--gov-yellow))] mb-2 opacity-60">{tModal('average_rating')}</p>
                        <p className="text-4xl font-black text-foreground leading-none mb-3">
                          {selectedEtablissement.noteMoyenne.toFixed(1)}
                        </p>
                        <div className="flex items-center justify-center gap-1 text-[hsl(var(--gov-yellow))]">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              size={14}
                              className={star <= Math.round(selectedEtablissement.noteMoyenne) ? 'fill-current' : ''}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="p-6 bg-muted/30 rounded-3xl border border-border/50 text-center">
                        <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-2 opacity-60">{tModal('total_reviews')}</p>
                        <p className="text-4xl font-black text-foreground leading-none mb-3">
                          {selectedEtablissement.nombreEvaluations}
                        </p>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-40">{tModal('citizen_reviews')}</p>
                      </div>
                    </div>
     
                    {/* Contact Info */}
                    <div className="space-y-4">
                      <h4 className="text-[10px] font-bold uppercase tracking-widest text-foreground flex items-center gap-2">
                        <div className="w-1.5 h-4 bg-[hsl(var(--gov-blue))] rounded-full" />
                        {tModal('contact_info')}
                      </h4>
                      <div className="grid grid-cols-1 gap-3">
                        {(selectedEtablissement.adresseComplete || selectedEtablissement.adresse) && (
                          <div className="flex items-center gap-4 p-4 bg-muted/20 rounded-2xl border border-border/50">
                            <div className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center text-[hsl(var(--gov-red))]">
                              <MapPin size={18} />
                            </div>
                            <span className="text-sm font-bold text-foreground">
                              {selectedEtablissement.adresseComplete || selectedEtablissement.adresse}
                            </span>
                          </div>
                        )}
                        {selectedEtablissement.telephone && (
                          <div className="flex items-center gap-4 p-4 bg-muted/20 rounded-2xl border border-border/50">
                            <div className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center text-[hsl(var(--gov-blue))]">
                              <Phone size={18} />
                            </div>
                            <span className="text-sm font-bold text-foreground">{selectedEtablissement.telephone}</span>
                          </div>
                        )}
                        {selectedEtablissement.email && (
                          <div className="flex items-center gap-4 p-4 bg-muted/20 rounded-2xl border border-border/50">
                            <div className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center text-[hsl(var(--gov-muted))]">
                              <Mail size={18} />
                            </div>
                            <span className="text-sm font-bold text-foreground">{selectedEtablissement.email}</span>
                          </div>
                        )}
                        {/* GPS Coordinates */}
                        <div className="flex items-center gap-4 p-4 bg-muted/20 rounded-2xl border border-border/50">
                          <div className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center text-[hsl(var(--gov-gold))]">
                            <MapPin size={18} />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-0.5">
                              {locale === 'ar' ? 'الإحداثيات الجغرافية (GPS)' : 'Coordonnées GPS'}
                            </p>
                            <p className="text-sm font-bold text-foreground">
                              Lat: {selectedEtablissement.latitude} | Lng: {selectedEtablissement.longitude}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
     
                    {/* Workflow Actions */}
                    <div className="space-y-4 pt-10 border-t border-border">
                      <h4 className="text-[10px] font-bold uppercase tracking-widest text-foreground flex items-center gap-2">
                        <div className="w-1.5 h-4 bg-[hsl(var(--gov-green))] rounded-full" />
                        {tModal('admin_actions')}
                      </h4>
                      <div className="grid grid-cols-1 gap-4">
                        <GovButton
                          onClick={() => handleValidate(selectedEtablissement.id, 'valider')}
                          disabled={!!actionLoading}
                          loading={actionLoading === `valider-${selectedEtablissement.id}`}
                          variant={selectedEtablissement.isValide ? "outline" : "primary"}
                          leftIcon={!(actionLoading === `valider-${selectedEtablissement.id}`) && (selectedEtablissement.isValide ? <CheckCircle size={18} /> : <Award size={18} />)}
                          className={`w-full justify-between h-16 ${selectedEtablissement.isValide ? "text-[hsl(var(--gov-green))] bg-[hsl(var(--gov-green))/0.05] border-[hsl(var(--gov-green))/0.2]" : ""}`}
                        >
                          <span>{selectedEtablissement.isValide ? t('card.validated') : t('card.validate')}</span>
                          <ChevronRight size={16} />
                        </GovButton>
     
                        <GovButton
                          onClick={() => handleValidate(selectedEtablissement.id, 'publier')}
                          disabled={!!actionLoading}
                          loading={actionLoading === `publier-${selectedEtablissement.id}`}
                          variant={selectedEtablissement.isPublie ? "outline" : "primary"}
                          leftIcon={!(actionLoading === `publier-${selectedEtablissement.id}`) && <Globe size={18} />}
                          className={`w-full justify-between h-16 ${selectedEtablissement.isPublie ? "text-[hsl(var(--gov-blue))] bg-[hsl(var(--gov-blue))/0.05] border-[hsl(var(--gov-blue))/0.2]" : ""}`}
                        >
                          <span>{selectedEtablissement.isPublie ? t('card.unpublish') : t('card.publish')}</span>
                          <ChevronRight size={16} />
                        </GovButton>
     
                        <GovButton
                          onClick={() => handleValidate(selectedEtablissement.id, 'misEnAvant')}
                          disabled={!!actionLoading}
                          loading={actionLoading === `misEnAvant-${selectedEtablissement.id}`}
                          variant={selectedEtablissement.isMisEnAvant ? "outline" : "primary"}
                          leftIcon={!(actionLoading === `misEnAvant-${selectedEtablissement.id}`) && <Star size={18} />}
                          className={`w-full justify-between h-16 ${selectedEtablissement.isMisEnAvant ? "text-[hsl(var(--gov-yellow))] bg-[hsl(var(--gov-yellow))/0.05] border-[hsl(var(--gov-yellow))/0.2]" : ""}`}
                        >
                          <span>{selectedEtablissement.isMisEnAvant ? tModal('remove_highlight') : tModal('add_highlight')}</span>
                          <ChevronRight size={16} />
                        </GovButton>
     
                        <div className="pt-6">
                          <GovButton
                            onClick={() => handleDelete(selectedEtablissement.id)}
                            disabled={!!actionLoading}
                            variant="outline"
                            leftIcon={<Trash2 size={18} />}
                            className="w-full justify-center h-16 border-dashed border-[hsl(var(--gov-red))/0.3] text-[hsl(var(--gov-red))] hover:bg-[hsl(var(--gov-red))/0.05]"
                          >
                            {t('card.delete')}
                          </GovButton>
                        </div>
                      </div>
                    </div>
     
                    {/* Footer Actions */}
                    <div className="pt-10">
                      <button
                        onClick={() => setShowDetailModal(false)}
                        className="w-full px-6 py-4 bg-muted text-muted-foreground rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-muted/80 transition-all border border-transparent hover:border-border"
                      >
                        {tModal('close_view')}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
}
