'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Star, Building2, Calendar, Edit3, Lock, ExternalLink } from 'lucide-react';

interface Evaluation {
  id: number;
  note: number;
  commentaire: string | null;
  createdAt: string;
  etablissement?: {
    id: number;
    nom: string;
    secteur: string;
  } | null;
}

export default function MesEvaluationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?redirect=/mes-evaluations');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchEvaluations();
    }
  }, [status]);

  const fetchEvaluations = async () => {
    try {
      const res = await fetch('/api/users/me/evaluations');
      if (res.ok) {
        const data = await res.json();
        setEvaluations(data.evaluations || []);
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  // Vérifie si l'évaluation peut être modifiée (< 7 jours)
  const canEdit = (createdAt: string): boolean => {
    const created = new Date(createdAt);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays < 7;
  };

  // Jours restants pour modifier
  const daysLeft = (createdAt: string): number => {
    const created = new Date(createdAt);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, 7 - diffDays);
  };

  // Rendu des étoiles
  const renderStars = (note: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-5 h-5 ${
              star <= note
                ? 'fill-[hsl(45,93%,47%)] text-[hsl(45,93%,47%)]'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-[hsl(213,80%,28%)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Mes Évaluations</h1>
          <p className="text-gray-600">
            Historique de vos évaluations d'établissements
          </p>
        </div>

        {/* Info box */}
        <div className="gov-card p-4 mb-6 bg-blue-50 border-blue-200">
          <div className="flex items-start gap-3">
            <Edit3 className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <p className="text-sm text-blue-800 font-medium">
                Modification possible pendant 7 jours
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Après ce délai, votre évaluation sera verrouillée et ne pourra plus être modifiée.
              </p>
            </div>
          </div>
        </div>

        {/* Liste des évaluations */}
        {evaluations.length === 0 ? (
          <div className="gov-card p-12 text-center">
            <Star className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Aucune évaluation
            </h3>
            <p className="text-gray-500 mb-6">
              Vous n'avez pas encore évalué d'établissement.
            </p>
            <Link
              href="/etablissements"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[hsl(213,80%,28%)] text-white rounded-xl font-medium hover:bg-[hsl(213,80%,35%)] transition-colors"
            >
              <Building2 className="w-5 h-5" />
              Voir les établissements
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {evaluations.map((evaluation, index) => (
              <motion.div
                key={evaluation.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="gov-card p-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    {/* Établissement */}
                    <div className="flex items-center gap-2 mb-2">
                      <Building2 className="w-5 h-5 text-[hsl(213,80%,28%)]" />
                      <Link
                        href={`/etablissements/${evaluation.etablissement?.id || ''}`}
                        className="font-semibold text-gray-900 hover:text-[hsl(213,80%,28%)] transition-colors"
                      >
                        {evaluation.etablissement?.nom || 'N/A'}
                      </Link>
                      <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">
                        {evaluation.etablissement?.secteur || 'N/A'}
                      </span>
                    </div>

                    {/* Note */}
                    <div className="mb-3">
                      {renderStars(evaluation.note)}
                    </div>

                    {/* Commentaire */}
                    {evaluation.commentaire && (
                      <p className="text-gray-600 text-sm mb-3">
                        "{evaluation.commentaire}"
                      </p>
                    )}

                    {/* Date */}
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {new Date(evaluation.createdAt).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Action */}
                  <div className="flex flex-col items-end gap-2">
                    {canEdit(evaluation.createdAt) ? (
                      <>
                        <Link
                          href={`/evaluer/${evaluation.etablissement?.id || ''}`}
                          className="flex items-center gap-2 px-4 py-2 bg-[hsl(213,80%,28%)]/10 text-[hsl(213,80%,28%)] rounded-lg text-sm font-medium hover:bg-[hsl(213,80%,28%)] hover:text-white transition-colors"
                        >
                          <Edit3 className="w-4 h-4" />
                          Modifier
                        </Link>
                        <span className="text-xs text-gray-500">
                          {daysLeft(evaluation.createdAt)} jour(s) restant(s)
                        </span>
                      </>
                    ) : (
                      <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-500 rounded-lg text-sm">
                        <Lock className="w-4 h-4" />
                        Verrouillée
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Stats */}
        {evaluations.length > 0 && (
          <div className="mt-8 gov-card p-6 bg-gradient-to-r from-[hsl(213,80%,28%)]/5 to-transparent">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total évaluations</p>
                <p className="text-2xl font-bold text-gray-900">{evaluations.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Note moyenne donnée</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold text-[hsl(45,93%,47%)]">
                    {(evaluations.reduce((acc, e) => acc + e.note, 0) / evaluations.length).toFixed(1)}
                  </p>
                  <Star className="w-6 h-6 fill-[hsl(45,93%,47%)] text-[hsl(45,93%,47%)]" />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
