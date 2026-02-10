'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Star,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  SlidersHorizontal,
  User,
  Calendar,
  Building2,
} from 'lucide-react';

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

interface Etablissement {
  id: number;
  nom: string;
  secteur: string;
  noteMoyenne: number;
  nombreEvaluations: number;
}

const SORT_OPTIONS = [
  { value: 'recent', label: 'Plus récentes' },
  { value: 'highest', label: 'Meilleures notes' },
  { value: 'lowest', label: 'Moins bonnes' },
];

export default function ToutesEvaluationsPage() {
  const params = useParams();
  const etablissementId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [etablissement, setEtablissement] = useState<Etablissement | null>(null);
  const [distribution, setDistribution] = useState<Record<number, number>>({});
  
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [sortBy, setSortBy] = useState('recent');
  const limit = 12;

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/evaluations/etablissement/${etablissementId}?page=${page}&limit=${limit}&sortBy=${sortBy}`
      );
      if (res.ok) {
        const data = await res.json();
        setEvaluations(data.evaluations);
        setEtablissement(data.etablissement);
        setDistribution(data.distribution);
        setTotalPages(data.pagination.totalPages);
        setTotal(data.pagination.total);
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, sortBy, etablissementId]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const renderStars = (rating: number) => {
    return [...Array(5)].map((_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'text-gray-300'
        }`}
      />
    ));
  };

  if (!etablissement && !loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900">Établissement non trouvé</h2>
          <Link href="/etablissements" className="text-[hsl(213,80%,28%)] hover:underline mt-4 inline-block">
            Retour aux établissements
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-[hsl(213,80%,28%)] to-[hsl(213,80%,40%)] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link
            href={`/etablissements/${etablissementId}`}
            className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour à l'établissement
          </Link>
          
          {etablissement && (
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                <Star className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Toutes les évaluations</h1>
                <p className="text-white/80">{etablissement.nom}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar Stats */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-24">
              {etablissement && (
                <>
                  <div className="text-center mb-6">
                    <p className="text-5xl font-bold text-gray-900">
                      {etablissement.noteMoyenne.toFixed(1)}
                    </p>
                    <div className="flex justify-center gap-1 my-2">
                      {renderStars(etablissement.noteMoyenne)}
                    </div>
                    <p className="text-sm text-gray-500">
                      {total} avis
                    </p>
                  </div>

                  <div className="space-y-3">
                    {[5, 4, 3, 2, 1].map((star) => {
                      const count = distribution[star] || 0;
                      const percentage = total > 0 ? (count / total) * 100 : 0;
                      return (
                        <div key={star} className="flex items-center gap-3">
                          <span className="text-sm text-gray-600 w-4">{star}</span>
                          <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${percentage}%` }}
                              className="h-full bg-amber-400 rounded-full"
                            />
                          </div>
                          <span className="text-sm text-gray-500 w-8">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Evaluations List */}
          <div className="lg:col-span-3">
            {/* Sort & Info */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-gray-600">
                {total} évaluation{total > 1 ? 's' : ''}
              </p>
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-gray-500" />
                <select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value);
                    setPage(1);
                  }}
                  className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-[hsl(213,80%,28%)]"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-[hsl(213,80%,28%)] animate-spin" />
              </div>
            ) : evaluations.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl">
                <Star className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900">Aucune évaluation</h3>
                <p className="text-gray-500">Soyez le premier à donner votre avis !</p>
              </div>
            ) : (
              <div className="space-y-4">
                {evaluations.map((evaluation, index) => (
                  <motion.div
                    key={evaluation.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[hsl(213,80%,28%)] to-[hsl(213,80%,40%)] flex items-center justify-center text-white font-bold">
                          {evaluation.user.prenom.charAt(0)}{evaluation.user.nom.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">
                            {evaluation.user.prenom} {evaluation.user.nom.charAt(0)}.
                          </p>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Calendar className="w-3 h-3" />
                            {formatDate(evaluation.createdAt)}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-0.5">
                        {renderStars(evaluation.noteGlobale)}
                      </div>
                    </div>
                    
                    {evaluation.commentaire && (
                      <p className="text-gray-600 leading-relaxed">
                        {evaluation.commentaire}
                      </p>
                    )}
                  </motion.div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:hover:bg-transparent"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                
                {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 7) {
                    pageNum = i + 1;
                  } else if (page <= 4) {
                    pageNum = i + 1;
                  } else if (page >= totalPages - 3) {
                    pageNum = totalPages - 6 + i;
                  } else {
                    pageNum = page - 3 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                        page === pageNum
                          ? 'bg-[hsl(213,80%,28%)] text-white'
                          : 'hover:bg-gray-100 text-gray-600'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:hover:bg-transparent"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
