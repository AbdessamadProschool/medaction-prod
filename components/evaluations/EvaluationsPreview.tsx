'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Star, ChevronRight, User, Loader2 } from 'lucide-react';
import { StarRating, RatingDistribution } from '@/components/ui/StarRating';

interface Evaluation {
  id: number;
  noteGlobale: number;
  commentaire: string | null;
  createdAt: string;
  user: {
    id: number;
    nom: string;
    prenom: string;
    photo: string | null;
  };
}

interface EvaluationsPreviewProps {
  etablissementId: number;
  etablissementNom: string;
  noteMoyenne: number;
  nombreEvaluations: number;
}

export function EvaluationsPreview({
  etablissementId,
  etablissementNom,
  noteMoyenne,
  nombreEvaluations,
}: EvaluationsPreviewProps) {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [distribution, setDistribution] = useState<Record<number, number>>({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvaluations = async () => {
      try {
        const res = await fetch(`/api/evaluations/etablissement/${etablissementId}?limit=3`);
        if (res.ok) {
          const data = await res.json();
          setEvaluations(data.evaluations);
          setDistribution(data.distribution);
        }
      } catch (error) {
        console.error('Erreur:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvaluations();
  }, [etablissementId]);

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 dark:text-white">Avis</h3>
          <Link
            href={`/evaluer/${etablissementId}`}
            className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
          >
            Donner mon avis
          </Link>
        </div>

        <div className="flex items-center gap-6">
          {/* Note moyenne */}
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {noteMoyenne.toFixed(1)}
            </div>
            <StarRating value={noteMoyenne} size={14} />
            <p className="text-xs text-gray-500 mt-1">{nombreEvaluations} avis</p>
          </div>

          {/* Distribution */}
          <div className="flex-1">
            <RatingDistribution distribution={distribution} />
          </div>
        </div>
      </div>

      {/* Derniers avis */}
      {evaluations.length > 0 ? (
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {evaluations.map((evaluation) => (
            <div key={evaluation.id} className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                  {evaluation.user.photo ? (
                    <img
                      src={evaluation.user.photo}
                      alt=""
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    `${evaluation.user.prenom[0]}${evaluation.user.nom[0]}`
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm text-gray-900 dark:text-white">
                      {evaluation.user.prenom} {evaluation.user.nom[0]}.
                    </span>
                    <StarRating value={evaluation.noteGlobale} size={12} />
                  </div>
                  {evaluation.commentaire && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {evaluation.commentaire}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(evaluation.createdAt).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-8 text-center">
          <Star className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">
            Aucun avis pour le moment.
            <br />
            <Link href={`/evaluer/${etablissementId}`} className="text-emerald-600 hover:underline">
              Soyez le premier à donner votre avis !
            </Link>
          </p>
        </div>
      )}

      {/* Footer */}
      {nombreEvaluations > 3 && (
        <Link
          href={`/etablissements/${etablissementId}/evaluations`}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-50 dark:bg-gray-700/50 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          Voir tous les avis ({nombreEvaluations})
          <ChevronRight size={16} />
        </Link>
      )}
    </div>
  );
}

export default EvaluationsPreview;
