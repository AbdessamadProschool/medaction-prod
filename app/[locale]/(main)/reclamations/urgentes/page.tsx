'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  MapPin,
  Calendar,
  User,
  Clock,
  Eye,
  Filter,
  SlidersHorizontal,
  Building2,
  ArrowUpRight,
  Flame,
} from 'lucide-react';

interface Reclamation {
  id: number;
  titre: string;
  description: string;
  categorie: string;
  statut: string | null;
  affectationReclamation: string;
  createdAt: string;
  dateAffectation: string | null;
  quartierDouar: string | null;
  user: {
    id: number;
    nom: string;
    prenom: string;
  };
  commune: {
    id: number;
    nom: string;
  };
  etablissement: {
    id: number;
    nom: string;
    secteur: string;
  } | null;
  _count?: {
    medias: number;
  };
}

const SORT_OPTIONS = [
  { value: 'createdAt', label: 'Date de création' },
  { value: 'dateAffectation', label: 'Date d\'affectation' },
];

const COMMUNE_FILTER = [
  { value: '', label: 'Toutes les communes' },
];

export default function ReclamationsUrgentesPage() {
  const [loading, setLoading] = useState(true);
  const [reclamations, setReclamations] = useState<Reclamation[]>([]);
  
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [sortBy, setSortBy] = useState('createdAt');
  const [communeFilter, setCommuneFilter] = useState('');
  const [communes, setCommunes] = useState<{id: number; nom: string}[]>([]);
  const limit = 15;

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', limit.toString());
      params.set('urgentes', 'true'); // Filter for urgent/pending reclamations
      params.set('sortBy', sortBy);
      if (communeFilter) params.set('communeId', communeFilter);

      const res = await fetch(`/api/reclamations?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setReclamations(data.data || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotal(data.pagination?.total || 0);
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCommunes = async () => {
    try {
      const res = await fetch('/api/communes');
      if (res.ok) {
        const data = await res.json();
        setCommunes(data.data || data || []);
      }
    } catch (error) {
      console.error('Erreur communes:', error);
    }
  };

  useEffect(() => {
    fetchCommunes();
  }, []);

  useEffect(() => {
    fetchData();
  }, [page, sortBy, communeFilter]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getDaysAgo = (dateString: string) => {
    const days = Math.floor((Date.now() - new Date(dateString).getTime()) / (1000 * 60 * 60 * 24));
    if (days === 0) return "Aujourd'hui";
    if (days === 1) return "Hier";
    return `Il y a ${days} jours`;
  };

  const getUrgencyLevel = (dateString: string) => {
    const days = Math.floor((Date.now() - new Date(dateString).getTime()) / (1000 * 60 * 60 * 24));
    if (days >= 7) return { level: 'critical', label: 'Critique', color: 'bg-red-500' };
    if (days >= 3) return { level: 'high', label: 'Élevée', color: 'bg-orange-500' };
    return { level: 'normal', label: 'Normale', color: 'bg-yellow-500' };
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                Réclamations Urgentes
                <Flame className="w-6 h-6 text-yellow-300 animate-pulse" />
              </h1>
              <p className="text-white/80">
                Réclamations en attente nécessitant une attention immédiate
              </p>
            </div>
          </div>

          {/* Stats rapides */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="bg-white/20 rounded-xl p-4 backdrop-blur-sm">
              <p className="text-3xl font-bold">{total}</p>
              <p className="text-white/80 text-sm">Total urgentes</p>
            </div>
            <div className="bg-white/20 rounded-xl p-4 backdrop-blur-sm">
              <p className="text-3xl font-bold text-red-200">
                {reclamations.filter(r => getUrgencyLevel(r.createdAt).level === 'critical').length}
              </p>
              <p className="text-white/80 text-sm">Critiques (+7j)</p>
            </div>
            <div className="bg-white/20 rounded-xl p-4 backdrop-blur-sm">
              <p className="text-3xl font-bold text-yellow-200">
                {reclamations.filter(r => getUrgencyLevel(r.createdAt).level === 'high').length}
              </p>
              <p className="text-white/80 text-sm">Priorité élevée</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex items-center gap-2 flex-1">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={communeFilter}
                onChange={(e) => {
                  setCommuneFilter(e.target.value);
                  setPage(1);
                }}
                className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-red-500"
              >
                <option value="">Toutes les communes</option>
                {communes.map((c) => (
                  <option key={c.id} value={c.id.toString()}>{c.nom}</option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-gray-500" />
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-red-500"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
          </div>
        ) : reclamations.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl">
            <AlertTriangle className="w-16 h-16 text-green-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900">Aucune réclamation urgente</h3>
            <p className="text-gray-500">Toutes les réclamations ont été traitées 🎉</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reclamations.map((reclamation, index) => {
              const urgency = getUrgencyLevel(reclamation.createdAt);
              
              return (
                <motion.div
                  key={reclamation.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="flex">
                    {/* Urgency indicator */}
                    <div className={`w-2 ${urgency.color}`} />
                    
                    <div className="flex-1 p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          {/* Header */}
                          <div className="flex items-center gap-3 mb-2">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${urgency.color} text-white`}>
                              {urgency.label}
                            </span>
                            <span className="px-2 py-0.5 bg-gray-100 rounded-full text-xs font-medium text-gray-600">
                              {reclamation.categorie}
                            </span>
                            <span className="text-xs text-gray-400">
                              #{reclamation.id}
                            </span>
                          </div>
                          
                          {/* Title */}
                          <h3 className="font-semibold text-gray-900 mb-2">
                            {reclamation.titre}
                          </h3>
                          
                          {/* Description preview */}
                          <p className="text-sm text-gray-500 line-clamp-2 mb-3">
                            {reclamation.description}
                          </p>
                          
                          {/* Meta */}
                          <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {reclamation.user.prenom} {reclamation.user.nom}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {reclamation.commune.nom}
                              {reclamation.quartierDouar && ` - ${reclamation.quartierDouar}`}
                            </span>
                            {reclamation.etablissement && (
                              <span className="flex items-center gap-1">
                                <Building2 className="w-3 h-3" />
                                {reclamation.etablissement.nom}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {getDaysAgo(reclamation.createdAt)}
                            </span>
                          </div>
                        </div>
                        
                        {/* Actions */}
                        <div className="flex flex-col items-end gap-2">
                          <Link
                            href={`/admin/reclamations/${reclamation.id}`}
                            className="flex items-center gap-1 px-4 py-2 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors text-sm"
                          >
                            <Eye className="w-4 h-4" />
                            Traiter
                            <ArrowUpRight className="w-3 h-3" />
                          </Link>
                          <span className="text-xs text-gray-400">
                            {formatDate(reclamation.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
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
                      ? 'bg-red-500 text-white'
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
