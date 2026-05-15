'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import {
  ArrowLeft,
  MapPin,
  User,
  Calendar,
  Building2,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  MessageSquare,
  Image as ImageIcon,
  FileText,
  Send,
  Loader2,
  Download,
  Phone,
  X
} from 'lucide-react';
import DownloadPhotosButton from '@/components/reclamations/DownloadPhotosButton';
import { useTranslations, useLocale } from 'next-intl';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { GovButton, GovTextarea } from '@/components/ui';
import { cn } from '@/lib/utils';

interface Reclamation {
  id: number;
  titre: string;
  description: string;
  categorie: string;
  statut: string | null;
  affectationReclamation: string;
  motifRejet: string | null;
  solutionApportee: string | null;
  quartierDouar: string | null;
  adresseComplete: string | null;
  latitude: number | null;
  longitude: number | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: number;
    nom: string;
    prenom: string;
    email: string;
    telephone: string | null;
  };
  commune: {
    id: number;
    nom: string;
    nomArabe?: string;
  };
  etablissement: {
    id: number;
    nom: string;
    nomArabe?: string;
    secteur: string;
  } | null;
  historique: {
    id: number;
    action: string;
    details: any;
    effectuePar: number;
    createdAt: string;
  }[];
  medias: {
    id: number;
    urlPublique: string;
    type: string;
  }[];
}

const STATUT_COLORS: Record<string, { bg: string; text: string; border: string; icon: any }> = {
  null: { bg: 'bg-[hsl(var(--gov-yellow))/0.1]', text: 'text-[hsl(var(--gov-yellow))]', border: 'border-[hsl(var(--gov-yellow))/0.2]', icon: Clock },
  ACCEPTEE: { bg: 'bg-[hsl(var(--gov-green))/0.1]', text: 'text-[hsl(var(--gov-green))]', border: 'border-[hsl(var(--gov-green))/0.2]', icon: CheckCircle },
  REJETEE: { bg: 'bg-[hsl(var(--gov-red))/0.1]', text: 'text-[hsl(var(--gov-red))]', border: 'border-[hsl(var(--gov-red))/0.2]', icon: XCircle },
};

const AFFECTATION_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  NON_AFFECTEE: { bg: 'bg-muted', text: 'text-muted-foreground', border: 'border-border' },
  AFFECTEE: { bg: 'bg-[hsl(var(--gov-blue))/0.1]', text: 'text-[hsl(var(--gov-blue))]', border: 'border-[hsl(var(--gov-blue))/0.2]' },
};

