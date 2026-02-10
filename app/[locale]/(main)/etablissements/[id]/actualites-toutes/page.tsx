'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Newspaper,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  Calendar,
  Eye,
  Tag,
  ExternalLink,
} from 'lucide-react';

interface Actualite {
  id: number;
  titre: string;
  contenu: string;
  resume: string | null;
  imagePrincipale: string | null;
  categorie: string | null;
  vues: number;
  isPubliee: boolean;
  datePublication: string | null;
  createdAt: string;
}

interface Etablissement {
  id: number;
  nom: string;
  secteur: string;
}

const CATEGORIES: Record<string, { label: string; color: string }> = {
  ANNONCE: { label: 'Annonce', color: 'bg-blue-100 text-blue-700' },
  EVENEMENT: { label: 'Événement', color: 'bg-purple-100 text-purple-700' },
  COMMUNIQUE: { label: 'Communiqué', color: 'bg-green-100 text-green-700' },
  PROJET: { label: 'Projet', color: 'bg-orange-100 text-orange-700' },
  AUTRE: { label: 'Autre', color: 'bg-gray-100 text-gray-700' },
};

export default function ToutesActualitesPage() {
  const params = useParams();
  const etablissementId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [actualites, setActualites] = useState<Actualite[]>([]);
  const [etablissement, setEtablissement] = useState<Etablissement | null>(null);
  
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [categorieFilter, setCategorieFilter] = useState('');
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

      // Fetch actualités
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', limit.toString());
      params.set('etablissementId', etablissementId);
      params.set('isPubliee', 'true');
      if (categorieFilter) params.set('categorie', categorieFilter);

      const res = await fetch(`/api/actualites?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setActualites(data.data || data.actualites || []);
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
  }, [page, categorieFilter, etablissementId]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
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
                <Newspaper className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Toutes les actualités</h1>
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
            {total} actualité{total > 1 ? 's' : ''}
          </p>
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-gray-500" />
            <select
              value={categorieFilter}
              onChange={(e) => {
                setCategorieFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-[hsl(213,80%,28%)]"
            >
              <option value="">Toutes les catégories</option>
              {Object.entries(CATEGORIES).map(([key, { label }]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-[hsl(213,80%,28%)] animate-spin" />
          </div>
        ) : actualites.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl">
            <Newspaper className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900">Aucune actualité</h3>
            <p className="text-gray-500">
              {categorieFilter ? 'Aucune actualité dans cette catégorie' : 'Pas encore d\'actualités pour cet établissement'}
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {actualites.map((actu, index) => {
              const catInfo = actu.categorie ? CATEGORIES[actu.categorie] || CATEGORIES.AUTRE : null;
              
              return (
                <motion.article
                  key={actu.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow group"
                >
                  {/* Image */}
                  <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 relative overflow-hidden">
                    {actu.imagePrincipale ? (
                      <img
                        src={actu.imagePrincipale}
                        alt={actu.titre}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Newspaper className="w-16 h-16 text-gray-300" />
                      </div>
                    )}
                    {catInfo && (
                      <div className="absolute top-3 left-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${catInfo.color}`}>
                          {catInfo.label}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(actu.datePublication || actu.createdAt)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {actu.vues} vues
                      </span>
                    </div>

                    <h3 className="font-semibold text-gray-900 line-clamp-2 mb-2 group-hover:text-[hsl(213,80%,28%)] transition-colors">
                      {actu.titre}
                    </h3>

                    <p className="text-sm text-gray-500 line-clamp-3 mb-4">
                      {actu.resume || actu.contenu.substring(0, 150)}...
                    </p>

                    <Link
                      href={`/actualites/${actu.id}`}
                      className="inline-flex items-center gap-1 text-[hsl(213,80%,28%)] font-medium text-sm hover:gap-2 transition-all"
                    >
                      Lire la suite
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                  </div>
                </motion.article>
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
