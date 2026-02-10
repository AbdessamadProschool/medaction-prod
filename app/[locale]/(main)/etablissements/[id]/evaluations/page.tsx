'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Star,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Building2,
  User,
  Calendar,
  Flag,
  Loader2,
  AlertTriangle,
  PenLine,
  Filter,
} from 'lucide-react';
import { PermissionGuard } from '@/hooks/use-permission';

interface Etablissement {
  id: number;
  nom: string;
  secteur: string;
  noteMoyenne: number;
  nombreEvaluations: number;
}

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

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const SORT_OPTIONS = [
  { value: 'recent', label: 'Plus récents' },
  { value: 'highest', label: 'Meilleures notes' },
  { value: 'lowest', label: 'Notes les plus basses' },
];

export default function EvaluationsPage() {
  const params = useParams();
  const router = useRouter();
  const etablissementId = parseInt(params.id as string);

  const [etablissement, setEtablissement] = useState<Etablissement | null>(null);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [distribution, setDistribution] = useState<Record<number, number>>({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [sortBy, setSortBy] = useState('recent');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchEvaluations = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        sortBy,
      });

      const res = await fetch(`/api/evaluations/etablissement/${etablissementId}?${params}`);
      if (res.ok) {
        const data = await res.json();
        setEtablissement(data.etablissement);
        setEvaluations(data.evaluations);
        setDistribution(data.distribution);
        setPagination(prev => ({
          ...prev,
          total: data.pagination.total,
          totalPages: data.pagination.totalPages,
        }));
      } else if (res.status === 404) {
        setError('Établissement non trouvé');
      }
    } catch (err) {
      setError('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, [etablissementId, pagination.page, sortBy]);

  useEffect(() => {
    fetchEvaluations();
  }, [fetchEvaluations]);

  // Calculer le pourcentage pour la barre de distribution
  const getPercentage = (count: number) => {
    const total = Object.values(distribution).reduce((a, b) => a + b, 0);
    return total > 0 ? (count / total) * 100 : 0;
  };

  if (loading && !etablissement) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{error}</h2>
          <button onClick={() => router.back()} className="text-emerald-600 hover:underline">
            Retour
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Évaluations
            </h1>
            {etablissement && (
              <p className="text-gray-500">{etablissement.nom}</p>
            )}
          </div>
          <PermissionGuard permission="evaluations.create">
            <Link
              href={`/evaluer/${etablissementId}`}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 transition-colors"
            >
              <PenLine size={18} />
              Évaluer
            </Link>
          </PermissionGuard>
        </div>

        {etablissement && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Résumé des notes */}
            <div className="lg:col-span-1">
              {/* ... (no change in this block distribution) ... */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 sticky top-24">
                {/* Note moyenne */}
                <div className="text-center mb-6">
                  <div className="text-5xl font-bold text-gray-900 dark:text-white mb-2">
                    {etablissement.noteMoyenne.toFixed(1)}
                  </div>
                  <div className="flex items-center justify-center gap-1 mb-2">
                    {[1, 2, 3, 4, 5].map(i => (
                      <Star
                        key={i}
                        size={20}
                        className={i <= etablissement.noteMoyenne ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-gray-500">
                    {etablissement.nombreEvaluations} évaluation{etablissement.nombreEvaluations > 1 ? 's' : ''}
                  </p>
                </div>

                {/* Distribution des notes */}
                <div className="space-y-3">
                  {[5, 4, 3, 2, 1].map(note => (
                    <div key={note} className="flex items-center gap-3">
                      <div className="flex items-center gap-1 w-8">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{note}</span>
                        <Star size={12} className="text-yellow-400 fill-yellow-400" />
                      </div>
                      <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full transition-all duration-500"
                          style={{ width: `${getPercentage(distribution[note])}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-400 w-8 text-right">
                        {distribution[note]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Liste des évaluations */}
            <div className="lg:col-span-2 space-y-4">
              {/* Tri */}
              <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
                <span className="text-sm text-gray-500">
                  {pagination.total} évaluation{pagination.total > 1 ? 's' : ''}
                </span>
                <div className="flex items-center gap-2">
                  <Filter size={16} className="text-gray-400" />
                  <select
                    value={sortBy}
                    onChange={(e) => {
                      setSortBy(e.target.value);
                      setPagination(p => ({ ...p, page: 1 }));
                    }}
                    className="text-sm bg-transparent border-0 text-gray-700 dark:text-gray-300 focus:ring-0"
                  >
                    {SORT_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Évaluations */}
              {evaluations.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center border border-gray-100 dark:border-gray-700">
                  <Star className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    Aucune évaluation
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Soyez le premier à évaluer cet établissement !
                  </p>
                  <PermissionGuard permission="evaluations.create">
                    <Link
                      href={`/evaluer/${etablissementId}`}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 transition-colors"
                    >
                      <PenLine size={18} />
                      Donner mon avis
                    </Link>
                  </PermissionGuard>
                </div>
              ) : (
                <div className="space-y-4">
                  {evaluations.map(evaluation => (
                    <div
                      key={evaluation.id}
                      className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700"
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-white font-bold">
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
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {evaluation.user.prenom} {evaluation.user.nom[0]}.
                            </p>
                            <div className="flex items-center gap-2 text-xs text-gray-400">
                              <Calendar size={12} />
                              {new Date(evaluation.createdAt).toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                              })}
                            </div>
                          </div>
                        </div>

                        {/* Note */}
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map(i => (
                            <Star
                              key={i}
                              size={16}
                              className={i <= evaluation.noteGlobale ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Commentaire */}
                      {evaluation.commentaire && (
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                          {evaluation.commentaire}
                        </p>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                        <PermissionGuard permission="evaluations.report">
                          <button className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-red-500 transition-colors">
                            <Flag size={14} />
                            Signaler
                          </button>
                        </PermissionGuard>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
                  <p className="text-sm text-gray-500">
                    Page {pagination.page} sur {pagination.totalPages}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                      disabled={pagination.page === 1}
                      className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <button
                      onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                      disabled={pagination.page === pagination.totalPages}
                      className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