export default function ReclamationDetailPage() {
  const t = useTranslations('admin.reclamation_detail_page');
  const tCategories = useTranslations('reclamation_categories');
  const tHistory = useTranslations('history_actions');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const params = useParams();
  const router = useRouter();
  const reclamationId = params.id as string;

  const [reclamation, setReclamation] = useState<Reclamation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Formulaires
  const [motifRejet, setMotifRejet] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  useEffect(() => {
    fetchReclamation();
  }, [reclamationId]);

  const fetchReclamation = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reclamations/${reclamationId}`);
      if (res.ok) {
        const data = await res.json();
        setReclamation(data.data);
      } else if (res.status === 404) {
        setError(t('not_found'));
      } else {
        setError(t('load_error'));
      }
    } catch (err) {
      setError(t('connection_error'));
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    setActionLoading('accept');
    const acceptPromise = new Promise(async (resolve, reject) => {
      try {
        const res = await fetch(`/api/reclamations/${reclamationId}/decision`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ decision: 'ACCEPTEE' }),
        });
        if (res.ok) {
          fetchReclamation();
          resolve(true);
        } else {
          const data = await res.json();
          reject(new Error(data.error || 'Erreur lors de l\'acceptation'));
        }
      } catch (err: any) {
        reject(new Error(err.message || 'Erreur lors de l\'acceptation'));
      } finally {
        setActionLoading(null);
      }
    });

    toast.promise(acceptPromise, {
      loading: 'Acceptation en cours...',
      success: 'Réclamation acceptée avec succès',
      error: (err: any) => err.message,
    });
  };

  const handleReject = async () => {
    if (!motifRejet.trim()) {
      toast.error(t('messages.reject_reason_required'));
      return;
    }
    setActionLoading('reject');
    const rejectPromise = new Promise(async (resolve, reject) => {
      try {
        const res = await fetch(`/api/reclamations/${reclamationId}/decision`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ decision: 'REJETEE', motifRejet }),
        });
        if (res.ok) {
          setShowRejectForm(false);
          setMotifRejet('');
          fetchReclamation();
          resolve(true);
        } else {
          const data = await res.json();
          reject(new Error(data.error || 'Erreur lors du rejet'));
        }
      } catch (err: any) {
        reject(new Error(err.message || 'Erreur lors du rejet'));
      } finally {
        setActionLoading(null);
      }
    });

    toast.promise(rejectPromise, {
      loading: 'Rejet en cours...',
      success: 'Réclamation rejetée',
      error: (err: any) => err.message,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[hsl(var(--gov-blue))/0.1] border-t-[hsl(var(--gov-blue))] rounded-full animate-spin" />
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground animate-pulse">
            Chargement de la réclamation...
          </p>
        </div>
      </div>
    );
  }

  if (error || !reclamation) {
    return (
      <div className="text-center py-24 bg-card/50 backdrop-blur-xl rounded-[3rem] border border-border shadow-2xl">
        <AlertTriangle className="w-20 h-20 text-[hsl(var(--gov-red))] mx-auto mb-6 opacity-80" />
        <h2 className="text-2xl font-black text-foreground mb-4 uppercase italic tracking-tight">{error || tCommon('errors.generic')}</h2>
        <GovButton onClick={() => router.back()} variant="outline" leftIcon={<ArrowLeft size={16} />}>
          {t('back_to_list')}
        </GovButton>
      </div>
    );
  }

  const statutInfo = STATUT_COLORS[reclamation.statut || 'null'] || STATUT_COLORS['null'];
  const affectationInfo = AFFECTATION_COLORS[reclamation.affectationReclamation] || AFFECTATION_COLORS.NON_AFFECTEE;
  const StatutIcon = statutInfo.icon;

  return (
    <div className="space-y-10 max-w-6xl mx-auto pb-24">
      {/* Header Premium */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-6"
      >
        <div className="space-y-4">
          <Link 
            href="/admin/reclamations"
            className="group inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
          >
            <div className="w-8 h-8 rounded-full border border-border flex items-center justify-center group-hover:border-foreground/20 group-hover:bg-muted/50 transition-all">
              <ArrowLeft size={14} />
            </div>
            <span>{t('back_to_list')}</span>
          </Link>
          
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-orange-500/30 ring-8 ring-orange-500/10">
              <MessageSquare className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-black tracking-tight text-foreground uppercase italic">
                {t('title', { id: reclamation.id })}
              </h1>
              <p className="text-muted-foreground font-bold uppercase tracking-widest text-[10px] opacity-70 mt-1 line-clamp-1">
                {reclamation.titre}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className={cn("flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm", affectationInfo.bg, affectationInfo.text, affectationInfo.border)}>
            {t(`assignment.${reclamation.affectationReclamation}`)}
          </span>
          <span className={cn("flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm", statutInfo.bg, statutInfo.text, statutInfo.border)}>
            <StatutIcon size={14} />
            {t(`status.${reclamation.statut || 'pending'}`)}
          </span>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Contenu principal */}
        <div className="lg:col-span-2 space-y-10">
          
          {/* Description */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card/50 backdrop-blur-xl rounded-[2.5rem] border border-border overflow-hidden shadow-2xl shadow-[hsl(var(--gov-blue))/0.03]"
          >
            <div className="p-10 border-b border-border/50 bg-muted/5">
              <h2 className="text-[10px] font-black text-foreground uppercase tracking-widest flex items-center gap-3">
                <div className="w-2 h-5 bg-[hsl(var(--gov-blue))] rounded-full" />
                {t('description_title')}
              </h2>
            </div>
            <div className="p-10">
              <span className="inline-block px-4 py-1.5 bg-muted rounded-full text-[10px] font-bold uppercase tracking-widest text-muted-foreground border border-border mb-6">
                {tCategories(reclamation.categorie)}
              </span>
              <p className="text-foreground/80 leading-relaxed font-medium text-lg whitespace-pre-wrap">
                {reclamation.description}
              </p>
            </div>
          </motion.div>

          {/* Photos */}
          {reclamation.medias && reclamation.medias.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-card/50 backdrop-blur-xl rounded-[2.5rem] border border-border overflow-hidden shadow-2xl shadow-[hsl(var(--gov-blue))/0.03]"
            >
              <div className="p-10 border-b border-border/50 bg-muted/5 flex items-center justify-between">
                <h2 className="text-[10px] font-black text-foreground uppercase tracking-widest flex items-center gap-3">
                  <div className="w-2 h-5 bg-[hsl(var(--gov-green))] rounded-full" />
                  {t('photos_title', { count: reclamation.medias.filter(m => m.type === 'IMAGE').length })}
                </h2>
                <DownloadPhotosButton
                  reclamationId={reclamation.id}
                  photoCount={reclamation.medias.filter(m => m.type === 'IMAGE').length}
                  variant="button"
                />
              </div>
              <div className="p-10 grid grid-cols-2 md:grid-cols-3 gap-6">
                {reclamation.medias.map((media) => (
                  <div key={media.id} className="aspect-square rounded-[1.5rem] overflow-hidden bg-muted border border-border/50 shadow-md">
                    <img
                      src={media.urlPublique}
                      alt="Photo réclamation"
                      className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Actions Admin */}
          {reclamation.statut === null && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-card/50 backdrop-blur-xl rounded-[2.5rem] border border-border p-10 shadow-xl"
            >
              <h2 className="text-[10px] font-black text-foreground uppercase tracking-widest flex items-center gap-3 mb-8">
                <FileText className="w-5 h-5 text-[hsl(var(--gov-blue))]" />
                {t('actions_title')}
              </h2>

              <AnimatePresence mode="wait">
                {showRejectForm ? (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-6"
                  >
                    <GovTextarea
                      label="Motif du rejet *"
                      value={motifRejet}
                      onChange={(e) => setMotifRejet(e.target.value)}
                      placeholder={t('reject_reason_placeholder')}
                      rows={4}
                    />
                    <div className="flex items-center gap-4">
                      <GovButton
                        onClick={handleReject}
                        loading={actionLoading === 'reject'}
                        className="bg-[hsl(var(--gov-red))] hover:bg-[hsl(var(--gov-red-dark))] text-white"
                        leftIcon={!actionLoading && <XCircle size={16} />}
                      >
                        {t('confirm_reject')}
                      </GovButton>
                      <GovButton
                        onClick={() => setShowRejectForm(false)}
                        variant="outline"
                      >
                        {t('cancel')}
                      </GovButton>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-wrap items-center gap-4"
                  >
                    <GovButton
                      onClick={handleAccept}
                      loading={actionLoading === 'accept'}
                      className="bg-[hsl(var(--gov-green))] hover:bg-[hsl(var(--gov-green-dark))] text-white px-10"
                      leftIcon={!actionLoading && <CheckCircle size={18} />}
                    >
                      {t('accept')}
                    </GovButton>
                    <GovButton
                      onClick={() => setShowRejectForm(true)}
                      variant="outline"
                      className="text-[hsl(var(--gov-red))] hover:bg-[hsl(var(--gov-red))/0.05] border-[hsl(var(--gov-red))/0.2] px-10"
                      leftIcon={<XCircle size={18} />}
                    >
                      {t('reject')}
                    </GovButton>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* Motif de rejet */}
          {reclamation.statut === 'REJETEE' && reclamation.motifRejet && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[hsl(var(--gov-red))/0.05] backdrop-blur-xl rounded-[2.5rem] border border-[hsl(var(--gov-red))/0.2] p-10 shadow-xl"
            >
              <h2 className="text-[10px] font-black text-[hsl(var(--gov-red))] uppercase tracking-widest flex items-center gap-3 mb-6">
                <XCircle size={20} />
                {t('reject_reason_title')}
              </h2>
              <p className="text-[hsl(var(--gov-red))] text-lg font-medium leading-relaxed">
                {reclamation.motifRejet}
              </p>
            </motion.div>
          )}

          {/* Solution apportée */}
          {reclamation.solutionApportee && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[hsl(var(--gov-green))/0.05] backdrop-blur-xl rounded-[2.5rem] border border-[hsl(var(--gov-green))/0.2] p-10 shadow-xl"
            >
              <h2 className="text-[10px] font-black text-[hsl(var(--gov-green))] uppercase tracking-widest flex items-center gap-3 mb-6">
                <CheckCircle size={20} />
                {t('solution_title')}
              </h2>
              <p className="text-[hsl(var(--gov-green))] text-lg font-medium leading-relaxed">
                {reclamation.solutionApportee}
              </p>
            </motion.div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          
          {/* Citoyen */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card/50 backdrop-blur-xl rounded-[2.5rem] border border-border p-8 shadow-xl"
          >
            <h2 className="text-[10px] font-black text-foreground uppercase tracking-widest flex items-center gap-3 mb-8">
              <User size={18} className="text-[hsl(var(--gov-blue))]" />
              {t('citizen_title')}
            </h2>
            <div className="flex items-center gap-5 mb-6">
              <div className="w-16 h-16 rounded-[1.5rem] bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-white font-black text-xl shadow-lg">
                {reclamation.user.prenom[0]}{reclamation.user.nom[0]}
              </div>
              <div>
                <p className="font-extrabold text-foreground text-lg uppercase tracking-tight">
                  {reclamation.user.prenom} {reclamation.user.nom}
                </p>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">
                  {reclamation.user.email}
                </p>
              </div>
            </div>
            {reclamation.user.telephone && (
              <div className="flex items-center gap-3 px-4 py-3 bg-muted/50 rounded-2xl border border-border/50">
                <Phone size={16} className="text-muted-foreground" />
                <p className="text-sm font-bold text-foreground">{reclamation.user.telephone}</p>
              </div>
            )}
          </motion.div>

          {/* Localisation */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card/50 backdrop-blur-xl rounded-[2.5rem] border border-border p-8 shadow-xl"
          >
            <h2 className="text-[10px] font-black text-foreground uppercase tracking-widest flex items-center gap-3 mb-8">
              <MapPin size={18} className="text-[hsl(var(--gov-red))]" />
              {t('location_title')}
            </h2>
            <div className="space-y-6">
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">{t('commune')}</p>
                <p className="text-sm font-extrabold text-foreground">{locale === 'ar' ? (reclamation.commune.nomArabe || reclamation.commune.nom) : reclamation.commune.nom}</p>
              </div>
              {reclamation.quartierDouar && (
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">{t('district')}</p>
                  <p className="text-sm font-bold text-foreground">{reclamation.quartierDouar}</p>
                </div>
              )}
              {reclamation.adresseComplete && (
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">{t('address')}</p>
                  <p className="text-sm font-bold text-foreground bg-muted/50 p-4 rounded-2xl border border-border/50 mt-2">{reclamation.adresseComplete}</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Établissement */}
          {reclamation.etablissement && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-card/50 backdrop-blur-xl rounded-[2.5rem] border border-border p-8 shadow-xl"
            >
              <h2 className="text-[10px] font-black text-foreground uppercase tracking-widest flex items-center gap-3 mb-8">
                <Building2 size={18} className="text-[hsl(var(--gov-blue))]" />
                {t('establishment_title')}
              </h2>
              <div className="p-5 bg-[hsl(var(--gov-blue))/0.05] rounded-2xl border border-[hsl(var(--gov-blue))/0.1]">
                <p className="font-extrabold text-foreground uppercase tracking-tight mb-3">
                  {locale === 'ar' ? (reclamation.etablissement.nomArabe || reclamation.etablissement.nom) : reclamation.etablissement.nom}
                </p>
                <span className="inline-block px-3 py-1 bg-background rounded-full text-[9px] font-black uppercase tracking-widest text-[hsl(var(--gov-blue))] border border-[hsl(var(--gov-blue))/0.2]">
                  {reclamation.etablissement.secteur}
                </span>
              </div>
            </motion.div>
          )}

          {/* Dates */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-card/50 backdrop-blur-xl rounded-[2.5rem] border border-border p-8 shadow-xl"
          >
            <h2 className="text-[10px] font-black text-foreground uppercase tracking-widest flex items-center gap-3 mb-8">
              <Calendar size={18} className="text-orange-500" />
              {t('dates_title')}
            </h2>
            <div className="space-y-6">
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">{t('created_at')}</p>
                <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                  <Clock size={14} className="text-muted-foreground" />
                  {new Date(reclamation.createdAt).toLocaleDateString(locale === 'ar' ? 'ar-MA' : 'fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">{t('updated_at')}</p>
                <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                  <Clock size={14} className="text-muted-foreground" />
                  {new Date(reclamation.updatedAt).toLocaleDateString(locale === 'ar' ? 'ar-MA' : 'fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Historique */}
          {reclamation.historique && reclamation.historique.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-card/50 backdrop-blur-xl rounded-[2.5rem] border border-border p-8 shadow-xl"
            >
              <h2 className="text-[10px] font-black text-foreground uppercase tracking-widest flex items-center gap-3 mb-8">
                <Clock size={18} className="text-purple-500" />
                {t('history_title')}
              </h2>
              <div className="space-y-6 relative before:absolute before:inset-y-0 before:left-[11px] before:w-[2px] before:bg-border">
                {reclamation.historique.map((h, i) => (
                  <div key={h.id} className="relative flex gap-4 text-sm pl-8">
                    <div className="absolute left-0 top-1.5 w-6 h-6 bg-background rounded-full border-[3px] border-purple-500 shadow-sm" />
                    <div>
                      <p className="font-extrabold text-foreground uppercase tracking-tight text-xs mb-1">{tHistory(h.action)}</p>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        {new Date(h.createdAt).toLocaleDateString(locale === 'ar' ? 'ar-MA' : 'fr-FR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

        </div>
      </div>
    </div>
  );
}
