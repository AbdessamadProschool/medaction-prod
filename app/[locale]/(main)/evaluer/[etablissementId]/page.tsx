'use client';
import { useTranslations } from 'next-intl';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { toast } from 'sonner';
import {
  Star,
  Camera,
  X,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Building2,
} from 'lucide-react';
import { PermissionGuard } from '@/hooks/use-permission';

interface Etablissement {
  id: number;
  nom: string;
  secteur: string;
  photoPrincipale: string | null;
  noteMoyenne: number;
  nombreEvaluations: number;
}

interface ExistingEvaluation {
  id: number;
  noteGlobale: number;
  commentaire: string | null;
  createdAt: string;
}

export default function EvaluationPage() {
  const params = useParams();
  const router = useRouter();
  const t = useTranslations('evaluation_page');
  const { data: session, status } = useSession();
  const etablissementId = parseInt(params.etablissementId as string);

  const [etablissement, setEtablissement] = useState<Etablissement | null>(null);
  const [existingEval, setExistingEval] = useState<ExistingEvaluation | null>(null);
  const [isModifiable, setIsModifiable] = useState(false);
  const [joursRestants, setJoursRestants] = useState(0);

  const [note, setNote] = useState(0);
  const [hoverNote, setHoverNote] = useState(0);
  const [commentaire, setCommentaire] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Charger les données
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push(`/login?callbackUrl=/evaluer/${etablissementId}`);
      return;
    }

    if (status === 'authenticated') {
      fetchData();
    }
  }, [status, etablissementId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Charger l'établissement
      const etabRes = await fetch(`/api/etablissements/${etablissementId}`);
      if (etabRes.ok) {
        const etabData = await etabRes.json();
        setEtablissement(etabData.data || etabData);
      } else {
        setError(t('error_not_found'));
        return;
      }

      // Vérifier si l'utilisateur a déjà évalué
      const evalRes = await fetch(`/api/evaluations/user/${etablissementId}`);
      if (evalRes.ok) {
        const evalData = await evalRes.json();
        if (evalData.hasEvaluated && evalData.evaluation) {
          setExistingEval(evalData.evaluation);
          setNote(evalData.evaluation.noteGlobale);
          setCommentaire(evalData.evaluation.commentaire || '');
          setIsModifiable(evalData.isModifiable);
          setJoursRestants(evalData.joursRestants);
        }
      }
    } catch (err) {
      setError(t('error_loading'));
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (photos.length + files.length > 3) {
      toast.error(t('error_max_photos'));
      return;
    }

    setPhotos(prev => [...prev, ...files]);
    
    // Créer les previews
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
    setPhotoPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (note === 0) {
      setError(t('error_no_rating'));
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const url = existingEval 
        ? `/api/evaluations/${existingEval.id}`
        : '/api/evaluations';
      
      const method = existingEval ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          etablissementId,
          noteGlobale: note,
          commentaire: commentaire.trim() || undefined,
        }),
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.push(`/etablissements/${etablissementId}`);
        }, 2000);
      } else {
        const data = await res.json();
        setError(data.error || t('error_submit'));
      }
    } catch (err) {
      setError(t('error_connection'));
    } finally {
      setSubmitting(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  if (error && !etablissement) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{error}</h2>
          <button
            onClick={() => router.back()}
            className="text-emerald-600 hover:underline"
          >
              {t('back')}
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {existingEval ? t('success_edit_title') : t('success_title')}
          </h2>
          <p className="text-gray-500">{t('redirecting')}</p>
        </div>
      </div>
    );
  }

  if (existingEval && !isModifiable) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-8 max-w-md w-full text-center">
          <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            {t('already_submitted_title')}
          </h2>
          <p className="text-gray-500 mb-4">
            {t('already_submitted_desc')}
          </p>
          <div className="flex items-center justify-center gap-2 mb-6">
            {[1, 2, 3, 4, 5].map(i => (
              <Star
                key={i}
                size={24}
                className={i <= existingEval.noteGlobale ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
              />
            ))}
          </div>
          <button
            onClick={() => router.push(`/etablissements/${etablissementId}`)}
            className="w-full py-3 bg-emerald-500 text-white rounded-xl font-semibold hover:bg-emerald-600 transition-colors"
          >
            {t('view_establishment_btn')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <PermissionGuard 
      permission="evaluations.create" 
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-3xl shadow-xl max-w-md mx-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t('access_restricted_title')}</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {t('access_restricted_desc')}
            </p>
            <button
              onClick={() => router.back()}
              className="px-6 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-white rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              {t('back')}
            </button>
          </div>
        </div>
      }
    >
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
        <div className="max-w-lg mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <button
              onClick={() => router.back()}
              className="absolute top-4 left-4 p-2 text-gray-500 hover:text-gray-700"
            >
              <X size={24} />
            </button>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {existingEval ? t('edit_title') : t('title')}
            </h1>
          </div>

          {/* Établissement Info */}
          {etablissement && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center overflow-hidden">
                  {etablissement.photoPrincipale ? (
                    <Image
                      src={etablissement.photoPrincipale}
                      alt={etablissement.nom}
                      width={64}
                      height={64}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Building2 className="w-8 h-8 text-white" />
                  )}
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900 dark:text-white">
                    {etablissement.nom}
                  </h2>
                  <p className="text-sm text-gray-500">{etablissement.secteur}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map(i => (
                        <Star
                          key={i}
                          size={12}
                          className={i <= etablissement.noteMoyenne ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-gray-400">
                      ({etablissement.nombreEvaluations} avis)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Formulaire */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Note */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <label className="block text-center mb-4">
                <span className="text-lg font-semibold text-gray-900 dark:text-white">
                  {t('rating_question')}
                </span>
              </label>
              <div className="flex items-center justify-center gap-3">
                {[1, 2, 3, 4, 5].map(i => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setNote(i)}
                    onMouseEnter={() => setHoverNote(i)}
                    onMouseLeave={() => setHoverNote(0)}
                    className="p-1 transition-transform hover:scale-110"
                  >
                    <Star
                      size={40}
                      className={`transition-colors ${
                        i <= (hoverNote || note)
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
              {note > 0 && (
                <p className="text-center text-sm text-gray-500 mt-3">
                  {note === 1 && t('ratings.1')}
                  {note === 2 && t('ratings.2')}
                  {note === 3 && t('ratings.3')}
                  {note === 4 && t('ratings.4')}
                  {note === 5 && t('ratings.5')}
                </p>
              )}
            </div>

            {/* Commentaire */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <label className="block mb-3">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('comment_label')}
                </span>
              </label>
              <textarea
                value={commentaire}
                onChange={(e) => setCommentaire(e.target.value)}
                placeholder={t('comment_placeholder')}
                rows={4}
                maxLength={1000}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all resize-none"
              />
              <p className="text-xs text-gray-400 mt-2 text-right">
                {commentaire.length}/1000
              </p>
            </div>

            {/* Photos (Non supporté pour le moment) */}
            {/* <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 opacity-50 pointer-events-none">
              <label className="block mb-3">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Photos (Bientôt disponible)
                </span>
              </label>
              <div className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl">
                 <Camera className="w-6 h-6 text-gray-400 mb-1" />
                 <span className="text-sm text-gray-500">Fonctionnalité à venir</span>
              </div>
            </div> */}

            {/* Info modification */}
            {existingEval && isModifiable && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-4 text-center">
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  {t('edit_remaining_days', { days: joursRestants })}
                </p>
              </div>
            )}

            {/* Erreur */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 text-center">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting || note === 0}
              className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-semibold text-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {t('submitting')}
                </>
              ) : existingEval ? (
                t('submit_btn_edit')
              ) : (
                t('submit_btn_create')
              )}
            </button>
          </form>
        </div>
      </div>
    </PermissionGuard>
  );
}
