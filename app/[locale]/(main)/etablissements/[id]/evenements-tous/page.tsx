'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Calendar,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  MapPin,
  Clock,
  Users,
  Filter,
  CalendarDays,
} from 'lucide-react';

interface Evenement {
  id: number;
  titre: string;
  description: string;
  dateDebut: string;
  dateFin: string | null;
  lieu: string | null;
  statut: string;
  typeCategorique: string | null;
  imageAffiche: string | null;
  _count?: {
    inscriptions: number;
  };
}

interface Etablissement {
  id: number;
  nom: string;
  secteur: string;
}

const STATUT_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  BROUILLON: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Brouillon' },
  EN_ATTENTE_VALIDATION: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'En attente' },
  VALIDE: { bg: 'bg-green-100', text: 'text-green-700', label: 'Validé' },
  PUBLIE: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Publié' },
  ANNULE: { bg: 'bg-red-100', text: 'text-red-700', label: 'Annulé' },
  TERMINE: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Terminé' },
};

const FILTER_OPTIONS = [
  { value: '', label: 'Tous les événements' },
  { value: 'PUBLIE', label: 'En cours' },
  { value: 'TERMINE', label: 'Terminés' },
  { value: 'ANNULE', label: 'Annulés' },
];

export default function TousEvenementsPage() {
  const params = useParams();
  const etablissementId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [evenements, setEvenements] = useState<Evenement[]>([]);
  const [etablissement, setEtablissement] = useState<Etablissement | null>(null);
  
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [statutFilter, setStatutFilter] = useState('');
  const limit = 12;

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch établissement info
      const etabRes = await fetch(`/api/etablissements/${etablissementId}`);
      if (etabRes.ok) {
        const etabData = await etabRes.json();
        setEtablissement(etabData.data || etabData);
      }

      // Fetch événements
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', limit.toString());
      params.set('etablissementId', etablissementId);
      if (statutFilter) params.set('statut', statutFilter);

      const res = await fetch(`/api/evenements?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setEvenements(data.data || data.evenements || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotal(data.pagination?.total || data.total || 0);
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, statutFilter, etablissementId]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isUpcoming = (dateString: string) => {
    return new Date(dateString) > new Date();
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
                <Calendar className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Tous les événements</h1>
                <p className="text-white/80">{etablissement.nom}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="flex items-center justify-between mb-8">
          <p className="text-gray-600">
            {total} événement{total > 1 ? 's' : ''}
          </p>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={statutFilter}
              onChange={(e) => {
                setStatutFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-[hsl(213,80%,28%)]"
            >
              {FILTER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-[hsl(213,80%,28%)] animate-spin" />
          </div>
        ) : evenements.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl">
            <Calendar className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900">Aucun événement</h3>
            <p className="text-gray-500">
              {statutFilter ? 'Aucun événement avec ce filtre' : 'Pas encore d\'événements pour cet établissement'}
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {evenements.map((event, index) => {
              const statutInfo = STATUT_CONFIG[event.statut] || STATUT_CONFIG.BROUILLON;
              const upcoming = isUpcoming(event.dateDebut);
              
              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow group"
                >
                  {/* Image */}
                  <div className="aspect-video bg-gradient-to-br from-[hsl(213,80%,28%)] to-[hsl(213,80%,45%)] relative overflow-hidden">
                    {event.imageAffiche ? (
                      <img
                        src={event.imageAffiche}
                        alt={event.titre}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <CalendarDays className="w-16 h-16 text-white/30" />
                      </div>
                    )}
                    <div className="absolute top-3 right-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statutInfo.bg} ${statutInfo.text}`}>
                        {statutInfo.label}
                      </span>
                    </div>
                    {upcoming && (
                      <div className="absolute top-3 left-3">
                        <span className="px-2.5 py-1 bg-[hsl(45,93%,47%)] text-gray-900 rounded-full text-xs font-bold">
                          À venir
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <h3 className="font-semibold text-gray-900 line-clamp-2 mb-3">
                      {event.titre}
                    </h3>

                    <div className="space-y-2 text-sm text-gray-500 mb-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-[hsl(213,80%,28%)]" />
                        <span>{formatDate(event.dateDebut)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-[hsl(213,80%,28%)]" />
                        <span>{formatTime(event.dateDebut)}</span>
                      </div>
                      {event.lieu && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-[hsl(213,80%,28%)]" />
                          <span className="truncate">{event.lieu}</span>
                        </div>
                      )}
                    </div>

                    <Link
                      href={`/evenements/${event.id}`}
                      className="block w-full text-center py-2.5 bg-[hsl(213,80%,28%)]/10 text-[hsl(213,80%,28%)] rounded-xl font-medium hover:bg-[hsl(213,80%,28%)] hover:text-white transition-colors"
                    >
                      Voir les détails
                    </Link>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-10">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50"
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
              className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
