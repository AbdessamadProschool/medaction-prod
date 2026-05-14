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
} from 'lucide-react';
import DownloadPhotosButton from '@/components/reclamations/DownloadPhotosButton';
import { useTranslations, useLocale } from 'next-intl';
import { toast } from 'sonner';

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

const STATUT_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  null: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'En attente' },
  ACCEPTEE: { bg: 'bg-green-100', text: 'text-green-700', label: 'Acceptée' },
  REJETEE: { bg: 'bg-red-100', text: 'text-red-700', label: 'Rejetée' },
};

const AFFECTATION_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  NON_AFFECTEE: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Non affectée' },
  AFFECTEE: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Affectée' },
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
        setReclamation(data.data); // L'API retourne { data: reclamation }
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
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  if (error || !reclamation) {
    return (
      <div className="text-center py-16">
        <AlertTriangle className="w-16 h-16 text-red-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">{error || tCommon('errors.generic')}</h2>
        <Link href="/admin/reclamations" className="text-emerald-600 hover:underline">
          {t('back_to_list')}
        </Link>
      </div>
    );
  }

  const statutInfo = STATUT_COLORS[reclamation.statut || 'null'] || STATUT_COLORS['null'];
  const affectationInfo = AFFECTATION_COLORS[reclamation.affectationReclamation] || AFFECTATION_COLORS.NON_AFFECTEE;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t('title', { id: reclamation.id })}
            </h1>
            <p className="text-gray-500 mt-1">{reclamation.titre}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${statutInfo.bg} ${statutInfo.text}`}>
            {t(`status.${reclamation.statut || 'pending'}`)}
          </span>
          <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${affectationInfo.bg} ${affectationInfo.text}`}>
            {t(`assignment.${reclamation.affectationReclamation}`)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contenu principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <MessageSquare size={20} className="text-emerald-500" />
              {t('description_title')}
            </h2>
            <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
              {reclamation.description}
            </p>
            <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
              <span className="bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
                {tCategories(reclamation.categorie)}
              </span>
            </div>
          </div>

          {/* Photos */}
          {reclamation.medias && reclamation.medias.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <ImageIcon size={20} className="text-emerald-500" />
                  {t('photos_title', { count: reclamation.medias.filter(m => m.type === 'IMAGE').length })}
                </h2>
                <DownloadPhotosButton
                  reclamationId={reclamation.id}
                  photoCount={reclamation.medias.filter(m => m.type === 'IMAGE').length}
                  variant="button"
                />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {reclamation.medias.map((media) => (
                  <div key={media.id} className="aspect-square rounded-xl overflow-hidden bg-gray-100">
                    <img
                      src={media.urlPublique}
                      alt="Photo réclamation"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions Admin */}
          {reclamation.statut === null && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <FileText size={20} className="text-emerald-500" />
                {t('actions_title')}
              </h2>

              {showRejectForm ? (
                <div className="space-y-4">
                  <textarea
                    value={motifRejet}
                    onChange={(e) => setMotifRejet(e.target.value)}
                    placeholder={t('reject_reason_placeholder')}
                    rows={3}
                    className="gov-textarea w-full"
                  />
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleReject}
                      disabled={actionLoading === 'reject'}
                      className="gov-btn text-white bg-red-500 hover:bg-red-600 px-4 py-2 disabled:opacity-50"
                    >
                      {actionLoading === 'reject' && <Loader2 size={16} className="animate-spin" />}
                      {t('confirm_reject')}
                    </button>
                    <button
                      onClick={() => setShowRejectForm(false)}
                      className="gov-btn gov-btn-secondary px-4 py-2"
                    >
                      {t('cancel')}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <button
                    onClick={handleAccept}
                    disabled={actionLoading === 'accept'}
                    className="gov-btn gov-btn-primary px-6 py-3"
                  >
                    {actionLoading === 'accept' ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <CheckCircle size={18} />
                    )}
                    {t('accept')}
                  </button>
                  <button
                    onClick={() => setShowRejectForm(true)}
                    className="gov-btn bg-white border border-red-200 text-red-600 hover:bg-red-50 px-6 py-3"
                  >
                    <XCircle size={18} />
                    {t('reject')}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Motif de rejet */}
          {reclamation.statut === 'REJETEE' && reclamation.motifRejet && (
            <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-200 dark:border-red-800 p-6">
              <h2 className="font-semibold text-red-700 dark:text-red-400 mb-2 flex items-center gap-2">
                <XCircle size={20} />
                {t('reject_reason_title')}
              </h2>
              <p className="text-red-600 dark:text-red-300">{reclamation.motifRejet}</p>
            </div>
          )}

          {/* Solution apportée */}
          {reclamation.solutionApportee && (
            <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl border border-green-200 dark:border-green-800 p-6">
              <h2 className="font-semibold text-green-700 dark:text-green-400 mb-2 flex items-center gap-2">
                <CheckCircle size={20} />
                {t('solution_title')}
              </h2>
              <p className="text-green-600 dark:text-green-300">{reclamation.solutionApportee}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Citoyen */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <User size={20} className="text-emerald-500" />
              {t('citizen_title')}
            </h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-white font-bold">
                  {reclamation.user.prenom[0]}{reclamation.user.nom[0]}
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {reclamation.user.prenom} {reclamation.user.nom}
                  </p>
                  <p className="text-sm text-gray-500">{reclamation.user.email}</p>
                </div>
              </div>
              {reclamation.user.telephone && (
                <p className="text-sm text-gray-500 flex items-center gap-1.5"><Phone size={14} className="text-gray-400" /> {reclamation.user.telephone}</p>
              )}
            </div>
          </div>

          {/* Localisation */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <MapPin size={20} className="text-emerald-500" />
              {t('location_title')}
            </h2>
            <div className="space-y-2 text-sm">
              <p className="text-gray-600 dark:text-gray-300">
                <span className="font-medium">{t('commune')}:</span> {locale === 'ar' ? (reclamation.commune.nomArabe || reclamation.commune.nom) : reclamation.commune.nom}
              </p>
              {reclamation.quartierDouar && (
                <p className="text-gray-600 dark:text-gray-300">
                  <span className="font-medium">{t('district')}:</span> {reclamation.quartierDouar}
                </p>
              )}
              {reclamation.adresseComplete && (
                <p className="text-gray-600 dark:text-gray-300">
                  <span className="font-medium">{t('address')}:</span> {reclamation.adresseComplete}
                </p>
              )}
            </div>
          </div>

          {/* Établissement */}
          {reclamation.etablissement && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Building2 size={20} className="text-emerald-500" />
                {t('establishment_title')}
              </h2>
              <p className="font-medium text-gray-900 dark:text-white">
                {locale === 'ar' ? (reclamation.etablissement.nomArabe || reclamation.etablissement.nom) : reclamation.etablissement.nom}
              </p>
              <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded mt-2 inline-block">
                {reclamation.etablissement.secteur}
              </span>
            </div>
          )}

          {/* Dates */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Calendar size={20} className="text-emerald-500" />
              {t('dates_title')}
            </h2>
            <div className="space-y-2 text-sm">
              <p className="text-gray-600 dark:text-gray-300">
                <span className="font-medium">{t('created_at')}:</span>{' '}
                {new Date(reclamation.createdAt).toLocaleDateString(locale === 'ar' ? 'ar-MA' : 'fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
              <p className="text-gray-600 dark:text-gray-300">
                <span className="font-medium">{t('updated_at')}:</span>{' '}
                {new Date(reclamation.updatedAt).toLocaleDateString(locale === 'ar' ? 'ar-MA' : 'fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>

          {/* Historique */}
          {reclamation.historique && reclamation.historique.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Clock size={20} className="text-emerald-500" />
                {t('history_title')}
              </h2>
              <div className="space-y-4">
                {reclamation.historique.map((h) => (
                  <div key={h.id} className="flex gap-3 text-sm">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full mt-1.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{tHistory(h.action)}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(h.createdAt).toLocaleDateString(locale === 'ar' ? 'ar-MA' : 'fr-FR')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
